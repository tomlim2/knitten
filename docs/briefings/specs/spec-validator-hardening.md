---
status: intake
created: 2026-05-17
updated: 2026-05-17
owner: caol-ila
spec: docs/plans/spec-validator-hardening.md
---

# Spec Intake: spec-validator-hardening

## User Request

Continue the spec lifecycle system work after the `docs/plans/` lifecycle
migration spec by hardening validator support for specs and milestones.

## Goal

Add mechanical checks that keep spec, milestone, and intake links from drifting
as `docs/plans/` gains lifecycle folders and more specs point to milestones.

## Route

- selected route: caol/Knitten validator hardening
- candidate routes: spec lifecycle migration, milestone management,
  architecture hardening
- delegated or referenced skills: `caol-manage-spec`,
  `caol-manage-milestone`, `caol-review-implementation`

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| script | `scripts/validate-llm-first.mjs` | validator implementation target |
| milestone | `docs/milestones/spec-lifecycle-system.md` | owning milestone |
| spec | `docs/plans/docs-plans-lifecycle-migration.md` | duplicate slug and link requirements |
| spec | `docs/plans/caol-manage-milestone.md` | milestone attachment contract |
| directory | `docs/milestones/` | current milestone corpus |
| directory | `docs/briefings/specs/` | caol spec intake corpus |
| generated doc | `agent/standards/policy/principles.md` | validator check list block |
| manifest | `agent/config/agent-hub.json` | validator registry |

## Known Decisions

- Markdown remains the primary contract for specs and milestones.
- The first implementation batch should be small and green on current files.
- Shotloom briefings are out of scope for this caol-specific spec intake check.
- Report folders under `docs/plans/*-reports/` are evidence, not executable
  specs.

## Open Questions

- Should every future spec require `status:`, `created:`, `updated:`, and
  `owner:` frontmatter?
- Should lifecycle folders be enforced before the physical migration runs?
- Should Shotloom briefing/spec consistency move into a separate domain check?

## Exclusions

- Do not move `docs/plans/` files in this batch.
- Do not validate historical report files as specs.
- Do not require every spec to have a milestone.
- Do not rewrite old Shotloom briefing contracts.

## Validation Expected

- `node scripts/validate-llm-first.mjs --check spec-lifecycle`
- `node scripts/validate-llm-first.mjs --check generated-blocks`
- `node scripts/validate-llm-first.mjs --check agent-hub`
- `node scripts/validate-llm-first.mjs`
- `git diff --check`
