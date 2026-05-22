package main

import (
	"log"

	"github.com/joehonkey/dojoire/internal/config"
	"github.com/joehonkey/dojoire/internal/irc"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatalf("failed to load config: %v", err)
	}

	for _, server := range cfg.Servers {
		client := irc.NewClient(server)
		if err := client.Connect(); err != nil {
			log.Printf("failed to connect to %s: %v", server.Host, err)
			continue
		}
		log.Printf("connected to %s", server.Host)
	}

	select {}
}
