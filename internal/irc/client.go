package irc

import (
	"crypto/tls"
	"fmt"
	"log"
	"net"
	"strings"
	"time"

	ircp "gopkg.in/irc.v3"

	"github.com/joehonkey/dojoire/internal/config"
)

type Event struct {
	Server  string `json:"server"`
	Type    string `json:"type"`
	Channel string `json:"channel"`
	Nick    string `json:"nick"`
	Text    string `json:"text"`
	Time    string `json:"time"`
}

type Client struct {
	server config.Server
	conn   net.Conn
	irc    *ircp.Client
	emit   func(Event)
}

func NewClient(server config.Server, emit func(Event)) *Client {
	return &Client{server: server, emit: emit}
}

func (c *Client) Connect() error {
	addr := fmt.Sprintf("%s:%d", c.server.Host, c.server.Port)

	var err error
	if c.server.TLS {
		c.conn, err = tls.Dial("tcp", addr, &tls.Config{ServerName: c.server.Host})
	} else {
		c.conn, err = net.Dial("tcp", addr)
	}
	if err != nil {
		return fmt.Errorf("dial: %w", err)
	}

	// Kick off CAP negotiation before the library sends NICK/USER.
	// Ergo will hold 001 until we send CAP END.
	fmt.Fprintf(c.conn, "CAP LS 302\r\n")

	cfg := ircp.ClientConfig{
		Nick:    c.server.Nick,
		User:    c.server.Nick,
		Name:    c.server.Nick,
		Handler: ircp.HandlerFunc(c.handle),
	}

	c.irc = ircp.NewClient(c.conn, cfg)

	go func() {
		if err := c.irc.Run(); err != nil {
			log.Printf("[%s] disconnected: %v", c.server.Name, err)
			c.emit(Event{Server: c.server.Name, Type: "disconnected"})
		}
	}()

	return nil
}

