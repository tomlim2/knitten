---
description: Background Shotloom PR watcher + event-driven auto-responder (nohup polls, Claude reacts only on change)
argument-hint: "[start|stop|status|react] <pr-number>"
allowed-tools: Read, Write, Edit, Glob, Grep, Agent, Bash(gh:*), Bash(git:*), Bash(launchctl:*), Bash(bash:*), Bash(cargo:*), Bash(node:*), Bash(jq:*), Bash(chmod:*), Bash(ls:*), Bash(mkdir:*), Bash(date:*), Bash(sed:*), Bash(kill:*), Bash(cat:*)
---

# shotloom-auto-pr

Split into two halves:

1. **Watcher** — `watch.sh` run in a `nohup` bash sleep-loop spawned by `start.sh` (PID tracked in `~/.claude/ops/pr-<N>/watcher.pid`). Every 180s polls PR via `gh`, diffs against `state.json`, exits silently on no-change. Claude is NOT invoked on no-change ticks. **macOS note:** launchd is blocked from `~/.claude/` by TCC, so we use `nohup` — watcher dies on reboot; re-run `start.sh` after boot. `stop.sh` keeps a legacy `launchctl unload` guard for hosts that still have a stale plist from earlier launchd-based versions.
2. **Reactor** — `/shotloom-auto-pr react <N>` is a headless handler the watcher fires ONLY when a real change is detected (new comment, new review, CI flipped to fail, state→MERGED/CLOSED). Reads `last-event.json`, applies fixes/replies, exits.

Replaces the old `ScheduleWakeup` loop that burned tokens every 3 min doing nothing.

## Approval exemption

This skill is exempt from the per-PR-comment / per-PR-action approval gate that `~/.claude/rules/git.md` and `~/.claude/rules/shotloom.md` impose. Authorized 2026-04-21 (user). See:

- `~/.claude/rules/shotloom.md` — bullet "**`/shotloom-auto-pr` skill — additional blanket exemption**"
- `(deleted memory file)`

**Auto-approved inside the react cycle:**

- `git commit`, `git push`
- inline review replies (`POST /pulls/<N>/comments/<id>/replies`)
- suppressed-item review-level summary reply (`POST /pulls/<N>/reviews` with `event=COMMENT`)
- reviewer re-request (`POST /pulls/<N>/requested_reviewers`)
- PR body refresh (`gh pr edit <N> --body …`) — body content only, no state mutation

**Still requires explicit per-action user approval, even inside auto-pr:**

- `gh pr create`, `gh pr merge`, `gh pr close`, `gh pr reopen`, `gh pr ready`
- `gh pr edit --base`, `--title`, `--draft`, `--label` (any state-changing flag)
- `gh pr update-branch` (rebase/merge of base into PR head)
- top-level PR comments via `/issues/<N>/comments` or `gh pr comment`
- `gh pr review --approve` / `--request-changes` (any review with non-`COMMENT` event)
- thread resolution (graphql `resolveReviewThread`)

The ready-to-merge report below is logged, not invoked. This list is mirrored in `~/.claude/rules/shotloom.md` and ``(deleted memory file)``; change all three together.

The exemption applies to **this skill only**. `/shotloom-respond-pr` is unaffected and keeps the per-comment batch approval gate.

## Subcommands

- `/shotloom-auto-pr start <N>` — spawn nohup watcher. Default action if first arg is a number.
- `/shotloom-auto-pr stop <N>` — kill watcher PID, clean up any legacy launchd plist.
- `/shotloom-auto-pr status` — list active watcher PIDs + last tick per PR.
- `/shotloom-auto-pr react <N>` — invoked by watcher. Not typed manually.

## Start workflow

