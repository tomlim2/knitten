---
title: "Shotloom Import → Normalize → Retarget 파이프라인 구조"
tags:
  - shotloom
  - architecture
  - pipeline
  - retarget
  - normalizer
  - vrm
  - fbx
created: 2026-04-28
source: claude
---

# Shotloom Import → Normalize → Retarget 파이프라인 구조

캐릭터가 웃으면서 춤추는 화면 1개를 띄우기 위해 Shotloom 내부에서 데이터가 흐르는 경로. ADR-0013 (generated character contract) + ADR-0030 (3-normalizer 추출) + ADR-0033 (ARKit 52 facial canonical) + ADR-0034 (source-anim type ownership) 기준 정리.

> [!info] Status (2026-04-28)
> ADR-0030 작업 진행 중. 현재는 **transitional state** — 타입 ownership 은 normalizer 로 옮겨졌지만 함수 본체는 아직 `shotloom-retarget` 안.
>
> 1. ✅ STL-195 — character-model-normalizer scaffold 머지
> 2. ✅ STL-208 — body-anim-normalizer scaffold + 출력 타입 `BoneTrack` ownership
> 3. ✅ STL-193 — facial-anim-normalizer scaffold + ADR-0033 (ARKit 52 canonical)
> 4. 🔄 STL-183 (PR #188, in review) — `SourceAsset` / `SourceFormat` 분리 (cycle 깨기)
> 5. ⏳ STL-194 — body normalize 함수 본체 이주 (STL-183 머지 prerequisite)
> 6. ⏳ STL-215 — `shotloom-retarget` → `shotloom-body-retarget`, `TargetAnimation` → `TargetBodyAnimation` rename (STL-194 후속)

---

## 한 줄 요약

```
parsers → import (cache desc) → 3 normalizers (preprocessing) →
[body 만 retarget math] → ECS co-location → anim track 분기 (body / facial 다른 타입)
```

retarget 는 "가운데 무거운 노드" 에서 "math 만 하는 얇은 노드" 로 좁아지는 중. body / facial 의 캐릭터-특화 책임 위치가 다르므로 anim track 입력 타입도 다름.

---

## 다이어그램

각 박스 = 크레이트, 박스 안에 driver fn + IN / OUT. 화살표는 처음부터 끝까지 끊김 없이 이어지며 흐르는 타입을 라벨로 표시.

```
                                   [ VRM / glTF ]
                                          │
                                     VRM bytes
                                          │
                                          ▼
                  ┌──────────────────────────────────────────────────┐
                  │ shotloom-gltf — VRM / glTF parser + 포맷 normalize │
                  │                                                  │
                  │ IN:  VRM / glTF bytes                            │
                  │ OUT: normalized 1.x bytes                        │
                  │      ExtractedRest                               │
                  │      ExtractedFootGeometry / ExtractedFootSide   │
                  │      Diagnostic[]                                │
                  │                                                  │
                  │ fn:  vrm_normalization::*                        │
                  │      extract_foot_contact_data()                 │
                  │                                                  │
                  │ ADR-0013 (포맷 normalize 경계)                    │
                  └─────────────────────┬────────────────────────────┘
                                        │
                                        │ normalized bytes
                                        │
   [ Body FBX ]              [ Face FBX ]                            │
        │                          │                                 │
        │ FBX bytes + mode         │ FBX bytes + mode                │
        ▼                          ▼                                 │
  ┌────────────────────────────────────────────────────────┐         │
  │ shotloom-fbx-anim — FBX parser                         │         │
  │                                                        │         │
  │ IN:  FBX bytes + ParseConfig                           │         │
  │      FbxImportMode (Body | Face)                       │         │
  │ OUT: parsed 본 그래프 / 채널 데이터                       │         │
  │      Error                                             │         │
  │                                                        │         │
  │ fn:  parse_with_config()                               │         │
  │      validate_for_mode()                               │         │
  └────────────────────────────┬───────────────────────────┘         │
                               │                                     │
                               │ parsed graph                        │
                               │                                     │
                               └──────────────┬──────────────────────┘
                                              │
                                              ▼
                  ┌──────────────────────────────────────────────────┐
                  │ shotloom-import — 오케스트레이션 + 캐시            │
                  │                                                  │
                  │ IN:  bytes + cache root (+ FbxImportMode)        │
                  │ OUT: ImportedVrmAsset {                          │
                  │        normalized_artifact, source_reference,    │
                  │        source_flavor, diagnostics }              │
                  │      ImportedFbxAnimation {                      │
                  │        artifact_ref, content_hash,               │
                  │        mode, diagnostics }                       │
                  │                                                  │
                  │ fn:  import_vrm_to_cache()                       │
                  │      import_fbx_to_cache()                       │
                  │                                                  │
                  │ ※ cache desc 는 본 그래프 안 들고있음.             │
                  │   normalizer 가 artifact path 로                  │
                  │   parse_with_config 다시 호출.                    │
                  └────┬────────────────┬────────────────┬───────────┘
                       │                │                │
                       │ ImportedVrm    │ ImportedFbx    │ ImportedFbx
                       │ Asset          │ Animation      │ Animation
                       │                │  (Body)        │  (Face)
                       ▼                ▼                ▼
  ┌────────────────────────┐ ┌────────────────────────┐ ┌────────────────────────┐
  │ character-model-       │ │ body-anim-             │ │ facial-anim-           │
  │ normalizer             │ │ normalizer             │ │ normalizer             │
  │                        │ │                        │ │                        │
  │ IN:  ImportedVrmAsset  │ │ IN:  ImportedFbxAnim   │ │ IN:  ImportedFbxAnim   │
  │      (today: rest pose │ │       (Body)           │ │       (Face)           │
  │       직접 + Source    │ │      ARP rig info      │ │      (목표)            │
  │       Bone slice)      │ │                        │ │                        │
  │ OUT: NormalizedChar-   │ │ OUT: Vec<BoneTrack>    │ │ OUT: facial channel    │
  │      acterModel        │ │      (CR 정렬,          │ │      weights, ARKit 52 │
  │      (CR rest +        │ │       character-       │ │      정렬               │
  │       finger axis +    │ │       agnostic)        │ │      (타입명 미정 —     │
  │       hand override)   │ │                        │ │       후속 sub-issue)   │
  │                        │ │                        │ │                        │
  │ fn:  align_full_       │ │ fn:  normalize_*       │ │ ※ scaffold only —       │
  │      body_rest()       │ │                        │ │   ARKIT_52_CHANNEL_     │
  │                        │ │ ⚠ 함수 본체는           │ │   NAMES 상수만 land.    │
  │ Canonical: CR rest     │ │   아직 retarget 안.     │ │                        │
  │                        │ │   STL-194 가 STL-183   │ │ Canonical: ARKit 52    │
  │                        │ │   머지 후 이주 마무리.  │ │ (ADR-0033)             │
  │                        │ │                        │ │                        │
  │                        │ │ Canonical: CR rest     │ │                        │
  └───────────┬────────────┘ └───────────┬────────────┘ └───────────┬────────────┘
              │                          │                          │
              │ NormalizedCharacter      │ Vec<BoneTrack>           │ FacialBlend
              │ Model                    │                          │ shapeAnim
              │                          │                          │
              └────────────┬─────────────┘                          │
                           │                                        │
                           ▼                                        │
            ┌──────────────────────────────────────────────┐        │
            │ shotloom-retarget — body retarget math       │        │
            │ ※ STL-215 후 shotloom-body-retarget           │        │
            │                                              │        │
            │ IN:  SourceAsset (body anim)                 │        │
            │      VrmRestPose (target rest)               │        │
            │      RetargetConfig + RetargeterOptions      │        │
            │ OUT: TargetAnimation {                       │        │
            │        duration_secs,                        │        │
            │        bones: Vec<RetargetedBone>,           │        │
            │        expression_tracks, log }              │        │
            │      ※ STL-215 후 TargetBodyAnimation         │        │
            │                                              │        │
            │ fn:  retarget_arp_to_vrm()                   │        │
            │                                              │        │
            │ · ARP → VRM frame delta                      │        │
            │ · postprocess (wrist twist 등)               │        │
            └────────────────────┬─────────────────────────┘        │
                                 │                                  │
                                 │ TargetBodyAnimation              │ FacialBlend
                                 │ (character-fitted)                │ shapeAnim
                                 │                                  │ (character-
                                 ▼                                  ▼  agnostic)
   ┌──────────────────────────────────────────────────────────────────────────┐
   │ shotloom-engine — 런타임 / playback                                       │
   │                                                                          │
   │ ECS co-location — 같은 character entity 에 sibling components:            │
   │   · Character                  (도메인 마커, ADR-0013)                    │
   │   · VrmAssetHandle             (어떤 VRM)                                 │
   │   · AuthoredDisplayName        (사용자 부여 이름)                          │
   │   · NormalizedCharacterModel   ← preprocess 출력                          │
   │   · SkeletalMesh               (bevy_vrm1)                               │
   │   · Transform / GlobalTransform / ...                                    │
   │                                                                          │
   │ fn:  spawn_character() / spawn_character_from_asset_deferred()           │
   │                                                                          │
   │ 타입 ownership 은 각자 다른 크레이트, 런타임에는 같은 entity 에 co-locate.   │
   └────────────────────────────────────┬─────────────────────────────────────┘
                                        │
                                        │ anim track 분기
                                        │
                          ┌─────────────┴─────────────┐
                          │                           │
                          ▼                           ▼
                      body track                  facial track
                          │                           │
                  TargetBody                      FacialBlend
                  Animation                       shapeAnim
                  (character-fitted)              (character-agnostic)
                          │                           │
                          ▼                           ▼
                  bevy_vrm1 가                    bevy_vrm1 가 character 의
                  SkeletalMesh 본                  VRM expression slot 에
                  회전에 적용                      weight 적용
                                                  · 같은 0.5 가 캐릭터마다
                                                    다른 표정 (캐릭터 측
                                                    슬라이더 정의가 흡수)
                          │                           │
                          └─────────────┬─────────────┘
                                        │
                                        ▼
                              매 프레임 캐릭터가 웃으면서 춤춤
```

> [!info] Facial 이 retarget 안 거치는 이유
> ARKit 52 가 canonical 이라 channel mapping 으로 끝. character 측 VRM expression slot 정의가 캐릭터별 차이를 흡수. body 는 본 길이/비율 차이 보정이 필요해서 math 단계 필수.

---

## 비대칭 포인트 — 왜 body / facial 이 다른 타입으로 끝나는가

| 측면 | Body | Facial |
|------|------|--------|
| 정규화 단계 수 | 2 단계 (normalize + retarget) | 1 단계 (normalize 만) |
| 캐릭터-특화 책임 위치 | **animation 측** (retarget math) | **character 측** (VRM expression slot 정의) |
| anim track 입력 | `TargetBodyAnimation` (character-fitted) | `FacialBlendshapeAnim` (character-agnostic) |
| 추상화 레벨 | 캐릭터마다 다른 출력 | 모든 캐릭터에 동일한 weight |

> [!tip] 왜 이렇게 다른가
> Body 는 캐릭터마다 본 길이/비율/T-pose 다름 → animation 측에서 보정 필요 → math.
> Facial 은 ARKit 52 weight 0.5 가 들어가면 각 캐릭터 VRM expression slot 이 자기 식으로 해석 → animation 측에선 그냥 weight 만 보내면 됨.

이름 (`Target*` vs `Normalized*`) 자체가 비대칭을 정직하게 드러냄. 통일하려는 시도 (예: 양쪽 다 `Playable*`) 는 본질적 차이를 가림 → 추천 아님.

---

## 두 종류의 "character"

User 가 "코어 엔티티에 넣지 않음?" 의문을 가질 만한 포인트.

| 구분 | 도메인 Character | NormalizedCharacterModel |
|------|----------------|--------------------------|
| 무엇 | What user authored (VRM ref, name, role) | How retarget drives this character |
| 위치 (타입) | shotloom-engine `Character` 마커 + bundle | character-model-normalizer 출력 |
| 위치 (런타임) | character entity 의 component | 같은 entity 의 sibling component |
| 결정 ADR | ADR-0013 | ADR-0030 |
| 정규화 책임 | shotloom-gltf (VRM 포맷) | character-model-normalizer (retarget 정렬) |

**런타임 entity 는 하나, 컴포넌트는 여러 개.** 도메인이 retarget 개념에 결합되지 않도록 타입은 분리, ECS 에서 co-locate.

---

## 크레이트 의존 방향 (단방향)

```
shotloom-gltf, shotloom-fbx-anim       (source parsers)
                       │
                       ▼
              shotloom-import           (cache descriptors)
                       │
                       ▼
              shotloom-source-anim      (source-side 타입 소유)
                       │
                       ▼
   ┌──────────────────┴──────────────────┐
   ▼                  ▼                  ▼
character-model-   body-anim-       facial-anim-
normalizer         normalizer       normalizer    (preprocessing)
   │                  │                  │
   └──────────────────┼──────────────────┘
                      ▼
              shotloom-retarget         (body retarget math)
                      │
                      ▼
              shotloom-engine           (런타임 / playback)
```

순환 의존 없음. ADR-0034 (PR #188) 가 `SourceAsset` / `SourceFormat` 을 retarget 밖 `shotloom-source-anim` 으로 빼서 normalizer ↔ retarget 의존 사이클 방지.

---

## 핵심 invariant

> [!abstract] Pipeline rule (목표 상태)
> 1. **레이어 단방향** — parser → import → source-anim → normalizer → retarget → engine
> 2. **retarget = math 만** — parsing / cache / normalization 책임 없음
> 3. **타입 ownership 은 생산 크레이트가 가진다** — normalizer 출력 타입은 normalizer 가 정의 (ADR-0030 invariant)
> 4. **런타임 co-location** — 같은 entity 에 sibling component 로 attach. 타입 ownership 과 별개.
> 5. **body / facial 비대칭이 타입에 드러난다** — body = `Target*` (retarget 거침, character-fitted), facial = `Normalized*` (mapping 만, character-agnostic)
> 6. **두 종류 normalize 분리** — shotloom-gltf 가 포맷 (VRM 0.x→1.x, ADR-0013), normalizer 들이 retarget-pipeline canonical (CR / ARKit 52, ADR-0030)
> 7. **모든 normalizer 출력은 단일 canonical target** — body → CR, facial → ARKit 52

> [!warning] 현재 vs 목표 (2026-04-28)
> Rule 3 (타입 ownership) 은 STL-208 으로 달성 ✓
> Rule 2 (retarget = math 만) 는 함수 본체 이주가 끝나야 완성 — STL-183 (PR #188) → STL-194 시퀀스 대기 중
> Rule 5 (비대칭 이름) 은 STL-215 rename 후 완성

---

## 모듈별 입출력

각 크레이트의 public surface 기준. 타입 이름은 origin/main 또는 PR #188 (`shotloom-source-anim`) 기준.

### shotloom-gltf — VRM / glTF parser + 포맷 normalize

| | 타입 |
|---|---|
| **Input** | VRM / glTF 바이트 |
| **Output** | normalized VRM 1.x 바이트 + `vrm_extract::*` (rest pose, finger map, expression bindings 추출) + `ExtractedFootGeometry` / `ExtractedFootSide` (foot contact 데이터) + `Diagnostic[]` |
| **책임** | VRM 0.x → 1.x 포맷 정규화 (ADR-0013). 캐릭터 식별. foot contact / rest pose 추출. |
| **Public fns** | `extract_foot_contact_data(...)`, `vrm_normalization::*`, `vrm_extract::*` |

### shotloom-fbx-anim — FBX parser

| | 타입 |
|---|---|
| **Input** | FBX 바이트 + `ParseConfig` + `FbxImportMode { Body, Face }` |
| **Output** | 파싱된 본 그래프 / 채널 데이터, 에러는 `Error` |
| **Public fns** | `parse(...)`, `parse_with_config(...)`, `validate_for_mode(...)` |
| **상수** | `DEFAULT_SAMPLE_RATE` |

### shotloom-import — 오케스트레이션 + 캐시

VRM 경로:

| | 타입 |
|---|---|
| **Input** | VRM 바이트 + cache root path |
| **Output** | `ImportedVrmAsset { normalized_artifact, source_reference, source_flavor, diagnostics }` |
| **Driver** | `import_vrm_to_cache(...)` |

FBX 경로:

| | 타입 |
|---|---|
| **Input** | FBX 바이트 + `FbxImportMode (Body \| Face)` + cache root |
| **Output** | `ImportedFbxAnimation { artifact_ref, content_hash, mode, diagnostics, ... }` |
| **Driver** | `import_fbx_to_cache(...)` |

> [!info] cache descriptor 의 의미
> `ImportedFbxAnimation` 은 파싱된 본 그래프를 들고 있는 게 아니라, **artifact 경로 + content hash + mode + 진단** 만 담은 가벼운 디스크립터. Normalizer 들이 이 디스크립터로 다시 `parse_with_config` 호출해서 본 그래프 재획득. `docs/arch/normalizer-pipeline.md` 명시.

### shotloom-source-anim — source-side 타입 소유 (PR #188)

| | 타입 |
|---|---|
| **Input** | (없음 — 타입 정의 전용 크레이트) |
| **Output** | `SourceAsset` / `SourceBone` / `SourceBoneTrack` / `SourceSkeletonFrames` / `SourceFormat { Auto, Blender, Maya, ... }` |
| **Helpers** | `euler_to_quat(...)`, `compute_source_skeleton(...)` |
| **목적** | 파서 / normalizer / retarget 가 source animation 데이터 모델을 공유하면서 retarget 에 의존하지 않게 분리. ADR-0034. |

### shotloom-character-model-normalizer

| | 타입 |
|---|---|
| **Input** (현재) | 인메모리 rest pose (`bone_rest_local`, `bone_rest_global`, `parent_map`) + source bone track slice |
| **Input** (STL-183 후) | `ImportedVrmAsset` 직접 |
| **Output** | `RestAlignOverride[]` (per-bone rest 보정) + `FingerAxisEntry[]` (손가락 회전축) + diagnostic warnings |
| **Public fns** | `align_full_body_rest(...)` |
| **Future scope** | foot contact / sole offset 이주 (현재 shotloom-gltf), VRM expression binding |

### shotloom-body-anim-normalizer

| | 타입 |
|---|---|
| **Input** | `ImportedFbxAnimation(Body)` + ARP rig info |
| **Output** | `Vec<BoneTrack>` (CR 정렬 per-bone 트랙) |
| **CanonicalTarget** | `CanonicalTarget::Cr` (CINEV Rest pose) |

`BoneTrack` 구조:

```rust
pub struct BoneTrack {
    pub vrm_bone_name: String,
    pub src_bone_name: String,
    pub timestamps: Vec<f32>,
    pub rotations: Vec<Quat>,         // src_local_rest 와 factor 됨
    pub src_local_rest: Quat,
    // ... 추가 필드
}
```

> [!warning] 현재 함수 본체는 retarget 안
> 타입 `BoneTrack` 은 normalizer 소유 (STL-208 ✓). 그러나 normalize 함수 본체는 아직 `shotloom-retarget` 안. STL-194 가 STL-183 머지 후 이주 마무리.

### shotloom-facial-anim-normalizer

| | 타입 |
|---|---|
| **Input** (목표) | `ImportedFbxAnimation(Face)` |
| **Output** (목표) | facial channel weights, ARKit 52 정렬 (타입명 미정 — 후속 sub-issue) |
| **현재 surface** | `ARKIT_52_CHANNEL_NAMES: &[&str; 52]` 상수만 |
| **Status** | **scaffold only** — 함수 / 출력 타입 모두 미정의. ADR-0033 의 canonical 정의만 land. |

### shotloom-retarget — body retarget math

| | 타입 |
|---|---|
| **Input** | `SourceAsset` (source body anim) + `VrmRestPose` (target character rest, character-model-normalizer 출력) + `RetargetConfig` + `RetargeterOptions` |
| **Output** | `TargetAnimation { duration_secs, bones: Vec<RetargetedBone>, expression_tracks: Vec<ExpressionTrack>, log: Vec<String> }` |
| **Driver** | `retarget_arp_to_vrm(...)` (per ADR-0025) |
| **Postprocess** | wrist twist 등 (`postprocess::*`) |
| **상수** | `VRM_ROOT_BONE` (cross-crate sentinel) |

`TargetAnimation` 구조:

```rust
pub struct TargetAnimation {
    pub duration_secs: f32,
    pub bones: Vec<RetargetedBone>,
    pub expression_tracks: Vec<ExpressionTrack>,
    pub log: Vec<String>,
    // TODO(Layer 5): quality / score 필드 (STL-75 였음, 취소됨)
}
```

> [!info] STL-215 rename 후
> 크레이트 → `shotloom-body-retarget`, 타입 `TargetAnimation` → `TargetBodyAnimation`.

### shotloom-engine — 런타임 / playback

| | 타입 |
|---|---|
| **Input** | `TargetBodyAnimation` (body) + facial channel weights + character entity (ECS) |
| **Output** | bevy ECS world 변경:<br>· `SkeletalMesh` 본 회전 적용 (bevy_vrm1)<br>· VRM expression slot weight 적용 (bevy_vrm1)<br>· timeline / track resource 갱신 |
| **Components on character entity** | `Character` (마커) / `VrmAssetHandle` / `AuthoredDisplayName` / `NormalizedCharacterModel` / `SkeletalMesh` / `Transform` / ... |
| **Driver fns** | `spawn_character(...)`, `spawn_character_from_asset_deferred(...)` |

---

## 의존 그래프 vs 데이터 흐름 (둘 다 단방향, 같은 모양)

크레이트 의존 (compile-time):

```
shotloom-gltf      shotloom-fbx-anim
       └─────┬───────────┘
             ▼
        shotloom-import
             │
             ▼
        shotloom-source-anim
             │
             ▼
   ┌─────────┼─────────┐
   ▼         ▼         ▼
character  body-anim facial-anim
-model-    -normal.  -normal.
normalizer
   └─────────┼─────────┘
             ▼
        shotloom-retarget
             │
             ▼
        shotloom-engine
```

데이터 흐름 (runtime):

```
바이트 → 파싱 → cache desc → source 타입 → 정규화 출력
                                              ↓
                              → retarget math → TargetBodyAnimation
                                              ↓
                                          → engine timeline → 화면
```

순환 의존 / 역방향 데이터 흐름 없음.

---

## 관련 ADR

- `docs/adr/adr-0013-generated-character-contract.md` — 도메인 Character 계약 (VRM 포맷 normalize 경계)
- `docs/adr/adr-0030-normalizer-crate-extraction.md` — 3-normalizer 추출 마스터플랜 (umbrella STL-127)
- `docs/adr/adr-0033-arkit-52-blendshape-canonical.md` — ARKit 52 facial canonical
- `docs/adr/adr-0034-source-animation-type-ownership.md` — source-anim 분리 (ADR-0023 §6 supersede)
- `docs/adr/adr-0023-retargeter-validation-contract.md` — retargeter validation (§6 superseded)

## 관련 Linear

- STL-127 — normalizer crate extraction umbrella
- STL-183 — source-anim 분리 (PR #188 in review)
- STL-194 — body normalize 함수 본체 이주
- STL-215 — `shotloom-body-retarget` + `TargetBodyAnimation` rename
- STL-193 / STL-195 / STL-208 — scaffold 머지 완료

## 관련 in-repo docs

- `docs/arch/normalizer-pipeline.md` — 같은 내용의 정식 architecture 문서
