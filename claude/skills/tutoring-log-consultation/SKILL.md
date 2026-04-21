---
description: "Log parent consultations for tutoring students with cumulative history. Use when recording parent consultations for tutoring students or reviewing past consultation history."
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
---

# tutoring-log-consultation

Log parent consultations and build per-student history.

## Purpose

Record parent consultation sessions for tutoring students. Each student gets a dedicated file where consultations accumulate over time, building a complete consultation history.

---

## Arguments

- `<student>` - Student name (e.g., `이석민`)
- `[action]` - Optional: `list` to show all students, `summary` to show overview

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

```
Usage:
  /tutoring-log-consultation 이석민         → Log a new consultation for student
  /tutoring-log-consultation list           → Show all students with consultation counts
  /tutoring-log-consultation summary        → Overview of all consultation activity
```

---

## File Structure

Consultation logs are stored in **Obsidian vault** (not `private/`):

```
{obsidian_vault}/claude/tutoring/consultations/
├── 이석민.md
└── {other students}.md
```

**Obsidian vault path:** Read `~/.claude/private/caol-config/repo-paths.json` → key `obsidian` → `.path` → append `/claude/tutoring/consultations/`

Each student gets ONE file. Consultations accumulate in reverse chronological order (newest first).

## Additional Resources

For student file format template, full workflow details for all 3 actions (log/list/summary), and notes, see [reference.md](reference.md).
