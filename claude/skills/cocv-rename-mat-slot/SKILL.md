---
description: "Rename invalid material slot names on character SkeletalMesh assets. Fixes slots like Body_MTL1 -> Body_MTL based on validation results."
---

# cocv-rename-mat-slot

Rename material slot names on character SkeletalMesh assets based on validation results.

## Purpose

Automated fix for invalid material slot names discovered by `cocv-validate-character-mat-slot-names`. Reads validation JSON, finds meshes with mismatched slot names (e.g., `Body_MTL1`, `Body_MTL2`), and renames them to the expected names (e.g., `Body_MTL`).

Works with any character mesh type: Head, Hair, Body.

## Usage

### One-Step (recommended)

First run validation, then rename:

```
/cocv-validate-character-mat-slot-names
/cocv-rename-mat-slot
```

### Manual

Remote execution from terminal:
```bash
python "D:\vs\caol-ila\claude\skills\cocv-rename-mat-slot\run_in_editor.py" "D:\vs\caol-ila\claude\skills\cocv-rename-mat-slot\rename_mat_slots.py"
```

## Matching Algorithm

For each missing slot (e.g., `Body_MTL`):
1. Search existing slots for pattern: `{missing_slot}` + single digit (1-9)
2. Candidates: `Body_MTL1`, `Body_MTL2`, etc.
3. Pick shortest name (closest match)
4. If no match found, skip with warning

## JSON Schema

```json
{
  "source": "DT_LookDevHead",
  "source_file": "DT_LookDevHead.json",
  "executed_at": "ISO 8601",
  "total_meshes": 5,
  "renamed": 4,
  "failed": 1,
  "results": [
    {
      "mesh_path": "/Game/.../Rosee_head",
      "renames": [
        { "from": "Body_MTL1", "to": "Body_MTL" }
      ],
      "skipped": [],
      "saved": true,
      "error": null
    }
  ]
}
```

## Files

- `rename_mat_slots.py` - UE Editor script that renames material slots
- `run_in_editor.py` - Remote execution bridge (verbatim copy)
- `SKILL.md` - This documentation

## Related Files

- Validation skill: `~/.claude/skills/cocv-validate-character-mat-slot-names/`
- Command: `~/.claude/commands/cocv-rename-mat-slot.md`
- Output: `~/.claude/private/unreal/mat-slot-rename/`
