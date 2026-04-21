---
description: Fully-automatic Shotloom PR watcher — detect CI/reviews, fix, push, reply without approval
argument-hint: "[pr-number]"
allowed-tools: Read, Edit, Write, Glob, Grep, Agent, Bash(gh:*), Bash(git:*), Bash(cargo:*), Bash(node:*), Bash(mkdir:*), Bash(date:*)
---

# shotloom-auto-pr

Fully-automatic orchestrator that detects CI results and new review comments on a Shotloom PR, auto-fixes issues, commits, pushes, and posts inline replies without per-action approval. Logs a briefing per cycle.

## Approval exemption

This skill is **explicitly exempt** from the `~/.claude/rules/git.md` per-comment / per-push approval gate. Scope is this skill only — authorized by the user on 2026-04-21 ("이 pr 답변은 승인 해제시킵니다"). See `memory/feedback_auto_pr_approval_exempt.md`.

All other skills and manual flows still require approval.

## Arguments

- `[pr-number]` — optional PR number. If omitted, auto-detect the open PR for the current branch.

Usage: `/shotloom-auto-pr` or `/shotloom-auto-pr 123`

## Workflow

### Step 1: Bootstrap (first invocation only)

1. Pre-flight checks — stop on any failure:
   - `gh auth status` → `tomlim2` must be `Active: true`.
   - `git log -1 --format="%an <%ae>"` → must be `tomlim2 <deemo@vonvon.me>`.
   - `gh repo view --json nameWithOwner -q .nameWithOwner` → must be `CINEV/shotloom`.

2. Resolve PR number:
   - If `$ARGUMENTS` provided, use it.
   - Else: `gh pr view --json number -q .number` (detects PR for current branch).
   - If no open PR, report and stop.

3. Create ops dir: `~/.claude/private/ops/pr-<N>/`
   - `log.md` — append-only briefing log
   - `state.json` — snapshot for diff (comment count, review count, check summary, last sha)

4. Capture baseline snapshot and write `state.json`:
   ```bash
   gh pr view <N> --json state,title,headRefName,baseRefName,reviewDecision,statusCheckRollup,headRefOid
   gh api repos/CINEV/shotloom/pulls/<N>/comments --jq 'length'
   gh api repos/CINEV/shotloom/pulls/<N>/reviews --jq 'length'
   gh pr checks <N>
   ```

5. Append bootstrap entry to `log.md`:
   ```
   ## <ISO timestamp> — bootstrap
   PR #<N> "<title>" <branch> → <base>
   checks: <summary>  comments: <n>  reviews: <n>  decision: <decision>
   ```

6. Report to user: "Auto-pr watching PR #<N>. Polling every 3 min."

7. Schedule next tick via `ScheduleWakeup`:
   - `delaySeconds: 180`
   - `prompt: "/shotloom-auto-pr <N>"`
   - `reason: "auto-pr poll tick for PR #<N>"`

### Step 2: Poll tick (every wake-up)

1. Read `~/.claude/private/ops/pr-<N>/state.json` for prior snapshot.

2. Fetch fresh state in parallel (single message, multi Bash):
   ```bash
   gh pr view <N> --json state,reviewDecision,statusCheckRollup,headRefOid
   gh api repos/CINEV/shotloom/pulls/<N>/comments
   gh api repos/CINEV/shotloom/pulls/<N>/reviews
   gh pr checks <N>
   ```

3. Compute diffs vs prior state:
   - `new_comments` = comments with id not in prior set
   - `new_reviews` = reviews with id not in prior set (filter state ≠ `PENDING`)
   - `check_transition` = which checks flipped since last tick (pending→pass, pending→fail, pass→fail)
   - `state_change` = merged / closed / approved / changes_requested

4. Decide action:

   | Signal | Action |
   |--------|--------|
   | state == MERGED or CLOSED | Log final entry, stop loop (do NOT reschedule) |
   | Any check flipped to FAIL | Go to Step 3 (CI auto-fix) |
   | new_comments or new_reviews | Go to Step 4 (auto-respond) |
   | All checks green, no new feedback | Silent tick. Update state.json. Reschedule. |

5. Always update `state.json` with the fresh snapshot at the end of the tick.

6. Always reschedule (unless stop condition) via `ScheduleWakeup` 180s.

