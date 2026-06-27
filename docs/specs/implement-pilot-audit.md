# Knitten Core Implement Pilot Audit

## Status

Implemented.

## Goal

Audit `implement` as the first pilot skill for short match files,
deferred-loading discipline, and visible mutation safety.

## Scope

Reviewed:

- `skills/implement/SKILL.md`
- `docs/specs/skill-match-check-policy.md`
- `docs/guidelines/skill-authoring.md`

Out of scope:

- Rewriting other Knitten Core skills.
- Adding automated validators before the pilot checklist is stable.
- Changing commit, push, PR, deploy, or external mutation behavior.

## Findings

| Priority | Finding | Action |
|----------|---------|--------|
| P2 | `implement` declared `match-check: strict`, but its normal path is local file edits and local validation. Strict external-state actions are already stopped by Step 0 unless explicitly approved. | Changed frontmatter to `match-check: normal`. |

## Result

No P0/P1/P2 blockers remain for `implement`.

The skill keeps the important safety rules in the main file:

- require an accepted spec or accepted review finding before editing,
- confirm target workspace, files or modules, and validation expectations,
- stop before commit, push, merge, deploy, delete, or external mutation unless
  the user explicitly asks for that later action,
- prefer existing helpers, standard library, native features, and installed
  dependencies before adding code or dependencies.

## Validation

- `python3 <plugin-validator-path> .`
- `node scripts/validate-repository-shell.mjs`
- `node scripts/doctor.mjs`
- `node scripts/measure-skill-exposure.mjs .`
- `git diff --check`