func (c *Client) handle(client *ircp.Client, msg *ircp.Message) {
	now := time.Now().Format("15:04")
	srv := c.server.Name

	switch msg.Command {

	case "CAP":
		if len(msg.Params) < 2 {
			return
		}
		switch msg.Params[1] {
		case "LS":
			client.Write("CAP REQ :message-tags")
		case "ACK":
			client.Write("CAP END")
		}

	case "TAGMSG":
		if len(msg.Params) < 1 {
			return
		}
		target := msg.Params[0]
		if !strings.HasPrefix(target, "#") && !strings.HasPrefix(target, "&") {
			target = msg.Prefix.Name
		}
		typingVal, ok := msg.Tags["+typing"]
		if !ok {
			return
		}
		c.emit(Event{Server: srv, Type: "typing", Channel: target, Nick: msg.Prefix.Name, Text: string(typingVal), Time: now})

	case "001":
		c.emit(Event{Server: srv, Type: "connected", Nick: c.server.Nick, Time: now})
		for _, ch := range c.server.Channels {
			client.Write("JOIN " + ch)
		}

	case "002", "003", "004":
		text := ""
		if len(msg.Params) > 0 {
			text = msg.Params[len(msg.Params)-1]
		}
		c.emit(Event{Server: srv, Type: "server", Channel: "server", Text: text, Time: now})

	// MOTD
	case "372":
		if len(msg.Params) > 1 {
			c.emit(Event{Server: srv, Type: "server", Channel: "server", Text: msg.Params[len(msg.Params)-1], Time: now})
		}
	case "375", "376":
		text := ""
		if len(msg.Params) > 1 {
			text = msg.Params[len(msg.Params)-1]
		}
		c.emit(Event{Server: srv, Type: "server", Channel: "server", Text: text, Time: now})

	// Server stats
	case "251", "252", "253", "254", "255", "265", "266":
		if len(msg.Params) > 1 {
			c.emit(Event{Server: srv, Type: "server", Channel: "server", Text: msg.Params[len(msg.Params)-1], Time: now})
		}

	case "PRIVMSG":
		if len(msg.Params) < 2 {
			return
		}
		target := msg.Params[0]
		text := msg.Params[1]
		typ := "message"
		if strings.HasPrefix(text, "\x01ACTION ") && strings.HasSuffix(text, "\x01") {
			text = strings.TrimSuffix(strings.TrimPrefix(text, "\x01ACTION "), "\x01")
			typ = "action"
		}
		// DMs arrive with our nick as target — use sender as channel
		if !strings.HasPrefix(target, "#") && !strings.HasPrefix(target, "&") {
			target = msg.Prefix.Name
		}
		c.emit(Event{Server: srv, Type: typ, Channel: target, Nick: msg.Prefix.Name, Text: text, Time: now})

	case "JOIN":
		channel := msg.Params[0]
		c.emit(Event{Server: srv, Type: "join", Channel: channel, Nick: msg.Prefix.Name, Time: now})

	case "PART":
		channel := msg.Params[0]
		reason := ""
		if len(msg.Params) > 1 {
			reason = msg.Params[1]
		}
		c.emit(Event{Server: srv, Type: "part", Channel: channel, Nick: msg.Prefix.Name, Text: reason, Time: now})

	case "QUIT":
		reason := ""
		if len(msg.Params) > 0 {
			reason = msg.Params[0]
		}
		c.emit(Event{Server: srv, Type: "quit", Nick: msg.Prefix.Name, Text: reason, Time: now})

	case "KICK":
		if len(msg.Params) < 2 {
			return
		}
		reason := ""
		if len(msg.Params) > 2 {
			reason = msg.Params[2]
		}
		c.emit(Event{Server: srv, Type: "kick", Channel: msg.Params[0], Nick: msg.Params[1], Text: reason, Time: now})

	case "NICK":
		newNick := msg.Params[0]
		c.emit(Event{Server: srv, Type: "nick", Nick: msg.Prefix.Name, Text: newNick, Time: now})

	case "MODE":
		target := msg.Params[0]
		mode := strings.Join(msg.Params[1:], " ")
		c.emit(Event{Server: srv, Type: "mode", Channel: target, Nick: msg.Prefix.Name, Text: mode, Time: now})

	case "TOPIC", "332":
		channel := msg.Params[0]
		if msg.Command == "332" {
			channel = msg.Params[1]
		}
		topic := ""
		if len(msg.Params) > 1 {
			topic = msg.Params[len(msg.Params)-1]
		}
		c.emit(Event{Server: srv, Type: "topic", Channel: channel, Text: topic, Time: now})

	case "NOTICE":
		target := msg.Params[0]
		text := ""
		if len(msg.Params) > 1 {
			text = msg.Params[1]
		}
		ch := target
		if !strings.HasPrefix(target, "#") && !strings.HasPrefix(target, "&") {
			ch = "server"
		}
		c.emit(Event{Server: srv, Type: "notice", Channel: ch, Nick: msg.Prefix.Name, Text: text, Time: now})

	case "353":
		if len(msg.Params) < 4 {
			return
		}
		c.emit(Event{Server: srv, Type: "names", Channel: msg.Params[2], Text: msg.Params[3], Time: now})

	// WHOIS replies
	case "311":
		if len(msg.Params) >= 4 {
			text := fmt.Sprintf("%s (%s@%s): %s", msg.Params[1], msg.Params[2], msg.Params[3], msg.Params[len(msg.Params)-1])
			c.emit(Event{Server: srv, Type: "whois", Channel: "server", Text: text, Time: now})
		}
	case "312":
		if len(msg.Params) >= 3 {
			c.emit(Event{Server: srv, Type: "whois", Channel: "server", Text: fmt.Sprintf("%s on %s", msg.Params[1], msg.Params[2]), Time: now})
		}
	case "313":
		if len(msg.Params) >= 2 {
			c.emit(Event{Server: srv, Type: "whois", Channel: "server", Text: fmt.Sprintf("%s is an IRC operator", msg.Params[1]), Time: now})
		}
	case "317":
		if len(msg.Params) >= 3 {
			c.emit(Event{Server: srv, Type: "whois", Channel: "server", Text: fmt.Sprintf("%s idle %ss", msg.Params[1], msg.Params[2]), Time: now})
		}
	case "318":
		if len(msg.Params) >= 2 {
			c.emit(Event{Server: srv, Type: "whois", Channel: "server", Text: fmt.Sprintf("End of WHOIS for %s", msg.Params[1]), Time: now})
		}
	case "319":
		if len(msg.Params) >= 3 {
			c.emit(Event{Server: srv, Type: "whois", Channel: "server", Text: fmt.Sprintf("%s is on: %s", msg.Params[1], msg.Params[2]), Time: now})
		}
	}
}

// ── Commands ──────────────────────────────────────────────────

func (c *Client) SendTyping(target, status string) {
	c.irc.WriteMessage(&ircp.Message{
		Tags:    ircp.Tags{"+typing": ircp.TagValue(status)},
		Command: "TAGMSG",
		Params:  []string{target},
	})
}

func (c *Client) Send(target, text string) {
	c.irc.WriteMessage(&ircp.Message{
		Command: "PRIVMSG",
		Params:  []string{target, text},
	})
}

func (c *Client) SendAction(target, text string) {
	c.Send(target, "\x01ACTION "+text+"\x01")
}

func (c *Client) Part(channel string) {
	c.irc.WriteMessage(&ircp.Message{Command: "PART", Params: []string{channel}})
}

func (c *Client) Join(channel string) {
	c.irc.Write("JOIN " + channel)
}

func (c *Client) NickChange(nick string) {
	c.irc.WriteMessage(&ircp.Message{Command: "NICK", Params: []string{nick}})
}

func (c *Client) Whois(nick string) {
	c.irc.WriteMessage(&ircp.Message{Command: "WHOIS", Params: []string{nick}})
}

func (c *Client) Raw(line string) {
	c.irc.Write(line)
}

func (c *Client) Quit(reason string) {
	if reason == "" {
		reason = "DojoIRC"
	}
	if c.conn == nil {
		return
	}
	// Write directly to the raw connection — bypasses any library buffering
	// that may already be closed during shutdown.
	fmt.Fprintf(c.conn, "QUIT :%s\r\n", reason)
	c.conn.Close()
}

func (c *Client) Nick() string {
	return c.server.Nick
}
