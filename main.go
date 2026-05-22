package main

import (
	"context"
	"embed"

	"github.com/joehonkey/dojoire/internal/tray"
	"github.com/wailsapp/wails/v2"
	"github.com/wailsapp/wails/v2/pkg/options"
	"github.com/wailsapp/wails/v2/pkg/options/assetserver"
	"github.com/wailsapp/wails/v2/pkg/runtime"
)

//go:embed all:frontend/dist
var assets embed.FS

func main() {
	app := NewApp()

	go tray.Run(tray.Callbacks{
		OnShow: func() {
			if app.ctx != nil {
				runtime.WindowShow(app.ctx)
			}
		},
		OnQuit: func() {
			if app.ctx != nil {
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
			runtime.WindowHide(app.ctx)
			return true
		},
		Bind: []interface{}{app},
	})

	if err != nil {
		println("Error:", err.Error())
	}
}
