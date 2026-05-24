---
description: "Refresh an existing agent-hub skill against current policy, routing, and validator expectations. Use when updating a skill beyond a small edit."
---

# ah-update-skill

Policy refresh workflow for existing agent-hub skills.

## Purpose

Use this when an existing skill needs a broader update: stale conventions, validator drift, routing metadata cleanup, structure repair, old paths, obsolete tool assumptions, or compaction-friendly refactoring.

For one small requested change, use `ah-edit-skill`.

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
5. Move bulky templates or examples into
   `agent/skills/<skill-name>/references/<slug>.md` if `SKILL.md` is too long.
6. Update registries only when the skill's discovery or routing behavior changes.
7. Refresh generated inventory if counts or generated blocks change.

## Boundaries

- Do not create a new skill here. Use `ah-make-skill`.
- Do not delete a skill here. Use `ah-delete-skill`.
- Do not silently change task semantics. Report behavior changes with before/after notes.
- Do not promote `profileCandidates` to live profiles without an explicit decision.

## Validation

Run from the agent-hub repo root:

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

- `agent/skills/ah-manage-artifact/SKILL.md`
- `agent/skills/ah-manage-skill/SKILL.md`
- `agent/skills/ah-edit-skill/SKILL.md`
- `agent/skills/ah-make-skill/SKILL.md`
- `agent/skills/ah-delete-skill/SKILL.md`
- `agent/skills/ah-audit-skill/SKILL.md`
