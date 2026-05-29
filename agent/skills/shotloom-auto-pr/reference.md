# shotloom-auto-pr — reference

Supplementary to [SKILL.md](SKILL.md). Holds the PR review reply classification policy used by both `/shotloom-auto-pr` (auto-response loop) and `/shotloom-respond-pr` (manual response with approval gate).

---

## Guideline Leak Fixes

Shotloom repo guidelines are the first source of commit, push, and PR policy.
This reference records auto-pr local leak fixes: extra evidence gates added
after real failures escaped the repo-guideline flow.

| Leak / failure mode | Extra gate | Evidence source |
|---|---|---|
| Auto-pr used a per-skill subset that drifted from other PR helpers and let test regressions surface only in CI | Before auto-pr commits a fix, follow Shotloom repo guidance, then run `/shotloom-check-gates --full` | 2026-04-25 skill audit |
| CI failure fixing can tempt a narrow rerun of only the failed command | Do not cherry-pick a subset for the auto-pr extra evidence gate; use `/shotloom-check-gates --full` after the fix | 2026-04-25 skill audit |
| Auto-pr can mutate an unassigned PR if started or kept running after assignment changes | Confirm PR assignees include `tomlim2` before starting the watcher and before every react cycle | 2026-05-27 unassigned PR response finding |

The extra gate is additive. It does not replace, weaken, or redefine Shotloom
repo guidance.

---

## PR review reply scope policy

Goal: keep PRs focused. Don't grow scope inside the current PR. Split clearly-separate work into new Linear issues. Stop and ask only when genuinely ambiguous.

### 0. Bot-authored feedback policy

The watcher excludes only this reactor's own GitHub user from
`new_comments`/`new_reviews`. Other bot-authored comments and review bodies
remain visible and must be classified by content.

| Bot item type | Auto-pr action |
|---|---|
| Concrete inline finding with a file/path/line and fixable claim | Treat as a normal inline finding. If in-scope and justified, fix, gate, commit, push, and reply on the inline thread. |
| Concrete review-body or suppressed finding without an inline comment id | Treat as a suppressed finding. If in-scope and justified, fix, gate, commit, push, and include it in the single review-level summary reply. |
| PR summary / risk note with no concrete requested action | Mark informational. Do not fix or reply. Mention it only in the briefing when it affected prioritization. |
| Bot uncertainty, question, or unverifiable warning | Mark `needs-human`. Do not fix, do not reply, do not resolve, and do not re-request based on this item. |

`needs-human` triggers include:

- the bot says it cannot verify something, asks a direct question, or uses
  wording such as `confirm`, `unclear`, `unknown`, `확인 필요`,
  `알 수 없습니다`, or `검토하세요`;
- the response depends on production data, rollout timing, migration order,
  business/user priority, or whether a follow-up issue should exist;
- the technically correct response is likely a rationale or pushback rather
  than a code/doc change.

When any bot item is `needs-human`, append this block to `log.md`:

```md
### Bot feedback needs human

Source: <bot login>, <inline/review-body/top-level>, <url or id>
Summary: <one-sentence Korean summary>
Why paused: <uncertainty/question>
Suggested options:
- fix in this PR: <when reasonable>
- defer with STL: <when reasonable>
- reply with rationale: <when reasonable>
- ignore as informational: <when reasonable>
```

If the unresolved bot question could change the fix scope, PR body, reply
wording, or reviewer re-request roster, stop the reply-posting part of the
react cycle. Do not post partial replies around the unresolved question.

### 1. In-scope → auto-resolve

The feedback is about code this PR already touches, or is mechanical/local enough that fixing in this PR does not grow scope.

**Indicators (any one):**
- The file named in the comment appears in `git diff <base>...HEAD --name-only`
- Fix is ≤5 lines and stays within a single function
- CI / lint / test / doc-path / type-check failure (mechanical)
- Comment includes a concrete code suggestion block that applies cleanly
- Typo, wording, formatting, naming-consistency fix
- Missing test for code this PR adds

**Action (auto):** fix → local gates → commit → push → inline reply (`Fixed in <sha>. <brief>.`) → resolve thread.

