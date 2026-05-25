# DojoIRC — FreeBSD Build: Full Session Notes

**Date:** 2026-05-24  
**System:** FreeBSD 15.0-RELEASE-p9 amd64  
**Desktop:** KDE Plasma 6 / X11 (startplasma-x11 via SDDM)  
**DojoIRC version built:** v0.4.19 (last updated)  
**Wails version:** v2.12.0 (patched)

---

## Overview

Wails v2.12.0 has no upstream FreeBSD support. The GTK/WebKit2GTK frontend used on Linux is almost entirely compatible with FreeBSD — the GTK and WebKit2GTK packages are the same and pkg-config works identically. What was missing was a set of build-tag inclusions, platform stubs, and one CGo helper split. This document records every step taken to get a working DojoIRC binary on FreeBSD from a clean state (post-HD migration, no Go or Wails installed).

---

## Step 1 — Install system dependencies

```sh
sudo pkg install go126 webkit2-gtk_41
```

**Why `go126` specifically:** DojoIRC's `go.mod` declares `go 1.26.3`. The default `go` package on FreeBSD ports at time of writing pulls `go125` (1.25.10), which is insufficient. `go126` (1.26.3) is available as a separate package and installs to `/usr/local/go126/`.

**Why `webkit2-gtk_41`:** Wails on Linux/FreeBSD supports three WebKit2GTK generations via build tags (`webkit2_36`, `webkit2_40`, `webkit2_41`). DojoIRC's `wails.json` and build command use `-tags webkit2_41`, requiring the 4.1 API. The FreeBSD port is `webkit2-gtk_41` (not `webkit2-gtk_40` or `webkit2-gtk`).

Node.js/npm was already present. If it is not: `sudo pkg install node`.

---

## Step 2 — Clone Wails into the location go.mod expects

DojoIRC's `go.mod` already contains:

```
replace github.com/wailsapp/wails/v2 => /home/joe/wails/v2
```

This means Go will use the local directory rather than the module cache. Clone Wails v2.12.0 there:

```sh
git clone --depth=1 --branch v2.12.0 https://github.com/wailsapp/wails /home/joe/wails
```

Note: the tag `v2.12.0` resolves to a commit in detached HEAD state — this is fine.

---

## Step 3 — Fix the `jaypipes/ghw` module cache bug

The Wails CLI itself depends on `github.com/jaypipes/ghw@v0.21.3`. This package has a signature mismatch on non-Linux/Darwin/Windows platforms: `block.go` calls `info.load(opts)` with an argument, but `block_stub.go` (the catch-all for unsupported OSes, which includes FreeBSD) defines `load()` with no arguments.

**File:** `~/go/pkg/mod/github.com/jaypipes/ghw@v0.21.3/pkg/block/block_stub.go`

The module cache is read-only by default. Make it writable first:

```sh
chmod u+w ~/go/pkg/mod/github.com/jaypipes/ghw@v0.21.3/pkg/block/block_stub.go
```

**Before:**
```go
//go:build !linux && !darwin && !windows
// +build !linux,!darwin,!windows

package block

import (
    "runtime"

    "github.com/pkg/errors"
)

func (i *Info) load() error {
    return errors.New("blockFillInfo not implemented on " + runtime.GOOS)
}
```

**After:**
```go
//go:build !linux && !darwin && !windows
// +build !linux,!darwin,!windows

package block

import (
    "runtime"

    "github.com/jaypipes/ghw/pkg/option"
    "github.com/pkg/errors"
)

func (i *Info) load(_ *option.Options) error {
    return errors.New("blockFillInfo not implemented on " + runtime.GOOS)
}
```

**Why:** Without this fix, building the Wails CLI itself fails with:
```
# github.com/jaypipes/ghw/pkg/block
block.go:299:22: too many arguments in call to info.load
    have (*option.Options)
    want ()
```

This is a bug in the upstream `ghw` package that only manifests on unsupported platforms.

---

## Step 4 — Apply FreeBSD patches to Wails v2

All paths below are relative to `/home/joe/wails/v2/`.

