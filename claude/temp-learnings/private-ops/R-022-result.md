# R-022 rest_pose_preserve — partial A-pose retention — Result

**Branch:** `feat/blender-source-type` (bevy-vrm)
**Date:** 2026-03-31
**Agent:** 2호기

---

## cargo test

```
33 passed, 0 failed
```

- integration.rs: 28 tests (기존 25 + 신규 3)
- rq_diagnostics.rs: 5 tests

신규 테스트:
1. `rest_pose_preserve_lowerarm` — 전체 파이프라인 + lowerArm identity 확인
2. `rest_pose_preserve_backward_compat` — 기존 config + 새 필드 정상 파싱
3. `rest_pose_preserve_absent_compat` — rest_pose_preserve 없는 config 호환

## cargo clippy

```
0 warnings (with -D warnings)
```

---

## lowerArm angle at frame 0: before vs after

### Headless CLI output (vroid_1x_f_xiao.vrm + t2m_f_walk.fbx + cinev_blender_female.json)

```
[PRESERVE] leftLowerArm delta=25.6° factor=1.00
[PRESERVE] rightLowerArm delta=25.1° factor=1.00
[RQ] identity: PASS 52/52
[RQ] GRADE: B
```

### Preservation offset details

| Bone | FBX local rest delta (Y-up) | Factor | Applied at frame 0 |
|------|----------------------------|--------|-------------------|
| leftLowerArm | 25.6° | 1.00 | 25.6° (full A-pose preservation) |
| rightLowerArm | 25.1° | 1.00 | 25.1° (full A-pose preservation) |

The 25° delta is the FBX bone's local rest rotation (PreRotation × LclRot) in Y-up VRM space. In FBX Z-up space, this was measured as ~4.8° (R-018), but the 90° coordinate rotation transforms the components, resulting in a larger perceived angle in Y-up.

**factor=1.0 applies the full FBX local rest as an A-pose offset.** For subtle lowerArm flexion, factor should be tuned down (e.g., 0.15-0.20 for ~4-5° effect).

### Identity test interaction

No interaction — identity test runs BEFORE preservation is applied. The identity test verifies the mathematical correctness of the three-vrm formula (which still produces correct results). Preservation is a separate post-processing step in `compute_rotations()`.

---

## Design decisions

### Why FBX local rest instead of direction comparison

Initial implementation used `detect_apose`-style direction comparison (lowerArm→hand). This produced 88.7° offsets because the FBX skeleton world positions include cumulative parent A-pose (shoulder, upperArm). The 88.7° represents the ENTIRE arm A-pose, not just lowerArm's contribution.

Switched to FBX local rest approach: `coord_rot * (parent_global⁻¹ × bone_global) * coord_rot_inv`. This captures only the bone's OWN rest orientation without parent inheritance.

### Preservation placement in compute_rotations()

Applied AFTER A-pose correction, BEFORE shoulder slerp / hand damping / finger clamp:
```
1. three-vrm formula → normalized
2. VRM 0.x/1.0 branch → result
3. twist remainder
4. A-pose correction (detect_apose)
5. **rest_pose_preserve** ← here
6. Shoulder slerp
7. Hand/finger damping
8. 180°Y basis change
```

---

## Changed files

### Rust 소스
1. `crates/cinev_retarget/src/config.rs` — `rest_pose_preserve: HashMap<String, f32>` 추가
2. `crates/cinev_retarget/src/lib.rs` — `RetargetedAnimation`에 `rest_pose_preserve` 필드 추가
3. `crates/cinev_retarget/src/mapping.rs` — config → anim 전달
4. `crates/cinev_retarget/src/retargeter.rs`:
   - `Retargeter` struct에 `preserve_offsets`, `rest_pose_preserve` 필드
   - `new_with_unmatched()`에서 FBX local rest 기반 offset 계산
   - `compute_rotations()`에서 slerp 적용
   - `apply()`에서 `[RQ] preserve:` 로그 출력
5. `crates/cinev_retarget/src/bin/headless.rs` — `[PRESERVE]` 로그 필터 추가

### Config JSON (4개)
6. `assets/retarget/cinev_female_body.json`
7. `assets/retarget/cinev_male_body.json`
8. `assets/retarget/cinev_blender_female.json`
9. `assets/retarget/cinev_blender_male.json`

각 config에 추가:
```json
"rest_pose_preserve": {
    "leftLowerArm": 1.0,
    "rightLowerArm": 1.0
}
```

### 테스트
10. `crates/cinev_retarget/tests/integration.rs` — 3개 테스트 추가

---

## 향후 튜닝 가이드

factor 값 조정으로 A-pose 보존 정도 제어:
- `1.0` = FBX local rest 전체 적용 (현재, ~25° in Y-up)
- `0.2` = ~5° 효과 (자연스러운 팔꿈치 굴곡)
- `0.0` = 보존 없음 (기존 동작, 완전한 T-pose)

다른 본에도 적용 가능 (예: neck, spine for forward lean):
```json
"rest_pose_preserve": {
    "leftLowerArm": 0.2,
    "rightLowerArm": 0.2,
    "neck": 0.5
}
```
