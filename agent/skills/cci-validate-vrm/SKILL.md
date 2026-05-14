---
description: "Validate VRM 0.x files from pmx2vrm pipeline"
argument-hint: "<file_or_dir> [--strict]"
allowed-tools:
  - Read
  - Glob
  - Grep
  - Bash(python:*)
---

# cci-validate-vrm

6-Layer VRM structural validator. Wraps `vrm_validator.py` and presents results as structured markdown.

## Skill-owned standards

Read `references/CINEV-VRM-SHADING.md` only when validating CINEV VRM material readiness, source classification, or outline policy.

## Arguments

```
$ARGUMENTS
```

Parse the arguments:
- Extract file/directory path (first non-flag argument)
- Check for `--strict` flag anywhere in arguments
- If no arguments provided, show usage and stop:

```
Usage: /cci-validate-vrm <file_or_dir> [--strict]

  <file_or_dir>  Path to a .vrm file or directory containing .vrm files
  --strict       Treat warnings as failures

Examples:
  /cci-validate-vrm model.vrm
  /cci-validate-vrm ./output/ --strict
```

## Script Location

Read `~/.claude/private/caol-config/repo-paths.json` to find the `anju` repo path, then use:
```
<anju_path>/module/pmx2vrm/python/vrm_validator.py
```

If repo-paths.json doesn't exist or `anju` key is missing, fall back to:
```
D:/vs/anju/module/pmx2vrm/python/vrm_validator.py
```

Verify the script exists before proceeding.

## Execution

### Single File

If the target is a `.vrm` file:

```bash
python "<script_path>" "<vrm_file>" --json
```

Add `--strict` if the flag was provided.

Capture stdout. Parse the JSON output.

### Directory (Batch)

If the target is a directory:

1. Use Glob to find all `**/*.vrm` files under the directory
2. If no .vrm files found, report and stop
3. Run the validator on each file individually (capture JSON for each)
4. Collect all results

## Report Format

### JSON Structure

The validator outputs:
```json
{
  "valid": true,
  "vrm_version": "0.0",
  "exporter": "truepmx2vrm-0.1.0",
  "node_count": 45,
  "material_count": 12,
  "bone_count": 28,
  "issues": [
    { "severity": "ERROR|WARNING|INFO", "layer": 1, "message": "...", "path": "..." }
  ]
}
```

### Single File Report

Format the result as:

```markdown
## VRM Validation: <filename>

| | |
|---|---|
| specVersion | <vrm_version> |
| exporter | <exporter> |
| Nodes | <node_count> |
| Materials | <material_count> |
| Humanoid bones | <bone_count> (<required_found>/17 required) |

| Layer | Status | Details |
|-------|--------|---------|
| 1. GLB structure | PASS/FAIL/WARN | <summary> |
| 2. glTF validity | PASS/FAIL/WARN | <summary> |
| 3. VRM extension | PASS/FAIL/WARN | <summary> |
| 4. Humanoid bones | PASS/FAIL/WARN | <summary> |
| 5. Spring animation | PASS/FAIL/WARN | <summary> |
| 6. Materials | PASS/FAIL/WARN | <summary> |

### Issues
- **[ERROR]** `path`: message
- **[WARN]** `path`: message

### Verdict: VALID / VALID (N warnings) / INVALID (N errors, M warnings)
```

**Layer status rules:**
- If any ERROR in that layer → FAIL
- If any WARNING (no ERROR) → WARN
- Otherwise → PASS
- Layers with no issues at all (not even INFO) → skip or show PASS with no details

**Details column:**
- For layer 4 (humanoid): show `N/17 required`
- For layers with warnings/errors: show count like `2 issues`
- For PASS layers: leave empty

**Issues section:**
- Only list ERROR and WARNING issues (skip INFO)
- If no errors or warnings, omit the Issues section entirely

**Required bones count:** Count issues in layer 4 where severity is INFO and message contains "required" — extract the `N/17` from the message. If not available, compute from `bone_count` vs 17.

### Batch Report

```markdown
## VRM Batch Validation: <directory> (<count> files)

| File | Nodes | Bones | Result |
|------|-------|-------|--------|
| <name>.vrm | <nodes> | <bones>/17 | VALID / VALID (N warn) / INVALID |
| ... | ... | ... | ... |

Summary: X valid, Y invalid
```

- If a file fails to parse (node_count = 0, no metadata), show `-` for Nodes/Bones
- After the table, show `Summary: X valid, Y invalid`
- If `--strict` is active, mention it: `(strict mode)`

## Error Handling

- Script not found → show path and suggest running `/cci-sync-ta-tools`
- File not found → report which file is missing
- Non-zero exit code without JSON → show raw stderr
- JSON parse failure → show raw output for debugging
