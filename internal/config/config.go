package config

import (
	"os"
	"path/filepath"

	"github.com/BurntSushi/toml"
)

type Config struct {
	Servers []Server `toml:"server"`
	Buffer  Buffer   `toml:"buffer"`
	Theme   string   `toml:"theme"`
}

type Server struct {
	Name     string   `toml:"name"`
	Host     string   `toml:"host"`
	Port     int      `toml:"port"`
	TLS      bool     `toml:"tls"`
	Nick     string   `toml:"nick"`
	Channels []string `toml:"channels"`
}

type Buffer struct {
	Commands Commands `toml:"commands"`
}

type Commands struct {
	Aliases map[string]string `toml:"aliases"`
	Exec    Exec              `toml:"exec"`
}

type Exec struct {
	Enabled        bool `toml:"enabled"`
	TimeoutSecs    int  `toml:"timeout"`
	MaxOutputBytes int  `toml:"max_output_bytes"`
}

func Dir() string {
	if xdg := os.Getenv("XDG_CONFIG_HOME"); xdg != "" {
		return filepath.Join(xdg, "dojoire")
	}
	home, _ := os.UserHomeDir()
	return filepath.Join(home, ".config", "dojoire")
}

func Load() (*Config, error) {
	path := filepath.Join(Dir(), "config.toml")

	cfg := &Config{
		Theme: "default",
		Buffer: Buffer{
			Commands: Commands{
				Exec: Exec{
					Enabled:        false,
					TimeoutSecs:    5,
					MaxOutputBytes: 4096,
				},
			},
		},
	}

	if _, err := os.Stat(path); os.IsNotExist(err) {
		return cfg, nil
	}

	if _, err := toml.DecodeFile(path, cfg); err != nil {
		return nil, err
	}

	return cfg, nil
}
