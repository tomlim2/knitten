---
description: Find stale Shotloom Linear issues — dead in-progress, state/worktree mismatch, zombie tickets
argument-hint: "[--days N]"
allowed-tools: Bash(gh:*), Bash(git:*)
---

# shotloom-linear-stale

Weekly cleanup pass. Surfaces:
- **Dead In Progress** — claimed but no activity for N days
- **State mismatch** — Linear says one thing, worktree/PR says another
- **Zombie tickets** — created by me, assigned to me, abandoned (Todo >30d, untouched)
- **Reusable numbers** — issues I created/was assigned that ended up Canceled or permanently Backlog, candidates to repurpose when creating new work

## Arguments

- `[--days N]` — staleness threshold in days. Default: 7.

Usage: `/shotloom-linear-stale` or `/shotloom-linear-stale --days 14`

## Workflow

### Step 1: Fetch

1. Linear issues (via MCP `list_issues`):
   - All issues I created OR am assigned, any state
   - Include: title, state, assignee, creator, createdAt, updatedAt, priority, url

2. Worktrees: `git worktree list --porcelain`

3. PRs (open + recently merged): `gh pr list --repo CINEV/shotloom --author @me --state all --limit 50`

### Step 2: Classify

For each issue:

| Category | Rule |
|----------|------|
| **Dead In Progress** | state = "In Progress" AND no update in `--days` days |
| **State mismatch** | state = "In Progress" but no worktree AND no open PR |
| **State mismatch (reverse)** | worktree exists but state = "Todo" or "Backlog" |
| **PR merged, Linear not Done** | PR merged >1d ago AND state ∉ {Done, Canceled} |
| **Zombie Todo** | state = "Todo", creator = me, updatedAt > 30d ago |
| **Reusable number** | state = "Canceled" OR (state = "Backlog" AND updatedAt > 60d) |

### Step 3: Render

```
## Shotloom Linear — stale sweep (threshold: <N>d)

### 🪦 Dead In Progress (<count>)
- STL-113 "ADR-0025 ..."  updated 9d ago  → drop to Backlog? continue?

### ⚠️ State mismatch (<count>)
- STL-99 is "In Progress" but no worktree, no PR — resume or drop?
- STL-120 has .worktrees/stl-120-foo but Linear says "Todo" — move to In Progress?

### ✅ Ready to close (<count>)
- STL-108 — PR#100 merged 3d ago but Linear still "In Review" → move to Done?

### 💤 Zombie Todo (<count>)
- STL-47 "early idea" — created 45d ago, never started — defer to Backlog or Cancel?

### ♻️ Reusable issue numbers (<count>)
Use these instead of creating new ones when starting similar work:
| STL | Title | Why available | Reuse by |
|-----|-------|---------------|----------|
| STL-55  | "early retarget spike" | Canceled 90d ago | Rename + reopen + update body for new purpose |
| STL-72  | "skim VRM spec"         | Backlog, untouched 75d | Same |
```

### Step 4: Per-category suggested actions

Each category ends with one-line action hint. Don't auto-execute — this is a review tool, user decides.

- Dead In Progress → user picks: revive (`/shotloom-start-code`) / backlog (`/shotloom-linear-move STL-NN Backlog`) / cancel
- State mismatch → user picks: fix state / delete worktree / open PR
- Ready to close → `/shotloom-linear-move STL-NN Done` per-issue
- Zombie Todo → `/shotloom-linear-move STL-NN Backlog` or Cancel
- Reusable → mental note for next `/shotloom-linear-create-issue` (that skill also checks this list)

## Notes

- Read-only inspection — no state mutation.
- Do not silently close or move anything. Surface only.
- If MCP returns too many issues (>100), narrow the query to last 90d `updatedAt` first.
