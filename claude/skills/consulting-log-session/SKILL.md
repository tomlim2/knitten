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

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `consulting-log-session`

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

```
private/consulting/
├── nexon.md               # Company history file
├── krafton.md
└── smilegame.md
```

Each company gets ONE file. Sessions accumulate in reverse chronological order (newest first).

---

## Company File Format

```markdown
# {CompanyName} - Consulting History

**Industry:** Gaming / Tech / etc.
**Contact:** Name, role (if applicable)
**Relationship:** Active / Completed / One-time
**Total sessions:** N

---

## Sessions

### 2026-02-14 | Topic Title

**Duration:** 2h
**Format:** On-site / Remote / Async
**Area:** UE optimization / Pipeline / Shader / etc.

**Context:**
Why this consulting happened. What they needed.

**What I did:**
- Specific technical work performed
- Tools/techniques applied

**Outcome:**
Concrete results, metrics, deliverables.

**Follow-up:**
- [ ] Next steps if any

---

### 2026-01-20 | Previous Session Topic

...
```

---

## Workflow

### Action: Log new session

1. **Ask for session details** (if not provided inline):
   - Date (default: today)
   - Topic
   - Duration
   - Format (on-site / remote / async)
   - Area (UE, pipeline, shader, optimization, etc.)
   - Context, work done, outcome

2. **Check if company file exists:**
   - Exists → Read file, add new session at top of Sessions section, increment total count
   - New → Create file with company profile header + first session

3. **Write session** in the format above

4. **Confirm** with session summary

### Action: `list`

1. Glob `~/.claude/private/consulting/*.md`
2. For each file, read total sessions count
3. Display table:

```
| Company    | Sessions | Last session | Relationship |
|------------|----------|--------------|--------------|
| Nexon      | 3        | 2026-02-14   | Active       |
| Krafton    | 1        | 2026-01-20   | One-time     |
```

### Action: `summary`

1. Read all company files
2. Show:
   - Total companies consulted
   - Total sessions logged
   - Areas covered (aggregated)
   - Timeline (first → last session)

---

## Notes

- Company filenames: lowercase, hyphens for spaces (e.g., `smile-gate.md`)
- All data stored in `~/.claude/private/consulting/` (gitignored, never committed)
- Sessions are append-only — never delete past records
- For portfolio use, run `/consulting-log-session summary` to get exportable data
