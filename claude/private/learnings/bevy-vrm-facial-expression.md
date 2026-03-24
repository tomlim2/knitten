# bevy-vrm Learnings

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

### 키워드 (RAG 검색용)
`bevy` `vrm` `fbx` `blend shape` `morph target` `expression` `stack overflow` `fbxcel` `pull parser` `MorphWeights` `ExpressionOverride` `RetargetExpressionNodes` `bevy_vrm1` `Compute Task Pool` `thread spawn` `macOS` `CINEV` `facial animation` `lip sync` `blink` `gaze`
