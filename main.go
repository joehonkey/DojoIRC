package main

import (
	"context"
	_ "embed"
	"embed"
	"os"
	"sync"

	"github.com/joehonkey/dojoire/internal/tray"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/options/linux"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

var (
	winX, winY   int
	winPosSaved  bool
	winPosMu     sync.Mutex
)

func saveWinPos(ctx context.Context) {
	x, y := runtime.WindowGetPosition(ctx)
	winPosMu.Lock()
	winX, winY, winPosSaved = x, y, true
	winPosMu.Unlock()
}

func restoreWinPos(ctx context.Context) {
	winPosMu.Lock()
	x, y, ok := winX, winY, winPosSaved
	winPosMu.Unlock()
	if ok {
		runtime.WindowSetPosition(ctx, x, y)
	}
}

//go:embed all:frontend/dist
var assets embed.FS

//go:embed build/appicon.png
var appIcon []byte

func main() {
	// webkit2gtk 2.52.x fails to spawn a GPU process on some AMD/Mesa setups,
	// leaving the webview blank. Disabling the DMA-BUF renderer and compositing
	// mode forces software compositing which renders correctly.
	os.Setenv("WEBKIT_DISABLE_DMABUF_RENDERER", "1")
	os.Setenv("WEBKIT_DISABLE_COMPOSITING_MODE", "1")

	app := NewApp()

	go tray.Run(tray.Callbacks{
		OnShow: func() {
			if app.ctx != nil {
				runtime.WindowShow(app.ctx)
				restoreWinPos(app.ctx)
				tray.SetVisible(true)
			}
		},
		OnHide: func() {
			if app.ctx != nil {
				saveWinPos(app.ctx)
				runtime.WindowHide(app.ctx)
				tray.SetVisible(false)
			}
		},
		OnQuit: func() {
			if app.ctx != nil {
				app.quitting = true
				app.shutdown()
				runtime.Quit(app.ctx)
			}
		},
	})

	err := wails.Run(&options.App{
		Title:            "DojoIRC",
		Width:            1200,
		Height:           800,
		BackgroundColour: &options.RGBA{R: 30, G: 30, B: 46, A: 255},
		AssetServer:      &assetserver.Options{Assets: assets},
		OnStartup:        app.startup,
		OnBeforeClose: func(ctx context.Context) bool {
			if app.quitting {
				return false
			}
			saveWinPos(ctx)
			runtime.WindowHide(app.ctx)
			tray.SetVisible(false)
			return true
		},
		Linux: &linux.Options{
			Icon:        appIcon,
			ProgramName: "dojoirc",
		},
		Bind: []interface{}{app},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
