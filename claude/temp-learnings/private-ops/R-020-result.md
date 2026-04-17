# R-020 lowerArm rest pose verification — VRM 0.x + 1.0 — Result

**Branch:** `feat/blender-source-type` (bevy-vrm, R-019 이어서)
**Date:** 2026-03-31
**Agent:** 2호기

---

## cargo test

```
30 passed, 0 failed
```

- integration.rs: 25 tests (기존 24 + 신규 1)
- rq_diagnostics.rs: 5 tests

신규 테스트:
1. `lowerarm_identity_all_models` — 8개 VRM 모델 × T2M FBX, full retarget pipeline로 lowerArm identity error 측정

## cargo clippy

```
0 warnings (with -D warnings)
```

---

## Per-bone identity table — lowerArm across all VRM models

FBX: `t2m_f_walk.fbx` (Blender), Config: `cinev_blender_female.json`

| VRM model | file ver | actual ver | grade | leftLowerArm err° | rightLowerArm err° | status |
|-----------|---------|------------|-------|-------------------|-------------------|--------|
| vroid_0x_f_minjoon.vrm | named 0.x | **1.0** | A | 0.00° | 0.00° | OK |
| vrm_0x_f_yoya.vrm | named 0.x | **1.0** | B | 0.00° | 0.00° | OK |
| vrm_0x_m_ghostpumpking.vrm | named 0.x | **1.0** | B | 0.00° | 0.00° | OK |
| p2v_0x_m_phainon.vrm | named 0.x | **1.0** | A | 0.00° | 0.00° | OK |
| vrm_0x_m_moth.vrm | named 0.x | **1.0** | F | 0.00° | 0.00° | OK |
| vrm_0x_m_shimaenaga.vrm | named 0.x | **1.0** | F | 0.00° | 0.00° | OK |
| vroid_1x_f_xiao.vrm | 1.0 | 1.0 | B | 0.00° | 0.00° | OK |
| zepeto_1x_m_001.vrm | 1.0 | 1.0 | F | 0.00° | 0.00° | OK |

**Result: lowerArm identity error = 0.00° for ALL models.** The three-vrm formula correctly handles the MetaHuman A-pose lowerArm flexion.

---

## Critical discovery: NO actual VRM 0.x files in assets

All `*_0x_*.vrm` files are **already pre-converted to VRM 1.0** (VRMC_vrm extension, no VRM extension). The `_0x_` prefix only indicates the original source was VRM 0.x.

Verification method:
```python
# All files have VRMC_vrm extension (1.0), none have VRM extension (0.x)
CoolBanana.vrm: 1.0
p2v_0x_m_phainon.vrm: 1.0
vrm_0x_f_yoya.vrm: 1.0
...all 9 files: 1.0
```

**Implication:** The VRM 0.x code path (`is_vrm0 = true`, identity rest, rest_pose_offsets application) is **untested at the integration level.** All current tests exercise VRM 1.0 only. The `_0x_` models DO have 180°Y root rotation (detected via `has_180y_root`), which exercises some of the coordinate handling, but the `is_vrm0` flag-dependent logic paths (rest_pose_offsets application, VRM 0.x identity formula) remain unexercised.

---

## Formula trace (not needed — no error found)

Since lowerArm identity error = 0.00° across all models, no formula debugging was necessary. The three-vrm formula at `retargeter.rs:806-821`:

```
normalized = parentRestYup × animLocalYup × boneRestYup⁻¹
result = dstRestLocal × dstRestGlobal⁻¹ × normalized × dstRestGlobal
```

correctly cancels the FBX A-pose lowerArm rest rotation, producing `result ≈ dst_rest_local` (the expected identity test outcome for VRM 1.0).

---

## Root cause analysis

**The lowerArm itself is NOT the source of arm misalignment.** The identity test confirms the retarget formula handles lowerArm correctly at rest. If visual misalignment exists, the cause must be elsewhere:

1. **Shoulder width dampening** (`shoulder_ratio=0.67` on vroid_1x_f_xiao) — 33% narrower VRM causes upperArm rotation dampening via `shoulder_slerp_factor`. This is by design but may look like misalignment.

2. **UpperArm A-pose correction** — `detect_apose()` corrects leftUpperArm/rightUpperArm direction using FBX skeleton. If FBX skeleton data is absent (no `fbx_skeleton`), this correction doesn't apply.

3. **Hand/wrist offset** — leftHand/rightHand have rest_pose_offsets with large delta (39°/30°). These affect forearm visual appearance through wrist orientation.

---

## Recommended fix

**No fix needed for lowerArm.** The current implementation correctly handles the A-pose → T-pose rest rotation for lowerArm in both VRM 0.x and 1.0 code paths (at least at the formula level; 0.x path requires actual 0.x VRM for full verification).

**Recommendation for future work:**
- Obtain a genuine VRM 0.x file (unconverted) for integration testing
- Investigate shoulder width dampening as potential source of visual arm misalignment
- The R-019 rest_pose_offsets additions (10 locomotion bones) will only take effect when a real VRM 0.x model is used

---

## Changes

### Rust 소스
1. `crates/cinev_retarget/src/retargeter.rs`
   - `RetargetQuality`에 `identity_details: Vec<(String, f32)>` 필드 추가 (ALL bones, not just fails)
   - `apply()`에서 `identity_details` 수집 + 이름순 정렬

### 테스트
2. `crates/cinev_retarget/tests/integration.rs`
   - `run_full_pipeline()` helper — VRM 로드 → 0.x 변환 → rest pose 추출 → retarget → Retargeter::apply() 전체 파이프라인
   - `lowerarm_identity_all_models` — 8개 VRM × T2M FBX, lowerArm identity error 테이블 출력

### headless CLI 결과

VRM 0.x (실제로는 1.0):
```
[RQ] bones=53 scale=0.975 vrm=1.0 root180=Y shoulder=1.16 arm=0.97
[RQ] identity: PASS 52/52
[RQ] GRADE: A
```

VRM 1.0:
```
[RQ] bones=53 scale=1.016 vrm=1.0 root180=N shoulder=0.67 arm=0.94
[RQ] identity: PASS 52/52
[RQ] GRADE: B (shoulder dampening warning)
```
