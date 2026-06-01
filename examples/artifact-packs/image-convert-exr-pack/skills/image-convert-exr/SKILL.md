---
description: "Convert EXR/HDR image files to PNG or JPG — matcaps, lightmaps, and other HDR textures to standard formats."
allowed-tools: Bash(python3:*)
---

# image-convert-exr

Convert OpenEXR files to PNG or JPG with optional resize.
## Arguments

- `<input>` - Path to input EXR file
- `[-o output]` - Output path (default: same name with .png)
- `[-s size]` - Resize to NxN pixels
- `[-f format]` - Output format: png (default) or jpg

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: `/image-convert-exr <input.exr> [-o output.png] [-s 1024] [-f png]`

## Workflow

### Step 1: Validate Input

Check that `$ARGUMENTS` contains an EXR file path.

### Step 2: Convert

```bash
python3 <this-skill-directory>/convert.py <input> [options]
```

### Step 3: Report

Show the output file path and dimensions.

## Examples

```bash
# Basic conversion
python3 <this-skill-directory>/convert.py ~/Downloads/toon_dark.exr

# Resize to 1024x1024
python3 <this-skill-directory>/convert.py ~/Downloads/toon_dark.exr -s 1024

# Output as JPG thumbnail
python3 <this-skill-directory>/convert.py ~/Downloads/toon_dark.exr -o thumb.jpg -s 64 -f jpg
```

## Dependencies

- `OpenEXR` - `pip install OpenEXR`
- `numpy`
- `Pillow`

## Files

- `convert.py` - EXR to PNG/JPG converter
