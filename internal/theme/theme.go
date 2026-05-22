package theme

import (
	"fmt"
	"os"
	"path/filepath"

	"github.com/BurntSushi/toml"
	"github.com/joehonkey/dojoire/internal/config"
)

type General struct {
	Background string `toml:"background" json:"background"`
	Text       string `toml:"text" json:"text"`
	Border     string `toml:"border" json:"border"`
	Accent     string `toml:"accent" json:"accent"`
}

type Sidebar struct {
	Background string `toml:"background" json:"background"`
	Text       string `toml:"text" json:"text"`
	Active     string `toml:"active" json:"active"`
	Unread     string `toml:"unread" json:"unread"`
	Mention    string `toml:"mention" json:"mention"`
	Server     string `toml:"server" json:"server"`
}

type Buffer struct {
	Background string `toml:"background" json:"background"`
	Timestamp  string `toml:"timestamp" json:"timestamp"`
	ServerLine string `toml:"server_line" json:"server_line"`
	Action     string `toml:"action" json:"action"`
	NickSelf   string `toml:"nick_self" json:"nick_self"`
}

type Highlights struct {
	MentionBG   string `toml:"mention_bg" json:"mention_bg"`
	MentionText string `toml:"mention_text" json:"mention_text"`
	Keyword     string `toml:"keyword" json:"keyword"`
}

type Nicklist struct {
	Background string `toml:"background" json:"background"`
	Text       string `toml:"text" json:"text"`
	Op         string `toml:"op" json:"op"`
	Halfop     string `toml:"halfop" json:"halfop"`
	Voice      string `toml:"voice" json:"voice"`
	Away       string `toml:"away" json:"away"`
}

type Input struct {
	Background string `toml:"background" json:"background"`
	Text       string `toml:"text" json:"text"`
	Placeholder string `toml:"placeholder" json:"placeholder"`
	NickColor  string `toml:"nick_color" json:"nick_color"`
}

type Colors struct {
	General    General    `toml:"general" json:"general"`
	Sidebar    Sidebar    `toml:"sidebar" json:"sidebar"`
	Buffer     Buffer     `toml:"buffer" json:"buffer"`
	Highlights Highlights `toml:"highlights" json:"highlights"`
	Nicklist   Nicklist   `toml:"nicklist" json:"nicklist"`
	Input      Input      `toml:"input" json:"input"`
}

// Load reads the named theme. Search order:
//  1. ~/.config/dojoire/themes/<name>.toml
//  2. <executable-dir>/themes/<name>.toml
//  3. themes/<name>.toml  (CWD — dev mode)
func Load(name string) (Colors, error) {
	cfgDir := config.Dir()
	exe, _ := os.Executable()
	exeDir := filepath.Dir(exe)

	paths := []string{
		filepath.Join(cfgDir, "themes", name+".toml"),
		filepath.Join(exeDir, "themes", name+".toml"),
		filepath.Join("themes", name+".toml"),
	}
	for _, p := range paths {
		if _, err := os.Stat(p); err == nil {
			var c Colors
			if _, err := toml.DecodeFile(p, &c); err != nil {
				return Colors{}, fmt.Errorf("theme %q: %w", name, err)
			}
			return c, nil
		}
	}
	return Colors{}, fmt.Errorf("theme %q not found", name)
}
