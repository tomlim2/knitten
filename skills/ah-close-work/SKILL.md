---
name: ah-close-work
description: Close a generic AH task by summarizing final state, validation, cleanup candidates, lessons, and next-task candidates.
---

# AH Close Work

Use this leaf skill after merge, cancellation, or explicit task closeout.

## Input

- Merged PR, completed branch, or cancelled task.
- Validation and review evidence.

## Output

- Final summary.
- Cleanup candidates.
- Lessons or findings.
- Next-task candidates.

## Steps

1. Summarize what changed and why it is done or stopped.
2. List validation and review evidence.
3. Identify safe cleanup candidates without deleting them by default.
4. Capture reusable lessons or route them through `ah-report-finding`.
5. Suggest the next task when useful.

## Path Handling

Report cleanup candidates relative to the active workspace. Do not delete or
write inside the plugin install path unless the task is explicitly about the
plugin itself. When roots are unclear, run:

```bash
<knitten-plugin-root>/bin/knitten-resolve-output
```
