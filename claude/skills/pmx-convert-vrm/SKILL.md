---
description: "Convert PMX model files to VRM 0.x format"
argument-hint: "<file_or_dir> [-o output] [--no-spring] [--no-rename] [--scale N]"
allowed-tools:
  - Read
  - Glob
  - Bash(npx:*)
  - Bash(node:*)
  - Bash(cd:*)
---

# pmx-convert-vrm

Convert PMX model files (or ZIPs containing PMX) to VRM 0.x format using the TypeScript converter pipeline.

## Arguments

```
$ARGUMENTS
```

Parse the arguments:
- First non-flag argument: input path (PMX file, ZIP, or directory)
- `-o <dir>` / `--output <dir>`: output directory (default: same directory as input)
- `--no-spring`: skip spring bone conversion
- `--no-rename`: skip ASCII rename step
- `--no-validate`: skip validation step
- `--scale <number>`: scale factor (default: 0.08)

If no arguments provided, show usage and stop:

```
Usage: /pmx-convert-vrm <file_or_dir> [-o output] [--no-spring] [--no-rename] [--scale N]

  <file_or_dir>  Path to .pmx file, .zip archive, or directory
  -o <dir>       Output directory (default: same as input)
  --no-spring    Skip spring bone (physics) conversion
  --no-rename    Skip ASCII filename rename step
  --no-validate  Skip VRM validation step
  --scale <N>    Scale factor (default: 0.08)

Examples:
  /pmx-convert-vrm model.zip
  /pmx-convert-vrm model.zip -o ~/Downloads
  /pmx-convert-vrm ./models-folder --no-spring
```

## Script Location

Read `~/.claude/private/repo-paths.json` to find the `anju` repo path, then use:
```
<anju_path>/python/pmx2vrm-convert-module/typescript
```

If repo-paths.json doesn't exist or `anju` key is missing, fall back to:
```
D:/vs/anju/python/pmx2vrm-convert-module/typescript
```

Verify `src/intake.ts` exists in the directory before proceeding.

## Execution

Run the converter from the TypeScript project directory:

```bash
cd "<typescript_dir>" && npx tsx src/intake.ts "<input_path>" [flags]
```

Pass through all flags the user provided (`-o`, `--no-spring`, `--no-rename`, `--no-validate`, `--scale`).

**Important:**
- Always `cd` into the TypeScript directory first (it needs `node_modules` in scope)
- Quote paths that contain spaces or CJK characters
- The command outputs progress to stdout — show it to the user

## Output

The converter prints:
```
Scanning: <input>
  <file>.pmx — humanoid (N/16 required bones)
  <file>.pmx — SKIP (reason)

Converting: <file>.pmx
  Vertices: N, Bones: N, Materials: N
  Renamed: <old>.pmx -> <new>.vrm
  Validate: VALID, N warning(s)
  -> <output_path>

Done. N model(s) converted.
```

After conversion completes:
1. Show the output path(s) of the generated .vrm file(s)
2. Report how many models were converted vs skipped
3. If any warnings, mention them briefly

## Error Handling

- Script not found: show expected path and suggest checking repo-paths.json
- Input file not found: report the missing path
- Non-zero exit code: show the full stderr output
- Zero models converted: mention possible reasons (no humanoid skeleton, nested ZIP)
