# DojoIRC Changelog

## Session 32 — 2026-05-25 (v0.4.21 — security & reliability hardening)

### What Was Added
- **CI pipeline** — `.github/workflows/ci.yml` runs `go vet`, `go test`, `go test -race`, frontend build, and `govulncheck` on every push to `main` and every PR
- **Dependabot** — weekly updates for Go modules, npm, and GitHub Actions
- **SECURITY.md** — vulnerability reporting policy, scope, and security notes for users
- **`internal/cache` package** — generic LRU cache with TTL (`cache.New[V](max, ttl)`); used by URL preview backend
- **31 unit tests** — `internal/dcc` (ParseSend edge cases, IP round-trips, safeDest collision), `internal/preview` (private IP checks, parseMeta, bad schemes), `internal/config` (defaults, bad TOML, SASL parsing, behaviour overrides) — all pass clean under `-race`
- **Release checksums** — `checksums.txt` (sha256sum of all platform artifacts) now included in every GitHub release
- **New config options** in `[behaviour]`: `dcc_enabled` (toggle all DCC), `previews_enabled` (toggle URL previews), `max_dcc_file_size` (reject oversized incoming files, bytes; 0 = unlimited)
- **DCC and URL preview privacy/security notes** added to `docs/configuration.md`

### What Was Fixed / Hardened
- **Config file permissions** — `config.toml` now written `0600` instead of `0644`; prevents other local users from reading IRC passwords on multi-user systems
- **`BrowserOpen` URL validation** — backend now rejects non-`http`/`https` schemes before passing to Wails; defense-in-depth even if frontend validation is bypassed
- **`a.quitting` race** — changed from `bool` to `sync/atomic.Bool`; eliminates the data race between `OnQuit` and `OnBeforeClose` callbacks running in different goroutines
- **DCC `ParseSend`** — correctly handles quoted filenames with spaces; rejects empty filenames, negative/zero sizes, out-of-range ports
- **DCC `Receive`** — `net.DialTimeout` (30s) replaces `net.Dial` with no timeout; 2-hour transfer deadline; stops reading exactly at advertised size; uses `safeDest` to avoid overwriting existing files (renames to `file (1).ext`, `file (2).ext`, etc.)
- **DCC `Stream` (sender)** — 2-minute accept timeout; 2-hour transfer deadline; ACK read errors now checked instead of silently ignored
- **URL preview cache** — replaced unbounded `sync.Map` with `cache.LRU` (500 entries, 60-minute TTL); frontend `Map` capped at 500 entries via `previewCacheSet` helper
- **Scrollback docs/config** — config default corrected from 5000 to 500 (values above 500 were already a no-op); docs updated to describe the three-tier behavior: 500 in memory, 200 persisted, config controls the visible render slice
- **Wails CLI pinned** — release workflow now uses `@v2.12.0` instead of `@latest`; prevents surprise build changes on tag push

### Files Changed
- `app.go` — quitting atomic, BrowserOpen validation, config permissions (×4 sites), DCC/preview toggles, max file size guard
- `main.go` — quitting atomic
- `internal/config/config.go` — new Behaviour fields (`dcc_enabled`, `previews_enabled`, `max_dcc_file_size`), corrected Scrollback default
- `internal/dcc/dcc.go` — full hardening rewrite (ParseSend, safeDest, Receive, Stream)
- `internal/cache/lru.go` — new generic LRU+TTL cache package
- `internal/dcc/dcc_test.go` — new (15 tests)
- `internal/preview/preview_test.go` — new (10 tests)
- `internal/config/config_test.go` — new (6 tests)
- `frontend/src/main.js` — preview cache bounded via `previewCacheSet`
- `config.toml.example` — new `[behaviour]` section with DCC/preview toggles
- `docs/configuration.md` — new config options table rows, DCC security note, URL preview privacy note
- `ROADMAP.md` — new Security & Reliability and Testing & CI sections; items checked
- `README.md` — scrollback description corrected
- `SECURITY.md` — new file
- `.github/workflows/ci.yml` — new CI workflow
- `.github/workflows/release.yml` — Wails CLI pinned, checksums step added
- `.github/dependabot.yml` — new file

