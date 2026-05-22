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
- [x] IRC engine wired to UI — real messages flowing
- [x] Slash commands: /nick /whois /join /part /me /msg /query /away /back /topic /kick /mode /invite /raw /quit /help
- [x] Server buffer (click network name to see MOTD and connection output)
- [x] Nick colorization (consistent hash-based color per nick)
- [x] Nick list with op/voice sorting and colors
- [x] Right-click context menu to leave channels / close DM windows
- [x] Multi-server support in UI
- [x] DM (query) windows — click/right-click nick to open, right-click to close
- [x] Typing indicators (IRCv3 draft/typing — outgoing debounced, incoming shown above input)
- [x] Unread dots (accent = unread, yellow = mention) left of channel names
- [x] Draggable sidebar and nicklist resize handles with min/max
- [x] Panel width persistence (localStorage — survives restarts)
- [x] Hamburger menu (theme picker, open config, reload config, quit)
- [x] Topic toggle pill button in buffer header
- [x] Paste in input field (right-click context menu, Wails clipboard API)
- [ ] Script aliases (/music, /sysinfo, /exec)

## Stage 2 — Core IRC Features
- [ ] Full IRCv3 capability negotiation (CAP LS 302)
- [ ] SASL PLAIN + EXTERNAL authentication
- [ ] NickServ identify flow
- [ ] WHOIS, WHO
- [ ] Channel modes display
- [ ] Nick list with op/voice/halfop indicators
- [ ] Away status
- [ ] CTCP (VERSION, TIME, PING, ACTION)
- [ ] DCC SEND — file transfer to/from users (peer-to-peer TCP, in-process listener)
  - Frontend: drag-and-drop a file or use /dcc send <nick> to trigger
  - Go: DCC negotiation CTCP, listener goroutine, progress events to UI
  - Receive: accept prompt, stream to ~/Downloads
- [ ] DCC chat (basic)
- [ ] Channel list (/LIST)
- [ ] Ignore list
- [ ] Highlight/mention detection + notifications
- [ ] Desktop notifications (libnotify / OS native)
- [ ] Message logging to disk

## Stage 3 — IRCv3 Capabilities
- [x] `message-tags` — CAP negotiation + inbound tag parsing
- [x] `typing` — outgoing TAGMSG typing indicators (debounced); incoming shown above input bar
- [ ] `server-time` — display server-supplied message timestamps
- [ ] `batch` — batched message handling
- [ ] `labeled-response` — correlate responses to requests
- [ ] `multi-prefix` — show all mode prefixes per nick in nicklist
- [ ] `extended-join` — account name on join
- [ ] `account-notify` — track account changes live
- [ ] `away-notify` — live away status updates in nicklist
- [ ] `invite-notify` — channel-wide notification on /INVITE
- [ ] `chghost` — host change without reconnect
- [ ] `userhost-in-names` — full user@host in NAMES reply
- [ ] `setname` — live realname changes
- [ ] `chathistory` — bouncer/server history playback
- [ ] `echo-message` — server confirms sent messages
- [ ] `msgid` — unique message IDs for deduplication
- [ ] `Monitor` — notify when a tracked nick comes online/offline
- [ ] `cap-notify` — dynamic capability advertisement after connect
- [ ] `channel-context` — associate messages with channels in batch
- [ ] `multiline` — multi-line message support
- [ ] `react` — emoji reactions to messages
- [ ] `read-marker` — sync read position across clients
- [ ] `Standard Replies` — structured error/info replies from server

## Stage 4 — User Experience
- [x] Theme system (load from themes/*.toml at startup)
- [x] Theme picker (scrollable A-Z panel, active theme highlighted, persists to config)
- [x] URL detection + clickable links
- [x] URL preview cards (og: metadata, inline images)
- [x] Nick colorization (consistent hash-based color per nick)
- [x] Live theme switching (reload without restart)
- [x] Font + font size selection in config (applied via Reload Config)
- [x] Context menu overflow fix (flips upward/leftward at screen edges)
- [ ] Emoji support
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

## IRCv3 Capabilities

We strive to be a leading IRC client with a rich IRCv3 feature set.
Reference: https://ircv3.net/irc/

| Capability | Status | Notes |
|---|---|---|
| `account-notify` | planned | Track account changes live |
| `away-notify` | planned | Live away status updates in nicklist |
| `batch` | planned | Batched message handling |
| `cap-notify` | planned | Dynamic capability advertisement after connect |
| `channel-context` | planned | Associate messages with channels in batch |
| `chathistory` | planned | Bouncer/server history playback |
| `chghost` | planned | Host change without reconnect |
| `echo-message` | planned | Server echoes sent messages back (confirms delivery) |
| `extended-join` | planned | Account name included in JOIN messages |
| `invite-notify` | planned | Channel-wide notification on /INVITE |
| `labeled-response` | planned | Correlate responses to specific requests |
| `message-tags` | done | CAP negotiation wired; tags parsed on inbound messages |
| `Monitor` | planned | Notify when a nick comes online or goes offline |
| `msgid` | planned | Unique message IDs for deduplication and threading |
| `multi-prefix` | planned | Show all mode prefixes per nick in NAMES/nicklist |
| `multiline` | planned | Multi-line message support |
| `react` | planned | Emoji reactions to messages |
| `read-marker` | planned | Sync read position across clients |
| `sasl` | planned | SASL PLAIN + EXTERNAL (Stage 2) |
| `server-time` | planned | Display server-supplied message timestamps |
| `setname` | planned | Live REALNAME changes |
| `Standard Replies` | planned | Structured error/info replies from server |
| `typing` | done | Outgoing TAGMSG typing indicators; incoming shown above input bar |
| `userhost-in-names` | planned | Full user@host included in NAMES reply |
