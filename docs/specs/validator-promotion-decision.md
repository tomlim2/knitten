# Validator Promotion Decision

## Status

Implemented.

## Goal

Decide which skill-audit and boundary checks belong in automated validators
after the Knitten Core pilot audits.

## Decision

Promote only stable, mechanically checkable repository health rules into
validators. Keep judgment-heavy skill quality checks in the audit checklist.

## Keep In Validators

These belong in `scripts/validate-repository-shell.mjs`, `scripts/doctor.mjs`,
or similarly mechanical scripts:

- required repository and plugin files exist,
- plugin manifest has required fields and the expected plugin name,
- source and materialized plugin copies are both reachable,
- output registries have valid shape,
- output and local artifact templates are safe relative paths and exist,
- Shotloom compatibility entries carry the required compatibility metadata,
- new primary Shotloom task memory is rejected from Knitten Core registries,
- local helper paths are safe, allowed, and reachable,
- repository shell file allowlist catches accidental broad surfaces,
- example plugin paths are intentionally allowed,
- output resolver smoke checks return expected paths and persistence.

## Keep In Human Audit

These should not be promoted to `doctor` yet:

- whether a description is "clear enough",
- whether a `Use for:` line is too broad,
- whether a skill body is subjectively too long,
- whether a non-trigger rule is sufficiently helpful,
- whether a workflow is over-engineered,
- whether an abstraction or dependency is unnecessary,
- whether a reference split is tasteful enough.

They remain in `docs/guidelines/skill-audit-checklist.md` until repeated audits
produce a stable mechanical rule with low false-positive risk.

## Future Candidates

Consider adding validator warnings, not hard failures, after more audits:

- active `skills/**/SKILL.md` files include `match-check`,
- active `skills/**/SKILL.md` files include `Step 0: Match Check`,
- skills with `references/` include a post-match loading guard,
- strict external-mutation keywords require explicit approval wording.

Do not promote these as hard failures until the rule can distinguish active
skill files from historical docs and intentional compatibility surfaces.

## Validation

- `python3 <plugin-validator-path> .`
- `node scripts/validate-repository-shell.mjs`
- `node scripts/doctor.mjs`
- `git diff --check`
