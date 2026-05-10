---
description: "Validate VMD-PMX compatibility — bone matching, IK conflicts, source model detection, cross-model retarget issues."
argument-hint: "<vmd_path> <pmx_path>"
allowed-tools:
  - Read
  - Write
  - Bash(node:*)
---

# dev-validate-vmd

Validate VMD motion file compatibility with a target PMX model.

## Purpose

Analyze VMD↔PMX bone matching, detect source model signatures (ミリシタ, and similar), identify IK/FK conflicts, check twist bone coverage, flag extreme arm rotations, and produce a compatibility score. Useful for diagnosing cross-model retarget issues.

---

## Arguments

- `<vmd_path>` - Path to .vmd file
- `<pmx_path>` - Path to .pmx file

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

```
Usage:
  /dev-validate-vmd path/to/motion.vmd path/to/model.pmx
```

## Workflow

### Step 1: Validate Paths
- Check both files exist

### Step 2: Run Validator
```bash
node ~/.claude/skills/dev-validate-vmd/scripts/validate-vmd-pmx.js <vmd_path> <pmx_path>
```

### Step 3: Present Results
- Show compatibility report with score
- Highlight warnings (missing bones, IK conflicts, arm extremes)
- Suggest retarget actions if source model detected
