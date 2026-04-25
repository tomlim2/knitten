#!/usr/bin/env bash
# shotloom-auto-pr watcher — polls a single PR, updates state.json,
# invokes claude -p only when an actual change is detected.
#
# Usage: watch.sh <pr-number>
# Called by start.sh's nohup sleep loop every N seconds (NOT launchd —
# launchd is blocked from ~/.claude/ by macOS TCC). Designed to exit 0
# silently on no-change.

set -euo pipefail

PR="${1:?usage: watch.sh <pr-number>}"
REPO="CINEV/shotloom"
OPS_DIR="$HOME/.claude/ops/pr-$PR"
STATE="$OPS_DIR/state.json"
LOG="$OPS_DIR/log.md"
LOCK="$OPS_DIR/watch.lock"
EVENT="$OPS_DIR/last-event.json"

mkdir -p "$OPS_DIR"

# single-instance lock (bail silently if another watcher tick is running)
# Try flock first; if unavailable on this host, fall back to atomic mkdir.
LOCK_MODE=""
if command -v flock >/dev/null 2>&1; then
  exec 9>"$LOCK"
  if ! flock -n 9; then
    exit 0
  fi
  LOCK_MODE="flock"
else
  MKDIR_LOCK="$OPS_DIR/watch.lock.d"
  if ! mkdir "$MKDIR_LOCK" 2>/dev/null; then
    exit 0
  fi
  LOCK_MODE="mkdir"
  trap 'rmdir "$MKDIR_LOCK" 2>/dev/null || true' EXIT
fi

# ---- fetch ----
PR_VIEW=$(gh pr view "$PR" --repo "$REPO" --json state,reviewDecision,headRefOid,mergeable,mergeStateStatus,isDraft,title,headRefName,baseRefName)
COMMENT_IDS=$(gh api "repos/$REPO/pulls/$PR/comments" --jq '[.[].id] | sort')
REVIEW_IDS=$(gh api "repos/$REPO/pulls/$PR/reviews" --jq '[.[] | select(.state != "PENDING") | .id] | sort')
CHECKS=$(gh pr checks "$PR" --repo "$REPO" --json name,state 2>/dev/null || echo '[]')

STATE_NOW=$(jq -r '.state' <<<"$PR_VIEW")
SHA_NOW=$(jq -r '.headRefOid' <<<"$PR_VIEW")
FAIL_CHECKS=$(jq -r '[.[] | select(.state=="FAILURE" or .state=="FAILING" or .state=="TIMED_OUT" or .state=="STARTUP_FAILURE") | .name]' <<<"$CHECKS")
FAIL_COUNT=$(jq 'length' <<<"$FAIL_CHECKS")

# ---- load prior state (bootstrap if missing) ----
if [[ ! -f "$STATE" ]]; then
  OLD_STATE="(bootstrap)"
  OLD_SHA=""
  OLD_COMMENT_IDS="[]"
  OLD_REVIEW_IDS="[]"
  OLD_FAIL_CHECKS="[]"
else
  OLD_STATE=$(jq -r '.state // "(none)"' "$STATE")
  OLD_SHA=$(jq -r '.headRefOid // ""' "$STATE")
  OLD_COMMENT_IDS=$(jq -c '.comment_ids // []' "$STATE")
  OLD_REVIEW_IDS=$(jq -c '.review_ids // []' "$STATE")
  OLD_FAIL_CHECKS=$(jq -c '.fail_checks // []' "$STATE")
fi

# ---- diff ----
NEW_COMMENTS=$(jq --argjson old "$OLD_COMMENT_IDS" '. - $old' <<<"$COMMENT_IDS")
NEW_REVIEWS=$(jq --argjson old "$OLD_REVIEW_IDS" '. - $old' <<<"$REVIEW_IDS")
NEW_COMMENT_COUNT=$(jq 'length' <<<"$NEW_COMMENTS")
NEW_REVIEW_COUNT=$(jq 'length' <<<"$NEW_REVIEWS")

