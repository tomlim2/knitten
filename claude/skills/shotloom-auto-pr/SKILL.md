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

Explicitly exempt from `~/.claude/rules/git.md` per-comment / per-push approval gate (scope = this skill only, authorized 2026-04-21). See `memory/feedback_auto_pr_approval_exempt.md`.

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
 "sha": "...", "new_comments": [...], "new_reviews": [...], "fail_checks": [...]}
```

### kind == "terminal" (MERGED / CLOSED)

- MERGED: journal entry → worktree cleanup → Linear Done transition.
- CLOSED: journal entry only ("closed without merge"). Leave worktree.
- Watcher already unloaded itself. Nothing else to do after journal write.

### kind == "change"

Dispatch by event type:

- **`fail_checks` non-empty** → CI auto-fix:
  - `last-event.json` carries failed check **names**, not job ids. Resolve via `gh run list --branch <head> --json databaseId,name,conclusion --jq '.[] | select(.name==<failed-name> and .conclusion=="failure")' | head -1`, then `gh run view --log-failed --job <id>`.
  - classify: fmt / clippy / test / doc-paths / complex
  - apply fix, re-run the **canonical gate bundle** by delegating to `/shotloom-check-gates` (full). Do NOT cherry-pick a subset here — drift between auto-pr's gate set and the make-pr / commit / respond-pr bundle is exactly the fault the 2026-04-25 audit flagged.
  - green: commit `fix(ci): address <check> on PR #<N>`, `git push`
  - red / ambiguous: log "needs human" in `log.md`, exit without comment

- **`new_comments` or `new_reviews` non-empty** → review auto-respond per `~/.claude/standards/shotloom-pr-scope-policy.md`:
  - classify in-scope / out-of-scope / ambiguous (≥9/10 only counts as ambiguous; ≤8 → pick closest interpretation)
  - in-scope: apply fix, commit, push, inline reply, re-request review roster
  - out-of-scope / ambiguous: briefing block in `log.md`, no reply
  - **MANDATORY: pattern capture per fixed finding.** Before commit, walk the same Step 4.5 logic as `shotloom-respond-pr` — for each fix, decide if it represents a new pattern class for `review-code-rust.md` or matches an existing one, and emit the `Pattern capture: …` block to `log.md`. Without this step, autonomous review fixes silently bypass checklist growth and the same finding will resurface on later PRs.

Protocol details (same as the pre-split skill):

- Inline replies only — `gh api -X POST /repos/CINEV/shotloom/pulls/<N>/comments/<id>/replies`. Never top-level.
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
| Lockfile leftover | `rm ~/.claude/ops/pr-<N>/watch.lock` |
| Watcher not firing | `kill -0 $(cat ~/.claude/ops/pr-<N>/watcher.pid)` — dead → re-run `start.sh`. Tail `watcher.log` for last tick. |
| `gh` auth prompt in nohup ctx | keychain locked at login; run `gh auth status` interactively in a regular shell once |
| Duplicate react runs | `flock` in `watch.sh` prevents concurrent ticks; overlapping `claude -p` sessions are fine — each diffs state.json fresh and is idempotent |
| Failed-check job-id resolution | `last-event.json` stores check **names** (not job ids). Reactor must call `gh run list --json` and resolve name → job-id before `gh run view --log-failed --job <id>`. |
| Stale launchd plist from old install | `stop.sh <N>` unloads + removes any `com.shotloom.autopr.<N>.plist` left behind |

## Related

- `~/.claude/skills/shotloom-respond-pr/SKILL.md` — manual review response (with approval gate)
- `~/.claude/skills/shotloom-make-pr/SKILL.md` — PR creation
- `~/.claude/standards/shotloom-pr-scope-policy.md` — in-scope classification
- `~/.claude/standards/review-code-rust.md` — Rust review patterns
- `~/.claude/rules/shotloom-git.md` — pre-PR gates
