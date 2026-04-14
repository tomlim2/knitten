---
description: Download VRM file from CINEV storage by character ID
argument-hint: "<characterId> [characterId2 ...]"
allowed-tools: Bash(python:*)
---

# cci-download-vrm-z

Download a character VRM file from CINEV cloud storage.
## Arguments

- `<characterId>` - Character ID(s), 공백으로 구분하여 여러 개 가능

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: `/cci-download-vrm-z <characterId> [characterId2 ...]`

## Execution

### Step 1: Download VRM

```bash
python ~/.claude/skills/cci-download-vrm-z/download.py $ARGUMENTS
```

### Step 2: Report result

Show the download result (file path and size).

## Example

```
/cci-download-vrm-z anju_v3
/cci-download-vrm-z anju_v3 bleue_v1 rouge_v2
/cci-download-vrm-z anju_v3 bleue_v1 -o ./vrm_output
```
