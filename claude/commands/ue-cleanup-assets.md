---
description: Find and delete unused UE assets (2-phase)
argument-hint: "[--scan | --delete <scan_file> | <scan_file>]"
allowed-tools: Read, Glob, Bash(python:*)
---

# Cleanup Unused Assets

Find unreferenced assets in UE Editor and safely delete them in a two-phase workflow.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `ue-cleanup-assets`

## Arguments

Input: $ARGUMENTS

- `--scan` - Scan selected assets in UE Editor for references
- `<scan_file>` - Review a specific scan result JSON
- `--delete <scan_file>` - Delete unused assets from a scan (requires user confirmation)
- No argument - List available scan files

## Data Directory

Scan results: `~/.claude/private/unreal/assets-cleanup/`

## Behavior

### If `--scan` argument:

Run Phase 1 — scan selected assets in UE Editor for references:

```bash
python ~/.claude/skills/ue-cleanup-assets/run_in_editor.py ~/.claude/skills/ue-cleanup-assets/find_unused_assets.py
```

After execution:
1. Find the newly created scan JSON in `~/.claude/private/unreal/assets-cleanup/`
2. Read the JSON and show a summary:
   - Total assets scanned
   - Unused assets (with paths and types)
   - Referenced assets (with referencer counts)
3. If unused assets found, suggest: `/ue-cleanup-assets --delete <scan_file>`

### If no argument:

List available scan files:

!`ls -la ~/.claude/private/unreal/assets-cleanup/scan_*.json 2>/dev/null`

If no files found:
```
No scan results found.

Usage:
  /ue-cleanup-assets --scan              Scan selected assets in UE Editor
  /ue-cleanup-assets <scan_filename>     Review a scan result
  /ue-cleanup-assets --delete <file>     Delete unused assets from scan
```

**Stop here. Let the user pick from the list.**

### If scan filename argument (without --delete):

Read the scan JSON from `~/.claude/private/unreal/assets-cleanup/{argument}`.

Show detailed analysis:
- Scan timestamp
- Unused assets with full paths and types
- Referenced assets with referencer counts
- Recommend next step: `--delete` if unused assets exist

**Do NOT delete anything. Review only.**

### If `--delete <scan_file>` argument:

**DANGEROUS OPERATION — Requires explicit user confirmation before proceeding.**

1. Read the scan JSON
2. Show the list of assets that will be deleted
3. **Ask the user to confirm deletion** — Do NOT proceed without explicit "yes"
4. If confirmed, set the scan file path and execute Phase 2:

```bash
SCAN_FILE_PATH="<absolute_path_to_scan_json>" python ~/.claude/skills/ue-cleanup-assets/run_in_editor.py ~/.claude/skills/ue-cleanup-assets/delete_unused_assets.py
```

Note: The `SCAN_FILE_PATH` environment variable tells the delete script which scan to use. If not set, it falls back to the latest scan file.

5. Show deletion results (success/failure counts)
