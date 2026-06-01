---
name: ah-prepare-work
description: Prepare generic AH development work before implementation by gathering context, drafting a spec, adding a design plan, reviewing it, and applying accepted spec fixes.
---

# AH Prepare Work

Use this umbrella skill when the user wants to start a development task, create
a spec, brainstorm, make a design plan, or get work ready before editing source
files.

## Input

- User request.
- Existing issue, PR, branch, document, or repo context when present.

## Output

- Task purpose.
- Reference summary.
- Brainstorm notes when useful.
- Reviewed spec and design plan.
- Open questions or blockers, if any.

## Flow

1. Use `ah-gather-references` when the task needs repository or external context.
2. Use `ah-organize-references` when gathered context needs pruning or grouping.
3. Use `ah-brainstorm-approaches` when there are meaningful implementation choices.
4. Use `ah-draft-spec` to write the task spec.
5. Use `ah-add-design-plan` when the spec needs implementation sequencing.
6. Use `ah-review-spec` to find blockers and nits.
7. Use `ah-apply-review-fixes` for accepted spec/design-plan fixes.

## Stop

Stop and ask only when the task purpose is unclear, required external context is
missing, or spec review finds a user-judgment blocker.

## Path Handling

Prepare documents and plans for the active workspace. Plugin resources are read
from the plugin root; user work is written or reported relative to the active
workspace. When roots are unclear, run:

```bash
<knitten-plugin-root>/bin/knitten-resolve-output
```
