package dcc

import (
	"encoding/binary"
	"fmt"
	"io"
	"net"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"
)

// ParseSend parses a "SEND filename ipuint32 port size" DCC param string.
// Returns the filename, dotted IPv4, TCP port, and file size.
func ParseSend(param string) (file, ip string, port int, size int64, err error) {
	parts := strings.Fields(param)
	if len(parts) < 4 {
		err = fmt.Errorf("dcc: malformed SEND: %q", param)
		return
	}
	file = parts[0]
	if len(file) >= 2 && file[0] == '"' && file[len(file)-1] == '"' {
		file = file[1 : len(file)-1]
	}
	ipInt, e := strconv.ParseUint(parts[1], 10, 32)
	if e != nil {
		err = fmt.Errorf("dcc: bad ip %q: %w", parts[1], e)
		return
	}
	ip = IPFromUint32(uint32(ipInt))
	port, e = strconv.Atoi(parts[2])
	if e != nil {
		err = fmt.Errorf("dcc: bad port %q: %w", parts[2], e)
		return
	}
	size, e = strconv.ParseInt(parts[3], 10, 64)
	if e != nil {
		err = fmt.Errorf("dcc: bad size %q: %w", parts[3], e)
		return
	}
	return
}

// IPFromUint32 converts a DCC 32-bit integer IP to dotted notation.
func IPFromUint32(n uint32) string {
	b := make([]byte, 4)
	binary.BigEndian.PutUint32(b, n)
	return fmt.Sprintf("%d.%d.%d.%d", b[0], b[1], b[2], b[3])
}

// IPToUint32 converts a dotted IPv4 address to a DCC 32-bit integer.
func IPToUint32(dotted string) (uint32, error) {
	ip := net.ParseIP(dotted).To4()
	if ip == nil {
		return 0, fmt.Errorf("dcc: invalid IPv4 %q", dotted)
	}
	return binary.BigEndian.Uint32(ip), nil
}

// DownloadsDir returns the user's ~/Downloads directory, creating it if needed.
func DownloadsDir() string {
	home, err := os.UserHomeDir()
	if err != nil {
		return os.TempDir()
	}
	dir := filepath.Join(home, "Downloads")
	os.MkdirAll(dir, 0o755)
	return dir
}

// LocalIP returns the machine's outbound IPv4 by probing a UDP dial (no traffic sent).
func LocalIP() (string, error) {
	conn, err := net.Dial("udp", "8.8.8.8:53")
	if err != nil {
		return "", err
	}
	defer conn.Close()
	addr := conn.LocalAddr().(*net.UDPAddr)
	return addr.IP.String(), nil
}

// PublicIP fetches the machine's public IPv4 from api.ipify.org.
// Falls back to LocalIP if the request fails or times out.
func PublicIP() string {
	client := &http.Client{Timeout: 5 * time.Second}
	resp, err := client.Get("https://api.ipify.org")
	if err == nil {
		defer resp.Body.Close()
		body, err := io.ReadAll(resp.Body)
		if err == nil {
			ip := strings.TrimSpace(string(body))
			if net.ParseIP(ip) != nil {
				return ip
			}
		}
	}
	// fall back to LAN IP
	local, err := LocalIP()
	if err != nil {
		return "0.0.0.0"
	}
	return local
}

// Receive downloads a file from the DCC sender at ip:port and saves it to dir.
// progress(received, total) is called after each chunk.
// Returns the path of the saved file.
func Receive(ip string, port int, filename string, size int64, dir string, progress func(int64, int64)) (string, error) {
	conn, err := net.Dial("tcp", fmt.Sprintf("%s:%d", ip, port))
	if err != nil {
		return "", fmt.Errorf("dcc receive: connect: %w", err)
	}
	defer conn.Close()

	destPath := filepath.Join(dir, filepath.Base(filename))
	f, err := os.Create(destPath)
	if err != nil {
		return "", fmt.Errorf("dcc receive: create file: %w", err)
	}
	defer f.Close()

	buf := make([]byte, 32*1024)
	ack := make([]byte, 4)
	var received int64
	for {
		n, rerr := conn.Read(buf)
		if n > 0 {
			if _, werr := f.Write(buf[:n]); werr != nil {
				return "", fmt.Errorf("dcc receive: write: %w", werr)
			}
			received += int64(n)
			binary.BigEndian.PutUint32(ack, uint32(received))
			conn.Write(ack) //nolint:errcheck
			if progress != nil {
				progress(received, size)
			}
		}
		if rerr == io.EOF {
			break
		}
		if rerr != nil {
			return "", fmt.Errorf("dcc receive: read: %w", rerr)
		}
	}
	return destPath, nil
}

