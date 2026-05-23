# Keyboard Shortcuts

All shortcuts work globally — you don't need to click anywhere first.

---

## Navigation

| Shortcut | Action |
|---|---|
| **Alt+↑** | Switch to the previous channel or buffer in the sidebar |
| **Alt+↓** | Switch to the next channel or buffer in the sidebar |
| **Alt+←** | Jump to the previous server's first channel |
| **Alt+→** | Jump to the next server's first channel |

Buffers cycle through all entries in sidebar order: server buffer → channels → DMs, then wraps around. With a single server, Alt+← and Alt+→ are equivalent.

---

## Search

| Shortcut | Action |
|---|---|
| **Ctrl+F** | Open message search in the current buffer |
| **Ctrl+F** (again) | Close search |
| **Escape** | Close search and return focus to the message input |

### How search works

When search is open, a search input appears in the top-right of the buffer header. As you type, messages that match (by text content or nick) stay at full opacity. Non-matching messages dim to 20%. The first matching message scrolls into view automatically.

Closing search (Escape or ✕) restores all messages to full opacity.

---

## Message input

| Shortcut | Action |
|---|---|
| **Tab** | Complete nick at cursor (cycles through matches; adds `: ` at line start) |
| **Tab** (after `/`) | Complete slash command name |
| **Enter** | Send message |

---

## Notes

- Alt+arrow navigation does not interfere with typing — Alt+key combinations do not produce text characters.
- Ctrl+F is intercepted even when the message input is focused.
- Keyboard shortcuts are registered once at startup and remain active for the entire session.
