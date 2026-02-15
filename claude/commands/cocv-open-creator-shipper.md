---
description: Open CINEV Creator Shipper GUI
allowed-tools: Bash(python:*)
---

# Open CINEV Creator Shipper

Launch the CINEV Creator Shipping Manager GUI for packaging and deploying builds.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `cocv-open-creator-shipper`

## Execution

1. Read `~/.claude/private/repo-paths.json` → key `anju` → `.path`
2. Run:

```bash
python "<anju-path>\python\shipping_manager\shipper\shipping_gui.py"
```
