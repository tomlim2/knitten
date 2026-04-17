# bevy-vrm Learnings

## 2026-03-27: Wrist/Finger Joint Limits + RQ 진단 시스템

### 요약
Wrist crease와 finger 과굽힘 문제를 joint rotation limit으로 해결. RQ(Retarget Quality) 3-tier 로그 시스템 구축. FBX scan에서 twist bone 부재 발견.

---

### 핵심 발견

1. **이 CINEV FBX에 twist bone이 없다** — `lowerarm_twist_01/02` 부재. `twist_fold` config가 no-op.
   - twist distribution 시도 5회 모두 무의미했던 이유
   - wrist crease 원인은 twist fold가 아니라 **hand bone의 큰 rest rotation** (PreRot=90° + LclRest=107° ≈ 140°)

2. **VRM skinning weight가 얇다** — xiao_vroid wrist transition = 90 verts / 12.1%
   - MetaHuman은 4개 본에 분산, VRM은 2개 본만 → 구조적 한계
   - 어떤 retarget 공식을 써도 VRM mesh가 극단적 wrist rotation을 수용 불가

3. **thumb_01이 direct_map에 없어서 매핑 안 됨** — `vrm_version_overrides`에만 있었음
   - `resolve_vrm_bone()`은 `direct_map` 순회 시에만 호출 → override만으로는 불충분
   - `direct_map`에 추가 후 해결 (bones 51→53)

4. **xiao_vroid.vrm(1.0)에 leftThumbIntermediate 없음** — 3본 엄지 (Metacarpal, Proximal, Distal)
   - VRM 1.0 스펙은 4본이지만 VRoid Studio는 3본으로 export

### Joint Limit 시스템

| 관절 | 방식 | Threshold | Ratio/Max |
|------|------|-----------|-----------|
| Wrist (leftHand/rightHand) | Soft damping | 60° | 0.3 (excess × 0.3) |
| Finger (모든 손가락) | Hard clamp | — | 90° max |

**Damping 공식**: `angle > threshold ? threshold + (angle - threshold) * ratio : angle`
- 60° 이하: 그대로 통과
- 60° 초과: 초과분의 30%만 적용
- 예: 100° → 60° + 40° × 0.3 = 72°

**왜 clamp이 아니라 damping**: palm rotation(twist)도 같은 quaternion magnitude에 포함되어 hard clamp하면 손바닥 뒤집기 불가

**왜 finger는 hard clamp**: 해부학적 한계 90°, 방향 구분 불필요

### RQ(Retarget Quality) 3-Tier 로그 시스템

```
[RQ] bones=53 scale=1.017 vrm=1.0 root180=N     ← Init (1회)
[RQ] identity: PASS 52/52                         ← Rest pose 검증
[RQ] f=36 hips=0.05m lUL=9° lLL=16° lUA=5° spine=11°  ← Tier 1 (매초)
[RQ:ALL] f=156 hips=14° spine=11° ... lUA=10° rUA=13°  ← Tier 2 (300프레임마다)
[RQ:WRIST] f=36 L vrm=42° fbx=10° diff=+32° twist=48° ← Wrist 진단
[RQ!] f=36 Lwrist OVER-FLEX vrm=42° fbx=10° (+32°)    ← Tier 3 (이상치)
```

**토큰 절감**: ~2000 토큰 → ~200 토큰 (90% 감소)
**LLM이 즉시 판정 가능**: "다리 OK, 팔 5-25°, wrist diff +32° over-flex"

### 시도했지만 효과 없었던 것들

| 시도 | 결과 | 이유 |
|------|------|------|
| Swing-twist decomposition + 50:50 분배 | 변화 없음 | FBX에 twist bone 없어서 no-op |
| Twist axis 수정 (rest_translation → bone direction) | 변화 없음 | 동일 이유 |
| Rest/anim 비율 맞추기 | 변화 없음 | 동일 이유 |
| rest_pose_offsets (full diff_euler) | 180° 플립 | 이중 보정 |
| rest_pose_offsets (절반) | 미미 | 감으로 조정 |
| Swing-only clamp (X축 decompose) | 미작동 | 축 분리가 부정확 |

### 관련 파일
- `crates/cinev_retarget/src/retargeter.rs` — joint limit, identity test, RQ quality
- `crates/cinev_retarget/src/mapping.rs` — twist fold + distribution
- `crates/cinev_retarget/src/lib.rs` — swing_twist_decompose, RetargetQuality
- `src/main.rs` — RQ 3-tier 출력, WRIST/FINGER diagnostics
- `assets/retarget/cinev_female_body.json` — thumb_01 direct_map 추가
- `~/.claude/private/learnings/projects/bevy-vrm-fbx-arm-scan.md` — FBX 본 스캔 데이터

---

