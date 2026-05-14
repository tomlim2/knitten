---
description: "Refresh an existing caol-ila skill against current policy, routing, and validator expectations. Use when updating a skill beyond a small edit."
---

# caol-update-skill

Policy refresh workflow for existing caol-ila skills.

## Purpose

Use this when an existing skill needs a broader update: stale conventions, validator drift, routing metadata cleanup, structure repair, old paths, obsolete tool assumptions, or compaction-friendly refactoring.

For one small requested change, use `caol-edit-skill`.

## Inputs

- Skill name
- Update reason or target policy
- Optional scope limit, for example `frontmatter only`, `routing only`, or `no support files`

## Workflow

1. Resolve `agent/skills/<skill-name>/`.
2. Read:
   - `SKILL.md`
   - local support files referenced by `SKILL.md`
   - `SYSTEM.md`
   - `agent/rules/author.md`
   - `agent/standards/policy/llm-first-docs.md`
   - `agent/config/context-routing.json`
3. Run a focused audit before editing:
   - purpose and trigger are clear
   - first 5,000 tokens contain critical instructions
   - frontmatter is valid and minimal
   - references point to existing files
   - routing metadata uses live axes only
   - support files are referenced only when needed
   - commands and scripts are executable from documented paths
4. Patch the skill in small groups.
5. Move bulky templates or examples into local reference files if `SKILL.md` is too long.
6. Update registries only when the skill's discovery or routing behavior changes.
7. Refresh generated inventory if counts or generated blocks change.

## Boundaries

- Do not create a new skill here. Use `caol-make-skill`.
- Do not delete a skill here. Use `caol-delete-skill`.
- Do not silently change task semantics. Report behavior changes with before/after notes.
- Do not promote `profileCandidates` to live profiles without an explicit decision.

## Validation

Run from the caol-ila repo root:

```bash
node scripts/validate-llm-first.mjs
```

Run skill-specific smoke checks when scripts, generated files, or external tool commands change.

## Report

Return:

- Changed files
- What changed by category
- Validation command and result
- Deferred decisions

## Related

- `agent/skills/caol-edit-skill/SKILL.md`
- `agent/skills/caol-make-skill/SKILL.md`
- `agent/skills/caol-delete-skill/SKILL.md`
- `agent/skills/caol-audit-skill/SKILL.md`
