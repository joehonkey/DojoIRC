# Installation

## Linux

### Requirements

- webkit2gtk-4.1 (not 4.0)

On Arch Linux:
```bash
sudo pacman -S webkit2gtk-4.1
```

On Ubuntu 24.04 / Debian:
```bash
sudo apt install libwebkit2gtk-4.1-0
```

On Fedora:
```bash
sudo dnf install webkit2gtk4.1
```

### Install

1. Download `DojoIRC-linux-amd64.tar.gz` from the [latest release](https://github.com/joehonkey/DojoIRC/releases/latest)
2. Extract it:
   ```bash
   tar -xzf DojoIRC-linux-amd64.tar.gz
   ```
3. Run:
   ```bash
   ./DojoIRC
   ```

The `themes/` folder must stay in the same directory as the binary.

### KDE Wayland

webkit2gtk has rendering issues on some KDE Wayland setups. If you get a blank window, run with:

```bash
GDK_BACKEND=x11 ./DojoIRC
```

This forces XWayland rendering and solves the issue.

### Desktop Entry

A `.desktop` file is included in the release archive. Install it so DojoIRC appears in your application launcher and is recognized by KDE System Monitor:

```bash
cp DojoIRC.desktop ~/.local/share/applications/
update-desktop-database ~/.local/share/applications/
```

Update the `Exec=` path inside the file to match wherever you placed the binary.

---

## macOS

1. Download `DojoIRC-macos-arm64.tar.gz` from the [latest release](https://github.com/joehonkey/DojoIRC/releases/latest)
2. Extract it:
   ```bash
   tar -xzf DojoIRC-macos-arm64.tar.gz
   ```
3. On first launch, macOS may block it. Go to **System Settings → Privacy & Security** and click **Open Anyway**
4. Run `DojoIRC.app` or the extracted binary

> The current release is built for Apple Silicon (arm64). Intel Mac users should [build from source](building.md).

---

## Windows

1. Download `DojoIRC-windows-amd64.zip` from the [latest release](https://github.com/joehonkey/DojoIRC/releases/latest)
2. Extract the zip
3. Run `DojoIRC.exe`

WebView2 (Microsoft Edge runtime) is required. It ships pre-installed on Windows 10 and 11. If you are on an older system and it is missing, download it from [Microsoft](https://developer.microsoft.com/en-us/microsoft-edge/webview2/).

Windows Defender or SmartScreen may warn about an unrecognized app on first run — click **More info → Run anyway**.

---

## FreeBSD

No pre-built binary is provided for FreeBSD — build from source. Confirmed working on **FreeBSD 15.0 / KDE Plasma 6 / X11**.

### Requirements

```sh
sudo pkg install go126 webkit2-gtk_41
```

Node.js is available via corepack — no separate install needed if `node` is already present.

### Build

Upstream Wails v2 does not support FreeBSD. A patched local clone is required. See the full [FreeBSD Build Guide](building.md#freebsd) for the patching steps.

Once Wails is patched and `go.mod` has the `replace` directive set:

```sh
export PATH=$PATH:/usr/local/go126/bin:/usr/local/lib/node_modules/corepack/shims:~/go/bin
GONOSUMDB='*' GOFLAGS="-mod=mod" wails build -tags webkit2_41
cp -r themes build/bin/
```

The `-tags webkit2_41` flag is required, the same as on Linux. FreeBSD ships `webkit2-gtk_41` (WebKit2GTK 4.1 / libsoup3) which is identical.

### Running

Launch directly — no environment overrides needed:

```sh
./build/bin/DojoIRC
```

The window renders correctly, system tray works, and behaviour is identical to the Linux build. No `GDK_BACKEND` or `DISPLAY` overrides required on X11.

---

## Config file location

DojoIRC looks for its config at:

| Platform | Path |
|---|---|
| Linux / FreeBSD | `~/.config/dojoirc/config.toml` |
| macOS | `~/.config/dojoirc/config.toml` |
| Windows | `%APPDATA%\dojoirc\config.toml` |

If the file does not exist, use **Hamburger → Open Config** and DojoIRC will create it from a template automatically.

See [Configuration](configuration.md) for the full config reference.
