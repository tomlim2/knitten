# Hand Rotation Correction — 미해결 문제 분석

Date: 2026-04-02

## 프로젝트 구조

- **Repository:** bevy-vrm (Rust + Bevy + wgpu)
- **Retarget crate:** `crates/cinev_retarget/`
- **IK module:** `crates/cinev_retarget/src/ik.rs`
- **Retarget formula:** `crates/cinev_retarget/src/retargeter.rs` (compute_rotations, line ~812)
- **Viewer:** `src/main.rs` (F6: pure FK toggle)
- **Config:** `assets/retarget/cinev_blender_female.json`
- **Test VRM:** `assets/models/vrm_0x_f_yoya.vrm` (VRM 0.x)
- **Test FBX:** `assets/fbx/25_06672_F_DNTSuperSukiShukiRush_260113.fbx` (mocap with finger data)

## 파이프라인 개요

```
FBX (Blender/MetaHuman, A-pose, Z-up)
  → FK retarget (retargeter.rs)
    formula: parent_rest_yup × anim_local_yup × bone_rest_yup⁻¹
    + VRM 0.x basis change: (-x, y, -z, w)
    + A-pose correction (upperArm only)
  → IK post-pass (ik.rs)
    - full-body FK: hips→spine→chest→upperChest→shoulder→upper→lower→hand
    - two-bone IK: upperArm + lowerArm solve to hit FBX hand position
    - hand rotation: NOT corrected (this is the problem)
  → Bevy AnimationClip
```

## 현재 상태 (정상 동작하는 것)

| 항목 | 상태 | 수치 |
|------|------|------|
| Full-body FK evaluator | ✅ | hips→arm chain, parent world transform 정확 |
| Arm IK position | ✅ | 0.2~0.6cm avg, max 1.5cm |
| Right finger curl (non-thumb) | ✅ | conjugate fix 적용 |
| F6 pure FK toggle | ✅ | skip_apose 상태 누적 버그 수정 |

## 문제: Hand rotation이 source와 다름

IK가 upper/lower arm rotation을 수정하면 hand의 world rotation이 drift. hand의 local rotation(wrist articulation)은 FK retarget에서 올바르게 생성되지만, parent chain이 바뀌어 world rotation이 변함.

### 측정 데이터 (headless CLI)

**IK 전 (FK only, no A-pose correction):**
- hand rotation = FK retarget 결과 그대로

**IK 후 (A-pose + IK):**
- hand world rotation delta (vs FBX source): ~83° avg

**좌표계 정보:**
- FBX: Z-up, cm. coord_rot = Quat::from_rotation_x(-PI/2) 로 Y-up 변환
- FBX skeleton bone_rotations: Z-up native space로 저장 (bone_positions는 Y-up 변환됨)
- VRM: Y-up, meters
- VRM 0.x: retarget 결과에 basis change (-x, y, -z, w) baked
- compute_chain_world: VRM 0.x local_rot에서 basis undo 후 world 계산
- bone_rest_global: glTF native (Y-up, basis change 없음)

### 시도한 접근법과 결과

#### 1. FBX world-space delta matching

```
fbx_delta = coord_rot × (fbx_hand_world[frame] × fbx_hand_world[rest]⁻¹) × coord_rot_inv
target_world = vrm_rest_global × fbx_delta
correction = target_world × current_world⁻¹ → local로 변환
```

**결과:**
- VRM 1.0: 0.0° (완벽)
- VRM 0.x: 15° 잔여 오차 → basis undo/redo 순서 수정 후 0.0°
- **viewer에서 "바깥으로 구부러짐"**

**실패 원인 분석:**
- 수치상 0°인데 시각적으로 틀림
- FBX world delta는 A-pose 팔 방향 기준, VRM rest는 T-pose 기준
- 같은 "delta"라도 팔 방향이 ~78° 다르면 hand orientation이 다르게 나옴
- World-space delta는 pose-dependent → skeleton pose가 다르면 무효

#### 2. FK world rotation 보존

```
target_world = fk_world[hand] (IK 전)
correction = target_world × fk_after[hand]⁻¹ → local로 변환
```

**결과:**
- VRM 0.x: 적용됨
- **viewer에서 차이 불분명 또는 여전히 틀림**

**실패 원인 분석:**
- IK 전 FK world rotation이 "정확한가?" 에 대한 의문
- FK chain에서 upper/lower arm에 A-pose correction이 적용되어 있으므로
  hand의 FK world rotation 자체가 이미 drift된 상태
- "drift된 world rotation을 보존"하는 것은 의미 없음

#### 3. Parent-relative delta from FBX

