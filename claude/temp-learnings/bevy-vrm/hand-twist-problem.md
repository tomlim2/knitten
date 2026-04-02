# Hand Twist Correction — 미해결 문제 분석

Date: 2026-04-02

## 요약

IK2 direction correction이 swing(hand→finger 방향)은 0.0°로 맞추지만 **twist(손바닥 회전)를 전혀 보정하지 않음**. twist error = 81~163°. 이것이 bone-mesh mismatch의 근본 원인.

## 프로젝트 구조

- **Repository:** bevy-vrm (Rust + Bevy + wgpu)
- **IK retarget crate:** `crates/ik_retarget/`
- **IK solver:** `crates/ik_retarget/src/solver.rs`
- **IK chain/FK eval:** `crates/ik_retarget/src/chain.rs`
- **IK orchestrator:** `crates/ik_retarget/src/lib.rs`
- **FK retarget:** `crates/cinev_retarget/src/retargeter.rs`
- **Legacy IK (unused, redundant):** `crates/cinev_retarget/src/ik.rs`
- **Viewer:** `src/main.rs`

## 파이프라인 (현재)

```
FBX → cinev_retarget FK (전체 52 bone)
  → cinev_retarget Legacy IK (arm chain) ← redundant, IK2가 덮어씀
  → ik_retarget IK2 (arm chain: upperArm, lowerArm, hand)
  → Bevy AnimationClip
```

**Bone 소유권:**
- spine, head, neck, legs, **fingers** → FK only
- upperArm, lowerArm → IK2 two-bone solve
- hand → IK2 direction correction (swing only)

## 문제: Direction correction = swing only, no twist

### 현재 코드 (lib.rs:408-437)

```rust
// Step 5: Effector direction correction
let dir_corr = Quat::from_rotation_arc(vrm_fwd, src_dir);  // swing only!
let local_corr = solver::world_to_local(dir_corr, lower_world);
let new_native = (local_corr * cur_native).normalize();
```

`from_rotation_arc(a, b)` = a를 b로 맞추는 최단 호 회전 = **swing만, twist 없음**.

### 측정 데이터 (wave FBX + VRM 1.0 vroid_1x_f_xiao)

| Arm | swing (dir_err) | twist_est | pos_err |
|-----|-----------------|-----------|---------|
| Left | 0.0° | **162.6°** | 0.1cm |
| Right | 0.0° | **81.1°** | 0.1cm |

twist_est = `|full_rotation_delta - dir_err|` (근사치). FBX bone_rotations은 Z-up native space라 좌표계 offset 포함 가능.

### 시각적 증상

- bone gizmo의 hand→finger 방향(yellow line)은 FBX source(magenta)와 일치
- 하지만 손바닥이 틀어져 있음 → mesh가 bone 방향과 다르게 보임
- 팔 펴진 상태(rest 근처)에서는 양호, 팔 들면 악화

## 해결 방향

### 접근 1: FBX hand world rotation에서 twist 추출

```
fbx_hand_world_yup = coord_rot × fbx_hand_world_zup × coord_rot_inv
vrm_hand_world = fk_final[effector].1  (IK2 direction correction 후)

full_delta = fbx_hand_world_yup × vrm_hand_world⁻¹
(swing, twist) = swing_twist_decompose(full_delta, hand_forward_axis)
→ twist만 추가 적용
```

swing은 이미 direction correction에서 처리됨. twist만 따로 뽑아서 적용.

**주의:** FBX bone_rotations은 Z-up native space (lib.rs:93). Y-up 변환 필요.
현재 FbxSkeletonFrames에 bone_rotations이 있지만 coord_rot 변환이 안 된 상태.

### 접근 2: FK twist 보존 확장

현재 IK2는 upper arm의 FK twist를 보존함 (lib.rs:398-402):
```rust
let (_, fk_twist) = solver::swing_twist(bones[ui].rotations[frame], bone_axis);
let (ik_swing, _) = solver::swing_twist(new_upper_local, bone_axis);
new_upper_local = (ik_swing * fk_twist).normalize();
```

hand에도 유사하게 FK twist를 보존할 수 있지만, FK hand rotation 자체가 identity-rest 문제로 부정확할 수 있음.

### 접근 3: Source hand world rotation 직접 복원

IK2 goal에 hand world rotation을 추가하고, direction correction 대신 full rotation matching:

```rust
// IkGoal에 hand_world_rotation: Option<Quat> 추가
// solve_chain에서 hand rotation = source hand world rot을 target local로 변환
target_hand_local = parent_world⁻¹ × source_hand_world_yup
```

가장 직관적이지만 FBX↔VRM rest pose 차이를 처리해야 함.

## 코드 위치

| 파일 | 위치 | 내용 |
|------|------|------|
| `ik_retarget/lib.rs:408-437` | direction correction | swing only, twist 추가 필요 |
| `ik_retarget/lib.rs:439-456` | error measurement | dir_err + twist_est 측정 |
| `ik_retarget/lib.rs:398-402` | FK twist preserve | upper arm twist 보존 패턴 |
| `ik_retarget/solver.rs` | `swing_twist()` | swing-twist decomposition 유틸 |
| `ik_retarget/lib.rs:164-195` | `extract_goal()` | IK goal 추출 — rotation 미포함 |
| `cinev_retarget/lib.rs:99` | `bone_rotations` | FBX world rot (Z-up native) |

## CLI 명령어

```bash
# Viewer (IK2 활성)
cargo run --bin bevy-vrm

# Headless (cinev_retarget만, IK2 미포함)
cargo run --manifest-path crates/cinev_retarget/Cargo.toml --bin headless -- \
  assets/models/vroid_1x_f_xiao.vrm \
  assets/fbx/t2m_m_wave.fbx \
  assets/retarget/cinev_blender_female.json
```

## 시도한 접근과 결과

### 접근 1 시도: swing_twist decomposition (실패)

```rust
// FBX hand world rot (Z-up) → Y-up
let fbx_world_yup = coord_rot × fbx_rot_zup × coord_rot_inv;
// Full delta
let full_delta = fbx_world_yup × vrm_world⁻¹;
// Decompose along hand forward axis
let (_, twist) = swing_twist(full_delta, src_dir);
// Apply twist as world→local correction
```

**결과:**
- Left: 162.6° → 108.7° (약간 개선)
- Right: 81.1° → 128.9° (악화!)

**실패 원인 후보:**
1. `swing_twist` decomposition의 축 방향 문제 — src_dir의 부호가 left/right에서 반대
2. FBX bone_rotations가 pure world rotation이 아닌 다른 공간일 수 있음 (pre_rot 포함?)
3. twist 적용 시 world_to_local 변환에서 parent space 불일치
4. twist_est 측정 자체가 부정확 (|full_err - dir_err|는 근사치)

**다음 시도 전 확인 필요:**
- FBX hand world rotation을 frame 0에서 직접 비교 (값 출력)
- VRM hand world rotation과 pixel-level 비교
- Rest pose에서의 delta 확인 (rest = 0이어야 맞음)

## 관련 문서

- `hand-rotation-problem.md` — 이전 세션의 hand rotation 3가지 시도 (FK 단계)
- `experiments-bone-mesh-mismatch.md` — identity rest 실험 (EXP-001~003)
- `devlog-2026-04-02.md` — Day 4 작업 일지
