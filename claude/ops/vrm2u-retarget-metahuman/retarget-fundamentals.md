# Retarget Fundamentals — Industry Research

*2026-03-31 | Source: academic papers, engine docs, GDC, industry blogs*

## 6 Pillars (Industry Consensus)

| # | Pillar | Core Question | cinev_retarget |
|---|--------|---------------|----------------|
| 1 | Bone Mapping | "this bone = that bone" | `direct_map`, `source_prefix` |
| 2 | Rest Pose Alignment | "match the reference pose" | `rest_pose_offsets` |
| 3 | Proportion Compensation | "different body, same motion feel" | `shoulder_ratio`, `scale_ratio` |
| 4 | Rotation Transfer (FK) | "copy joint rotations" | `mapping.rs` core |
| 5 | IK Correction | "hands/feet hit their targets" | ❌ not implemented |
| 6 | Root Motion | "scale movement for height" | hips translation scaling |

Additional: coordinate system conversion (FBX Z-up ↔ VRM Y-up), twist bone distribution (`twist_fold`). Both implemented.

## Engine Approaches

| Engine | Strategy |
|--------|----------|
| UE5 IK Retargeter | Chain-based mapping + FK/IK mode per chain + root horizontal/vertical separate scaling |
| Unity Mecanim | Muscle-space normalization (rotations as 0.0~1.0 range → body-agnostic) |
| HumanIK (Autodesk) | Full-body IK solver + Reach parameters for contact priority |

## Key Papers

| Paper | Year | Venue | Contribution |
|-------|------|-------|-------------|
| Gleicher, "Retargetting Motion to New Characters" | 1998 | SIGGRAPH | Spacetime constraints optimization |
| Monzani et al., intermediate skeleton + IK | 2000 | Eurographics | Three-phase pipeline, per-frame IK |
| Hecker et al., Spore runtime retargeting | 2008 | SIGGRAPH | Morphology-independent anim repr + runtime IK |
| Aberman et al., skeleton-aware deep retargeting | 2020 | SIGGRAPH | Learned latent space, no paired data |

Recent: SAME (skeleton-agnostic embedding), HuMoT (transformer), ReConForM 2025 (contact-aware real-time).

## Abstract: What Makes a Good Retargeter

> A good retargeter transfers the **intent** of source animation onto the target character's body.

Two axes of quality:

**Fidelity** — don't lose what the source expressed.
- Angular fidelity (FK): "arm raised 45°" → target arm raised 45°
- Spatial fidelity (IK): "hand at shoulder height" → target hand at shoulder height
- These diverge when proportions differ. FK copies angles, IK copies meaning.

**Plausibility** — result must be physically valid on target body.
- No self-intersection (arm through torso)
- No ground penetration / floating feet
- No unnatural joint compression (shoulder shrug artifacts)

cinev_retarget current state: FK fidelity focused, IK correction absent (pillar 5 gap).
Blender source type work = pillar 3 refinement (proportion compensation per source type).

## Known Issue: lowerArm rest_pose_offset Missing

**Severity: HIGH** — MetaHuman A-pose has lowerArm forward flexion, but `rest_pose_offsets` only covers shoulder, upperArm, hand. lowerArm offset is absent.

R-016 fidelity metric did NOT catch this because fidelity measures pre/post damping ratio, not rest pose correctness. A missing offset means constant rotational error baked into every frame — invisible to fidelity metric.

**Symptom:** Arms visually misaligned (slightly bent) in all retarget output. Previously misattributed to other causes.

**Fix:** Full-body rest pose audit — measure ALL bones in direct_map against VRM T-pose, auto-generate complete rest_pose_offsets. Not just lowerArm. The manual 6-bone approach was the root mistake.

**R-018 scope (after R-017):**
1. Extract PreRotation + Lcl Rotation for every direct_map bone from MetaHuman FBX
2. Compute delta angle vs VRM T-pose for each bone
3. Auto-generate complete rest_pose_offsets (threshold: >1° delta)
4. Add rest pose residual check to fidelity validator — warn if any bone has uncompensated offset

## Production Details

**Bone Mapping:** Name-pattern matching (wildcards), fixed-slot arrays (67 bones in BsRetargetTools), chain grouping (UE5). Naming inconsistency = "silent pipeline killer."

**Rest Pose:** A-pose preferred over T-pose in modern pipelines (better shoulder deformation). Offset = rotation difference between source/target rest per joint.

**Proportion:** Three strategies — (1) translation scaling (Gleicher), (2) muscle normalization (Unity), (3) IK end-effector pinning (HumanIK, UE5).

**Twist Bones:** Not directly retargeted. Driven by parent joint twist %. Ignored by retargeter, reconstructed by target rig constraints. Standard: 1-2 forearm, 1 upper arm. Gimbal lock risk at ±180° twist boundary.

**Root Motion:** Separate horizontal/vertical scaling. Without it → "root drift" (locally optimal, globally wrong).