### 4a — New file: `internal/system/operatingsystem/os_freebsd.go`

The OS info system has platform-specific files (`os_linux.go`, `os_darwin.go`, `os_windows.go`). Without a FreeBSD version the build fails with `undefined: platformInfo`.

```go
//go:build freebsd
// +build freebsd

package operatingsystem

func platformInfo() (*OS, error) {
    return &OS{
        ID:      "freebsd",
        Name:    "FreeBSD",
        Version: "unknown",
    }, nil
}
```

### 4b — New file: `internal/system/system_freebsd.go`

The system discovery layer also has per-platform files. FreeBSD only needs a minimal stub — there's no package manager integration needed for the build to succeed.

```go
//go:build freebsd
// +build freebsd

package system

import "github.com/wailsapp/wails/v2/internal/system/operatingsystem"

func (i *Info) discover() error {
    osinfo, err := operatingsystem.Info()
    if err != nil {
        return err
    }
    i.OS = osinfo
    return nil
}
```

### 4c — New file: `cmd/wails/internal/dev/dev_freebsd.go`

The dev server helpers (`setParentGID`, `killProc`) are defined in `dev_other.go` with the build tag `darwin || linux`. FreeBSD needs its own file. The implementation is identical to the Linux/Darwin version — `syscall.SysProcAttr.Setpgid` and `syscall.Kill` work the same on FreeBSD.

```go
//go:build freebsd
// +build freebsd

package dev

import (
    "os/exec"
    "syscall"

    "github.com/wailsapp/wails/v2/cmd/wails/internal/logutils"
    "golang.org/x/sys/unix"
)

func setParentGID(cmd *exec.Cmd) {
    cmd.SysProcAttr = &syscall.SysProcAttr{
        Setpgid: true,
    }
}

func killProc(cmd *exec.Cmd, devCommand string) {
    if cmd == nil || cmd.Process == nil {
        return
    }

    pgid, err := syscall.Getpgid(cmd.Process.Pid)
    if err == nil {
        err := syscall.Kill(-pgid, unix.SIGTERM)
        if err != nil {
            logutils.LogRed("Error from '%s' when attempting to kill the process: %s", devCommand, err.Error())
        }
    }
}
```

### 4d — New file: `internal/frontend/desktop/desktop_freebsd.go`

Routes FreeBSD to the Linux GTK/WebKit2GTK frontend. This is the core of the port — FreeBSD's GTK3 and WebKit2GTK libraries are functionally identical to the Linux ones.

```go
//go:build freebsd
// +build freebsd

package desktop

import (
    "context"
    "github.com/wailsapp/wails/v2/internal/binding"
    "github.com/wailsapp/wails/v2/internal/frontend"
    "github.com/wailsapp/wails/v2/internal/frontend/desktop/linux"
    "github.com/wailsapp/wails/v2/internal/logger"
    "github.com/wailsapp/wails/v2/pkg/options"
)

func NewFrontend(ctx context.Context, appoptions *options.App, logger *logger.Logger, appBindings *binding.Bindings, dispatcher frontend.Dispatcher) frontend.Frontend {
    return linux.NewFrontend(ctx, appoptions, logger, appBindings, dispatcher)
}
```

### 4e — Split `unix.Gettid()` into platform helpers

`invoke.go` in the Linux frontend calls `unix.Gettid()` to identify the main GTK thread. `unix.Gettid()` is Linux-only (it wraps the `gettid(2)` syscall, which does not exist on FreeBSD). The fix is to split this into two platform-specific helper files and call a local `gettid()` function instead.

**New file: `internal/frontend/desktop/linux/gettid_linux.go`**
```go
//go:build linux
// +build linux

package linux

import "golang.org/x/sys/unix"

func gettid() int {
    return unix.Gettid()
}
```

**New file: `internal/frontend/desktop/linux/gettid_freebsd.go`**

FreeBSD's equivalent is `thr_self(2)`, syscall number 432 on amd64.

