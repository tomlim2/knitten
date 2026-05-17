---
description: "Convert PMX model files to VRM 0.x format"
argument-hint: "<file_or_dir> [-o output] [--name NAME] [--no-spring] [--no-rename] [--scale N]"
allowed-tools:
  - Read
  - Glob
  - Bash(python:*)
  - Bash(cd:*)
---

# pmx-convert-vrm

Convert PMX model files (or ZIPs/folders containing PMX) to VRM 0.x format using the Python converter pipeline.

## Arguments

```
$ARGUMENTS
```

Parse the arguments:
- First non-flag argument: input path (PMX file, ZIP, or directory)
- `-o <dir>` / `--output <dir>`: output directory (default: same directory as input)
- `--name <name>`: custom output VRM filename (e.g. `--name MyCharacter`)
- `--no-spring`: skip spring bone conversion
- `--no-rename`: skip ASCII rename step
- `--no-validate`: skip validation step
- `--scale <number>`: scale factor (default: 0.08)

If no arguments provided, show usage and stop:

```
Usage: /pmx-convert-vrm <file_or_dir> [-o output] [--name NAME] [--no-spring] [--no-rename] [--scale N]

  <file_or_dir>  Path to .pmx file, .zip archive, or directory
  -o <dir>       Output directory (default: same as input)
  --name <name>  Custom output VRM filename (e.g. MyCharacter)
  --no-spring    Skip spring bone (physics) conversion
  --no-rename    Skip ASCII filename rename step
  --no-validate  Skip VRM validation step
  --scale <N>    Scale factor (default: 0.08)

Examples:
  /pmx-convert-vrm model.zip
  /pmx-convert-vrm model.zip -o ~/Downloads --name Clara
  /pmx-convert-vrm ./models-folder --no-spring
```

## Script Location

Read `~/.claude/private/agent-hub-config/repo-paths.json` to find the `anju` repo path, then use:
```
<anju_path>/module/pmx2vrm
```

If repo-paths.json doesn't exist or `anju` key is missing, fall back to:
```
D:/vs/anju/module/pmx2vrm
```

Verify `python/intake.py` exists in the directory before proceeding.

## Execution

Run the converter from the project root directory:

```bash
cd "<project_dir>" && python -m python.intake "<input_path>" [flags]
```

Pass through all flags the user provided (`-o`, `--name`, `--no-spring`, `--no-rename`, `--no-validate`, `--scale`).

**Important:**
- Always `cd` into the project root directory first (module imports need it)
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

## Test Models

This skill doubles as the integration test for the Python converter pipeline. If a test model fails to convert due to a script error, **fix the script** — do not work around it.

| Model | Input | Issue | Output |
|-------|-------|-------|--------|
| Sparkle | `槿廚屆돛―빻삽.zip` | CJK 모지바케 텍스처, 소품 PMX 필터링 | `sparkle_p2v.vrm` |
| Phainon (白厄 변신) | 星穹铁道—白厄（变身）.zip (파일명 모지바케) | 모지바케 파일명 (CLI 입력 불가, glob 필요) | `phainon_t_p2v.vrm` |
| Saber | `HSR saber.zip` | 얼굴 볼 마테리얼 | `saber_p2v.vrm` |
| Phainon (白厄 含武器) | 星穹铁道—白厄.zip (파일명 모지바케, 13MB) | 가장 잘되는 케이스 (모지바케 복구 검증) | `phainon_n_p2v.vrm` |
| Hatsune Miku | `Hatsune Miku Original.zip` | 폴더 이름 입력 테스트, 넥타이 스프링 강성 | default rename |

All inputs from `E:\models\PMXs\`, all outputs to `E:\models\PMXs\VRM\`.

```bash
# Sparkle
python -m python.intake "E:\models\PMXs\槿廚屆돛―빻삽.zip" -o "E:\models\PMXs\VRM" --name sparkle_p2v
# Phainon 변신 (filename is mojibake — use Python glob to find the 31MB zip)
python -c "import os,subprocess,sys; f=[f for f in os.listdir('E:/models/PMXs') if f.endswith('.zip') and os.path.getsize(os.path.join('E:/models/PMXs',f))==31849963][0]; subprocess.run([sys.executable,'-m','python.intake',os.path.join('E:/models/PMXs',f),'-o','E:/models/PMXs/VRM','--name','phainon_t_p2v'])"
# Saber
python -m python.intake "E:\models\PMXs\HSR saber.zip" -o "E:\models\PMXs\VRM" --name saber_p2v
# Phainon 含武器 (filename is mojibake — use Python glob to find the 13MB zip)
python -c "import os,subprocess,sys; f=[f for f in os.listdir('E:/models/PMXs') if f.endswith('.zip') and os.path.getsize(os.path.join('E:/models/PMXs',f))>13000000 and os.path.getsize(os.path.join('E:/models/PMXs',f))<14000000 and f not in ['槿廚屆돛―빻삽.zip','HSR saber.zip','Hatsune Miku Original.zip']][0]; subprocess.run([sys.executable,'-m','python.intake',os.path.join('E:/models/PMXs',f),'-o','E:/models/PMXs/VRM','--name','phainon_n_p2v'])"
# Hatsune Miku (default rename — no --name flag)
python -m python.intake "E:\models\PMXs\Hatsune Miku Original.zip" -o "E:\models\PMXs\VRM"
```
