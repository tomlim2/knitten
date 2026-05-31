---
status: intake
created: 2026-05-31
updated: 2026-05-31
owner: agent-hub
spec: docs/plans/completed/output-contract-resolver-fixtures.md
---

# Spec Intake: output-contract-resolver-fixtures

## User Request

Create and review the next output contract enforcement task spec after merging
validator enforcement.

## Goal

Define focused resolver fixtures that prove `agent/lib/resolve-output.mjs`
continues to resolve current output ids and fails predictably for broken runtime
inputs.

## Route

- selected route: agent-hub spec authoring
- candidate routes: validator fixture work, consumer adoption work
- delegated or referenced skills: `ah-manage-spec`

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| milestone | `docs/milestones/output-contract-enforcement-system.md` | Parent remaining todo row and AC6. |
| completed spec | `docs/plans/completed/output-contract-validator-enforcement.md` | Boundary between validator fixture and resolver fixture work. |
| resolver | `agent/lib/resolve-output.mjs` | Runtime contract to test. |
| registry | `agent/config/outputs.json` | Current success fixture source. |
| tests | `tests/*.test.mjs` | Existing Node test style. |

## Known Decisions

- Keep this slice focused on resolver runtime behavior.
- Do not add consumer skill adoption checks here.
- Do not add broad registry validation logic here; that belongs to
  `scripts/validate-llm-first.mjs --check outputs`.
- Prefer a committed `node --test` file over long ad-hoc shell fixture commands.

## Open Questions

- None.

## Exclusions

- Do not add new output rows.
- Do not change output field model.
- Do not add `verifyWith`, `afterWrite`, `outputType`, `outputProfile`, or
  `shapeKind`.
- Do not migrate skills.

## Validation Expected

- `node --check agent/lib/resolve-output.mjs`
- `node --test tests/output-contract-resolver.test.mjs`
- `node scripts/validate-llm-first.mjs`
- `git diff --check`
