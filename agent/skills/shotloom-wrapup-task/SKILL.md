---
description: End-of-work cleanup for a Shotloom task — close Linear, remove worktree, delegate retrospective logging.
argument-hint: "[STL-NN]"
allowed-tools: Read, Write, Bash(git:*), Bash(gh:*), Bash(jq:*), Bash(awk:*), Bash(bash:*)
---

# shotloom-wrapup-task

Wraps up one Shotloom task cleanly: transition Linear, remove the worktree + branch, stop the watcher, and delegate retrospective logging.

Use when:
- A PR has merged and `/shotloom-auto-pr` wasn't running to auto-cleanup, OR
- You want to manually close a task (abandoned, moved to next issue, or related), OR
- You want a single command for the end-of-work routine.

## Arguments

- `[STL-NN]` — Linear issue ID. Optional. If omitted, auto-detect from current branch or the PR associated with the current worktree.

Usage: `/shotloom-wrapup-task STL-114` or `/shotloom-wrapup-task` from inside the worktree.

## Workflow

### Step 1: Resolve context

Capture invocation cwd **before** any `cd` so worktree detection sees where the user actually invoked from. Hard-resetting to the repo-paths root would target the main checkout instead of the active worktree.

```bash
# Capture invocation cwd first
invoked_from=$(pwd)

# Detect worktree from invocation cwd — do NOT cd to shotloom_root yet
toplevel=$(git -C "$invoked_from" rev-parse --show-toplevel 2>/dev/null) || toplevel=""
remote=$(git -C "${toplevel:-$invoked_from}" remote get-url origin 2>/dev/null || true)

case "$remote" in
  *CINEV/shotloom*|*CINEV/shotloom.git)
    worktree="$toplevel"
    current_branch=$(git -C "$worktree" rev-parse --abbrev-ref HEAD)
    ;;
  *)
    # Not inside a shotloom worktree — fall back to the main checkout
    # (only valid if user passed STL-NN explicitly so we know what to close)
    worktree=$(jq -r '.shotloom.path // .shotloom' ~/.claude/private/agent-hub-config/repo-paths.json)
    current_branch=""  # branch cleanup is disabled until explicitly resolved
    ;;
esac

shotloom_root=$(jq -r '.shotloom.path // .shotloom' ~/.claude/private/agent-hub-config/repo-paths.json)
if [ -z "$shotloom_root" ] || [ "$shotloom_root" = "null" ]; then
  echo "ERROR: repo-paths.json has no shotloom path"
  exit 1
fi
if [ -z "$worktree" ] || [ "$worktree" = "null" ]; then
  echo "ERROR: Shotloom worktree unresolved"
  exit 1
fi

# Resolve STL-NN from (in order):
#   1. $ARGUMENTS
#   2. PR body `Related to STL-NN` (NOT "Resolves STL-NN" in commits — that
#      string only appears in PR descriptions per ~/.claude/rules/shotloom.md)
#   3. recent commit body on the branch (Related to STL-NN footer)
#   4. (do NOT parse branch name — Shotloom branches never carry STL-NN)
```

If `linear_id` is empty after resolution, stop before Linear, logging, worktree, or branch cleanup.

Fetch the Linear issue with the Linear MCP issue-read tool to get current state and title.

Fetch the PR state:
```bash
if [ -n "$current_branch" ]; then
  gh pr list --repo CINEV/shotloom --head "$current_branch" --state all \
    --json number,state,mergedAt,title --limit 1
else
  echo "No current branch resolved; skip branch-based PR lookup."
fi
```

Record: `linear_id`, `linear_state`, `pr_number`, `pr_state`, `merged_at`, `branch`, `worktree_path`.

### Step 2: Pick close mode

Present the resolved context and ask the user to pick:

| Mode | When | Linear → | Worktree |
|---|---|---|---|
| `merged` | PR merged | Done | remove + delete branch |
| `abandoned` | PR closed without merge, work discarded | Canceled | remove + delete branch (confirm first) |
| `paused` | Work paused, not merged yet | keep current (default: In Progress) | preserve worktree, optionally log |
| `done-no-pr` | No PR (chore, local-only cleanup) | Done | remove if worktree exists |

