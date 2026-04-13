---
description: Generate a new rules/*.md enforcement file
argument-hint: "<topic-name>"
allowed-tools: Read, Write, Edit
---

# meta-make-rule

Create a new `~/.claude/rules/{topic}.md` file — short, always-applied constraints.

## Arguments

- `<topic-name>` — filename stem (lowercase, hyphens). e.g., `git-push`, `slack`, `testing`.

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

```
Usage: /meta-make-rule <topic-name>

Examples:
  /meta-make-rule git-push
  /meta-make-rule slack
  /meta-make-rule testing
```

## Rules

Read these first:

- @~/.claude/skills/meta-make-rule/SKILL.md — structure, template, rule vs standard decision
- @~/.claude/rules/index.md — existing groups to slot the new file into

## Workflow

1. **Validate name** — lowercase, hyphens only, not already in `rules/`.
2. **Ask user**:
   - Short scope (1 line, for index table)
   - The bullets (or confirm user will fill later)
   - Target group: Core / Command Authoring / Domain-specific
   - Backing standard path (if any)
3. **Write file** — `~/.claude/rules/{name}.md` from SKILL.md template.
4. **Update index** — add row to `rules/index.md` in the chosen group, preserving order.
5. **CLAUDE.md hint** — if rule is core session-level, print the `@import` block to add to CLAUDE.md.
6. **Report** — print new file path.

## After Creation

Remind the user to:
- Fill bullets if placeholder left
- Cross-reference from the backing standard's "Related" section (if applicable)
- Commit with `feat: add rules/{name}.md — {topic}`
