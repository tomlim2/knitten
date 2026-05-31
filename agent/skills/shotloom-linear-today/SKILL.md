---
description: Leaf/component Shotloom skill for listing assigned Linear work. Prefer shotloom-router for choosing a full workflow.
argument-hint: ""
allowed-tools: Bash(gh:*), Bash(git:*), Bash(ah-resolve-doc-path:*)
---

# shotloom-linear-today

Compact list of what you should work on today: Linear issues assigned to you in Shotloom with state ∈ {Todo, In Progress, In Review, Backlog}, cross-referenced with local worktrees and open PRs.

## Workflow

### Step 1: Fetch in parallel

1. Linear issues — via MCP (fetch schema first if needed):
   ```
   ToolSearch query="select:mcp__9d8f80bf-47aa-4193-a076-99b399b9d6dd__list_issues"
   ```
   Call with: `team: "Shotloom"`, `assignee: me`, `state: ["Todo", "In Progress", "In Review", "Backlog"]`, sort by priority/updatedAt.

2. Worktrees:
   ```bash
   knitten_root="${KNITTEN_ROOT:?set KNITTEN_ROOT to the Knitten checkout}"
   source "$knitten_root/agent/lib/activate-local-bin.sh"
   shotloom_root="$(ah-resolve-doc-path repo shotloom)"
   shotloom_root="${shotloom_root#RESOLVED_PATH=}"
   git -C "$shotloom_root" worktree list --porcelain
   ```

3. Open PRs: `gh pr list --repo CINEV/shotloom --author @me --state open --json number,title,headRefName,statusCheckRollup,reviewDecision`

### Step 2: Cross-reference

For each Linear issue, resolve:
- **Worktree?** Match STL-NN against `.worktrees/stl-<NN>-*` paths
- **PR?** Match STL-NN against PR titles or commit bodies `Related to STL-NN`
- **Staleness:** days since last Linear update

### Step 3: Render

```
## Shotloom — Today (<total> issues)

### 🔄 In Progress (<N>)
- STL-99  "Retire retarget viewer"           ✅ .worktrees/stl-99-...  ✅ PR#114 (CI ✅, awaiting review)  — updated 2h ago
- STL-113 "ADR-0025 REST vs extract"          ✅ .worktrees/stl-113-... ✅ PR#115 (CI 🔴 failing)            — updated 5m ago

### 📝 In Review (<N>)
- STL-89  "VRM axis correction follow-up"     ❌ no worktree          ✅ PR#108 (approved, awaiting merge) — updated 1d ago

### ⏸ Todo (<N>)
- STL-120 "60fps WASM benchmark"              ❌ not started                                               — updated 3d ago  (priority: high)
- STL-130 "Glob import tests"                 ❌ not started                                               — updated 7d ago

### 🗂 Backlog (<N>)
- <short list>

### ⚠️ Gaps
- STL-113 is In Progress but PR is red → needs attention
- STL-89 is In Review + PR approved → candidate for merge
- STL-130 is Todo + 7d stale → revisit priority or defer
```

### Step 4: Suggested next action

One-line recommendation, prioritized:
1. Any PR red → `/shotloom-auto-pr <N>` to diagnose
2. Any PR approved + awaiting merge → merge it
3. Any In Progress without worktree → resume via `/shotloom-start-task STL-NN`
4. Otherwise, pick highest-priority Todo → `/shotloom-start-task STL-NN`

## Notes

- Read-only skill. Never mutates Linear state.
- "Me" = the Linear user associated with the MCP connection.
- If Linear MCP returns 0 issues, double-check team filter (should be "Shotloom" exactly).
