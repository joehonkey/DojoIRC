<div align="center">
  <img src="build/icons/DojoIRC-Main.png" width="350" alt="DojoIRC">
  <p>A fast, cross-platform IRC client built with Go and Wails v2.</p>
  <p>
    <img src="https://img.shields.io/badge/license-MIT-blue.svg" alt="MIT License">
    <img src="https://img.shields.io/badge/Go-1.21+-00ADD8?logo=go" alt="Go 1.21+">
    <img src="https://img.shields.io/badge/IRCv3-supported-blueviolet" alt="IRCv3">
  </p>

  <br>

  <a href="https://github.com/joehonkey/DojoIRC/releases/latest">
    <img src="https://img.shields.io/github/v/release/joehonkey/DojoIRC?label=Latest+Release&style=for-the-badge&color=89b4fa" alt="Latest Release">
  </a>

  <br><br>

  <p><b>Click your OS to download the pre-built binary:</b></p>

  <table>
    <tr>
      <td align="center">
        <a href="https://github.com/joehonkey/DojoIRC/releases/latest/download/DojoIRC-linux-amd64.tar.gz">
          <img src="build/icons/linux/128x128/apps/dojoirc.png" width="72" alt="Linux"><br>
          <b>Linux</b><br>
          <sub>.tar.gz · x86_64</sub>
        </a>
      </td>
      <td align="center">
        <a href="https://github.com/joehonkey/DojoIRC/releases/latest/download/DojoIRC-windows-amd64.zip">
          <img src="build/icons/windows/128x128/apps/dojoirc.png" width="72" alt="Windows"><br>
          <b>Windows</b><br>
          <sub>.zip · x86_64</sub>
        </a>
      </td>
      <td align="center">
        <a href="https://github.com/joehonkey/DojoIRC/releases/latest/download/DojoIRC-macos-arm64.tar.gz">
          <img src="build/icons/mac/mac-128x128.png" width="72" alt="macOS"><br>
          <b>macOS</b><br>
          <sub>.tar.gz · Apple Silicon</sub>
        </a>
      </td>
    </tr>
  </table>

  <p><sub>All releases: <a href="https://github.com/joehonkey/DojoIRC/releases">github.com/joehonkey/DojoIRC/releases</a></sub></p>

  <br>

  <a href="docs/themes-gallery.md">
    <img src="https://img.shields.io/badge/54%20Themes-Browse%20Gallery-cba6f7?style=for-the-badge" alt="Browse Theme Gallery">
  </a>
</div>

---

## Documentation

**[Installation](docs/installation.md)** — [Configuration](docs/configuration.md) — [Commands](docs/commands.md) — [Themes](docs/themes.md) — [**Theme Gallery (50 themes)**](docs/themes-gallery.md) — [Font Sizes](docs/font-sizes.md) — [IRCv3](docs/ircv3.md) — [Building from Source](docs/building.md)

---

## About

