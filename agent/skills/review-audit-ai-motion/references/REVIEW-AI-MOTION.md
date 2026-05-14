---
status: accepted
title: "AI-Generated Motion Review Standard"
tags:
  - standard
  - review
  - motion
  - ai
date: 2026-04-17
source: claude
---

# AI-Generated Motion Review Standard

Rubric for grading AI-generated character animation (FBX/glTF/VMD) and attributing quality defects to the responsible pipeline stage.

---

## Pipeline Stages (who can be at fault)

| ID | Stage | What it owns |
|----|-------|--------------|
| **G** | Generator (AI model) | Base pose sequence, joint rotations, root trajectory, semantic intent |
| **K** | Skeleton / Rig mapping | Bone name mapping, T-pose vs A-pose, axis orientation, rest pose |
| **R** | Retarget | Source skeleton → target (VRM/UE) transform, scale normalization |
| **P** | Physics / Grounding | IK, foot lock, ground plane, contact solver |
| **V** | Viewer / Renderer | Display-only artifacts (skinning bugs, camera, lighting) |

---

## Core Metrics

Thresholds are **first-pass heuristics** — tune per project. All measured on the source FBX unless noted.

### 1. Foot Skate (stance-phase XZ drift)

Per-frame XZ displacement of a foot bone while classified as "stance" (foot Y below threshold AND foot speed below threshold).

| Grade | Mean skate per stance frame |
|-------|----------------------------|
| A | < 2 mm |
| B | 2–5 mm |
| C | 5–15 mm |
| F | > 15 mm |

