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