DojoIRC is a from-scratch IRC client written in Go using [Wails v2](https://wails.io). The backend is a full IRC engine in Go; the frontend is HTML/CSS/JS rendered in a webkit2gtk webview. Inspired by Halloy, built without restrictions.

- **IRC engine** — TLS, SASL PLAIN, multi-server, auto-reconnect
- **IRCv3** — `message-tags`, `draft/typing`, CAP LS 302 negotiation
- **Theming** — Catppuccin Mocha default, live switching, custom TOML themes
- **Desktop integration** — system tray, OS notifications, URL previews

---

## Features

| Feature | Details |
|---|---|
| **Multi-server** | Connect to as many servers as you want; each has its own sidebar entry |
| **TLS** | All connections use TLS by default (port 6697) |
| **SASL PLAIN** | Per-server SASL authentication via `[server.sasl]` config block |
| **Auto-reconnect** | Retries every 10s on unexpected disconnect; right-click to cancel |
| **System tray** | Close to tray, left-click to toggle, right-click to quit |
| **Mentions & highlights** | Nick mentions highlighted in chat with red tint + OS desktop notification |
| **Typing indicators** | IRCv3 `draft/typing` — outgoing debounced, incoming shown above input |
| **URL previews** | Open Graph metadata cards and inline images loaded below links |
| **Nick colorization** | Consistent hash-based color per nick across all buffers |
| **Tab completion** | Nicks (cycles, adds `: ` at line start) and slash commands |
| **Theme picker** | Scrollable A–Z list, live switching, choice persisted to config |
| **Draggable panels** | Sidebar and nick list resize handles with width persistence |
| **DM windows** | Click any nick to open a private buffer; right-click to close |
| **Server buffer** | MOTD, connection events, WHOIS output per server |
| **Context menus** | Right-click channels to leave, servers to connect/disconnect |
| **In-app docs** | Full documentation panel via Hamburger → Documentation |

---

## IRCv3 Support

| Capability | Status |
|---|---|
| `message-tags` | **Done** — CAP negotiation wired; tags parsed on all inbound messages |
| `draft/typing` | **Done** — outgoing TAGMSG typing indicators (debounced); incoming shown above input |
| `sasl` | **Done** — SASL PLAIN; EXTERNAL planned |
| `server-time` | Planned |
| `batch` | Planned |
| `labeled-response` | Planned |
| `multi-prefix` | Planned |
| `extended-join` | Planned |
| `account-notify` | Planned |
| `away-notify` | Planned |
| `invite-notify` | Planned |
| `chghost` | Planned |
| `userhost-in-names` | Planned |
| `setname` | Planned |
| `chathistory` | Planned |
| `echo-message` | Planned |
| `msgid` | Planned |
| `Monitor` | Planned |
| `cap-notify` | Planned |
| `multiline` | Planned |
| `react` | Planned |
| `read-marker` | Planned |

---

## Quick Start

### Config

On first launch DojoIRC creates `~/.config/dojoirc/config.toml` automatically, pre-configured to connect to **irc.linuxdojo.org #dojoirc**. The only thing you need to change is your nick:

```toml
[[server]]
name     = "LinuxDojo"
host     = "irc.linuxdojo.org"
port     = 6697
tls      = true
nick     = "yournick"        # ← change this
channels = ["#dojoirc"]
```

Use **Hamburger → Open Config** to edit it in your system editor and **Hamburger → Reload Config** to apply changes without restarting. Add as many `[[server]]` blocks as you need.

### SASL Authentication

Add a `[server.sasl]` block immediately after the `[[server]]` it belongs to:

```toml
[[server]]
name     = "Libera"
host     = "irc.libera.chat"
port     = 6697
tls      = true
nick     = "yournick"
channels = ["#linux"]

[server.sasl]
mechanism = "PLAIN"
username  = "youraccountname"
password  = "yourpassword"
```

### Themes

Switch themes via **Hamburger → Theme picker**. 54 themes included: Dracula, Nord, Gruvbox, One Dark, Tokyo Night, Catppuccin, Rose Piné, Kanagawa, Solarized, Cyberpunk, Matrix, and more.

Browse all themes with color swatches: **[Theme Gallery](docs/themes-gallery.md)**

Drop a `.toml` file in `~/.config/dojoirc/themes/` to add your own — it appears in the picker after Reload Config.

---

## Slash Commands

| Command | Description |
|---|---|
| `/j #channel` | Join a channel (alias for /join) |
| `/join #channel` | Join a channel |
| `/part [#channel]` | Leave a channel |
| `/nick <name>` | Change your nick |
| `/me <text>` | Send a /me action |
| `/msg <nick> <text>` | Send a private message |
| `/query <nick>` | Open a DM buffer |
| `/whois <nick>` | Show user info |
| `/away [message]` | Set away status |
| `/back` | Clear away status |
| `/topic <text>` | Set channel topic |
| `/kick <nick> [reason]` | Kick a user (ops only) |
| `/mode <args>` | Set channel or user modes |
| `/invite <nick>` | Invite a user to the channel |
| `/raw <line>` | Send a raw IRC protocol line |
| `/clear` | Clear the current buffer |
| `/sysinfo` | Post OS, kernel, CPU and RAM info |
| `/quit [message]` | Disconnect from the server |
| `/help` | Show command list in buffer |

Tab-completes nicks and commands. Press Tab repeatedly to cycle through matches.

---

## Building from Source

### Requirements

- Go 1.21+
- [Wails v2](https://wails.io): `go install github.com/wailsapp/wails/v2/cmd/wails@latest`
- Node.js 18+
- **Linux:** `webkit2gtk-4.1` (not 4.0)

### Build

```bash
git clone https://github.com/joehonkey/DojoIRC
cd DojoIRC
~/go/bin/wails build -tags webkit2_41   # Linux
cp -r themes build/bin/
```

Binary lands at `build/bin/DojoIRC`.

### Run on KDE Wayland

```bash
DISPLAY=:1 GDK_BACKEND=x11 ./build/bin/DojoIRC
```

---

## Roadmap

**Stage 1 — Foundation** ✅  
Project scaffold, IRC engine, UI layout, system tray, themes, multi-server, slash commands, nick colorization, tab completion, URL previews, typing indicators, SASL, auto-reconnect, mention highlights, desktop notifications.

**Stage 2 — Core IRC Features** (in progress)  
Full IRCv3 CAP negotiation, NickServ, CTCP, DCC, channel list, ignore list, message logging.

**Stage 3 — IRCv3 Capabilities**  
server-time, batch, labeled-response, chathistory, echo-message, msgid, Monitor, multiline, react, read-marker.

**Stage 4 — UX**  
Emoji, message search, keyboard shortcuts, buffer scrollback.

**Stage 5 — Power Features**  
Bouncer support (ZNC/soju), SOCKS5 proxy, mTLS, split view, drag-to-reorder, flood protection, plugin hooks.

**Stage 6 — Platform Polish**  
Flatpak/AppImage, .app bundle, Windows installer, FreeBSD port, GitHub Actions CI, auto-update.

See [ROADMAP.md](ROADMAP.md) for the full detailed list.

---

## License

MIT — see [LICENSE](LICENSE)
