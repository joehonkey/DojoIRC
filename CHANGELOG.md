# DojoIRC Changelog

## v0.2.0 — 2026-05-22

### Added
- **CTCP** — auto-replies to `VERSION`, `PING`, `TIME` requests from other clients; `/ctcp <nick> <cmd>` to query others; replies shown in server buffer
- **54 themes** — ported all themes from themes.halloy.chat (Dracula, Nord, Gruvbox, One Dark, Tokyo Night Storm, Catppuccin variants, Rose Piné variants, Kanagawa, Solarized Dark, Zenburn, Cyberpunk, Matrix, and 38 more)
- **Theme gallery** — `docs/themes-gallery.md` with color swatches for all 54 themes
- **Direct download links** — README OS icons now link directly to platform binaries; `themes.zip` available as a standalone release asset
- **Nick tracking** — client now tracks nick changes from `/nick` so CTCP replies always use the current nick

### Fixed
- Theme TOML structure corrected — generated themes now use the proper `[general]`, `[sidebar]`, `[buffer]`, `[highlights]`, `[nicklist]`, `[input]` sections so they actually apply in the picker
- Timestamp font size matched to chat text (13px)

---

## Session 1 — 2026-05-22 (Initial Build)

### Decisions
- **Go + Wails v2** chosen for GUI — Go backend keeps logic clean, web frontend gives full design control, easier to upgrade than Fyne
- **webkit2gtk-4.1** required on Arch Linux (not 4.0) — build flag `-tags webkit2_41` required for all Linux builds
- **Project name:** DojoIRC — Go + LinuxDojo origin, tells you what it is
- **MIT license** — most permissive, fits an open IRC client
- **Icon name in hicolor theme:** `dojoirc` (lowercase XDG convention) — renamed from `dojoire` which was a lazy mistake early on

### What Was Built
- Go project scaffolded at `~/Projects/DojoIRC/`
- Go module: `github.com/joehonkey/dojoire`
- Wails v2 wired in and building clean
- `internal/config/` — TOML config loader, XDG-aware (`~/.config/dojoire/config.toml`)
- `internal/irc/` — IRC client (connect, TLS, join, PRIVMSG receive)
- `internal/tray/` — system tray via `getlantern/systray`, icon embedded from `build/icons/linux/`
- Frontend UI: sidebar (server/channel list), message buffer, nicklist, input bar
- Default theme: Catppuccin Mocha color scheme via CSS variables
- `OnBeforeClose` hides window to tray instead of quitting
- Platform icon sets extracted from DojoIRC-icon-pack.zip into `build/icons/`
- Wails build icons placed: `build/appicon.png`, `build/darwin/AppIcon.icns`, `build/windows/icon.ico`
- `.desktop` file installed at `~/.local/share/applications/dojoirc.desktop`
- Icons installed to hicolor theme at `~/.local/share/icons/hicolor/`
- `CLAUDE.md`, `ROADMAP.md`, `CHANGELOG.md` created
- GitHub repo created: https://github.com/joehonkey/DojoIRC

---

## Session 2 — 2026-05-22 (Full UI + Fixes)

### What Was Built
- IRC engine fully wired to the UI — events flow from Go to JS via Wails EventsEmit
- Slash commands: `/nick /whois /join /part /me /msg /query /away /back /topic /kick /mode /invite /raw /quit /help`
- Server buffer — click a server name in the sidebar to see MOTD, connection notices, WHOIS output
- Nick colorization — consistent hash-based color per nick using Catppuccin palette
- Nick list with op/voice/halfop sorting, prefixes, and colors
- Right-click context menu on channels to leave (PART)
- Multi-server sidebar with unread badges
- URL linkification in messages — all http/https URLs become clickable
- URL preview cards — inline og:/twitter card metadata below each link (fetched async, cached)
  - Image-only URLs render as inline thumbnails
  - Clicking a link or card opens in the system browser via `runtime.BrowserOpenURL`
- Theme system — `internal/theme/` loads `themes/*.toml`, bound `GetTheme()` method returns JSON to JS
  - JS applies theme via CSS custom properties (`applyTheme()`)
  - Theme search path: `~/.config/dojoire/themes/` → `<exe-dir>/themes/` → `themes/`
- `internal/preview/` — og:/twitter card fetcher (5s timeout, 128KB limit, private IP blocked)
- `internal/irc/client.go` additions: KICK, MODE, TOPIC/332, NOTICE, 353 (NAMES), WHOIS replies (311–319), server stats (251–266), MOTD (372/375/376)
- `app.go` additions: `shutdown()`, `FetchURLPreview()`, `BrowserOpen()`, `GetTheme()`, `JoinChannel()`, `SendNick()`, `SendWhois()`, `SendRaw()`, `SendAction()`

