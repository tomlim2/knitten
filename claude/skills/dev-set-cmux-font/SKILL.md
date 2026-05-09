---
name: dev-set-cmux-font
description: Set cmux terminal font to Sarasa Mono K (CJK) or SF Mono (Latin). Fixes non-monospace fonts like Apple SD Gothic Neo.
allowed-tools: Read, Edit, Write, Bash(ls:*), Bash(grep:*), Bash(defaults:*), Bash(find:*), Bash(plutil:*), Bash(cat:*), Bash(brew:*)
---

# dev-set-cmux-font

Set cmux's terminal font to a monospace font. cmux (`/Applications/cmux.app`, bundle id `com.cmuxterm.app`) is a native macOS terminal app from manaflow-ai that uses Ghostty as its rendering backend but also exposes its own settings surface.

## Arguments

- `[font_name]` — Optional monospace font family. Defaults to `Sarasa Mono K` if the user writes Korean/Japanese/Chinese in the terminal, otherwise `SF Mono`. Examples: `Sarasa Mono K`, `SF Mono`, `JetBrains Mono`, `Menlo`, `Monaco`.

Usage: `/dev-set-cmux-font` or `/dev-set-cmux-font "JetBrains Mono"`

## Font recommendations

**For CJK users (recommended — Latin + Korean + Japanese + Chinese all monospace):**
- **Sarasa Mono K/J/SC/TC** — Iosevka (Latin) + Source Han (CJK) hybrid. Every glyph renders at monospace width including 한글/漢字/かな. Install via `brew install --cask font-sarasa-gothic` (ships a single `Sarasa-SuperTTC.ttc` containing all regional variants: K=Korean, J=Japanese, SC=Simplified Chinese, TC=Traditional Chinese). Pick the primary by the user's most-used language; stack the rest as fallbacks in Ghostty config (Ghostty tries them in order for glyphs the primary doesn't cover).
- Alternatives: `D2Coding` (Naver, Korean-only), `Nanum Gothic Coding` (Korean-only). These lack JP/CN coverage so you still need a fallback.

**For Latin-only users:**
- `SF Mono` (preinstalled on macOS, `!`bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh tool font-sf-mono``)
- `JetBrains Mono`, `Menlo`, `Monaco`

**Anti-pattern:** Using `SF Mono` primary + `Apple SD Gothic Neo` fallback. SF Mono is mono, but Apple SD Gothic Neo is NOT a monospace face — CJK glyphs will render at proportional width, so Korean text looks misaligned even though Latin looks fine. If the user complains "cmux font looks wrong with Korean", this stack is almost always the cause.

## Background

cmux persists settings across multiple locations, in this precedence order:

1. `~/.config/cmux/settings.json` — JSONC, file-managed overrides (highest precedence). Schema: `https://raw.githubusercontent.com/manaflow-ai/cmux/main/web/data/cmux-settings.schema.json`
2. `~/Library/Application Support/cmux/` — app runtime + fallback settings
3. `~/Library/Preferences/com.cmuxterm.app.plist` — macOS defaults (window state, appearance, and other UI settings — font is NOT stored here)
4. `~/.config/ghostty/config` — Ghostty backend config. cmux inherits this when no app-level override is set. Format: one `font-family = <name>` line per fallback, in order.

**Key trap:** Ghostty treats `font-family` lines as a fallback stack in order. If `Apple SD Gothic Neo` (proportional-ish Korean face) is listed before `SF Mono`, it wins for Latin glyphs too and the terminal looks non-monospace. Monospace family must come FIRST.

## Workflow

### Step 1: Discover current state

Check all four locations and report which ones exist and what font they specify.

```bash
ls -la ~/.config/cmux/settings.json ~/.config/ghostty/config 2>/dev/null
defaults read com.cmuxterm.app 2>/dev/null | grep -i font
grep -n font ~/.config/ghostty/config 2>/dev/null
grep -n -i font ~/.config/cmux/settings.json 2>/dev/null
```

Also search Application Support for any JSON holding font keys:

```bash
find ~/Library/Application\ Support/cmux -type f -name "*.json" 2>/dev/null
```

If any file contains a `font` / `fontFamily` / `terminal` key, note its path and current value.

### Step 2: Decide the fix location

- **If `~/.config/cmux/settings.json` has a `terminal`/`font` section** → edit there (highest precedence).
- **Else if cmux-specific JSON in Application Support has font keys** → edit there.
- **Else fall back to `~/.config/ghostty/config`** → reorder so the monospace family is the FIRST `font-family` line. Keep Korean/CJK fallback as secondary.

Do NOT touch `com.cmuxterm.app.plist` — font is not stored in plist, and editing it risks corrupting window state.

### Step 3: Apply the change

For Ghostty config (most common path), the file should look like this for a CJK-capable setup:

```
font-family = Sarasa Mono K
font-family = Sarasa Mono J
font-family = Sarasa Mono SC
font-family = Sarasa Mono TC
font-size = 13
```

Or for Latin-only:

```
font-family = SF Mono
font-size = 13
```

The FIRST `font-family` line is the primary face. Subsequent lines are fallbacks for glyphs the primary doesn't cover. Use `Edit` to reorder or replace lines — do NOT rewrite the whole file unless necessary.

If Sarasa Mono isn't installed yet, install with `brew install --cask font-sarasa-gothic` (confirm with user first). The cask ships a single `!`bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh tool font-sarasa`` that contains every regional variant.

For cmux `settings.json` (JSONC — comments allowed), uncomment or add a `terminal` section following the schema. If the schema does not document a font key yet, prefer the Ghostty config path instead.

### Step 4: Validate

- `plutil -lint` is NOT applicable (JSONC, not plist).
- Re-read the edited file and confirm the primary `font-family` is the requested monospace font.
- Confirm the font is actually installed: `ls /System/Library/Fonts/ /Library/Fonts/ ~/Library/Fonts/ 2>/dev/null | grep -i "<font>"`. SF Mono lives under `/System/Library/Fonts/` on modern macOS.

### Step 5: Tell the user how to reload

- cmux picks up Ghostty config changes on relaunch. Close all cmux windows and reopen, or use cmux's in-app **Reload Configuration** shortcut (`cmd+shift+,` — see `shortcuts.bindings.reloadConfiguration` in the settings schema).
- Do NOT kill cmux processes. Do NOT restart the app programmatically without asking.

## Notes

- cmux is from `manaflow-ai/cmux`. The settings schema URL in `~/.config/cmux/settings.json` is canonical for supported keys — re-fetch it if the workflow above can't find a font key and the user insists cmux has its own setting.
- This skill is macOS-only. cmux does not ship on Windows.
- If the user reports "I changed it in Settings UI but it looks wrong", the UI likely wrote to Application Support JSON, and the fix is to find that JSON and correct the font order/value there — not to touch Ghostty config.