Reference: [Zou et al., WACV 2020](https://openaccess.thecvf.com/content_WACV_2020/papers/Zou_Reducing_Footskate_in_Human_Motion_Reconstruction_with_Ground_Contact_Constraints_WACV_2020_paper.pdf); [Fréchet Motion Distance, ACM 2023](https://dl.acm.org/doi/fullHtml/10.1145/3623264.3624443).

### 2. Foot-Floor Penetration / Hover

Signed Y of foot bone relative to ground plane (min ground contact as reference).

| Grade | Max penetration depth / Mean hover |
|-------|------------------------------------|
| A | ±5 mm |
| B | ±15 mm |
| C | ±30 mm |
| F | > 30 mm or wildly inconsistent |

### 3. Jitter (Peak Jerk, Area-Under-Jerk)

Per-bone 3rd derivative of rotation (quaternion log-map) or position. Report peak and AUJ per major bone.

| Grade | Peak jerk (rad/s³ normalized) |
|-------|-------------------------------|
| A | < 50 |
| B | 50–200 |
| C | 200–1000 |
| F | > 1000 |

Reference: [Fast Detection of Jitter Artifacts, SciTePress 2025](https://www.scitepress.org/Papers/2025/131444/131444.pdf).

### 4. Contact Accuracy

Fraction of stance-classified frames where foot velocity < 5 mm/frame. Higher is better.

| Grade | Fraction |
|-------|----------|
| A | > 0.95 |
| B | 0.85–0.95 |
| C | 0.70–0.85 |
| F | < 0.70 |

### 5. Pose Plausibility

Joint limit violations per frame. Knee/elbow hyperextension, shoulder > 180°, ankle inversion extreme. Count frames with ≥1 violation.

| Grade | Violation frame ratio |
|-------|-----------------------|
| A | 0% |
| B | < 1% |
| C | 1–5% |
| F | > 5% |

### 6. Root Motion Consistency

Correlation between hips XZ displacement and mean foot XZ. Low correlation → root drifts independently of feet (classic generator artifact).

| Grade | Correlation |
|-------|-------------|
| A | > 0.9 |
| B | 0.7–0.9 |
| C | 0.4–0.7 |
| F | < 0.4 |

### 7. Temporal Coherence (loop / endpoints)

If the motion is a loop: L2 distance between pose[0] and pose[N-1]. If one-shot: discontinuity detector on frame-to-frame pose delta.

---

## Fault Attribution Matrix

**Rule: measure the SAME metric on source FBX and on post-retarget output. Where the defect appears tells you who's at fault.**

| Symptom | Source FBX | Post-retarget | Verdict |
|---------|-----------|---------------|---------|
| Foot skate | bad | bad | **G** (generator) |
| Foot skate | clean | bad | **R** (retarget scale/rest-pose mismatch) |
| Foot penetration | bad | bad | **G** + no **P** pass |
| Foot penetration | clean | bad | **R** (height offset) or **K** (rest pose Y) |
| Jitter all bones | bad | bad | **G** |
| Jitter select bones only | bad | bad | **G** (model weak on those joints) |
| Jitter only after retarget | clean | bad | **R** (interpolation / frame rate mismatch) |
| Pose limit violation | bad | bad | **G** |
| Arms in wrong direction | clean (source intent ok) | bad | **K** (A-pose / T-pose mismatch) |
| Left/right swap | — | bad | **K** or **R** (axis flip) |
| Character floats above ground | — | bad | **K** (rest pose Y offset) |
| Hair/cloth explodes | clean | bad | **V** (spring bone / physics anchor) |
| Mesh tearing / rubber-band limbs | — | bad | **V** (skinning / IBM) |
| Root drift no foot match | bad | bad | **G** (semantic failure) |
| Loop discontinuity | bad | bad | **G** |
| Asymmetric when should be symmetric | bad | bad | **G** (prompt/training bias) |

---

## Diagnostic Flow

1. **Run metrics on source FBX first.** If it fails here, it's **G** — no retarget can save it.
2. **Run metrics on retargeted output.** Compare deltas.
   - Same magnitude → source is the bottleneck (**G**)
   - Worse → new defect introduced by **R** or **K**
3. **Check rest pose / T-pose alignment** before blaming anything else — wrong rest pose masquerades as every downstream bug.
4. **Visual pass (viewer screenshot)** only after numbers — use `review-audit-retarget` skill for skinning/viz issues (**V**).

---

## Output Format

Reports should include:

```
FILE: <path>
DURATION: <N frames @ fps>

METRICS
  foot_skate_L:    mean=Xmm peak=Ymm  [A/B/C/F]
  foot_skate_R:    ...
  penetration:     min=Ymm mean_hover=Zmm  [grade]
  jitter_peak:     <bone>=X rad/s³  [grade]
  contact_acc:     0.XX  [grade]
  pose_violations: N frames (X%)  [grade]
  root_corr:       0.XX  [grade]

OVERALL GRADE: B
FAULT: G (jitter on all bones, root-foot correlation low)
RECOMMEND: regenerate / pick different seed / stronger smoothing on generator side
```

---

## Related

- `~/.claude/skills/review-audit-ai-motion/SKILL.md` — executes this rubric on an FBX
- `~/.claude/skills/review-audit-retarget/SKILL.md` — viewer-side (V) issues
- `~/.claude/standards/unreal/arp-skeleton.md` — ARP rest pose reference

## External References

- [Objective Evaluation Metric for Motion Generative Models (ACM 2023)](https://dl.acm.org/doi/fullHtml/10.1145/3623264.3624443)
- [Aligning human motion generation with human perceptions (arXiv 2024)](https://www.arxiv.org/pdf/2407.02272)
- [Reducing Footskate with Ground Contact Constraints (WACV 2020)](https://openaccess.thecvf.com/content_WACV_2020/papers/Zou_Reducing_Footskate_in_Human_Motion_Reconstruction_with_Ground_Contact_Constraints_WACV_2020_paper.pdf)
- [Fast Detection of Jitter Artifacts (SciTePress 2025)](https://www.scitepress.org/Papers/2025/131444/131444.pdf)
- [VMBench ICCV 2025](https://amap-ml.github.io/VMBench-Website/)