## 2026-03-27: Shoulder Width Proportions — MetaHuman vs xiao_vroid

### 수치

| 부위 | MetaHuman | xiao_vroid | 비율 |
|------|-----------|------------|------|
| Hips height | 0.939m | 0.955m | 1.02 |
| **Shoulder width** | **0.396m** | **0.200m** | **0.50 (50% 좁음)** |
| Arm length | 0.458m | 0.430m | 0.94 |
| Clavicle lateral | 0.054m | 0.022m | 0.41 |
| UpperArm lateral | 0.144m | 0.078m | 0.54 |

### 의미
- 키는 거의 같지만 어깨가 MetaHuman 대비 **50% 좁음**
- 같은 arm rotation 적용 → 팔꿈치가 몸쪽으로 모이는 현상
- 현재 `scale_ratio`는 height 기준(1.017)만 보정 → 어깨 너비 비율(0.50) 미반영

### 보정 아이디어
1. Shoulder width ratio로 upperArm abduction(벌림) 각도 보정
2. Clavicle rotation에 lateral offset 추가
3. UpperArm adduction(모임) 방향에 damping

---

## 2026-03-26: Retargeter NormalizedBone 리팩토링 계획

### 요약
three-vrm 소스 분석 결과, 리타겟 공식 자체는 동일하나 **rest pose 데이터 캡처 방식**이 근본적 차이. three-vrm은 scene graph에서 world quaternion을 직접 캡처하지만, 우리는 FBX 메타데이터(PreRotation + Lcl_Rotation)에서 수동 재구성 → 부정확 → 수동 보정 필요.

### 핵심 발견

1. **three-vrm에는 A-pose 보정이 없다** — rest pose 차이가 공식에 내재 (normalized rig)
2. **three-vrm에는 per-bone offset이 없다** — 모든 본 동일 공식
3. **VRM 0.x `Quat(-x,y,-z,w)` change-of-basis** — scene graph에서 직접 캡처하면 불필요할 수 있음
4. **우리 수동 보정이 필요한 이유** = FBX rest pose 재구성 품질 부족

### three-vrm 실제 공식

```
// 구축 시: 각 본의 world rest, parent world rest, local rest 저장
// 프레임별:
normalized = src.parentRestWorld * animLocal * src.boneRestWorld⁻¹
result = dst.parentRestWorld⁻¹ * normalized * dst.parentRestWorld * dst.restLocal
```

### Identity Test (핵심 검증 도구)
`retarget_bone(src, dst, src.rest_local)` → 결과가 `dst.rest_local`과 일치해야 함.
불일치 = rest pose 캡처 오류. **개별 본 수정 X, 캡처 시스템 수정 O.**

### 현재 LIMB 에러 원인 분석
- **팔 17-26°**: FBX 소스 rest world rotation이 부정확 → `from_rotation_arc` 보정으로 숨김
- **손 180° 플립**: FBX hand PreRotation이 rest pose에 포함되어야 할 180° twist를 잘못 처리
- **Change-of-basis 좌표 차이**: LIMB 비교에서 VRM 0.x X,Z negate 필요 (측정 오류, 실제 품질 아님)

### 구현 순서
1. `NormalizedBone` struct 추가 (rest_world, parent_rest_world, rest_local)
2. VRM 타겟: Bevy scene graph에서 캡처 (이미 대부분 있음)
3. FBX 소스: 현재 `global_rest` 계산 검증 via identity test
4. Identity test 통과 후 리타겟 루프 교체
5. 수동 보정 제거 (from_rotation_arc, rest_pose_offsets, change-of-basis)
6. 다양한 모델/애니메이션 테스트

### 리스크
- FBX PreRotation/Lcl_Rotation 조합 순서/rotation order 오류 → identity test로 조기 발견
- VRM 0.x change-of-basis 제거 시 IBM bake와 상호작용 → 단계적 제거

---

## 2026-03-26: Rest Pose Offset 시스템 + FBX 하드코딩 제거

### 요약
Config 기반 rest_pose_offsets를 retargeter에 연결하고, main.rs의 FBX 본 이름 하드코딩을 data-driven으로 전환.

### 변경사항

1. **rest_pose_offsets 활성화**: config의 Euler [x,y,z] → Quat 변환 후 `apose_corrections`에 병합. Auto-detect가 있는 본은 SKIP (arms), 없는 본만 적용 (hands).

2. **HAND_DIAG 진단**: retargeter에서 VRM/FBX hand bone의 rest orientation 차이를 로그로 출력. `diff_euler` 값이 offset 힌트.

3. **FBX 하드코딩 제거**: `RetargetState.vrm_to_fbx` 맵 추가. `bone_tracks`에서 자동 구축. main.rs의 모든 `"DHIbody:..."` 문자열을 맵 조회로 교체 (0건 잔여).

