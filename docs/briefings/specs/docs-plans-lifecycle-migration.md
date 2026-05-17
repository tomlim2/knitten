---
status: intake
created: 2026-05-17
updated: 2026-05-17
owner: caol-ila
spec: docs/plans/completed/docs-plans-lifecycle-migration.md
---

# Spec Intake: docs-plans-lifecycle-migration

## User Request

Continue the spec lifecycle system work by preparing the `docs/plans/`
lifecycle migration before any broad file moves.

## Goal

Make a cold-start-safe migration contract for splitting current flat plan/spec
files by lifecycle state without breaking spec CRUD, milestone links,
briefings, validators, or generated indexes.

## Route

- selected route: caol/Knitten spec lifecycle migration
- candidate routes: caol architecture hardening, milestone management,
  validator hardening
- delegated or referenced skills: `caol-manage-spec`,
  `caol-manage-milestone`, `caol-review-implementation`

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| directory | `docs/plans/` | migration source |
| milestone | `docs/milestones/spec-lifecycle-system.md` | owning milestone |
| skill | `agent/skills/caol-manage-spec/SKILL.md` | current flat spec path contract |
| skill | `agent/skills/caol-manage-milestone/SKILL.md` | current `../plans/<slug>.md` link contract |
| skill | `agent/skills/caol-review-implementation/SKILL.md` | changed-spec resolution contract |
| config | `agent/config/taxonomy.json` | registered docs path |
| standard | `agent/standards/policy/naming.md` | current naming rule for plans |
| script | `scripts/validate-llm-first.mjs` | validator path assumptions |
| command | `git ls-files docs/plans` | tracked source inventory |

## Known Decisions

- Keep Markdown as the primary lifecycle source.
- Do not run physical moves until this migration spec is reviewed.
- Do not rename `docs/plans/` to `docs/specs/` in this migration.
- Preserve report/evidence files; do not delete them in the move batch.

## Open Questions

- Should legacy `open` specs default to `active/` or require manifest review?
- Should old flat paths leave redirect stubs or be fully link-rewritten?
- Should implemented-but-validation-blocked specs live in `active/` or
  `completed/`?

## Exclusions

- No Obsidian vault migration.
- No deletion of old specs without an explicit delete decision.
- No milestone rewrite beyond link and status maintenance.
- No runtime/session artifact migration.

## Validation Expected

- `node scripts/validate-llm-first.mjs`
- `git diff --check`
- duplicate slug check across `docs/plans/**`
- link check for moved specs, milestones, and briefings
