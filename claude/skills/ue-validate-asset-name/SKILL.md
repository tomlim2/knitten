# ue-validate-asset-name

**Version:** 0.1.0

Validate and fix Unreal Engine asset names against naming conventions.

## Changelog

- **0.1.0** - Initial release

## Purpose

Two-step workflow for enforcing UE asset naming conventions:

1. **Validate** (inside UE Editor) - Python script checks selected assets and exports results to JSON
2. **Review & Rename** (in Claude Code) - Command reads JSON, shows issues interactively, triggers rename on approval

Supports all asset types selectable in the Content Browser.

## Validation Rules

| # | Rule | Severity | Description |
|---|------|----------|-------------|
| 1 | `ASCII_ONLY` | ERROR | No non-ASCII characters (Korean, CJK, etc.) |
| 2 | `ALLOWED_CHARS` | ERROR | Only `[A-Za-z0-9_]` allowed |
| 3 | `NO_DOUBLE_UNDERSCORE` | WARN | No consecutive `__` |
| 4 | `NO_TRAILING_UNDERSCORE` | WARN | Name must not end with `_` |
| 5 | `PREFIX` | ERROR | Correct type prefix (`SM_`, `T_`, `M_`, etc.) |
| 6 | `PASCAL_CASE` | WARN | Each segment starts uppercase |
| 7 | `ZERO_PADDED_NUMBER` | WARN | Variant numbers use 2-digit padding (`_01`) |
| 8 | `TEXTURE_SUFFIX` | WARN | Textures should have channel suffix (`_D`, `_N`, etc.) |
| 9 | `SOUND_CUE_SUFFIX` | WARN | SoundCue should end with `_Cue` |

## Usage

### One-Step (recommended)

Select assets in the Content Browser, then from Claude Code:

```
/unreal-validate-asset-name --export
```

This remotely validates and immediately shows results with fix suggestions.

### Manual Two-Step

#### Step 1: Validate from UE Editor

Option A - Remote execution:
```bash
python "D:\vs\caol-ila\claude\skills\ue-validate-asset-name\run_in_editor.py" "D:\vs\caol-ila\claude\skills\ue-validate-asset-name\validate_name.py"
```

Option B - Paste in UE Python console:
```python
exec(open(r"D:\vs\caol-ila\claude\skills\ue-validate-asset-name\validate_name.py").read())
```

JSON is saved to `~/.claude/private/unreal/name-validate/batch_YYYYMMDD_HHMMSS.json`.

#### Step 2: Review in Claude Code

```
/unreal-validate-asset-name                # List available validation results
/unreal-validate-asset-name batch_xxx      # Review a specific batch
```

### Renaming

After reviewing validation results, apply renames:

```
/unreal-validate-asset-name --rename
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

## CJK Translation Rules

When suggesting names for assets with CJK (Chinese/Japanese/Korean) characters:

- **Do NOT guess context.** Just translate the CJK characters literally into English.
- Do NOT prepend character/model names unless they are already in the original asset name.
- Example: `M_下擺` → `MI_Hem` (NOT `MI_AliceSwimsuit_Hem`)
- Example: `M_体_outline` → `MI_Body_Outline` (NOT `MI_SomeCharacter_Body_Outline`)

## Known Limitations

- `EditorAssetLibrary.rename_asset()` and `EditorAssetSubsystem.rename_loaded_asset()` both return `False` for CJK-named source paths.
- **NEVER** use `duplicate_asset()` + `delete_asset()` as a rename fallback. It breaks ALL references.
- **Safe CJK rename**: `duplicate_loaded_asset()` + `consolidate_assets()`. Consolidation redirects all references from old → new asset.
- **When UE Python API calls fail, look up the Unreal Engine Python API documentation.** UE version: **5.7**. Reference examples in `D:\vs\anju\python\`.

## Related Files

- Validate script: `~/.claude/skills/ue-validate-asset-name/validate_name.py`
- Rename script: `~/.claude/skills/ue-validate-asset-name/rename_assets.py`
- Remote sender: `~/.claude/skills/ue-validate-asset-name/run_in_editor.py`
- Command: `~/.claude/commands/unreal-validate-asset-name.md`
- Output: `~/.claude/private/unreal/name-validate/`
