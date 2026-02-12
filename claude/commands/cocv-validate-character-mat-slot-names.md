---
description: "Validate character SkeletalMesh material slot names from DataTable"
argument-hint: "[datatable_name]"
allowed-tools: Read, Glob, Task, Grep, Bash(python:*), Bash(curl:*)
---

# Validate Character Material Slot Names

Validate material slot names on character SkeletalMesh assets referenced in a DataTable.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `cocv-validate-character-mat-slot-names`

## Arguments

Input: $ARGUMENTS

## Data Directory

Output directory: `~/.claude/private/unreal/character-mat-slot-validate/`

## Behavior

### If no argument provided (default):

Run the full pipeline: export from UE Editor → validate → show results.

**Step 1: Export**

UE Editor의 Content Browser에서 DataTable이 선택된 상태에서 원격 실행:

```
python "D:\vs\caol-ila\claude\skills\cocv-validate-character-mat-slot-names\run_in_editor.py" "D:\vs\caol-ila\claude\skills\cocv-validate-character-mat-slot-names\export_character_mat_slot_data.py"
```

If export fails (no UE Editor found, no selection, etc.), show the error and stop.

**Step 2: Analyze**

Export가 성공하면 새로 생성된 JSON을 찾아서 바로 분석 결과를 출력한다.

Find the newly created JSON(s) in `~/.claude/private/unreal/character-mat-slot-validate/` and proceed to analysis output.

### If DataTable name argument provided:

Read: `~/.claude/private/unreal/character-mat-slot-validate/{argument}.json`

If file not found, show error and list available exports:

!`dir /b "%USERPROFILE%\.claude\private\unreal\character-mat-slot-validate\*.json" 2>nul`

## Analysis Output

Parse the JSON and produce a structured validation report:

### 1. Overview
- DataTable name and path
- Export timestamp
- Total row count
- Mesh column used

### 2. Validation Summary
- Required slots being checked
- Pass/fail counts (e.g., "8/10 valid")
- Overall status indicator

### 3. Failed Rows (if any)
For each failed row:
- Row name
- Mesh path
- Material slots present
- **Missing slots** (highlighted)
- Error message (if mesh couldn't be loaded)

### 4. All Rows - Material Slot Details
Table showing every row with:
- Row name
- Mesh path (shortened)
- All material slot names
- Valid/Invalid status
