# Permissions Templates

Personal `settings.json` / `settings.local.json` templates for each Claude Code project scope.

## File → Target mapping

| Template | Copy to |
|----------|---------|
| `shotloom.settings.json` | `shotloom-github/.claude/settings.json` |
| `www.settings.json` | `~/Desktop/www/.claude/settings.local.json` |
| `caol-ila.settings.json` | `caol-ila/.claude/settings.local.json` |

> **Global** (`~/.claude/settings.json`) is already tracked as `caol-ila/claude/settings.json` via symlink — no template needed.

## New machine setup

```bash
# 1. Clone caol-ila and run symlink setup (see caol-ila README)

# 2. Copy project templates (update USERNAME where shown)
cp claude/config/permissions/shotloom.settings.json \
   ~/Desktop/www/shotloom-github/.claude/settings.json

cp claude/config/permissions/www.settings.json \
   ~/Desktop/www/.claude/settings.local.json

cp claude/config/permissions/caol-ila.settings.json \
   ~/Desktop/www/caol-ila/.claude/settings.local.json

# 3. Sed-replace USERNAME placeholder
sed -i '' "s/{USERNAME}/$(whoami)/g" \
  ~/Desktop/www/shotloom-github/.claude/settings.json \
  ~/Desktop/www/.claude/settings.local.json \
  ~/Desktop/www/caol-ila/.claude/settings.local.json
```

## Notes

- `settings.json` — committed to repo, shared across teammates
- `settings.local.json` — gitignored, personal overrides only
- Linear MCP UUID (`mcp__9d8f80bf-47aa-4193-a076-99b399b9d6dd__*`) is
  the plugin-instance ID — verify it matches the installed plugin on the
  new machine via Claude Code settings
