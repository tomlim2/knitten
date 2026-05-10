---
description: Grade AI-generated motion (FBX) and attribute quality defects to pipeline stage
argument-hint: "<source.fbx> [retargeted.fbx|.glb]"
allowed-tools: Read, Write, Bash(blender:*), Bash(open:*), Bash(ls:*)
user-invocable: true
---

# review-audit-ai-motion

Grade AI-generated character motion against the `review-ai-motion` standard, then attribute faults to the responsible pipeline stage (Generator / Rig / Retarget / Physics / Viewer).

## Arguments

- `<source.fbx>` — AI-generated source animation (REQUIRED)
- `[retargeted.fbx|.glb]` — Post-retarget output for delta comparison (optional but strongly recommended for fault attribution)

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: `/review-audit-ai-motion <source.fbx> [retargeted]`

---

## Workflow

### Step 1: Load the rubric

Read `~/.claude/standards/review/review-ai-motion.md` in full. That document defines:
- 7 core metrics (foot skate, penetration, jitter, contact accuracy, pose plausibility, root correlation, temporal coherence)
- Grade thresholds (A/B/C/F)
- **Fault attribution matrix** — the key deliverable

Do NOT reimplement thresholds inline. Always cite the standard.

### Step 2: Verify input

- Check source FBX exists.
- If retargeted output is provided, check it exists too.
- Report file size, modified date.

### Step 3: Extract per-frame data via Blender headless

Run the analysis script:

```bash
!`bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh tool blender` --background --python ~/.claude/skills/review-audit-ai-motion/analyze.py -- <source.fbx> [retargeted]
```

The script writes JSON to `/tmp/motion-audit/<filename>.json` with:
- Bone hierarchy + armature name
- Per-frame world position of foot bones (L/R), hips, head
- Per-frame rotation of major bones (quaternion)
- Frame count + fps

If Blender is not installed or the import fails, report the error and stop. Do NOT fake metrics.

### Step 4: Classify motion

Run the classifier **before** computing metrics — some metrics don't apply to every motion class:

```bash
python3 ~/.claude/skills/review-audit-ai-motion/classify.py /tmp/motion-audit/<stem>.json
```

Returns `{filename_hint, inferred: {label, sub, confidence, signals}, hint_matches_data}`.

Classes: `standing`, `locomotion` (walk/run/limp), `jumping`, `sitting`, `lying`, `unknown`.

**If `filename_hint` and `inferred` disagree → flag in the report.** Filename may be a lie about what the AI actually generated.

Metric applicability per class:

| Metric | locomotion | standing | jumping | sitting | lying |
|--------|:---:|:---:|:---:|:---:|:---:|
| Foot skate | ✓ | ✓ (strict) | stance phases only | skip | skip |
| Penetration | ✓ | ✓ | ✓ | skip (hips-based) | skip |
| Jitter | ✓ | ✓ | ✓ | ✓ | ✓ |
| Contact accuracy | ✓ | ✓ | ✓ | skip | skip |
| Pose violations | ✓ | ✓ | ✓ | relaxed | relaxed |
| Root-foot correlation | ✓ | skip | skip | skip | skip |
| Loop gap | ✓ | ✓ | ✓ | ✓ | ✓ |

### Step 5: Compute metrics

From the JSON, compute each metric defined in the standard, respecting the applicability table above:

1. **Foot skate** — detect stance frames (foot Y < 5% of character height AND foot speed < 5mm/frame), sum XZ drift during stance, normalize per stance frame.
2. **Penetration / hover** — min foot Y vs ground reference (use min foot Y across whole clip as proxy ground plane if unknown), mean hover during stance.
3. **Jitter** — 3rd-order finite difference on bone rotations (convert quaternion to axis-angle log), compute peak and area-under-jerk per major bone (hips, spine, shoulders, elbows, knees, ankles).
4. **Contact accuracy** — fraction of stance frames with foot speed < 5mm/frame.
5. **Pose plausibility** — check knee/elbow for hyperextension (angle > 180° or < 5°), ankle inversion.
6. **Root correlation** — Pearson corr between hips XZ and mean foot XZ.
7. **Temporal coherence** — L2 between first and last pose for loopability.

Apply A/B/C/F grades from the standard.

### Step 5: Fault attribution

If only source is provided: attribute to **G** / **K** / **P** based on metric pattern (see matrix in the standard).

If retargeted output also provided: run metrics on both and compare deltas:
- Same magnitude → source bottleneck (**G**)
- Worse after retarget → **R** or **K**

Emit the verdict using the matrix rows verbatim — do not invent categories.

### Step 6: Report

Write to `/tmp/motion-audit/<filename>-report.md` and show to user:

```
FILE: <source path>
DURATION: <N frames @ fps>

METRICS
  foot_skate_L:    mean=Xmm peak=Ymm  [grade]
  foot_skate_R:    ...
  penetration:     min=Ymm mean_hover=Zmm  [grade]
  jitter_peak:     <bone>=X rad/s³  [grade]
  contact_acc:     0.XX  [grade]
  pose_violations: N frames (X%)  [grade]
  root_corr:       0.XX  [grade]
  loop_gap:        Xmm  [grade]

OVERALL: <letter grade> — <one-line summary>

FAULT: <G|K|R|P|V> — <which rows of the attribution matrix triggered>

RECOMMEND: <concrete next step — regenerate / fix rest pose / add IK pass / etc.>
```

Keep the report terse. No hedging prose.

---

## Example Output

```
FILE: 18479_F_AILimpRightFR_000000.fbx
DURATION: 120 frames @ 30fps (4.0s)

METRICS
  foot_skate_L:    mean=3.2mm peak=8mm  [B]
  foot_skate_R:    mean=11mm peak=42mm  [C]  ← limp foot
  penetration:     min=-18mm mean_hover=6mm  [C]
  jitter_peak:     leftShoulder=320 rad/s³  [C]
  contact_acc:     0.82  [C]
  pose_violations: 3 frames (2.5%)  [C]
  root_corr:       0.58  [C]
  loop_gap:        42mm  [F]

OVERALL: C — functional but noticeably unnatural

FAULT: G (generator)
  - Skate / penetration / jitter all present in source → no retarget comparison needed
  - Loop gap 42mm indicates non-loopable output
  - Asymmetric skate (R >> L) matches intended limp, NOT a defect

RECOMMEND:
  1. Regenerate with different seed if loopability matters
  2. Post-process with foot-lock IK to fix ground contact (R or P stage)
  3. Light low-pass filter on shoulder rotation (cutoff ~8Hz)
```

---

## Notes

- This is a **first-pass screener**, not a final QA gate. Borderline grades (B/C) need human review.
- Stance classification with min-Y heuristic fails for climbing/jumping/lying motions. For those clips, ask the user what "ground" means before running.
- Ground plane defaults to min foot Y. If the character is airborne or on terrain, pass a reference elsewhere.
- For VMD input, use `/dev-parse-vmd` first to convert, then feed resulting FBX/rest pose here.

---

## Related

- `~/.claude/standards/review/review-ai-motion.md` — rubric + fault matrix (canonical reference)
- `~/.claude/skills/review-audit-retarget/SKILL.md` — for **V** stage (viewer/skinning) diagnosis
