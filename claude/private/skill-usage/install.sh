#!/bin/bash
# One-shot installer for skill-usage tracking on a new machine.
# Idempotent — safe to re-run.
#
# Prereqs:
#   - caol-ila cloned and registered in ~/.claude/private/caol-config/repo-paths.json
#   - hardware.json present (run /system-save-hardware if missing)
#   - jq installed
#
# What it does:
#   1. Generate a machine_id UUID into hardware.json (skips if already set).
#   2. Symlink claude/hooks/{log-skill,log-slash,sync-skill}-usage.sh into
#      ~/.claude/hooks/.
#   3. Merge two hooks into ~/.claude/settings.json:
#        - PreToolUse matcher=Skill -> log-skill-usage.sh
#          (model-initiated Skill tool calls)
#        - UserPromptSubmit          -> log-slash-usage.sh
#          (user-typed `/skill-name` slash commands; Claude Code expands
#           these inline, so PreToolUse never fires for them — see
#           claude/learnings/learning-claude-code-hooks.md).
#   4. Install + load launchd plist for periodic git push (every 30 min).

set -euo pipefail

CAOL_CONFIG="$HOME/.claude/private/caol-config"
HARDWARE="$CAOL_CONFIG/hardware.json"
SETTINGS="$HOME/.claude/settings.json"
HOOKS_DIR="$HOME/.claude/hooks"
PLIST="$HOME/Library/LaunchAgents/com.caol.skill-usage-sync.plist"

command -v jq >/dev/null || { echo "ERROR: jq required"; exit 1; }
[ -f "$HARDWARE" ] || { echo "ERROR: $HARDWARE missing — run /system-save-hardware"; exit 1; }

REPO_ROOT=$(jq -r '.["caol-ila"].path' "$CAOL_CONFIG/repo-paths.json")
REPO_ROOT="${REPO_ROOT/#\~/$HOME}"
[ -d "$REPO_ROOT/.git" ] || { echo "ERROR: caol-ila path invalid: $REPO_ROOT"; exit 1; }

# Step 1 — machine_id
existing=$(jq -r '.machine_id // ""' "$HARDWARE")
if [ -z "$existing" ]; then
  new_id=$(uuidgen | tr '[:upper:]' '[:lower:]')
  tmp=$(mktemp)
  jq --arg id "$new_id" '. + {machine_id: $id}' "$HARDWARE" > "$tmp"
  mv "$tmp" "$HARDWARE"
  echo "✓ machine_id: $new_id"
else
  echo "✓ machine_id (existing): $existing"
fi

# Step 2 — hook scripts
# If ~/.claude is itself a symlink into caol-ila/claude (author's setup),
# the hooks are already at $HOOKS_DIR via that parent symlink — no-op.
mkdir -p "$HOOKS_DIR"
for s in log-skill-usage.sh log-slash-usage.sh sync-skill-usage.sh; do
  src="$REPO_ROOT/claude/hooks/$s"
  dst="$HOOKS_DIR/$s"
  [ -f "$src" ] || { echo "ERROR: missing $src — pull caol-ila first"; exit 1; }
  if [ -e "$dst" ] && [ "$(stat -f %i "$src")" = "$(stat -f %i "$dst")" ]; then
    echo "✓ $s already in place (same inode)"
  elif [ "$src" = "$(readlink "$dst" 2>/dev/null || echo "")" ]; then
    echo "✓ $s already linked"
  else
    [ -e "$dst" ] && mv "$dst" "$dst.bak.$(date +%s)"
    ln -s "$src" "$dst"
    echo "✓ $s linked"
  fi
done

# Step 3 — settings.json hook merge (two hooks)
if [ ! -f "$SETTINGS" ]; then
  echo '{}' > "$SETTINGS"
fi
SKILL_CMD="$HOOKS_DIR/log-skill-usage.sh"
SLASH_CMD="$HOOKS_DIR/log-slash-usage.sh"

# Backup once if either hook is missing.
needs_backup=0
[ "$(jq '[.hooks.PreToolUse[]? | select(.matcher == "Skill")] | length' "$SETTINGS")" = "0" ] && needs_backup=1
if [ "$(jq --arg cmd "$SLASH_CMD" '[.hooks.UserPromptSubmit[]? | (.hooks // [])[]? | select(.command == $cmd)] | length' "$SETTINGS")" = "0" ]; then
  needs_backup=1
fi
[ "$needs_backup" = "1" ] && cp "$SETTINGS" "$SETTINGS.bak.$(date +%s)"

# 3a — PreToolUse Skill (replace any existing Skill matcher; preserve others)
tmp=$(mktemp)
jq --arg cmd "$SKILL_CMD" '
  .hooks //= {}
  | .hooks.PreToolUse = (
      ((.hooks.PreToolUse // []) | map(select(.matcher != "Skill")))
      + [{matcher: "Skill", hooks: [{type: "command", command: $cmd}]}]
    )
' "$SETTINGS" > "$tmp"
mv "$tmp" "$SETTINGS"
echo "✓ PreToolUse Skill -> $SKILL_CMD"

# 3b — UserPromptSubmit (idempotent: skip if our command already registered)
tmp=$(mktemp)
jq --arg cmd "$SLASH_CMD" '
  .hooks //= {}
  | .hooks.UserPromptSubmit = (
      (.hooks.UserPromptSubmit // []) as $existing
      | if [$existing[] | (.hooks // [])[]? | select(.command == $cmd)] | length > 0
        then $existing
        else $existing + [{hooks: [{type: "command", command: $cmd}]}]
        end
    )
' "$SETTINGS" > "$tmp"
mv "$tmp" "$SETTINGS"
echo "✓ UserPromptSubmit -> $SLASH_CMD (slash commands)"
echo "  Open /hooks or restart Claude Code so both hooks activate."

# Step 4 — launchd
mkdir -p "$(dirname "$PLIST")"
cat > "$PLIST" <<PLIST_EOF
<?xml version="1.0" encoding="UTF-8"?>
<!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
<plist version="1.0">
<dict>
    <key>Label</key>
    <string>com.caol.skill-usage-sync</string>
    <key>ProgramArguments</key>
    <array>
        <string>$HOOKS_DIR/sync-skill-usage.sh</string>
    </array>
    <key>StartInterval</key>
    <integer>1800</integer>
    <key>RunAtLoad</key>
    <false/>
    <key>StandardOutPath</key>
    <string>$HOOKS_DIR/sync-skill-usage.log</string>
    <key>StandardErrorPath</key>
    <string>$HOOKS_DIR/sync-skill-usage.err</string>
    <key>EnvironmentVariables</key>
    <dict>
        <key>PATH</key>
        <string>/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin</string>
    </dict>
</dict>
</plist>
PLIST_EOF
launchctl unload "$PLIST" 2>/dev/null || true
launchctl load "$PLIST"
echo "✓ launchd agent loaded (com.caol.skill-usage-sync, 30 min interval)"

echo ""
echo "Done. Open /hooks once or restart Claude Code so both hooks activate."
echo ""
echo "Verify:"
echo "  # model-initiated (rare):"
echo "  echo '{\"tool_input\":{\"skill\":\"x\"}}' | $SKILL_CMD"
echo "  # user-typed slash (most usage):"
echo "  type any /skill-name in Claude Code, then:"
echo "    cat \$HOME/.claude/private/skill-usage/*/\$(date +%Y-%m).jsonl | tail"
