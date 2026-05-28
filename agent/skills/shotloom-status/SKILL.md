---
description: Dashboard of active Shotloom work — worktrees, open PRs, in-progress Linear issues
argument-hint: ""
allowed-tools: Bash(gh:*), Bash(git:*), Bash(ls:*)
domains: shotloom
repo-keys: shotloom
languages: markdown
task-types: ops
context-profile: shotloom-ops
context-rules: rules/git-defaults.md
---

# shotloom-status

One-shot dashboard: what Shotloom work is currently in flight.

## Workflow

### Step 1: Fetch in parallel

Single message, multiple Bash calls:

```bash
# Worktrees
git -C "$(jq -re '.shotloom.path // .shotloom // empty' ~/.claude/private/agent-hub-config/repo-paths.json)" worktree list --porcelain

# Open PRs authored by me
gh pr list --repo CINEV/shotloom --author @me --state open --json number,title,headRefName,isDraft,reviewDecision,statusCheckRollup,updatedAt

# In-progress Linear issues (via MCP)
# mcp__9d8f80bf-47aa-4193-a076-99b399b9d6dd__list_issues
#   team: "Shotloom", state: "In Progress" (and "In Review"), assignee: me
```

Linear call requires ToolSearch for the MCP schema first:
```
ToolSearch query="select:mcp__9d8f80bf-47aa-4193-a076-99b399b9d6dd__list_issues"
```

### Step 2: Cross-reference

Match each worktree branch → Linear STL (from commit body `Related to STL-NN` or branch name hint) → PR. Build a unified table.

### Step 3: Render

```
## Shotloom — Active work

**Worktrees (<N>):**
| Path | Branch | Behind main | Dirty |
|------|--------|-------------|-------|
| .worktrees/stl-99-retire-viewer | chore/retire-retarget-viewer | 3 | clean |
| .worktrees/stl-113-adr-0025 | docs/adr-0025-rest-vs-extract | 0 | 2 files |

**Open PRs (<N>):**
| PR | Title | Status | Last activity |
|----|-------|--------|---------------|
| #114 | feat(retarget): STL-99 retire viewer | ✅ green, awaiting review | 2h ago |
| #115 | docs(adr): STL-113 rest vs extract | 🔴 CI failing | 5m ago |

**Linear in-flight (<N>):**
| STL | Title | State | Worktree? | PR? |
|-----|-------|-------|-----------|-----|
| STL-99 | Retire retarget viewer | In Review | ✅ | #114 |
| STL-113 | ADR-0025 REST vs extract | In Progress | ✅ | #115 |
| STL-120 | 60fps WASM benchmark | Todo | ❌ | ❌ |

**Gaps:**
- STL-120 is "In Progress" in Linear but no worktree — state out of sync.
- Worktree `.worktrees/foo-stale` has no matching Linear issue — candidate for cleanup.
```

### Step 4: Suggest next action

One-line recommendation based on the state:
- PR failing CI → "`/shotloom-auto-pr <N>` to auto-diagnose"
- Worktree dirty → "commit via `/shotloom-commit` or stash"
- Linear in-progress without worktree → "`/shotloom-start-task STL-NN` to kick off"
- All green → "nothing urgent"

## Notes

- Stale worktree cleanup: if a worktree's branch has no upstream and the last commit is >7 days old with no matching Linear issue, surface in "Gaps" as cleanup candidate (but don't auto-remove — user runs `git worktree remove` manually).
- This is a read-only skill — never modifies state.
