# cinev_retarget vs mhblender_retarget 비교

Date: 2026-04-01

## 요약

같은 MetaHuman 스켈레톤이지만 FBX exporter에 따라 bone orientation 인코딩이 다름.
두 crate는 이 차이를 각각 다른 방식으로 처리한다.

| | cinev_retarget | mhblender_retarget |
|---|---|---|
| **대상 FBX** | Maya export (CINEV 파이프라인) | Blender export (T2M 등) |
| **PreRotation** | bone별 실제 orientation 포함 | **전부 identity** |
| **bone orientation 소스** | FBX PreRotation 필드 직접 사용 | rest_translation 기하학에서 역산 |
| **retarget 수식** | three-vrm FK 공식 (src_rest = PreRotation) | delta-from-rest (bone_orient 대체) |
| **A-pose correction** | detect_apose (direction-based) | bone_orient에 내포 (별도 단계 없음) |

## FBX 인코딩 차이

### Maya export (CINEV)
```
DHIbody:upperarm_l  pre=(-0.024, 0.420, -0.014, 0.907)  ← bone orientation ≈ 49°
                    rest_euler = identity (0,0,0)
                    anim = absolute rotation
```
PreRotation에 bone의 실제 방향이 들어있고, rest rotation(Lcl Rotation)은 거의 identity.
**full_local = PreRotation × Lcl_Rotation** → PreRotation이 bone orientation.

### Blender export (T2M)
```
DHIbody:upperarm_l  pre=(0, 0, 0, 1)  ← IDENTITY
                    rest_euler = (51.7, 43.4, -51.7)°  ← bone orientation이 여기 baked
                    anim = absolute rotation (rest 포함)
```
Blender는 bone을 항상 +Y axis로 강제하고, PreRotation을 무시.
bone orientation이 rest rotation에 합쳐져 있어서 **분리 불가**.

### 원인
Blender FBX exporter의 알려진 한계 ([Blender issue T53620](https://projects.blender.org/blender/blender-addons/issues/53620)).
Blender bone은 구조적으로 +Y 방향 강제 → Maya의 임의 bone orientation 개념 미지원.

## 접근 방식 차이

### cinev_retarget: PreRotation을 src_rest로 사용

```rust
// retargeter.rs — three-vrm FK formula
src_rest = bone.pre_rotation  // Maya FBX에서 직접
result = src_rest_inv * parent_rest_inv * anim_rotation * ...
```

- Maya FBX의 PreRotation이 정확하므로 수식이 그대로 동작
- Blender FBX에서는 PreRotation = identity → src_rest가 무의미 → **arm correction 필요 (detect_apose)**
- detect_apose가 direction-based로 correction 생성하지만 FK arcing error 발생

### mhblender_retarget: rest_translation에서 bone orientation 역산

```rust
// bone_orient.rs
child_dir = child_bone.rest_translation.normalize();
ref_axis = reference_axis_for_bone(name);  // 팔: Vec3::X, 다리: Vec3::NEG_Z 등
orientation = Quat::from_rotation_arc(ref_axis, child_dir);

// mapping.rs — delta-from-rest
full_local = bone_orient × rest_lcl
deltas = rest_inv × anim_rotation  // rest 기준 delta만 추출
```

- PreRotation 대신 parent→child 방향 벡터로 bone orientation 재구성
- reference_axis는 bone 이름 기반 heuristic (팔=X, 다리=-Z, spine=Z)
- **detect_apose 불필요** — bone_orient이 이미 rest pose 차이를 흡수

## Arm Position 비교 (Y-up, frame 0)

### T2M Blender FBX rest pose
```
upperarm_l  (0.161, 1.304, -0.003)  ← shoulder 높이
lowerarm_l  (0.208, 1.080,  0.009)  ← 22cm 아래 (거의 수직)
hand_l      (0.213, 0.860,  0.074)  ← 44cm 아래 (팔이 늘어뜨린 상태)
```

### CINEV Maya FBX rest pose
```
upperarm_l  (0.158, 1.311,  0.048)  ← shoulder 높이 (유사)
lowerarm_l  (0.312, 1.141,  0.048)  ← 17cm 아래 + 15cm 옆으로
hand_l      (0.466, 0.971,  0.048)  ← 팔이 비스듬히 내려간 A-pose
```

**같은 MetaHuman A-pose**인데 Blender export에서 bone orientation이 rest rotation에 baked되어
위치 해석이 완전히 달라짐. Maya는 PreRotation이 방향을 잡아주므로 A-pose가 보이지만,
Blender는 identity PreRotation이라 팔이 수직으로 늘어진 것처럼 보임.

## Arm Diagnostics 비교

### cinev_retarget (Blender FBX)
```
leftUpperArm:
  src_rest(local): (0,0,0,1) = IDENTITY  ← PreRotation 없음
  delta(vrm_g⁻¹×src_yup): 85.9°         ← VRM T-pose와 큰 차이
  f0_retarget: angle=48.8° (detect_apose 적용 후에도 큼)
```

### mhblender_retarget (Blender FBX)
```
leftUpperArm:
  src_rest(bone_orient): (0.0000,-0.0033,0.0141,0.9999)  ← 역산된 orientation (작음)
  delta(vrm_g⁻¹×src_yup): 117.1°                         ← 더 큰 차이
  f0_retarget: angle=48.8°
```

**현재 두 방식 모두 arm retarget 품질 문제 있음.**
- cinev_retarget: detect_apose의 arcing error (~5-8cm Z offset)
- mhblender_retarget: bone_orient의 reference_axis heuristic 부정확 (좌우 비대칭)

## 미해결 이슈

1. **bone_orient reference_axis 정밀도** — `Vec3::X` (좌팔) / `Vec3::NEG_X` (우팔) heuristic이 MetaHuman의 실제 bone roll을 반영하지 못함. Maya PreRotation을 ground truth로 config에 넣으면 해결 가능.

2. **FK vs IK** — bone_orient을 완벽하게 복원하면 FK만으로 풀릴 수 있으나, 현재 정밀도로는 IK post-correction이 필요할 수 있음.

3. **오픈소스 부재** — Blender FBX PreRotation 복원 문제는 업계 공통이지만 기존 오픈소스 해결책 없음.

## 파일 위치

| 파일 | 역할 |
|------|------|
| `crates/cinev_retarget/src/retargeter.rs` | three-vrm FK 수식, detect_apose |
| `crates/cinev_retarget/src/mapping.rs` | Maya FBX → VRM 매핑 |
| `crates/mhblender_retarget/src/bone_orient.rs` | rest_translation 기반 bone orientation 복원 |
| `crates/mhblender_retarget/src/mapping.rs` | Blender FBX → VRM 매핑 (delta-from-rest) |
| `assets/retarget/cinev_blender_female.json` | Blender FBX용 config |
| `assets/retarget/cinev_female_body.json` | Maya FBX용 config |