### 2. Out-of-scope → brief, don't create, don't reply

The feedback is about code this PR did not touch, or is substantial enough that doing it here would grow the PR beyond its Linear issue.

**Indicators (any one):**
- File is not in this PR's diff AND expected fix >30 lines
- Comment contains deferral language: *"refactor"*, *"consider"*, *"in a follow-up"*, *"separate PR"*, *"eventually"*, *"might want to"*, *"would be nice"*
- Fix requires a new crate, new module, or cross-cutting design change
- Concern is valid but orthogonal to this PR's stated goal (check Linear issue)
- Would violate an ADR's ask-first matrix (stage contract, bridge contract, ECS ordering, new dep, etc.)

**Action (auto):**
- **Do NOT** auto-create a Linear issue. (Policy: user creates new issues manually so they land with the right Linear project / labels / context.)
- **Do NOT** post a reply to the comment. (Policy: leaving the thread open is a visible backlog marker for the reviewer.)
- **Do NOT** resolve the thread.
- Add an entry to the briefing with a draft Linear issue the user can copy:
  ```
  ### Out-of-scope — new Linear issue needed

  Suggested title: <type>(<scope>): <summary from comment>

  Body draft:
    Context: Spun off from PR #<N> review by @<reviewer>.
    Original comment: <quoted body>
    File: <path>:<line>
    Rationale: <why this is out of scope for PR #<N>>
    Acceptance: <reviewer's ask, normalized>

  Thread: left unresolved, no reply posted.
  ```

Loop / workflow continues — this is a per-comment decision, not a stop condition.

### 3. Ambiguous → skip this comment, continue loop, NO reply

The feedback is genuinely unclear: multiple valid interpretations, a question rather than a request, or the right answer depends on design intent the reviewer hasn't spelled out.

**Ambiguity score 0–10** — only 9 or 10 count as ambiguous. 8 or below must pick in/out and proceed.

**Score 10 signals (certain ambiguity):**
- Comment is a question (`why ...?`, `is this intentional?`, `what about X?`)
- Reviewer explicitly asks for a design decision (`should we X or Y?`)
- Same fix attempted and failed 3 consecutive cycles

**Score 9 signals (near-certain):**
- Two mutually incompatible interpretations both fit the comment
- Comment references a file section the agent cannot locate confidently
- Fix requires knowledge the agent does not have (external constraint, user preference)

**Score ≤8 → NOT ambiguous** — commit to the best interpretation and proceed as in-scope or out-of-scope.

**Action (auto) for score ≥9:**
- **Do NOT** post any reply. No placeholder, no "looking into this".
- **Do NOT** resolve the thread.
- Add to the briefing:
  ```
  ### Ambiguous — needs human (score <N>/10)

  Comment: <quoted body>
  File: <path>:<line>
  Why ambiguous: <one-line reason>
  Possible interpretations:
    (a) <...>
    (b) <...>
  ```
- Loop **continues** processing other comments. This is per-comment, not a stop.

### Scope-confidence fallback

When you cannot confidently classify as in-scope or out-of-scope, **lean ambiguous** (skip + brief). Safer to leave a thread open than to post a wrong reply or grow scope.

---

## End-of-cycle briefing

