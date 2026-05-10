#!/bin/bash
# Stop hook: if the session is stopping with uncommitted shotloom changes,
# remind the user before the assistant terminates.
#
# Input: {cwd, ...} JSON on stdin. Stdout is injected.
# Silent if nothing dirty.

set -euo pipefail

input=$(cat)
cwd=$(printf '%s' "$input" | /usr/bin/python3 -c 'import json,sys;print(json.load(sys.stdin).get("cwd",""))' 2>/dev/null || echo "")

case "$cwd" in
  */shotloom-github*) ;;
  *) exit 0 ;;
esac

# Collect dirty worktrees under shotloom
dirty=""
main=/Users/deemooooooooo/Desktop/www/shotloom-github

while IFS= read -r wt; do
  [ -d "$wt" ] || continue
  if [ -n "$(git -C "$wt" status --porcelain 2>/dev/null)" ]; then
    branch=$(git -C "$wt" rev-parse --abbrev-ref HEAD 2>/dev/null || echo "?")
    dirty="${dirty}  - ${wt} (${branch})\n"
  fi
done < <(git -C "$main" worktree list --porcelain 2>/dev/null | awk '/^worktree /{print $2}')

[ -z "$dirty" ] && exit 0

printf "<system-reminder>\nSession ending with uncommitted Shotloom changes:\n%b\nConsider committing via \`/shotloom-commit\` before stopping.\n</system-reminder>\n" "$dirty"

exit 0