4. **LIMB 비교 좌표계 수정**: VRM 0.x의 change-of-basis로 인한 false positive 제거. VRM 방향 X,Z negate 후 비교 → **팔 80-115° → 17-26°**로 개선.

### 교훈
- `rest_pose_offsets`의 전체 `diff_euler` 값을 넣으면 이중 보정 (three-vrm 공식이 이미 일부 처리)
- LIMB 에러 수치는 좌표계 차이일 수 있음 — 실제 시각적 품질과 다름
- 시스템 분리: 라이브러리(vrm loader, fbx parser, retargeter)는 clean, 커플링은 app layer에만 존재

---

## 2026-03-26: VRM 0.x 좌표계 정규화 — 완전 해결

### 요약
VRM 0.x→1.0 변환 시 bake된 180°Y rotation을 로더 레벨에서 strip + IBM 재계산으로 해결. 3가지 접근을 시도하여 최종적으로 IBM에 180°Y를 bake하는 방식으로 완성.

---

### 핵심 발견: Bevy 0.18 Skinning 공식

**Bevy의 실제 코드** (`bevy_pbr/src/render/skin.rs`):
```rust
joint_matrix = joint_global_transform * inverse_bindpose
```

- **mesh entity Transform**: skinned mesh에서 **무시됨** (glTF spec 준수)
- GPU shader: `world_pos = skin_matrix * local_pos` — mesh_global 곱하지 않음
- 따라서 IBM 공식: `IBM = inverse(joint_global_rest)` (skeleton term 없음)

**이전 e2d0108 버그**: `IBM = inverse(joint) * skel_global` — Bevy는 `inverse(skel)` 안 쓰므로 skeleton term이 오류 원인

---

### 시도한 접근법들

| # | 접근 | 결과 | 문제 |
|---|------|------|------|
| 1 | Bone-only strip (mesh 유지) | 본 정확, 스키닝 깨짐 | IBM이 새 bone globals와 불일치 |
| 2 | ALL strip + IBM = inverse(joint) | 스키닝 완벽, 뒤돌아봄 | vertex 데이터가 -Z forward 그대로 |
| 3 | Model entity 180°Y rotation | 방향 해결 | spring bone 액세서리 stretch |
| 4 | Vertex X,Z negate | 방향 해결 | UV/텍스처 좌우반전, 얼굴 안 보임 |
| **5** | **IBM에 180°Y bake** | **모든 것 해결** | **최종 채택** |

---

### 최종 해결: IBM에 180°Y Bake

```
IBM_new = inverse(joint_global_stripped) * R(180°Y)
```

**동작 원리**:
- Rest pose: `joint_matrix = joint_global * IBM = R(180°Y)`
- vertex가 skinning을 통해 180°Y 회전됨 → +Z forward
- vertex 데이터 원본 유지 → UV, morph target, winding 전부 정상
- bone GlobalTransform은 clean (strip된 상태) → spring bone 정상
- model entity rotation 없음 → spring bone 액세서리 정상

**전체 파이프라인** (`normalize_vrm_bones_180y`):
1. Strip ALL 180°Y rotations (bone + mesh 구분 없이)
2. BFS로 descendant translations X,Z negate
3. 새 global transforms 계산 (topological sort)
4. IBM = inverse(joint_global) * R(180°Y) → binary patch
5. GLB rebuild (JSON + patched binary)

---

### 실패한 접근들의 교훈

1. **Vertex negate**: position X,Z negate → 좌우반전. UV도 같이 flip해야 하지만 그러면 body 텍스처도 깨짐. morph target delta도 negate 필요. 너무 많은 것을 건드려야 함.

2. **Model entity 180°Y**: GlobalTransform에 180°Y 포함 → spring bone REST position이 180°Y 공간에서 계산됨 → wing/cape accessory stretch. 원인: spring bone이 absolute world position으로 초기화/시뮬레이션하는데 180°Y가 force/constraint 방향을 왜곡.

3. **e2d0108의 IBM 공식 오류**: `inverse(joint) * skeleton_global` — Bevy는 skinning에서 `inverse(skeleton_global)`을 안 쓰므로 skeleton term이 있으면 안 됨.

---

### 관련 파일
- `crates/vrm2u_bevy/src/vrm/loader.rs` — normalize_vrm_bones_180y + matrix helpers
- `crates/vrm2u_bevy/src/vrm/humanoid_bone.rs` — 런타임 조작 없음 (로더에서 해결)
- `crates/vrm2u_bevy/src/vrm/initialize.rs` — normalized_180y flag (현재 미사용, 향후 활용 가능)

---

## 2026-03-24: FBX Facial BlendShape → VRM Expression 전체 파이프라인

### 요약
CINEV FBX 페이셜 애니메이션(blend shape)을 파싱하여 VRM 캐릭터의 입, 눈, 시선에 실시간 적용하는 파이프라인 구축. stack overflow 디버깅에 상당 시간 소요.

