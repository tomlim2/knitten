---
description: Analyze exported UE material node graph
argument-hint: "[material_name | --export]"
allowed-tools: Read, Glob, Task, Grep, Bash(python:*)
---

# Analyze UE Material

Analyze a material exported by the `ue-analyze-material` skill.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `ue-analyze-material`

## Standards Reference

**Asset Naming Conventions:** `~/.claude/standards/unreal-engine-asset.md`

Materials should use correct prefixes: `M_` (Material), `MI_` (MaterialInstance), `MF_` (MaterialFunction).

## Arguments

Input: $ARGUMENTS

## Data Directory

Output directory: `~/.claude/private/unreal/material-analyze/`

## Behavior

### If `--export` argument (or user asks to export/run/select):

Export the currently selected material from UE Editor remotely, then analyze it:

```
python "D:\vs\caol-ila\claude\skills\ue-analyze-material\run_in_editor.py" "D:\vs\caol-ila\claude\skills\ue-analyze-material\export_material_data.py"
```

After export succeeds, find the newly created JSON(s) and proceed to analysis.

If export fails (no UE Editor found, no selection, etc.), show the error and stop.

### If no argument provided:

List available exported materials:

!`dir /b "%USERPROFILE%\.claude\private\unreal\material-analyze\*.json" 2>nul`

If no files found, show:
```
No exported materials found.

Options:
  /ue-analyze-material --export    Export selected material from UE Editor + analyze
  /ue-analyze-material M_Name      Analyze a previously exported material
```

**Stop here if no argument. Let the user pick from the list.**

### If material name argument provided:

Read: `~/.claude/private/unreal/material-analyze/{argument}.json`

If file not found, show error and list available exports.

## Analysis Output

Parse the JSON and produce a structured analysis:

### 1. Overview
- Material name, path, type (Material / MaterialInstance / MaterialFunction)
- Export timestamp

### 2. Properties
- Shading model, blend mode, two-sided status
- Any notable property values (e.g., non-default opacity mask clip)

### 3. Node Graph Summary (Material only)
- Total expression count
- Expression types grouped by category (textures, math, parameters, utility)
- List each expression with its class and parameter name (if any)

### 4. Connection Map (Material only)
- Which nodes connect to which material inputs
- Identify the signal flow: texture sources -> operations -> material outputs
- Flag any unconnected material inputs that are commonly used

### 5. Texture Usage
- List all referenced textures with their asset paths
- Note texture types if identifiable from naming (e.g., `_D` = diffuse, `_N` = normal)

### 6. Parameter Overrides (MaterialInstance only)
- Scalar parameters with values
- Vector parameters with values (interpret as color if RGBA)
- Texture parameter assignments
- Static switch states (if available)

### 7. Parent Chain (MaterialInstance only)
- Full parent hierarchy from instance to root material
- Depth of inheritance

### 8. Function Interface (MaterialFunction only)
- List all function inputs with names and types
- List all function outputs with names
- Sort priority ordering
- Description if available

### 9. Observations
- Potential issues (unused parameters, missing connections, deep inheritance)
- Complexity assessment (simple/moderate/complex based on node count)
- Suggestions if any patterns look unusual
