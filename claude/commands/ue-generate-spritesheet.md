---
description: Generate sprite sheets from image sequences
argument-hint: "<input_path> [options]"
allowed-tools: Read, Bash(python:*), Glob
---

# Generate Sprite Sheet

Generate sprite sheet textures from image sequence folders for UE flipbooks.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `ue-generate-spritesheet`

## Arguments

Input: $ARGUMENTS

- `<input_path>` - Directory containing image sequence subfolders
- `[--frame_width N]` - Frame width in pixels (default: 80)
- `[--frame_height N]` - Frame height in pixels (default: 80)
- `[--fps_reduction N]` - Sample every Nth frame (default: 1)
- `[--use_png_subfolder true|false]` - Look in png/ subfolder (default: true)
- `[--output path]` - Output directory (default: ~/.claude/private/unreal/spritesheet-generate/)

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: `/ue-generate-spritesheet <input_path> [--frame_width 260 --frame_height 145 --fps_reduction 2 --use_png_subfolder false]`

## Workflow

### Step 1: Validate Input

Check that the input path exists and contains subfolders.

### Step 2: Run Generator

Execute the sprite sheet generator:

```bash
python ~/.claude/skills/ue-generate-spritesheet/generate_spritesheet.py --input <input_path> [additional flags from $ARGUMENTS]
```

Pass through any additional flags the user provided (frame size, fps reduction, etc.).

### Step 3: Show Results

After execution:
- Show the list of generated sprite sheets
- Show the output directory path
- If any folders were skipped, explain why