### Step 3: CI auto-fix branch

1. Append to `log.md`:
   ```
   ## <ts> — CI failure detected
   failed checks: <list>
   ```

2. Fetch failing logs:
   ```bash
   gh run view --log-failed --job <job-id>
   ```
   (derive `<job-id>` from `gh pr checks <N> --json name,link,state`)

3. Classify failure:
   - `cargo fmt` → run `cargo fmt` and stage diff
   - `cargo clippy` → read clippy error, apply Edit to address (simple cases: unused import, needless_borrow, etc.)
   - `cargo test` → read test failure, attempt fix
   - `node scripts/validate-doc-paths.mjs` → repair broken link paths
   - Complex / ambiguous → log as "needs human", skip auto-fix, continue polling (do not post a comment)

4. If a fix was applied:
   - Re-run local gates in parallel: `cargo fmt --check`, `cargo clippy --workspace -- -D warnings`, `cargo check --workspace --exclude shotloom-desktop`, `node scripts/validate-doc-paths.mjs`.
   - On green: commit with conventional message `fix(ci): address <check-name> failure on PR #<N>`, `git push`.
   - On red: append to `log.md` as "auto-fix failed, needs human", continue.

5. Append outcome to `log.md`.

### Step 4: Auto-respond to review feedback

**Binding policy:** [`~/.claude/standards/shotloom-pr-scope-policy.md`](../../standards/shotloom-pr-scope-policy.md) — read and apply. Every new comment gets classified into **in-scope / out-of-scope / ambiguous** before any action.

1. Checkout PR branch if not already: `git checkout <headRefName> && git pull`.

2. **Classify each new comment** per the policy (indicators listed there). For ambiguity, assign a 0–10 score; only ≥9 counts as ambiguous. Pick the closest interpretation for anything ≤8 — do not bail.

3. **In-scope items only** → run the resolution loop from `shotloom-respond-pr` Step 4 (read file, apply fix). After each fix, run the Step-4.5 pattern-capture logic from `shotloom-respond-pr` — match against `review-code-rust.md` patterns and, if a new recurring pattern emerges, draft the pattern entry and append to the end-of-cycle briefing under **"New review-patterns detected"**. Do NOT auto-edit `review-code-rust.md` from the loop; surface for user review.

4. After all in-scope fixes, run validation gates in parallel. If green, commit + push:
   ```
   fix(review): address PR #<N> feedback

   - <item 1>
   - <item 2>

   Related to STL-NN  (if branch name encodes one)
   ```

5. **Post inline replies for in-scope items only — no approval prompt.** Use:
   ```bash
   gh api -X POST /repos/CINEV/shotloom/pulls/<N>/comments/<comment_id>/replies -f body="<reply>"
   ```
   Reply body: `Fixed in <sha-short>. <brief>.`

6. Resolve review threads via GraphQL mutation `resolveReviewThread` for each fixed in-scope comment (same pattern as `shotloom-respond-pr` Step 6).

7. **Out-of-scope items** — NO reply, NO resolve, NO Linear issue created. Add draft issue block to the briefing per policy.

8. **Ambiguous items (≥9/10)** — NO reply, NO resolve, NO fix. Add comment quote + interpretations to the briefing per policy.

9. Write the end-of-cycle briefing to `~/.claude/private/ops/pr-<N>/log.md` in the three-section format from the policy (auto-resolved / needs new issue / ambiguous). If all three sections empty, emit nothing.

10. Loop continues regardless of how many items ended up out-of-scope or ambiguous. Only the termination conditions in Step 5 stop the loop.

### Step 5: Stop conditions

Stop (do NOT reschedule) when:
- PR state is MERGED or CLOSED
- User says stop in conversation
- Same feedback item appears unchanged for 3 consecutive cycles (auto-fix stuck → hand to human)
- 30 consecutive silent ticks (90 min idle) — park the loop, leave a log note, require manual re-invoke

Write final entry to `log.md` and report to user.

### Step 5.3: PR-closed journal entry (always on MERGED or CLOSED)

Whenever the loop stops because the PR reached `MERGED` or `CLOSED`, append one entry to `~/.claude/private/ops/shotloom-pr-journal.md`:

