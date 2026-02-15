---
description: Open CINEV Character Creator GUI
allowed-tools: Bash(python:*), Read, Edit
---

# Open CINEV Character Creator

Launch the CINEV Character Creator GUI for creating user characters via UE commandlet.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `cocv-open-creator-character`

## Execution

1. Read `~/.claude/private/repo-paths.json` → key `anju` → `.path`
2. Run:

```bash
python "<anju-path>\python\user_character_manager\character_creator_gui.py"
```
