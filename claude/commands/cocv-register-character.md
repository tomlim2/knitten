---
description: Register VRM files as user characters via Character Creator GUI
argument-hint: "<vrm_path> [vrm_path2] ..."
allowed-tools: Bash(python:*), Read, Glob
---

# Register VRM as User Character

Open the CINEV Character Creator GUI with VRM files pre-loaded in the registration list.

## Arguments

```
$ARGUMENTS
```

- Positional arguments: one or more VRM file paths to register
- If no arguments provided, show usage and stop

## Execution

1. Read `~/.claude/private/repo-paths.json` → key `anju` → `.path`
2. Verify each VRM file exists; report missing files
3. Run:

```bash
python "<anju-path>\python\user_character_manager\character_creator_gui.py" "<vrm1>" "<vrm2>" ...
```

The GUI opens with VRM files already in the registration list.
The user clicks "일괄 등록" to run the UE commandlet pipeline.

## Usage

```
/cocv-register-character E:\models\PMXs\VRM\saber_p2v.vrm
/cocv-register-character model1.vrm model2.vrm model3.vrm
```
