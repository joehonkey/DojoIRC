package main

import (
	"context"
	_ "embed"
	"fmt"
	"log"
	"os"
	"os/exec"
	"path/filepath"
	"sort"
	"strings"
	"sync"
	"time"

	"github.com/joehonkey/dojoire/internal/config"
	"github.com/joehonkey/dojoire/internal/irc"
	"github.com/joehonkey/dojoire/internal/preview"
	"github.com/joehonkey/dojoire/internal/theme"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed config.toml.example
var configExample []byte

type App struct {
	ctx          context.Context
	cfg          *config.Config
	clients      map[string]*irc.Client
	mu           sync.RWMutex
	nicklist     map[string]map[string][]string // server → channel → nicks
	previewCache sync.Map                        // url → preview.Result
	quitting     bool                            // set true when tray Quit is used
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

// JoinChannel joins a channel.
func (a *App) JoinChannel(server, channel string) {
	if c, ok := a.clients[server]; ok {
		c.Join(channel)
	}
}

// SendNick changes the nick on a server.
func (a *App) SendNick(server, nick string) {
	if c, ok := a.clients[server]; ok {
		c.NickChange(nick)
	}
}

// SendWhois sends a WHOIS request.
func (a *App) SendWhois(server, nick string) {
	if c, ok := a.clients[server]; ok {
		c.Whois(nick)
	}
}

// SendRaw sends a raw IRC line.
func (a *App) SendRaw(server, line string) {
	if c, ok := a.clients[server]; ok {
		c.Raw(line)
	}
}

// SendTyping sends a draft/typing TAGMSG for typing indicators.
func (a *App) SendTyping(server, channel, status string) {
	if c, ok := a.clients[server]; ok {
		c.SendTyping(channel, status)
	}
}

// SendAction sends a CTCP ACTION (/me).
func (a *App) SendAction(server, target, text string) {
	if c, ok := a.clients[server]; ok {
		c.SendAction(target, text)
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

// FetchURLPreview fetches og:/twitter card metadata for a URL with in-memory caching.
func (a *App) FetchURLPreview(rawURL string) preview.Result {
	if v, ok := a.previewCache.Load(rawURL); ok {
		return v.(preview.Result)
	}
	r := preview.Fetch(rawURL)
	a.previewCache.Store(rawURL, r)
	return r
}

// BrowserOpen opens a URL in the system browser.
func (a *App) BrowserOpen(url string) {
	if a.ctx != nil {
		runtime.BrowserOpenURL(a.ctx, url)
	}
}

// shutdown gracefully disconnects all IRC servers then quits the app.
func (a *App) shutdown() {
	a.mu.RLock()
	clients := make([]*irc.Client, 0, len(a.clients))
	for _, c := range a.clients {
		clients = append(clients, c)
	}
	a.mu.RUnlock()

	for _, c := range clients {
		c.Quit("")
	}
	// Give the server a moment to receive the QUIT before the socket closes
	time.Sleep(300 * time.Millisecond)
}

// UIConfig bundles everything the frontend needs to apply after a config reload.
type UIConfig struct {
	ThemeName string       `json:"theme_name"`
	Theme     theme.Colors `json:"theme"`
	Font      string       `json:"font"`
	FontSize  int          `json:"font_size"`
}

func (a *App) uiConfig() UIConfig {
	name := "default"
	font := "IBM Plex Mono"
	size := 13
	if a.cfg != nil {
		if a.cfg.Theme != "" {
			name = a.cfg.Theme
		}
		if a.cfg.Font != "" {
			font = a.cfg.Font
		}
		if a.cfg.FontSize > 0 {
			size = a.cfg.FontSize
		}
	}
	c, err := theme.Load(name)
	if err != nil {
		c, _ = theme.Load("default")
	}
	return UIConfig{ThemeName: name, Theme: c, Font: font, FontSize: size}
}

// ReloadConfig re-reads config.toml from disk and returns updated UI settings.
func (a *App) ReloadConfig() UIConfig {
	cfg, err := config.Load()
	if err != nil {
		log.Printf("reload config: %v", err)
	} else {
		a.cfg = cfg
	}
	return a.uiConfig()
}

// SaveTheme writes the chosen theme name back into config.toml so it persists.
func (a *App) SaveTheme(name string) {
	if a.cfg == nil {
		return
	}
	a.cfg.Theme = name
	path := filepath.Join(config.Dir(), "config.toml")
	data, err := os.ReadFile(path)
	if err != nil {
		return // no config file to update
	}
	newLine := fmt.Sprintf("theme = %q", name)
	lines := strings.Split(string(data), "\n")
	found := false
	inSection := false
	for i, line := range lines {
		trimmed := strings.TrimSpace(line)
		if strings.HasPrefix(trimmed, "[") {
			inSection = true
		}
		if !inSection && strings.HasPrefix(trimmed, "theme") && strings.Contains(line, "=") {
			lines[i] = newLine
			found = true
			break
		}
	}
	if !found {
		lines = append([]string{newLine}, lines...)
	}
	os.WriteFile(path, []byte(strings.Join(lines, "\n")), 0o644)
}

// GetTheme loads and returns the active theme colors.
func (a *App) GetTheme() theme.Colors {
	name := "default"
	if a.cfg != nil && a.cfg.Theme != "" {
		name = a.cfg.Theme
	}
	c, err := theme.Load(name)
	if err != nil {
		log.Printf("theme load: %v, falling back to default", err)
		c, _ = theme.Load("default")
	}
	return c
}

// OpenConfig opens config.toml in the user's default text editor.
// Creates the file from the embedded example if it doesn't exist yet.
func (a *App) OpenConfig() {
	cfgPath := filepath.Join(config.Dir(), "config.toml")

	// Bootstrap from example if missing so the user has a documented starting point.
	if _, err := os.Stat(cfgPath); os.IsNotExist(err) {
		os.MkdirAll(config.Dir(), 0o755)
		os.WriteFile(cfgPath, configExample, 0o644)
	}

	openInEditor(cfgPath)
}

// openInEditor opens a file in the best available text editor.
func openInEditor(path string) {
	// 1. Honor $VISUAL / $EDITOR if set.
	for _, env := range []string{"VISUAL", "EDITOR"} {
		if val := os.Getenv(env); val != "" {
			parts := strings.Fields(val)
			if _, err := exec.LookPath(parts[0]); err == nil {
				exec.Command(parts[0], append(parts[1:], path)...).Start()
				return
			}
		}
	}

	// 2. Well-known GUI text editors.
	for _, ed := range []string{"kate", "gedit", "mousepad", "xed", "featherpad", "pluma", "leafpad"} {
		if _, err := exec.LookPath(ed); err == nil {
			exec.Command(ed, path).Start()
			return
		}
	}

	// 3. Last resort: ask xdg-mime for the text/plain handler binary name.
	if out, err := exec.Command("xdg-mime", "query", "default", "text/plain").Output(); err == nil {
		desktopID := strings.TrimSuffix(strings.TrimSpace(string(out)), ".desktop")
		parts := strings.Split(desktopID, ".")
		lastName := parts[len(parts)-1]
		for _, candidate := range []string{lastName, strings.ToLower(lastName)} {
			if _, err := exec.LookPath(candidate); err == nil {
				exec.Command(candidate, path).Start()
				return
			}
		}
	}

	exec.Command("xdg-open", path).Start()
}

// ReadClipboard reads the system clipboard via the Wails runtime.
func (a *App) ReadClipboard() string {
	text, err := runtime.ClipboardGetText(a.ctx)
	if err != nil {
		return ""
	}
	return text
}

// AppQuit gracefully disconnects and quits the application.
func (a *App) AppQuit() {
	a.quitting = true
	go func() {
		a.shutdown()
		runtime.Quit(a.ctx)
	}()
}

// GetThemeByName loads and returns colors for a named theme without changing config.
func (a *App) GetThemeByName(name string) theme.Colors {
	c, err := theme.Load(name)
	if err != nil {
		log.Printf("theme load %s: %v", name, err)
		c, _ = theme.Load("default")
	}
	return c
}

// GetThemeNames returns all available theme names sorted A-Z.
func (a *App) GetThemeNames() []string {
	seen := make(map[string]bool)
	var names []string

	exe, _ := os.Executable()
	dirs := []string{
		filepath.Join(config.Dir(), "themes"),
		filepath.Join(filepath.Dir(exe), "themes"),
		"themes",
	}
	for _, dir := range dirs {
		entries, err := os.ReadDir(dir)
		if err != nil {
			continue
		}
		for _, e := range entries {
			if e.IsDir() || filepath.Ext(e.Name()) != ".toml" {
				continue
			}
			name := strings.TrimSuffix(e.Name(), ".toml")
			if !seen[name] {
				seen[name] = true
				names = append(names, name)
			}
		}
	}
	sort.Strings(names)
	return names
}