```go
//go:build freebsd
// +build freebsd

package linux

import "syscall"

func gettid() int {
    // thr_self(2) — FreeBSD syscall 432
    tid, _, _ := syscall.Syscall(432, 0, 0, 0)
    return int(tid)
}
```

**Modified: `internal/frontend/desktop/linux/invoke.go`**

Three changes:
1. Build tag: `linux` → `linux || freebsd`
2. Remove `"golang.org/x/sys/unix"` import (no longer needed directly)
3. Replace both `unix.Gettid()` calls with `gettid()`

```go
// Before:
//go:build linux
// +build linux
...
import (
    ...
    "golang.org/x/sys/unix"
)
...
if mainThreadID != unix.Gettid() {
...
mainTid = unix.Gettid()

// After:
//go:build linux || freebsd
// +build linux freebsd
...
import (
    ...
    // unix import removed
)
...
if mainThreadID != gettid() {
...
mainTid = gettid()
```

### 4f — New files: WebKit URI scheme request/responsewriter for FreeBSD

`request_linux.go` and `responsewriter_linux.go` handle WebKit's URI scheme API via CGo. They have `//go:build linux` tags so they don't compile on FreeBSD. Create FreeBSD-specific copies with the CGo directives adjusted:

**`pkg/assetserver/webview/request_freebsd.go`**

Identical logic to `request_linux.go`, with the build tag and CGo pragma changed:

```go
//go:build freebsd
// +build freebsd

package webview

/*
#cgo freebsd pkg-config: gtk+-3.0 gio-unix-2.0
#cgo !webkit2_41 pkg-config: webkit2gtk-4.0
#cgo webkit2_41 pkg-config: webkit2gtk-4.1

#include "gtk/gtk.h"
#include "webkit2/webkit2.h"
*/
import "C"
// ... (full implementation identical to request_linux.go)
```

**`pkg/assetserver/webview/responsewriter_freebsd.go`**

Identical logic to `responsewriter_linux.go`, same build tag/pragma adjustments. The `pipe()` function uses `syscall.Pipe2` which is available on FreeBSD. The `g_unix_input_stream_new` call works via `gio-unix-2.0` which is present in FreeBSD's glib2 package.

```go
//go:build freebsd
// +build freebsd

package webview

/*
#cgo freebsd pkg-config: gtk+-3.0 gio-unix-2.0
#cgo !webkit2_41 pkg-config: webkit2gtk-4.0
#cgo webkit2_41 pkg-config: webkit2gtk-4.1

#include "gtk/gtk.h"
#include "webkit2/webkit2.h"
#include "gio/gunixinputstream.h"
*/
import "C"
// ... (full implementation identical to responsewriter_linux.go)
```

### 4g — Update build tags on all Linux desktop frontend files

Every `.go` file in `internal/frontend/desktop/linux/` had `//go:build linux` / `// +build linux`. These need to include `freebsd` so they compile when targeting FreeBSD.

Files updated (13 total):

```
browser.go  calloc.go  clipboard.go  dialog.go  frontend.go
gtk.go  invoke.go  keys.go  menu.go  notifications.go
screen.go  single_instance.go  webkit2.go  window.go
```

Change applied to each:
```
//go:build linux          →  //go:build linux || freebsd
// +build linux           →  // +build linux freebsd
```

(`webkit2.go` only has the new-style `//go:build` tag, no `// +build` line.)

