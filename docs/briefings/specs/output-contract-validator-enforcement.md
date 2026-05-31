---
status: intake
created: 2026-05-31
updated: 2026-05-31
owner: agent-hub
spec: docs/plans/completed/output-contract-validator-enforcement.md
---

# Spec Intake: output-contract-validator-enforcement

## User Request

Create the next task spec and review it after merging the minimal output
contract field model.

## Goal

Define the validator enforcement slice that makes `agent/config/outputs.json`
fail on broken minimal output contract structure and leaves adoption proof for
a later consumer adoption slice.

## Route

- selected route: agent-hub spec authoring
- candidate routes: validator implementation, resolver fixture implementation
- delegated or referenced skills: `ah-manage-spec`

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| milestone | `docs/milestones/output-contract-enforcement-system.md` | Parent scope and remaining todo row. |
| completed spec | `docs/plans/completed/output-contract-minimal-fields.md` | Forward registry field contract. |
| registry | `agent/config/outputs.json` | Current rows to validate. |
| validator | `scripts/validate-llm-first.mjs` | Current `outputs` check and violation style. |
| resolver | `agent/lib/resolve-output.mjs` | Runtime shape returned by output ids. |

## Known Decisions

- Do not restore `verifyWith` or `afterWrite`.
- Infer output checks from `writeTarget`, `format`, `template`, `args`, and
  `madeBy`.
- Keep `workflow:<kebab-case-id>` pattern-only until workflows become durable
  registered artifacts.
- Adoption-state enforcement belongs to this spec only as a boundary decision;
  the broad skill adoption pass remains separate.

## Open Questions

- None. Resolver fixtures remain a separate
  `output-contract-resolver-fixtures.md` slice.

## Exclusions

- Do not migrate skill consumers in this slice.
- Do not add a workflow registry.
- Do not add explicit per-row validator ids.
- Do not add broad media output rows.

## Validation Expected

- `node --check scripts/validate-llm-first.mjs`
- `node scripts/validate-llm-first.mjs --check outputs`
- `node scripts/validate-llm-first.mjs`
- focused negative fixture command if implemented
- `git diff --check`