Default: auto-pick based on `pr_state`: `MERGED` → `merged`, `CLOSED` → `abandoned`, else ask.

### Step 3: Transition Linear

If mode is `merged` or `done-no-pr`:
- Invoke `/shotloom-linear-move <STL-NN> Done` (silent, pre-approved per auto-caller list).
- Skip if already Done.

If mode is `abandoned`:
- Invoke `/shotloom-linear-move <STL-NN> Canceled`.
- Skip if already Canceled.

If mode is `paused`:
- Skip Linear transition. Just note current state in the log.

### Step 4: Return to main checkout, then remove worktree + branch

If mode is NOT `paused` AND `current_branch` is non-empty AND a worktree exists for `current_branch`:

```bash
if [ -z "$current_branch" ]; then
  echo "No current branch resolved; skip worktree and branch cleanup."
  exit 0
fi

cd "$shotloom_root" || exit 1  # main checkout; must leave the task worktree before removing it

# Find the local task worktree used for this branch, then remove that worktree only.
wt_path=$(git worktree list --porcelain | awk -v br="refs/heads/$current_branch" '
  /^worktree/ { wt=$2 }
  /^branch / { if ($2 == br) print wt }
')

if [ -n "$wt_path" ]; then
  # check for uncommitted changes first
  dirty=$(git -C "$wt_path" status --porcelain)
  if [ -n "$dirty" ]; then
    echo "Worktree has uncommitted changes:"
    echo "$dirty"
    # abort — ask user to commit/stash/discard first
    exit 1
  fi
  git worktree remove "$wt_path"
fi

# delete the merged branch (safe with -d; skip + log if it refuses)
git branch -d "$current_branch" 2>&1 || echo "branch $current_branch not fully merged — leaving as is"
```

Do NOT use `-D` (force delete) or `--force` on worktree removal unless the user explicitly opts in.

### Step 4.5: Kill the auto-pr watcher if running

Unless mode is `paused`, stop the background watcher for this PR so it doesn't keep polling a merged/closed/abandoned PR. (Watcher self-terminates on MERGED/CLOSED anyway, but `abandoned` and `done-no-pr` modes close the task before the next tick, and `paused` is the only mode where we want polling to continue.)

```bash
if [ -n "$pr_number" ] && [ "$mode" != "paused" ]; then
  pid_file="$HOME/.claude/ops/pr-$pr_number/watcher.pid"
  if [ -f "$pid_file" ]; then
    bash ~/.claude/skills/shotloom-auto-pr/stop.sh "$pr_number"
  fi
fi
```

### Step 5: Delegate day log via `/learn-log-day` — RETROSPECTIVE ONLY

Do NOT write the Obsidian day-log file directly. Delegate to `/learn-log-day shotloom devlog`; that skill owns frontmatter, tags, callouts, wikilinks, and path resolution.

Pass a retrospective logging brief:
- Use one header line with `PR NNN` text only. Do not include GitHub PR URLs or markdown links in Obsidian logs; private repository UI links are NDA-ish and are not durable vault content.
- Do not add Branch / Worktree / Commit-list metadata.
- Do not summarize what the PR did.
- Do not use celebratory framing.
- Add numbered `지적` items for real review, CI, or rule findings.
- For each `지적`, include what was pointed out, why the principle is right, and what changed.
- Add `tip`, `abstract Rule`, and `warning` callouts only when they carry real content.
- Cite the standard, rule, or file:line behind each lesson.
- Skip empty callouts.

If the Obsidian vault is writable (`obsidian` on home Mac) the entry lands there; otherwise learn-log-day falls back to `obsidian-staging` and `/learn-archive-week` consolidates later.

**After learn-log-day writes the file**, commit and push it from the agent-hub repo so the entry survives across machines. Skip the commit if learn-log-day already committed.

### Step 5.5: Append review-finding pattern candidates

If the PR had any real review, CI, or rule finding, also record generalized pattern candidates in Knitten for later consolidation.

Destination:

- Branch: `codex/shotloom-review-finding-patterns`
- Preferred worktree: `<knitten-root>/.worktrees/shotloom-review-finding-patterns`
- File: `docs/briefings/shotloom/review-finding-patterns-inbox.md`

