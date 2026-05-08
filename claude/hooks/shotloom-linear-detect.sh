#!/bin/bash
# UserPromptSubmit hook: detect Linear / Shotloom work-start signals, inject reminder.
#
# Fires on every user prompt. Reads {cwd, prompt} JSON from stdin.
# If cwd is under shotloom-github AND prompt contains a work-start signal,
# emits a system reminder on stdout telling Claude to invoke /shotloom-start-code.
#
# Silent (exit 0, no stdout) when no match — no token cost.

set -euo pipefail

input=$(cat)
cwd=$(printf '%s' "$input" | /usr/bin/python3 -c 'import json,sys;print(json.load(sys.stdin).get("cwd",""))' 2>/dev/null || echo "")
prompt=$(printf '%s' "$input" | /usr/bin/python3 -c 'import json,sys;print(json.load(sys.stdin).get("prompt",""))' 2>/dev/null || echo "")

case "$cwd" in
  */shotloom-github*) ;;
  *) exit 0 ;;
esac

# Work-start signals (case-insensitive)
shopt -s nocasematch
signal=""
if [[ "$prompt" =~ STL-[0-9]+ ]]; then
  signal="Linear issue ID (${BASH_REMATCH[0]})"
elif [[ "$prompt" =~ linear\.app/[^[:space:]]*issue ]]; then
  signal="Linear issue URL"
elif [[ "$prompt" =~ (리니어|linear).*(시작|작업|구현|하자|해줘|만들자|고치자) ]]; then
  signal="Linear work-start phrase"
elif [[ "$prompt" =~ (시작|작업|구현|해줘|고치자).*(리니어|linear|STL) ]]; then
  signal="Linear work-start phrase"
fi
shopt -u nocasematch

[ -z "$signal" ] && exit 0

# Skip if user already invoked the skill or we're already in mode
case "$prompt" in
  */shotloom-start-code*) exit 0 ;;
esac

cat <<'REMINDER'
<system-reminder>
Shotloom work-start signal detected (Linear reference in prompt, cwd under shotloom-github).

MUST invoke the `/shotloom-start-code` skill now — before any Edit/Write/code reasoning. That skill performs the mandatory pre-write flow: Linear issue fetch via MCP, repo conventions re-read, category detection, targeted section load from shotloom-programming.md, ADR scan, and a Ready briefing.

Do not answer, plan, or edit code until /shotloom-start-code has completed.
</system-reminder>
REMINDER

exit 0
