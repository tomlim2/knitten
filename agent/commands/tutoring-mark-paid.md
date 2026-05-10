---
description: Mark pending lessons as paid
argument-hint: "<student> [--dry-run] [--list]"
disable-model-invocation: true
allowed-tools: Bash(python:*)
---

# tutoring-mark-paid

Mark all pending lessons as paid by renaming files with `_done` suffix.
## Usage

```
/tutoring-paid <student>
/tutoring-paid <student> --list
/tutoring-paid <student> --dry-run
```

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

## Execute

Run the paid script:

```bash
cd ~/.claude/skills/tutoring-log-lesson && python paid.py $ARGUMENTS
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