### Fixes
- **Blank screen (critical):** JS module initialization race — `GetServers()`/`GetTheme()` threw synchronously before `window.go` was injected, crashing the module silently. Fixed by calling `render()` immediately at boot and wrapping all Wails calls in `Promise.resolve().then()` chains so synchronous throws become caught promise rejections.
- **IRC nick lingering after quit:** `irc.Client.Quit()` now writes directly to the raw `net.Conn` with `fmt.Fprintf`, bypassing any library buffering that may already be closed during shutdown.
- **Tray Quit not quitting:** `OnBeforeClose` now checks `app.quitting` flag before deciding to hide vs quit. Tray `OnQuit` sets the flag, calls `app.shutdown()`, then `runtime.Quit()`.
- **Theme files not found:** Added `os.Executable()` path to theme search so binary at `build/bin/` can find `build/bin/themes/`.
- **Config was empty:** `~/.config/dojoire/config.toml` needed a `[[server]]` block — runtime does not create one automatically.

### Runtime Notes
- Build: `~/go/bin/wails build -tags webkit2_41` (run `npm run build` in `frontend/` first if wails -clean was used)
- Run on KDE Wayland: `DISPLAY=:1 GDK_BACKEND=x11 ./build/bin/DojoIRC` — forces XWayland backend; native Wayland GTK backend has rendering issues with this WebKit version
- Env vars set in `main.go` before `wails.Run`: `WEBKIT_DISABLE_DMABUF_RENDERER=1`, `WEBKIT_DISABLE_COMPOSITING_MODE=1` — prevents blank webview on AMD/Mesa setups with webkit2gtk 2.52.x

---

## Session 3 — 2026-05-22 (UX Polish + Config)

### What Was Built
- **Hamburger menu** (`☰` left of "DojoIRC" in sidebar header) with: Theme picker, Open Config, Reload Config, Quit
- **Topic toggle** — pill button in buffer header shows/hides the channel topic
- **Draggable panel resize** — sidebar and nicklist widths draggable via 4px handles; min/max enforced
- **Panel width persistence** — sidebar and nicklist widths saved to `localStorage` on drag release, restored on next launch
- **Typing indicators** — IRCv3 `draft/typing` via TAGMSG; outgoing debounced (active/paused/done); incoming shown above input bar with multi-user support
- **Nick list stored Go-side** — `app.go` accumulates nicks from 353/NAMES events; JS fetches via `GetNickList()` on demand
- **Unread dots** — colored circles left of channel names replace number badges (accent = unread, yellow = mention)
- **Sidebar pre-populated from config** — channels from config.toml appear before IRC connects
- **DM windows** — click/right-click nick in messages or nicklist opens a query buffer; right-click channel → close DM or leave channel
- **URL preview cards** — og:/twitter card metadata shown inline below links; image-only URLs render as thumbnails
- **Theme switcher** — scrollable A-Z picker panel instead of cycle button; shows active theme highlighted; `GetThemeNames()` scans all theme directories; `SaveTheme()` persists selection to config.toml
- **Reload Config** — re-reads config.toml live; applies font, font_size, theme without restart
- **Open Config** — opens `~/.config/dojoirc/config.toml` in the system's default text editor (kate on KDE); bootstraps from embedded example if missing
- **Paste in input** — right-click context menu with Paste using `runtime.ClipboardGetText` (no external tools needed)
- **Context menu overflow fix** — menus near screen bottom/right flip upward/leftward to stay in viewport
- **BreezeDarkPlus theme** — ported from KDE Breeze Dark Plus Halloy theme
- **Icons** — recommended linux icon set installed to `~/.local/share/icons/hicolor/` (16–1024px) and `build/icons/linux/`; `build/appicon.png` updated; KDE icon cache refreshed
- **Nick/timestamp spacing** — removed `min-width: 90px` from `.msg-nick`; nick now sits naturally close to timestamp

### Fixes
- **Config dir wrong:** `dojoire` → `dojoirc` in `internal/config/config.go Dir()` and `config.toml.example`; existing config moved from `~/.config/dojoire/` to `~/.config/dojoirc/`
- **Open Config opened Okular:** `xdg-open file.toml` used `.toml` mime type → Okular. Fixed by calling well-known editor binaries directly (`kate` first, then others); no xdg-open or gtk-launch
- **Paste returned empty:** no wl-paste/xclip/xsel installed. Fixed by switching to `runtime.ClipboardGetText(ctx)` — Wails built-in, cross-platform, no external tools
- **Context menu items hidden at bottom:** right-click on input bar caused menu to extend off-screen. Fixed with post-render `getBoundingClientRect()` flip

