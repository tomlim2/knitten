---
description: Analyze retarget viewer screenshots for bone/skinning/viz issues
allowed-tools: Read
user-invocable: true
platforms: all
portability: adapter
---

# review-audit-retarget

Analyze VRM retarget viewer screenshots to diagnose bone alignment, skinning, and FBX visualization issues.

## Purpose

When looking at a bevy-vrm viewer screenshot, systematically check every visual element and report what's correct and what's wrong. This replaces guessing — do TWO passes (first pass identifies elements, second pass judges correctness).

---

## Visual Elements Reference

### Color Guide
| Element | Color | What it shows |
|---------|-------|---------------|
| VRM bone gizmo | Green/Yellow/Blue/Red spheres + axes | VRM skeleton joint positions |
| VRM bone connections | White lines (0.4 alpha) | Parent-child bone hierarchy |
| FBX viz skeleton | **Cyan** spheres + lines | Source FBX animation bone positions |
| Ground grid | Gray lines | World origin reference |
| Origin axes | Red(X) Green(Y) Blue(Z) | World coordinate axes |
| Bone axis gizmo | RGB mini-axes on each bone | Local bone orientation |

### Bone Colors
- **Green**: hips, spine, chest, upperChest
- **Yellow**: neck, head
- **Blue**: left side bones (leftUpperArm, leftLowerArm, and similar VRM names)
- **Red**: right side bones (rightUpperArm, rightLowerArm, and similar VRM names)
- **Gray**: other bones

---

## Audit Checklist (TWO PASSES)

### Pass 1: Identify what you see
Go through each item and describe what's visible:

1. **Character direction** — Which way is the character facing? Check: can you see the face or the back of the head? Hair flowing direction? If you see the back/nape → character is facing AWAY from camera = **backward**. If you see eyes/face → facing camera = **forward**. This is a critical coordinate system indicator.
2. **Mesh integrity** — Is the mesh solid and complete, or is it torn/stretched/inside-out?
3. **Deformation anomalies** — Scan each body part individually for unnatural distortion:
   - **Shoulders/arms**: Are any limbs stretched to unnatural length (rubber band effect)? Are shoulders pinched or collapsed?
   - **Hands/fingers**: Are fingers splayed unnaturally, or balled into a fist when they shouldn't be?
   - **Neck/head**: Is the head twisted at an impossible angle? Is the neck stretched like a giraffe?
   - **Torso**: Is the chest/waist twisted or compressed unnaturally?
   - **Legs/feet**: Are knees bending backward? Are legs twisted at impossible angles?
   - **Hair/accessories**: Are hair/cloth physics objects stretching to infinity or intersecting the body?
   - **Skirt/clothing**: Is it clipping through the body or deformed in a way that doesn't match the pose?
4. **Bone-mesh alignment** — Do the bone gizmos (colored spheres) sit inside the mesh body, or are they offset?
5. **FBX viz overlap** — Does the cyan skeleton align with the VRM bone gizmos?
6. **Arm position** — Are VRM arms matching FBX arms, or are they in opposite directions?
7. **Leg position** — Are VRM legs matching FBX legs?
8. **Spine/torso** — Is the torso upright and following the FBX?
9. **Hips position** — Is the VRM hips (green sphere) at the same height/position as FBX pelvis (cyan)?
10. **Left-right symmetry** — Does left VRM match left FBX, or are sides swapped?
11. **Scale** — Is the VRM character the same size as the FBX skeleton?

### Pass 2: Judge correctness
For each item, classify as:
- **OK** — correct, matches expected behavior
- **WRONG** — clearly incorrect, describe what's wrong
- **SUSPECT** — might be wrong, needs log verification

---

## Log Cross-Reference

After visual audit, check these log values:

| Log line | What to check | Good value |
|----------|--------------|------------|
| `root: rot=` | Root bone rotation | `(0,0,0,1)` = IDENTITY |
| `root_rot_diff=` | Root rotation vs FBX | < 1° |
| `root_d=` | Root position distance | < 0.005m |
| `hips_d=` | Hips position distance | < 0.06m |
| `LIMB leftUpperLeg` | Leg accuracy | < 10° |
| `LIMB leftUpperArm` | Arm accuracy | < 20° (with A-pose) |
| `LIMB spine` | Spine accuracy | < 12° |
| `root: vrm=(...) fbx=(...)` | Position sign match | X,Z signs should match |

---

## Common Issues and Visual Signatures

| Visual Symptom | Likely Cause |
|----------------|-------------|
| Character facing backward (see back of head/nape, not face) | 180°Y not compensated (missing model entity rotation or mesh strip). Check `forward` log value — should be `(0,0,1)` for +Z forward |
| Mesh torn/stretched at joints | Skinning broken (IBM mismatch or bone/mesh coordinate space conflict) |
| Rubber band limbs (arms/legs stretched to extreme length) | Bone position wildly wrong for one joint — check if a single bone has incorrect global transform |
| Shoulder/neck pinched or collapsed | Weight painting or IBM issue on specific joints |
| Head twisted at impossible angle | Neck/head bone rotation mapping incorrect |
| Fingers splayed or clenched wrongly | Hand bone retarget mismatch or missing finger tracks |
| Hair/accessories stretching to infinity | Spring bone or physics anchor bone in wrong coordinate space |
| Knees bending backward | IK or leg bone rotation axis flipped |
| Arms in opposite direction | A-pose correction missing or wrong |
| Left-right swapped | X axis flipped (180°Y strip without translation negate) |
| Mesh floating above skeleton | Scale or position offset wrong |
| FBX viz 180° from VRM | FBX viz not in same coordinate space as VRM GlobalTransform |
| Bone gizmos inside mesh but arms wrong | Bone positions correct but rotations wrong (A-pose issue) |

---

## Usage

When the user shows a screenshot:

1. Read the image file
2. Run Pass 1 (identify all elements)
3. Run Pass 2 (judge correctness)
4. Cross-reference with any visible log text in the screenshot
5. Give a clear verdict: what's working, what's broken, what to fix next
