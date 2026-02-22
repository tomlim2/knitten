---
description: Generate invoice from pending lessons
argument-hint: "<student> [--rate 150000] [--open]"
allowed-tools: Bash(python:*)
---

# tutoring-make-invoice

Show pending lessons and generate invoice summary.
## Usage

```
/tutoring-invoice <student>
/tutoring-invoice <student> --open
```

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

## Execute

Run the invoice script:

```bash
cd ~/.claude/skills/tutoring-log-lesson && python invoice.py $ARGUMENTS
```

## Options

- `--rate, -r` - Hourly rate (default: 150000)
- `--open, -o` - Open invoice generator web app

## Example

```
/tutoring-invoice John --rate 150000 --open
```
