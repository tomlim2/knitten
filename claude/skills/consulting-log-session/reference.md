# consulting-log-session Reference

Company file format template, full workflow details for all 3 actions, and notes.

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

1. Glob `{obsidian_vault}/claude/consulting/*.md`
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
- All data stored in Obsidian vault (`{obsidian_vault}/claude/consulting/`)
- Sessions are append-only — never delete past records
- For portfolio use, run `/consulting-log-session summary` to get exportable data
