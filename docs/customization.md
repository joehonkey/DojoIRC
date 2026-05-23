# Customization Guide

This guide covers every way you can customize DojoIRC — from the config file to themes to per-element font sizes in the CSS.

---

## Config file basics

DojoIRC is configured with a single TOML file. Its location depends on your platform:

| Platform | Path |
|---|---|
| Linux / macOS | `~/.config/dojoirc/config.toml` |
| Windows | `%APPDATA%\dojoirc\config.toml` |

**Open it:** Hamburger → Open Config  
**Apply changes:** Hamburger → Reload Config (no restart needed for most settings)

---

## Global appearance settings

These go at the top of your config file, before any `[[server]]` blocks.

```toml
theme     = "default"
font      = "IBM Plex Mono"
font_size = 13
```

| Key | What it does |
|---|---|
| `theme` | Which theme to load. Must match a `.toml` filename in `themes/` without the extension |
| `font` | Font family for the entire UI. The font must be installed on your system |
| `font_size` | Main chat message font size in pixels. Applied instantly via Reload Config |

### Using a custom font

Install the font on your OS first, then set the name exactly as it appears in your system:

```toml
font      = "Noto Sans"
font_size = 15
```

```toml
font      = "JetBrains Mono"
font_size = 14
```

```toml
font      = "Fira Code"
font_size = 13
```

After changing `font` or `font_size`, use **Hamburger → Reload Config** to apply.

---

## Per-element font sizes

Open **Hamburger → Font Sizes** to adjust every UI zone live — changes apply instantly and are saved across restarts. No file editing or restart required.

| Zone | Controls | Default |
|---|---|---|
| Sidebar Header (DOJOIRC) | "DOJOIRC" title and hamburger row | 11px |
| Hamburger Button (☰) | The ☰ button | 14px |
| Server Names | Server names in the sidebar | 11px |
| Channel Names | Channel and DM names in the sidebar | 13px |
| Chat Messages | Main chat message text | 13px |
| Timestamps | HH:MM timestamp column | 13px |
| Nick List | Nicks in the nick list panel | 12px |
| Typing Indicator | Typing indicator above the input bar | 13px |
| Input Nick Prefix | Your nick left of the message input box | 12px |
| Input Field | Text you type in the input box | 13px |

Use **Reset to Defaults** in the panel to restore all zones at once. See [Font Sizes](font-sizes.md) for the full reference.

---

## Themes

DojoIRC ships with 54 built-in themes. Switch via **Hamburger → Theme picker** — changes apply live with no restart.

Your selection is saved to `config.toml` automatically:

```toml
theme = "Nord"
```

### Adding a custom theme

1. Create a `.toml` file in `~/.config/dojoirc/themes/`. The filename (without `.toml`) becomes the theme name.
2. Use **Hamburger → Reload Config** — it appears in the picker immediately.

### Theme file format

```toml
[colors]
bg          = "#1e1e2e"   # main chat area background
bg_sidebar  = "#181825"   # sidebar and nick list background
bg_input    = "#313244"   # message input box background
bg_hover    = "#2a2a3d"   # hovered item background
bg_active   = "#45475a"   # selected/active item background
text        = "#cdd6f4"   # primary text
text_dim    = "#6c7086"   # timestamps and dimmed labels
text_server = "#585b70"   # server/status messages (JOIN, PART, etc.)
border      = "#313244"   # panel borders
accent      = "#89b4fa"   # active items, links, unread dots, focus rings
timestamp   = "#6c7086"   # HH:MM timestamp column
nick_self   = "#a6e3a1"   # your nick in the input bar
action      = "#cba6f7"   # /me action messages

[sidebar]
unread  = "#89b4fa"       # blue dot — channel has unread messages
mention = "#f9e2af"       # yellow dot — your nick was mentioned

[highlights]
mention    = "#f38ba8"    # text color on mention messages
mention_bg = "rgba(243,139,168,0.06)"   # background tint on mention rows
```

Missing keys fall back to the default theme's values — you don't need to include every key.

### Example — custom dark green theme

```toml
[colors]
bg          = "#0d1117"
bg_sidebar  = "#010409"
bg_input    = "#161b22"
bg_hover    = "#1c2128"
bg_active   = "#30363d"
text        = "#e6edf3"
text_dim    = "#7d8590"
text_server = "#484f58"
border      = "#30363d"
accent      = "#3fb950"
timestamp   = "#7d8590"
nick_self   = "#3fb950"
action      = "#bc8cff"

[sidebar]
unread  = "#3fb950"
mention = "#f78166"

[highlights]
mention    = "#f78166"
mention_bg = "rgba(247,129,102,0.06)"
```

---

## Complete config example

A full config with custom font, theme, and multiple servers:

```toml
theme     = "Nord"
font      = "Noto Sans"
font_size = 15

[[server]]
name     = "LinuxDojo"
host     = "irc.linuxdojo.org"
port     = 6697
tls      = true
nick     = "yournick"
channels = ["#dojoirc", "#linuxdojo"]

[[server]]
name     = "Libera"
host     = "irc.libera.chat"
port     = 6697
tls      = true
nick     = "yournick"
channels = ["#linux", "#python", "#archlinux"]

[server.sasl]
mechanism = "PLAIN"
username  = "youraccountname"
password  = "yourpassword"

[[server]]
name              = "OFTC"
host              = "irc.oftc.net"
port              = 6697
tls               = true
nick              = "yournick"
channels          = ["#debian"]
nickserv_password = "yourpassword"
```

See [Configuration](configuration.md) for the full reference and [Themes](themes.md) for a complete theme list.
