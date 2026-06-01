---
name: ah-implement-work
description: Implement a reviewed AH spec or fix accepted review findings while keeping edits scoped and validation explicit.
---

# AH Implement Work

Use this umbrella skill when the user asks to implement an accepted spec, apply
a design plan, or fix accepted review findings.

## Input

- Reviewed spec and design plan, or
- accepted review findings with target files or behavior.

## Output

- Changed files.
- Validation commands and results.
- Remaining blockers or questions.

## Flow

1. Use `ah-implement-plan` for first implementation from a reviewed spec/design
   plan.
2. Use `ah-apply-review-fixes` when the input is review findings.
3. Fix blockers before nits.
4. Do one cheap local nit pass only after blockers are gone.
5. Run the nearest meaningful validation and report coverage limits.

## Rules

- Prefer the target repository's own conventions.
- Keep edits scoped to the accepted task.
- Do not create a PR or commit unless the user asks.

## Path Handling

Delegate path-sensitive implementation to `ah-implement-plan` or
`ah-apply-review-fixes`. User work belongs in the active workspace, not the
plugin install path.
