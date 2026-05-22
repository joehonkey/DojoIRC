# DojoIRC

A cross-platform IRC client built with Go and Wails v2. Go handles the IRC engine and config; a webkit2gtk webview renders the frontend. Inspired by Halloy, built without restrictions.

**Targets:** Linux, FreeBSD, macOS, Windows

## Building

### Requirements

- Go 1.21+
- Wails v2: `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- Linux: `webkit2gtk-4.1` (not 4.0)
- Node.js 18+ (for frontend)

### Build

```bash
cd ~/Projects/DojoIRC
~/go/bin/wails build -tags webkit2_41
```

Binary lands at `build/bin/DojoIRC`.

### Run (Linux / KDE Wayland)

```bash
DISPLAY=:1 GDK_BACKEND=x11 ./build/bin/DojoIRC
```

## Config

Create `~/.config/dojoire/config.toml`:

```toml
theme = "default"

[[server]]
name     = "LinuxDojo"
host     = "irc.linuxdojo.org"
port     = 6697
tls      = true
nick     = "yournick"
channels = ["#dojoirc", "#linuxdojo"]
```

## Themes

Drop a `.toml` file in `~/.config/dojoire/themes/` or `<exe-dir>/themes/`. Set `theme = "name"` in config (without the `.toml` extension). The `default` theme ships with the binary (Catppuccin Mocha).

## Slash Commands

| Command | Description |
|---|---|
| `/nick <name>` | Change nick |
| `/whois <nick>` | Show user info |
| `/join <#channel>` | Join a channel |
| `/part [#channel]` | Leave a channel |
| `/me <text>` | Send an action |
| `/msg <nick> <text>` | Send a private message |
| `/query <nick>` | Open a DM buffer |
| `/away [message]` | Set away status |
| `/back` | Clear away status |
| `/topic <text>` | Set channel topic |
| `/kick <nick>` | Kick from channel |
| `/mode <args>` | Set mode |
| `/invite <nick>` | Invite to channel |
| `/raw <line>` | Send raw IRC line |
| `/quit [message]` | Disconnect |
| `/help` | Show this list in the buffer |

## Features

- TLS IRC connections
- Multi-server support
- System tray (hide to tray, show/quit)
- URL preview cards (og: metadata, inline images)
- Nick colorization (consistent hash per nick)
- Server buffer (MOTD, WHOIS, connection events)
- Right-click channels to leave

## License

MIT — see LICENSE
