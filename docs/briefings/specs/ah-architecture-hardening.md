---
status: intake
created: 2026-05-17
updated: 2026-05-17
owner: agent-hub
spec: docs/plans/completed/ah-architecture-hardening.md
---

# Spec Intake: ah-architecture-hardening

## User Request

Pilot `ah-manage-spec` by updating `ah-architecture-hardening.md` before
executing the next hardening batch.

## Goal

Make the architecture hardening spec match current repo state after the spec,
milestone, and post-implementation review skills landed.

## Route

- selected route: agent-hub operational spec update
- candidate routes: milestone review, validator hardening, path cleanup
- delegated or referenced skills: `ah-manage-spec`, `ah-review-implementation`

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| spec | `docs/plans/completed/ah-architecture-hardening.md` | target spec |
| milestone | `docs/milestones/spec-lifecycle-system.md` | pilot progress owner |
| skill | `agent/skills/ah-manage-spec/SKILL.md` | update workflow |
| skill | `agent/skills/ah-review-implementation/SKILL.md` | post-update review |
| command | `node scripts/validate-llm-first.mjs` | current validator state |
| command | `git ls-files ... \| rg ...` | tracked hardcoded path scan |
| directory | `tools/ah-hq` | dashboard tool app location |

## Known Decisions

- `ah-hq` is a tool app, not a skill.
- Dashboard app path is `tools/ah-hq`.
- Runtime/session artifacts must be excluded from hardcoded path scans.
- Full validator is currently green.

## Open Questions

- Should historical docs with exact machine paths be sanitized or allowlisted?
- Should `docs/plans/` be physically migrated or indexed by status first?
- Should redirect standards remain in `standards/index.md` as compatibility
  entries?

## Exclusions

- Do not move `ah-hq` back under `agent/skills/`.
- Do not patch validators in this pilot.
- Do not migrate `docs/plans/` in this pilot.

## Validation Expected

- `node scripts/validate-llm-first.mjs`
- `git diff --check`
- tracked hardcoded path scan remains reproducible