**Command used** (BSD `sed` doesn't support `|` as delimiter; used `awk` instead):
```sh
for f in browser.go calloc.go clipboard.go dialog.go frontend.go gtk.go \
         keys.go menu.go notifications.go screen.go single_instance.go \
         webkit2.go window.go; do
  awk '{
    gsub(/^\/\/go:build linux$/, "//go:build linux || freebsd")
    gsub(/^\/\/ \+build linux$/, "// +build linux freebsd")
    print
  }' /home/joe/wails/v2/internal/frontend/desktop/linux/$f > /tmp/wk_$f \
  && mv /tmp/wk_$f /home/joe/wails/v2/internal/frontend/desktop/linux/$f
done
```

### 4h — Update build tags on webkit2 helper files

The six files in `pkg/assetserver/webview/webkit2_*.go` all have `//go:build linux && ...` tags. These need to become `(linux || freebsd) && ...`.

Files:
```
webkit2_36+.go  webkit2_36.go  webkit2_40+.go
webkit2_40.go   webkit2_41.go  webkit2_legacy.go
```

Example change:
```
//go:build linux && webkit2_41
→
//go:build (linux || freebsd) && webkit2_41
```

### 4i — Add `ulong` typedef guard to `window.h`

`internal/frontend/desktop/linux/window.h` uses `ulong` in some GTK/WebKit type contexts. On Linux, glibc defines `ulong` via `<sys/types.h>`. FreeBSD's libc does too but only when `<sys/types.h>` is included with the right feature macros — it may not be pulled in by the GTK headers. Add a guard at the top of the file, after `#define window_h`:

```c
#if defined(__FreeBSD__) && !defined(_ULONG_T_DECLARED)
typedef unsigned long ulong;
#define _ULONG_T_DECLARED
#endif
```

The `_ULONG_T_DECLARED` guard matches FreeBSD's own convention from `<sys/types.h>`, so there's no conflict if the type does get defined elsewhere.

### 4j — Update `internal/app/app_default_unix.go`

```
//go:build !dev && !production && !bindings && (linux || darwin)
→
//go:build !dev && !production && !bindings && (linux || darwin || freebsd)
```

### 4k — Update `internal/app/app_preflight_unix.go`

```
//go:build (linux || darwin) && !bindings
→
//go:build (linux || darwin || freebsd) && !bindings
```

### 4l — Add FreeBSD to `cmd/wails/build.go` platform list

In the `validPlatformArch` slice, add FreeBSD targets alongside the Linux ones:

```go
"freebsd",
"freebsd/amd64",
"freebsd/arm64",
```

Also add a FreeBSD case to the platform switch that follows, to guard against cross-compilation:

```go
case "freebsd":
    if runtime.GOOS != "freebsd" {
        pterm.Warning.Println("Crosscompiling to FreeBSD not currently supported.")
        return
    }
```

### 4m — Add FreeBSD to `pkg/commands/build/packager.go`

```go
case "freebsd":
    // no-op: no packaging step needed on FreeBSD
```

Without this, FreeBSD hits the `default` case and returns an error about packaging not being supported.

---

## Step 5 — Build and install the patched Wails CLI

```sh
cd /home/joe/wails/v2/cmd/wails
GOROOT=/usr/local/go126 PATH=/usr/local/go126/bin:$PATH GONOSUMDB='*' GOFLAGS="-mod=mod" go install .
```

This installs the patched `wails` binary to `/home/joe/go/bin/wails` (~34 MB).

---

## Step 6 — Build DojoIRC

```sh
cd /home/joe/dojoirc
export GOROOT=/usr/local/go126
export PATH=/usr/local/go126/bin:/usr/local/lib/node_modules/corepack/shims:/home/joe/go/bin:$PATH

GONOSUMDB='*' GOFLAGS="-mod=mod" wails build -tags webkit2_41 -ldflags "-X main.Version=$(git describe --tags --abbrev=0)" 2>&1
```

The version is read from the nearest git tag — no more hardcoding. Make sure you have fetched tags first (`git fetch --tags`).

Build time was approximately 1m11s on this machine.

Binary lands at: `build/bin/DojoIRC`

Copy themes alongside it (required for theming to work):

```sh
cp -r themes build/bin/
```

---

## Step 7 — Running the binary

From within an active X11/Wayland session DojoIRC can be launched directly:

```sh
./build/bin/DojoIRC
```

When launching from a terminal or script that does not inherit the desktop session environment (e.g. a Claude Code shell), you must supply `DISPLAY` and `XAUTHORITY` manually. The xauth cookie file lives at `/tmp/xauth_<random>` and can be found by checking which file holds the MIT-MAGIC-COOKIE for `:0`:

```sh
xauth -f /tmp/xauth_<file> list    # look for the :0 entry
DISPLAY=:0 XAUTHORITY=/tmp/xauth_<file> ./build/bin/DojoIRC
```

On this machine the session cookie was at `/tmp/xauth_aZrerO`.

**Expected warnings on startup (all benign):**

```
systray error: failed to register: The name org.kde.StatusNotifierWatcher was not provided by any .service files
```
This fires during binding generation when there's no live D-Bus session tray watcher. It does not affect the running app.

```
libEGL warning: failed to get driver name for fd -1
libEGL warning: MESA-LOADER: failed to retrieve device information
```
WebKit probes for hardware-accelerated EGL. These warnings appear when launched from a non-DRM context but rendering falls back to software compositing and works correctly.

```
WARNING: Can't connect to a11y bus: Could not connect: Permission denied
```
Accessibility bus (AT-SPI) is not running. Non-critical.

---

## Summary of all changes made

| Type | Path | Change |
|------|------|--------|
| New file | `internal/system/operatingsystem/os_freebsd.go` | OS info stub |
| New file | `internal/system/system_freebsd.go` | System discovery stub |
| New file | `cmd/wails/internal/dev/dev_freebsd.go` | Process group / signal helpers |
| New file | `internal/frontend/desktop/desktop_freebsd.go` | Routes FreeBSD to GTK frontend |
| New file | `internal/frontend/desktop/linux/gettid_linux.go` | Splits `unix.Gettid()` into helper |
| New file | `internal/frontend/desktop/linux/gettid_freebsd.go` | FreeBSD thread ID via `thr_self` syscall 432 |
| New file | `pkg/assetserver/webview/request_freebsd.go` | WebKit URI scheme request handler |
| New file | `pkg/assetserver/webview/responsewriter_freebsd.go` | WebKit URI scheme response writer |
| Modified | `internal/frontend/desktop/linux/invoke.go` | Build tag + remove `unix.Gettid()` + use `gettid()` |
| Modified | `internal/frontend/desktop/linux/*.go` (12 files) | Build tags: `linux` → `linux \|\| freebsd` |
| Modified | `internal/frontend/desktop/linux/window.h` | Add `ulong` typedef guard for FreeBSD |
| Modified | `pkg/assetserver/webview/webkit2_*.go` (6 files) | Build tags: `linux &&` → `(linux \|\| freebsd) &&` |
| Modified | `internal/app/app_default_unix.go` | Add `freebsd` to build constraint |
| Modified | `internal/app/app_preflight_unix.go` | Add `freebsd` to build constraint |
| Modified | `cmd/wails/build.go` | Add `freebsd`, `freebsd/amd64`, `freebsd/arm64` to platform list + cross-compile guard |
| Modified | `pkg/commands/build/packager.go` | Add `freebsd` no-op case |
| Module cache fix | `~/go/pkg/mod/github.com/jaypipes/ghw@v0.21.3/pkg/block/block_stub.go` | Fix `load()` signature mismatch |

---

## Notes for future builds / maintenance

- The `replace` directive in `dojoirc/go.mod` must always point to the patched local Wails clone. If it is removed or the path changes, the build will revert to upstream Wails and fail.
- The `ghw` module cache fix is a one-time operation per machine. If the module cache is cleared (`go clean -modcache`), the fix needs to be re-applied.
- When Wails releases a new version, check if any of the patched files have changed upstream before re-applying. The patch surface is well-defined: look for anything with `//go:build linux` in the `linux/` frontend package and the `webview/` package.
- `go126` and `webkit2-gtk_41` must both be installed. Neither is pulled in by the default `go` meta-package.
- The build command must always include `-tags webkit2_41`. Without it, Wails defaults to the webkit2gtk-4.0 pkg-config name which is not installed.
- The version string is embedded automatically via `-ldflags "-X main.Version=$(git describe --tags --abbrev=0)"`. Run `git fetch --tags` before building to ensure the latest tag is present. It appears in the About panel.
- Tested on: FreeBSD 15.0-RELEASE-p9 amd64, KDE Plasma 6 / X11, SDDM, kwin_x11, WebKit2GTK 4.1 (2.46.6_7). All features confirmed working.
