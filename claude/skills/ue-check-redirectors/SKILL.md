---
description: "Scan /Game/ for ObjectRedirectors and identify broken redirectors. Use when checking for stale redirectors after asset moves/renames."
---

# ue-check-redirectors

Scan UE project Content folder for ObjectRedirector assets that remain after asset moves or renames.

## Purpose

When assets are moved or renamed in UE Editor, ObjectRedirectors are created to maintain references. These should eventually be fixed up (via "Fix Up Redirectors" in editor) or they can cause:

- Build and cooking issues
- Unnecessary reference chains
- Stale paths in source control

This skill scans `/Game/` for all redirectors, checks whether their destinations exist (broken redirector detection), groups results by folder, and saves a JSON report.

---

## Usage

### One-Step (recommended)

From Claude Code:

```
/ue-check-redirectors
```

This remotely executes the scan in UE Editor and immediately analyzes the result.

### Manual Two-Step

#### Step 1: Scan from UE Editor

Option A - Remote execution from terminal:
```bash
python "D:\vs\caol-ila\claude\skills\ue-check-redirectors\run_in_editor.py" "D:\vs\caol-ila\claude\skills\ue-check-redirectors\check_redirectors.py"
```

Option B - Paste in UE Python console:
```python
exec(open(r"D:\vs\caol-ila\claude\skills\ue-check-redirectors\check_redirectors.py").read())
```

JSON is saved to `~/.claude/private/unreal/check-redirectors/redirectors.json`.

#### Step 2: Analyze in Claude Code

```
/ue-check-redirectors redirectors    # Analyze existing result
```

---

## JSON Schema

```json
{
  "scanned_path": "/Game/",
  "scanned_at": "ISO 8601",
  "total_redirectors": 12,
  "broken_redirectors": 1,
  "by_folder": {
    "/Game/Character/": 5,
    "/Game/Environment/": 7
  },
  "redirectors": [
    {
      "path": "/Game/Character/OldName",
      "destination": "/Game/Character/NewName",
      "broken": false
    }
  ]
}
```

---

## Files

- `check_redirectors.py` - UE Editor script that scans for ObjectRedirectors and validates destinations
- `run_in_editor.py` - Remote execution bridge (verbatim copy)
- `SKILL.md` - This documentation

---

## Related Files

- Command: `~/.claude/commands/ue-check-redirectors.md`
- Output: `~/.claude/private/unreal/check-redirectors/`
