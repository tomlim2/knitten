#!/bin/bash
# PreToolUse hook for Skill matcher: append one JSONL row per Skill invocation.
# Reads tool payload JSON from stdin, writes to per-machine, per-month log under
# caol-ila/claude/private/skill-usage/<machine_id>/<YYYY-MM>.jsonl.
# Silent on success; never blocks the tool call.

set -u

# Buffer stdin so a parse failure doesn't drop the payload.
payload=$(cat)

machine_id=$(jq -r '.machine_id // "unknown"' "$HOME/.claude/private/caol-config/hardware.json" 2>/dev/null) || exit 0
caol_root=$(jq -r '.["caol-ila"].path' "$HOME/.claude/private/caol-config/repo-paths.json" 2>/dev/null) || exit 0
[ -z "$caol_root" ] || [ "$caol_root" = "null" ] && exit 0

# Expand leading ~
caol_root="${caol_root/#\~/$HOME}"

dir="$caol_root/claude/private/skill-usage/$machine_id"
file="$dir/$(date +%Y-%m).jsonl"
mkdir -p "$dir" 2>/dev/null || exit 0

ts=$(date -u +%Y-%m-%dT%H:%M:%SZ)
offset=$(date +%z | awk '{
  s=substr($0,1,1); h=substr($0,2,2)+0; m=substr($0,4,2)+0;
  sign=(s=="+")?1:-1;
  print sign*(h*60+m);
}')
row=$(printf '%s' "$payload" | jq -c \
  --arg ts "$ts" \
  --argjson offset "$offset" \
  '{ts:$ts, utc_offset_min:$offset, sid:(.session_id // ""), skill:(.tool_input.skill // "unknown")}' 2>/dev/null) || exit 0

printf '%s\n' "$row" >> "$file"
exit 0
