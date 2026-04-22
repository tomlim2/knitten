---
description: Background Shotloom PR watcher + event-driven auto-responder (launchd polls, Claude reacts only on change)
argument-hint: "[start|stop|status|react] <pr-number>"
allowed-tools: Read, Write, Edit, Glob, Grep, Agent, Bash(gh:*), Bash(git:*), Bash(launchctl:*), Bash(bash:*), Bash(cargo:*), Bash(node:*), Bash(jq:*), Bash(chmod:*), Bash(ls:*), Bash(mkdir:*), Bash(date:*), Bash(sed:*)
---

# shotloom-auto-pr

Split into two halves:

1. **Watcher** — `watch.sh` run in a `nohup` bash sleep-loop (PID tracked in `~/.claude/ops/pr-<N>/watcher.pid`). Every 180s polls PR via `gh`, diffs against `state.json`, exits silently on no-change. Claude is NOT invoked on no-change ticks. **macOS note:** launchd is blocked from `~/.claude/` by TCC, so we use `nohup` — watcher dies on reboot; re-run `start.sh` after boot.
2. **Reactor** — `/shotloom-auto-pr react <N>` is a headless handler the watcher fires ONLY when a real change is detected (new comment, new review, CI flipped to fail, state→MERGED/CLOSED). Reads `last-event.json`, applies fixes/replies, exits.

Replaces the old `ScheduleWakeup` loop that burned tokens every 3 min doing nothing.

## Approval exemption

Explicitly exempt from `~/.claude/rules/git.md` per-comment / per-push approval gate (scope = this skill only, authorized 2026-04-21). See `memory/feedback_auto_pr_approval_exempt.md`.

## Subcommands

- `/shotloom-auto-pr start <N>` — register launchd watcher. Default action if first arg is a number.
- `/shotloom-auto-pr stop <N>` — unload watcher.
- `/shotloom-auto-pr status` — list registered watchers + last tick per PR.
- `/shotloom-auto-pr react <N>` — invoked by watcher. Not typed manually.

## Start workflow

1. Pre-flight: `gh auth status` shows `tomlim2` active, `gh repo view -q .nameWithOwner` is `CINEV/shotloom`.
2. Resolve PR number. If no arg: `gh pr view --json number -q .number`.
3. `chmod +x ~/.claude/skills/shotloom-auto-pr/{watch,start,stop}.sh` if needed.
4. Run `~/.claude/skills/shotloom-auto-pr/start.sh <N>`.
5. `launchd` fires `watch.sh <N>` immediately (`RunAtLoad=true`) and every 180s thereafter.
6. Report: "watcher loaded for PR #<N>. logs: ~/.claude/ops/pr-<N>/watch.{out,err}.log"

## Stop workflow

`~/.claude/skills/shotloom-auto-pr/stop.sh <N>` — unload + remove plist.

## Status workflow

```bash
ls ~/Library/LaunchAgents/com.shotloom.autopr.*.plist 2>/dev/null
launchctl list | grep shotloom.autopr
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
  - `gh run view --log-failed --job <id>` for each failed check
  - classify: fmt / clippy / test / doc-paths / complex
  - apply fix, re-run local gates in parallel (`cargo fmt --check`, `cargo clippy --workspace -- -D warnings`, `cargo check --workspace --exclude shotloom-desktop`, `node scripts/validate-doc-paths.mjs`)
  - green: commit `fix(ci): address <check> on PR #<N>`, `git push`
  - red / ambiguous: log "needs human" in `log.md`, exit without comment

- **`new_comments` or `new_reviews` non-empty** → review auto-respond per `~/.claude/standards/shotloom-pr-scope-policy.md`:
  - classify in-scope / out-of-scope / ambiguous (≥9/10 only counts as ambiguous; ≤8 → pick closest interpretation)
  - in-scope: apply fix, commit, push, inline reply, resolve thread, re-request review roster
  - out-of-scope / ambiguous: briefing block in `log.md`, no reply, no resolve

Protocol details (same as the pre-split skill):

- Inline replies only — `gh api -X POST /repos/CINEV/shotloom/pulls/<N>/comments/<id>/replies`. Never top-level.
- MANDATORY: resolve replied threads via GraphQL `resolveReviewThread`.
- MANDATORY: re-request review from PR roster union (`reviewRequests` + anyone in `/reviews` REST, dedup, drop author).
- Commits: conventional, imperative, ≤80 char subject, no Co-Authored-By.
- `git add` by filename; never `-A` / `-f`.

## Auto-merge gate

End of react cycle, after any push lands + CI green:

- Require: `state==OPEN`, `isDraft==false`, `mergeable==MERGEABLE`, `mergeStateStatus∈{CLEAN,UNSTABLE}`, **`reviewDecision==APPROVED`** (never empty, never CHANGES_REQUESTED), zero unresolved threads, title has no WIP/draft/no-automerge markers.
- **No solo merge** — empty `reviewDecision` NEVER merges.
- On pass: `gh pr merge <N> --squash --delete-branch`. Next watcher tick observes `state==MERGED` and fires terminal path.

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

## Why launchd not cron / not ScheduleWakeup

- launchd survives reboot (`RunAtLoad=true`).
- Per-PR label makes stop/start surgical.
- Separate stdout/stderr log files per PR.
- `StartInterval: 180` is kernel-accurate.
- Does NOT consume Claude context tokens on no-change ticks — only fires `claude -p` when `watch.sh` detects a diff.

## Common failures

| Symptom | Fix |
|---------|-----|
| `claude: command not found` in `watch.err.log` | plist PATH missing `~/.local/bin`; edit template and reload |
| Lockfile leftover | `rm ~/.claude/ops/pr-<N>/watch.lock` |
| Watcher not firing | `launchctl list \| grep autopr` — missing → re-run `start.sh`. Check `watch.err.log`. |
| `gh` auth prompt in launchd ctx | keychain locked at login; run `gh auth status` interactively first |
| Duplicate react runs | `flock` in `watch.sh` prevents concurrent ticks; overlapping `claude -p` sessions are fine — each diffs state.json fresh and is idempotent |

## Related

- `~/.claude/skills/shotloom-respond-pr/SKILL.md` — manual review response (with approval gate)
- `~/.claude/skills/shotloom-make-pr/SKILL.md` — PR creation
- `~/.claude/standards/shotloom-pr-scope-policy.md` — in-scope classification
- `~/.claude/standards/review-code-rust.md` — Rust review patterns
- `~/.claude/rules/shotloom-git.md` — pre-PR gates