---

## Session 31 — 2026-05-24 (v0.4.19 — message persistence, render cap, UI polish)

### What Was Added
- **Message persistence** — the last 200 messages per channel are saved to localStorage and restored on next launch. Open DojoIRC and you're right back where you left off, just like Halloy. `/clear` also wipes the stored history for that channel.
- **Render cap** — messages buffer capped at 500 in memory, 200 rendered at a time. Eliminates the lag/stutter when clicking between busy channels.

### What Was Fixed
- **Channel-switch lag** — re-rendering 5 000 messages per click was slow. Render cap + in-memory cap cuts this to a fixed ceiling.
- **Image preview flicker** — preview cards were destroyed and re-injected on every render. Now embedded directly in the message HTML so images survive DOM replacement without flashing.
- **About dialog tagline** — was "IRC client for LinuxDojo.org"; now "DojoIRC is an IRCv3-capable, cross-platform IRC client".
- **Invite menu shown for nicks already in channel** — right-clicking a nick who is already present in the current channel no longer shows the pointless "Invite to #channel" option. Invite only appears when the nick is not already there.

### Files Changed
- `frontend/src/main.js` — persistence helpers, addMsg(), ensureChannel() restore, render cap, About tagline, invite fix

---

## Session 30 — 2026-05-25 (v0.4.17 — oper commands, bug fixes, perf)

### What Was Added
- **IRC operator commands** — `/oper`, `/kill`, `/kline`, `/unkline`, `/dline`, `/undline`, `/rehash`, `/wallops` — all tab-completable, listed in `/help`
- **Server error numerics surfaced** — 4xx/5xx replies (e.g. 482 not channel op, 481 not oper) now appear in the server buffer instead of being silently dropped

### What Was Fixed
- **Excess Flood disconnect** — typing indicator was sending one TAGMSG per keystroke; now rate-limited to one per 3 seconds
- **Quit/nick messages in wrong channels** — shown in every channel on the server; now scoped to channels where the nick was actually present
- **Per-server nick tracking** — `state.nick` was global; switching servers showed the wrong nick in the input bar and fired wrong mentions; now per-server via `state.nicks[server]`
- **/topic channel arg** — `/topic #chan text` now works correctly (channel name no longer doubled)
- **rAF render batching** — full app DOM was rebuilt on every event; now coalesced to one repaint per animation frame, reducing flicker on busy channels

### Files Changed
- `internal/irc/client.go` — 4xx/5xx catch-all
- `frontend/src/main.js` — all of the above
- `docs/commands.md`, `README.md` — oper commands documented
- In-app docs — IRC Operator Commands section added

---

## Session 29 — 2026-05-25 (v0.4.16 — hide nick / hide userlist toggles)

### What Was Added
- **Hide nick button** — a small ‹/› pill button sits to the left of your nick in the input bar. Click to collapse the nick; click again to restore it. State persists across restarts via localStorage.
- **Hide userlist button** — ◂/▸ pill button in the buffer header (next to the +nt modes pill) hides and shows the nicklist. State persists via localStorage. (Button now styled consistently with the modes pill — was a plain browser button before.)

### Files Changed
- `frontend/src/main.js` — `nickHidden` state, render toggle buttons, click handlers in `afterRender`
- `frontend/src/style.css` — `#nick-toggle` styles; `#nicklist-toggle` folded into shared pill rule with `#topic-toggle`

---

## Session 28 — 2026-05-25 (v0.4.15 — DCC Chat)

### What Was Added
- **DCC Chat** — both sides of the protocol are now implemented:
  - `/dcc chat <nick>` — initiates an outgoing DCC CHAT offer; waits 30s for the peer to connect
  - Incoming DCC CHAT offers show an Accept/Decline button in the query window (💬 icon)
  - Accepting opens a live TCP session; messages typed in that query window route through `DCCChatSend` automatically
  - `dcc_chat:connected` / `dcc_chat:closed` show status lines in the query buffer
  - `dcc_chat:message` delivers incoming DCC chat lines as regular messages with nick color + notifications
  - `dcc_chat:error` surfaces failures inline

