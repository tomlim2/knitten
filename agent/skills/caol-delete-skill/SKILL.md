---
description: "Safely remove an agent-hub skill and its registry references. Use when deleting an existing skill directory."
---

# caol-delete-skill

Safe deletion workflow for agent-hub skills.

## Purpose

Use this when removing an existing skill from agent-hub. The workflow checks references, routing, generated inventory, and installed symlinks before deleting files.

Deletion is destructive. Confirm the exact skill name and blocker list before removing tracked files unless the user has already given explicit deletion approval for that skill.

## Inputs

- Exact skill name
- Deletion reason
- Optional replacement skill name

## Workflow

1. Resolve `agent/skills/<skill-name>/`.
2. Refuse broad or protected targets:
   - empty skill name
   - wildcard name
   - `.system` skill
   - path outside `agent/skills/`
3. Search for references:

```bash
rg -n "<skill-name>|agent/skills/<skill-name>|/<skill-name>" AGENT-HUB.md README.md LOOKUP.md SYSTEM.md agent docs scripts
```

4. Classify references:
   - generated inventory
   - lookup or user-facing docs
   - routing config
   - commands that invoke the skill
   - standards or rules that depend on the skill
   - installed symlinks in harness directories
5. Stop if non-generated references remain and no replacement is defined.
6. Remove or update references in the same change:
   - `agent/config/context-routing.json`
   - `LOOKUP.md`
   - generated README inventory
   - generated `AGENT-HUB.md` routing block when affected
7. Delete only the target skill directory.
8. Remove installed symlinks only when they point at the deleted repository skill.

## Validation

Run from the agent-hub repo root:

```bash
node scripts/validate-llm-first.mjs
```

If the skill had scripts or external integrations, verify replacement docs or commands still resolve.

## Report

Return:

- Deleted directory
- Reference updates
- Removed symlinks
- Validation command and result
- Replacement path, if any

## Related

- `agent/skills/caol-manage-artifact/SKILL.md`
- `agent/skills/caol-make-skill/SKILL.md`
- `agent/skills/caol-edit-skill/SKILL.md`
- `agent/skills/caol-update-skill/SKILL.md`
- `agent/skills/caol-audit-skill/SKILL.md`
