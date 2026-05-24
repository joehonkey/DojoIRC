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
~/go/bin/wails build -tags webkit2_41 -ldflags "-X main.Version=v0.4.6"
cp -r themes build/bin/
```

The `-tags webkit2_41` flag is required on Linux. Without it, Wails defaults to webkit2gtk-4.0 which is not installed. The `-ldflags "-X main.Version=vX.Y.Z"` flag embeds the version string shown in the About panel — update it to match the release tag.

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

Clone Wails v2.12.0 and apply the FreeBSD patches from the DojoIRC repo:

```sh
git clone --depth=1 --branch v2.12.0 https://github.com/wailsapp/wails /home/you/wails
# apply the FreeBSD patches (see Wails FreeBSD patches table below for the full list)
```

Then add a `replace` directive to DojoIRC's `go.mod` so it uses your local patched copy:

```
replace github.com/wailsapp/wails/v2 => /home/you/wails/v2
```

**Fix the `ghw` module cache signature mismatch** (one-time per machine; redo if you run `go clean -modcache`):

```sh
chmod u+w ~/go/pkg/mod/github.com/jaypipes/ghw@v0.21.3/pkg/block/block_stub.go
```

Edit that file so `load()` accepts `*option.Options`:

```go
// add this import:
"github.com/jaypipes/ghw/pkg/option"

// change the signature from:
func (i *Info) load() error {

// to:
func (i *Info) load(_ *option.Options) error {
```

Build and install the patched `wails` CLI:

```sh
cd /home/you/wails/v2/cmd/wails
GOROOT=/usr/local/go126 PATH=/usr/local/go126/bin:$PATH GONOSUMDB='*' GOFLAGS="-mod=mod" go install .
```

### Build DojoIRC

```sh
git clone https://github.com/joehonkey/DojoIRC
cd DojoIRC
export GOROOT=/usr/local/go126
export PATH=/usr/local/go126/bin:/usr/local/lib/node_modules/corepack/shims:~/go/bin:$PATH
GONOSUMDB='*' GOFLAGS="-mod=mod" wails build -tags webkit2_41 -ldflags "-X main.Version=v0.4.11"
cp -r themes build/bin/
```

The `-tags webkit2_41` flag is required on FreeBSD, the same as on Linux. Update the `-X main.Version` value to match the release tag.

### Run

```sh
./build/bin/DojoIRC
```

When launching from within a desktop session, `DISPLAY` is picked up automatically. If you launch from a terminal or script that doesn't inherit the session environment (e.g. SSH without X forwarding), supply `DISPLAY` and `XAUTHORITY` manually:

```sh
# find the cookie file for :0
xauth -f /tmp/xauth_<file> list
DISPLAY=:0 XAUTHORITY=/tmp/xauth_<file> ./build/bin/DojoIRC
```

**Expected startup warnings (all benign):**

```
systray error: failed to register: The name org.kde.StatusNotifierWatcher was not provided by any .service files
libEGL warning: failed to get driver name for fd -1
WARNING: Can't connect to a11y bus: Could not connect: Permission denied
```

These fire during binding generation when no live D-Bus tray watcher is present, when WebKit probes for hardware EGL without a DRM context, and when the accessibility bus isn't running. None affect the running app.

Tested on: **FreeBSD 15.0-RELEASE-p9 amd64**, KDE Plasma 6 / X11, SDDM (`startplasma-x11`), kwin_x11 compositor. WebKit2GTK 4.1 (2.46.6). Window renders correctly with no visual glitches — identical appearance and behaviour to the Linux build. System tray works fully.

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
~/go/bin/wails build -ldflags "-X main.Version=v0.4.6"
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
wails build -ldflags "-X main.Version=v0.4.6"
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
