---
name: ah-manage-milestone
description: Manage generic AH milestone state, task ordering, priority, and next-step summaries when the user asks for milestone coordination.
---

# AH Manage Milestone

Use this support leaf skill when the user asks about milestones, remaining
tasks, priority, next steps, or grouped work state.

## Input

- Milestone name, task list, issue list, or repository planning docs.
- User priority or ordering request.

## Output

- Current milestone state.
- Ordered next tasks.
- Done, active, blocked, or deferred items.

## Steps

1. Gather milestone sources from the active repository or connected tool.
2. Normalize item state.
3. Identify blockers and high-priority work.
4. Report a concise ordered plan.

Do not create or mutate external milestone records unless the user asks.

## Path Handling

Read milestone state from the active workspace or connected tool. If temporary
scratch space is needed, use `workspaceLocalRoot` from:

```bash
<knitten-plugin-root>/bin/knitten-resolve-output --create
```