### Files Changed
- `internal/dcc/dcc.go` — `ChatSender`, `NewChatSender`, `ChatDial`
- `internal/irc/client.go` — DCC CHAT CTCP parsing → `dcc_chat_offer` event
- `app.go` — `dccChats` map, `dccChatMu`, `dccChatReadLoop`, `DCCChatAccept`, `DCCChatSend`, `DCCChatInitiate`
- `frontend/src/main.js` — render, click handlers, event listeners, message routing
- `frontend/wailsjs/go/main/App.d.ts` + `App.js` — auto-generated bindings

---

## Session 27 — 2026-05-25 (DCC public IP fix)

### What Was Fixed
- **Outgoing DCC SEND now advertises public IP** — previously DojoIRC used the LAN IP (e.g. `192.168.1.6`) in the DCC SEND offer, making it unreachable from the internet. Now fetches public IP from `api.ipify.org` (5s timeout) and falls back to LAN IP if the lookup fails. Recipients can now connect when the sender has a reachable IP with port forwarding.

### Files Changed
- `internal/dcc/dcc.go` — new `PublicIP()` function
- `app.go` — `DCCSend` uses `dcc.PublicIP()` instead of `dcc.LocalIP()`

---

## Session 26 — 2026-05-24 (nick context menu, DCC fixes, docs pass)

### What Was Added
- **Nick right-click context menu** — right-click any nick in the nick list or in a message to get: Message, Whois, Version (CTCP), Ping (CTCP with RTT), Invite to current channel. Shared `nickCtxItems()` helper used by all three bind sites (nicklist, message nicks, search rebind path).

### What Was Fixed
- **DCC message routing** — `dcc:progress`, `dcc:done`, and `dcc:error` events all used `findChannel` which silently dropped messages if the buffer was closed or nick case didn't match. Switched to `ensureChannel` so done/error always land somewhere visible.
- **DCC drag-drop on non-DM buffers** — dragging a file onto a channel or server buffer now shows a clear error: `DCC SEND only works in DM windows` instead of silently doing nothing.

### Documentation
- Full pass: in-app docs, `docs/commands.md`, `README.md`, and BeeMO all updated with DCC, CTCP stack, and nick context menu coverage with examples.

### Files Changed
- `frontend/src/main.js` — `nickCtxItems()` helper, expanded context menus, DCC event routing fixes, drop error message, in-app docs (Nick Context Menu + DCC + CTCP sections)
- `docs/commands.md` — Nick interactions section with context menu table
- `README.md` — DM windows row updated, Stage 2 complete, DCC SEND + CTCP features added
- `/home/joe/Projects/llama-irc-bot/gemma4-irc-bot.py` — version v0.4.13, nick context menu, CTCP stack, DCC info

---

## Session 25 — 2026-05-24 (CTCP command stack)

### What Was Added
- **Full CTCP command stack** — `/version`, `/ping`, `/time`, `/finger`, `/clientinfo`, and the existing `/ctcp` are now all first-class slash commands with tab completion.
- **PING RTT** — `/ping <nick>` records the send timestamp; when the PING reply arrives the round-trip time is computed and displayed as `PING reply from <nick>: Nms`.
- **FINGER + CLIENTINFO auto-replies** — DojoIRC now responds to inbound CTCP FINGER (returns client name/URL) and CLIENTINFO (returns supported command list: VERSION PING TIME FINGER CLIENTINFO DCC).
- All six CTCP commands added to `SLASH_COMMANDS` for tab completion.
- `/help` and in-app Documentation updated with the new commands.

### Files Changed
- `internal/irc/client.go` — `handleCTCPRequest` adds FINGER and CLIENTINFO cases; VERSION string bumped to v0.4.12
- `frontend/src/main.js` — `pingTimes` map, `/version` `/ping` `/time` `/finger` `/clientinfo` slash cases, updated `ctcp_reply` handler (RTT), updated SLASH_COMMANDS, /help text, in-app docs

---

