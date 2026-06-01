# AH Payload Plugin Minimal Adoption

## Status

Draft.

## Goal

Create a separate `knitten-ah` payload plugin for Knitten/agent-hub operating
skills, then migrate `ah-*` skills one at a time.

The first milestone should prove the payload plugin shape and one imported AH
skill. It should not import company, personal, hobby, Shotloom, tutoring, drink,
or other domain-specific skills.

## Boundary

`knitten` remains the minimal core plugin.

`knitten-ah` owns Knitten/agent-hub operation skills.

`knitten-all-skills` remains a legacy holding area while skills are reviewed and
moved out deliberately.

## Repository Target

First create `knitten-ah` as a separate local checkout:

```text
/Users/younsoolim/Desktop/www/knitten-ah
```

The initial round does not require a remote repository. Add a remote only after
the local payload plugin validates, materializes, and exposes `ah-status`.

The plugin is private/internal by default. Its manifest should use
`"license": "UNLICENSED"` unless a later publishing decision chooses a public
license.

## Non-goals

- Do not move all `ah-*` skills at once.
- Do not add validator rules that block specific words.
- Do not scan for domain words as a hard failure.
- Do not import Shotloom, tutoring, drink, CINEV, UE, VRM, PMX, Obsidian, or
  other domain skills into `knitten-ah`.
- Do not make `knitten` core depend on `knitten-ah`.

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

- report that `knitten-ah` is installed as a payload plugin
- point to the next candidate AH skills
- avoid file edits unless explicitly requested

This mirrors the successful `knitten-status` approach and proves the payload
skill surface before importing heavier workflows.

## Candidate Migration Order

Move one skill per round after the payload plugin is proven. This order is a
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

- source manifest exists and has `name: "knitten-ah"`
- `skills/ah-status/SKILL.md` exists
- personal marketplace has a `knitten-ah` entry
- entry path is `./plugins/knitten-ah`
- copied plugin manifest exists and has `name: "knitten-ah"`
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

- `knitten-ah` exists at `/Users/younsoolim/Desktop/www/knitten-ah`.
- `.codex-plugin/plugin.json` uses `name: "knitten-ah"` and
  `license: "UNLICENSED"`.
- `python3 <validate_plugin.py> .` passes in `knitten-ah`.
- `node scripts/materialize-local-plugin.mjs` registers `knitten-ah` in the
  personal marketplace.
- `node scripts/doctor.mjs` reports `ok: true`.
- `python3 <validate_plugin.py> ~/.agents/plugins/plugins/knitten-ah` passes.
- The first payload skill, `ah-status`, is available in the plugin tree.
- No non-AH domain skills are imported.
