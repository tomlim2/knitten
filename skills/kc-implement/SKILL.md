---
name: kc-implement
description: Implement accepted specs or review findings.
---

# KC Implement

Use for: implementing accepted specs or review findings in the active workspace.

Use when the user asks to implement, apply a plan, or fix accepted review
findings.

## Input

- Reviewed spec and design plan, or accepted review findings.
- Target files, behavior, or validation expectations when known.

## Output

- Changed files.
- Validation commands and results.
- Remaining blockers or questions.

## Flow

1. Read the accepted contract or findings.
2. Identify the smallest implementation surface.
3. Before adding new code, check in order: existing repo helper/pattern,
   standard library, native platform feature, already-installed dependency.
4. Edit source, docs, or config in the active workspace only.
5. Fix blockers before nits.
6. Run the nearest meaningful validation and report coverage limits.

## Rules

- Prefer the target repository's own conventions.
- Avoid new abstractions, dependencies, or public surfaces unless the accepted
  contract requires them or smaller existing options do not fit.
- Keep edits scoped to the accepted task.
- Do not create a PR or commit unless the user asks.

## Path Handling

User work belongs in the active workspace, not the plugin install path.
