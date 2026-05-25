package config_test

import (
	"os"
	"path/filepath"
	"testing"

	"github.com/joehonkey/dojoirc/internal/config"
)

func TestLoad_missingFile_returnsDefaults(t *testing.T) {
	t.Setenv("XDG_CONFIG_HOME", t.TempDir())
	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("Load() unexpected error: %v", err)
	}
	if cfg == nil {
		t.Fatal("expected non-nil config")
	}
	if cfg.Behaviour.Scrollback != 500 {
		t.Errorf("Scrollback default: got %d, want 500", cfg.Behaviour.Scrollback)
	}
	if !cfg.Behaviour.AutoReconnect {
		t.Error("AutoReconnect should default to true")
	}
	if cfg.Behaviour.ReconnectDelay != 10 {
		t.Errorf("ReconnectDelay default: got %d, want 10", cfg.Behaviour.ReconnectDelay)
	}
	if !cfg.Behaviour.DCCEnabled {
		t.Error("DCCEnabled should default to true")
	}
	if !cfg.Behaviour.PreviewsEnabled {
		t.Error("PreviewsEnabled should default to true")
	}
	if cfg.Behaviour.MaxDCCFileSize != 0 {
		t.Errorf("MaxDCCFileSize default: got %d, want 0", cfg.Behaviour.MaxDCCFileSize)
	}
	if cfg.Font != "IBM Plex Mono" {
		t.Errorf("Font default: got %q", cfg.Font)
	}
	if cfg.FontSize != 13 {
		t.Errorf("FontSize default: got %d, want 13", cfg.FontSize)
	}
}

func TestLoad_badTOML_returnsError(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("XDG_CONFIG_HOME", dir)
	cfgDir := filepath.Join(dir, "dojoirc")
	os.MkdirAll(cfgDir, 0o700)
	os.WriteFile(filepath.Join(cfgDir, "config.toml"), []byte("not valid toml [[["), 0o600)
	_, err := config.Load()
	if err == nil {
		t.Error("expected error for invalid TOML")
	}
}

func TestLoad_sasl(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("XDG_CONFIG_HOME", dir)
	cfgDir := filepath.Join(dir, "dojoirc")
	os.MkdirAll(cfgDir, 0o700)
	content := `
[[server]]
name = "Test"
host = "irc.example.com"
port = 6697
tls  = true
nick = "testnick"

[server.sasl]
mechanism = "PLAIN"
username  = "testuser"
password  = "testpass"
`
	os.WriteFile(filepath.Join(cfgDir, "config.toml"), []byte(content), 0o600)
	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("Load() error: %v", err)
	}
	if len(cfg.Servers) != 1 {
		t.Fatalf("expected 1 server, got %d", len(cfg.Servers))
	}
	srv := cfg.Servers[0]
	if srv.SASL == nil {
		t.Fatal("SASL should not be nil")
	}
	if srv.SASL.Mechanism != "PLAIN" {
		t.Errorf("SASL.Mechanism: got %q, want PLAIN", srv.SASL.Mechanism)
	}
	if srv.SASL.Username != "testuser" {
		t.Errorf("SASL.Username: got %q, want testuser", srv.SASL.Username)
	}
	if srv.SASL.Password != "testpass" {
		t.Errorf("SASL.Password: got %q", srv.SASL.Password)
	}
}

func TestLoad_behaviourOverrides(t *testing.T) {
	dir := t.TempDir()
	t.Setenv("XDG_CONFIG_HOME", dir)
	cfgDir := filepath.Join(dir, "dojoirc")
	os.MkdirAll(cfgDir, 0o700)
	content := `
[behaviour]
scrollback        = 100
dcc_enabled       = false
previews_enabled  = false
max_dcc_file_size = 1048576
reconnect_delay   = 30
`
	os.WriteFile(filepath.Join(cfgDir, "config.toml"), []byte(content), 0o600)
	cfg, err := config.Load()
	if err != nil {
		t.Fatalf("Load() error: %v", err)
	}
	if cfg.Behaviour.Scrollback != 100 {
		t.Errorf("Scrollback: got %d, want 100", cfg.Behaviour.Scrollback)
	}
	if cfg.Behaviour.DCCEnabled {
		t.Error("DCCEnabled should be false")
	}
	if cfg.Behaviour.PreviewsEnabled {
		t.Error("PreviewsEnabled should be false")
	}
	if cfg.Behaviour.MaxDCCFileSize != 1048576 {
		t.Errorf("MaxDCCFileSize: got %d, want 1048576", cfg.Behaviour.MaxDCCFileSize)
	}
	if cfg.Behaviour.ReconnectDelay != 30 {
		t.Errorf("ReconnectDelay: got %d, want 30", cfg.Behaviour.ReconnectDelay)
	}
}

func TestDir_xdg(t *testing.T) {
	tmp := t.TempDir()
	t.Setenv("XDG_CONFIG_HOME", tmp)
	got := config.Dir()
	want := filepath.Join(tmp, "dojoirc")
	if got != want {
		t.Errorf("Dir() = %q, want %q", got, want)
	}
}

func TestDir_home(t *testing.T) {
	t.Setenv("XDG_CONFIG_HOME", "")
	got := config.Dir()
	if got == "" {
		t.Error("Dir() returned empty string")
	}
	if filepath.Base(got) != "dojoirc" {
		t.Errorf("Dir() base should be 'dojoirc', got %q", filepath.Base(got))
	}
}