Worktree rules:

1. Do not write this inbox from a dirty Knitten main checkout.
2. If the preferred worktree exists, use it.
3. If the branch exists but no worktree exists, create a worktree for that branch under `<knitten-root>/.worktrees/shotloom-review-finding-patterns`.
4. If neither branch nor worktree can be prepared safely, skip this phase and report the skip; do not block Linear/worktree cleanup.
5. Commit and push only the inbox update from that branch.

Write one `## PR NNN` section only when the PR has findings. Under it, add one `### Pattern: ...` entry per generalized lesson. The entry is not a PR summary and not a duplicate of the devlog `지적`; it is a reusable pattern candidate.

Required fields per pattern:

| Field | Content |
|---|---|
| `Finding` | What the reviewer/CI/rule actually pointed out. |
| `Why It Was Right` | The underlying engineering principle, generalized beyond the PR. |
| `General Rule` | A portable rule that could guide future implementation/review. |
| `Trigger` | Concrete signals that should make an agent check for this pattern next time. |
| `Fix Shape` | The smallest typical fix or test shape. |
| `Source Evidence` | `PR NNN`, reviewer type, file:line or check name; no private GitHub URLs. |

Constraints:

- Do not include private Shotloom PR URLs or markdown links.
- Do not include Branch / Worktree / Commit-list metadata.
- Do not summarize the feature.
- Do not write bare `#NNN` or `#word` inline tags, except intentional allowed tags already used by the destination doc.
- Prefer 1-3 high-signal patterns per PR; merge repetitive nits into one pattern.
- If the finding is too PR-specific to generalize, keep it in the day log only and skip the inbox entry.

Example shape:

```md
## PR 371

### Pattern: Multi-event command status precedence needs a regression case

- Finding: Reviewer pointed out that the status-ordering refactor had only single-terminal-event tests.
- Why It Was Right: Ordering bugs only appear when competing terminal events share the same command identity.
- General Rule: Any event-status precedence rule needs at least one test with competing correlated events in the same buffer.
- Trigger: Code chooses status by scanning an event list, prioritizing errors, or combining success and failure sentinels.
- Fix Shape: Add a test with success then failure, and preferably failure then success, for the same command id.
- Source Evidence: PR 371; review finding on `apps/editor/src/components/debug/__tests__/StageImportDebugPanel.test.tsx:437`.
```

### Step 6: Report

One compact line back to the user:

```
STL-NN closed (<mode>). Linear: → Done. Worktree removed. Logged to <log_path>. Patterns: <updated|none|skipped>.
```

Include any warnings that came up (branch not fully merged, dirty worktree preserved, Linear move skipped, or similar).

## Binding rules

- **Never force** (`-D`, `--force`) without explicit user confirmation. Uncommitted changes or unmerged branches are signals — pause and ask.
- **Clean the used local task worktree only after moving to the main checkout.** `cd $shotloom_root` before `git worktree remove`; do not remove a worktree from inside itself.
- **Day-log path is not `~/.claude/ops/`.** That directory is per-PR transient state. Durable records go through `/learn-log-day`, which resolves `machine-paths.json → obsidian` with `obsidian-staging` fallback.
- **Pattern candidates live in Knitten, not the Obsidian day log.** Day logs preserve retrospective context; `docs/briefings/shotloom/review-finding-patterns-inbox.md` accumulates generalized lessons for later consolidation.
- **PR-level lifecycle is `/shotloom-auto-pr`'s job when running.** This skill is the manual equivalent — if auto-pr already did the Linear move and worktree cleanup on MERGE, this skill detects that and only appends the day log.
- **Abandoned PRs** — worktree removal still requires the branch to be pushed (or user-approved discard). Local-only work should never be dropped silently.

## Related

- `~/.claude/skills/shotloom-auto-pr/SKILL.md` — running watcher that auto-cleans on MERGE (this skill is the manual fallback)
- `~/.claude/skills/shotloom-linear-move/SKILL.md` — Linear state transition
- `~/.claude/skills/learn-log-day/SKILL.md` — Obsidian devlog flow that owns day-log format and path conventions
- `~/.claude/skills/shotloom-status/SKILL.md` — see active worktrees / PRs before deciding what to close
