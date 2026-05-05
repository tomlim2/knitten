---
title: "VRM import 단계에서 humanoid map slot canonicalization 필요"
tags:
  - type/learning
  - project/shotloom
  - area/retarget
  - area/vrm
date: 2026-05-04
source: claude-code
---

# VRM import 단계에서 humanoid map slot canonicalization 필요

UniVRM (Unity) 가 VRM 을 import 할 때 humanoid bone 들을 Mecanim slot (depth 기반) 에 매핑해서 anatomy 일관성을 강제하는데, shotloom 에는 그 단계가 없어서 thumb retarget 결과가 rig 별로 시각적으로 다르게 나옴. 4-finger 는 우연히 영향 없지만 thumb 은 직격.

## 증상

`finger_compare` 예제에서 6 rig 비교 시 (xiao / c-normal / zepeto / yoya / minjoon / vrm0x):
- 1.x VRoid 계열 (xiao, c-normal, zepeto): thumb 정상
- backward-stripped 1.x (yoya, minjoon) + 0.x converted (vrm0x): thumb 가 손바닥 옆으로 활짝 벌어진 채 sideways extension. opposition 이 anatomically 어긋남

## 가설 검증 과정

1. Sub-agent 1: runtime ScalarCurl path 의 rig-dependent 항 추적 → BoneData 의 `dst_rest_local`, `parent_rest_yup`, `bone_rest_t` 등 후보. 다만 canonicalization 후엔 모두 같아야 함
2. Sub-agent 2: Stage 4 의 `apply_user_calibrated_one` 가 `canonicalize_thumb_world_rotations` 결과를 덮어쓸 가능성 의심. 그러나 hand global 이 모든 rig 에서 identity 라 결과는 동일
3. Sub-agent 3: `dump_thumb_rest` 로 6 rig 의 thumb world rotation 측정 → 모두 canonical 값으로 통일됨. delta 0.00°
4. Sub-agent 4: `dump_thumb_anim` 으로 retarget 출력 frame 0/60 dump → 6 rig × 6 본 × 2 frame = 72 quat 모두 bit-perfect identical. **즉 retarget 출력 자체는 완벽**
5. Sub-agent 5: `dump_hand_thumb_chain` 으로 normalized GLB 의 hand → thumb hierarchy dump → **smoking gun 발견**

## Smoking gun

GLB 의 humanoid bone slot 매핑이 anatomy 와 어긋남:

| Rig | depth 1 (wrist-attached) | depth 2 | depth 3 |
|---|---|---|---|
| xiao | `leftThumbMetacarpal` ✓ | `leftThumbProximal` ✓ | `leftThumbDistal` ✓ |
| c-normal | `leftThumbMetacarpal` ✓ | `leftThumbProximal` ✓ | `leftThumbDistal` ✓ |
| zepeto | `leftThumbMetacarpal` ✓ | `leftThumbProximal` ✓ | `leftThumbDistal` ✓ |
| **yoya** | `leftThumbProximal` ❌ | `leftThumbMetacarpal` ❌ | `leftThumbDistal` ✓ |
| **minjoon** | `leftThumbProximal` ❌ | `leftThumbMetacarpal` ❌ | `leftThumbDistal` ✓ |
| **vrm0x** | `leftThumbProximal` ❌ | `leftThumbMetacarpal` ❌ | `leftThumbDistal` ✓ |

**해석**: yoya / minjoon / vrm0x 의 normalized GLB 에서 *anatomical wrist-attached 본 (carpometacarpal joint)* 이 `leftThumbProximal` 로, *anatomical proximal phalanx* 가 `leftThumbMetacarpal` 로 매핑됨 (정확히 1.x spec 위반 패턴, 0.x convention 잔재).

이미 `vrm_rest::canonicalize_thumb_chain_naming` (직전 thumb chain naming canonicalization 작업에서 도입) 가 이 패턴을 감지해 **VrmRestPose 안의 dictionary 키만** swap 하지만, **GLB 자체의 humanoid map 은 손대지 않음**. 그래서:

- retargeter 는 swap 된 이름 기준으로 출력 — `actor_snap.rotations["leftThumbMetacarpal"]` 이 anatomy 의 wrist-attached 본 회전을 담음
- bevy_vrm 은 GLB 원본 humanoid map 으로 본 entity tag — anatomy wrist 본은 `leftThumbProximal` 이름으로 생성됨
- finger_compare 의 `apply_animated_frame` 이 이름 기준 lookup → **회전이 잘못된 본에 적용**

## 해결 방향 (PoC 로 검증 완료)

`shotloom-gltf::vrm_normalization::finalize_normalized_vrm` 에 단 한 단계 추가:
- humanoid map (extensions.VRMC_vrm.humanoid.humanBones) 의 `*ThumbMetacarpal` ↔ `*ThumbProximal` slot 매핑을 GLB JSON 안에서 직접 swap (depth-1 ↔ depth-2 패턴 감지 시)

PoC 결과 (cache 폴더 비우고 재실행 후 dump):
- yoya 의 humanoid map: `node[84] (Thumb Proximal.L)` → `leftThumbMetacarpal` 로 mapping ✓
- node 자체 이름 (`Thumb Proximal.L`) 은 GLB 원본 그대로 유지 (외부 디버깅 영향 최소화)
- bevy_vrm 이 곧장 anatomy 정합 본 entity 생성 → finger_compare 시각 정상화

## 더 큰 그림 (Unity-style import)

UniVRM 이 import 시 자동 처리하는 것들:

1. **Humanoid slot canonicalization** (위 PoC 가 다루는 부분, 가장 시급)
2. **Bone length normalization** — 같은 humanoid 본은 모든 rig 에서 같은 비례 길이로 scale → finger axis 하드코딩의 길이 의존성 제거
3. **Local +X = bone-length axis 정렬** — 본 local frame 컨벤션 통일 → finger curl axis hardcode 가 모든 rig 에서 동일하게 작동
4. **Spring bone / collider 정규화** — secondary motion 일관성

shotloom 은 (1) 만 자동으로 들어오면 thumb 시각 즉시 회복. (2)-(4) 는 long-term 안정성 향상.

## 진단 도구 (영구 보존)

`crates/shotloom-retarget/examples/` 아래에 진단 example 3개 살아있음:
- `dump_thumb_rest.rs` — 6 rig 의 thumb chain bind state (post-canonicalization)
- `dump_thumb_anim.rs` — 6 rig × 6 본 × 2 frame 의 retarget 출력 비교
- `dump_hand_thumb_chain.rs` — normalized GLB 의 hand → thumb hierarchy 와 humanoid map 매핑

미래 retargeter library 작업 (ADR-0025 trajectory) 시 같은 종류 회귀가 또 일어나면 즉시 재활용.

## 핵심 교훈

데이터 파이프라인 진단은 *layer 별로 출력을 dump* 해서 어디서 갈리는지 좁히는 게 가장 빠름. 이번엔 retargeter 출력 → bind 상태 → GLB hierarchy 까지 5개 레이어 dump 한 결과 GLB humanoid map 에서 갈린다는 게 명확해짐. 추측만 했으면 며칠 더 걸렸을 것.

또: 직전 PR 가 도입한 "이름만 swap" 보정은 본질적으로 *데이터 일관성을 한 dictionary 안에서만 유지* 하는 패턴 — 다운스트림 consumer (bevy_vrm) 가 별도 데이터 (GLB) 를 따로 읽으면 일치 안 함. 보정은 **single source of truth 까지 거슬러 올라가 거기서 처리** 하는 게 정답. 이 경우 GLB 자체.

### 사이드 노트

- PoC 는 humanoid map slot swap 만 — 노드 이름 / hierarchy 는 손대지 않음. 영향 범위 최소화 의도. 후속 단계 (bone length, axis 정렬) 는 별도 STL 이슈로 분리해 점진 도입
- 1.x spec 위반 rig 는 thumb chain naming canonicalization 작업의 후속 문제. 이 learning 은 그 작업의 motivation 보강
- Unity / UniVRM 의 정규화는 import 시 1회 비용 — runtime 매번 계산 안 해도 되는 깔끔한 설계
