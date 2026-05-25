package irc

import (
	"crypto/tls"
	"encoding/base64"
	"fmt"
	"log"
	"net"
	"strconv"
	"strings"
	"time"

	ircp "gopkg.in/irc.v3"

	"github.com/joehonkey/dojoirc/internal/config"
	"github.com/joehonkey/dojoirc/internal/dcc"
)

type Event struct {
	Server  string `json:"server"`
	Type    string `json:"type"`
	Channel string `json:"channel"`
	Nick    string `json:"nick"`
	Text    string `json:"text"`
	Time    string `json:"time"`
	DCCFile string `json:"dcc_file,omitempty"`
	DCCIP   string `json:"dcc_ip,omitempty"`
	DCCPort int    `json:"dcc_port,omitempty"`
	DCCSize int64  `json:"dcc_size,omitempty"`
}

type Client struct {
	server      config.Server
	conn        net.Conn
	irc         *ircp.Client
	emit        func(Event)
	quitCh      chan struct{}
	currentNick string
	capAccum    string // accumulates CAP LS multiline lines
	ignoreSet   map[string]struct{}
}

func NewClient(server config.Server, emit func(Event)) *Client {
	ig := make(map[string]struct{}, len(server.Ignore))
	for _, n := range server.Ignore {
		ig[strings.ToLower(n)] = struct{}{}
	}
	return &Client{server: server, emit: emit, quitCh: make(chan struct{}), ignoreSet: ig}
}

func (c *Client) isIgnored(nick string) bool {
	_, ok := c.ignoreSet[strings.ToLower(nick)]
	return ok
}

func (c *Client) dial() error {
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
	c.capAccum = ""
	// Kick off CAP negotiation before the library sends NICK/USER.
	fmt.Fprintf(c.conn, "CAP LS 302\r\n")
	if c.server.Password != "" {
		fmt.Fprintf(c.conn, "PASS %s\r\n", c.server.Password)
	}
	c.irc = ircp.NewClient(c.conn, ircp.ClientConfig{
		Nick:    c.server.Nick,
		User:    c.server.Nick,
		Name:    c.server.Nick,
		Handler: ircp.HandlerFunc(c.handle),
	})
	return nil
}

func (c *Client) Connect() error {
	if err := c.dial(); err != nil {
		return err
	}
	go c.runLoop()
	return nil
}

func (c *Client) runLoop() {
	for {
		err := c.irc.Run()

		// Check if we quit intentionally before doing anything else.
		select {
		case <-c.quitCh:
			return
		default:
		}

		if err != nil {
			log.Printf("[%s] disconnected: %v", c.server.Name, err)
		}
		c.emit(Event{Server: c.server.Name, Type: "disconnected"})

		// Reconnect loop — retry every 10s until success or quit.
		for {
			c.emit(Event{Server: c.server.Name, Type: "server", Channel: "server",
				Text: "Reconnecting in 10s..."})
			select {
			case <-c.quitCh:
				return
			case <-time.After(10 * time.Second):
			}

			if err := c.dial(); err != nil {
				log.Printf("[%s] reconnect failed: %v", c.server.Name, err)
				continue
			}
			log.Printf("[%s] reconnected", c.server.Name)
			c.emit(Event{Server: c.server.Name, Type: "server", Channel: "server",
				Text: "Reconnected."})
			break
		}
	}
}