1. Pre-flight: `gh auth status` shows `tomlim2` active, `gh repo view -q .nameWithOwner` is `CINEV/shotloom`.
2. Resolve PR number. If no arg: `gh pr view --json number -q .number`.
3. `chmod +x ~/.claude/skills/shotloom-auto-pr/{watch,start,stop}.sh` if needed.
4. Run `~/.claude/skills/shotloom-auto-pr/start.sh <N>`.
5. `start.sh` spawns a `nohup` background loop running `watch.sh <N>` every 180s (default `INTERVAL=300` — `start.sh <N> 180` overrides).
6. Report: "watcher PID <pid> for PR #<N>. logs: ~/.claude/ops/pr-<N>/{watcher,react}.log"

## Stop workflow

`~/.claude/skills/shotloom-auto-pr/stop.sh <N>` — `kill -- -<pgid>` the watcher process group; also unload any stale launchd plist that legacy installs may have left behind.

## Status workflow

```bash
# Active nohup watchers
for d in ~/.claude/ops/pr-*; do
  [[ -f "$d/watcher.pid" ]] || continue
  pid=$(cat "$d/watcher.pid")
  if kill -0 "$pid" 2>/dev/null; then
    echo "PR ${d##*/pr-} watcher PID $pid alive"
  else
    echo "PR ${d##*/pr-} watcher PID $pid stale"
  fi
done

# Stale launchd leftovers (legacy)
ls ~/Library/LaunchAgents/com.shotloom.autopr.*.plist 2>/dev/null

# Per-PR state snapshot
for d in ~/.claude/ops/pr-*; do
  [[ -f "$d/state.json" ]] && jq -r '"PR \(.pr) [\(.state)] last=\(.last_tick) fail=\(.fail_count)"' "$d/state.json"
done
```

## React workflow (invoked by watcher)

Fires only when `watch.sh` detects a change. Reads `~/.claude/ops/pr-<N>/last-event.json`:

```json
{"pr": 141, "kind": "change"|"terminal", "state": "OPEN|MERGED|CLOSED",
 "sha": "...",
 "new_comments": [...],          // comment ids new since last tick, bot-authored excluded
 "new_reviews": [...],           // review ids new since last tick, bot-authored excluded
 "fail_checks": [{"name": "...", "workflow": "...", "link": "..."}, ...],
                                 // checks failing on this tick that count as new
                                 // (set diff against prior tick OR all current
                                 // failures when sha changed since last tick)
 "all_fail_checks": [...]}       // current full failing-check set, same shape;
                                 // diagnostic context, NOT a trigger
```

**Trigger semantics:**
- Dispatch CI auto-fix only on `fail_checks` (the set diff or, when the head commit moved this tick, the full current failure set re-treated as new).
- `all_fail_checks` exists so the reactor can show the full red surface in `log.md` without re-firing on persisted failures.
- If `fail_checks` is empty but `all_fail_checks` is not, the change came from comments/reviews — do not enter the CI-fix branch on that tick.
- The `link` field on each entry is the canonical lookup key for the failing run (and, when single-job, the failing job). Reactor must prefer `link` over `name` for `gh run view --log-failed --job <id>` resolution.

### kind == "terminal" (MERGED / CLOSED)

- MERGED: journal entry → worktree cleanup → Linear Done transition.
- CLOSED: journal entry only ("closed without merge"). Leave worktree.
- Watcher already unloaded itself. Nothing else to do after journal write.

### kind == "change"

Dispatch by event type:

