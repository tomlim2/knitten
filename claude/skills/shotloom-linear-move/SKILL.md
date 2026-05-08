---
description: Transition a Shotloom Linear issue to another state (Todo → In Progress → In Review → Done)
argument-hint: "<STL-NN> [target-state]"
allowed-tools: Bash(git:*)
---

# shotloom-linear-move

Transition an issue's state. If `target-state` omitted, suggests the next forward state based on current.

## Arguments

- `<STL-NN>` — issue identifier (required)
- `[target-state]` — one of: `Todo` | `In Progress` | `In Review` | `Done` | `Canceled` | `Backlog`. Optional.

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage:
- `/shotloom-linear-move STL-99` → shows current state + suggests next
- `/shotloom-linear-move STL-99 "In Progress"`
- `/shotloom-linear-move STL-99 Done`

## Workflow

### Step 1: Fetch current state

```
ToolSearch query="select:mcp__9d8f80bf-47aa-4193-a076-99b399b9d6dd__get_issue"
```
Call with `id: "STL-NN"`. Extract `state.name`, `title`, `assignee`, `url`.

### Step 2: Resolve target state

If `$ARGUMENTS` provides target, validate it's one of the allowed values. If missing, suggest next forward per this map:

| From | Default next |
|------|-------------|
| Backlog | Todo |
| Todo | In Progress |
| In Progress | In Review |
| In Review | Done |
| Done | (no-op — ask user to confirm backward move) |
| Canceled | (no-op — ask user) |

### Step 3: Show + confirm

```
STL-99 "Retire retarget viewer"
  Current: In Progress
  Proposed: In Review

Confirm? (yes/no/other-state)
```

Wait for explicit approval unless this skill is being called programmatically from `shotloom-start-code` or `shotloom-auto-pr` (those pass `--no-confirm` via a marker in `$ARGUMENTS` or are documented as auto-callers — treat their call as pre-approved). For user-typed invocations, always confirm.

### Step 4: Transition

```
ToolSearch query="select:mcp__9d8f80bf-47aa-4193-a076-99b399b9d6dd__save_issue"
```
Call `save_issue` with `id: "STL-NN"` and `stateId: <id-for-target-state>`.

(To resolve `stateId`, first call `list_issue_statuses` for team "Shotloom" once and cache.)

### Step 5: Report

```
✅ STL-99: In Progress → In Review
  https://linear.app/.../issue/STL-99
```

## Auto-callers (pre-approved)

These skills call `shotloom-linear-move` programmatically and do NOT require per-call user approval. The transitions they perform are:

- **`shotloom-start-code`** — after worktree creation, transitions `Todo` or `Backlog` → `In Progress`. Skip silently if issue is already In Progress or later.
- **`shotloom-make-pr`** — at Step 9 (after PR creation), transitions `In Progress` → `In Review`. Skip if PR is `--draft` without a "ready" hint, or if issue is already In Review or later.
- **`shotloom-auto-pr`** — when PR reaches MERGED (terminal handler in the React workflow), transitions → `Done`. Skip if already Done or Canceled.
- **`shotloom-wrapup-task`** — when wrapping up a task with `merged` / `done-no-pr` mode, transitions → `Done`; with `abandoned` mode, → `Canceled`. Skip if already in target state.

## Notes

- Backward moves (Done → In Progress, or similar reverse moves) always require explicit user confirmation even from auto-callers.
- If Linear API returns permission error, surface the error and stop — don't retry with different state IDs.