---

### 1. FBX Pull Parser 전환

**문제**: `fbxcel::tree::v7400::Loader`가 대형 FBX(FC_00078, 6.1MB, 966+ BlendShapeChannel)에서 stack overflow.
**해결**: `fbxcel::pull_parser`(flat state machine)로 전환.

**주의사항**:
- 필요한 노드(`Model`, `AnimationCurve`, `AnimationCurveNode`, `Deformer`)만 attrs 로드
- `Geometry`, `Material`, `Texture` 등은 fbxcel의 `skip_unread_attributes` auto-seek으로 skip
- `DirectLoader`로 불필요한 대형 배열(수만개 f32 vertex data) 로드하면 메모리 폭발

---

### 2. Bevy Stack Overflow 해결

**문제**: 같은 `fbx::parse()`가 standalone CLI에서는 OK, Bevy에서는 overflow.
**원인**: Bevy 시스템이 Compute Task Pool worker thread(macOS 기본 512KB)에서 실행됨.

**시도한 것과 결과**:

| 시도 | 결과 |
|------|------|
| `thread::Builder::stack_size(16MB)` | overflow (lldb로 16MB 정확히 소진 확인) |
| `RUST_MIN_STACK=128MB` | overflow |
| `profile.dev.package.fbxcel` opt-level=3 | overflow |
| 전체 `profile.dev` opt-level=2 | overflow |
| `--release` 빌드 | overflow (여전히 Bevy worker thread) |
| split call (개별 함수 호출) | main thread OK, Bevy worker overflow |
| **별도 `std::thread::Builder` spawn** | **성공** |

**최종 패턴**:
```rust
// Bevy 시스템 안에서 직접 호출 → overflow
let fbx = fbx::parse(&bytes)?;

// 별도 큰 스택 thread로 격리 → OK
let result = std::thread::Builder::new()
    .name("fbx-parse".to_string())
    .stack_size(64 * 1024 * 1024)
    .spawn(move || {
        let fbx = fbx::parse(&bytes)?;
        let config = RetargetConfig::from_json(&json)?;
        let anim = mapping::retarget(&fbx, &config, ver)?;
        Ok((anim, has_bone_anim))
    }).join();
```

**교훈**:
- Bevy 시스템 = Compute Task Pool worker thread (macOS 512KB)
- `get_or_init`으로 pool 스택을 늘려도 시스템 자체가 worker에서 실행
- **I/O + 파싱은 반드시 `std::thread::Builder`로 격리**

---

### 3. CINEV FBX BlendShape 구조

**FBX 연결 체인**: `AnimCurve` → `AnimCurveNode(DeformPercent)` → `BlendShapeChannel`

**핵심**:
- AnimCurve → AnimCurveNode: **OP `"d|DeformPercent"`** (bone은 `d|X`, `d|Y`, `d|Z`)
- AnimCurveNode → BlendShapeChannel: **OP `"DeformPercent"`**
- channel 이름 형식: `Head_blend.F_A_Mouth SubDeformer` → 파싱 후 `F_A_Mouth`

**FC_00078 채널 목록 (124개)**: 입(F_A/I/U/E/O_Mouth), 눈(F_003_L/R_Eye_down/up), 시선(L/R_eye_g_D/U/L/R), 눈썹(F_005~016_L/R_Eyebrow), 치아(toothup/down), 기타

---

### 4. VRM Expression 매핑

**config** (`cinev_female_body.json`의 `expression_map`):
```json
{
  "F_A_Mouth": "aa",
  "F_I_Mouth": "ih",
  "F_U_Mouth": "ou",
  "F_E_Mouth": "ee",
  "F_O_Mouth": "oh",
  "F_003_L_Eye_down": "blinkLeft|blink",
  "F_003_R_Eye_down": "blinkRight|blink",
  "L_eye_g_U": "lookUp",
  "L_eye_g_D": "lookDown",
  "L_eye_g_L": "lookLeft",
  "L_eye_g_R": "lookRight"
}
```

**`|` fallback 표기**: `"blinkLeft|blink"` → VRM에 `blinkLeft` 없으면 `blink`으로 fallback. Yoya.vrm은 `blinkLeft`/`blinkRight` bind 없고 `blink`만 있음.

---

### 5. Expression 적용 — 이중 경로

**Primary**: bevy_vrm1 ExpressionOverride
```rust
commands.entity(expr_entity).insert(ExpressionOverride(w));
```
- `ExpressionEntityMap`에서 expression entity 찾기
- bevy_vrm1의 `bind_expressions` 시스템이 MorphWeights 업데이트
- **주의**: `commands.trigger(SetExpressions)` 는 deferred command 타이밍 이슈로 안 됨. 직접 insert 필요.

