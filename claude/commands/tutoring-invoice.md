---
description: Generate invoice from pending lessons
argument-hint: "<student> [--rate 150000] [--open]"
allowed-tools: Bash(python:*)
---

# Tutoring Invoice

Show pending lessons and generate invoice summary.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `tutoring-invoice`

## Usage

```
/tutoring-invoice <student>
/tutoring-invoice <student> --open
```

## Execute

Run the invoice script:

```bash
cd ~/.claude/skills/tutoring && python invoice.py $ARGUMENTS
```

## Options

- `--rate, -r` - Hourly rate (default: 150000)
- `--open, -o` - Open invoice generator web app

## Example

```
/tutoring-invoice John --rate 150000 --open
```
