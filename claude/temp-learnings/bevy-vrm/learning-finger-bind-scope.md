---
title: "finger_bind_pose is Thumb-only — retargeter handles non-thumb curl"
tags: [bevy-vrm, retarget, gotcha, rule]
created: 2026-04-06
---

# finger_bind_pose is Thumb-only

## Problem

After fixing all finger_bind bugs (coordinate space, verify chain, static threshold, Bevy convention), non-thumb fingers were visually over-curled — much tighter fist than FBX reference.

## Root Cause

**Double correction.** Two systems both apply finger curl:

1. **Retargeter (three-quat formula)** — applies `virtual_rest_global` conjugation that maps FBX bone rotations to VRM space. For non-thumb fingers, this already produces correct curl because VRM Proximal maps to FBX `index_01_l` etc. (1:1 rotation mapping).

2. **finger_bind_pose (IK)** — computes direction-based correction from FBX world positions. This adds MORE curl on top of what the retargeter already applied.

Result: non-thumb fingers get retargeter curl + finger_bind curl = over-curl.

## Why Thumb is different

- Thumb has 3 bones in both VRM and FBX → structural match
- But retargeter's three-quat formula doesn't produce correct thumb curl (the MetaHuman thumb orientation differs significantly from VRM rest)
- finger_bind_pose correction is needed and works well for thumb
- Thumb correction: 27° Metacarpal + 22° Proximal → visually correct

## Solution

Skip non-thumb fingers in `apply_finger_bind_pose`:
```rust
if finger != "Thumb" { continue; }
```

> [!abstract] Rule
> The retargeter's three-quat formula handles non-thumb finger curl. `apply_finger_bind_pose` should only correct Thumb. Adding direction-based corrections on top of rotation-based retarget causes over-curl. #rule