### Key Decisions
- `openInEditor` tries well-known GUI editor binaries directly rather than going through xdg-mime/gtk-launch — more reliable when spawned from a non-interactive session
- Clipboard via Wails runtime avoids a hard dependency on clipboard CLI tools (none were installed)
- `localStorage` chosen for panel widths — no Go backend needed, survives restarts, zero config
- Theme state tracked as `currentTheme` string instead of an index into a hardcoded array — works with arbitrary user-added themes

---

## Session 4 — 2026-05-22 (Icon Clean Redo)

### What Was Done
- **Complete icon redo** — wiped all previous build icons and reinstalled from `/home/joe/icons/DojoIRC/DojoIRC-scalable-os-icons/`
  - `build/appicon.png` ← `recommended/linux/linux-512x512.png` (embedded in binary via `//go:embed`)
  - `build/darwin/AppIcon.icns` ← `mac/wails/mac.icns`
  - `build/windows/icon.ico` ← `recommended/windows/windows.ico`
  - `build/icons/linux/NxN/apps/dojoirc.png` ← `recommended/linux/` (16–1024px)
  - `build/icons/freebsd/NxN/apps/dojoirc.png` ← `recommended/freebsd/` (16–1024px)
  - `~/.local/share/icons/hicolor/NxN/apps/dojoirc.png` ← `recommended/linux/` (16–1024px)
- **KDE icon cache cleared** — `~/.cache/icon-cache.kcache`, `~/.cache/ksycoca6*` removed; `kbuildsycoca6 --noincremental` run
- **Binary rebuilt** and themes re-copied to `build/bin/`

---

## Session 5 — 2026-05-22 (Multi-server, SASL, Polish)

### What Was Built
- **SASL PLAIN authentication** — CAP negotiation expanded; if `[server.sasl]` is configured, requests `sasl` capability, sends `AUTHENTICATE PLAIN`, handles 903/904/905 responses, then sends `CAP END`
- **Multi-server Reload Config** — `ReloadConfig` now calls `connectNewServers()` which diffs the config against live clients and connects any new servers; JS reload chain also calls `GetServers()` and updates the sidebar
- **Startup double-connect fix** — `startup()`'s `time.AfterFunc` now uses `connectNewServers()` instead of an inline loop, so JS boot's `ReloadConfig()` call can't race and double-connect
- **Auto-reconnect** — IRC client `runLoop()` replaces the one-shot goroutine; on unexpected disconnect shows "Reconnecting in 10s..." in server buffer, retries until success; `Quit()` signals a quit channel to interrupt the sleep instantly
- **Right-click server → Connect / Disconnect** — context menu on server names; connected state tracked from `connected`/`disconnected` IRC events
- **Tab completion** — Tab completes nicks from current channel (cycles on repeated Tab, adds `: ` at line start); also completes slash commands after `/`; resets on any non-Tab keypress
- **Smart auto-scroll** — channel switch always scrolls to bottom; new messages scroll only if already at bottom; two-pass scroll (immediate + `setTimeout(0)`) works around webkit2gtk layout timing
- **Quit/nick event routing fix** — `quit` and `nick` events were broadcasting to all channels across all servers; now scoped to the correct server only
- **`/j` alias** — `/j #channel` works as shorthand for `/join`
- **`/clear`** — clears the current buffer
- **`/sysinfo`** — sends OS, kernel, CPU, RAM info to the current channel; reads `/proc/cpuinfo`, `/proc/meminfo`, `/etc/os-release`, `uname -r`
- **Hamburger menu additions** — Documentation (in-app panel), Restart, moved separator above Restart/Quit
- **In-app documentation panel** — styled overlay with config format, SASL setup, themes, full command table, UI tips; closes on ✕ or click outside
- **Icon redo** — wiped all icons, reinstalled from `/home/joe/Downloads/DojoIRC-scalable-os-icons/`: linux/variant-a, freebsd/variant-b, windows/variant-a; hicolor trees renamed to `dojoirc.png`; tray icon updated to linux/variant-a 32x32

### Fixes
- **Window position not remembered** — `runtime.WindowGetPosition` saved before hide, `runtime.WindowSetPosition` restored after show; bypasses GTK/WM re-centering on unmap/remap
- **Libera config format** — corrected `[servers.libera]` (Halloy format) to `[[server]]` / `[server.sasl]` (DojoIRC format) in `~/.config/dojoirc/config.toml`
