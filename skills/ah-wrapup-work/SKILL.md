---
name: ah-wrapup-work
description: Close completed or cancelled AH work with summary, cleanup, lessons, and next tasks.
---

# AH Wrapup Work

Use this umbrella skill after a merge, cancellation, or explicit request to close
out a task.

## Input

- Merged PR, completed branch, or cancellation state.
- Validation and review evidence when available.

## Output

- Final task summary.
- Cleanup candidates.
- Captured lessons or findings.
- Next-task candidates.

## Flow

1. Summarize what changed and why it is done or stopped.
2. List validation and review evidence.
3. Identify safe cleanup candidates without deleting them by default.
4. Capture reusable lessons or route recurring workflow issues through
   `ah-report-finding`.
5. Use `ah-manage-milestone` when the user asks to update milestone state.
6. Suggest the next task when useful.

## Rules

- Do not delete branches, worktrees, or artifacts unless the user asks or an
  explicit safe cleanup contract applies.
- Prefer reusable lessons over long historical logs.

## Path Handling

Wrap up the active workspace task. Cleanup candidates must be reported relative
to that workspace. Do not clean plugin install files unless the plugin itself is
the task target.
