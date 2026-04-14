---
description: Register VRM files as user characters (commandlet + assets.info)
argument-hint: "<vrm_path> [vrm_path2] ... [--no-build] [--gender Male|Female]"
allowed-tools: Bash(python:*), Read, Glob
---

# Register VRM as User Character

Run the full character registration pipeline headlessly:
1. Patch commandlet source
2. Build UE project (unless `--no-build`)
3. Per VRM: create JSON → run commandlet → verify .character → move to UserCharacter/ → add to assets.info
4. Restore commandlet source

## Arguments

```
$ARGUMENTS
```

- Positional: one or more VRM file paths
- `--no-build`: skip UE build step (use if already built with patch)
- `--gender Male|Female`: character gender (default: Female)

If no arguments provided, show usage and stop.

## Prerequisites

- `character_creator_config.json` must exist (run `/cci-open-creator-character` GUI once to set paths)
- ZenServer must be running on port 8558

## Execution

1. Read `~/.claude/private/repo-paths.json` → key `anju` → `.path`
2. Verify VRM files exist
3. Run:

```bash
python "<anju-path>/python/user_character_manager/register_vrm.py" "<vrm1>" "<vrm2>" ... [--no-build] [--gender Female]
```

## Output

```
=== [1/N] display_name ===
  1) JSON: name_timestamp.json
  2) Commandlet running...
     Exit code: 0
  3) Moved: name.character → UserCharacter/
     Thumbnail: thumb_name_01.png
  4) Registered in assets.info

=== Done. N/N registered ===
```

Show results to the user. If commandlet fails (non-zero exit), report the error.
