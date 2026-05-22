# DojoIRC Changelog

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

### Known Issues / Next Up
- IRC engine not yet wired to the UI — messages only log to stdout
- UI state is hardcoded mock data — needs real IRC data flow
- FreeBSD tray needs D-Bus/ksni implementation (same as halloy fork approach)
- `config.toml` not loaded on startup yet
