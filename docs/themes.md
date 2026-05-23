# Themes

DojoIRC uses TOML theme files to define the full color palette. Themes can be switched live without restarting.

---

## Switching themes

Open the theme picker via **Hamburger → Theme picker**. Themes are listed alphabetically. The active theme is highlighted. Click any theme to apply it immediately — the UI updates in real time. Your selection is saved to `config.toml` automatically.

---

## Theme gallery

54 themes are included out of the box. Browse them with color swatches: **[Theme Gallery](themes-gallery.md)**

## Bundled themes

| Name | Description |
|---|---|
| `default` | Catppuccin Mocha — a dark purple-tinted theme |
| `dark` | Plain dark theme with neutral grays |
| `light` | Light theme |
| `BreezeDarkPlus` | Port of the KDE Breeze Dark Plus color scheme |
| `Dracula` | Classic Dracula dark theme |
| `Nord` | Nord — cool blues and grays |
| `Gruvbox` | Gruvbox dark with warm retro colors |
| `One-Dark` | Atom One Dark |
| `Tokyo-Night-Storm` | Tokyo Night Storm variant |
| `Catppuccin-Latte` | Catppuccin Latte (light) |
| `Catppuccin-Macchiato` | Catppuccin Macchiato |
| `Catppuccin-Mocha` | Catppuccin Mocha (same palette as `default`) |
| `Rose-Pine` | Rosé Pine dark |
| `Rose-Pine-Moon` | Rosé Pine Moon |
| `Rose-Pine-Dawn` | Rosé Pine Dawn (light) |
| `Kanagawa` | Kanagawa — inspired by the Great Wave painting |
| `Solarized-Dark` | Solarized Dark |
| `Zenburn` | Zenburn low-contrast dark theme |
| `Cyberpunk` | Cyberpunk — neons on dark |
| `Matrix` | Matrix — green on black |
| _…and 35 more_ | See the [Theme Gallery](themes-gallery.md) |

---

## Adding a custom theme

1. Create a `.toml` file in `~/.config/dojoirc/themes/`. The filename (without `.toml`) becomes the theme name.
2. Use **Hamburger → Reload Config** — the theme appears in the picker.
3. Select it from the picker.

Example: save `~/.config/dojoirc/themes/mytheme.toml` and it shows up as `mytheme`.

---

## Theme file format

Below is a fully annotated theme file showing every available color key and what it controls.

```toml
# ── Background colors ────────────────────────────────────────
[colors]
bg          = "#1e1e2e"   # main chat area background
bg_sidebar  = "#181825"   # sidebar and nick list background
bg_input    = "#313244"   # message input box background
bg_hover    = "#2a2a3d"   # hovered item background
bg_active   = "#45475a"   # selected/active item background

# ── Text colors ──────────────────────────────────────────────
text        = "#cdd6f4"   # primary text (messages, labels)
text_dim    = "#6c7086"   # secondary text (timestamps, dimmed labels)
text_server = "#585b70"   # server message text (JOIN/PART/QUIT etc.)

# ── UI accents ───────────────────────────────────────────────
border      = "#313244"   # borders between panels
accent      = "#89b4fa"   # active items, focus rings, unread dots, links

# ── Message colors ───────────────────────────────────────────
timestamp   = "#6c7086"   # HH:MM timestamp column
nick_self   = "#a6e3a1"   # your own nick in the input bar
action      = "#cba6f7"   # /me action messages

# ── Sidebar unread indicators ────────────────────────────────
[sidebar]
unread  = "#89b4fa"       # blue dot — channel has unread messages
mention = "#f9e2af"       # yellow dot — channel has a mention (your nick was said)

# ── Mention highlights ───────────────────────────────────────
[highlights]
mention    = "#f38ba8"    # text color for mention messages
mention_bg = "rgba(243,139,168,0.06)"  # background tint on mention rows
```

---

## Example — custom dark green theme

```toml
[colors]
bg          = "#0d1117"
bg_sidebar  = "#010409"
bg_input    = "#161b22"
bg_hover    = "#1c2128"
bg_active   = "#30363d"
text        = "#e6edf3"
text_dim    = "#7d8590"
text_server = "#484f58"
border      = "#30363d"
accent      = "#3fb950"
timestamp   = "#7d8590"
nick_self   = "#3fb950"
action      = "#bc8cff"

[sidebar]
unread  = "#3fb950"
mention = "#f78166"

[highlights]
mention    = "#f78166"
mention_bg = "rgba(247,129,102,0.06)"
```

---

## Tips

- Use `rgba(r,g,b,alpha)` for `mention_bg` so the highlight is subtle and doesn't overpower the text
- `accent` affects the most elements — sidebar active item, input focus ring, links, and the topic toggle — so choose it carefully
- Reload Config is not needed to switch themes — the picker applies them live
- If a color key is missing from your file, DojoIRC falls back to the default theme's value for that key
