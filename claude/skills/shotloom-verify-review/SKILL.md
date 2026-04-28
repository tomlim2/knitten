---
description: Verify a Shotloom PR review's inline comments landed and watch for replies
argument-hint: "<pr-number> [review-id]"
allowed-tools: Bash(gh:*), Bash(python3:*), Bash(mkdir:*), Bash(cat:*), Read, CronCreate, CronDelete, CronList
---

# shotloom-verify-review

Two-phase skill for review authors:

1. **Verify** — confirm a posted review's inline comments all landed on the PR (right file, right hunk, right body) right after submission via `gh api .../reviews`.
2. **Watch** — poll the PR for replies / reactions / new reviews directed at this review and notify when something arrives, like `/shotloom-respond-pr` does for reviewees.

## Arguments

- `<pr-number>` — Shotloom PR number (e.g. `194`) or full URL.
- `[review-id]` — Numeric review ID (e.g. `4186650715`). If omitted, picks the most recent review by the active `gh` user on the PR.

**If no PR argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: `/shotloom-verify-review <pr-number> [review-id]`

## Workflow

### Step 1: Resolve PR + review

```bash
PR=<parsed from $ARGUMENTS[0]>
REVIEW_ID=<$ARGUMENTS[1] or auto-pick>
```

If `REVIEW_ID` is missing:

```bash
ME=$(gh api user --jq .login)
gh api /repos/CINEV/shotloom/pulls/${PR}/reviews \
  --jq "[.[] | select(.user.login == \"${ME}\")] | last | .id"
```

If still empty → "No review by ${ME} found on PR #${PR}" and stop.

### Step 2: Verify inline comments landed

Run `python3 ${CLAUDE_SKILL_DIR}/verify.py ${PR} ${REVIEW_ID}` — prints a per-comment table with `path`, `position`, body kind tag (Blocker / Question / Nit / generic), and a pass/fail summary.

Pass criteria:
- All comments returned by the review have a non-null `path` and `position` (or `line`).
- No duplicate `(path, position)` pairs.
- `commit_id` matches the PR head SHA at submission time.

Report the table to the user. If any comment is detached (missing path/position) or the count is suspiciously low, flag it as a verification fail and surface the comment IDs.

The verify script also writes state to `~/.claude/ops/shotloom-verify-review/pr-${PR}-review-${REVIEW_ID}.json` so the watch phase has a baseline.

### Step 3: Offer to start the watch

Ask the user once: "Watch this review for replies?"

If yes → Step 4. If no → stop.

### Step 4: Start CronCreate watcher

Schedule a 1-minute recurring cron that polls for activity directed at this review:

```
CronCreate: cron "*/1 * * * *", recurring true
prompt: "Run python3 ~/.claude/skills/shotloom-verify-review/watch.py ${PR} ${REVIEW_ID} once. If it prints any line tagged NEW:, surface those lines to the user verbatim with the discussion URL. Otherwise stay silent. If the script prints DONE: <reason>, call CronDelete on this job and report why."
```

The watch script (`watch.py`) checks four signals:

1. **Replies under our inline comments** — `gh api /repos/CINEV/shotloom/pulls/${PR}/comments` filtered by `in_reply_to_id ∈ our_comment_ids`.
2. **Reactions on our inline comments** — `gh api /repos/CINEV/shotloom/pulls/comments/<id>/reactions` per comment.
3. **New reviews by others** — `gh api /repos/CINEV/shotloom/pulls/${PR}/reviews` newer than `our_review.submitted_at` and not by us.
4. **PR state change** — merged / closed / `reviewDecision` changed.

State diff is tracked in the state JSON; only new events emit `NEW:` lines. The cron prompt teaches Claude to surface those lines as user notifications.

Stop conditions (script prints `DONE: <reason>`):
- PR is merged or closed.
- 7 days elapsed since review submission with no activity.
- User invokes `/shotloom-verify-review stop ${PR} ${REVIEW_ID}` (handled by inspecting cron list).

### Step 5: Stop watcher (optional subcommand)

If `$ARGUMENTS[0] == "stop"`, list active crons, find the one tagged with this PR + review pair, `CronDelete` it, and report.

## Notes

- This skill is the **author-side mirror** of `/shotloom-respond-pr` (reviewee-side). Same comment-driven loop, opposite role.
- Verification uses GitHub's `position` (legacy diff position) when `line` is null — this is normal for comments anchored to a specific commit hash that has not yet been force-pushed past.
- Watcher does NOT auto-reply. It only notifies. Replying is a separate, approval-gated action.
- Per `~/.claude/rules/git.md`: any reply Claude posts on this PR still requires per-comment user approval. The watcher just surfaces; the user picks what to reply to.

## Related

- `/shotloom-watch-pr` — generic PR watcher (CI + comments + state). Use when you want broad coverage rather than review-author-focused.
- `/shotloom-respond-pr` — reviewee-side flow for fixing + replying to inline review comments.
- `/shotloom-make-pr` — drafting + opening PRs.
