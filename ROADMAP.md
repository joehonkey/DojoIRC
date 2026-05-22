# DojoIRC Roadmap

## Stage 1 — Foundation (current)
- [x] Project scaffold (Go + Wails v2)
- [x] TOML config system (XDG-aware)
- [x] IRC engine (connect, TLS, join, PRIVMSG)
- [x] Basic UI layout (sidebar, messages, nicklist, input bar)
- [x] Default theme (Catppuccin Mocha)
- [x] System tray (hide to tray, show/quit)
- [x] Platform icon sets (Linux, FreeBSD, macOS, Windows)
- [x] MIT license, GitHub repo
- [ ] Wire IRC engine to UI (real messages flowing)
- [ ] Script aliases (/music, /sysinfo, /exec)
- [ ] Multi-server support in UI
- [ ] Config file loaded on startup

## Stage 2 — Core IRC Features
- [ ] Full IRCv3 capability negotiation (CAP LS 302)
- [ ] SASL PLAIN + EXTERNAL authentication
- [ ] NickServ identify flow
- [ ] WHOIS, WHO
- [ ] Channel modes display
- [ ] Nick list with op/voice/halfop indicators
- [ ] Away status
- [ ] CTCP (VERSION, TIME, PING, ACTION)
- [ ] DCC chat (basic)
- [ ] Channel list (/LIST)
- [ ] Ignore list
- [ ] Highlight/mention detection + notifications
- [ ] Desktop notifications (libnotify / OS native)
- [ ] Message logging to disk

## Stage 3 — IRCv3 Capabilities
- [ ] `server-time` — display message timestamps from server
- [ ] `message-tags` — full tag parsing and display
- [ ] `batch` — batched message handling
- [ ] `labeled-response` — correlate responses to requests
- [ ] `multi-prefix` — show all modes in nicklist
- [ ] `extended-join` — account name on join
- [ ] `account-notify` — track account changes
- [ ] `away-notify` — live away status updates
- [ ] `invite-notify` — notify on invite
- [ ] `chghost` — host change without reconnect
- [ ] `userhost-in-names` — full host in NAMES reply
- [ ] `setname` — realname changes
- [ ] `draft/chathistory` — bouncer/server history playback

## Stage 4 — User Experience
- [ ] Theme system (load from themes/*.toml, switch live)
- [ ] Font selection in config
- [ ] URL detection + clickable links
- [ ] Image inline preview (optional)
- [ ] URL preview cards (title/description)
- [ ] Emoji support
- [ ] Nick colorization (consistent color per nick)
- [ ] Message search in buffer
- [ ] Buffer scrollback limit + pagination
- [ ] Keyboard shortcuts (configurable)
- [ ] Command autocomplete (Tab)
- [ ] Nick autocomplete (Tab)

## Stage 5 — Power Features
- [ ] Bouncer support (ZNC, soju/sojuctl)
- [ ] MONITOR / WATCH (notify when nick comes online)
- [ ] Proxy support (SOCKS5)
- [ ] mTLS client certificates
- [ ] Split buffer view
- [ ] Drag-to-reorder channels
- [ ] Channel pinning
- [ ] Per-server custom nick/ident/realname
- [ ] Auto-reconnect with backoff
- [ ] Flood protection (message queue + rate limiting)
- [ ] Script aliases (/music, /sysinfo, custom /exec aliases)
- [ ] Plugin/script hooks (shell scripts on events)

## Stage 6 — Platform Polish
- [ ] FreeBSD system tray via D-Bus/ksni
- [ ] macOS native notifications
- [ ] Windows toast notifications
- [ ] .desktop file installer (Linux)
- [ ] macOS .app bundle
- [ ] Windows installer (NSIS, already scaffolded by Wails)
- [ ] Flatpak / AppImage (Linux distribution)
- [ ] FreeBSD port skeleton
- [ ] GitHub Actions CI (build matrix: linux/freebsd/mac/windows)
- [ ] Auto-update check

## IRCv3 Feature Tracking
Reference: https://ircv3.net/irc/

| Capability | Status | Notes |
|---|---|---|
| `cap-notify` | planned | dynamic capability advertisement |
| `server-time` | planned | Stage 3 |
| `message-tags` | planned | Stage 3 |
| `batch` | planned | Stage 3 |
| `multi-prefix` | planned | Stage 3 |
| `sasl` | planned | Stage 2 |
| `away-notify` | planned | Stage 3 |
| `account-notify` | planned | Stage 3 |
| `extended-join` | planned | Stage 3 |
| `draft/chathistory` | planned | Stage 3 |
| `setname` | planned | Stage 3 |
| `chghost` | planned | Stage 3 |
