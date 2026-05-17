#!/bin/bash
# SessionStart hook: if the session starts in the shotloom repo, emit a compact briefing
# of worktrees, open PRs, and stale-looking work so the user knows where they left off.
#
# Reads {cwd, ...} JSON from stdin. Silent exit if not in shotloom.

set -euo pipefail

input=$(cat)
cwd=$(printf '%s' "$input" | /usr/bin/python3 -c 'import json,sys;print(json.load(sys.stdin).get("cwd",""))' 2>/dev/null || echo "")

case "$cwd" in
  */shotloom|*/shotloom-github|*/shotloom-github/*|*/shotloom/*) ;;
  *) exit 0 ;;
esac

repo=$("$HOME/.claude/skills/ah-resolve-doc-path/resolve.sh" repo shotloom 2>/dev/null \
  | awk -F= '/^RESOLVED_PATH=/{print $2; exit}')
[ -d "$repo" ] || exit 0

# Pull a few quick reads. Errors go silent — this is advisory, not a gate.
wt_count=$(git -C "$repo" worktree list 2>/dev/null | wc -l | tr -d ' ')
wt_count=$((wt_count - 1))  # exclude the main checkout

open_prs=""
if command -v gh >/dev/null 2>&1; then
  open_prs=$(gh pr list --repo CINEV/shotloom --author @me --state open --json number,title 2>/dev/null \
    | /usr/bin/python3 -c 'import json,sys;d=json.load(sys.stdin);print(" ".join(f"#{p[\"number\"]}" for p in d))' 2>/dev/null || echo "")
fi

dirty_wts=$(git -C "$repo" worktree list --porcelain 2>/dev/null | awk '/^worktree/{wt=$2} END{}' && \
  git -C "$repo" worktree list --porcelain 2>/dev/null | awk '/^worktree/{print $2}' | \
  while read -r wt; do
    if [ -d "$wt" ]; then
      if [ -n "$(git -C "$wt" status --porcelain 2>/dev/null)" ]; then
        basename "$wt"
      fi
    fi
  done | tr '\n' ' ')

[ -z "$dirty_wts" ] && dirty_wts="(none)"
[ -z "$open_prs" ] && open_prs="(none)"

cat <<REMINDER
<system-reminder>
Shotloom session detected. Quick status:
- Active worktrees: ${wt_count}
- Dirty worktrees: ${dirty_wts}
- Open PRs (mine): ${open_prs}

Run \`/shotloom-status\` for the full dashboard.
Start new work with \`/shotloom-start-task STL-NN\` — the hook will also auto-trigger when you mention a Linear issue.
</system-reminder>
REMINDER

exit 0
