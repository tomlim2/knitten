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
   - `delaySeconds: 600`
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

6. **Resolve review threads (MANDATORY, same cycle as the reply).** For every in-scope comment that received a reply in step 5, resolve its thread via GraphQL `resolveReviewThread`. Replying without resolving leaves stale "unresolved" threads on the PR page and forces the reviewer to click through each one — do not skip this.

   Query thread IDs once per cycle:
   ```bash
   gh api graphql -f query='
   query {
     repository(owner: "CINEV", name: "shotloom") {
       pullRequest(number: <N>) {
         reviewThreads(first: 50) {
           nodes {
             id
             isResolved
             comments(first: 1) { nodes { databaseId } }
           }
         }
       }
     }
   }' --jq '.data.repository.pullRequest.reviewThreads.nodes[] | select(.isResolved | not) | {thread: .id, first_comment: .comments.nodes[0].databaseId}'
   ```

   Then for each thread whose `first_comment` is an in-scope comment you replied to:
   ```bash
   gh api graphql -f query="mutation { resolveReviewThread(input: {threadId: \"<threadId>\"}) { thread { id isResolved } } }"
   ```

   Do NOT resolve threads for out-of-scope or ambiguous items — the reviewer's un-resolved state is the signal that a follow-up (new Linear issue or clarification) is still owed.

6.5. **Re-request review from the PR's actual reviewer roster (MANDATORY).**

   After replying and resolving threads, re-request review so the reviewers get a fresh "review requested" notification. Without this, the PR appears "done" from their side even though you pushed new commits.

   **Source of truth — query the PR's reviewer roster directly. Do NOT infer from comment authors (a drive-by commenter is not necessarily a reviewer, and a team reviewer who hasn't commented still counts).**

   Build the roster as the union of:
   ```bash
   # Currently pending review requests (users + teams).
   gh pr view <N> --json reviewRequests -q '.reviewRequests[].login' \
     2>/dev/null
   # Everyone who has submitted any review (APPROVED, CHANGES_REQUESTED,
   # or COMMENTED). COMMENTED reviews don't show up in `latestReviews`,
   # so hit the REST reviews endpoint instead.
   gh api repos/CINEV/shotloom/pulls/<N>/reviews \
     --jq '[.[].user.login] | unique | .[]'
   ```

   Dedup, drop the PR author (`gh pr view <N> --json author -q .author.login`), and for each remaining login:
   ```bash
   gh api -X POST /repos/CINEV/shotloom/pulls/<N>/requested_reviewers \
     -f "reviewers[]=<login>"
   ```

   Skip re-request in any of these cases:
   - No in-scope items were fixed in this cycle (nothing to re-review).
   - Roster is empty after dedup/author-drop (solo PR with no reviewers — log `re-request skipped: no roster` and continue).
   - The API returns 404 or 422 for a specific login — log `re-request skipped: <login> (<reason>)` and continue; this happens when the user is no longer a collaborator, or a team reviewer needs a different endpoint.

   After success, append to the end-of-cycle briefing:
   ```
   Re-requested review: <login1>, <login2>
   ```

7. **Out-of-scope items** — NO reply, NO resolve, NO Linear issue created. Add draft issue block to the briefing per policy.

8. **Ambiguous items (≥9/10)** — NO reply, NO resolve, NO fix. Add comment quote + interpretations to the briefing per policy.

9. Write the end-of-cycle briefing to `~/.claude/private/ops/pr-<N>/log.md` in the three-section format from the policy (auto-resolved / needs new issue / ambiguous). If all three sections empty, emit nothing.

10. Loop continues regardless of how many items ended up out-of-scope or ambiguous. Only the termination conditions in Step 5 stop the loop.

### Step 4.5: Auto-merge when mergeable

Run this check at the end of every tick, AFTER steps 3 and 4 have settled the current cycle (i.e. any pending fix-commit has been pushed and CI has re-run to green). The purpose is to close out a PR that has nothing left for the reviewer to do.

1. Fetch merge state:
   ```bash
   gh pr view <N> --json state,isDraft,mergeable,mergeStateStatus,reviewDecision,title,statusCheckRollup
   ```

