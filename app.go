package main

import (
	"context"
	_ "embed"
	"fmt"
	"log"
	"os"
	"os/exec"
	"os/signal"
	"path/filepath"
	"sort"
	"strconv"
	"strings"
	"sync"
	"syscall"
	"time"

	"github.com/joehonkey/dojoirc/internal/config"
	"github.com/joehonkey/dojoirc/internal/irc"
	"github.com/joehonkey/dojoirc/internal/preview"
	"github.com/joehonkey/dojoirc/internal/logger"
	"github.com/joehonkey/dojoirc/internal/theme"
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

	// Ensure user config and theme directories exist.
	os.MkdirAll(filepath.Join(config.Dir(), "themes"), 0o755)

	// Bootstrap config on first launch so users get linuxdojo.org pre-configured.
	cfgPath := filepath.Join(config.Dir(), "config.toml")
	if _, err := os.Stat(cfgPath); os.IsNotExist(err) {
		os.WriteFile(cfgPath, configExample, 0o644)
	}

	cfg, err := config.Load()
	if err != nil {
		log.Printf("config error: %v", err)
	}
	a.cfg = cfg

	// Give the webview time to initialize before connecting so events aren't lost.
	// Uses connectNewServers so JS boot's ReloadConfig() call can't race and double-connect.
	time.AfterFunc(1500*time.Millisecond, func() {
		a.connectNewServers(cfg)
	})

	// Honour SIGTERM/SIGINT so `kill <pid>` cleanly removes the tray icon.
	go func() {
		ch := make(chan os.Signal, 1)
		signal.Notify(ch, syscall.SIGTERM, syscall.SIGINT)
		<-ch
		a.AppQuit()
	}()
}

