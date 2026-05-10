---
description: Generate monthly tuition invoice via CLI (web UI deprecated)
allowed-tools: Bash(python3:*)
---

# tutoring-open-invoice

Generate the monthly tuition invoice using the CLI generator.

> **Note:** The previous web UI (`localhost:972/invoice`) was hosted by `caol-serve-skills`, which has been removed. Web invoice rendering needs to be reimplemented in `caol-hq` (Astro, port 9720) before this command can launch a browser again. Until then, use the CLI mode below — it prints the invoice to stdout and supports the same student/rate/lessons arguments.

## Usage

```
/tutoring-open-invoice
```

Calls `~/.claude/skills/tutoring-log-lesson/invoice.py` with no `--open` flag (web mode disabled).

## Execution

```bash
python3 "$HOME/.claude/skills/tutoring-log-lesson/invoice.py"
```