# Set-diff on fail_checks rather than count comparison: a check that was
# previously passing and is now failing must trigger react even if another
# check became green at the same time (count unchanged, set differs).
NEW_FAIL_CHECKS=$(jq --argjson old "$OLD_FAIL_CHECKS" '. - $old' <<<"$FAIL_CHECKS")
NEW_FAIL_COUNT=$(jq 'length' <<<"$NEW_FAIL_CHECKS")

CHANGED=0
REASONS=()

[[ "$STATE_NOW" != "$OLD_STATE" ]] && { CHANGED=1; REASONS+=("state:$OLD_STATE→$STATE_NOW"); }
(( NEW_COMMENT_COUNT > 0 )) && { CHANGED=1; REASONS+=("+$NEW_COMMENT_COUNT comments"); }
(( NEW_REVIEW_COUNT > 0 )) && { CHANGED=1; REASONS+=("+$NEW_REVIEW_COUNT reviews"); }
(( NEW_FAIL_COUNT > 0 )) && { CHANGED=1; REASONS+=("newly failing: $(jq -r 'join(",")' <<<"$NEW_FAIL_CHECKS")"); }

# ---- write state (always, even on no-change — timestamps move forward) ----
jq -n \
  --arg pr "$PR" \
  --argjson view "$PR_VIEW" \
  --argjson comment_ids "$COMMENT_IDS" \
  --argjson review_ids "$REVIEW_IDS" \
  --argjson fail_count "$FAIL_COUNT" \
  --argjson fail_checks "$FAIL_CHECKS" \
  --arg last_tick "$(date -u +%Y-%m-%dT%H:%M:%SZ)" \
  '{
     pr: ($pr | tonumber),
     state: $view.state,
     title: $view.title,
     headRefName: $view.headRefName,
     baseRefName: $view.baseRefName,
     headRefOid: $view.headRefOid,
     reviewDecision: $view.reviewDecision,
     mergeable: $view.mergeable,
     mergeStateStatus: $view.mergeStateStatus,
     isDraft: $view.isDraft,
     comment_ids: $comment_ids,
     review_ids: $review_ids,
     fail_count: $fail_count,
     fail_checks: $fail_checks,
     last_tick: $last_tick
   }' > "$STATE"

# ---- stop if terminal ----
if [[ "$STATE_NOW" == "MERGED" || "$STATE_NOW" == "CLOSED" ]]; then
  {
    echo ""
    echo "## $(date -u +%Y-%m-%dT%H:%M:%SZ) — PR $STATE_NOW"
    echo "Watcher self-disabling."
  } >> "$LOG"
  # write terminal event so react handler can do journal/worktree cleanup
  jq -n --arg pr "$PR" --arg state "$STATE_NOW" --arg reason "terminal" \
    '{pr: ($pr|tonumber), kind: "terminal", state: $state}' > "$EVENT"
  claude -p "/shotloom-auto-pr react $PR" >/dev/null 2>&1 &
  # unload launchd agent for this PR
  PLIST="$HOME/Library/LaunchAgents/com.shotloom.autopr.$PR.plist"
  [[ -f "$PLIST" ]] && launchctl unload "$PLIST" 2>/dev/null && rm -f "$PLIST"
  exit 0
fi

# ---- no change: exit silently (no log write, no claude invocation) ----
if (( CHANGED == 0 )); then
  exit 0
fi

# ---- change detected: log event and hand off to claude ----
{
  echo ""
  echo "## $(date -u +%Y-%m-%dT%H:%M:%SZ) — change detected"
  for r in "${REASONS[@]}"; do echo "- $r"; done
} >> "$LOG"

jq -n \
  --arg pr "$PR" \
  --argjson new_comments "$NEW_COMMENTS" \
  --argjson new_reviews "$NEW_REVIEWS" \
  --argjson fail_checks "$FAIL_CHECKS" \
  --arg state "$STATE_NOW" \
  --arg sha "$SHA_NOW" \
  '{pr: ($pr|tonumber), kind: "change", state: $state, sha: $sha,
    new_comments: $new_comments, new_reviews: $new_reviews,
    fail_checks: $fail_checks}' > "$EVENT"

# headless claude invocation — reacts once and exits
claude -p "/shotloom-auto-pr react $PR" >>"$OPS_DIR/react.log" 2>&1 &

exit 0
