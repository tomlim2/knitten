---
description: "Manage the document template lifecycle under agent/document-templates: create, update, review, redirect, and delete with consumer validation."
argument-hint: "<create|update|review|redirect|delete> <template-path-or-slug>"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git:*), Bash(rg:*), Bash(node:*)
domains: agent-hub
repo-keys: agent-hub
languages: markdown,yaml,json
task-types: authoring,implementation,review
context-profile: ah-authoring
context-standards: standards/authoring/document-templates.md,standards/policy/llm-first-docs.md
---

# ah-manage-document-template

Manage the lifecycle of reusable document body templates under
`agent/document-templates/`.

## Purpose

Use this when the user asks to create, update, review, redirect, rename, move,
or delete a document template.

This skill owns the document template lifecycle. It does not own broader skill,
command, rule, or artifact-pack lifecycle work.

## Canonical Paths

| Template family | Path | Consumer |
|-----------------|------|----------|
| GitHub PR body | `agent/document-templates/github/*.md` | GitHub runtime mirror |
| Linear issue body | `agent/document-templates/linear/*.md` | Linear issue commands |
| Agent-hub docs | `agent/document-templates/agent-hub/*.md` | spec, milestone, technical spec skills |
| Review output | `agent/document-templates/review/*.md` | review skills and standards |
| Obsidian notes | `agent/document-templates/obsidian/*.md` | vault note workflows |
| Consulting records | `agent/document-templates/consulting/*.md` | consulting workflows |
| Project records | `agent/document-templates/project/*.md` | project record workflows |

## Required Reads

Before editing, read:

| File | Use |
|------|-----|
| `agent/standards/authoring/document-templates.md` | ownership and inventory |
| `agent/document-templates/README.md` | consumer format contract |
| `agent/skills/obsidian-obsidian-markdown/references/TAG-TAXONOMY.md` | note tag axes for Obsidian, consulting, project templates |

Read only the consumer-specific skill, command, or standard when the target
template family names one.

## Modes

| Mode | Use when | Required writes |
|------|----------|-----------------|
| `create <family>/<slug>` | adding a reusable body template | template, inventory row, validator coverage |
| `update <path>` | changing an existing template | template plus affected consumers or mirrors |
| `review <path>` | checking a template or template branch | findings-first review; patch only if asked |
| `redirect <old> <new>` | moving or superseding a template | old-path stub with `status: superseded` and `superseded-by:` |
| `delete <path>` | removing a template | delete only after explicit request and no live consumers |

## Create Workflow

1. Resolve the family from `agent/document-templates/README.md`.
2. Search for existing templates and consumers:

```bash
rg -n "<slug>|<template-name>" agent docs .github scripts
```

3. Create the template under the canonical family folder.
4. Add or update the inventory row in
   `agent/standards/authoring/document-templates.md`.
5. Add validator coverage when the family or consumer contract is new.
6. Add runtime mirror handling when the consumer requires a fixed path.

## Update Workflow

1. Read the template and its consumer contract.
2. Patch the canonical template first.
3. Update consumers that embed or load the old body shape.
4. Update runtime mirrors after canonical changes.
5. Run targeted stale-path scans.

## Review Workflow

Lead with findings. Check:

| Area | Check |
|------|-------|
| canonical owner | template lives under `agent/document-templates/` |
| consumer contract | family-specific format is valid |
| Markdown fences | nested examples do not close an outer fence early |
| Obsidian tags | axes exist in taxonomy; max five tags |
| mirrors | required mirrors match canonical body |
| stale paths | no undocumented legacy template-source folder or deployed template path remains |
| validator | defect class is covered by `document-templates` check |

## Redirect Workflow

1. Create or update the old path as a redirect stub.
2. Use frontmatter:

```yaml
---
status: superseded
superseded-by: <relative-new-path>
---
```

3. Add a one-line body link to the replacement.
4. Search references to the old path.
5. Update live consumers unless they intentionally read the stub.

## Delete Workflow

Delete only after explicit user request.

1. Show the exact target path.
2. Run:

```bash
rg -n "<template-path>|<template-name>" agent docs .github scripts
git status --short
```

3. Stop if any live consumer lacks a replacement.
4. Remove inventory and mirror entries that only point to the deleted template.
5. Delete the file.

## Validation

Run:

```bash
node scripts/validate-llm-first.mjs --check document-templates
node scripts/validate-llm-first.mjs
git diff --check
```

For Obsidian, consulting, or project templates, also scan:

```bash
rg -n "tool/|agent[/]templates|~/.claude[/]templates" agent/document-templates agent/skills agent/commands agent/standards
```

## Report

Return:

- mode and target
- files changed
- mirror or redirect status
- validator result
- remaining live consumers or blockers

## Related

- `agent/document-templates/README.md`
- `agent/standards/authoring/document-templates.md`
- `agent/skills/ah-manage-artifact/SKILL.md`
