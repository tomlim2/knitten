---
name: ah-wrapup-work
description: Close out completed or cancelled AH work by summarizing outcome, identifying safe cleanup, recording lessons, and suggesting next tasks.
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

1. Use `ah-close-work` to summarize final state.
2. Use `ah-report-finding` for recurring workflow issues.
3. Use `ah-manage-milestone` when the user asks to update milestone state.

## Rules

- Do not delete branches, worktrees, or artifacts unless the user asks or an
  explicit safe cleanup contract applies.
- Prefer reusable lessons over long historical logs.

## Path Handling

Wrap up the active workspace task. Cleanup candidates must be reported relative
to that workspace. Do not clean plugin install files unless the plugin itself is
the task target.
