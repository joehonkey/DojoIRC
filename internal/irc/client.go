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
	server  config.Server
	conn    net.Conn
	irc     *ircp.Client
	emit    func(Event)
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

	switch msg.Command {
	case "001":
		c.emit(Event{Server: c.server.Name, Type: "connected", Nick: c.server.Nick, Time: now})
		for _, ch := range c.server.Channels {
			client.Write("JOIN " + ch)
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
		c.emit(Event{Server: c.server.Name, Type: typ, Channel: target, Nick: msg.Prefix.Name, Text: text, Time: now})

	case "JOIN":
		channel := msg.Params[0]
		c.emit(Event{Server: c.server.Name, Type: "join", Channel: channel, Nick: msg.Prefix.Name, Time: now})

	case "PART":
		channel := msg.Params[0]
		reason := ""
		if len(msg.Params) > 1 {
			reason = msg.Params[1]
		}
		c.emit(Event{Server: c.server.Name, Type: "part", Channel: channel, Nick: msg.Prefix.Name, Text: reason, Time: now})

	case "QUIT":
		reason := ""
		if len(msg.Params) > 0 {
			reason = msg.Params[0]
		}
		c.emit(Event{Server: c.server.Name, Type: "quit", Nick: msg.Prefix.Name, Text: reason, Time: now})

	case "NICK":
		newNick := msg.Params[0]
		c.emit(Event{Server: c.server.Name, Type: "nick", Nick: msg.Prefix.Name, Text: newNick, Time: now})

	case "353":
		// NAMES reply — params: me, = , #channel, nick1 nick2 ...
		if len(msg.Params) < 4 {
			return
		}
		c.emit(Event{Server: c.server.Name, Type: "names", Channel: msg.Params[2], Text: msg.Params[3], Time: now})

	case "TOPIC", "332":
		channel := msg.Params[0]
		if msg.Command == "332" {
			channel = msg.Params[1]
		}
		topic := ""
		if len(msg.Params) > 1 {
			topic = msg.Params[len(msg.Params)-1]
		}
		c.emit(Event{Server: c.server.Name, Type: "topic", Channel: channel, Text: topic, Time: now})

	case "NOTICE":
		target := msg.Params[0]
		text := ""
		if len(msg.Params) > 1 {
			text = msg.Params[1]
		}
		c.emit(Event{Server: c.server.Name, Type: "notice", Channel: target, Nick: msg.Prefix.Name, Text: text, Time: now})
	}
}

func (c *Client) Send(target, text string) {
	c.irc.WriteMessage(&ircp.Message{
		Command: "PRIVMSG",
		Params:  []string{target, text},
	})
}

func (c *Client) Part(channel string) {
	c.irc.WriteMessage(&ircp.Message{
		Command: "PART",
		Params:  []string{channel},
	})
}

func (c *Client) Nick() string {
	return c.server.Nick
}