**Fallback**: Direct MorphWeights (bevy_vrm1 우회)
```rust
morph.weights_mut()[index] += w * bind_weight;
```
- VRM glTF JSON에서 `expressions.preset.morphTargetBinds` 파싱 → `VrmExpressionBindings` 리소스
- MorphWeights entity를 morph count 기준으로 mesh node에 매핑 (heuristic)
- `RetargetExpressionNodes`가 없는 VRM에서도 동작

**VRM 모델별 동작**:
| VRM | joints | Primary (ExpressionOverride) | Fallback (Direct MorphWeights) |
|-----|--------|-----|----------|
| 4a712f6f | 116 | **동작** | 동작 |
| Yoya.vrm | 162 | 안됨 (RetargetExpressionNodes 미생성) | **동작** |
| Saber.vrm | 426 | 미확인 | 미확인 |
| phainon_n_p2v.vrm | 437 | 미확인 | 미확인 |

**원인 분석 (Gemini 시니어)**:
- `bind_expressions` query에 `&RetargetExpressionNodes`가 hard constraint
- 이 컴포넌트가 없으면 expression entity가 query에 매칭 안 됨
- Yoya는 162 joints (256 이하)인데도 미생성 → bevy_vrm1 내부 초기화 로직 이슈

---

### 6. VRM 버전 감지 수정

**문제**: 모든 VRM이 1.0인데 `detect_vrm_version`이 0.x로 잘못 판정.
**원인**: `"rotation":[0.0,1.0,0.0,0.0]` 패턴을 0.x 변환 감지용으로 쓰고 있었는데, 네이티브 1.0에도 존재.
**수정**: `VRMC_vrm` 있으면 무조건 `Vrm1` (rotation heuristic 제거).

---

### 7. 향후 작업

- Body FBX + Facial FBX 동시 로딩 (2슬롯)
- 감정 expression 매핑 (happy, angry, sad → CINEV 커스텀 채널)
- `compute_fbx_skeleton_from_parsed` 최적화 (매 프레임 HashMap 생성 → pre-allocate)
- bevy_vrm1 `RetargetExpressionNodes` 미생성 이슈 별도 추적
- Saber/phainon (426/437 joints) VRM expression 테스트

---

---

## VRM 로드 가능 기준 (WIP)

### Hard Limits (로드 불가)

| 조건 | 제한 | 증상 |
|------|------|------|
| skin joints > 256 | Bevy/WGPU 하드웨어 제한 | mesh 깨짐, vertex weight 오류, 시각적 방향 틀림 |

**해당 모델**: Saber.vrm (426), phainon_n_p2v.vrm (437)

### Soft Limits (로드 가능, 기능 제한)

| 조건 | 증상 | 우회 |
|------|------|------|
| bevy_vrm1 RetargetExpressionNodes 미생성 | ExpressionOverride → MorphWeights 안됨 | Fallback Direct MorphWeights |
| VRM 0.x conversion 실패 | rotateVRM0 적용 불가 | auto_fix_vrm_forward로 자동 보정 |
| blinkLeft/blinkRight bind 없음 | 개별 눈 깜빡임 불가 | `blinkLeft\|blink` fallback 표기 |

### 정상 동작 확인된 모델

| VRM | joints | expression | forward | 비고 |
|-----|--------|------------|---------|------|
| 4a712f6f | 116 | ExpressionOverride 경로 | identity (native 1.0) | 완벽 동작 |
| Yoya.vrm | 162 | Fallback MorphWeights | auto_fix 불필요 (forward +Z) | blink만 fallback |
| GhostPumpking.vrm | ? | Fallback MorphWeights | auto_fix 불필요 | 정상 |

### 향후 기준 추가 예정
- mesh primitive 수 제한?
- morph target 수 제한?
- texture 해상도/메모리 제한?
- VRM 0.x specific extension 호환성 체크

---

## VRM Forward Direction 문제 (미해결)

### VRM 스펙 좌표계
- **VRM 0.x**: Right-hand Y-up, **-Z forward** (Unity 좌표계)
- **VRM 1.0**: Right-hand Y-up, **+Z forward** (glTF 좌표계)
- 0.x → 1.0 변환 시 Y축 180° 회전 필요
- 참조: https://github.com/vrm-c/vrm-specification/issues/205

### 현재 상태
- `auto_fix_vrm_forward` 시스템: `Initialized` 후 hips bone forward 체크
- Vrm entity 또는 parent entity 180°Y 회전 시도
- **문제**: xiao_vroid.vrm (VRoid Studio 네이티브 1.0)에서 보정이 시각적으로 안 됨
- parent entity Transform 수정이 bevy_vrm1 scene hierarchy에서 제대로 전파 안 되는 것으로 추정

