---
description: Open CINEV UE project in Unreal Editor
allowed-tools: Bash(start:*), Read
---

# Open CINEV Project

Launch CINEVStudio in Unreal Editor.

## Execution

1. Read `~/.claude/private/repo-paths.json`:
   - `cinev-engine` → `.path` → UE engine root
   - `cinev-studio` → `.path` → project root
2. Build paths:
   - Editor: `<cinev-engine>/Engine/Binaries/Win64/UnrealEditor.exe`
   - Project: `<cinev-studio>/CINEVStudio/CINEVStudio.uproject`
3. Verify both files exist
4. Launch (non-blocking):

```bash
start "" "<editor_exe>" "<uproject>"
```

Report that the editor is launching. Do not wait for it to finish.
