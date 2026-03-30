# RQ Diagnostics Report — R-006

## RQ Summary Table

| Combo | Bones | Matched | Unmatched | Duration | BS | lUA | rUA | lH | rH |
|-------|-------|---------|-----------|----------|----|-----|-----|----|----|
| t2m_m_walk + male + v1.0 | 53 | 51 | 0 | 3.6s | 0 | Y | Y | Y | Y |
| t2m_m_wave + male + v1.0 | 53 | 51 | 0 | 6.9s | 0 | Y | Y | Y | Y |
| t2m_f_walk + female + v1.0 | 53 | 51 | 0 | 3.6s | 0 | Y | Y | Y | Y |
| rush + female + v1.0 (baseline) | 53 | 51 | 0 | 17.7s | 0 | Y | Y | Y | Y |
| t2m_m_walk + male + v0.x | 53 | 51 | 0 | 3.6s | 0 | Y | Y | Y | Y |

**Observations:**
- All combos produce 53 bone tracks (root + 51 direct + 1 accumulate)
- 51/51 config bones matched in every FBX (0 unmatched)
- T2M FBX has 0 blend shape channels (body-only, no facial)
- Skeleton: 86 bones in FBX, 53 mapped to VRM

## Known Issue 1: Arm Asymmetry — **REPRODUCED**

Wave FBX raw rotation range (before Retargeter applies rest pose correction):
- leftUpperArm: max 68.9°
- rightUpperArm: max 118.2°
- **Asymmetry: 49.2°**

This is expected from the source animation (waving right hand = larger right arm range). The known issue (rUA=15° vs lUA=4° in identity test) comes from Retargeter's rest-pose correction, which requires VrmRestPose data not available in standalone retarget(). The raw delta difference confirms arm behavior is asymmetric in the source, which amplifies any rest-pose mismatch.

**Status:** Source asymmetry confirmed. Identity-test asymmetry requires Bevy runtime to verify.

## Known Issue 2: Wrist Over-flex — **PARTIALLY REPRODUCED**

Wave FBX wrist rotation (raw deltas):
- leftHand: max=75.6° mean=72.6°
- rightHand: max=100.1° mean=75.5°

Right hand shows 25° higher peak than left, consistent with waving motion. The +18° over-flex issue from docs refers to Retargeter output after damping — raw deltas here are pre-damping. The 100.1° raw right hand rotation is high and likely triggers the documented over-flex after rest-pose application.

**Status:** High raw rotation confirmed. Damping effect requires Retargeter (Bevy runtime).

## Known Issue 3: VRM 0.x 180°Y — **NOT REPRODUCED**

- v1.0 and v0.x produce identical bone track count (53)
- Hips frame0 rotation diff: 0.0°
- mapping::retarget() does not apply 180°Y correction (that's in Retargeter)

**Status:** No difference at mapping level. 180°Y handling is in VrmLoader + Retargeter (Bevy runtime), not testable in standalone.

## New Findings

1. **T2M FBX structure:** 86 bones, DHIbody: prefix, Blender 4.5.4 LTS export. Same MetaHuman skeleton as StoryPreviz static models.
2. **Perfect mapping:** 51/51 direct map bones matched in all T2M FBX — no missing bones. Config is well-aligned with T2M output.
3. **No blend shapes in T2M body FBX:** Facial animation is separate pipeline.
4. **Consistent bone count:** All FBX (T2M + existing CINEV) produce exactly 53 VRM bone tracks.

## Test Infrastructure

- `tests/rq_diagnostics.rs`: 5 tests covering all combos + known issues
- Run: `cargo test -p cinev_retarget --test rq_diagnostics -- --nocapture`