```markdown
## PR #<N> — <MERGED | CLOSED> <ISO timestamp>
**Title:** <title>
**Branch:** <headRefName> → <baseRefName>
**Linear:** STL-NN  (if resolvable from branch/commit/body)
**Duration:** <first-commit → close, in hours>
**Final checks:** <pass/fail counts>
**Merge commit:** <sha> (MERGED only)
**Closed without merge reason:** <from PR body or last comment> (CLOSED only)

**Auto-pr cycle totals:**
- In-scope auto-resolved: <count>
- Out-of-scope surfaced (new Linear needed): <count>
- Ambiguous surfaced: <count>
- Auto-fix failures handed to human: <count>

**New review-patterns detected this PR:** <count, listed inline>

---
```

Create the file if it doesn't exist. Always append; never rewrite prior entries. Use it as a running log.

### Step 5.5: Worktree cleanup on MERGED

If the stop reason is `MERGED` (not CLOSED, not idle, not user-stop):

1. Resolve the worktree path from the PR's head branch:
   ```bash
   # from the main repo root
   git worktree list --porcelain | awk '/^worktree/{wt=$2} /^branch /{if($2=="refs/heads/<headRefName>") print wt}'
   ```

2. If a worktree is found under `.worktrees/` (or wherever `shotloom-start-code` created it):
   - `cd` out of it first if current cwd is inside
   - `git worktree remove <path>` (add `--force` only if there are uncommitted local changes — report them in the final briefing)
   - Delete the now-merged local branch: `git branch -d <headRefName>` (use `-D` only if `-d` refuses because the branch isn't fully in base — in which case log it and skip the delete rather than force)
   - Log the cleanup in `log.md`:
     ```
     ## <ts> — worktree cleanup
     Removed worktree: <path>
     Removed branch:   <headRefName>
     ```

3. If no matching worktree is found, note "no worktree to clean up" in the log and continue.

4. On CLOSED (not merged), leave the worktree alone — user may want to salvage work. Just log "PR closed without merge — worktree preserved at <path>".

5. **Linear Done transition** — bound to worktree cleanup. If a worktree was removed in step 2 AND a Linear STL was resolvable from the branch/commit/PR body, invoke `/shotloom-linear-move <STL-NN> Done` silently (pre-approved per auto-caller list). Skip if Linear state is already Done / Canceled. Done transition happens at the same moment as worktree removal — if cleanup was skipped because no worktree existed, Linear move is also skipped (user handles manually).

## Subagent usage

- Step 2 fetches — parallel Bash calls in a single message.
- Step 3/4 independent file fixes — dispatch `Agent(subagent_type: general-purpose, model: sonnet)` for each unrelated file.
- Validation gates — parallel background Bash.

Main thread stays as orchestrator: collect diffs, stage, commit, push, reply, log.

## Binding rules

- Each reply is inline (per-comment endpoint), never top-level.
- Commit messages follow `docs/guidelines/commit-guideline.md` (conventional, imperative, ≤80 char subject, no Co-Authored-By).
- All file gates must pass before push — never push red.
- `git add` by filename, never `-A` / `-f`.
- If `state.json` is missing on a non-bootstrap tick, treat as fresh bootstrap (don't replay history, just re-baseline and continue).

## Common failures

| Symptom | Fix |
|---------|-----|
| `gh auth` wrong account | `gh auth switch --user tomlim2`, retry tick |
| Reply endpoint 404 on old comment ID | PR was force-pushed, re-fetch comments, retry once |
| Auto-fix clippy change re-introduces warning | Log as "needs human", skip reschedule for that check only |
| `ScheduleWakeup` delay < 60s rejected | Runtime clamps; not an error |
| Multiple PRs watched | Each invocation schedules its own wake-up keyed to its PR number |

## Related

- `~/.claude/skills/shotloom-watch-pr/SKILL.md` — passive watcher (no auto-fix, no auto-reply)
- `~/.claude/skills/shotloom-respond-pr/SKILL.md` — manual review response (has approval gate)
- `~/.claude/skills/shotloom-make-pr/SKILL.md` — PR creation
- `~/.claude/rules/git.md` — default PR comment rules (this skill is exempt)
- `~/.claude/rules/shotloom-git.md` — pre-PR gates
- `~/.claude/standards/review-code-rust.md` — Rust review patterns for auto-fix classification
