# DojoIRC Changelog

## Session 21 — 2026-05-23 (v0.4.10 — bug fixes + Windows improvements)

### What Was Fixed / Added
- **Input draft preserved on re-render** — incoming messages triggered a full DOM rebuild that silently wiped whatever you were typing. The message-input value and cursor position are now snapshotted before each rebuild and restored after.
- **Windows Open Config fixed** — `openInEditor()` was Linux-only (fell through to `xdg-open`, `xdg-mime`, and a hardcoded list of Linux GUI editors). Now opens directly in `notepad.exe` on Windows (honors `$EDITOR`/`$VISUAL` first); `open` on macOS. An earlier attempt using `rundll32 url.dll,FileProtocolHandler` was dropped — it triggered an "Open with" dialog on systems with no `.toml` association, which caused the app window to flash repeatedly.
- **Windows focus-restore flash fixed** — the tablet keyboard feature used a `focus` event listener on the message input. When Windows restores focus to the app, WebView2 re-focuses the input, firing the listener and spawning `reg query` (a console process) — causing the window to flash on every focus restore. Switched to `pointerdown`, which only fires on actual user tap/click.
- **Windows tablet mode keyboard** — new `MaybeShowKeyboard()` backend method reads the `TabletMode` registry key under `HKCU\SOFTWARE\Microsoft\Windows\CurrentVersion\ImmersiveShell`; if tablet mode is active, focusing the message input launches `TabTip.exe` (touch keyboard) with an `osk.exe` fallback. No-op on Linux and macOS.

### Files Changed
- `app.go` — `MaybeShowKeyboard()` method; `openInEditor()` gains Windows/macOS dispatch; `goruntime` alias added for platform detection
- `frontend/src/main.js` — `render()` saves/restores input value and cursor; `MaybeShowKeyboard` imported and wired to input `focus` event in `bindEvents()`

---

## Session 20 — 2026-05-23 (v0.4.7 — release checklist + type declarations)

### What Was Added
- **`RELEASE_CHECKLIST.md`** — comprehensive 7-section checklist covering every doc location that must stay in sync on every release: code & build, in-app docs, docs/ folder, root-level docs, BeeMO, Claude memory, and git/GitHub. Includes a quick-reference table.
- **`GetVersion` TypeScript declaration** — `App.d.ts` now exports `GetVersion():Promise<string>` so the Wails type bindings are complete.

### Files Changed
- `RELEASE_CHECKLIST.md` — new file
- `frontend/wailsjs/go/main/App.d.ts` — added `GetVersion` export

---

## Session 19 — 2026-05-23 (font manager extended + full docs refresh)

