---
status: intake
created: 2026-05-26
updated: 2026-05-26
owner: agent-hub
spec: docs/plans/completed/artifact-inventory-reviewed-decision-application.md
---

# Spec Intake: artifact-inventory-reviewed-decision-application

## User Request

Create a separate worktree and write the next spec for the
`agent-artifact-pack-system` milestone.

## Goal

Define the next small executable slice after artifact-pack manifest, routing,
example pack, and worktree-first cleanup: apply already reviewed core-owned
classification decisions to the artifact inventory generator/output.

## Route

- selected route: `ah-manage-spec`
- candidate routes: `ah-manage-milestone`, direct milestone cleanup
- delegated or referenced skills: `ah-manage-spec`, `ah-manage-milestone`

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| file | `docs/milestones/agent-artifact-pack-system.md` | Active umbrella milestone and priority state. |
| file | `docs/plans/active/artifact-inventory-classification.md` | Inventory schema and generator contract. |
| file | `docs/plans/active/core-artifact-boundary.md` | Boundary rule and reviewed classification report owner. |
| file | `docs/plans/active/bootstrap-skill-definition-selection.md` | Existing generator role decision pattern. |
| file | `docs/plans/reports/core-artifact-boundary/core-owned-classification-2026-05-24.md` | Reviewed core-owned classification decisions to apply. |
| file | `agent/config/artifact-inventory.json` | Current generated inventory still has most rows `undecided`. |
| script | `scripts/generate-artifact-inventory.mjs` | Generator currently defaults most rows to `undecided`. |
| script | `scripts/validate-llm-first.mjs` | Validator enforces inventory shape but not reviewed-decision application yet. |

## Known Decisions

- No physical artifact moves in this spec.
- Use reviewed reports as evidence; do not infer final destinations from chat.
- Keep blocked rows blocked or migrate-later until their blockers are resolved.

## Open Questions

- Should report-to-generator mapping be encoded as a table in the generator, a
  JSON decision file, or a parser for report tables?

## Exclusions

- No new artifact repository.
- No compatibility shim implementation.
- No public `knitten-core` release gate.
- No skill body extraction.

## Validation Expected

- `git diff --check`
- `node scripts/validate-llm-first.mjs`
- Inventory count command proving reviewed rows are no longer emitted as
  `undecided`.
