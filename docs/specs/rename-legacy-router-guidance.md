# Rename Legacy Router Guidance

## Status

Accepted.

## Goal

Rename the active Knitten Core guideline file `docs/guidelines/routing-integration.md` to
`docs/guidelines/legacy-router-migration.md` so it reads as legacy migration
guidance instead of current routing integration guidance.

## Problem

Knitten no longer presents routing as the product direction. The content of
`routing-integration.md` already says it is legacy migration guidance, but the
filename and title still look like active router integration policy.

## Boundary

In scope:

- Rename the guideline file.
- Update active references to the new file path.
- Keep the old file path as a short compatibility pointer only if it avoids
  breaking existing links.
- Reword active guidance away from adding route layers.

Out of scope:

- Rewrite historical specs that intentionally record past routing experiments.
- Delete the routing smoke eval runner or historical eval fixtures.
- Change output/path runtime registry names in code.
- Change payload plugin behavior.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `docs/guidelines/routing-integration.md` | Yes | Current legacy guidance with an outdated active-looking filename. |
| `docs/guidelines/skill-authoring.md` | Yes | Active skill creation guidance that references legacy router docs. |
| `skills/draft-spec/SKILL.md` | Yes | Spec drafting guidance for new skills and plugin changes. |
| `README.md` / `CHANGELOG.md` | Yes | Human-facing references that may mention the old filename. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| `docs/guidelines/legacy-router-migration.md` | durable | Canonical legacy router migration guide. |
| Optional `docs/guidelines/routing-integration.md` pointer | durable | Short compatibility note, not a policy document. |
| Updated references | durable | Active docs point to the new canonical name. |

## Contract

- New work must not be told to add routers by default.
- The canonical guideline title must say "Legacy Router Migration".
- Any retained `routing-integration.md` file must be short and point to the new
  file.
- Historical specs may keep old wording when they are clearly historical or
  experiment records.
- Validation must pass for source and installed Knitten Core plugin copies.

## Plan

1. Rename the canonical guide:
   - Move `docs/guidelines/routing-integration.md` to
     `docs/guidelines/legacy-router-migration.md`.
   - Change the title and headings from integration/checklist language to
     migration/compatibility language.

2. Add compatibility pointer if needed:
   - Keep `docs/guidelines/routing-integration.md` as a short pointer only if
     active or historical docs still link to it.
   - The pointer must not contain router setup instructions.

3. Update references:
   - Update `docs/guidelines/skill-authoring.md`.
   - Update `skills/draft-spec/SKILL.md` if it mentions the old file.
   - Update `README.md` or `CHANGELOG.md` references when they are active
     guidance rather than old release history.

4. Validate:
   - `node --check scripts/doctor.mjs`
   - `node --check scripts/resolve-output.mjs`
   - `node scripts/validate-repository-shell.mjs`
   - `node scripts/doctor.mjs`
   - plugin manifest validation
   - `git diff --check`

## Acceptance Criteria

- `docs/guidelines/legacy-router-migration.md` exists and is the canonical
  guide.
- `docs/guidelines/routing-integration.md`, if retained, is only a pointer.
- Active skill authoring guidance does not cite `routing-integration.md` as the
  go-to file for new router work.
- No active README/SYSTEM/MILESTONE wording presents routing as the product
  direction.
- Validation passes.

## Open Questions

- None.

## Review Plan

- Spec review: verify the plan changes naming without breaking old links.
- Implementation review: verify active references point to the new file and the
  old file cannot be mistaken for active policy.
