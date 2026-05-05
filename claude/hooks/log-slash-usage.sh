#!/bin/bash
# UserPromptSubmit hook: detect user-typed slash commands that resolve
# to skills (e.g. `/caol-brief-today`) and append one JSONL row.
#
# User-typed slashes never trigger the Skill tool — Claude Code expands
# them inline. So PreToolUse(Skill) misses 90%+ of real usage. This hook
# closes that gap.
#
# Silent on success; never blocks. Skips non-skill prompts.

set -u

payload=$(cat)

# Debug breadcrumb — keep until accumulating rows show user-typed
# slashes on the dashboard. Remove from here through the matching
# closing brace once verified.
{
    printf '=== %s ===\n' "$(date -u +%Y-%m-%dT%H:%M:%SZ)"
    printf 'payload=%s\n' "$payload"
    printf '\n'
} >> /tmp/slash-hook-debug.log 2>/dev/null

# Extract the skill name from <command-name>/skill-name</command-name>.
# `prompt` field carries the full user submission including the
# command-name tag injected by Claude Code.
prompt=$(printf '%s' "$payload" | jq -r '.prompt // empty' 2>/dev/null)
[ -z "$prompt" ] && exit 0

# Hook stdin gives raw user input (e.g. "/caol-brief-today arg1"); the
# <command-name> tag visible in the model's view is added later, after
# the hook fires.
skill=$(printf '%s' "$prompt" \
    | head -1 \
    | grep -oE '^/[A-Za-z][A-Za-z0-9_-]*' \
    | sed 's|^/||')

[ -z "$skill" ] && exit 0

machine_id=$(jq -r '.machine_id // "unknown"' "$HOME/.claude/private/caol-config/hardware.json" 2>/dev/null) || exit 0
caol_root=$(jq -r '.["caol-ila"].path' "$HOME/.claude/private/caol-config/repo-paths.json" 2>/dev/null) || exit 0
[ -z "$caol_root" ] || [ "$caol_root" = "null" ] && exit 0
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
    --arg skill "$skill" \
    '{ts:$ts, utc_offset_min:$offset, sid:(.session_id // ""), skill:$skill, source:"slash"}' 2>/dev/null) || exit 0

printf '%s\n' "$row" >> "$file"
exit 0
