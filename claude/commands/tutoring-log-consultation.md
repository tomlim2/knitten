---
description: Log parent consultation for tutoring
argument-hint: "<student> | list | summary"
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
---

# tutoring-log-consultation

Log parent consultations for tutoring students. Delegates to the `tutoring-log-consultation` skill.

## Arguments

- `<student>` - Student name (e.g., `이석민`)
- `list` - Show all students with consultation counts
- `summary` - Overview of all consultation activity

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /tutoring-log-consultation <student> | list | summary

## Workflow

Read and follow the instructions in `~/.claude/skills/tutoring-log-consultation/SKILL.md`.

Execute using $ARGUMENTS.
