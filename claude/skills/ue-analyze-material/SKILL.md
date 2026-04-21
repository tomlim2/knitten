---
description: "Export and analyze UE material node graphs. Use when debugging or documenting Unreal Engine materials."
---

# ue-analyze-material

Export and analyze Unreal Engine material node graphs.

## Standards Reference

**Asset Naming Conventions:** `~/.claude/standards/unreal-engine-asset.md`

Materials should follow naming conventions:
- Base materials: `M_` prefix
- Material instances: `MI_` prefix
- Material functions: `MF_` prefix

## Purpose

Two-step workflow for inspecting UE material graphs outside the editor:

1. **Export** (inside UE Editor) - Python script extracts material data to JSON
2. **Analyze** (in Claude Code) - Command reads the JSON and provides structured analysis

Supports both base `Material` and `MaterialInstance` assets.

## Usage

### One-Step (recommended)

Select a material in the Content Browser, then from Claude Code:

```
/ue-analyze-material --export
```

This remotely executes the export script in UE Editor and immediately analyzes the result.

### Manual Two-Step

#### Step 1: Export from UE Editor

Option A - Remote execution from terminal:
```bash
python "${CLAUDE_SKILL_DIR}/run_in_editor.py" "${CLAUDE_SKILL_DIR}/export_material_data.py"
```

Option B - Paste in UE Python console:
```python
exec(open(r"${CLAUDE_SKILL_DIR}/export_material_data.py").read())
```

JSON is saved to `~/.claude/private/unreal/material-analyze/{name}.json`.

#### Step 2: Analyze in Claude Code

```
/ue-analyze-material M_VrmSimple       # Analyze specific material
/ue-analyze-material                    # List available exports
```

## Remote Execution

`run_in_editor.py` uses UE's built-in Python Remote Execution protocol (UDP discovery on port 6766, TCP commands on port 6776). Requires `bRemoteExecution=True` in project settings (already enabled for CINEVStudio).

```bash
python run_in_editor.py <script_path>      # Execute a script file
python run_in_editor.py --code "print(1)"  # Execute inline code
python run_in_editor.py --list-nodes       # List running UE instances
```

## JSON Schema

```json
{
  "name": "string",
  "path": "/Game/...",
  "type": "Material | MaterialInstance",
  "exported_at": "ISO 8601",
  "properties": {
    "shading_model": "string",
    "blend_mode": "string",
    "two_sided": "bool"
  },
  "expressions": [
    {
      "index": 0,
      "class": "MaterialExpressionTextureSample",
      "name": "string | null",
      "position": { "x": 0, "y": 0 }
    }
  ],
  "connections": [
    {
      "from_node": 0,
      "from_output": "RGB",
      "to_node": "Material",
      "to_input": "BaseColor"
    }
  ],
  "textures": ["asset paths"],
  "parameters": {
    "scalar": [{ "name": "string", "value": 0.0 }],
    "vector": [{ "name": "string", "value": [0,0,0,0] }],
    "texture": [{ "name": "string", "value": "asset path" }]
  },
  "parent_chain": ["asset paths (MI only)"]
}
```

## Related Files

- Export script: `~/.claude/skills/ue-analyze-material/export_material_data.py`
- Remote sender: `~/.claude/skills/ue-analyze-material/run_in_editor.py`
- Command: `~/.claude/commands/ue-analyze-material.md`
- Output: `~/.claude/private/unreal/material-analyze/`
