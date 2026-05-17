---
description: "Convert PMX to VRM, register in UE, and open project — full pipeline"
argument-hint: "<pmx_path> --name <name> [--preset PRESET] [--no-spring] [--no-rename] [--scale N] [--gender Male|Female] [--no-build] [--no-open]"
allowed-tools:
  - Read
  - Glob
  - Bash(python:*)
  - Bash(cd:*)
  - Bash(start:*)
---

# cci-deploy-pmx-character

Full pipeline: PMX → VRM conversion → UE character registration → open CINEV project.

## Arguments

```
$ARGUMENTS
```

Parse the arguments:
- First non-flag argument: input path (PMX file, ZIP, or directory)
- `--name <name>`: output VRM filename (**required** — used as character name)
- `--preset <name>`: spring bone preset (default: `default`)
- `--no-spring`: skip spring bone conversion
- `--no-rename`: skip ASCII rename step
- `--no-validate`: skip VRM validation step
- `--scale <number>`: scale factor (default: 0.08)
- `--gender Male|Female`: character gender (default: Female)
- `--no-build`: skip UE build step
- `--no-open`: skip opening the project after registration

If no arguments or no `--name` provided, show usage and stop.

## Paths

Read `~/.claude/private/agent-hub-config/repo-paths.json` to resolve:
- `anju` → converter root (`<path>/module/pmx2vrm`) and register script (`<path>/python/user_character_manager/register_vrm.py`)
- `cinev-engine` → UE engine root
- `cinev-studio` → UE project root

## Execution

### Step 1: Convert PMX → VRM

```bash
cd "<anju>/module/pmx2vrm" && python -m python.intake "<input>" --name <name> [--preset <preset>] [other flags]
```

Capture the output VRM path from the `-> <path>` line.

### Step 2: Register VRM in UE

```bash
cd "<anju>/python/user_character_manager" && python register_vrm.py "<vrm_path>" [--gender <gender>] [--no-build]
```

### Step 3: Open project (unless `--no-open`)

```bash
start "" "<cinev-engine>/Engine/Binaries/Win64/UnrealEditor.exe" "<cinev-studio>/CINEVStudio/CINEVStudio.uproject"
```

## Output

Report each step's result:
1. Converted: `<name>.vrm` at `<path>`
2. Registered: `<name>.character` in UserCharacter/
3. Editor launching (or skipped if `--no-open`)

If any step fails, stop and report the error.
