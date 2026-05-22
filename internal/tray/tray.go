package tray

import (
	_ "embed"

	"github.com/getlantern/systray"
)

//go:embed icon.png
var icon []byte

type Callbacks struct {
	OnShow func()
	OnQuit func()
}

func Run(cb Callbacks) {
	systray.Run(func() { onReady(cb) }, nil)
}

func onReady(cb Callbacks) {
	systray.SetIcon(icon)
	systray.SetTitle("DojoIRC")
	systray.SetTooltip("DojoIRC")

	mShow := systray.AddMenuItem("Show", "Show the DojoIRC window")
	systray.AddSeparator()
	mQuit := systray.AddMenuItem("Quit", "Quit DojoIRC")

	go func() {
		for {
			select {
			case <-mShow.ClickedCh:
				if cb.OnShow != nil {
					cb.OnShow()
				}
			case <-mQuit.ClickedCh:
				systray.Quit()
				if cb.OnQuit != nil {
					cb.OnQuit()
				}
			}
		}
	}()
}

func Quit() {
	systray.Quit()
}
