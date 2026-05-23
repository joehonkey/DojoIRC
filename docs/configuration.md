# Configuration

DojoIRC is configured with a single TOML file at `~/.config/dojoirc/config.toml`.

Use **Hamburger → Open Config** to open it in your system editor. Use **Hamburger → Reload Config** to apply changes without restarting. New servers in the config are connected automatically on reload; existing connections are not affected.

---

## Full example

```toml
theme     = "default"
font      = "IBM Plex Mono"
font_size = 13

[[server]]
name     = "LinuxDojo"
host     = "irc.linuxdojo.org"
port     = 6697
tls      = true
nick     = "yournick"
channels = ["#dojoirc", "#linuxdojo"]

[[server]]
name     = "Libera"
host     = "irc.libera.chat"
port     = 6697
tls      = true
nick     = "yournick"
channels = ["#linux", "#archlinux"]

[server.sasl]
mechanism = "PLAIN"
username  = "youraccountname"
password  = "yourpassword"
```

---

## Global options

| Key | Type | Default | Description |
|---|---|---|---|
| `theme` | string | `"default"` | Theme name to load. Matches the filename in `themes/` without `.toml` |
| `font` | string | `"IBM Plex Mono"` | Font family for the UI. Must be installed on your system |
| `font_size` | integer | `13` | Main chat font size in pixels. Applied at runtime via Reload Config |

---

## Server options

Each server is defined with a `[[server]]` block. You can have as many as you need.

| Key | Type | Required | Description |
|---|---|---|---|
| `name` | string | yes | Display name shown in the sidebar |
| `host` | string | yes | IRC server hostname or IP address |
| `port` | integer | yes | Server port. Standard TLS port is 6697 |
| `tls` | bool | yes | Use TLS. Strongly recommended — always use `true` |
| `nick` | string | yes | Your preferred nickname |
| `channels` | array of strings | no | Channels to join automatically on connect |

### Example — minimal server block

```toml
[[server]]
name     = "MyServer"
host     = "irc.example.com"
port     = 6697
tls      = true
nick     = "yournick"
channels = ["#general"]
```

---

## SASL authentication

Add a `[server.sasl]` block **immediately after** the `[[server]]` block it belongs to. The SASL block always applies to the server directly above it.

| Key | Type | Description |
|---|---|---|
| `mechanism` | string | Authentication mechanism. Currently only `"PLAIN"` is supported |
| `username` | string | Your account name (not necessarily your nick) |
| `password` | string | Your account password |

### Example

```toml
[[server]]
name     = "Libera"
host     = "irc.libera.chat"
port     = 6697
tls      = true
nick     = "yournick"
channels = ["#linux"]

[server.sasl]
mechanism = "PLAIN"
username  = "myaccount"
password  = "mypassword"
```

SASL negotiation happens during the CAP handshake at connect time. A success or failure message appears in the server buffer. If authentication fails, the connection continues but without being identified.

---

## Multiple servers

Add as many `[[server]]` blocks as you want. Each gets its own entry in the sidebar.

```toml
[[server]]
name     = "LinuxDojo"
host     = "irc.linuxdojo.org"
port     = 6697
tls      = true
nick     = "joe"
channels = ["#dojoirc"]

[[server]]
name     = "Libera"
host     = "irc.libera.chat"
port     = 6697
tls      = true
nick     = "joe"
channels = ["#linux"]

[server.sasl]
mechanism = "PLAIN"
username  = "joe"
password  = "hunter2"

[[server]]
name     = "OFTC"
host     = "irc.oftc.net"
port     = 6697
tls      = true
nick     = "joe"
channels = ["#debian"]
```

---

## Theme search path

DojoIRC looks for theme files in this order:

1. `~/.config/dojoirc/themes/<name>.toml`
2. `<exe directory>/themes/<name>.toml`
3. `themes/<name>.toml` (relative to working directory)

To add a custom theme, drop a `.toml` file in `~/.config/dojoirc/themes/` and reload config. It will appear in the theme picker immediately.

See [Themes](themes.md) for the full theme format and color reference.