### 해결됨: Bevy -Z forward = glTF/VRM visual front

**근본 원인**: Bevy는 -Z를 forward로 사용, glTF/VRM은 +Z. bevy_vrm1은 `convert_coordinates=false`로 로드.
결과: Bevy에서 모델의 -Z axis가 world -Z를 가리킴 → 모델의 앞면(+Z)이 world +Z(카메라 방향) → **자연스럽게 정면**.

**시도했지만 실패한 것들**:
- Vrm entity Transform 직접 수정 → bevy_vrm1이 덮어씀
- Parent entity rotation → depth=0 (parent 없음)
- Wrapper parent entity + add_child → bevy_vrm1 무시
- GLB JSON 패치 (180°Y rotation 주입) → 오히려 정면을 뒤집음

**최종 결론**:
- VRM 1.0 네이티브 (identity root rotation): **패치 불필요, 자연스럽게 정면**
- VRM 0.x → 1.0 변환 (`vrm0_compat`): baked 180°Y rotation 때문에 뒤를 봄
  - `vrm0_compat::convert()`가 root node에 `[0,1,0,0]` 추가하는 것이 원인
  - TODO: vrm0_compat 수정 또는 변환 후 root rotation 제거

**참조**:
- [Bevy glTF coordinate issue #19686](https://github.com/bevyengine/bevy/issues/19686)
- [bevy_fix_gltf_coordinate_system](https://github.com/janhohenheim/bevy_fix_gltf_coordinate_system) (Bevy 0.17+에서 불필요)
- Blender VRM plugin: Z축 180° rotation for 0.x (Y-up → Z-up 변환 포함)
- bevy_vrm1 `VrmLoader`: `default_convert_coordinates: Default::default()` = false

---

## VRM 로더 개선사항 (WIP)

1. **Forward Direction 자동 감지** — VRM 0.x(-Z) vs 1.0(+Z) 좌표계 차이 처리
2. **Joint Limit 사전 체크** — 256 초과 시 로드 전 경고/거부
3. **Expression 초기화 검증** — RetargetExpressionNodes 유무 → fallback 자동 선택
4. **VRM 0.x → 1.0 변환 안정화** — convert 실패 시 graceful fallback
5. **Morph Target 검증** — binding이 참조하는 index 유효성 체크
6. **좌표계 변환 통합** — bone retarget + expression + forward를 하나의 좌표계 파이프라인으로

---

## 2026-03-24: Dual FBX Motion Slot (Body + Facial)

### 요약
Body FBX(bone animation)와 Facial FBX(expression animation)를 독립적으로 로드하여 동시 재생하는 2슬롯 시스템 구현.

---

### 1. 슬롯 구조

| 슬롯 | 키 | 대상 | 리소스 |
|------|-----|------|--------|
| Body | `F` | bone/skeleton animation | `RetargetState` + `FbxSkeletonViz` |
| Facial | `Shift+F` | expression animation only | `ExpressionAnimState` |

**AUTO_LOAD 분리:**
- `AUTO_LOAD_BODY_FBX` — body bone FBX 경로
- `AUTO_LOAD_FACIAL_FBX` — facial expression FBX 경로

### 2. 타임라인 동기화

```rust
TimelineState {
    body_duration: f32,    // body slot duration
    body_frames: usize,
    facial_duration: f32,  // facial slot duration
    facial_frames: usize,
}
// total = max(body, facial)
fn sync_from_slots(&mut self) {
    self.total_frames = self.body_frames.max(self.facial_frames);
    self.duration = self.body_duration.max(self.facial_duration);
}
```

- Body 4.0s + Facial 6.7s → Timeline 6.7s
- 각 슬롯 독립 loop (modulo): `current_time % slot_duration`

### 3. 슬롯 독립성

- Body FBX 재로드 시 facial 슬롯 보존 (`saved_facial_duration/frames`)
- Facial FBX 재로드 시 body 슬롯 보존
- 혼합 FBX (bone + expression 모두 있는 경우) → body slot에 bone, 동시에 facial slot에 expression

### 4. 주의사항

- **FbxSkeletonViz 필수**: body auto-load에서 skeleton viz를 계산하지 않으면 `apply_retarget_animation`에서:
  - `hips_rest_offset` = (0,0,0) → hips 위치 보정 안됨
  - A-pose correction 스킵 → 팔 각도 틀림
  - scale_ratio 기본값 사용 → 비율 불일치
- **bevy_file_dialog**: 새 FileLoad 타입은 반드시 `.with_load_file::<T>()` 등록 필요

### 5. 테스트된 파일 조합

| Body FBX | Facial FBX | VRM | 결과 |
|----------|-----------|-----|------|
| 25_00728_F_StndSwayDance | FC_00078_F_SuddenFlutter | xiao_vroid.vrm | body 51 curves + facial 11 tracks |

### 6. 향후 작업

- Facial FBX에서 bone animation이 있는 경우 head/neck만 추출하여 body에 오버레이

---

## 2026-03-25: 3-Track Timeline + Independent Loop + Retarget Debug

### 요약
타임라인 3트랙 UI, 슬롯별 독립 루프, 리타겟 디버그 패널(F5) 구현.

### 1. 3-Track Timeline

| 트랙 | 위치 | 색상 | 내용 |
|------|------|------|------|
| TOTAL | 상단 | 흰색 | 전체 duration (max of slots) |
| FACIAL | 중간 | 주황 | facial slot 로컬 시간 + 파일명 |
| BODY | 하단 | 파랑 | body slot 로컬 시간 + 파일명 |

### 2. 독립 루프 (핵심 패턴)

```rust
// 글로벌 timeline time → 슬롯 로컬 time
let slot_time = current_time % slot_duration;
let slot_pct = slot_time / slot_duration;
let frame = (slot_pct * frame_count as f32) as usize;
```

적용 위치:
- `timeline_sync_playback` — bone AnimationPlayer seek
- `apply_expression_animation` — facial frame index
- `draw_bone_viz` — FBX skeleton gizmo frame
- `log_root_hips_world` — debug logging frame

### 3. 버그 수정

- **`start_playback`이 `sync_from_slots()` 값 덮어씀**: `fbx_viz.data.frame_count/duration`으로 전체 timeline을 body-only 값으로 리셋 → 제거
- **FBX skeleton viz 첫 루프 후 멈춤**: `timeline.current_frame`이 body frame_count 초과 시 clamp → body modulo로 전환

### 4. 슬롯 검증

- `F`키로 facial-only FBX 로드 시 → `[REJECT]` 로그 + skip
- `Shift+F`키로 expression 없는 FBX → 기존 경고 유지

### 5. Retarget Debug Panel (F5)

**토글**: `F5` (기본 OFF, 삭제하지 말 것 — TA 검증 도구)

**표시 내용 (13개 주요 본)**:
- rotation 차이 (각도)
- position 차이 (xyz)
- VRM/FBX euler angles
- scale ratio

**stderr 출력**: 120프레임마다 throttled

### 6. 리타겟 무결성 진단 (수치 기반)

**3요소 진단:**

| 대상 | 판정 | 근거 |
|------|------|------|
| VRM | CLEAN ✓ | 55 bones, 14 expressions, forward=-Z, rest identity |
| FBX | CLEAN ✓ | 51 tracks, 121 frames, 값 프레임별 변화 확인 |
| 리타게터 | **BUG (hips only)** | hips 94° offset, 사지 9-22° (정상 범위) |

**hips ~94° systematic offset**:
```
VRM hips_local = (0.047, 0.370, 0.036, 0.925) ← Y축 회전 우세
FBX pelvis_local = (0.084, 0.123, 0.744, 0.652) ← Z축 회전 우세
→ 축 매핑 오류. 전 프레임 일정 (94±1°)
```

**사지 비교 (정상 범위 확인):**
- leftUpperLeg 9°, leftUpperArm 9° → three-vrm 공식 작동 중
- leftLowerArm 22°, spine 19° → A-pose 보정 잔차 (허용)
- leftLowerLeg 17° → 허용

**원인 추정**: hips는 root의 직접 자식 → 좌표 변환 경로(`parentRestWorld_yup * animLocal_yup * boneRestWorld_yup.inv()`)에서 root↔hips 간 Z-up→Y-up 축 매핑이 사지와 다르게 처리됨

**다음 단계**: hips 전용 좌표계 변환 디버깅 (root parent rest, coord_rot 적용 순서 검증)

---

---

## 2026-03-25: VRM 0.x→1.0 좌표계 지옥 (Coordinate Hell) 해결

### 문제

VRM 0.x에서 1.0으로 변환된 파일 (Yoya.vrm)에서 바디 리타겟 품질 저하.
- hips position Z축이 시간에 따라 누적 (30초에 -0.111m까지)
- FBX viz 기즈모와 VRM 캐릭터가 반대 방향으로 이동
- DIVERGE 비교 로그가 root_rot_diff=180° 표시

### 근본 원인

Yoya.vrm은 `VRMC_vrm` 확장이 있어 VRM 1.0으로 감지되지만, 원본 파일의 **모든 노드에 `rotation: [0,1,0,0]` (180°Y)가 baked** 되어있음 (VRM 0.x→1.0 변환기가 좌표계 보정으로 삽입).

bevy_vrm1은 이 파일을 있는 그대로 로드 → root bone rest rotation = 180°Y.

**3가지 별개 문제가 혼재:**

1. **리타겟 rotation**: three-vrm 공식이 `dst_rest_local/global`을 사용 → root=180°Y, hips=IDENTITY여도 공식 자체는 정상 작동. **문제 없음.**

2. **hips translation**: FBX world position에서 motion_delta를 계산하면 FBX root-local 좌표계. VRM root가 180°Y면 VRM root-local은 X,Z가 반대. delta를 VRM bone_rest_translation에 그냥 더하면 Z가 프레임마다 반대 방향으로 누적. **이것이 실제 버그.**

3. **FBX viz/DIVERGE 비교**: VRM GlobalTransform은 180°Y 포함, FBX world position은 미포함 → 직접 비교하면 X,Z 부호 반대로 나옴. **비교 로직 문제.**

### 시도한 접근과 결과

| 접근 | 결과 | 문제 |
|------|------|------|
| strip ALL nodes 180°Y + Entity rotation | 좌우 플립 | IBM이 원본 좌표 기준 → 스키닝 깨짐 |
| strip ROOT only + Entity rotation | 무릎 앞으로 굽힘 | root 자식들의 local transform이 180°Y 부모 기준 |
| strip ROOT only + IBM 재계산 | VRM bone viz X자 | bone entity transform ≠ GPU skinning 공간 |
| Change of Basis (x,z negate) children | LIMB 40~132° | 과보정, three-vrm 공식이 이미 처리 |
| **hips translation motion_delta만 X,Z negate** | **Z 누적 해결** | 정답 |

### 최종 해결

**retargeter.rs** `compute_translations()`:
```rust
let mut motion_delta = (local_offset - fbx_hips_rest_local) * self.scale_ratio;
if self.has_180y_root {
    motion_delta.x = -motion_delta.x;
    motion_delta.z = -motion_delta.z;
}
let result = bone_rest_translation + motion_delta;
```

`has_180y_root`는 `Retargeter::new()`에서 `root_rest_rotation.y.abs() > 0.99`로 감지.

**FBX viz gizmo** (`draw_bone_viz`):
- root bone rest rotation에서 180°Y 감지 → `Local<Option<Quat>>`에 캐시
- FBX bone positions를 `fbx_viz_rot`으로 회전하여 VRM 좌표계에 맞춤

### 왜 이 문제가 발생했는가

1. **xiao_vroid.vrm (네이티브 1.0)**: root rest = IDENTITY → 모든 좌표계 동일 → 문제 없음
2. **Yoya.vrm (0.x→1.0 변환)**: root rest = 180°Y → FBX root-local ≠ VRM root-local
3. 기존 코드는 xiao_vroid만 테스트 → 180°Y 경우를 고려하지 않았음
4. DIVERGE 비교 로그가 좌표계 차이를 "리타겟 에러"로 표시 → 실제로는 비교 방법의 문제

### 핵심 교훈

- **rotation은 건드리지 마라**: three-vrm 공식이 dst_rest를 통해 처리. Change of Basis, strip 모두 불필요.
- **translation만 좌표계 보정**: FBX world → root-local 변환 후 VRM root-local로 옮길 때만 X,Z negate 필요.
- **strip은 IBM/스키닝을 깨뜨린다**: GLB 노드 rotation 제거 시 Inverse Bind Matrices 불일치 → 메쉬 폭발.
- **비교 로그를 리타겟 품질로 오해하지 마라**: DIVERGE 수치가 나빠도 실제 리타겟은 정상일 수 있음. 좌표계 통일 후 비교해야.
- **VRM4U는 Assimp으로 import 시 전체 좌표 정규화**: 우리는 bevy_vrm1이 glTF를 있는 그대로 로드하므로 retargeter에서 부분 보정.

### 검증 데이터

```
Yoya.vrm 수정 후 (30초):
  loop reset 후 hips_d=0.031m (xiao와 동일 수준)
  Z축 누적 없음 (수정 전: -0.111m까지 누적)
  LIMB: leftUpperArm 4~25°, leftLowerArm 12~25° (A-pose correction 잔차)

xiao_vroid.vrm (baseline):
  hips_d=0.049~0.054m
  LIMB: leftUpperArm 5~10°, leftLowerArm 7~12°
```

---

### 키워드 (RAG 검색용)
`bevy` `vrm` `fbx` `blend shape` `morph target` `expression` `stack overflow` `fbxcel` `pull parser` `MorphWeights` `ExpressionOverride` `RetargetExpressionNodes` `bevy_vrm1` `Compute Task Pool` `thread spawn` `macOS` `CINEV` `facial animation` `lip sync` `blink` `gaze` `dual slot` `body` `facial` `timeline sync` `3-track` `independent loop` `modulo` `retarget debug` `hips offset` `coordinate transform` `180Y` `Change of Basis` `IBM` `Inverse Bind Matrices` `strip` `coordinate hell` `VRM 0.x` `root rotation` `hips translation` `motion delta` `fbx viz`
