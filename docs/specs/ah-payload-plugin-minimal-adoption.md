# AH Skill Minimal Adoption

## Status

Draft.

## Goal

Migrate Knitten/agent-hub `ah-*` skills into the existing `knitten` plugin one
at a time.

The first milestone should add one minimal AH status skill to `knitten`. It
should not import company, personal, hobby, Shotloom, tutoring, drink, or other
domain-specific skills.

## Boundary

`knitten` remains the plugin.

`knitten` may own small Knitten/agent-hub operation skills when they are generic
to Knitten itself.

`knitten-all-skills` remains a legacy holding area while skills are reviewed and
moved out deliberately.

## Non-goals

- Do not move all `ah-*` skills at once.
- Do not add validator rules that block specific words.
- Do not scan for domain words as a hard failure.
- Do not import Shotloom, tutoring, drink, CINEV, UE, VRM, PMX, Obsidian, or
  other domain skills into `knitten`.

## Initial Plugin Tree

```text
.codex-plugin/plugin.json
.github/workflows/validate.yml
.gitignore
README.md
SYSTEM.md
skills/ah-status/SKILL.md
scripts/doctor.mjs
scripts/materialize-local-plugin.mjs
docs/specs/ah-payload-plugin-minimal-adoption.md
```

## First Skill

Start with a new minimal `ah-status` skill rather than copying a large existing
skill.

Purpose:

- report that `knitten` is installed and has AH skill support
- point to the next candidate AH skills
- avoid file edits unless explicitly requested

This mirrors the successful `knitten-status` approach and proves the AH skill
surface before importing heavier workflows.

## Candidate Migration Order

Move one skill per round after `ah-status` is proven. This order is a
starting hypothesis, not a commitment. Re-check dependencies before each round
and choose the smallest useful next skill.

| Order | Skill | Reason |
|-------|-------|--------|
| 1 | `ah-manage-spec` | Core AH authoring workflow, but needs resolver/template cleanup first. |
| 2 | `ah-report-finding` | Useful operational capture, but depends on missing scripts today. |
| 3 | `ah-manage-milestone` | Useful after spec handling is stable. |
| 4 | `ah-audit-skill` | Useful review skill, but has legacy fallback paths to remove. |
| 5 | `ah-edit-skill` | Higher mutation risk; move after audit and spec flows are stable. |

## Migration Rules

For each imported skill:

1. Copy only the specific skill under review.
2. Keep its purpose intact.
3. Remove references to unavailable scripts or paths.
4. Replace direct legacy repo assumptions with payload-local commands or clear
   preconditions.
5. For every referenced `references/`, script, template, rule, or standard,
   choose exactly one action:
   - remove dependency
   - inline dependency
   - copy dependency with reason
   - defer skill
6. Keep domain-specific examples only when they are generic examples, not active
   requirements.
7. Validate the plugin.
8. Materialize the local plugin copy.
9. Use the skill once in a low-risk test.

## Doctor Contract

`scripts/doctor.mjs` should check:

- source manifest exists and has `name: "knitten"`
- `skills/ah-status/SKILL.md` exists
- personal marketplace has a `knitten` entry
- entry path is `./plugins/knitten`
- copied plugin manifest exists and has `name: "knitten"`
- copied plugin version contains `+codex.` unless an explicit test flag allows
  source version

Doctor reports JSON and exits nonzero when a check fails.

## Validation Policy

Validation should prove plugin shape and required files. It should not enforce
word bans.

Allowed checks:

- manifest shape
- required files exist
- script syntax
- marketplace entry shape
- copied plugin validity
- skill frontmatter validity through the Codex plugin validator

Avoid checks that fail only because a document mentions a domain, legacy system,
or migration source. Those mentions should be reviewed semantically during each
skill migration round.

Runtime requirements are different from migration notes. A document may mention
a domain or legacy source as context, but active skill steps must not require
that domain or source unless the migrated skill explicitly owns that dependency.

## Acceptance Criteria

- `skills/ah-status/SKILL.md` exists in `knitten`.
- `.codex-plugin/plugin.json` exposes `skills: "./skills/"`.
- `python3 <validate_plugin.py> .` passes in `knitten`.
- `node scripts/materialize-local-plugin.mjs` registers `knitten` in the
  personal marketplace.
- `node scripts/doctor.mjs` reports `ok: true`.
- `python3 <validate_plugin.py> ~/plugins/knitten` passes.
- The first payload skill, `ah-status`, is available in the plugin tree.
- No non-AH domain skills are imported.
