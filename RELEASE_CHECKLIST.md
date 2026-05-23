# DojoIRC Release Checklist

Use this before every commit/push that ships a feature or fix. Go top to bottom — nothing ships until every box is checked.

---

## 1. Code & Build

- [ ] Feature code complete and tested locally
- [ ] Version number decided (e.g. `v0.4.7`)
- [ ] Binary rebuilt with version baked in:
  ```
  ~/go/bin/wails build -tags webkit2_41 -ldflags "-X main.Version=vX.Y.Z"
  cp -r themes build/bin/
  ```
- [ ] App runs, new feature works, no regressions

---

## 2. In-App Documentation

- [ ] `frontend/src/main.js` — `showDocs()` function updated
  - New features described in the relevant section
  - Any changed UI flows or menu items reflected
  - Font Sizes table accurate (all zones listed)
  - Keyboard Shortcuts table accurate
  - Commands table accurate

---

## 3. Docs (docs/)

- [ ] `docs/index.md` — contents list reflects any new doc pages or renamed sections
- [ ] `docs/font-sizes.md` — zone table complete and accurate
- [ ] `docs/customization.md` — per-element font sizes, theme, config examples up to date
- [ ] `docs/configuration.md` — any new config keys documented
- [ ] `docs/commands.md` — any new slash commands added
- [ ] `docs/keyboard-shortcuts.md` — any new shortcuts added
- [ ] `docs/building.md` — build commands include correct `-ldflags "-X main.Version=vX.Y.Z"` for all platforms
- [ ] `docs/faq.md` — any new common questions addressed; no stale answers
- [ ] `docs/installation.md` — install steps still accurate
- [ ] `docs/ircv3.md` — any newly implemented caps marked done

---

## 4. Root-Level Docs

- [ ] `CHANGELOG.md` — new session entry at the top with: what was built, files changed, key decisions
- [ ] `ROADMAP.md` — completed items checked off; new items added if applicable
- [ ] `README.md` — features table updated; any new badges or sections

---

## 5. BeeMO

File: `/home/joe/Projects/llama-irc-bot/gemma4-irc-bot.py`

- [ ] `system_role_original` (~line 75) — DojoIRC features summary and roadmap status updated
- [ ] `dojoirc_system_role` (~line 96) — full role updated:
  - KEY FEATURES section reflects new feature
  - FONT SIZES section accurate (14 zones, panel-based)
  - SLASH COMMANDS list accurate
  - KEYBOARD SHORTCUTS accurate
  - ROADMAP stage statuses accurate
  - Build command includes `-ldflags` flag
- [ ] No stale "edit style.css" or "restart required" instructions where panel/live features exist

---

## 6. Memory

Files: `~/.claude/projects/-home-joe-Projects-DojoIRC/memory/`

- [ ] `project_overview.md` — version, build command, hamburger menu order, features list, what's next
- [ ] `project_quirks.md` — any new gotchas or resolved quirks updated

---

## 7. Git & GitHub

- [ ] All changed files staged and committed with a clear message
- [ ] `git push origin main`
- [ ] If this is a release:
  - [ ] `git tag vX.Y.Z`
  - [ ] `git push origin vX.Y.Z` — triggers CI: builds Linux/Windows/macOS binaries, creates GitHub release
  - [ ] `gh release edit vX.Y.Z --notes "..."` — add human-readable release notes
  - [ ] Verify release page on GitHub shows correct version, assets, and notes

---

## Quick Reference — What Lives Where

| What | Where |
|---|---|
| In-app docs (Documentation panel) | `frontend/src/main.js` → `showDocs()` |
| Font zones reference | `docs/font-sizes.md` + in-app docs table |
| Config reference | `docs/configuration.md` |
| Build instructions | `docs/building.md` |
| FAQ / troubleshooting | `docs/faq.md` |
| Full feature list | `README.md` features table |
| Version history | `CHANGELOG.md` |
| Planned work | `ROADMAP.md` |
| IRC bot knowledge | `/home/joe/Projects/llama-irc-bot/gemma4-irc-bot.py` |
| Claude session memory | `~/.claude/projects/-home-joe-Projects-DojoIRC/memory/` |
| GitHub release binaries | Tagged releases via CI (`git tag + push`) |
