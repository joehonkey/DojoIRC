package tray

import (
	"sync"

	"fyne.io/systray"
)

type Callbacks struct {
	OnShow func()
	OnHide func()
	OnQuit func()
}

var (
	mu      sync.Mutex
	visible = true
)

func SetVisible(v bool) {
	mu.Lock()
	visible = v
	mu.Unlock()
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

	// Left click — toggle window
	systray.SetOnTapped(func() {
		mu.Lock()
		v := visible
		mu.Unlock()
		if v {
			if cb.OnHide != nil {
				cb.OnHide()
			}
		} else {
			if cb.OnShow != nil {
				cb.OnShow()
			}
		}
	})

	// Right click menu is handled automatically by the systray lib.
	// Menu items: Show / Quit
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
