---
description: "Validate and fix UE asset names against naming conventions. Use when checking Unreal Engine asset naming."
domains: unreal
repo-keys: anju,mega-melange
languages: python
task-types: implementation
context-profile: unreal-engine
exclude-when: rust,web,obsidian
---

# ue-validate-asset-name

Validate and fix Unreal Engine asset names against naming conventions.

## Standards Reference

**Asset Naming Conventions:** `~/.claude/standards/unreal/unreal-engine-asset.md`

This skill enforces all 9 naming rules defined in the asset naming standard. See the standard for complete details on:
- Validation rules (ASCII_ONLY, PREFIX, PASCAL_CASE, and similar conventions)
- Prefix table for all asset types (SM_, T_, M_, BP_, and similar)
- Texture suffix conventions (_D, _N, _ORM, and similar)
- CJK asset handling and translation rules

## Purpose

Two-step workflow for enforcing UE asset naming conventions:

1. **Validate** (inside UE Editor) - Python script checks selected assets and exports results to JSON
2. **Review & Rename** (in Claude Code) - Command reads JSON, shows issues interactively, triggers rename on approval

Supports all asset types selectable in the Content Browser.

## Usage

### One-Step (recommended)

Select assets in the Content Browser, then from Claude Code:

```
/ue-validate-asset-name --export
```

This remotely validates and immediately shows results with fix suggestions.

### Manual Two-Step

#### Step 1: Validate from UE Editor

Option A - Remote execution:
```bash
python "${CLAUDE_SKILL_DIR}/run_in_editor.py" "${CLAUDE_SKILL_DIR}/validate_name.py"
```

Option B - Paste in UE Python console:
```python
exec(open(r"${CLAUDE_SKILL_DIR}/validate_name.py").read())
```

JSON is saved to `~/.claude/private/unreal/name-validate/batch_YYYYMMDD_HHMMSS.json`.

#### Step 2: Review in Claude Code

```
/ue-validate-asset-name                # List available validation results
/ue-validate-asset-name batch_xxx      # Review a specific batch
```

### Renaming

After reviewing validation results, apply renames:

```
/ue-validate-asset-name --rename
```

This remotely executes `rename_assets.py` which reads the latest batch and applies `suggested_name` for each asset.

## Remote Execution

Uses shared `run_in_editor.py` (same as ue-analyze-material).

## JSON Schema

```json
{
  "validated_at": "ISO 8601",
  "summary": {
    "total": 5,
    "error": 1,
    "warn": 2,
    "pass": 2
  },
  "assets": [
    {
      "name": "rock_diffuse",
      "path": "/Game/Textures/rock_diffuse",
      "class": "Texture2D",
      "exported_at": "ISO 8601",
      "issues": [
        {
          "rule": "PREFIX",
          "severity": "ERROR",
          "detail": "Expected prefix 'T_' for Texture2D, missing prefix"
        },
        {
          "rule": "PASCAL_CASE",
          "severity": "WARN",
          "detail": "Segment 'rock' should start with uppercase"
        }
      ],
      "suggested_name": "T_RockDiffuse",
      "status": "ERROR"
    }
  ]
}
```

## Technical Notes

### CJK Assets
See `unreal-engine-asset.md` for CJK translation rules and API limitations.

**Key limitation:** `rename_asset()` fails on CJK paths. Safe workaround: `duplicate_loaded_asset()` + `consolidate_assets()`.

### UE Python API
**Version:** 5.7
**Reference examples:** `<repo:anju>/python/`

## Related Files

- Validate script: `~/.claude/skills/ue-validate-asset-name/validate_name.py`
- Rename script: `~/.claude/skills/ue-validate-asset-name/rename_assets.py`
- Remote sender: `~/.claude/skills/ue-validate-asset-name/run_in_editor.py`
- Command: `~/.claude/commands/ue-validate-asset-name.md`
- Output: `~/.claude/private/unreal/name-validate/`
