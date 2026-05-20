---
description: Analyze bevy-vrm viewer screenshots with bone gizmo color reference
argument-hint: "[screenshot_path]"
allowed-tools: Read
user-invocable: true
---

# vrm-debug-screenshot

Analyze bevy-vrm retarget viewer screenshots using the bone gizmo color scheme.

## When to use

When the user shares a screenshot from the bevy-vrm viewer for debugging retarget issues.

## Color Scheme

| Element | Color | Size |
|---------|-------|------|
| **FBX source skeleton** | 🟠 Orange | sphere 0.006 + orange line 50% |
| **VRM left bones** | 🔵 Cyan | sphere 0.008 |
| **VRM right bones** | 🟣 Magenta | sphere 0.008 |
| **VRM spine/chest** | 🟢 Green | sphere 0.008 |
| **VRM head/neck** | 🟡 Yellow | sphere 0.008 |
| **VRM other** | ⚪ Gray | sphere 0.008 |
| **VRM parent lines** | Light green | 40% alpha |
| **Hand dir (VRM L/R)** | Cyan / Magenta | solid line + end sphere |
| **Hand dir (FBX)** | Yellow | solid line |

## Analysis Checklist

When analyzing a screenshot:

1. **Identify which side** — left (cyan) or right (magenta)?
2. **Compare orange (FBX) vs cyan/magenta (VRM)** — bone positions overlapping?
3. **Check finger curl** — do VRM fingers follow FBX finger direction?
4. **Check hand twist** — is VRM palm facing same direction as FBX?
5. **Check arm pose** — A-pose correction applied? Shoulder width difference?
6. **Check spine** — VRM spine overlaps FBX spine?

## Retarget Pipeline Context

```
FBX → cinev_retarget FK (all bones)
  → cinev_retarget::ik IK2 (arms: upperArm, lowerArm, hand)
    → direction correction (swing)
    → palm normal twist correction
    → finger bind pose (static finger curl from FBX)
  → Bevy AnimationClip
```

**Bone ownership:**
- spine, head, legs, **fingers** → FK only (cinev_retarget)
- upperArm, lowerArm → IK2 two-bone solve
- hand → IK2 swing + twist correction
- static fingers → IK2 finger_bind_pose (virtual keyframe)

## Viewer Keys

| Key | Action |
|-----|--------|
| G | Cycle gizmo (off/all/bones/hand-dir) |
| H | Toggle VRM mesh |
| F5 | Toggle FBX skeleton viz |
| F6 | Toggle pure FK (no IK) |
| F | Cycle body FBX |
| Space | Pause/resume |
| ←→ | Step frame |
