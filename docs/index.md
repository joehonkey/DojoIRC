# DojoIRC Documentation

DojoIRC is a cross-platform IRC client built with Go and Wails v2. This documentation covers everything you need to install, configure, and get the most out of it.

## Contents

- [Installation](installation.md) — downloading and installing on Linux, macOS, and Windows
- [Configuration](configuration.md) — full `config.toml` reference with all options and examples
- [Customization Guide](customization.md) — fonts, themes, per-element font sizes, and full config examples
- [Slash Commands](commands.md) — every command, what it does, and usage examples
- [Themes](themes.md) — switching themes, creating your own, and the full theme color reference
- [Font Sizes](font-sizes.md) — how to customize every font size in the UI via CSS variables
- [IRCv3](ircv3.md) — supported IRCv3 capabilities, what they do, and what's coming
- [Building from Source](building.md) — how to build DojoIRC yourself on each platform
- [FAQ & Troubleshooting](faq.md) — common questions, fixes, and gotchas

## Quick Start

1. Download the latest release for your platform from the [Releases page](https://github.com/joehonkey/DojoIRC/releases)
2. Extract the archive
3. Create `~/.config/dojoirc/config.toml` with at least one `[[server]]` block
4. Run `DojoIRC`

Minimum config to get connected:

```toml
[[server]]
name     = "LinuxDojo"
host     = "irc.linuxdojo.org"
port     = 6697
tls      = true
nick     = "yournick"
channels = ["#dojoirc"]
```

## Getting Help

- Open the in-app documentation panel via **Hamburger → Documentation**
- Join **#dojoirc** on `irc.linuxdojo.org` to ask questions
- File a bug or feature request on [GitHub Issues](https://github.com/joehonkey/DojoIRC/issues)
