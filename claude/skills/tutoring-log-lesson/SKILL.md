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
~/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyNotes/claude/tutoring/lessons/<student>/
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

### `/tutoring-make-invoice <student>`

Show pending lessons and generate invoice.

```bash
python invoice.py "StudentName" --rate 150000 --open
```

**Options:**
- `--rate, -r` - Hourly rate (default: 150000)
- `--open, -o` - Open invoice generator web app

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
- `invoice.py` - Invoice generation script
- `paid.py` - Payment marking script
- `utils.py` - Shared utilities

## Integration

Works with existing invoice-generator web app for PDF creation.
