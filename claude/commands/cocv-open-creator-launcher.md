---
description: Open CINEV Creator Launcher
allowed-tools: Bash(python:*)
---

# Open CINEV Creator Launcher

Launch the CINEV Creator Launcher GUI for downloading and running the latest build.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `cocv-open-creator-launcher`

## Execution

1. Read `~/.claude/private/repo-paths.json` → key `anju` → `.path`
2. Run:

```bash
python "<anju-path>\python\shipping_manager\creator_only\creator_launcher.py"
```
