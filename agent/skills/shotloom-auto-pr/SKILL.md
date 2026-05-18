---
description: Background Shotloom PR watcher + event-driven auto-responder (nohup polls, Claude reacts only on change)
argument-hint: "[start|stop|status|react] <pr-number>"
allowed-tools: Read, Write, Edit, Glob, Grep, Agent, Bash(gh:*), Bash(git:*), Bash(launchctl:*), Bash(bash:*), Bash(cargo:*), Bash(node:*), Bash(jq:*), Bash(chmod:*), Bash(ls:*), Bash(mkdir:*), Bash(date:*), Bash(sed:*), Bash(kill:*), Bash(cat:*)
domains: rust
repo-keys: shotloom
languages: rust,typescript
frameworks: bevy,wgpu
task-types: review
context-profile: shotloom-review
context-rules: rules/git-defaults.md,rules/shotloom.md
exclude-when: unreal,obsidian
---

# shotloom-auto-pr

Split into two halves:

1. **Watcher** — `watch.sh` run in a `nohup` bash sleep-loop spawned by `start.sh` (PID tracked in `~/.claude/ops/pr-<N>/watcher.pid`). Polls PR via `gh` every `INTERVAL` seconds (default 300, override `start.sh <N> 180`), diffs against `state.json`, exits silently on no-change. Claude is NOT invoked on no-change ticks. **macOS note:** launchd is blocked from `~/.claude/` by TCC, so we use `nohup` — watcher dies on reboot; re-run `start.sh` after boot.
2. **Reactor** — `/shotloom-auto-pr react <N>` is a headless handler the watcher fires ONLY when a real change is detected (new comment, new review, CI flipped to fail, state→MERGED/CLOSED). Reads `last-event.json`, applies fixes/replies, exits.

Replaces the old `ScheduleWakeup` loop that burned tokens every 3 min doing nothing.

## Approval exemption

This skill is exempt from the per-PR-comment / per-PR-action approval gate that `~/.claude/rules/git-defaults.md` and `~/.claude/rules/shotloom.md` impose. Authorized 2026-04-21 (user). Mirrored in `~/.claude/rules/shotloom.md` "Approval-gate exceptions" table.

**Auto-approved inside the react cycle:**

- `git commit`, `git push`
- inline review replies (`POST /pulls/<N>/comments/<id>/replies`)
- suppressed-item review-level summary reply (`POST /pulls/<N>/reviews` with `event=COMMENT`)
- reviewer re-request (`POST /pulls/<N>/requested_reviewers`)
- PR body refresh (`gh pr edit <N> --body <content>`) — body content only, no state mutation

**Still requires explicit per-action user approval, even inside auto-pr:** any `gh pr` state-changing flag (create / merge / close / reopen / ready / `edit --base|--title|--draft|--label` / `update-branch`), top-level PR comments, non-`COMMENT` reviews, thread resolution. Canonical list in `~/.claude/rules/shotloom.md` "Approval-gate exceptions" table.

The ready-to-merge report below is logged, not invoked.

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

    Footgun constraints in reference.md "fail_checks resolution constraints".
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
  - Suppressed/review-body findings: `gh api -X POST /repos/CINEV/shotloom/pulls/<N>/reviews -f event=COMMENT -f body=<summary>` — one bundled call per cycle, never multiple.
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
  - merge command (run when ready): gh pr merge <N> --squash
  ```
- **Do NOT auto-invoke `gh pr merge`.** Merge is a state-changing PR action. The skill's blanket approval-exempt scope (`feedback_auto_pr_approval_exempt`) covers comments / pushes / inline replies — NOT merge. Per `rules/git-defaults.md`, every PR-state-changing action requires explicit per-PR user approval.
- The user reads `log.md` (or the watcher's terminal handler when `state==MERGED` later observes the merge from a manual `gh pr merge`) and decides when to merge.
- Do not include `--delete-branch` in the suggested merge command. Task
  branches can be checked out by a worktree, so branch deletion belongs to the
  post-merge worktree cleanup step after the worktree is removed. `gh pr merge
  --delete-branch` can report a local main-worktree checkout conflict after the
  GitHub merge already succeeded; keep merge and cleanup as separate operations.

This is the architectural decision recorded as P0 from the 2026-04-25 skill audit: the prior auto-merge step exceeded the documented exemption.

## Worktree cleanup on MERGED

1. Locate via `git worktree list --porcelain` for `refs/heads/<headRefName>`.
2. If under `.worktrees/`: `git worktree remove <path>` + `git branch -d <headRefName>`.
3. If Linear STL resolvable: invoke `/shotloom-linear-move <STL-NN> Done` silently.
4. Log to `~/.claude/ops/pr-<N>/log.md`.

## Reference (state schema, journal template, nohup rationale, common failures)

See `~/.claude/skills/shotloom-auto-pr/reference.md` — "State file shapes", "Journal on terminal", "Why nohup not launchd", "Common failures".

## Related

- `~/.claude/skills/shotloom-respond-pr/SKILL.md` — manual review response (with approval gate)
- `~/.claude/skills/shotloom-make-pr/SKILL.md` — PR creation
- the PR-scope policy in `~/.claude/skills/shotloom-auto-pr/reference.md` — in-scope classification
- `docs/guidelines/review-rust.md` (in shotloom repo) — canonical Rust review spec
- `~/.claude/rules/shotloom.md` — pre-PR gates