- **`fail_checks` non-empty (set diff against prior tick — sha change resets the diff so post-push failures count as new)** → CI auto-fix:
  - `last-event.json`'s `fail_checks` is an array of **objects** `{name, workflow, link}` written by `watch.sh`. Use `link` as the canonical lookup key — it is the github.com URL to the failing check run and embeds both `run_id` and (when single-job) `job_id`. Name-based matching against `gh run list` is unreliable: multi-job workflows have one check per job whose `name` differs from the workflow's `name`, so `gh run list` filtered by check name can miss the run entirely.

    ```bash
    EVENT_FILE="$HOME/.claude/ops/pr-$PR/last-event.json"
    sha=$(jq -r '.sha' "$EVENT_FILE")

    # Iterate every newly-failing check; one log fetch per check.
    jq -c '.fail_checks[]' "$EVENT_FILE" | while read -r check; do
      name=$(jq -r '.name' <<<"$check")
      link=$(jq -r '.link // ""' <<<"$check")

      # Preferred path: parse run_id (and job_id when present) from link.
      # Examples:
      #   .../actions/runs/12345678                  -> run-only
      #   .../actions/runs/12345678/job/87654321     -> run + job
      run_id=$(sed -nE 's|.*/actions/runs/([0-9]+).*|\1|p' <<<"$link")
      job_id=$(sed -nE 's|.*/job/([0-9]+).*|\1|p' <<<"$link")

      # Fallback: link missing (older check format) → resolve via sha + name.
      # Filter by --commit so the tick's actual head commit is the lookup
      # key, not every historical run on the branch.
      if [[ -z "$run_id" ]]; then
        run_id=$(gh run list --commit "$sha" \
          --json databaseId,name,conclusion \
          --jq ".[] | select(.name==\"$name\" and .conclusion==\"failure\") | .databaseId" \
          | head -1)
      fi
      if [[ -z "$run_id" ]]; then
        echo "no failing run for $name @ $sha — re-run may have cleared it; skip" >> "$LOG"
        continue
      fi

      # If link gave only run_id, resolve job_id from that run.
      if [[ -z "$job_id" ]]; then
        job_id=$(gh run view "$run_id" --json jobs \
          --jq ".jobs[] | select(.conclusion==\"failure\") | .databaseId" \
          | head -1)
      fi
      if [[ -z "$job_id" ]]; then
        echo "run $run_id reports failure but no failing job; skip $name" >> "$LOG"
        continue
      fi

      gh run view --log-failed --job "$job_id"
      # ... apply fix per failed check, then re-run gates and commit (below)
    done
    ```

    Constraints:
    - Do NOT pass `databaseId` from `gh run list` directly to `--job` — that is a run id and the call silently returns nothing useful.
    - Do NOT use `--branch` instead of `--commit` — branch filter is sha-agnostic and can hand back a run from a previous push that happens to share the same workflow name.
    - Do NOT match `gh run list` by check `name` alone in a multi-job workflow — the check name is per-job, not per-workflow. The link-based path above is failure-immune to this; the fallback path is best-effort and will correctly skip when name resolution fails.
  - classify: fmt / clippy / test / doc-paths / complex
  - apply fix, re-run the **canonical gate bundle** by delegating to `/shotloom-check-gates` (full). Do NOT cherry-pick a subset here — drift between auto-pr's gate set and the make-pr / commit / respond-pr bundle is exactly the fault the 2026-04-25 audit flagged.
  - green: commit `fix(ci): address <check> on PR #<N>`, `git push`
  - red / ambiguous: log "needs human" in `log.md`, exit without comment

