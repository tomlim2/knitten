---
status: accepted
---

# Skill Template

Use this as the official recommended Markdown shape for production Knitten
skills.

## Generated Body

```markdown
---
description: <one sentence trigger-facing summary>
argument-hint: "<mode-or-args>"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git:*), Bash(rg:*), Bash(node:*)
domains: workflow
repo-keys: workflow
languages: markdown,json
task-types: authoring,review,implementation
context-profile: <context-profile-id>
context-standards: <comma-separated standards or blank>
context-references: <comma-separated references or blank>
---

# <skill-name>

## Purpose

Use this skill when <trigger condition>.

## Inputs

| Input | Required | Meaning |
|---|---|---|
| `<input>` | yes | <meaning> |

## Workflow

1. <first action>
2. <second action>
3. <validation or handoff action>

## Outputs

| Output | Contract |
|---|---|
| <file, comment, report, or state> | <output id, path, or validation evidence> |

## Validation

Command:
- `<command>`

## Handoff

- Report changed files.
- Report validation evidence.
- Name any remaining blocker or next owner.
```

## Fill Rules

- Keep the description trigger-facing and short.
- Prefer output ids over repeated path/template prose when an output contract exists.
- Keep workflow steps executable, not aspirational.
- Put reusable policy in standards or references, not in long skill prose.
- Keep HTML-like structure out of this official template.
