---
description: "Rename invalid material slot names on character SkeletalMesh assets"
argument-hint: "[datatable_name]"
allowed-tools: Read, Glob, Task, Grep, Bash(python:*), Bash(curl:*)
---

# Rename Character Material Slot Names

Rename invalid material slot names (e.g., `Body_MTL1` → `Body_MTL`) on character SkeletalMesh assets.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `cocv-rename-mat-slot`

## Arguments

Input: $ARGUMENTS

## Data Directory

Output directory: `~/.claude/private/unreal/mat-slot-rename/`

## Behavior

### If no argument provided (default):

Run the full pipeline: rename in UE Editor → show results.

**Step 1: Rename**

UE Editor에서 원격 실행 (사전에 `/cocv-validate-character-mat-slot-names`로 검증 JSON이 생성되어 있어야 함):

```
python "D:\vs\caol-ila\claude\skills\cocv-rename-mat-slot\run_in_editor.py" "D:\vs\caol-ila\claude\skills\cocv-rename-mat-slot\rename_mat_slots.py"
```

If execution fails (no UE Editor found, no validation JSON, etc.), show the error and stop.

**Step 2: Analyze**

실행이 성공하면 새로 생성된 JSON을 찾아서 바로 분석 결과를 출력한다.

Find the newly created JSON(s) in `~/.claude/private/unreal/mat-slot-rename/` and proceed to analysis output.

### If DataTable name argument provided:

Read: `~/.claude/private/unreal/mat-slot-rename/{argument}.json`

If file not found, show error and list available results:

!`dir /b "%USERPROFILE%\.claude\private\unreal\mat-slot-rename\*.json" 2>nul`

## Analysis Output

Parse the JSON and produce a structured rename report:

### 1. Overview
- Source validation file
- Execution timestamp
- Total meshes processed

### 2. Rename Summary
- Renamed count / Failed count
- Overall status indicator

### 3. Rename Details
For each successfully renamed mesh:
- Mesh path
- Each rename: `from` → `to`
- Saved status

### 4. Failed (if any)
For each failed rename:
- Mesh path
- Error message
- Skipped slots with reason
