---
status: intake
created: 2026-05-31
updated: 2026-06-01
owner: agent-hub
spec: docs/plans/completed/output-contract-consumer-adoption-pass.md
---

# Spec Intake: output-contract-consumer-adoption-pass

## User Request

Make and review the next milestone spec after output contract resolver fixtures.

## Goal

Define the first focused consumer adoption pass for the output contract
enforcement milestone. The pass must prove one high-repeat output-writing skill
uses resolver output fields instead of reconstructing path/template pairs from
prose.

## Route

| Item | Value |
|------|-------|
| selected route | agent-hub spec creation |
| candidate routes | milestone update, skill implementation follow-up |
| delegated or referenced skills | `ah-manage-spec`, `ah-manage-milestone`, `ah-review-implementation` |

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| milestone | `docs/milestones/output-contract-enforcement-system.md` | Parent scope and remaining acceptance criteria. |
| spec | `docs/plans/completed/output-contract-minimal-fields.md` | Forward registry fields and removed field list. |
| spec | `docs/plans/completed/skill-output-contract-adoption.md` | Adoption decision table and required skill wording. |
| config | `agent/config/outputs.json` | Current output ids and `madeBy` producers. |
| script | `agent/lib/resolve-output.mjs` | Resolver CLI and returned fields. |
| skill | `agent/skills/ah-manage-spec/SKILL.md` | First consumer candidate and current legacy wording. |
| command | `node agent/lib/resolve-output.mjs agent-hub-spec-proposed slug=output-contract-consumer-adoption-pass` | Confirms spec output path and template. |
| command | `node agent/lib/resolve-output.mjs agent-hub-design-plan-section slug=output-contract-consumer-adoption-pass` | Confirms Design Plan section output contract. |

## Known Decisions

| Decision | Source |
|----------|--------|
| Use `madeBy`, `writeTarget`, `args`, `template`, `format`, and optional `formatOptions` as the forward model. | `docs/plans/completed/output-contract-minimal-fields.md` |
| Do not revive `owner`, `shapeKind`, `afterWrite`, `verifyWith`, `outputType`, or `outputProfile`. | `docs/milestones/output-contract-enforcement-system.md` |
| First adoption proof should be focused, not broad migration. | `docs/milestones/output-contract-enforcement-system.md` |

## Open Questions

None.

## Exclusions

| Exclusion | Reason |
|-----------|--------|
| Broad skill migration | Milestone explicitly keeps broad migration out of scope. |
| New output ids | Current candidate can use existing `agent-hub-spec-proposed` and `agent-hub-design-plan-section`. |
| Registry schema changes | Minimal field and validator specs already own schema. |
| Historical completed spec rewrites | Completed specs preserve earlier design history. |

## Validation Expected

```bash
node agent/lib/resolve-output.mjs agent-hub-spec-proposed slug=output-contract-consumer-adoption-pass
node agent/lib/resolve-output.mjs agent-hub-design-plan-section slug=output-contract-consumer-adoption-pass
node scripts/validate-llm-first.mjs --check outputs
node scripts/validate-llm-first.mjs --check spec-lifecycle
node scripts/validate-llm-first.mjs
git diff --check
```
