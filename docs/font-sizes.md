# Font Sizes

DojoIRC has a built-in Font Size manager that lets you adjust every UI zone live from the menu — no file editing, no restart.

---

## The quick way — Font Sizes panel

Open **Hamburger → Font Sizes** to get a panel with a + / − control for every UI zone. Changes apply instantly and persist across restarts.

Use **Reset to Defaults** to restore everything at once. Font sizes are clamped to the range **8px – 24px**.

---

## Zone reference

| Zone | Controls | Default |
|---|---|---|
| Sidebar Header (DOJOIRC) | "DOJOIRC" title and hamburger row at the top of the sidebar | 11px |
| Hamburger Button (☰) | The ☰ hamburger button symbol | 14px |
| Server Names | Server names in the sidebar (shown in uppercase, e.g. "LINUXDOJO") | 11px |
| Channel Names | Channel and DM names in the sidebar | 13px |
| Buffer Title (#channel) | Channel or DM name displayed in the buffer header | 14px |
| Channel Modes (+nt) | Mode string shown in the buffer header next to the channel name | 11px |
| Topic Button | The "topic" pill button in the buffer header | 10px |
| Topic Text | Topic content shown below the buffer header | 12px |
| Chat Messages | Main chat message text | 13px |
| Timestamps | HH:MM timestamp column left of each message | 13px |
| Nick List | Nicks in the nick list panel on the right side | 12px |
| Typing Indicator | Typing indicator shown above the input bar | 13px |
| Input Nick Prefix | Your nick displayed to the left of the message input box | 12px |
| Input Field | Text you type in the message input box | 13px |

---

## config.toml font_size

The `font_size` key in `config.toml` also sets the Chat Messages zone. The Font Sizes panel takes precedence — if you've set Chat Messages via the panel, the config value will be overridden by your saved preference.

```toml
font_size = 15
```

---

## Advanced — direct CSS editing

If you prefer to edit `style.css` directly, all font sizes are CSS variables in the `:root` block:

- **Source build:** `frontend/src/style.css`
- **Installed binary:** `style.css` alongside the `DojoIRC` binary

Note: values saved via the Font Sizes panel take precedence over the stylesheet at runtime.
