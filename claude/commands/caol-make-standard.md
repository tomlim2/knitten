---
description: Generate a new standards/*.md reference doc
argument-hint: "<topic-name>"
allowed-tools: Read, Write, Edit
---

# caol-make-standard

Create a new `~/.claude/standards/{topic}.md` reference document following the standard structure.

## Arguments

- `<topic-name>` — filename stem (lowercase, hyphens). e.g., `review-code-python`, `cinev-lighting`, `webgpu-patterns`.

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

```
Usage: /caol-make-standard <topic-name>

Examples:
  /caol-make-standard review-code-python
  /caol-make-standard cinev-lighting
  /caol-make-standard webgpu-patterns
```

## Rules

Read these first:

- @~/.claude/skills/caol-make-standard/SKILL.md — structure, template, workflow
- @~/.claude/standards/index.md — existing groups to slot the new file into

## Workflow

1. **Validate name** — lowercase, hyphens only, not already present in `standards/`.
2. **Ask user** — one-line purpose, target group in index, when-to-read hint.
3. **Write file** — `~/.claude/standards/{name}.md` from SKILL.md template. Do NOT fill body content beyond placeholders; user will write it.
4. **Update index** — add row to `standards/index.md` in the chosen group, preserving alphabetical order within the group.
5. **Report** — print new file path and checklist of sections to fill in.

## After Creation

Remind the user to:
- Fill Scope, main sections, and Examples
- Promote hard must-follow bullets to `rules/` via `/caol-make-rule`
- Commit with `feat: add standards/{name}.md — {topic}`