```
fbx_hand_in_parent[rest] = fbx_lower_world[rest]⁻¹ × fbx_hand_world[rest]
fbx_hand_in_parent[frame] = fbx_lower_world[frame]⁻¹ × fbx_hand_world[frame]
local_delta = hand_in_parent[rest]⁻¹ × hand_in_parent[frame]
local_delta_yup = coord_rot × local_delta_zup × coord_rot_inv
target_local = vrm_hand_rest_local × local_delta_yup (with VRM 0.x basis undo/redo)
```

**결과:**
- 수치상 올바른 축/각도
- VRM 0.x basis 처리 포함
- **viewer에서 수치적 0°인데 바깥으로 구부러짐**

**실패 원인 분석:**
- coord_rot 변환이 parent-relative delta에 올바르게 적용되는지 불확실
- FBX parent(lowerArm)의 world rotation과 VRM parent의 world rotation이 다른 space
- Parent-relative이면 pose-independent일 것 같지만, parent 자체의 rest orientation이 다르면 "relative"의 의미가 달라짐

## 핵심 난점

1. **Space mismatch:** FBX rotation(Z-up)과 VRM rotation(Y-up + VRM 0.x basis)의 변환이 복잡
2. **Rest pose 차이:** FBX는 A-pose, VRM은 T-pose. ~78° arm direction 차이가 hand에 전파
3. **Retarget formula 자체:** `parent_rest × anim_local × bone_rest⁻¹`가 hand에서 올바른 world orientation을 생성하는지 검증 필요
4. **측정 vs 시각의 불일치:** CLI에서 0° 오차인데 viewer에서 틀려 보임. 측정 방법 자체에 문제가 있을 수 있음

## 관련 데이터: Finger curl axis comparison

```
leftIndexProximal:
  fbx_raw:   axis=(0.04, -0.06, 1.00)  angle=68.0°
  retarget:  axis=(-0.36, 0.22, 0.91)  angle=68.0°
  → Z축 방향 보존 ✅ (left는 retarget이 올바름)

rightIndexProximal:
  fbx_raw:   axis=(-0.03, -0.10, 0.99) angle=68.0°
  retarget:  axis=(-0.26, -0.40, -0.88) angle=68.0° ← Z 반전! (conjugate로 수정됨)
  after fix: axis=(0.28, 0.44, 0.85)   angle=68.0° ✅
```

Right finger는 retarget formula가 Z축을 반전시킴 → `result.conjugate()` 로 수정.
단, Thumb은 multi-axis rotation이므로 conjugate에서 제외.

## CLI 명령어 (재현/측정용)

```bash
# Headless retarget (finger diagnostics 포함)
cargo run --manifest-path crates/cinev_retarget/Cargo.toml --bin headless -- \
  assets/models/vrm_0x_f_yoya.vrm \
  assets/fbx/25_06672_F_DNTSuperSukiShukiRush_260113.fbx \
  assets/retarget/cinev_blender_female.json

# IK tests
cargo test -p cinev_retarget ik_ -- --nocapture

# Viewer (F6: pure FK toggle)
cargo run --bin bevy-vrm
```

## 코드 위치

| 파일 | 위치 | 내용 |
|------|------|------|
| `ik.rs:104` | `compute_chain_world()` | FK chain evaluator (hips→hand) |
| `ik.rs:166` | `build_chain_to_hips()` | Parent map walk |
| `ik.rs:38` | `two_bone_ik_solve()` | Cosine-rule IK solver |
| `ik.rs:199` | `apply_ik_post_pass()` | IK orchestrator (hand correction 위치: ~line 405) |
| `ik.rs:188` | `world_to_local_correction()` | World→local delta 변환 |
| `retargeter.rs:812` | `compute_rotations()` | FK retarget formula |
| `retargeter.rs:882` | finger damping | 90° hard clamp + right finger conjugate |
| `retargeter.rs:916` | basis change | VRM 0.x (-x, y, -z, w) |
| `lib.rs:93` | `FbxSkeletonFrames` | FBX world positions (Y-up) + rotations (Z-up) |

## 다음 세션에 확인해볼 것

1. **FK retarget 결과 자체가 hand에서 올바른가?**
   - IK 없이 (F6 OFF → FK+APOSE only) hand world rotation을 FBX source와 비교
   - FBX viz (cyan skeleton)와 VRM mesh가 hand에서 어떻게 차이나는지

2. **측정 방법 재검토:**
   - "hand world rotation delta" 비교가 올바른 metric인가?
   - Bone direction vector (hand→finger tip) 비교가 더 직관적?
   - Viewer에 hand rotation delta를 시각적으로 표시?

3. **VRM 0.x basis change가 hand에 미치는 영향:**
   - compute_chain_world에서 basis undo → world rot 계산 → hand correction에서 basis redo
   - 이 과정에서 space mismatch 가능성

4. **UE5 IK Retargeter 참고:**
   - UE5는 hand rotation을 어떻게 처리하는가?
   - Full-body IK인가, limb IK + hand FK인가?
