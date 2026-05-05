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
#   2. Symlink claude/hooks/{log,sync}-skill-usage.sh into ~/.claude/hooks/.
#   3. Merge PreToolUse Skill hook into ~/.claude/settings.json.
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
for s in log-skill-usage.sh sync-skill-usage.sh; do
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

# Step 3 — settings.json hook merge
if [ ! -f "$SETTINGS" ]; then
  echo '{}' > "$SETTINGS"
fi
already=$(jq '.hooks.PreToolUse // [] | map(select(.matcher == "Skill")) | length' "$SETTINGS")
if [ "$already" = "0" ]; then
  cp "$SETTINGS" "$SETTINGS.bak.$(date +%s)"
  tmp=$(mktemp)
  jq '.hooks //= {} | .hooks.PreToolUse //= [] | .hooks.PreToolUse += [{
    "matcher": "Skill",
    "hooks": [{"type": "command", "command": "$HOME/.claude/hooks/log-skill-usage.sh"}]
  }]' "$SETTINGS" > "$tmp"
  mv "$tmp" "$SETTINGS"
  echo "✓ PreToolUse Skill hook added (open /hooks or restart Claude Code to activate)"
else
  echo "✓ PreToolUse Skill hook already present"
fi

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
echo "Done. Open /hooks once or restart Claude Code so the Skill hook activates."
