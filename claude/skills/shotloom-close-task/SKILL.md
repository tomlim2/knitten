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

```bash
shotloom_root=$(jq -r '.shotloom' ~/.claude/private/repo-paths.json)
cd "$shotloom_root"

# current branch (if invoked from inside a worktree)
current_branch=$(git rev-parse --abbrev-ref HEAD)

# resolve STL-NN from (in order):
#   1. $ARGUMENTS
#   2. PR body `Related to STL-NN` / `Resolves STL-NN`
#   3. recent commit body on the branch
#   4. branch name prefix (rare — shotloom convention excludes STL prefix)
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

### Step 5: Append day log

Resolve the log destination via `machine-paths.json`:

```bash
base=$(jq -re '.["obsidian-vault-claude"] // .["obsidian-staging"]' ~/.claude/private/machine-paths.json)
date_slug=$(date +%Y-%m-%d)
log_path="$base/claude/projects/shotloom/daily/$date_slug.md"
mkdir -p "$(dirname "$log_path")"
```

Append one entry under today's file:

```markdown
## <HH:MM> — STL-NN closed (<mode>)

**PR:** #<N> <title> — <MERGED|CLOSED|no-pr>
**Linear:** <prev state> → <new state>
**Branch:** <branch> (removed)
**Worktree:** <path> (removed)
**Commits on branch:** <N> (<first sha> … <last sha>)

**Summary:** <1-2 lines — what the task accomplished, key changes, blockers/learnings if any>
```

The summary line is drafted from the PR body's `## Summary` section (if merged) or from the commit messages on the branch (otherwise). Keep it brief — the full story lives in the PR / commits.

### Step 6: Report

One compact line back to the user:

```
STL-NN closed (<mode>). Linear: → Done. Worktree removed. Logged to <log_path>.
```

Include any warnings that came up (branch not fully merged, dirty worktree preserved, Linear move skipped, etc.).

## Binding rules

- **Never force** (`-D`, `--force`) without explicit user confirmation. Uncommitted changes or unmerged branches are signals — pause and ask.
- **Never remove a worktree without leaving it first.** `cd $shotloom_root` before `git worktree remove`.
- **Day-log path is not `~/.claude/private/ops/`.** That directory is per-PR transient state. Durable records go to `machine-paths.json → obsidian-vault-claude` (fallback: `obsidian-staging`).
- **PR-level lifecycle is `/shotloom-auto-pr`'s job when running.** This skill is the manual equivalent — if auto-pr already did the Linear move and worktree cleanup on MERGE, this skill detects that and only appends the day log.
- **Abandoned PRs** — worktree removal still requires the branch to be pushed (or user-approved discard). Local-only work should never be dropped silently.

## Related

- `~/.claude/skills/shotloom-auto-pr/SKILL.md` — running watcher that auto-cleans on MERGE (this skill is the manual fallback)
- `~/.claude/skills/shotloom-linear-move/SKILL.md` — Linear state transition
- `~/.claude/skills/learn-log-day/SKILL.md` — richer day-log flow (this skill writes a single line; learn-log-day is for end-of-day consolidation)
- `~/.claude/skills/shotloom-status/SKILL.md` — see active worktrees / PRs before deciding what to close
