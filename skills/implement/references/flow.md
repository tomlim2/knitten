# Implement Flow

Use this flow only after `implement` Step 0 passes.

## Input

- Reviewed spec and design plan, or accepted review findings.
- Target files, behavior, and validation expectations when known.

## Output

- Changed files.
- Validation commands and results.
- Remaining blockers or questions.

## Workflow

1. Read the accepted contract or findings.
2. Identify the smallest implementation surface.
3. Before adding code, check in order: existing repository helper or pattern,
   standard library, native platform feature, already-installed dependency.
4. Edit source, docs, or config in the active workspace only.
5. Fix blockers before grounded, locally actionable P3 findings and bounded
   documentation cleanup; do not leave either category unfinished merely
   because it is non-blocking.
6. Run the nearest meaningful validation and report coverage limits.

## Rules

- Prefer the target repository's conventions.
- Avoid new abstractions, dependencies, or public surfaces unless the accepted
  contract requires them or smaller existing options do not fit.
- Keep edits scoped to the accepted task.
- Remain local-only. Hand commit, push, merge, deploy, deletion, and external
  mutation to an owning strict skill.
- User work belongs in the active workspace, not the plugin install path.
