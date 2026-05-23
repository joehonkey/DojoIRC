# Font Sizes

DojoIRC has a built-in Font Size manager that lets you adjust every UI zone live from the menu — no file editing, no restart.

---

## The quick way — Font Sizes panel

Open **Hamburger → Font Sizes** to get a panel with a + / − control for every UI zone. Changes apply instantly and persist across restarts.

Use **Reset to Defaults** to restore everything at once.

---

## Zone reference

| Zone | Controls | Default |
|---|---|---|
| Sidebar Header (DOJOIRC) | "DOJOIRC" title and hamburger row at the top of the sidebar | 11px |
| Hamburger Button (☰) | The ☰ hamburger button symbol | 14px |
| Server Names | Server names in the sidebar (shown in uppercase, e.g. "LINUXDOJO") | 11px |
| Channel Names | Channel and DM names in the sidebar | 13px |
| Chat Messages | Main chat message text | 13px |
| Timestamps | HH:MM timestamp column left of each message | 13px |
| Nick List | Nicks in the nick list panel on the right side | 12px |
| Typing Indicator | Typing indicator shown above the input bar | 13px |
| Input Nick Prefix | Your nick displayed to the left of the message input box | 12px |
| Input Field | Text you type in the message input box | 13px |

Font sizes are clamped to the range **8px – 24px**.

---

## config.toml font_size

The `font_size` key in `config.toml` also sets the Chat Messages zone. The Font Sizes panel takes precedence — if you've set Chat Messages via the panel, config.toml `font_size` will be overridden by your saved preference.

```toml
font_size = 15
```

---

## Advanced — direct CSS editing

If you prefer to edit `style.css` directly, the CSS variables are in the `:root` block:

- **Source build:** `frontend/src/style.css`
- **Installed binary:** `style.css` alongside the `DojoIRC` binary

Note: values saved via the Font Sizes panel take precedence over the stylesheet at runtime.
