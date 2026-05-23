# Building from Source

## Requirements (all platforms)

- **Go 1.21+** — [https://go.dev/dl/](https://go.dev/dl/)
- **Node.js 18+** — [https://nodejs.org/](https://nodejs.org/)
- **Wails v2** — install with:
  ```bash
  go install github.com/wailsapp/wails/v2/cmd/wails@latest
  ```

---

## Linux

### Additional requirement

webkit2gtk-4.1 development libraries (not 4.0):

```bash
# Arch Linux
sudo pacman -S webkit2gtk-4.1

# Ubuntu 24.04 / Debian
sudo apt install libgtk-3-dev libwebkit2gtk-4.1-dev

# Fedora
sudo dnf install gtk3-devel webkit2gtk4.1-devel
```

### Build

```bash
git clone https://github.com/joehonkey/DojoIRC
cd DojoIRC
~/go/bin/wails build -tags webkit2_41
cp -r themes build/bin/
```

The `-tags webkit2_41` flag is required on Linux. Without it, Wails defaults to webkit2gtk-4.0 which is not installed.

Binary lands at `build/bin/DojoIRC`. The `themes/` folder must stay next to it.

### Run

```bash
./build/bin/DojoIRC
```

On KDE Wayland, if you get a blank window:

```bash
GDK_BACKEND=x11 ./build/bin/DojoIRC
```

---

## FreeBSD

DojoIRC builds and runs on FreeBSD 15+ (amd64). The system tray, WebKit frontend, and all features work identically to Linux. The GTK/WebKit2GTK layer is essentially the same between the two platforms.

> **Note:** Wails v2.12.0 has no upstream FreeBSD support. Building requires a locally patched copy of Wails. See [Wails patches](#wails-freebsd-patches) below.

### Package dependencies

```sh
sudo pkg install go126 webkit2-gtk_41
```

Node.js is typically already present. If not: `sudo pkg install node`.

Make sure `npm` is reachable — on FreeBSD it may live under corepack:

```sh
export PATH=$PATH:/usr/local/lib/node_modules/corepack/shims
```

### Patch and install Wails

Clone Wails and apply the FreeBSD patches from the DojoIRC repo:

```sh
git clone https://github.com/wailsapp/wails /home/you/wails
# apply the FreeBSD patches (see docs/freebsd-wails-patches.md for the full list)
```

Then add a `replace` directive to DojoIRC's `go.mod` so it uses your local patched copy:

```
replace github.com/wailsapp/wails/v2 => /home/you/wails/v2
```

Build and install the patched `wails` CLI:

```sh
cd /home/you/wails/v2/cmd/wails
go install .
```

### Build DojoIRC

```sh
git clone https://github.com/joehonkey/DojoIRC
cd DojoIRC
export PATH=$PATH:/usr/local/go126/bin:/usr/local/lib/node_modules/corepack/shims:~/go/bin
GONOSUMDB='*' GOFLAGS="-mod=mod" wails build -tags webkit2_41
cp -r themes build/bin/
```

The `-tags webkit2_41` flag is required on FreeBSD, the same as on Linux.

### Run

```sh
./build/bin/DojoIRC
```

No `GDK_BACKEND` or `DISPLAY` overrides are needed. The binary picks up the session's `DISPLAY` automatically.

Tested on: **FreeBSD 15.0-RELEASE-p8 amd64**, KDE Plasma 6 / X11, SDDM (`startplasma-x11`), kwin_x11 compositor. WebKit2GTK 4.1 (2.46.6). Window renders correctly with no visual glitches — identical appearance and behaviour to the Linux build. System tray works fully.

### Wails FreeBSD patches

The following changes are required to make Wails v2 build and run on FreeBSD. The GTK/WebKit frontend is reused from the Linux implementation — FreeBSD just needs build-tag and stub additions.

**New files added:**

| File | Purpose |
|---|---|
| `internal/system/operatingsystem/os_freebsd.go` | OS info stub |
| `internal/system/system_freebsd.go` | System discovery stub |
| `cmd/wails/internal/dev/dev_freebsd.go` | Process group / signal helpers |
| `internal/frontend/desktop/desktop_freebsd.go` | Routes FreeBSD to the GTK/WebKit frontend |
| `internal/frontend/desktop/linux/gettid_linux.go` | Splits `unix.Gettid()` out into a platform-specific helper |
| `internal/frontend/desktop/linux/gettid_freebsd.go` | FreeBSD thread ID via `thr_self` syscall (432) |
| `pkg/assetserver/webview/request_freebsd.go` | WebKit URI scheme request handler |
| `pkg/assetserver/webview/responsewriter_freebsd.go` | WebKit URI scheme response writer |

**Existing files patched:**

| File | Change |
|---|---|
| `cmd/wails/build.go` | Added `freebsd`, `freebsd/amd64`, `freebsd/arm64` to valid platform list |
| `pkg/commands/build/packager.go` | Added `freebsd` case (no-op packaging) |
| `internal/frontend/desktop/linux/*.go` | Build tags changed from `linux` to `linux \|\| freebsd` |
| `internal/frontend/desktop/linux/window.h` | Added `typedef unsigned long ulong` guard |
| `internal/frontend/desktop/linux/invoke.go` | Replaced `unix.Gettid()` with local `gettid()` helper |
| `pkg/assetserver/webview/webkit2_*.go` | Build tags changed to `(linux \|\| freebsd) && ...` |
| `internal/app/app_default_unix.go` | Added `freebsd` to build constraint |
| `internal/app/app_preflight_unix.go` | Added `freebsd` to build constraint |
| `github.com/jaypipes/ghw` (module cache) | Fixed `block_stub.go` — `load()` signature mismatch |

---

## macOS

### Build

```bash
git clone https://github.com/joehonkey/DojoIRC
cd DojoIRC
~/go/bin/wails build
cp -r themes build/bin/
```

Wails produces a `.app` bundle at `build/bin/DojoIRC.app`. The `themes/` folder should be placed alongside it.

macOS may block the app on first run. Go to **System Settings → Privacy & Security → Open Anyway**.

---

## Windows

### Build

Open a PowerShell terminal:

```powershell
git clone https://github.com/joehonkey/DojoIRC
cd DojoIRC
wails build
Copy-Item -Recurse themes build\bin\
```

Binary lands at `build\bin\DojoIRC.exe`.

---

## Development mode

Wails includes a dev server with hot reload for the frontend:

```bash
~/go/bin/wails dev -tags webkit2_41   # Linux
~/go/bin/wails dev                    # macOS / Windows
```

This opens the app with a live-reloading webview. Go backend changes require a restart; frontend (CSS/JS) changes reload automatically.

---

## Project structure

```
DojoIRC/
├── main.go                     # Wails entry point + system tray
├── app.go                      # Backend API bound to JS
├── internal/
│   ├── config/config.go        # TOML config loader
│   ├── irc/client.go           # IRC engine (gopkg.in/irc.v3)
│   ├── preview/preview.go      # URL/og: metadata fetcher
│   ├── theme/theme.go          # TOML theme loader
│   └── tray/tray.go            # System tray (getlantern/systray)
├── frontend/src/
│   ├── main.js                 # All UI logic and IRC event handling
│   ├── style.css               # All styles (CSS variables for theming)
│   └── app.css                 # Component overrides
├── themes/                     # Bundled theme files
├── build/
│   ├── appicon.png             # App icon
│   ├── darwin/                 # macOS build assets
│   ├── windows/                # Windows build assets
│   └── icons/                  # Platform icon sets
└── docs/                       # This documentation
```
