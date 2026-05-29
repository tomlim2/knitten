---
description: Manage agent-hub skill lifecycle work across create, inspect, audit, edit, update, rename, archive/deprecate, delete, compatibility, and validation.
argument-hint: "<create|inspect|audit|edit|update|rename|archive|delete> <skill-name>"
allowed-tools: Read, Edit, Glob, Grep, Bash(git:*), Bash(rg:*), Bash(node:*), Bash(test:*), Bash(mv:*), Bash(ls:*)
domains: agent-hub
repo-keys: agent-hub
languages: markdown,json,yaml
task-types: authoring,review
context-profile: ah-authoring
context-standards: standards/policy/llm-first-docs.md
---

# ah-manage-skill

Skill lifecycle router for agent-hub skills.

## Purpose

Use this before creating, inspecting, auditing, editing, updating, renaming,
archiving, deprecating, or deleting a skill under `agent/skills/`.

This skill owns the skill-specific decision tree. Existing specialized skills
remain the operation engines.

## Inputs

| Input | Meaning |
|-------|---------|
| `<mode>` | `create`, `inspect`, `audit`, `edit`, `update`, `rename`, `archive`, `delete` |
| `<skill-name>` | Skill directory name under `agent/skills/` |
| `<new-skill-name>` | Required for `rename` |
| `<reason>` | Required for `archive` and `delete` |

If mode is omitted, infer it from the user request. If intent remains unclear,
show the operation router and stop.

## Operation Router

| User intent | Route |
|-------------|-------|
| create, make, add | `agent/skills/ah-make-skill/SKILL.md` |
| inspect, show, find owner | read `LOOKUP.md`, `AGENT-HUB.md`, and target `SKILL.md` only as needed |
| audit, review skill | `agent/skills/ah-audit-skill/SKILL.md` |
| small edit, wording, path fix, metadata fix | `agent/skills/ah-edit-skill/SKILL.md` |
| refresh, modernize, policy drift, validator drift | `agent/skills/ah-update-skill/SKILL.md` |
| rename, move | use this skill's rename workflow |
| archive, deprecate | use this skill's archive workflow |
| delete, remove | use archive/delete gate, then `agent/skills/ah-delete-skill/SKILL.md` |

## Resolve Target

1. Require skill names to match `^[a-z0-9]+(-[a-z0-9]+)*$`.
2. Resolve target path as `agent/skills/<skill-name>/SKILL.md`.
3. Stop if the path escapes `agent/skills/`.
4. Stop if the target is `.system` or outside the repository.

## Reference Scan

Run before rename, archive, or delete:

```bash
rg -n "<skill-name>|agent/skills/<skill-name>|/<skill-name>" AGENT-HUB.md README.md LOOKUP.md SYSTEM.md agent docs scripts
```

Classify every hit:

| Class | Action |
|-------|--------|
| generated inventory or generated view | refresh generator after edit |
| lookup/index | update in same change |
| routing metadata | update in same change or block |
| command invocation | define compatibility path before edit |
| skill dependency | update dependent skill or block |
| policy dependency | update policy owner or block |
| historical doc | leave unchanged unless it creates active routing ambiguity |

Path-changing work is blocked when a non-generated active reference has no
replacement.

## Rename Workflow

1. Resolve old and new names.
2. Validate the new category prefix against `agent/config/taxonomy.json`.
3. Run the reference scan.
4. Decide compatibility for each active reference:
   - rewrite reference;
   - keep shim;
   - add deprecation note;
   - block.
5. Move `agent/skills/<old>/` to `agent/skills/<new>/`.
6. Update references in the same change.
7. Run `node scripts/generate-artifact-inventory.mjs`.
8. Run validation.

Never rename a skill only for cosmetic preference. Rename only when the current
name misroutes the task, promises a broader scope than the body, or conflicts
with a lifecycle/category family.

## Archive / Deprecate Workflow

Archive keeps the old skill route visible until compatibility is resolved.

| Condition | Action |
|-----------|--------|
| Replacement exists and active references can move now | update references, then archive or delete by explicit request |
| Replacement exists but active references cannot move now | keep compatibility shim or deprecation note |
| No replacement exists | mark as deprecated only when users no longer need the route |
| User asks delete without replacement | run `ah-delete-skill`; stop if blockers remain |

Archive/deprecate state must be visible through at least one of:

- target `SKILL.md` frontmatter;
- compatibility shim;
- artifact inventory classification;
- milestone or spec follow-up.

## Inventory Refresh

Run `node scripts/generate-artifact-inventory.mjs` after any action that changes:

| Field | Trigger |
|-------|---------|
| `artifact-path` | create, rename, move, delete |
| `classification-stage` | archive, deprecate, migration decision |
| `proposed-destination` | core/pack boundary decision |
| `compatibility-need` | rename, path migration, alias/shim decision |
| `review-state` | audit outcome or lifecycle blocker |
| `extraction-count` | skill body split or reference extraction |

Do not hand-edit `agent/config/artifact-inventory.json`.

## Validation

Run from the agent-hub repo root:

```bash
git diff --check
node scripts/validate-llm-first.mjs
git status --short --branch
```

For rename, archive, or delete, also verify the reference scan has no unresolved
active references.

## Report

Return:

- operation and route used;
- changed files;
- reference-scan result;
- inventory refresh result, if run;
- validation command and result;
- blockers or deferred decisions.

## Related

- `agent/skills/ah-manage-artifact/SKILL.md`
- `agent/skills/ah-make-skill/SKILL.md`
- `agent/skills/ah-edit-skill/SKILL.md`
- `agent/skills/ah-update-skill/SKILL.md`
- `agent/skills/ah-delete-skill/SKILL.md`
- `agent/skills/ah-audit-skill/SKILL.md`
