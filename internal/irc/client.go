package irc

import (
	"crypto/tls"
	"fmt"
	"log"
	"net"

	ircp "gopkg.in/irc.v3"

	"github.com/joehonkey/dojoire/internal/config"
)

type Client struct {
	server config.Server
	conn   net.Conn
	irc    *ircp.Client
}

func NewClient(server config.Server) *Client {
	return &Client{server: server}
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
		}
	}()

	return nil
}

func (c *Client) handle(client *ircp.Client, msg *ircp.Message) {
	switch msg.Command {
	case "001":
		log.Printf("[%s] registered as %s", c.server.Name, c.server.Nick)
		for _, ch := range c.server.Channels {
			client.Write("JOIN " + ch)
		}
	case "PRIVMSG":
		if len(msg.Params) < 2 {
			return
		}
		log.Printf("[%s] <%s> %s: %s", c.server.Name, msg.Prefix.Name, msg.Params[0], msg.Params[1])
	case "JOIN":
		log.Printf("[%s] %s joined %s", c.server.Name, msg.Prefix.Name, msg.Params[0])
	}
}

func (c *Client) Send(target, text string) {
	c.irc.WriteMessage(&ircp.Message{
		Command: "PRIVMSG",
		Params:  []string{target, text},
	})
}