- **`new_comments` or `new_reviews` non-empty** → review auto-respond per the PR-scope policy in `~/.claude/skills/shotloom-auto-pr/reference.md`:
  - classify in-scope / out-of-scope / ambiguous (≥9/10 only counts as ambiguous; ≤8 → pick closest interpretation)
  - **inline vs suppressed split** — every finding is either an inline comment (has `comment_id` in the `/comments` REST array) or a suppressed/review-body item (lives only inside a `/reviews` body). The two groups have different reply surfaces and must NOT be conflated:
    - **inline in-scope** → apply fix, gate commit on pattern capture, commit, push, **inline reply** via `POST /pulls/<N>/comments/<comment_id>/replies` (one per finding)
    - **suppressed in-scope** → apply fix, gate commit on pattern capture, commit, push, **single review-level summary** via `POST /pulls/<N>/reviews` with `event=COMMENT` (one bundled body covering every suppressed finding addressed this tick — never one review per finding, never event=APPROVE/REQUEST_CHANGES)
  - re-request review roster runs once per react cycle, after both reply paths above have posted
  - out-of-scope / ambiguous (either inline or suppressed) → briefing block in `log.md`, no reply, no resolve
  - **MANDATORY review-rules gate (mirrors `shotloom-respond-pr` Step 4.5):** for every resolved finding (inline AND suppressed), confirm the fix matches a rule in in-repo `docs/guidelines/review-rust.md` or, if the finding surfaces a new rule class not yet documented there, draft a follow-up to add it via a separate PR against that file. Emit a `Review-rule capture:` block to `log.md` with one line per resolved finding (matched section name / new-rule-needed: <one-line> / `skipped — typo`).
  - **Commit is gated on this block.** If the count of `Pattern capture:` lines does not match the count of fixed findings (inline + suppressed combined), do NOT `git add` — return to capture step. The block is the only proof the step ran; without the gate, the step gets silently skipped (this happened on PR #166).

Protocol details (same as the pre-split skill):

- Two reply surfaces, used in parallel within one react cycle (see split above):
  - Inline-comment findings: `gh api -X POST /repos/CINEV/shotloom/pulls/<N>/comments/<id>/replies` — one call per finding.
  - Suppressed/review-body findings: `gh api -X POST /repos/CINEV/shotloom/pulls/<N>/reviews -f event=COMMENT -f body=…` — one bundled call per cycle, never multiple.
  - Top-level PR comments via `/issues/<N>/comments` (or `gh pr comment`) are **forbidden** — they bypass the review thread surface that the merge gate's "zero unresolved threads" check is meant to drive.
- **Never resolve review threads.** The reviewer owns the "Resolve conversation" click — it is their signal that the fix landed and is acceptable. Claude replies and pushes; the thread stays open until a human resolves it. The merge gate's `zero unresolved threads` check then gives the reviewer explicit veto until they are satisfied.
- MANDATORY: re-request review from PR roster union (`reviewRequests` + anyone in `/reviews` REST, dedup, drop author).
- Commits: conventional, imperative, ≤80 char subject, no Co-Authored-By.
- `git add` by filename; never `-A` / `-f`.
- **Run the canonical Shotloom gate bundle** before commit: delegate to `/shotloom-check-gates` (full — fmt + clippy + check + **test** + doc-paths). The earlier per-skill subset (fmt/clippy/check/doc-paths only, no test) drifted from the bundle and let test regressions ship to CI. Tests are part of the gate, not optional.

## Ready-to-merge report (NOT auto-merge)

End of react cycle, after any push lands + CI green:

- Compute the merge-ready signals: `state==OPEN`, `isDraft==false`, `mergeable==MERGEABLE`, `mergeStateStatus∈{CLEAN,UNSTABLE}`, `reviewDecision==APPROVED` (not empty, not CHANGES_REQUESTED), zero unresolved threads, title has no WIP/draft/no-automerge markers.
- If all signals pass, **append a single line to `log.md`**:
  ```
  ## <ts> — ready to merge
  - all gates green, reviewDecision=APPROVED, threads clean.
  - merge command (run when ready): gh pr merge <N> --squash --delete-branch
  ```
- **Do NOT auto-invoke `gh pr merge`.** Merge is a state-changing PR action. The skill's blanket approval-exempt scope (`feedback_auto_pr_approval_exempt`) covers comments / pushes / inline replies — NOT merge. Per `rules/git.md`, every PR-state-changing action requires explicit per-PR user approval.
- The user reads `log.md` (or the watcher's terminal handler when `state==MERGED` later observes the merge from a manual `gh pr merge`) and decides when to merge.

This is the architectural decision recorded as P0 from the 2026-04-25 skill audit: the prior auto-merge step exceeded the documented exemption.

## Journal on terminal

Resolve via `machine-paths.json`:

```bash
base=$(jq -re '.["obsidian-vault-claude"] // .["obsidian-staging"]' ~/.claude/private/caol-config/machine-paths.json)
journal="$base/shotloom-pr-journal.md"
```

Append: `## PR #<N> — <MERGED|CLOSED> <ts>` + title/branch/linear/duration/merge-commit/cycle-totals.

## Worktree cleanup on MERGED

1. Locate via `git worktree list --porcelain` for `refs/heads/<headRefName>`.
2. If under `.worktrees/`: `git worktree remove <path>` + `git branch -d <headRefName>`.
3. If Linear STL resolvable: invoke `/shotloom-linear-move <STL-NN> Done` silently.
4. Log to `~/.claude/ops/pr-<N>/log.md`.

## State file shapes

**`state.json`** (owned by `watch.sh`):

```json
{
  "pr": 141, "state": "OPEN", "title": "...", "headRefName": "...",
  "baseRefName": "main", "headRefOid": "...", "reviewDecision": "",
  "mergeable": "MERGEABLE", "mergeStateStatus": "CLEAN", "isDraft": false,
  "comment_ids": [], "review_ids": [], "fail_count": 0, "fail_checks": [],
  "last_tick": "2026-04-22T08:57:00Z"
}
```

**`last-event.json`** (watcher writes, react reads): present only on change / terminal.

**`log.md`**: append-only. Entries only on real events. No silent-tick lines.

## Why nohup not launchd / cron / ScheduleWakeup

- launchd is **blocked** from `~/.claude/` by macOS TCC; jobs queued there silently fail to fire. Earlier versions tried launchd; this one runs `watch.sh` from a `nohup` bash sleep loop owned by `start.sh`.
- nohup loop survives the user logging out but **does not survive reboot** — re-run `start.sh <N>` after boot.
- Per-PR PID file in `~/.claude/ops/pr-<N>/watcher.pid` makes stop/start surgical.
- Separate `watcher.log` / `react.log` per PR.
- Does NOT consume Claude context tokens on no-change ticks — only fires `claude -p` when `watch.sh` detects a diff.
- `stop.sh` carries a legacy `launchctl unload` guard so hosts that still have a stale plist from a launchd-era install can be cleanly converted by running `stop.sh` once.

## Common failures

| Symptom | Fix |
|---------|-----|
| `claude: command not found` in `watcher.log` | `~/.local/bin` not on PATH for the nohup process; export PATH in `start.sh` or use the absolute claude path |
| Lockfile leftover | flock-based: `rm ~/.claude/ops/pr-<N>/watch.lock`. mkdir-fallback (no flock on host): `rmdir ~/.claude/ops/pr-<N>/watch.lock.d`. The trap cleans the mkdir lock automatically; only manual cleanup needed if the watcher was SIGKILL'd. |
| Watcher not firing | `kill -0 $(cat ~/.claude/ops/pr-<N>/watcher.pid)` — dead → re-run `start.sh`. Tail `watcher.log` for last tick. |
| `gh` auth prompt in nohup ctx | keychain locked at login; run `gh auth status` interactively in a regular shell once |
| Duplicate react runs | `flock` in `watch.sh` prevents concurrent ticks; overlapping `claude -p` sessions are fine — each diffs state.json fresh and is idempotent |
| Failed-check job-id resolution | `last-event.json` stores check **names** (not job ids). Reactor must call `gh run list --json` and resolve name → job-id before `gh run view --log-failed --job <id>`. |
| Stale launchd plist from old install | `stop.sh <N>` unloads + removes any `com.shotloom.autopr.<N>.plist` left behind |

## Related

- `~/.claude/skills/shotloom-respond-pr/SKILL.md` — manual review response (with approval gate)
- `~/.claude/skills/shotloom-make-pr/SKILL.md` — PR creation
- the PR-scope policy in `~/.claude/skills/shotloom-auto-pr/reference.md` — in-scope classification
- `docs/guidelines/review-rust.md` (in shotloom repo) — Rust review SSOT
- `~/.claude/rules/shotloom.md` — pre-PR gates