Every auto-pr cycle that processed feedback must emit (to `.agent-local/shotloom/pr/<N>/log.md` AND to the user's next turn):

```
## <ISO timestamp> — review response cycle

**Auto-resolved (in-scope):**
| # | File:line | Fix | Commit |
|---|-----------|-----|--------|
| 1 | foo.rs:42 | added bounds check | abc1234 |

**Needs new Linear issue (out-of-scope):** <count>
<draft issue blocks>

**Ambiguous / needs human:** <count>
<ambiguous comment blocks>

**Next tick in:** 3 min
```

If all three sections are empty, emit nothing (silent tick).

---

## Loop termination

The auto-pr loop stops only on:
- PR merged / closed
- User says stop
- 30 consecutive silent ticks (90 min idle)
- Same in-scope fix attempt failing 3 cycles in a row (treat as ambiguous and surface)

Unresolved out-of-scope and ambiguous items do **not** stop the loop — they accumulate in the briefing. When the PR finally gets user attention, the briefing is the full handoff.

---

## Journal on terminal

Resolve via `machine-paths.json`:

```bash
base=$(jq -re '.obsidian // .["obsidian-staging"]' ~/.claude/private/agent-hub-config/machine-paths.json)
journal="$base/projects/shotloom/ops/runs/shotloom-pr-journal.md"
```

Append: `## PR #<N> — <MERGED|CLOSED> <ts>` + title/branch/linear/duration/merge-commit/cycle-totals.

---

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

**`last-event.json`** (watcher writes, react reads): present only on change / terminal. `fail_checks` is an array of `{name, workflow, link}` objects — `link` is the github.com URL embedding `run_id` (and sometimes `job_id`).

**`watcher.paused`** (owned by the react cycle): present only while
`/shotloom-auto-pr react <N>` is actively handling a PR round. When present,
`watch.sh` exits before fetching GitHub state, so the 120-second watcher loop
cannot start overlapping reactors while edits, gates, commits, pushes, or
review replies are in progress. The reactor removes the file on every normal,
blocked, or handled failure exit. If a crash leaves it behind, status reports
`alive (paused)`; inspect `react.log`, then remove the file or restart the
watcher.

**`log.md`**: append-only. Entries only on real events. No silent-tick lines.

---

## Why nohup not launchd / cron / ScheduleWakeup

- launchd is **blocked** from `~/.claude/` by macOS TCC; jobs queued there silently fail to fire.
- nohup loop survives logout but **not reboot** — re-run `start.sh <N>` after boot.
- default polling interval is 120 seconds. Override with `start.sh <N>
  <seconds>` only when a PR needs a quieter or more aggressive cadence.
- Per-PR PID file in `.agent-local/shotloom/pr/<N>/watcher.pid` makes stop/start surgical.
- Separate `watcher.log` / `react.log` per PR.
- Does NOT consume Claude context tokens on no-change ticks — `claude -p` fires only when `watch.sh` detects a diff.
- `stop.sh` keeps a legacy `launchctl unload` guard so hosts with a stale plist from a launchd-era install can be converted by running `stop.sh` once.

---

## fail_checks resolution constraints

Footguns in the reactor's `fail_checks` → run_id/job_id resolution path (SKILL.md "React workflow" code block):

- Do NOT pass `databaseId` from `gh run list` directly to `--job` — that is a run id; the call silently returns nothing useful.
- Do NOT use `--branch` instead of `--commit` — branch filter is sha-agnostic and can hand back a run from a previous push that happens to share the same workflow name.
- Do NOT match `gh run list` by check `name` alone in a multi-job workflow — the check name is per-job, not per-workflow. The link-based path is failure-immune; the fallback skips correctly when name resolution fails.

---

## Common failures

| Symptom | Fix |
|---------|-----|
| `claude: command not found` in `watcher.log` | `~/.local/bin` not on PATH for the nohup process; export PATH in `start.sh` or use the absolute claude path |
| Lockfile leftover | flock-based: `rm .agent-local/shotloom/pr/<N>/watch.lock`. mkdir-fallback: `rmdir .agent-local/shotloom/pr/<N>/watch.lock.d`. The trap cleans the mkdir lock automatically; manual cleanup only needed after SIGKILL |
| Watcher not firing | `kill -0 $(cat .agent-local/shotloom/pr/<N>/watcher.pid)` — dead → re-run `start.sh`. Tail `watcher.log` for last tick |
| Watcher alive but no polling | Check `.agent-local/shotloom/pr/<N>/watcher.paused`; if stale after a crashed react cycle, inspect `react.log` and remove it. |
| `gh` auth prompt in nohup ctx | keychain locked at login; run `gh auth status` interactively in a regular shell once |
| Duplicate react runs | `flock` (or `mkdir` fallback) prevents concurrent ticks; overlapping `claude -p` sessions are fine — each re-diffs state.json and is idempotent |
| Stale launchd plist from old install | `stop.sh <N>` unloads + removes any `com.shotloom.autopr.<N>.plist` left behind |
