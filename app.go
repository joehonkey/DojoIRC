package main

import (
	"context"
	"log"

	"github.com/joehonkey/dojoire/internal/config"
	"github.com/joehonkey/dojoire/internal/irc"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

type App struct {
	ctx     context.Context
	cfg     *config.Config
	clients map[string]*irc.Client
}

func NewApp() *App {
	return &App{clients: make(map[string]*irc.Client)}
}

func (a *App) startup(ctx context.Context) {
	a.ctx = ctx

	cfg, err := config.Load()
	if err != nil {
		log.Printf("config error: %v", err)
		cfg, _ = config.Load()
	}
	a.cfg = cfg

	for _, srv := range cfg.Servers {
		s := srv
		client := irc.NewClient(s, func(ev irc.Event) {
			runtime.EventsEmit(ctx, "irc:event", ev)
		})
		if err := client.Connect(); err != nil {
			log.Printf("failed to connect to %s: %v", s.Name, err)
			continue
		}
		a.clients[s.Name] = client
		log.Printf("connecting to %s...", s.Name)
	}
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

// GetNick returns the nick for a given server.
func (a *App) GetNick(server string) string {
	if c, ok := a.clients[server]; ok {
		return c.Nick()
	}
	return ""
}