### What Was Added
- **4 new font zones** — Buffer Title (#channel name in header), Channel Modes (+nt), Topic Button (pill button), Topic Text (topic content). All were previously hardcoded px values; now CSS variables controllable from the Font Sizes panel.
- **Full documentation pass** — in-app docs, `docs/font-sizes.md`, `docs/customization.md`, `README.md`, `ROADMAP.md`, `docs/faq.md`, `docs/index.md`, `docs/building.md`, and BeeMO all brought up to date with 14-zone font manager, version embedding, and all recent layout changes.

### Files Changed
- `frontend/src/main.js` — in-app Font Sizes table updated to 14 zones
- `frontend/src/style.css` — 4 new CSS variables; `#buffer-title`, `#topic-toggle`, `#buffer-modes`, `#buffer-topic` converted from hardcoded px to var()
- `docs/font-sizes.md`, `docs/customization.md`, `README.md`, `ROADMAP.md` — zone tables updated

---

## Session 18 — 2026-05-23 (version string embedded in binary)

### What Was Built
- **Version embedded in binary via ldflags** — `Version` var in `main.go` is set at build time with `-ldflags "-X main.Version=vX.Y.Z"`. Defaults to `"dev"` if not set.
- **`GetVersion()` Go binding** — exposes the version to the frontend at runtime. No more hardcoded version string in JS.
- **About panel fetches version dynamically** — calls `GetVersion()` on open; shows `…` until resolved.

### Files Changed
- `main.go` — `var Version = "dev"`
- `app.go` — `GetVersion()` method
- `frontend/wailsjs/go/main/App.js` — `GetVersion` binding
- `frontend/src/main.js` — About panel fetches version via `GetVersion()`
- `docs/building.md` — all build commands updated with `-ldflags "-X main.Version=vX.Y.Z"`

---

## Session 17 — 2026-05-23 (font size manager)

### What Was Built
- **Font size manager** — Hamburger → Font Sizes opens a live panel with +/− controls for every UI font zone. Changes apply instantly without any restart. Settings persist across sessions via `localStorage`. A "Reset to Defaults" button restores all zones at once. The panel correctly overrides both the CSS defaults and the `font_size` config.toml setting (font manager always wins).
- **Zones covered:** Sidebar Header (DOJOIRC), Hamburger Button (☰), Server Names, Channel Names, Chat Messages, Timestamps, Nick List, Typing Indicator, Input Nick Prefix, Input Field.

### Files Changed
- `frontend/src/main.js` — `FONT_ZONES` constant; `applyStoredFontSizes`, `getFontSize`, `setFontSize`, `showFontManager` functions; hamburger menu entry; `applyUIConfig` calls `applyStoredFontSizes` on every reload; `boot()` applies stored sizes at startup; in-app docs Font Sizes section rewritten
- `frontend/src/style.css` — `.fmgr-btn` and `.fmgr-btn:hover` rules for font manager buttons
- `docs/font-sizes.md` — rewritten around the new panel (CSS editing section demoted to "Advanced")
- `docs/customization.md` — Per-element font sizes section updated to point to the panel
- `README.md` — Font size manager row added to features table
- `ROADMAP.md` — Stage 4 item checked off

---

## Session 16 — 2026-05-23 (full-height nicklist, unified input bar, bot icon alignment)

### What Was Built
- **Full-height nicklist column** — nicklist moved from inside `#content` to a sibling of `#main` at the `#app` flex level. It now stretches the full window height alongside the sidebar and input bar, matching the Halloy-style layout.
- **Unified input bar** — the entire input row is now one solid color strip (`--bg-input` applied directly to `#input-bar`). The nick prefix sits inline at the left with a vertical `border-right` separator; the text input is transparent against the bar. No separate rounded box.
- **Bot icon alignment** — `.nick-item` is now `display: flex; align-items: center`. Nick text is wrapped in `.nick-text` (`flex: 0 1 auto; min-width: 0`) so it only takes natural width, and `.bot-icon` (`flex-shrink: 0`) sits immediately after the text rather than at the far right edge.

### Files Changed
- `frontend/src/main.js` — nicklist moved to `#app`-level HTML (sibling of `#main`); nick items wrap text in `.nick-text` span
- `frontend/src/style.css` — `.nick-item` flex layout; `.nick-text` / `.bot-icon` rules; `#input-bar` full-width strip; `#input-nick` with `border-right` separator; `#message-input` transparent background

---

## Session 15 — 2026-05-23 (per-platform icons + Extra Icons gallery)

### What Was Built
- **Per-platform app icons via Go build tags** — `appicon_linux.go`, `appicon_windows.go`, `appicon_darwin.go`, `appicon_freebsd.go` each embed the correct OS-mascot icon (Tux / Windows / Apple mascot / BSD Beastie) at compile time. `build/appicon.png` is now only used by Linux.
- **Per-platform system tray icons** — same build-tag approach for `internal/tray/`. Each platform embeds its own 32×32 icon. FreeBSD tray shows the BSD devil, not Tux.
- **In-app about icon from Go runtime** — added `GetAppIcon()` method on `App` that returns `base64(appIcon)` as a data URI. Frontend calls it at boot so the About panel shows the correct platform icon instead of the hardcoded Tux.
- **Extra Icons section in README** — 20 community icon variants added to `build/icons/extras/` and displayed in the GitHub README in four groups: Platform Icons, Multi-Platform, Torii Gate, Dojo Style.
- **FreeBSD app icon** — `build/freebsd/appicon.png` is the FreeBSD-specific icon. `appicon_freebsd.go` embeds it; rebuilding natively on FreeBSD now uses Beastie throughout (window, tray, about panel).

### Files Changed
- `appicon_linux.go`, `appicon_windows.go`, `appicon_darwin.go`, `appicon_freebsd.go` (new)
- `internal/tray/icon_linux.go`, `icon_windows.go`, `icon_darwin.go`, `icon_freebsd.go` (new)
- `internal/tray/icon_windows.png`, `icon_darwin.png`, `icon_freebsd.png` (new)
- `internal/tray/tray.go` — removed hardcoded embed, now in platform files
- `main.go` — removed hardcoded `//go:embed build/appicon.png`
- `app.go` — added `GetAppIcon()` returning base64 data URI
- `frontend/wailsjs/go/main/App.js` — added `GetAppIcon` binding
- `frontend/src/main.js` — `DOJOIRC_ICON` now fetched at boot via `GetAppIcon()`
- `build/icons/extras/` — 20 icon PNG files
- `README.md` — Extra Icons section

---

## Session 14 — 2026-05-23 (bouncer support)

### What Was Built
- **Bouncer support (ZNC / soju)** — added `password` field to the server block config. When set, DojoIRC sends `PASS <password>` immediately after `CAP LS 302` during connection, before `NICK`/`USER`. This is the standard handshake bouncers require. ZNC users set `password = "user/network:password"`; soju users set `password = "user:password"` (or continue using SASL PLAIN, which also works).

### Docs Updated
- `docs/configuration.md` — added `password` to the server options table; added full Bouncer section with ZNC and soju config examples
- `README.md` — added Bouncer support row to features table; added Bouncer quick-start section; Stage 5 roadmap updated
- `ROADMAP.md` — bouncer support checked off in Stage 5

### Key Decisions
- Three-line Go change: `PASS` sent raw after `CAP LS 302` in `dial()` — no new config types, no special bouncer mode, just the password field wired up.
- soju SASL PLAIN already worked; `password` field gives an alternative that also covers ZNC.

---

## Session 13 — 2026-05-23 (post-v0.4.0 fixes + docs overhaul)

### What Was Fixed
- **/sysinfo missing local echo** — `/sysinfo` sent output to the channel via `SendMessage` but never pushed to `ch.messages`, so the user who ran it never saw their own output. Added the same local push + render that regular messages use.

### What Was Built
- **Documentation panel search** — a search input appears to the right of the "DojoIRC — Documentation" header in the hamburger docs overlay. Typing filters sections in real time (sections not matching the query are hidden); the first matching section scrolls into view. Clearing restores all sections. Implemented by grouping the flat docs body HTML into per-`h2` section divs post-mount and toggling their visibility on input.
- **In-app docs updated for v0.4.0** — added Message Search, Emoji, and Input History sections; updated Keyboard Shortcuts table (↑/↓ history row, shortcode Tab entry); updated Tab Completion section to list all three completion types.
- **FreeBSD build documented** — full build guide in `docs/building.md`: `pkg install` commands, PATH setup, Wails patching with `replace` directive, build flags, run notes, and a complete table of every Wails file added or patched for FreeBSD support. ROADMAP Stage 6 updated to reflect FreeBSD confirmed working on FreeBSD 15 / KDE Plasma 6 / X11.
- **Emoji shortcode reference** — full 67-entry shortcode table added to `docs/keyboard-shortcuts.md`; emoji FAQ section added to `docs/faq.md` covering all three input methods and scope of conversion.
- **Input history added to ROADMAP** — was shipped in v0.4.0 but missing from Stage 4 checklist.

### Key Decisions
- Docs search groups children into section divs post-mount (not in the HTML template) so the template stays readable and the grouping logic is a single pass over `body.children`.
- FreeBSD Wails patches use a `replace` directive in `go.mod` pointing to a local patched clone — no upstream fork required, easy to update when Wails adds official FreeBSD support.

---

## Session 12 — 2026-05-23 (v0.4.0 — emoji, input history, version bump)

### What Was Built
- **Emoji shortcodes** — type `:shortcode:` in any message and it converts to the emoji on send (`:fire:` → 🔥, `:thumbsup:` → 👍, `:heart:` → ❤️, 67 shortcodes total); `applyShortcodes()` runs a regex replace before the message is dispatched.
- **Emoji picker** — 😊 button to the right of the message input opens an overlay picker: 7 categories (Smileys, Gestures, Hearts, Animals, Food, Objects, Symbols), ~175 emoji total, live name-search, active category tab highlight; clicking inserts at cursor and closes.
- **Tab shortcode completion** — typing `:word` and pressing Tab completes to the first matching emoji character (e.g. `:fir` + Tab → 🔥); cycles through multiple matches.
- **Input history navigation** — Up/Down arrows in the message input cycle through previously sent messages; draft is preserved so Down from the oldest entry restores whatever you were typing.
- **Version bumped to v0.4.0** — About panel updated; ROADMAP Stage 4 emoji checkbox checked.

### Key Decisions
- History stored as raw text (pre-shortcode) so pressing Up shows what you typed, not the converted form.
- Emoji picker closes on outside click via a one-shot `click` listener added with `setTimeout` to avoid the button click that opened it.
- Picker repositions left-edge to stay on-screen for narrow windows.
- Tab shortcode completion inserts the emoji character directly (not the shortcode name) so the result in the input matches what will be sent.

---

## Session 11 — 2026-05-23 (Stage 4 UX — search, keyboard shortcuts, scrollback)

### What Was Built
- **Message search (Ctrl+F)** — search bar appears in the buffer header; messages matching the query stay at full opacity, non-matching dim to 20%; first match scrolls into view; Escape or ✕ closes search and refocuses the message input; a ⌕ icon button also opens search.
- **Keyboard shortcuts** — registered once at boot (not re-bound on every render):
  - Alt+↑ / Alt+↓ — navigate previous/next channel or DM buffer in sidebar order
  - Alt+← / Alt+→ — jump to previous/next server's first channel
  - Ctrl+F — toggle message search
  - Escape — close search
- **Scrollback limit** — `renderMessages()` slices the message array to the last `state.scrollback` entries (default 5000); `GetScrollback()` Go method reads `config.toml [behaviour] scrollback`; prevents DOM from growing unbounded on busy channels.
- **Topic bar pop-out** (committed last session) — full-width wrapping bar below the header; links in topics are clickable.

### Key Decisions
- Search updates `#messages` innerHTML in-place (not a full render) so the search input keeps focus while typing — no re-bind tricks needed.
- `rebindMessageNicks()` helper re-attaches nick click/contextmenu handlers after the in-place messages update.
- Navigation helpers (`navigateChannel`, `navigateServer`, `switchToBuffer`) extracted from inline event handlers so both click and keyboard paths call the same code.
- Scrollback enforced at render time (slice), not at push time — simpler, zero refactor of all push sites, and good enough for the DOM performance goal.

---

## Session 10 — 2026-05-23 (Stage 2 completion + fixes)

### What Was Fixed
- **Right-click copy broken** — `document.execCommand('copy')` ran after the context menu click had already cleared the selection. Fixed by capturing `sel.toString()` at `contextmenu` event time and passing it as a closure into the menu action. Switched from `navigator.clipboard.writeText` to Wails-native `ClipboardSetText` for reliable clipboard access in the WebKit2GTK webview.
- **Ghost tray icon on kill** — killing DojoIRC with `pkill`/`kill` skipped `systray.Quit()`, leaving the DBus StatusNotifierItem registered. Fixed by adding a SIGTERM/SIGINT signal handler in `startup()` that routes to `AppQuit()` for a clean shutdown.

### What Was Built
- **CAP LS 302 multiline negotiation** — CAP LS response accumulator waits for the full server capability list before building the REQ batch; only requests caps the server actually advertises, preventing all-or-nothing NAK failures.
- **Away status** — `305`/`306` numerics update an **away** badge shown next to your nick in the input bar. `/away` and `/back` work as before; the badge confirms server acknowledgment.
- **`away-notify`** — added to CAP negotiation; incoming AWAY messages from users in shared channels are processed.
- **`/list` channel browser** — opens a streaming overlay panel that populates in real time as 322 entries arrive. Filter by name, topic, or user count. Click any row to join. Shows live "Loading… N channels" count while the LIST response is in flight.
- **Ignore list** — per-server `ignore = ["nick1", "nick2"]` in config.toml. Messages, actions, and notices from ignored nicks are silently dropped.

### Key Decisions
- `ClipboardSetText` (Wails runtime, Go-backed) preferred over Web Clipboard API — WebKit2GTK in a non-browser context cannot reliably access `navigator.clipboard` without additional permissions plumbing.
- SIGTERM handler placed in `startup()` next to the existing lifecycle hooks; `AppQuit()` already handles `systray.Quit()` + `logger.CloseAll()` + `runtime.Quit()`.
- Channel list panel uses streaming model (renders each 322 as it arrives) rather than buffering all entries and rendering once — feels faster on large servers.

---

## Session 9 — 2026-05-22 (v0.3.1 hotfix release)

### What Was Done
- **Discovered release gap** — the v0.3.0 tag was created at commit `9c73b77` (channel modes / server-time), before the About DojoIRC panel (b39fe39) and hamburger menu reorder (ef2bc28) were committed; release binaries were therefore missing those features
- **Bumped version string** — `frontend/src/main.js` About panel updated from v0.3.0 → v0.3.1
- **Tagged and pushed v0.3.1** — tag pushed to origin; GitHub Actions CI triggered and built fresh Linux / Windows / macOS artifacts
- **Rebuilt local binary** — `wails build -tags webkit2_41`; local `build/bin/DojoIRC` now shows v0.3.1 in About panel

### Key Decisions
- Chose v0.3.1 patch bump (not a re-tag of v0.3.0) to keep release history clean and avoid force-pushing tags
- `releases/latest/download/` links in README are dynamic — no README change required for the download links themselves

---

## Session 8 — 2026-05-22 (NickServ, Modes, server-time, About, v0.3.0)

### What Was Built
- **NickServ identify flow** — if `nickserv_password` is set in config, sends `PRIVMSG NickServ :IDENTIFY <password>` after end-of-MOTD (376) or no-MOTD (422); status shown in server buffer; documented in `config.toml.example`
- **Channel modes display** — `+modes` pill appears in the buffer header next to the channel name; updated in real time as MODE messages arrive; modes that take parameters (op, voice, ban, key, etc.) are excluded from the display so only true channel flags show (e.g. `+nst`); auto-requests `MODE #channel` after 366 (end of NAMES) so modes populate on join without a manual `/mode` command; handles 324 RPL_CHANNELMODEIS for initial mode state
- **IRCv3 `server-time`** — added `server-time` to CAP negotiation; incoming `time` tag on messages overrides the local clock timestamp; message timestamps now reflect server time when the server supports it
- **About DojoIRC panel** — Hamburger → About DojoIRC shows app icon, version, stack, IRCv3 capabilities, license, author, and a clickable GitHub link
- **Hamburger menu reorder** — About DojoIRC, Theme, Documentation, Open Config, Reload Config, Restart, Quit
- **Linux `.desktop` file** — `build/linux/DojoIRC.desktop` added to the repo; baked into the Wails Linux build; installed to `~/.local/share/applications/` for KDE/freedesktop app recognition; includes `StartupWMClass=DojoIRC`
- **v0.3.0** — CTCP VERSION string bumped; v0.3.0 tag pushed; GitHub Actions release workflow produced Linux/Windows/macOS artifacts

### Key Decisions
- NickServ identify fires after 376/422 (not 001) — the connection is fully established at that point and SASL has already completed
- Channel mode tracker uses a `Set` per channel; modes that consume a parameter are skipped so user-targeted modes (op, voice, ban) don't pollute the channel flags display
- App icon embedded in About panel as a base64 data URL — avoids path dependencies in the Vite/Wails bundle
- `.desktop` file uses full binary path for `Exec=` (matching how Halloy's desktop file works) so KDE's plasma-systemmonitor recognizes DojoIRC as an Application rather than a raw process

---

## Session 7 — 2026-05-22 (Code Review Fixes)

### What Was Fixed
- **wails.json** — removed duplicate `outputfilename` key
- **CTCP VERSION string** — updated reply from `v0.1.0` to `v0.2.0`
- **ROADMAP.md** — checked off WHOIS, nick list, CTCP, highlights, notifications, logging in Stage 2
- **URL preview SSRF hardening** — `internal/preview/preview.go` now uses a custom `safeDial` function that resolves the hostname via DNS first, checks every resolved IP against private/loopback ranges before connecting; extracted `isPrivateIP(net.IP)` used by both the dialer and the pre-fetch hostname check

---

## v0.2.0 — 2026-05-22

### Added
- **CTCP** — auto-replies to `VERSION`, `PING`, `TIME` from other clients; `/ctcp <nick> <cmd>` to query others; replies appear in server buffer
- **54 themes** — ported all themes from themes.halloy.chat (Dracula, Nord, Gruvbox, One Dark, Tokyo Night Storm, Catppuccin variants, Rose Piné variants, Kanagawa, Solarized Dark, Zenburn, Cyberpunk, Matrix, and 38 more)
- **Theme gallery** — `docs/themes-gallery.md` showing every theme with live hex color swatches
- **Nick list op/voice colors** — `@` ops, `+` voice, `%` halfop prefixes colored per theme (`[nicklist] op/voice/halfop` keys); CSS variables `--nick-op`, `--nick-voice`, `--nick-halfop` wired through `applyTheme`
- **Live nick list updates** — JOIN adds nick immediately; PART/QUIT/KICK remove it in real time; `/nick` renames in place preserving prefix; no longer waits for the next NAMES refresh
- **Message logging** — all messages, actions, and notices written to `~/.config/dojoirc/logs/<server>/<channel>.log`; appended across restarts; handles flushed cleanly on quit
- **Nick tracking** — `currentNick` field on IRC client updated on 001 and NICK so CTCP VERSION always replies with the current nick
- **Direct OS download links** — README OS icons link directly to platform-specific release assets; `themes.zip` as a standalone release asset
- **GitHub Actions release workflow** — Linux (ubuntu-24.04), Windows, macOS build jobs; produces `DojoIRC-linux-amd64.tar.gz`, `DojoIRC-windows-amd64.zip`, `DojoIRC-macos-arm64.tar.gz`, `themes.zip`
- **Full documentation** — `docs/` folder with 7 files: installation, configuration, commands, themes, font-sizes, ircv3, building; linked from README

### Fixed
- Theme TOML structure corrected — ported themes now use the proper `[general]`, `[sidebar]`, `[buffer]`, `[highlights]`, `[nicklist]`, `[input]` sections
- Timestamp font size matched to chat text (13px)
- CSS font-size variables wired into all selectors (were declared in `:root` but not applied)

---

## Session 6 — 2026-05-22 (Themes, CTCP, Logging, Docs)

### What Was Built
- **Nick mention detection** — regex match on incoming messages; mention rows get `.mention` class (red tint); `ch.mentions` counter drives yellow unread dot in sidebar
- **Desktop notifications** — Web Notifications API; fires on mention if channel is not active + focused; permission requested at boot
- **CSS font-size variables fully wired** — all selectors now use `var(--font-size-*)` instead of hardcoded px; timestamp bumped from 11px to 13px to match chat
- **Complete docs/ folder** — 7 Markdown files covering all features; docs bar added to README
- **README overhaul** — centered logo, platform icon table, features table, IRCv3 capability table, roadmap summary, download badge
- **ROADMAP.md additions** — added `sts`, `utf8only`, `draft/message-redaction`, `draft/account-registration`, `draft/channel-rename`, `WHOX` to Stage 3
- **54 themes from themes.halloy.chat** — decoded binary color format from halloy:// URLs; converted all 50 themes to DojoIRC TOML; placed in `themes/` and `~/.config/dojoirc/themes/`; theme gallery page generated with shields.io color swatches
- **CTCP** — `handleCTCPRequest` in `client.go` for VERSION/PING/TIME; NOTICE handler detects CTCP replies; `SendCTCP` method + `app.go` binding + `/ctcp` slash command in frontend
- **Nick list role colors** — op/voice/halfop prefix symbols colored by `[nicklist]` theme keys; `.op .nick-prefix`, `.voice .nick-prefix` CSS rules added
- **Live nick list** — JOIN/PART/QUIT/KICK/NICK all update `ch.nicks` in the frontend directly; `sortNicks()` helper extracted and reused
- **Message logging** — `internal/logger/logger.go`; keyed file handles per server+channel; `onEvent()` dispatcher in `app.go` centralizes emit + logging; `logger.CloseAll()` on shutdown
- **GitHub Actions CI** — `release.yml` triggered on `v*` tags; three parallel build jobs + `package-themes` job; `themes.zip` uploaded as standalone asset; v0.2.0 tag pushed and release published

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
