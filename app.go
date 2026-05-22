package main

import (
	"context"
	"log"
	"strings"
	"sync"
	"time"

	"github.com/joehonkey/dojoire/internal/config"
	"github.com/joehonkey/dojoire/internal/irc"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx      context.Context
	cfg      *config.Config
	clients  map[string]*irc.Client
	mu       sync.RWMutex
	nicklist map[string]map[string][]string // server → channel → nicks
}

func NewApp() *App {
	return &App{
		clients:  make(map[string]*irc.Client),
		nicklist: make(map[string]map[string][]string),
	}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	cfg, err := config.Load()
	if err != nil {
		log.Printf("config error: %v", err)
	}
	a.cfg = cfg

	// Give the webview time to initialize before connecting so events aren't lost
	time.AfterFunc(1500*time.Millisecond, func() {
		for _, srv := range cfg.Servers {
			s := srv
			client := irc.NewClient(s, func(ev irc.Event) {
				if ev.Type == "names" {
					a.updateNicklist(ev.Server, ev.Channel, ev.Text)
				}
				runtime.EventsEmit(ctx, "irc:event", ev)
			})
			if err := client.Connect(); err != nil {
				log.Printf("failed to connect to %s: %v", s.Name, err)
				continue
			}
			a.clients[s.Name] = client
			log.Printf("connecting to %s...", s.Name)
		}
	})
}

func (a *App) updateNicklist(server, channel, text string) {
	nicks := strings.Fields(text)
	a.mu.Lock()
	if a.nicklist[server] == nil {
		a.nicklist[server] = make(map[string][]string)
	}
	existing := a.nicklist[server][channel]
	seen := make(map[string]bool, len(existing))
	for _, n := range existing {
		seen[n] = true
	}
	for _, n := range nicks {
		if !seen[n] {
			existing = append(existing, n)
			seen[n] = true
		}
	}
	a.nicklist[server][channel] = existing
	a.mu.Unlock()
}

// SendMessage is called from the frontend to send a message to a channel.
func (a *App) SendMessage(server, target, text string) {
	if c, ok := a.clients[server]; ok {
		c.Send(target, text)
	}
}

// GetServers returns the configured server and channel list for the frontend to build its sidebar.
func (a *App) GetServers() []config.Server {
	if a.cfg == nil {
		return nil
	}
	return a.cfg.Servers
}

// PartChannel sends PART to leave a channel.
func (a *App) PartChannel(server, channel string) {
	if c, ok := a.clients[server]; ok {
		c.Part(channel)
	}
}

// GetNickList returns the stored nick list for a channel.
func (a *App) GetNickList(server, channel string) []string {
	a.mu.RLock()
	defer a.mu.RUnlock()
	if a.nicklist[server] == nil {
		return nil
	}
	nicks := make([]string, len(a.nicklist[server][channel]))
	copy(nicks, a.nicklist[server][channel])
	return nicks
}

// GetNick returns the nick for a given server.
func (a *App) GetNick(server string) string {
	if c, ok := a.clients[server]; ok {
		return c.Nick()
	}
	return ""
}
