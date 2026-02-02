---
allowed-tools: Bash(python:*)
description: Mark pending lessons as paid
argument-hint: "<student> [--dry-run] [--list]"
---

# Tutoring Paid

Mark all pending lessons as paid by renaming files with `_done` suffix.

## Usage

```
/tutoring-paid <student>
/tutoring-paid <student> --list
/tutoring-paid <student> --dry-run
```

## Execute

Run the paid script:

```bash
cd ~/.claude/skills/tutoring && python paid.py $ARGUMENTS
```

## Options

- `--dry-run, -n` - Show what would be renamed (no changes)
- `--list, -l` - List pending lessons only

## Example

```
/tutoring-paid John --list      # List pending lessons
/tutoring-paid John --dry-run   # Preview changes
/tutoring-paid John             # Mark as paid
```
