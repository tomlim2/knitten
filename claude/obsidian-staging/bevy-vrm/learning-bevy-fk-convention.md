---
title: "Bevy vs glTF FK convention mismatch"
tags: [bevy-vrm, retarget, gotcha, rule]
created: 2026-04-06
---

# Bevy vs glTF FK convention mismatch

## Problem

Finger bind pose correction looked perfect from front view but fingers bent UPWARD from side view. Verify reported 0.0° error yet visual was clearly wrong.

## Root Cause

Two different FK conventions in the pipeline:

| Component | Formula | Convention |
|-----------|---------|------------|
| `eval_fk_chain_bones` | `parent * rest⁻¹ * local` | glTF FK |
| Bevy `GlobalTransform` | `parent * local` | Bevy native |

The retarget output (`bones[].rotations`) is designed to be applied as `Transform::rotation` directly by Bevy. At rest, `result = rest_local` (not identity). Bevy then computes `parent * rest_local = correct rest global`.

With the FK formula: `parent * rest⁻¹ * rest_local = parent` — the `rest⁻¹` cancels out the rest component, giving a DIFFERENT world rotation than Bevy renders.

## Impact

Hips has **7° non-identity rest rotation** (`rot=(0.063,0,0,0.998)`). This 7° error propagates through the entire spine→arm→hand chain. By the time it reaches the hand, the accumulated rotation frame is ~7° off from what Bevy actually renders.

Result: finger correction is computed in a 7°-rotated frame → curl plane shifts → front view OK (7° around X barely visible) but side view wrong (curl appears upward).

## Solution

In `apply_finger_bind_pose`, compute all world rotations using Bevy convention:
- `bone_world = parent_world * local` (no `rest⁻¹`)
- Hand world: traverse chain with `parent * local`
- All `parent_world` cascading: `parent * local`

Do NOT change `eval_fk_chain_bones` itself (used by IK solver, which is self-consistent in FK convention).

> [!abstract] Rule
> When computing corrections that affect Bevy-rendered visuals, use Bevy's transform convention (`parent * local`), not glTF FK convention (`parent * rest⁻¹ * local`). The retarget output is designed for Bevy's direct application. #rule
