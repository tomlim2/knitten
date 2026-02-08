---
description: "Validate and fix UE asset names against naming conventions"
argument-hint: "[batch_name | --export | --rename]"
allowed-tools: "Read, Glob, Task, Grep, Bash(python:*), AskUserQuestion"
---

# Validate UE Asset Names

Validate selected assets' names and interactively fix naming convention violations.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `ue-validate-asset-name`

## Arguments

Input: $ARGUMENTS

## Data Directory

Output directory: `~/.claude/private/unreal/name-validate/`

## Behavior

### If `--export` argument:

Validate the currently selected assets in UE Editor remotely, then show results:

```
python "D:\vs\caol-ila\claude\skills\ue-validate-asset-name\run_in_editor.py" "D:\vs\caol-ila\claude\skills\ue-validate-asset-name\validate_name.py"
```

After validation succeeds, find the newly created batch JSON and proceed to analysis.

If validation fails (no UE Editor found, no selection, etc.), show the error and stop.

### If `--rename` argument:

Apply renames from the latest validation batch:

```
python "D:\vs\caol-ila\claude\skills\ue-validate-asset-name\run_in_editor.py" "D:\vs\caol-ila\claude\skills\ue-validate-asset-name\rename_assets.py"
```

**Before executing, show the user what will be renamed and ask for confirmation.**

### If no argument provided:

List available validation batches:

!`dir /b "%USERPROFILE%\.claude\private\unreal\name-validate\batch_*.json" 2>nul`

If no files found, show:
```
No validation results found.

Usage:
  /ue-validate-asset-name --export     Validate selected assets in UE Editor
  /ue-validate-asset-name batch_xxx    Review a specific validation batch
  /ue-validate-asset-name --rename     Apply renames from latest batch
```

**Stop here if no argument. Let the user pick from the list.**

### If batch name argument provided:

Read: `~/.claude/private/unreal/name-validate/{argument}.json`

If file not found, show error and list available batches.

## Analysis Output

Parse the batch JSON and produce a structured report:

### 1. Summary

```
## Validation Results — YYYY-MM-DD HH:MM

| Status | Count |
|--------|-------|
| PASS   | N     |
| WARN   | N     |
| ERROR  | N     |
| Total  | N     |
```

### 2. Issues (grouped by severity)

For each asset with issues, show:

```
### ERROR: rock_diffuse (Texture2D)
Path: /Game/Textures/rock_diffuse

| Rule | Detail |
|------|--------|
| PREFIX | Expected 'T_' for Texture2D, missing prefix |
| PASCAL_CASE | Segment 'rock' should start with uppercase |

Suggested: `T_RockDiffuse`
```

### 3. Clean Assets

List assets that passed all checks (brief, one line each).

### 4. Rename Plan

If any assets have `suggested_name`, show a rename plan table:

```
| Current Name | Suggested Name | Rules Violated |
|-------------|---------------|----------------|
| rock_diffuse | T_RockDiffuse | PREFIX, PASCAL_CASE |
```

Ask the user (via AskUserQuestion):
- **Apply all** — rename all suggested
- **Review each** — confirm per asset
- **Skip** — do not rename, keep report only

On "Apply all" or approved individual renames, execute `--rename`.

## Validation Rules Reference

| Rule | Severity | What it checks |
|------|----------|----------------|
| `ASCII_ONLY` | ERROR | No non-ASCII characters |
| `ALLOWED_CHARS` | ERROR | Only `[A-Za-z0-9_]` |
| `NO_DOUBLE_UNDERSCORE` | WARN | No `__` |
| `NO_TRAILING_UNDERSCORE` | WARN | No trailing `_` |
| `PREFIX` | ERROR | Correct type prefix |
| `PASCAL_CASE` | WARN | Segments start uppercase |
| `ZERO_PADDED_NUMBER` | WARN | 2-digit variant padding |
| `TEXTURE_SUFFIX` | WARN | Texture channel suffix |
| `SOUND_CUE_SUFFIX` | WARN | SoundCue `_Cue` suffix |
