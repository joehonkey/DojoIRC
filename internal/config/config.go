package config

import (
	"os"
	"path/filepath"

	"github.com/BurntSushi/toml"
)

type Config struct {
	Theme      string     `toml:"theme"`
	Font       string     `toml:"font"`
	FontSize   int        `toml:"font_size"`
	Behaviour  Behaviour  `toml:"behaviour"`
	Servers    []Server   `toml:"server"`
	Commands   Commands   `toml:"commands"`
	Highlights Highlights `toml:"highlights"`
	Logging    Logging    `toml:"logging"`
}

type Behaviour struct {
	Tray           bool   `toml:"tray"`
	Notifications  bool   `toml:"notifications"`
	MentionSound   string `toml:"mention_sound"`
	Scrollback     int    `toml:"scrollback"`
	AutoReconnect  bool   `toml:"auto_reconnect"`
	ReconnectDelay int    `toml:"reconnect_delay"`
	DCCEnabled     bool   `toml:"dcc_enabled"`
	PreviewsEnabled bool  `toml:"previews_enabled"`
	MaxDCCFileSize int64  `toml:"max_dcc_file_size"` // bytes; 0 = unlimited
}

type Server struct {
	Name         string   `toml:"name"`
	Host         string   `toml:"host"`
	Port         int      `toml:"port"`
	TLS          bool     `toml:"tls"`
	Nick         string   `toml:"nick"`
	AltNick      string   `toml:"alt_nick"`
	Ident        string   `toml:"ident"`
	RealName     string   `toml:"realname"`
	Channels     []string `toml:"channels"`
	NickServPass string   `toml:"nickserv_password"`
	Password     string   `toml:"password"`
	SASL         *SASL    `toml:"sasl"`
	Ignore       []string `toml:"ignore"`
}

type SASL struct {
	Mechanism string `toml:"mechanism"`
	Username  string `toml:"username"`
	Password  string `toml:"password"`
}

type Commands struct {
	Exec    Exec              `toml:"exec"`
	Aliases map[string]string `toml:"aliases"`
}

type Exec struct {
	Enabled        bool `toml:"enabled"`
	Timeout        int  `toml:"timeout"`
	MaxOutputBytes int  `toml:"max_output_bytes"`
}

type Highlights struct {
	Keywords []string `toml:"keywords"`
}

type Logging struct {
	Enabled   bool   `toml:"enabled"`
	Directory string `toml:"directory"`
	Format    string `toml:"format"`
}

func defaults() *Config {
	return &Config{
		Theme:    "default",
		Font:     "IBM Plex Mono",
		FontSize: 13,
		Behaviour: Behaviour{
			Tray:            true,
			Notifications:   true,
			Scrollback:      500,
			AutoReconnect:   true,
			ReconnectDelay:  10,
			DCCEnabled:      true,
			PreviewsEnabled: true,
			MaxDCCFileSize:  0,
		},
		Commands: Commands{
			Exec: Exec{
				Enabled:        false,
				Timeout:        5,
				MaxOutputBytes: 512,
			},
		},
		Logging: Logging{
			Format: "text",
		},
	}
}

func Dir() string {
	if xdg := os.Getenv("XDG_CONFIG_HOME"); xdg != "" {
		return filepath.Join(xdg, "dojoirc")
	}
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".config", "dojoirc")
}

func Load() (*Config, error) {
	cfg := defaults()
	path := filepath.Join(Dir(), "config.toml")

	if _, err := os.Stat(path); os.IsNotExist(err) {
		return cfg, nil
	}

	if _, err := toml.DecodeFile(path, cfg); err != nil {
		return nil, err
	}

	return cfg, nil
}