// Sender manages an outgoing DCC SEND.
type Sender struct {
	FilePath string
	Port     int
	ln       net.Listener
}

// NewSender opens a TCP listener on a random port for an outgoing DCC SEND.
func NewSender(filePath string) (*Sender, error) {
	ln, err := net.Listen("tcp", ":0")
	if err != nil {
		return nil, fmt.Errorf("dcc send: listen: %w", err)
	}
	port := ln.Addr().(*net.TCPAddr).Port
	return &Sender{FilePath: filePath, Port: port, ln: ln}, nil
}

// CTCPParam builds the DCC SEND CTCP parameter string for the given local IP.
func (s *Sender) CTCPParam(localIP string) (string, error) {
	fi, err := os.Stat(s.FilePath)
	if err != nil {
		return "", err
	}
	ipInt, err := IPToUint32(localIP)
	if err != nil {
		return "", err
	}
	name := filepath.Base(s.FilePath)
	if strings.ContainsAny(name, " \t") {
		name = `"` + name + `"`
	}
	return fmt.Sprintf("%s %d %d %d", name, ipInt, s.Port, fi.Size()), nil
}

// Stream accepts one inbound connection and sends the file. Blocks until done or error.
func (s *Sender) Stream(progress func(int64, int64)) error {
	defer s.ln.Close()
	conn, err := s.ln.Accept()
	if err != nil {
		return fmt.Errorf("dcc send: accept: %w", err)
	}
	defer conn.Close()

	f, err := os.Open(s.FilePath)
	if err != nil {
		return fmt.Errorf("dcc send: open: %w", err)
	}
	defer f.Close()

	fi, _ := f.Stat()
	total := fi.Size()

	buf := make([]byte, 32*1024)
	ack := make([]byte, 4)
	var sent int64
	for {
		n, rerr := f.Read(buf)
		if n > 0 {
			if _, werr := conn.Write(buf[:n]); werr != nil {
				return fmt.Errorf("dcc send: write: %w", werr)
			}
			sent += int64(n)
			conn.Read(ack) //nolint:errcheck
			if progress != nil {
				progress(sent, total)
			}
		}
		if rerr == io.EOF {
			break
		}
		if rerr != nil {
			return fmt.Errorf("dcc send: read file: %w", rerr)
		}
	}
	return nil
}

// Close shuts down the listener if it is still open.
func (s *Sender) Close() {
	if s.ln != nil {
		s.ln.Close()
	}
}

// ChatSender manages an outgoing DCC CHAT offer.
type ChatSender struct {
	Port int
	ln   net.Listener
}

// NewChatSender opens a TCP listener for a DCC CHAT initiation.
func NewChatSender() (*ChatSender, error) {
	ln, err := net.Listen("tcp", ":0")
	if err != nil {
		return nil, fmt.Errorf("dcc chat: listen: %w", err)
	}
	return &ChatSender{Port: ln.Addr().(*net.TCPAddr).Port, ln: ln}, nil
}

// Accept waits for the remote peer to connect, with a deadline.
func (s *ChatSender) Accept(timeout time.Duration) (net.Conn, error) {
	if tl, ok := s.ln.(*net.TCPListener); ok {
		tl.SetDeadline(time.Now().Add(timeout))
	}
	return s.ln.Accept()
}

// Close shuts down the listener.
func (s *ChatSender) Close() { s.ln.Close() }

// ChatDial connects to a remote DCC CHAT peer.
func ChatDial(ip string, port int) (net.Conn, error) {
	return net.DialTimeout("tcp", fmt.Sprintf("%s:%d", ip, port), 30*time.Second)
}
