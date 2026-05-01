---
description: "Log lessons, generate invoices, and track payments for tutoring. Use when recording tutoring sessions."
---

# tutoring-log-lesson

Lesson logging, invoice generation, and payment tracking for tutoring.

## Overview

Track tutoring lessons with billing status:
- Log lessons with date, time, location, and topic
- Generate invoices from pending lessons
- Mark lessons as paid after payment received

## File Structure

```
!`bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh doc tutoring`/lessons/<student>/
├── 2026-02-02_BlenderRigging.md        # Pending
├── 2026-02-09_WalkAnimation.md         # Pending
└── 2026-01-15_ModelingBasics_done.md   # Paid
```

## Commands

### `/tutoring-log-lesson <student>`

Log a new lesson.

```bash
python log.py "StudentName" --start 14:00 --end 16:00 --location "Starbucks" --topic "Blender Rigging"
```

**Options:**
- `--date, -d` - Date (YYYY-MM-DD), default: today
- `--start, -s` - Start time (HH:MM) [required]
- `--end, -e` - End time (HH:MM) [required]
- `--location, -l` - Location [required]
- `--topic, -t` - Lesson topic [required]
- `--content, -c` - Lesson content notes
- `--next, -n` - Next steps / homework

### Generate invoice

Show pending lessons and generate invoice.

```bash
python invoice.py "StudentName" --rate 150000 --open
```

**Options:**
- `--rate, -r` - Hourly rate (default: 150000)
- `--open, -o` - Open invoice generator web app at http://localhost:972/invoice (auto-fills student/rate/lessons + auto-submits)

### `/tutoring-open-invoice`

Open the invoice generator web app with empty form (manual entry).

### `/tutoring-paid <student>`

Mark all pending lessons as paid.

```bash
python paid.py "StudentName"
python paid.py "StudentName" --dry-run  # Preview only
python paid.py "StudentName" --list     # List pending only
```

**Options:**
- `--dry-run, -n` - Show what would be renamed
- `--list, -l` - List pending lessons only

## Lesson File Format

```markdown
# StudentName - Lesson Log

## 2026-02-02 (Sun) 14:00-16:00 | Starbucks Gangnam

**Topic**: Blender Rigging

### Content
- Armature setup
- Weight painting basics

### Next Steps
- [ ] Complete arm rigging
- [ ] Try walk animation
```

## Files

- `log.py` - Lesson logging script
- `invoice.py` - Invoice generation script (pulls pending lessons → opens web UI auto-filled)
- `paid.py` - Payment marking script (renames lesson files with `_done` suffix)
- `utils.py` - Shared utilities
- `web/` - Invoice generator web UI (served at `/invoice` by skill server)
- `presets.json.example` - Template for student/teacher info (copy to vault `claude/tutoring/presets.json`)

## Workflow

1. Log lesson → `log.py`
2. Generate invoice → `invoice.py --open` (browser opens with auto-filled lessons)
3. PDF saved → moved to vault `claude/tutoring/invoices/`
4. After payment received → `paid.py` (renames lesson files with `_done` suffix to drop from pending)

## Operator mode

Claude drives data entry, not the user. Default path:

1. Claude reads pending lessons from vault (excludes `_invoiced` and `_done`)
2. **Print summary in chat first** — list each lesson (date, hours, topic) + total. Wait for user OK before opening browser. Skip if user explicitly said "그냥 열어줘" or similar.
3. After OK: `invoice.py <student> --open` — browser auto-fills + auto-submits, lands on preview
4. User saves PDF → server marks matching lesson files `_invoiced` automatically
5. After payment received → `paid.py <student>` (renames `_invoiced` → `_done`)

The empty-form entry (`/tutoring-open-invoice`) is a fallback, not the primary path.

## Lesson states

| Suffix | Meaning | Picked up by |
|--------|---------|--------------|
| (none) | Pending — not yet billed | `invoice.py` |
| `_invoiced` | Billed, awaiting payment | `paid.py` |
| `_done` | Paid | (terminal) |
