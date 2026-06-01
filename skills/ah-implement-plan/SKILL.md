---
name: ah-implement-plan
description: Implement a reviewed AH spec and design plan, keeping changes scoped and reporting validation evidence.
---

# AH Implement Plan

Use this leaf skill for first implementation from a reviewed spec and design
plan.

## Input

- Reviewed spec.
- Design plan.
- Target repository state.

## Output

- Changed files.
- Validation commands and results.
- Remaining blockers or questions.

## Steps

1. Read the target files before editing.
2. Make the smallest changes that satisfy the accepted spec.
3. Follow local conventions.
4. Run focused validation.
5. Report changed files, validation, and any remaining risk.

Do not commit or create a PR unless the user asks.

Resolve user work relative to the active workspace, not the plugin install path.
When roots are unclear, run:

```bash
node <knitten-plugin-root>/scripts/resolve-paths.mjs
```
