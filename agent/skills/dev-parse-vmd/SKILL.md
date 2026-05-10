---
description: "Parse VMD (Vocaloid Motion Data) binary files — MMD keyframes, bone movements, arm extensions, angular velocities."
argument-hint: "<vmd_path> [--mode summary|keyframes|angles|velocity|extensions] [--bones list] [--seconds n]"
allowed-tools:
  - Read
  - Write
  - Bash(node:*)
---

# dev-parse-vmd

Parse VMD binary files and analyze bone keyframe data for MMD animations.

## Purpose

Read VMD motion data files, extract bone keyframes, and provide analysis including angle profiles, angular velocities, arm extension events, and movement pattern summaries. Useful for debugging animation-driven effects (bloom, particles) and understanding choreography timing.

---

## Arguments

- `<vmd_path>` - Path to .vmd file (absolute or relative)
- `[--mode <type>]` - Output mode (default: `summary`)
  - `summary` — Keyframe counts per bone, angle ranges per second
  - `keyframes` — Raw keyframe data for filtered bones
  - `angles` — Per-frame interpolated angles with bar chart
  - `velocity` — Angular velocity and deceleration spikes
  - `extensions` — Arm extension events (bent→straight transitions)
  - `quat` — Quaternion quality analysis (hemisphere flips, angle deltas, axis distribution, peak rotation)
- `[--bones <list>]` - Comma-separated bone names (default: arm bones)
- `[--seconds <n>]` - Analyze first N seconds (default: 30)

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

```
Usage:
  /dev-parse-vmd path/to/file.vmd
  /dev-parse-vmd path/to/file.vmd --mode extensions --seconds 60
  /dev-parse-vmd path/to/file.vmd --mode velocity --bones 左ひじ,右ひじ
```

## Workflow

### Step 1: Validate Path
- Check the VMD file exists at the given path
- If relative, try resolving from current working directory and common VMD locations

### Step 2: Run Parser
```bash
node ~/.claude/skills/dev-parse-vmd/scripts/parse-vmd.js <vmd_path> [options]
```

### Step 3: Present Results
- Show the analysis output
- Highlight notable patterns (idle zones, extension events, velocity spikes)

## Additional Resources

For VMD binary format specification, bone name reference, and analysis techniques, see [reference.md](reference.md).
