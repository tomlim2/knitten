# Task: R-021 T2M FBX arm/hand keyframe analysis

You are agent #2. Work in the bevy-vrm repo.

## Setup
- Branch: `feat/blender-source-type` (continue)
- Repo: ~/Desktop/www/bevy-vrm

## Rules
- **Do NOT commit.**
- **Do NOT modify any source files.** This is analysis only.

## Context

T2M walk FBX has very weak lowerArm animation (max 5.6° across all frames per R-016). The user wants a detailed breakdown of arm and hand keyframe data in the T2M FBX files.

## Tasks

### 1. Dump arm/hand bone animation data for ALL T2M FBX files

For each FBX file:
- `assets/fbx/t2m_f_walk.fbx`
- `assets/fbx/t2m_m_walk.fbx`
- `assets/fbx/t2m_m_wave.fbx`

Parse with `cinev_retarget::fbx::parse()` and for each of these bones, report:
- `upperarm_l` / `upperarm_r`
- `lowerarm_l` / `lowerarm_r`
- `hand_l` / `hand_r`
- `lowerarm_twist_01_l` / `lowerarm_twist_01_r` (if exists)
- `upperarm_twist_01_l` / `upperarm_twist_01_r` (if exists)

For each bone report:
1. **Has track?** (is it in `fbx.tracks`?)
2. **PreRotation** (from `fbx.bones`)
3. **Rest Rotation Euler** (from `fbx.bones`)
4. **Frame count**
5. **Rotation range**: min/max angle from rest across all frames (degrees)
6. **Key frames with significant rotation** (> 5°): list frame numbers and angles

Write a test function that prints all this as a table.

### 2. Compare CINEV Rush vs T2M

Also analyze `assets/fbx/25_06672_F_DNTSuperSukiShukiRush_260113.fbx` for the same bones. Create a comparison:

```
| Bone | T2M walk range° | T2M wave range° | CINEV rush range° |
```

This shows whether T2M FBX inherently has weak arm animation vs CINEV.

### 3. Check for missing bones

Report if any of these bones are MISSING from the T2M FBX (not in `fbx.bones` at all):
- All twist bones
- lowerarm_l/r
- hand_l/r

T2M (Blender export) might not include twist bones at all.

## Report

Write results to `~/.claude/private/ops/R-021-result.md`:
- Per-bone keyframe table for all 3 T2M FBX + 1 CINEV FBX
- Missing bones list
- Comparison table (T2M vs CINEV arm strength)
- Whether lowerArm has meaningful animation or is effectively static
