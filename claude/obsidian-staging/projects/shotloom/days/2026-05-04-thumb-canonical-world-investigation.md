---
title: "2026-05-04 — thumb canonical-world 조사"
tags:
  - type/devlog
  - project/shotloom
  - area/retarget
date: 2026-05-04
source: claude-code
---

# 2026-05-04 — thumb canonical-world 조사

shotloom 의 retarget 서브시스템에서 thumb 본이 rig 별로 일관되게 매칭되도록 만드는 작업. xiao 같은 1.x VRoid 는 정상 (happy path) 이지만 vrm0x (0.x converted) 와 backward-stripped vrm1x (yoya, minjoon) 는 thumb 가 시각적으로 어긋남. 브랜치 `feat/retarget-add-calibration-mode`, 커밋 `53c9ba8` 에 today's checkpoint push 완료.

## Big picture

ARP→VRM retarget 의 thumb 처리 통일이 목표. 직전 PR (#228 — thumb chain naming canonicalization 작업) 에서 4-finger ScalarCurl 와 thumb `canonicalize_thumb_chain_naming` 이 land 한 상태. 이번 작업은 thumb 도 같은 ScalarCurl runtime path 로 라우팅하면서 rig-별 bind 차이를 흡수하는 메커니즘 설계.

## Why

- xiao / c-normal / zepeto / vrm0x / yoya / minjoon 6개 rig 의 thumb 결과가 서로 다름
- 4-finger 는 Stage 4 ScalarCurl rest_sync 가 frame 정렬해서 정상이지만, thumb 은 `*Thumb*` rule = `Skip` 으로 우회되어 rig bind 의 quirk 가 그대로 전파
- 특히 vrm0x / backward 는 `normalize_vrm_bones_180y` 가 root 의 180Y 만 strip 하고 자식 local rotation 은 안 건드려서, 자식 본의 local X/Z 가 world 기준에서 mirror 됨 (Y 는 보존)
- 결과: thumb 의 curl 방향이 시각적으로 반대거나 angle 이 어긋남

## What I tried (in order)

1. **runtime ScalarCurl 에 thumb 포함** — `is_scalar_curl_finger` 가 thumb 도 통과하게. 가장 작은 변경, "나쁘지 않음" 평가. 다만 flipped rig 의 axis flip 미해결.
2. **per-rig flip flag (RetargeterOptions)** — `cache_label == "vrm0x" | "yoya"` 일 때 target curl axis 부호 반전. example 한정 휴리스틱이라 production 부적합. 두 번 시도 후 두 번 revert.
3. **Stage 4 ScalarCurl rest_sync 에 thumb 포함 (옵션 B)** — `apply_in_place` 가 ADDITIVE 라 1.x rig 의 thumb 가 over-curl ("중첩"). 실패.
4. **B' = REPLACE 모드** — thumb 만 `apply_in_place` 에서 baseline 만 set (기존 bind 무시). 부호 양/음 다 시도. frame 60 에서 변화 미미, frame 0 에선 baseline 자체가 작아서 거의 안 보임.
5. **canonical 쿼터넌 force-set (Blender 측 사용자 입력)** — 좌측 thumb 3개 본을 사용자 제공 쿼터넌으로 force-set, 우측 mirror. 시각 변화 있지만 rig 간 일관성 부족.
6. **180Y conjugate hypothesis** — backward/vrm0 는 parent frame 이 180Y mirror 됐으니 lookup 의 quat 을 R180Y conjugate `(-x, y, -z, w)` 해서 적용. 수학적으로는 깔끔했지만 시각 결과는 thumb 가 옆으로 활짝 벌어짐 (over-spread). 가설 기각 — 차이는 parent 180Y 만이 아니라 rig 별 bind 자체가 anatomically 다름.
7. **canonical world auto-calibration (현재 방향)** — xiao 의 thumb 6개 본 world rotation 을 `CANONICAL_THUMB_WORLD` const 로 박고, `build_from_bytes` 에서 모든 rig 의 thumb bind 를 `inverse(parent_global) * canonical_global` 로 force-set. Metacarpal → Proximal → Distal 위상 순서로 walk.

## What's currently working

- Production-side 변경 모두 in. 6개 rig 모두 build_from_bytes 통과 후 thumb 의 `bone_rest_global` 이 xiao 와 동일한 quat
- thumb 도 `is_scalar_curl_finger` 통과 → runtime ScalarCurl 가 일관된 axis 로 curl 적용
- `align_full_body_rest` / `stage4_sync_rest_to_fbx` / `rest_sync_strategy` 가 `backward_normalized: bool` 새 파라미터 받게 plumb 완료
- 새 unit test 6개 (`arp_vrm_user_pose::lookup` 분기 + `DEFAULT_POSE` invariant)
- thumb regression snapshot regen
- 전체 테스트 통과, fmt / clippy / doc-paths 모두 green

## What's not working yet

- 시각 검증 결과: vrm0x / yoya / minjoon 의 thumb 가 frame 0 에서 xiao 와 *완전 일치하지는 않음*. canonical world force-set 후에도 over-spread. 가능 원인:
  - (a) parent 본 (hand) 의 world rotation 이 rig 별로 다름 → canonical thumb world 가 같아도 hand 와의 상대 관계가 어긋남
  - (b) rig 별 mesh skinning 이 IBM 보정으로 visual 다를 수 있음
  - (c) 본 자체 길이/translation 이 rig 별 다름
- 다음 점검 후보: hand world rotation 까지 canonical 화, 또는 thumb chain 전체 (hand → metacarpal → proximal → distal) 를 canonical 시리즈로 통일

## What's next

1. 위 "not working yet" 의 시각 차이 원인 좁히기 — hand bone 의 world rotation 6 rig 비교 dump
2. 결과에 따라:
   - hand 까지 canonical 시리즈 확장 vs
   - hand-relative thumb local 로만 canonical 화 (parent_global 차이 흡수)
3. 시각 일관성 확인 후 Task #5 (vrm0x thumb regression snapshot) 추가
4. `/shotloom-review-before-pr` → PR

## 추가 진척 (오후 후속, smoking gun 도출)

위 "What's next" 1-2 단계를 sub-agent 5개 병렬로 진행해서 root cause 까지 좁힘.

### 진단 layer 5단계

| # | sub-agent | 도구 | 결과 |
|---|---|---|---|
| 1 | runtime ScalarCurl path rig-dependent 항 추적 | 코드 read | 후보 5개 (`dst_rest_local`, `parent_rest_yup`, `bone_rest_t` 등) — canonicalization 후엔 모두 같아야 함 |
| 2 | Stage 4 `apply_user_calibrated_one` 가 canonical 덮어쓸 가능성 | 코드 read | `parent_global * old_local * delta` — hand global 이 모든 rig 에서 같으면 결과 동일 |
| 3 | thumb world rotation 측정 | `dump_thumb_rest.rs` 신규 작성 | 6 rig × thumb 6 본 모두 canonical 값으로 통일됨. delta 0.00° |
| 4 | per-frame retarget 출력 비교 | `dump_thumb_anim.rs` 신규 작성 | 6 rig × 6 본 × 2 frame = 72 quat 모두 **bit-perfect identical**. retarget 출력 자체는 완벽 |
| 5 | normalized GLB hand→thumb hierarchy dump | `dump_hand_thumb_chain.rs` 신규 작성 | **Smoking gun**: yoya / minjoon / vrm0x 의 humanoid map 에서 depth-1 본이 `*ThumbProximal` 로, depth-2 가 `*ThumbMetacarpal` 로 매핑됨 (anatomy 와 1단계 어긋남) |

### Smoking gun

normalized GLB 의 humanoid bone slot 매핑이 anatomy 와 어긋남:

| Rig | depth 1 (wrist-attached) | depth 2 | depth 3 |
|---|---|---|---|
| xiao / c-normal / zepeto | `*ThumbMetacarpal` ✓ | `*ThumbProximal` ✓ | `*ThumbDistal` ✓ |
| **yoya / minjoon / vrm0x** | `*ThumbProximal` ❌ | `*ThumbMetacarpal` ❌ | `*ThumbDistal` ✓ |

기존 `vrm_rest::canonicalize_thumb_chain_naming` (직전 PR 에서 도입) 가 swap 하지만 **VrmRestPose 안의 dictionary 키만**. bevy_vrm 이 직접 읽는 GLB 의 humanoid map 은 손대지 않아 entity 가 anatomy 와 어긋난 이름으로 생성됨. retargeter 출력은 swap 된 이름 기준이라 **회전이 잘못된 위치의 본에 적용**.

### PoC 검증 → 정식 이슈로 분리

`shotloom-gltf::vrm_normalization::finalize_normalized_vrm` 마지막 단계로 humanoid map slot swap 을 GLB-level 에서 수행하는 PoC 를 잠시 도입.

- yoya 의 humanoid map: `node[84] (Thumb Proximal.L)` → `leftThumbMetacarpal` 로 mapping ✓
- 노드 이름 자체는 GLB 원본 그대로 (외부 디버깅 영향 최소화)
- bevy_vrm 이 곧장 anatomy 정합 본 entity 생성 → finger_compare 시각 정상화

PoC 변경은 calibration 브랜치에서 revert 하고 humanoid bone canonicalization at VRM import 정식 이슈로 분리 (priority High, parent: post-normalizer character model guardrails 우산 이슈). 다음 첫 작업.

### 부수 정리

- `is_scalar_curl_finger` thumb 포함 변경도 revert (calibration 브랜치 scope 와 어긋남, humanoid canonicalization 후속 이슈 본문에서 함께 결정)
- 진단 도구 3개는 examples 폴더에 영구 보존 — 미래 retargeter library 작업 시 같은 종류 회귀 즉시 재활용 가능
- Learning 노트 작성: `obsidian-staging/projects/shotloom/learnings/vrm-import-needs-unity-style-canonicalization.md` — 5단계 추적 + Unity-style import 로드맵 4단계 (slot canonicalization → bone length → axis → spring bone) 정리

### 핵심 교훈

데이터 파이프라인 진단은 *layer 별로 출력 dump* 해서 어디서 갈리는지 좁히는 게 가장 빠름. 추측만 했으면 며칠 더 걸렸을 것. 직전 PR 가 도입한 "이름만 swap" 패턴은 *single source of truth 까지 거슬러 올라가지 못하면 다운스트림 consumer 에서 다시 어긋남* 이라는 교훈도 명확.

## 사이드 노트

- `convert_humanoid` 의 0.x → 1.x rename 테이블 (`vrm_normalization.rs:1404`) 은 여전히 backwards 의심 상태 — `Intermediate → Metacarpal`, `Proximal → Proximal` 매핑이 anatomy 와 어긋남. 기존 `canonicalize_thumb_chain_naming` 가 retarget 단계에서 swap 으로 정리해서 다운스트림은 영향 없지만 별도 이슈로 정리 필요
- finger_compare 의 calibration mode (Tab/1-6/QEAD/ZX/Cmd+R/[/]/C/Shift+C/Cmd+C/V) 는 사용 빈도가 낮아 PR 정리 단계에서 슬림화 또는 제거 검토
- bevy_vrm caller 진입점 (`build_from_bevy_vrm`) 은 raw bytes 미보유라 `backward_normalized: false` 로 default — 향후 caller 가 직접 set 필요할 수 있음
