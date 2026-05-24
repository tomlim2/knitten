---
description: "Targeted maintenance for an existing agent-hub skill. Use when making a small, requested edit to one SKILL.md or its local support files."
---

# ah-edit-skill

Targeted maintenance workflow for existing agent-hub skills.

## Purpose

Use this for narrow edits to an existing skill: wording, frontmatter, routing metadata, path fixes, small workflow corrections, or support-file tweaks.

This is not for creating, deleting, renaming, or broad policy refreshes.

## Inputs

- Skill name, for example `ah-make-skill`
- Requested change
- Optional target file inside the skill directory

## Workflow

1. Resolve the skill directory.
   - Prefer `agent/skills/<skill-name>/` when working in this repository.
   - If invoked outside this repository, inspect the configured skill path and identify the canonical owner before editing.
2. Read the current `SKILL.md`.
3. Read policy only as needed:
   - `SYSTEM.md`
   - `agent/rules/author.md`
   - `agent/standards/policy/llm-first-docs.md`
   - `agent/config/context-routing.json` when routing metadata changes
4. Classify the edit:
   - `frontmatter`
   - `workflow`
   - `reference`
   - `script`
   - `routing`
5. Patch only the requested surface.
6. Preserve unrelated user edits and local support files.
7. Keep `SKILL.md` concise. Move long examples, templates, or logs into
   `agent/skills/<skill-name>/references/<slug>.md`.

## Routing Edits

When changing routing metadata:

1. Reuse axes from `agent/config/context-routing.json`.
2. Do not invent live `domains`, `repo-keys`, `languages`, `frameworks`, `task-types`, or `context-profile` values.
3. If a new axis or profile is only a proposal, add it under `profileCandidates`, not live metadata.
4. Add pilot files only when the validator expects generated routing inventory.

## Validation

Run from the agent-hub repo root:

```bash
node scripts/validate-llm-first.mjs
```

If the skill contains scripts, run the smallest relevant smoke check.

## Report

Return:

- Changed files
- Edit category
- Validation command and result
- Any remaining risk or follow-up decision

## Related

- `agent/skills/ah-manage-artifact/SKILL.md`
- `agent/skills/ah-manage-skill/SKILL.md`
- `agent/skills/ah-make-skill/SKILL.md`
- `agent/skills/ah-update-skill/SKILL.md`
- `agent/skills/ah-delete-skill/SKILL.md`
- `agent/skills/ah-audit-skill/SKILL.md`
