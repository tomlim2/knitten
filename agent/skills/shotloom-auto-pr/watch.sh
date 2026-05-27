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
PAUSE="$OPS_DIR/watcher.paused"

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

# A react cycle may be editing, testing, committing, pushing, or posting
# replies. During that window the watcher loop stays alive but skips polling so
# it cannot spawn a second reactor against the same PR round.
if [[ -f "$PAUSE" ]]; then
  exit 0
fi

# ---- fetch ----
# BOT_LOGIN: this watcher's own gh user. Self-authored comments and reviews
# must be excluded from the change-detection sets, otherwise the inline replies
# the reactor itself posts trigger another react cycle on the next tick.
# Other bot-authored feedback remains visible so actionable review bots can be
# handled by the react policy instead of being dropped at the watcher layer.
BOT_LOGIN=$(gh api user --jq '.login' 2>/dev/null || echo "")

PR_VIEW=$(gh pr view "$PR" --repo "$REPO" --json state,reviewDecision,headRefOid,mergeable,mergeStateStatus,isDraft,title,headRefName,baseRefName,assignees)
if ! jq -e '.assignees | map(.login) | index("tomlim2")' <<<"$PR_VIEW" >/dev/null; then
  if [[ ! -f "$PAUSE" ]]; then
    {
      echo ""
      echo "## $(date -u +%Y-%m-%dT%H:%M:%SZ) — watcher paused"
      echo "- reason: PR is not assigned to tomlim2"
      echo "- action: no react cycle, commit, push, reply, PR body refresh, or reviewer re-request"
    } >> "$LOG"
  fi
  touch "$PAUSE"
  exit 0
fi
COMMENT_IDS=$(gh api "repos/$REPO/pulls/$PR/comments" \
  --jq "[.[] | select(.user.login != \"$BOT_LOGIN\") | .id] | sort")
REVIEW_IDS=$(gh api "repos/$REPO/pulls/$PR/reviews" \
  --jq "[.[] | select(.state != \"PENDING\") | select(.user.login != \"$BOT_LOGIN\") | .id] | sort")
# `link` is the URL to the failing check run on github.com — it embeds the
# workflow run id (and sometimes job id) so the reactor can resolve directly
# instead of guessing from check name. Multi-job workflows have one check per
# job, each with its own link, so this avoids name → run ambiguity.
CHECKS=$(gh pr checks "$PR" --repo "$REPO" --json name,state,workflow,link 2>/dev/null || echo '[]')
CODEX_THUMBS_UP_IDS=$(
  {
    echo -e "issue:$PR\thttps://api.github.com/repos/$REPO/issues/$PR/reactions"
    gh api "repos/$REPO/issues/$PR/comments" --jq '.[] | [.id, .reactions.url] | @tsv'
    gh api "repos/$REPO/pulls/$PR/comments" --jq '.[] | [.id, .reactions.url] | @tsv'
  } | while IFS=$'\t' read -r target_id reactions_url; do
    [[ -n "$target_id" && -n "$reactions_url" ]] || continue
    gh api "$reactions_url" \
      --jq ".[] | select(.user.login == \"chatgpt-codex-connector[bot]\" and .content == \"+1\") | \"${target_id}:\" + (.id | tostring)" \
      2>/dev/null || true
  done | jq -R -s -c 'split("\n") | map(select(length > 0)) | sort'
)

STATE_NOW=$(jq -r '.state' <<<"$PR_VIEW")
SHA_NOW=$(jq -r '.headRefOid' <<<"$PR_VIEW")
FAIL_CHECKS=$(jq -c '[.[] | select(.state=="FAILURE" or .state=="FAILING" or .state=="TIMED_OUT" or .state=="STARTUP_FAILURE") | {name, workflow, link}]' <<<"$CHECKS")
FAIL_COUNT=$(jq 'length' <<<"$FAIL_CHECKS")

# ---- load prior state (bootstrap if missing) ----
if [[ ! -f "$STATE" ]]; then
  OLD_STATE="(bootstrap)"
  OLD_SHA=""
  OLD_COMMENT_IDS="[]"
  OLD_REVIEW_IDS="[]"
  OLD_FAIL_CHECKS="[]"
  OLD_CODEX_THUMBS_UP_IDS="[]"
else
  OLD_STATE=$(jq -r '.state // "(none)"' "$STATE")
  OLD_SHA=$(jq -r '.headRefOid // ""' "$STATE")
  OLD_COMMENT_IDS=$(jq -c '.comment_ids // []' "$STATE")
  OLD_REVIEW_IDS=$(jq -c '.review_ids // []' "$STATE")
  OLD_FAIL_CHECKS=$(jq -c '.fail_checks // []' "$STATE")
  OLD_CODEX_THUMBS_UP_IDS=$(jq -c '.codex_thumbs_up_ids // []' "$STATE")
fi

