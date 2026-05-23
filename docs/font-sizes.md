# Font Sizes

DojoIRC exposes every font size in the UI as a CSS custom property. You can change any of them by editing one line in `style.css`.

---

## The quick way — main chat font

The main chat font size responds to `font_size` in `config.toml` and is applied at runtime. No CSS editing required.

```toml
font_size = 15
```

Save the file and use **Hamburger → Reload Config**. Only the main chat message text responds to this setting. Everything else requires editing the CSS variables below.

---

## CSS variables reference

All font sizes live in the `:root` block near the top of `style.css`. Find that file at:

- **Source build:** `frontend/src/style.css` in the DojoIRC source tree
- **Linux installed:** alongside the `DojoIRC` binary in the same directory

Edit the value next to the variable you want to change, then restart DojoIRC.

```css
:root {
  --font-size:              13px;   /* main chat messages */
  --font-size-timestamp:    13px;   /* HH:MM timestamps in chat */
  --font-size-sidebar-hdr:  11px;   /* "DOJOIRC" header + hamburger row */
  --font-size-hamburger:    14px;   /* ☰ hamburger button */
  --font-size-server:       11px;   /* server names in sidebar */
  --font-size-channel:      13px;   /* channel names in sidebar */
  --font-size-nicklist:     12px;   /* nick list panel */
  --font-size-typing:       13px;   /* typing indicator above input */
  --font-size-input-nick:   12px;   /* your nick left of the input box */
  --font-size-input:        13px;   /* message input box */
}
```

---

## Variable reference table

| Variable | Controls | Default |
|---|---|---|
| `--font-size` | Main chat message text. Also set by `font_size` in config.toml | 13px |
| `--font-size-timestamp` | HH:MM timestamp column left of each message | 13px |
| `--font-size-sidebar-hdr` | "DOJOIRC" title and hamburger row at the top of the sidebar | 11px |
| `--font-size-hamburger` | The ☰ hamburger button symbol | 14px |
| `--font-size-server` | Server names in the sidebar (shown in uppercase, e.g. "LINUXDOJO") | 11px |
| `--font-size-channel` | Channel and DM names in the sidebar | 13px |
| `--font-size-nicklist` | Nicks in the nick list panel on the right side | 12px |
| `--font-size-typing` | Typing indicator shown above the input bar | 13px |
| `--font-size-input-nick` | Your nick displayed to the left of the message input box | 12px |
| `--font-size-input` | Text you type in the message input box | 13px |

---

## Examples

### Larger everything — good for high-DPI displays

```css
:root {
  --font-size:              15px;
  --font-size-timestamp:    15px;
  --font-size-sidebar-hdr:  13px;
  --font-size-hamburger:    16px;
  --font-size-server:       13px;
  --font-size-channel:      15px;
  --font-size-nicklist:     14px;
  --font-size-typing:       15px;
  --font-size-input-nick:   14px;
  --font-size-input:        15px;
}
```

### Compact sidebar — more channels visible without scrolling

```css
--font-size-server:      10px;
--font-size-channel:     11px;
--font-size-sidebar-hdr: 10px;
```

### Bigger nick list only

```css
--font-size-nicklist: 14px;
```

### Larger input area

```css
--font-size-input:      15px;
--font-size-input-nick: 14px;
```
