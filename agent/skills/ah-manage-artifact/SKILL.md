---
description: "Route lifecycle work for agent-hub shared artifacts: skills, rules, standards, plans, and entry docs."
---

# ah-manage-artifact

Lifecycle router for agent-hub shared artifacts.

## Purpose

Use this before creating, inspecting, editing, updating, deleting, renaming, or moving a shared artifact under `agent/`, deploy entry templates, or managed docs.

This skill prevents lifecycle drift across skills, rules, standards,
plans, and manifests.

## Artifact Classes

| Class | Path |
|-------|------|
| skill | `agent/skills/<name>/SKILL.md` |
| skill reference | `agent/skills/<skill>/references/<slug>.md` |
| rule | `agent/rules/<name>.md` |
| standard | `agent/standards/<group>/<name>.md` |
| document template | `agent/document-templates/<family>/<name>.md` |
| plan | `docs/plans/<lifecycle>/<name>.md` |
| decision | `docs/decisions/<id>-<name>.md` |
| entry document | `SYSTEM.md`, `agent/AGENTS.md`, `agent/CLAUDE.md` |
| manifest / registry | `agent/config/*.json`, `README.md`, `AGENT-HUB.md`, `LOOKUP.md` |

## Operation Router

| Operation | Skill / doc |
|-----------|-------------|
| Manage skill lifecycle | `agent/skills/ah-manage-skill/SKILL.md` |
| Retire a legacy command reference | `docs/plans/active/command-retirement-plan.md` |
| Create skill reference | owning skill `agent/skills/<skill>/references/`; update the owner skill link |
| Create rule | `agent/skills/ah-make-rule/SKILL.md` |
| Create standard | `agent/skills/ah-make-standard/SKILL.md` |
| Manage document template lifecycle | `agent/skills/ah-manage-document-template/SKILL.md` |
| Inspect patterns | `agent/skills/ah-show-patterns/SKILL.md` |
| Browse standards | `agent/skills/ah-browse-standards/SKILL.md` |

## Lifecycle Decision

| User intent | Action |
|-------------|--------|
| "create", "make", "new", "add" | Use the create row for the artifact class. For retired command requests, route to `command-retirement-plan` evidence and absorb into skills, standards, or templates. |
| "read", "show", "browse", "list", "where" | Use `LOOKUP.md`, `README.md`, or a browse/show skill before loading bodies. |
| "small edit", "wording", "path fix", "frontmatter fix" | Patch the target artifact only. Use `ah-edit-skill` for skills. |
| "refresh", "modernize", "align policy", "validator drift", "refactor" | Do a broad update. Use `ah-update-skill` for skills. |
| "delete", "remove" | Search references first. Use `ah-delete-skill` for skills. |
| "rename", "move" | Treat as delete + create unless the artifact owner has a stronger workflow. |

## Common Workflow

1. Classify artifact class and operation.
2. Resolve canonical owner:
   - shared layer files live under `agent/`
   - deploy entry templates live under `agent/`
   - machine-local files stay outside git unless a policy says otherwise
3. Read only required policy:
   - creation or naming → `agent/rules/author.md` and `agent/standards/policy/naming.md`
   - LLM-read doc edits → `agent/standards/policy/llm-first-docs.md`
   - routing metadata → `agent/rules/task-context-routing.md` and `agent/config/context-routing.json`
   - registry edits → owning `agent/config/*.json` or generated document block
4. Search references before destructive or path-changing work:

```bash
rg -n "<artifact-name>|<artifact-path>" AGENT-HUB.md README.md LOOKUP.md SYSTEM.md agent docs scripts
```

5. Patch canonical source only.
6. Update lookup, index, routing, generated inventory, and superseded stubs when affected.
7. Run validation:

```bash
node scripts/validate-llm-first.mjs
```

## Delete / Rename Gate

Before deleting or renaming any shared artifact:

1. List all references.
2. Classify each reference as generated, lookup, routing, command invocation, skill dependency, or policy dependency.
3. If a non-generated reference has no replacement, stop and report blockers.
4. If the user already gave broad cleanup approval, remove blockers in the same change.

## Report

Return:

- artifact class and operation
- files changed
- registry or lookup updates
- validation command and result
- deferred decisions

## Related

- `agent/skills/ah-make-skill/SKILL.md`
- `agent/skills/ah-manage-skill/SKILL.md`
- `agent/skills/ah-edit-skill/SKILL.md`
- `agent/skills/ah-update-skill/SKILL.md`
- `agent/skills/ah-delete-skill/SKILL.md`
- `agent/skills/ah-make-rule/SKILL.md`
- `agent/skills/ah-make-standard/SKILL.md`
