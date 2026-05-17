---
description: Restore deleted UE assets from git history (find deletion commit, checkout from prior)
argument-hint: "<game-path> [game-path2] ..."
allowed-tools: Bash(git:*), Read, Glob, Grep
---

# Restore Deleted UE Assets from Git History

Restore UE assets that were deleted in past git commits by finding
the last commit where they existed and checking them out.

## Arguments

```
$ARGUMENTS
```

- Positional: one or more `/Game/` paths (e.g. `/Game/CineProps/Asset/SM_Foo`)
- `.uasset` suffix is optional — added automatically if missing

**If no arguments provided, show usage and stop. NEVER auto-execute.**

```
Usage: /ue-restore-asset <game-path> [game-path2] ...

Examples:
  /ue-restore-asset /Game/CineProps/Outside/SM_Lightbulb_03
  /ue-restore-asset /Game/CineMaps/05_Street/Neon/MI_Street_Neon_A_025 /Game/CineMaps/05_Street/Neon/MI_Street_Neon_A_026
```

## Prerequisites

- Must be run from a git repository containing a UE project
- Read `~/.claude/private/agent-hub-config/repo-paths.json` to resolve repo paths
- Detect UE project root: find the directory containing `.uproject`

## Execution

For each `/Game/` path:

### 1. Convert Game Path to Disk Path

```
/Game/Foo/Bar → <ProjectName>/Content/Foo/Bar.uasset
```

### 2. Check if File Already Exists

If the file exists on disk, skip and inform the user.

### 3. Find Deletion Commit

```bash
git log --all --oneline --diff-filter=D -- "<disk-path>"
```

If no result, the file was never tracked. Inform and skip.

### 4. Find Last Commit Where File Existed

```bash
git log --all --oneline -- "<disk-path>"
```

Take the second entry (first is the deletion commit, second is the
last commit where the file existed). If the deletion commit is a
merge, the parent commit approach works too:

```bash
git log --all --oneline -- "<disk-path>" | head -2 | tail -1
```

### 5. Restore

```bash
git checkout <last-good-commit> -- "<disk-path>"
```

### 6. Verify

Confirm the file exists and show its size.

### 7. Check if Cooked

For `.uasset` files, verify the package is uncooked:

```python
python -c "
import struct
with open('<disk-path>', 'rb') as f:
    data = f.read(12)
    flags = struct.unpack('<I', data[8:12])[0]
    status = 'COOKED' if flags & 0x8 else 'UNCOOKED'
    print(f'{status}')
"
```

Warn if the restored asset is cooked.

## Output

```
=== Restoring N assets ===

[1/N] /Game/Foo/Bar
  Deleted in: <commit-hash> <commit-msg>
  Restored from: <commit-hash> <commit-msg>
  Size: 62KB | Status: UNCOOKED
  ✓ Restored

[2/N] /Game/Baz/Qux
  Already exists on disk — skipped

=== Done. X/N restored ===
```

## Error Cases

- **File never tracked:** "Not found in git history — was it ever committed?"
- **File already exists:** Skip with message
- **Cooked asset restored:** Warn — may need resave in editor
- **LFS pointer:** If restored file is tiny (<1KB), warn that
  `git lfs pull` may be needed
