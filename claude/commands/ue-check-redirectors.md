---
description: "Scan /Game/ for ObjectRedirectors and report broken references"
argument-hint: "[filename]"
allowed-tools: Read, Glob, Task, Grep, Bash(python:*), Bash(curl:*)
---

# Check UE ObjectRedirectors

Scan the UE project for stale ObjectRedirectors that remain after asset moves/renames.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `ue-check-redirectors`

## Arguments

Input: $ARGUMENTS

## Data Directory

Output directory: `~/.claude/private/unreal/check-redirectors/`

## Behavior

### If no argument provided (default):

Run the full pipeline: scan in UE Editor -> analyze -> show results.

**Step 1: Scan**

Execute the redirector check script remotely in UE Editor:

```
python "D:\vs\caol-ila\claude\skills\ue-check-redirectors\run_in_editor.py" "D:\vs\caol-ila\claude\skills\ue-check-redirectors\check_redirectors.py"
```

If scan fails (no UE Editor found, etc.), show the error and stop.

**Step 2: Analyze**

After scan succeeds, read the result JSON and proceed to analysis output:

Read: `~/.claude/private/unreal/check-redirectors/redirectors.json`

### If filename argument provided:

Read: `~/.claude/private/unreal/check-redirectors/{argument}.json`

If file not found, show error and list available files:

!`dir /b "%USERPROFILE%\.claude\private\unreal\check-redirectors\*.json" 2>nul`

## Analysis Output

Parse the JSON and produce a structured report:

### 1. Overview

```
## Redirector Check — YYYY-MM-DD HH:MM

Scanned path: /Game/
```

### 2. Summary

```
| Status | Count |
|--------|-------|
| Total redirectors | N |
| Broken redirectors | N |
| Valid redirectors | N |
```

If total is 0, show:
```
No redirectors found. Project is clean!
```
**Stop here.**

### 3. Folder Breakdown

Show `by_folder` as a table sorted by count descending:

```
| Folder | Count |
|--------|-------|
| /Game/Character/ | 5 |
| /Game/Environment/ | 7 |
```

### 4. Broken Redirectors

If `broken_redirectors > 0`, list each broken redirector with details:

```
### Broken Redirectors

| Source Path | Destination | Status |
|-------------|-------------|--------|
| /Game/Old/Path | /Game/New/Path | BROKEN - destination missing |
| /Game/Other/Path | (none) | BROKEN - no destination |
```

These should be investigated and either fixed or deleted.

### 5. Full List

Show all redirectors in a table:

```
| # | Source Path | Destination | Status |
|---|-------------|-------------|--------|
| 1 | /Game/Char/OldName | /Game/Char/NewName | OK |
| 2 | /Game/Env/Removed | (none) | BROKEN |
```

## Notes

To fix redirectors in UE Editor: right-click affected folders in Content Browser -> "Fix Up Redirectors in Folder".
