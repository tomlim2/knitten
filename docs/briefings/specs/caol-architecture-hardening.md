---
status: intake
created: 2026-05-17
updated: 2026-05-17
owner: caol-ila
spec: docs/plans/active/caol-architecture-hardening.md
---

# Spec Intake: caol-architecture-hardening

## User Request

Pilot `caol-manage-spec` by updating `caol-architecture-hardening.md` before
executing the next hardening batch.

## Goal

Make the architecture hardening spec match current repo state after the spec,
milestone, and post-implementation review skills landed.

## Route

- selected route: caol operational spec update
- candidate routes: milestone review, validator hardening, path cleanup
- delegated or referenced skills: `caol-manage-spec`, `caol-review-implementation`

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| spec | `docs/plans/active/caol-architecture-hardening.md` | target spec |
| milestone | `docs/milestones/spec-lifecycle-system.md` | pilot progress owner |
| skill | `agent/skills/caol-manage-spec/SKILL.md` | update workflow |
| skill | `agent/skills/caol-review-implementation/SKILL.md` | post-update review |
| command | `node scripts/validate-llm-first.mjs` | current validator state |
| command | `git ls-files ... \| rg ...` | tracked hardcoded path scan |
| directory | `agent/skills/caol-hq` | tool-space migration target |
| directory | `tools/caol-hq` | expected post-move location |

## Known Decisions

- `caol-hq` is a tool app, not a skill.
- Preferred future path for the app is `tools/caol-hq`.
- Runtime/session artifacts must be excluded from hardcoded path scans.
- Full validator is currently green.

## Open Questions

- Should historical docs with exact machine paths be sanitized or allowlisted?
- Should `docs/plans/` be physically migrated or indexed by status first?
- Should redirect standards remain in `standards/index.md` as compatibility
  entries?

## Exclusions

- Do not move `caol-hq` in this pilot.
- Do not patch hooks, settings, commands, or validators in this pilot.
- Do not migrate `docs/plans/` in this pilot.

## Validation Expected

- `node scripts/validate-llm-first.mjs`
- `git diff --check`
- tracked hardcoded path scan remains reproducible