# ---- diff ----
NEW_COMMENTS=$(jq --argjson old "$OLD_COMMENT_IDS" '. - $old' <<<"$COMMENT_IDS")
NEW_REVIEWS=$(jq --argjson old "$OLD_REVIEW_IDS" '. - $old' <<<"$REVIEW_IDS")
NEW_CODEX_THUMBS_UP_IDS=$(jq --argjson old "$OLD_CODEX_THUMBS_UP_IDS" '. - $old' <<<"$CODEX_THUMBS_UP_IDS")
NEW_COMMENT_COUNT=$(jq 'length' <<<"$NEW_COMMENTS")
NEW_REVIEW_COUNT=$(jq 'length' <<<"$NEW_REVIEWS")
NEW_CODEX_THUMBS_UP_COUNT=$(jq 'length' <<<"$NEW_CODEX_THUMBS_UP_IDS")

CHANGED=0
REASONS=()

# When the head commit moves, every failing check on the new commit is a
# fresh event — even if the check name is identical to one that was already
# failing on the prior sha. Without this the watcher silently drops "same
# check name keeps failing across pushes" cases and the reactor never re-runs.
# Reset OLD_FAIL_CHECKS to empty so the set-diff treats current failures
# as new for this tick.
SHA_CHANGED=0
if [[ -n "$OLD_SHA" && "$SHA_NOW" != "$OLD_SHA" ]]; then
  SHA_CHANGED=1
  REASONS+=("head: ${OLD_SHA:0:7}→${SHA_NOW:0:7}")
  CHANGED=1
  OLD_FAIL_CHECKS="[]"
fi

# Set-diff on fail_checks rather than count comparison: a check that was
# previously passing and is now failing must trigger react even if another
# check became green at the same time (count unchanged, set differs). Diff
# happens AFTER the sha-change reset above so post-push failures count as new.
# Compare by name only — link/workflow may shift between runs even on the
# same sha (rerun changes run id), but `.name` identifies the check stably.
NEW_FAIL_CHECKS=$(jq --argjson old "$OLD_FAIL_CHECKS" \
  '. as $now | $now | map(select(.name as $n | ($old | map(.name)) | index($n) | not))' \
  <<<"$FAIL_CHECKS")
NEW_FAIL_COUNT=$(jq 'length' <<<"$NEW_FAIL_CHECKS")

[[ "$STATE_NOW" != "$OLD_STATE" ]] && { CHANGED=1; REASONS+=("state:${OLD_STATE}→${STATE_NOW}"); }
(( NEW_COMMENT_COUNT > 0 )) && { CHANGED=1; REASONS+=("+$NEW_COMMENT_COUNT comments"); }
(( NEW_REVIEW_COUNT > 0 )) && { CHANGED=1; REASONS+=("+$NEW_REVIEW_COUNT reviews"); }
(( NEW_FAIL_COUNT > 0 )) && { CHANGED=1; REASONS+=("newly failing: $(jq -r '[.[].name] | join(",")' <<<"$NEW_FAIL_CHECKS")"); }

# ---- write state (always, even on no-change — timestamps move forward) ----
jq -n \
  --arg pr "$PR" \
  --argjson view "$PR_VIEW" \
  --argjson comment_ids "$COMMENT_IDS" \
  --argjson review_ids "$REVIEW_IDS" \
  --argjson fail_count "$FAIL_COUNT" \
  --argjson fail_checks "$FAIL_CHECKS" \
  --argjson codex_thumbs_up_ids "$CODEX_THUMBS_UP_IDS" \
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
     codex_thumbs_up_ids: $codex_thumbs_up_ids,
     last_tick: $last_tick
   }' > "$STATE"

# ---- Codex thumbs-up handoff ----
if (( NEW_CODEX_THUMBS_UP_COUNT > 0 )); then
  {
    echo ""
    echo "## $(date -u +%Y-%m-%dT%H:%M:%SZ) — Codex thumbs-up detected"
    echo "- new +1 reactions: $(jq -r 'join(",")' <<<"$NEW_CODEX_THUMBS_UP_IDS")"
  } >> "$LOG"
  if gh api -X POST "repos/$REPO/pulls/$PR/requested_reviewers" \
    -f reviewers[]=ryumiel >/dev/null 2>>"$LOG"; then
    echo "- requested reviewer: ryumiel" >> "$LOG"
  else
    echo "- reviewer request skipped or failed: ryumiel" >> "$LOG"
  fi
fi

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
  --argjson new_fail_checks "$NEW_FAIL_CHECKS" \
  --argjson all_fail_checks "$FAIL_CHECKS" \
  --arg state "$STATE_NOW" \
  --arg sha "$SHA_NOW" \
  '{pr: ($pr|tonumber), kind: "change", state: $state, sha: $sha,
    new_comments: $new_comments, new_reviews: $new_reviews,
    fail_checks: $new_fail_checks,
    all_fail_checks: $all_fail_checks}' > "$EVENT"

# headless claude invocation — reacts once and exits
claude -p "/shotloom-auto-pr react $PR" >>"$OPS_DIR/react.log" 2>&1 &

exit 0
