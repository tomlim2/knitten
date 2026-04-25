---
description: End-of-work cleanup for a Shotloom task — close Linear, remove worktree, append day log. Run after a PR merges or when stepping away from a task.
argument-hint: "[STL-NN]"
allowed-tools: Read, Write, Bash(git:*), Bash(gh:*), Bash(jq:*)
---

# shotloom-close-task

Wraps up one Shotloom task cleanly: transition Linear to Done, remove the worktree + branch, append a line to the day log.

Use when:
- A PR has merged and `/shotloom-auto-pr` wasn't running to auto-cleanup, OR
- You want to manually close a task (abandoned, moved to next issue, etc.), OR
- You want a single command for the end-of-work routine.

## Arguments

- `[STL-NN]` — Linear issue ID. Optional. If omitted, auto-detect from current branch or the PR associated with the current worktree.

Usage: `/shotloom-close-task STL-114` or `/shotloom-close-task` from inside the worktree.

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
    worktree=$(jq -r '.shotloom.path // .shotloom' ~/.claude/private/caol-config/repo-paths.json)
    current_branch=""  # unknown until user provides STL-NN
    ;;
esac

shotloom_root=$(jq -r '.shotloom.path // .shotloom' ~/.claude/private/caol-config/repo-paths.json)

# resolve STL-NN from (in order):
#   1. $ARGUMENTS
#   2. PR body `Related to STL-NN` (NOT "Resolves STL-NN" in commits — that
#      string only appears in PR descriptions per rules/shotloom-git.md)
#   3. recent commit body on the branch (Related to STL-NN footer)
#   4. (do NOT parse branch name — Shotloom branches never carry STL-NN)
```

Fetch the Linear issue via MCP (`mcp__…__get_issue`) to get current state and title.

Fetch the PR state:
```bash
gh pr list --repo CINEV/shotloom --head "$current_branch" --state all \
  --json number,state,mergedAt,title --limit 1
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

Default: auto-pick based on `pr_state` — `MERGED` → `merged`, `CLOSED` → `abandoned`, else ask.

### Step 3: Transition Linear

If mode is `merged` or `done-no-pr`:
- Invoke `/shotloom-linear-move <STL-NN> Done` (silent, pre-approved per auto-caller list).
- Skip if already Done.

If mode is `abandoned`:
- Invoke `/shotloom-linear-move <STL-NN> Canceled`.
- Skip if already Canceled.

If mode is `paused`:
- Skip Linear transition. Just note current state in the log.

### Step 4: Remove worktree + branch

If mode is NOT `paused` AND a worktree exists for `current_branch`:

```bash
cd "$shotloom_root"  # must leave the worktree before removing it

# find the worktree path
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

### Step 5: Append day log via `/learn-log-day`

Do NOT write the Obsidian day-log file directly. Delegate to `/learn-log-day shotloom devlog` so the Obsidian-format conventions (frontmatter, tags, callouts, wikilinks, path resolution) are handled in one place.

Draft the entry body first from the resolved context (PR number/title/merge state, Linear transition, worktree path, commit shas, one-line summary from the PR body's `## Summary`). Then invoke:

```
/learn-log-day shotloom devlog
```

When the learn-log-day skill opens the day file, paste the drafted entry under today's heading in this shape:

```markdown
## <HH:MM> — STL-NN closed (<mode>)

**PR:** [#<N>](<pr-url>) <title> — <MERGED|CLOSED|no-pr>
**Linear:** [STL-NN](<linear-url>) <prev state> → <new state>
**Branch:** `<branch>` (<removed | kept — reason>)
**Worktree:** `<path>` (<removed | preserved>)
**Commits on branch:** <N> (<first sha> … <last sha>)

**Summary:** <1-2 lines — what the task accomplished, key changes, blockers/learnings if any>
```

Keep it brief — the full story lives in the PR / commits. If the Obsidian vault is writable (`obsidian-vault-claude` on home Mac) the entry lands there; otherwise learn-log-day falls back to `obsidian-staging` and `/learn-archive-week` consolidates later.

**After learn-log-day writes the file**, commit and push it from the caol-ila repo so the entry survives across machines. Skip the commit if learn-log-day already committed.

### Step 6: Report

One compact line back to the user:

```
STL-NN closed (<mode>). Linear: → Done. Worktree removed. Logged to <log_path>.
```

Include any warnings that came up (branch not fully merged, dirty worktree preserved, Linear move skipped, etc.).

## Binding rules

- **Never force** (`-D`, `--force`) without explicit user confirmation. Uncommitted changes or unmerged branches are signals — pause and ask.
- **Never remove a worktree without leaving it first.** `cd $shotloom_root` before `git worktree remove`.
- **Day-log path is not `~/.claude/ops/`.** That directory is per-PR transient state. Durable records go to `machine-paths.json → obsidian-vault-claude` (fallback: `obsidian-staging`).
- **PR-level lifecycle is `/shotloom-auto-pr`'s job when running.** This skill is the manual equivalent — if auto-pr already did the Linear move and worktree cleanup on MERGE, this skill detects that and only appends the day log.
- **Abandoned PRs** — worktree removal still requires the branch to be pushed (or user-approved discard). Local-only work should never be dropped silently.

## Related

- `~/.claude/skills/shotloom-auto-pr/SKILL.md` — running watcher that auto-cleans on MERGE (this skill is the manual fallback)
- `~/.claude/skills/shotloom-linear-move/SKILL.md` — Linear state transition
- `~/.claude/skills/learn-log-day/SKILL.md` — richer day-log flow (this skill writes a single line; learn-log-day is for end-of-day consolidation)
- `~/.claude/skills/shotloom-status/SKILL.md` — see active worktrees / PRs before deciding what to close
