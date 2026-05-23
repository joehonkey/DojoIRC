package logger

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
	"sync"
	"time"
)

var (
	mu      sync.Mutex
	handles = map[string]*os.File{}
)

func Log(baseDir, server, channel, nick, text string) {
	mu.Lock()
	defer mu.Unlock()

	key := server + "\x00" + channel
	f, ok := handles[key]
	if !ok {
		dir := filepath.Join(baseDir, "logs", sanitize(server))
		if err := os.MkdirAll(dir, 0o755); err != nil {
			return
		}
		path := filepath.Join(dir, sanitize(channel)+".log")
		var err error
		f, err = os.OpenFile(path, os.O_CREATE|os.O_APPEND|os.O_WRONLY, 0o644)
		if err != nil {
			return
		}
		handles[key] = f
	}

	ts := time.Now().Format("2006-01-02 15:04:05")
	var line string
	if nick == "" {
		line = fmt.Sprintf("[%s] * %s\n", ts, text)
	} else {
		line = fmt.Sprintf("[%s] <%s> %s\n", ts, nick, text)
	}
	f.WriteString(line)
}

func CloseAll() {
	mu.Lock()
	defer mu.Unlock()
	for _, f := range handles {
		f.Close()
	}
	handles = map[string]*os.File{}
}

func sanitize(s string) string {
	r := strings.NewReplacer("/", "_", "\\", "_", ":", "_", "*", "_", "?", "_", "\"", "_", "<", "_", ">", "_", "|", "_")
	return r.Replace(s)
}
