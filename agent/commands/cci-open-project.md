---
description: Build and open CINEV UE project in Unreal Editor
allowed-tools: Bash(start:*), Bash(*UnrealBuildTool*), Bash(*dotnet*), Bash(test:*), Read
---

# Open CINEV Project

Build CINEVStudio, then launch in Unreal Editor.

## Execution

1. Read `~/.claude/private/agent-hub-config/repo-paths.json`:
   - `cinev-engine` → `.path` → UE engine root
   - `cinev-studio` → `.path` → project root
2. Build paths:
   - Editor: `<cinev-engine>/Engine/Binaries/Win64/UnrealEditor.exe`
   - Project: `<cinev-studio>/CINEVStudio/CINEVStudio.uproject`
   - BuildTool: `<cinev-engine>/Engine/Binaries/DotNET/UnrealBuildTool/UnrealBuildTool.exe`
3. Verify files exist
4. Build (blocking):

```bash
"<cinev-engine>/Engine/Binaries/DotNET/UnrealBuildTool/UnrealBuildTool.exe" CINEVStudioEditor Win64 Development -Project="<uproject>" -WaitMutex -FromMsBuild
```

If build fails, report the error and stop. Do NOT launch the editor.

5. Launch (non-blocking):

```bash
start "" "<editor_exe>" "<uproject>"
```

Report that the editor is launching. Do not wait for it to finish.
