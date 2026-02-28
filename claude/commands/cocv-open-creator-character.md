---
description: Open CINEV Character Creator GUI (optionally with VRM files to register)
argument-hint: "[vrm_path1] [vrm_path2] ..."
allowed-tools: Bash(python:*), Read, Glob
---

# Open CINEV Character Creator

Launch the CINEV Character Creator GUI for creating user characters via UE commandlet.

## Arguments

```
$ARGUMENTS
```

- Positional arguments: VRM file paths to pre-load into the registration list
- If no arguments: opens the GUI with an empty list (user picks files manually)

## Execution

1. Read `~/.claude/private/repo-paths.json` → key `anju` → `.path`
2. If VRM paths provided, verify each file exists before passing
3. Run:

```bash
python "<anju-path>\python\user_character_manager\character_creator_gui.py" [vrm_paths...]
```

The GUI will open with the VRM files already loaded in the registration list.
The user then clicks "일괄 등록" to start the UE commandlet pipeline.
