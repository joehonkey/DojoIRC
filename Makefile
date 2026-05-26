VERSION := $(shell grep -m1 -oP 'v\d+\.\d+\.\d+' CHANGELOG.md)

build:
	~/go/bin/wails build -tags webkit2_41 -ldflags "-X main.Version=$(VERSION)"
	cp -r themes build/bin/

.PHONY: build
