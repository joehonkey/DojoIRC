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

const (
	dialTimeout      = 30 * time.Second
	acceptTimeout    = 2 * time.Minute
	transferDeadline = 2 * time.Hour
)

// ParseSend parses a "SEND filename ipuint32 port size" DCC param string.
// Handles quoted filenames containing spaces.
func ParseSend(param string) (file, ip string, port int, size int64, err error) {
	var rest string
	if strings.HasPrefix(param, `"`) {
		end := strings.Index(param[1:], `"`)
		if end < 0 {
			err = fmt.Errorf("dcc: unterminated quoted filename: %q", param)
			return
		}
		file = param[1 : end+1]
		rest = strings.TrimSpace(param[end+2:])
	} else {
		idx := strings.IndexAny(param, " \t")
		if idx < 0 {
			err = fmt.Errorf("dcc: malformed SEND: %q", param)
			return
		}
		file = param[:idx]
		rest = strings.TrimSpace(param[idx+1:])
	}

	if file == "" {
		err = fmt.Errorf("dcc: empty filename")
		return
	}

	parts := strings.Fields(rest)
	if len(parts) < 3 {
		err = fmt.Errorf("dcc: malformed SEND (missing fields): %q", param)
		return
	}

	ipInt, e := strconv.ParseUint(parts[0], 10, 32)
	if e != nil {
		err = fmt.Errorf("dcc: bad ip %q: %w", parts[0], e)
		return
	}
	ip = IPFromUint32(uint32(ipInt))

	port, e = strconv.Atoi(parts[1])
	if e != nil {
		err = fmt.Errorf("dcc: bad port %q: %w", parts[1], e)
		return
	}
	if port < 1 || port > 65535 {
		err = fmt.Errorf("dcc: port out of range: %d", port)
		return
	}

	size, e = strconv.ParseInt(parts[2], 10, 64)
	if e != nil {
		err = fmt.Errorf("dcc: bad size %q: %w", parts[2], e)
		return
	}
	if size <= 0 {
		err = fmt.Errorf("dcc: invalid size: %d", size)
		return
	}

	return
}

// safeDest returns a path in dir for filename that does not overwrite an existing file.
// If dir/filename exists it appends " (1)", " (2)", etc. up to 999.
func safeDest(dir, filename string) string {
	base := filepath.Base(filename)
	dest := filepath.Join(dir, base)
	if _, err := os.Stat(dest); os.IsNotExist(err) {
		return dest
	}
	ext := filepath.Ext(base)
	stem := base[:len(base)-len(ext)]
	for i := 1; i < 1000; i++ {
		candidate := filepath.Join(dir, fmt.Sprintf("%s (%d)%s", stem, i, ext))
		if _, err := os.Stat(candidate); os.IsNotExist(err) {
			return candidate
		}
	}
	return dest
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
	conn, err := net.DialTimeout("tcp", fmt.Sprintf("%s:%d", ip, port), dialTimeout)
	if err != nil {
		return "", fmt.Errorf("dcc receive: connect: %w", err)
	}
	defer conn.Close()
	conn.SetDeadline(time.Now().Add(transferDeadline))

	destPath := safeDest(dir, filename)
	f, err := os.Create(destPath)
	if err != nil {
		return "", fmt.Errorf("dcc receive: create file: %w", err)
	}
	defer f.Close()

	buf := make([]byte, 32*1024)
	ack := make([]byte, 4)
	var received int64
	for received < size {
		toRead := int64(len(buf))
		if size-received < toRead {
			toRead = size - received
		}
		n, rerr := conn.Read(buf[:toRead])
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
	if received < size {
		return destPath, fmt.Errorf("dcc receive: incomplete: got %d of %d bytes", received, size)
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
	if tl, ok := s.ln.(*net.TCPListener); ok {
		tl.SetDeadline(time.Now().Add(acceptTimeout))
	}
	conn, err := s.ln.Accept()
	if err != nil {
		return fmt.Errorf("dcc send: accept: %w", err)
	}
	defer conn.Close()
	conn.SetDeadline(time.Now().Add(transferDeadline))

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
			if _, ackerr := conn.Read(ack); ackerr != nil && ackerr != io.EOF {
				return fmt.Errorf("dcc send: ack: %w", ackerr)
			}
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
