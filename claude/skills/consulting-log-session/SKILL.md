---
description: "Log technical consulting sessions per company with cumulative history. Use when recording consulting work for companies or reviewing past consulting history."
allowed-tools:
  - Read
  - Write
  - Edit
  - Glob
  - Grep
  - AskUserQuestion
---

# consulting-log-session

Log technical consulting sessions and build per-company history.

## Purpose

Record technical consulting sessions for specific companies. Each company gets a dedicated file where sessions accumulate over time, building a complete consulting history.

---

## Arguments

- `<company>` - Company name (e.g., `Nexon`, `Krafton`, `SmileGate`)
- `[action]` - Optional: `list` to show all companies, `summary` to show overview

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

```
Usage:
  /consulting-log-session CompanyName         → Log a new session for CompanyName
  /consulting-log-session list                → Show all companies with session counts
  /consulting-log-session summary             → Overview of all consulting activity
```

---

## File Structure

Consulting logs are stored in **Obsidian vault** (not `private/`):

```
{obsidian_vault}/claude/consulting/
├── nexon.md               # Company history file
├── krafton.md
└── the-lab.md
```

**Obsidian vault path:** Read `~/.claude/private/repo-paths.json` → key `obsidian` → `.path` → append `/claude/consulting/`

Each company gets ONE file. Sessions accumulate in reverse chronological order (newest first).

## Additional Resources

For company file format template, full workflow details for all 3 actions (log/list/summary), and notes, see [reference.md](reference.md).