func (a *App) onEvent(ev irc.Event) {
	if ev.Type == "names" {
		a.updateNicklist(ev.Server, ev.Channel, ev.Text)
	}
	switch ev.Type {
	case "message", "action":
		logger.Log(config.Dir(), ev.Server, ev.Channel, ev.Nick, ev.Text)
	case "notice":
		logger.Log(config.Dir(), ev.Server, ev.Channel, "*"+ev.Nick+"*", ev.Text)
	case "server", "whois":
		logger.Log(config.Dir(), ev.Server, "server", "", ev.Text)
	}
	runtime.EventsEmit(a.ctx, "irc:event", ev)
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

// SendCTCP sends a CTCP request (VERSION, PING, TIME, etc.).
func (a *App) SendCTCP(server, target, cmd, param string) {
	if c, ok := a.clients[server]; ok {
		c.SendCTCP(target, cmd, param)
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

// DisconnectServer sends QUIT to a server and removes it from the client map.
func (a *App) DisconnectServer(name string) {
	a.mu.Lock()
	c, ok := a.clients[name]
	if ok {
		delete(a.clients, name)
	}
	a.mu.Unlock()
	if ok {
		c.Quit("")
	}
}

// ConnectServer connects to a server by name using the current config.
func (a *App) ConnectServer(name string) {
	if a.cfg == nil {
		return
	}
	a.mu.RLock()
	_, already := a.clients[name]
	a.mu.RUnlock()
	if already {
		return
	}
	for _, srv := range a.cfg.Servers {
		if srv.Name != name {
			continue
		}
		s := srv
		client := irc.NewClient(s, a.onEvent)
		if err := client.Connect(); err != nil {
			log.Printf("failed to connect to %s: %v", s.Name, err)
			return
		}
		a.mu.Lock()
		a.clients[s.Name] = client
		a.mu.Unlock()
		return
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
	logger.CloseAll()
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

// ReloadConfig re-reads config.toml from disk, connects any new servers, and returns updated UI settings.
func (a *App) ReloadConfig() UIConfig {
	cfg, err := config.Load()
	if err != nil {
		log.Printf("reload config: %v", err)
	} else {
		a.cfg = cfg
		a.connectNewServers(cfg)
	}
	return a.uiConfig()
}

func (a *App) connectNewServers(cfg *config.Config) {
	a.mu.RLock()
	connected := make(map[string]bool, len(a.clients))
	for name := range a.clients {
		connected[name] = true
	}
	a.mu.RUnlock()

	for _, srv := range cfg.Servers {
		if connected[srv.Name] {
			continue
		}
		s := srv
		client := irc.NewClient(s, a.onEvent)
		if err := client.Connect(); err != nil {
			log.Printf("failed to connect to %s: %v", s.Name, err)
			continue
		}
		a.mu.Lock()
		a.clients[s.Name] = client
		a.mu.Unlock()
		log.Printf("connecting to %s...", s.Name)
	}
}

// NeedsNickSetup returns true if any server still has the default placeholder nick.
func (a *App) NeedsNickSetup() bool {
	if a.cfg == nil {
		return false
	}
	for _, s := range a.cfg.Servers {
		if s.Nick == "yournick" {
			return true
		}
	}
	return false
}

// SetNick replaces the placeholder nick in config.toml and updates the in-memory config.
func (a *App) SetNick(nick string) bool {
	if a.cfg == nil || nick == "" {
		return false
	}
	path := filepath.Join(config.Dir(), "config.toml")
	data, err := os.ReadFile(path)
	if err != nil {
		return false
	}
	updated := strings.ReplaceAll(string(data), `"yournick"`, fmt.Sprintf("%q", nick))
	if err := os.WriteFile(path, []byte(updated), 0o644); err != nil {
		return false
	}
	for i := range a.cfg.Servers {
		if a.cfg.Servers[i].Nick == "yournick" {
			a.cfg.Servers[i].Nick = nick
		}
	}
	return true
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

// GetSysInfo returns a one-line system info string for /sysinfo.
func (a *App) GetSysInfo() string {
	os := sysInfoOS()
	cpu := sysInfoCPU()
	ram := sysInfoRAM()
	kernel := sysInfoKernel()
	return fmt.Sprintf("[sysinfo] OS: %s | Kernel: %s | CPU: %s | RAM: %s", os, kernel, cpu, ram)
}

func sysInfoOS() string {
	data, err := os.ReadFile("/etc/os-release")
	if err != nil {
		return "Unknown"
	}
	for _, line := range strings.Split(string(data), "\n") {
		if strings.HasPrefix(line, "PRETTY_NAME=") {
			return strings.Trim(strings.TrimPrefix(line, "PRETTY_NAME="), `"`)
		}
	}
	return "Linux"
}

func sysInfoCPU() string {
	data, err := os.ReadFile("/proc/cpuinfo")
	if err != nil {
		return "Unknown"
	}
	name := ""
	threads := 0
	for _, line := range strings.Split(string(data), "\n") {
		if strings.HasPrefix(line, "model name") && name == "" {
			parts := strings.SplitN(line, ":", 2)
			if len(parts) == 2 {
				name = strings.TrimSpace(parts[1])
			}
		}
		if strings.HasPrefix(line, "processor") {
			threads++
		}
	}
	if name == "" {
		return "Unknown"
	}
	return fmt.Sprintf("%s (%d threads)", name, threads)
}

func sysInfoRAM() string {
	data, err := os.ReadFile("/proc/meminfo")
	if err != nil {
		return "Unknown"
	}
	var total, available uint64
	for _, line := range strings.Split(string(data), "\n") {
		fields := strings.Fields(line)
		if len(fields) < 2 {
			continue
		}
		val, _ := strconv.ParseUint(fields[1], 10, 64)
		switch fields[0] {
		case "MemTotal:":
			total = val
		case "MemAvailable:":
			available = val
		}
	}
	used := total - available
	return fmt.Sprintf("%.1f/%.0fGB", float64(used)/1024/1024, float64(total)/1024/1024)
}

func sysInfoKernel() string {
	out, err := exec.Command("uname", "-r").Output()
	if err != nil {
		return "Unknown"
	}
	return strings.TrimSpace(string(out))
}

// ListChannels sends a LIST request to the server.
func (a *App) ListChannels(server string) {
	if c, ok := a.clients[server]; ok {
		c.Raw("LIST")
	}
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

// RestartApp relaunches the binary and exits the current process.
func (a *App) RestartApp() {
	exe, err := os.Executable()
	if err != nil {
		log.Printf("restart: %v", err)
		return
	}
	exec.Command(exe, os.Args[1:]...).Start()
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