## Session 24 — 2026-05-24 (DCC SEND + DCC CHAT — Stage 2 complete)

### What Was Added
- **DCC SEND (incoming)** — When another user sends a `DCC SEND` CTCP offer, it appears as an inline accept/decline prompt in the DM buffer. Clicking Accept downloads the file to `~/Downloads` via a direct TCP connection. Progress shown inline (every 5%). Completion and errors displayed as system messages.
- **DCC SEND (outgoing)** — Drag a file onto an open DM/query window to initiate a DCC SEND to that user. Uses Wails `DragAndDrop.EnableFileDrop` to get native file paths. The Go backend opens a TCP listener, sends a CTCP DCC SEND to the peer, then streams the file when the peer connects. Note: outgoing DCC requires the recipient to be able to connect to your IP (may not work behind NAT without port forwarding).
- **`internal/dcc` package** — New package: `ParseSend`, `IPFromUint32`, `IPToUint32`, `LocalIP`, `DownloadsDir`, `Receive` (download), `Sender` / `NewSender` / `CTCPParam` / `Stream` (upload).
- **Stage 2 complete** — DCC is the last remaining Stage 2 item. All Stage 2 features are now shipped.

### Files Changed
- `internal/dcc/dcc.go` — new DCC protocol package
- `internal/irc/client.go` — Event struct adds `DCCFile`, `DCCIP`, `DCCPort`, `DCCSize` fields; `handleCTCPRequest` handles `DCC SEND` → emits `dcc_offer` event
- `app.go` — `DCCAccept()` and `DCCSend()` Wails bindings
- `main.go` — `DragAndDrop: &options.DragAndDrop{EnableFileDrop: true}`
- `frontend/wailsjs/go/main/App.js` + `App.d.ts` — `DCCAccept`, `DCCSend` exports
- `frontend/src/main.js` — `dcc_offer` event handler, DCC button delegation in `bindEvents`, `dcc:progress/done/error/sending/sent` Wails event listeners, `OnFileDrop` for drag-drop, `formatBytes` helper, import updates
- `frontend/src/style.css` — DCC button and progress styles

---

## Session 23 — 2026-05-24 (Stage 4 complete — search pagination)

### What Was Added
- **Search result pagination** — Ctrl+F search now shows a "N of M" match counter and ↑ ↓ navigation buttons. Enter / Shift+Enter step forward and backward through matches from the keyboard. Wrap-around at both ends. The active match gets a distinct accent-color outline highlight (`.search-current`). Completes Stage 4.

### Files Changed
- `frontend/src/main.js` — `state.searchMatchIdx`, `updateSearchCurrent()` helper, prev/next button handlers, Enter/Shift+Enter keydown handler in search input, reset on open/close, in-app docs updated
- `frontend/src/style.css` — `.search-current`, `#search-count`, `#search-prev`, `#search-next` styles
- `SESSION.md` — session handoff file introduced (local-only, not pushed)

---

## Session 22 — 2026-05-24 (docs — FreeBSD build guide expanded)

### What Changed
- **`docs/building.md`** — FreeBSD section expanded with session-verified details from a live build on FreeBSD 15.0-RELEASE-p9:
  - `GOROOT=/usr/local/go126` added to Wails CLI and DojoIRC build commands (go126 installs outside the default PATH)
  - Wails clone now pinned to `--branch v2.12.0`
  - `ghw` module cache fix expanded from a vague table note to the actual code change (add `*option.Options` arg to `load()` signature in `block_stub.go`)
  - `DISPLAY`/`XAUTHORITY` instructions added for launching from non-desktop shells (SSH, scripts)
  - Three benign startup warnings documented so builders aren't alarmed (systray D-Bus, EGL, a11y)
  - Tested-on updated from FreeBSD 15.0-RELEASE-p8 to p9
- **`SESSION.md`** — new session handoff file in project root; tracks what was done each session, open items, current state, and a session-close checklist to keep all docs (BeeMO, in-app docs, README, ROADMAP) in sync

### Files Changed
- `docs/building.md` — FreeBSD section (44 lines added, 8 changed)
- `SESSION.md` — new file

---

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