func (c *Client) handle(client *ircp.Client, msg *ircp.Message) {
	now := time.Now().Format("15:04")
	if t, ok := msg.Tags["time"]; ok && string(t) != "" {
		if parsed, err := time.Parse(time.RFC3339Nano, string(t)); err == nil {
			now = parsed.Local().Format("15:04")
		}
	}
	srv := c.server.Name

	switch msg.Command {

	case "CAP":
		if len(msg.Params) < 2 {
			return
		}
		switch msg.Params[1] {
		case "LS":
			// Accumulate multiline 302 responses (params: [nick, "LS", "*", caps])
			if len(msg.Params) >= 4 && msg.Params[2] == "*" {
				c.capAccum += " " + msg.Params[3]
				return // more lines coming
			}
			caps := c.capAccum
			if len(msg.Params) >= 3 {
				caps += " " + msg.Params[2]
			}
			c.capAccum = ""

			// Only request caps the server actually advertises.
			want := []string{}
			for _, cap := range []string{"message-tags", "server-time", "away-notify"} {
				if strings.Contains(caps, cap) {
					want = append(want, cap)
				}
			}
			if c.server.SASL != nil && strings.EqualFold(c.server.SASL.Mechanism, "PLAIN") &&
				strings.Contains(caps, "sasl") {
				want = append(want, "sasl")
			}
			if len(want) > 0 {
				client.Write("CAP REQ :" + strings.Join(want, " "))
			} else {
				client.Write("CAP END")
			}
		case "ACK":
			acked := ""
			if len(msg.Params) >= 3 {
				acked = msg.Params[2]
			}
			if strings.Contains(acked, "sasl") && c.server.SASL != nil {
				client.Write("AUTHENTICATE PLAIN")
				// CAP END sent after 903/904 — not here
			} else {
				client.Write("CAP END")
			}
		case "NAK":
			// Server refused our CAP REQ batch; proceed without those caps.
			client.Write("CAP END")
		}

	case "AUTHENTICATE":
		if len(msg.Params) < 1 || msg.Params[0] != "+" {
			return
		}
		sasl := c.server.SASL
		if sasl == nil {
			client.Write("CAP END")
			return
		}
		payload := base64.StdEncoding.EncodeToString(
			[]byte("\x00" + sasl.Username + "\x00" + sasl.Password),
		)
		client.Write("AUTHENTICATE " + payload)

	case "903": // SASL success
		text := "SASL authentication successful"
		if len(msg.Params) > 1 {
			text = msg.Params[len(msg.Params)-1]
		}
		c.emit(Event{Server: srv, Type: "server", Channel: "server", Text: text, Time: now})
		client.Write("CAP END")

	case "904", "905": // SASL failure
		text := "SASL authentication failed"
		if len(msg.Params) > 1 {
			text = msg.Params[len(msg.Params)-1]
		}
		c.emit(Event{Server: srv, Type: "server", Channel: "server", Text: text, Time: now})
		client.Write("CAP END")

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
		c.currentNick = c.server.Nick
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
	case "375":
		text := ""
		if len(msg.Params) > 1 {
			text = msg.Params[len(msg.Params)-1]
		}
		c.emit(Event{Server: srv, Type: "server", Channel: "server", Text: text, Time: now})

	case "376", "422": // end of MOTD / no MOTD
		text := ""
		if len(msg.Params) > 1 {
			text = msg.Params[len(msg.Params)-1]
		}
		if text != "" {
			c.emit(Event{Server: srv, Type: "server", Channel: "server", Text: text, Time: now})
		}
		if c.server.NickServPass != "" {
			c.emit(Event{Server: srv, Type: "server", Channel: "server", Text: "Identifying with NickServ...", Time: now})
			client.Write("PRIVMSG NickServ :IDENTIFY " + c.server.NickServPass)
		}

	// Server stats
	case "251", "252", "253", "254", "255", "265", "266":
		if len(msg.Params) > 1 {
			c.emit(Event{Server: srv, Type: "server", Channel: "server", Text: msg.Params[len(msg.Params)-1], Time: now})
		}

	case "PRIVMSG":
		if len(msg.Params) < 2 || c.isIgnored(msg.Prefix.Name) {
			return
		}
		target := msg.Params[0]
		text := msg.Params[1]
		typ := "message"
		if strings.HasPrefix(text, "\x01ACTION ") && strings.HasSuffix(text, "\x01") {
			text = strings.TrimSuffix(strings.TrimPrefix(text, "\x01ACTION "), "\x01")
			typ = "action"
		} else if strings.HasPrefix(text, "\x01") && strings.HasSuffix(text, "\x01") {
			c.handleCTCPRequest(client, msg.Prefix.Name, strings.TrimSuffix(strings.TrimPrefix(text, "\x01"), "\x01"), now, srv)
			return
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
		if msg.Prefix.Name == c.currentNick {
			c.currentNick = newNick
		}
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
		if c.isIgnored(msg.Prefix.Name) {
			return
		}
		target := msg.Params[0]
		text := ""
		if len(msg.Params) > 1 {
			text = msg.Params[1]
		}
		// CTCP reply (e.g. VERSION or PING response)
		if strings.HasPrefix(text, "\x01") && strings.HasSuffix(text, "\x01") {
			reply := strings.TrimSuffix(strings.TrimPrefix(text, "\x01"), "\x01")
			c.emit(Event{Server: srv, Type: "ctcp_reply", Channel: "server", Nick: msg.Prefix.Name, Text: reply, Time: now})
			return
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

	case "366": // RPL_ENDOFNAMES — request channel modes and WHO for bot detection
		if len(msg.Params) >= 2 {
			client.Write("MODE " + msg.Params[1])
			client.Write("WHO " + msg.Params[1])
		}

	case "352": // RPL_WHOREPLY — detect +B bot flag from status field
		// format: me #channel user host server nick status :hopcount realname
		if len(msg.Params) >= 7 {
			nick := msg.Params[5]
			status := msg.Params[6]
			if strings.Contains(status, "B") {
				c.emit(Event{Server: srv, Type: "mode", Channel: nick, Text: "+B", Time: now})
			}
		}

	case "324": // RPL_CHANNELMODEIS
		if len(msg.Params) >= 3 {
			channel := msg.Params[1]
			modes := strings.Join(msg.Params[2:], " ")
			c.emit(Event{Server: srv, Type: "mode", Channel: channel, Text: modes, Time: now})
		}

	case "305": // RPL_UNAWAY
		text := "You are no longer marked as away"
		if len(msg.Params) > 1 {
			text = msg.Params[len(msg.Params)-1]
		}
		c.emit(Event{Server: srv, Type: "away_off", Channel: "server", Text: text, Time: now})

	case "306": // RPL_NOWAWAY
		text := "You have been marked as away"
		if len(msg.Params) > 1 {
			text = msg.Params[len(msg.Params)-1]
		}
		c.emit(Event{Server: srv, Type: "away_on", Channel: "server", Text: text, Time: now})

	case "AWAY": // away-notify: another user's away status changed
		nick := msg.Prefix.Name
		if nick == "" || c.isIgnored(nick) {
			return
		}
		reason := ""
		if len(msg.Params) > 0 {
			reason = msg.Params[0]
		}
		c.emit(Event{Server: srv, Type: "away", Nick: nick, Text: reason, Time: now})

	case "321": // RPL_LISTSTART — ignore, just signals start of list
	case "322": // RPL_LIST — channel list entry
		if len(msg.Params) < 3 {
			return
		}
		channel := msg.Params[1]
		users := msg.Params[2]
		topic := ""
		if len(msg.Params) > 3 {
			topic = msg.Params[3]
		}
		c.emit(Event{Server: srv, Type: "list_entry", Channel: channel, Nick: users, Text: topic, Time: now})

	case "323": // RPL_LISTEND
		c.emit(Event{Server: srv, Type: "list_end", Channel: "server", Time: now})
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
	// Signal runLoop to stop reconnecting before closing the connection.
	select {
	case <-c.quitCh:
	default:
		close(c.quitCh)
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
	if c.currentNick != "" {
		return c.currentNick
	}
	return c.server.Nick
}

func (c *Client) handleCTCPRequest(client *ircp.Client, from, payload, now, srv string) {
	cmd := payload
	param := ""
	if i := strings.IndexByte(payload, ' '); i >= 0 {
		cmd = payload[:i]
		param = payload[i+1:]
	}
	cmd = strings.ToUpper(cmd)

	switch cmd {
	case "VERSION":
		client.WriteMessage(&ircp.Message{
			Command: "NOTICE",
			Params:  []string{from, "\x01VERSION DojoIRC v0.4.12 (https://github.com/joehonkey/DojoIRC)\x01"},
		})
		c.emit(Event{Server: srv, Type: "ctcp", Channel: "server", Nick: from, Text: "CTCP VERSION from " + from, Time: now})
	case "PING":
		if param == "" {
			param = fmt.Sprintf("%d", time.Now().Unix())
		}
		client.WriteMessage(&ircp.Message{
			Command: "NOTICE",
			Params:  []string{from, "\x01PING " + param + "\x01"},
		})
		c.emit(Event{Server: srv, Type: "ctcp", Channel: "server", Nick: from, Text: "CTCP PING from " + from, Time: now})
	case "TIME":
		t := time.Now().Format("Mon Jan 02 15:04:05 MST 2006")
		client.WriteMessage(&ircp.Message{
			Command: "NOTICE",
			Params:  []string{from, "\x01TIME " + t + "\x01"},
		})
		c.emit(Event{Server: srv, Type: "ctcp", Channel: "server", Nick: from, Text: "CTCP TIME from " + from, Time: now})
	case "FINGER":
		client.WriteMessage(&ircp.Message{
			Command: "NOTICE",
			Params:  []string{from, "\x01FINGER DojoIRC (https://github.com/joehonkey/DojoIRC)\x01"},
		})
		c.emit(Event{Server: srv, Type: "ctcp", Channel: "server", Nick: from, Text: "CTCP FINGER from " + from, Time: now})
	case "CLIENTINFO":
		client.WriteMessage(&ircp.Message{
			Command: "NOTICE",
			Params:  []string{from, "\x01CLIENTINFO VERSION PING TIME FINGER CLIENTINFO DCC CHAT\x01"},
		})
		c.emit(Event{Server: srv, Type: "ctcp", Channel: "server", Nick: from, Text: "CTCP CLIENTINFO from " + from, Time: now})
	case "DCC":
		if strings.HasPrefix(param, "SEND ") {
			file, ip, port, size, err := dcc.ParseSend(strings.TrimPrefix(param, "SEND "))
			if err != nil {
				log.Printf("dcc parse: %v", err)
				return
			}
			c.emit(Event{
				Server:  srv,
				Type:    "dcc_offer",
				Channel: from,
				Nick:    from,
				DCCFile: file,
				DCCIP:   ip,
				DCCPort: port,
				DCCSize: size,
				Time:    now,
			})
		} else if strings.HasPrefix(param, "CHAT ") {
			parts := strings.Fields(param) // ["CHAT", "chat", ipuint32, port]
			if len(parts) >= 4 {
				ipInt, e := strconv.ParseUint(parts[2], 10, 32)
				if e != nil {
					return
				}
				port, e := strconv.Atoi(parts[3])
				if e != nil {
					return
				}
				c.emit(Event{
					Server:  srv,
					Type:    "dcc_chat_offer",
					Channel: from,
					Nick:    from,
					DCCIP:   dcc.IPFromUint32(uint32(ipInt)),
					DCCPort: port,
					Time:    now,
				})
			}
		}
	}
}

func (c *Client) SendCTCP(target, cmd, param string) {
	text := "\x01" + strings.ToUpper(cmd)
	if param != "" {
		text += " " + param
	}
	text += "\x01"
	c.irc.WriteMessage(&ircp.Message{
		Command: "PRIVMSG",
		Params:  []string{target, text},
	})
}