2. Gate — ALL of the following must be true. Any single `false` → skip auto-merge, continue polling.

   | Condition | Required value |
   |-----------|---------------|
   | `state` | `OPEN` |
   | `isDraft` | `false` |
   | `mergeable` | `MERGEABLE` (not `CONFLICTING`, not `UNKNOWN`) |
   | `mergeStateStatus` | `CLEAN` or `UNSTABLE` |
   | Required checks | all SUCCESS (non-required bot failures like `summary-pr / summary` are OK under `UNSTABLE`) |
   | `reviewDecision` | **`APPROVED`** — MUST have at least one reviewer approval. Empty string is NOT acceptable; skip auto-merge until a human reviewer approves. Never `CHANGES_REQUESTED`. |
   | Review comments | Every top-level review comment and every inline review thread must either be resolved OR classified in-scope and have a fix pushed in this PR. No open "please do X" request may remain unaddressed at merge time. |
   | Title guard | does NOT contain `WIP`, `[wip]`, `[draft]`, `[no-automerge]`, or `do not merge` |
   | Unresolved review threads | zero (query via GraphQL, same as Step 4.6) |

   `UNSTABLE` vs `CLEAN`: `CLEAN` = every check green; `UNSTABLE` = required checks green, at least one non-required check failed. GitHub allows merging `UNSTABLE` when branch protection does not require that check. Treat both as mergeable — Shotloom's known flaky non-required check is `summary-pr / summary` (AI PR Summary bot).

   **Explicit rule — no solo merge.** Even if the repo has no branch protection requiring a reviewer, auto-pr NEVER merges a PR that has `reviewDecision == ""`. A solo push-to-main via squash-merge bypasses the human-in-the-loop that this workflow exists to provide. The author is welcome to self-merge manually via `gh pr merge` if they want that shortcut; auto-pr will not do it for them.

3. Merge:
   ```bash
   gh pr merge <N> --squash --delete-branch --auto=false
   ```
   Use `--squash` as the default strategy (match recent Shotloom merges — sample with `gh pr list --state merged --limit 5 --json mergeCommit` if unsure). `--delete-branch` removes the remote branch; local worktree cleanup is handled in Step 5.5.

4. On success:
   - Log:
     ```
     ## <ts> — auto-merged
     PR #<N> squash-merged as <sha>. Remote branch deleted.
     ```
   - Fall through to Step 5 — the next tick will observe `state == MERGED` and trigger the normal stop path (journal entry + worktree cleanup + Linear Done).

5. On failure (e.g., `gh pr merge` returns non-zero because branch protection rejected it, or a race condition changed the state):
   - Log the stderr.
   - Do NOT retry in this tick.
   - Continue polling — next tick will re-evaluate.

6. **Never auto-merge when:**
   - The PR was opened in the current cycle (let at least one CI run complete first).
   - The last push was within 60 seconds (CI may still be attaching checks; merge gate may be stale).
   - A required reviewer exists and has not yet approved.

### Step 5: Stop conditions

Stop (do NOT reschedule) when:
- PR state is MERGED or CLOSED
- User says stop in conversation
- Same feedback item appears unchanged for 3 consecutive cycles (auto-fix stuck → hand to human)
- 30 consecutive silent ticks (90 min idle) — park the loop, leave a log note, require manual re-invoke

Write final entry to `log.md` and report to user.

### Step 5.3: PR-closed journal entry (always on MERGED or CLOSED)

Whenever the loop stops because the PR reached `MERGED` or `CLOSED`, append one entry to the durable PR journal. Resolve the path via `machine-paths.json` (per `rules/runtime.md`):

```bash
# resolver: prefer vault, fallback to staging
base=$(jq -re '.["obsidian-vault-claude"] // .["obsidian-staging"]' ~/.claude/private/machine-paths.json)
journal_path="$base/shotloom-pr-journal.md"
```

On work Mac (vault absent) this resolves to `{caol-ila}/claude/obsidian-staging/shotloom-pr-journal.md`. On home Mac it resolves to `{vault}/claude/shotloom-pr-journal.md`. Never hardcode `~/.claude/private/ops/` for this — that directory is for transient per-PR cycle state only (`pr-<N>/log.md`, `state.json`), not durable records.

Append format:

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
- **Default poll interval is 180s (3 min).** Per user preference (2026-04-21). Raise to 600s+ only when the PR has been idle for multiple consecutive silent ticks and nothing is in-flight, to conserve cache. Lower (down to 60s floor) only while actively waiting on CI for a just-pushed sha.
- **Silent ticks emit ZERO user-facing text.** When the poll shows no new comments, no new reviews, no check transition, and no state change: update `state.json`, append one line to `log.md`, call `ScheduleWakeup`, and **stop without writing any chat message** — no "Tick N/30 idle", no "다음 XX:XX", no status bubble, nothing. Tool calls only. The next wake-up fires via the harness hook; the user doesn't need confirmation each cycle. Reserve chat output for cycles where the poll actually detected something (new comment, new review, check transition, state change, stop condition).

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
