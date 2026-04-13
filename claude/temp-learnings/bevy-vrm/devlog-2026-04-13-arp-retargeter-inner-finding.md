# 2026-04-13 — ArpRetargeterInner 정리 조사 결과

Tier1 세션의 미래 작업 #2 (Inner를 `pub(crate)` 강등) 조사. **결론: 강등 불가, 의도적으로 `pub` 유지.**

## 조사

3개 외부 caller가 Inner 직접 사용 중. 각각 왜:

### 1. Bevy app (`src/retarget.rs:163`)

- `MappedAnimation`은 별도 system(`file_loading`)에서 미리 만들어 `RetargetState::pending_anim`에 저장
- `VrmRestPose`는 retarget 직전에 Bevy entity walk로 구성 (또는 GLB 추출)
- `FbxSkeletonFrames`는 `FbxSkeletonViz` resource에 별도 보관 (gizmo 렌더링용)
- `RetargeterOptions`는 UI state(`arp_vrm_rest_align_adapter` toggle)에서 옴

전체 파이프라인이 **Bevy system 단위로 의도적으로 분할**됨. `ArpRetargeter::retarget()`로 마이그레이션하려면 file_loading→apply_retarget의 system 분리를 무너뜨려야 함.

### 2. 스윕 bin (`bin/retarget_test.rs:130`)

- `retarget_with_skeleton()`이 `(MappedAnimation, _diag, FbxSkeletonFrames)` 리턴 → `anim`과 `fbx_skeleton`을 모두 받음
- `anim.bone_tracks`가 rubric C1.3 residual 채점용 `src_rotations_by_vrm` 맵 빌드에 필요
- `fbx_skeleton`이 `rubric_c::evaluate`의 `src_fk` 인자

`ArpRetargeter::retarget()`는 `TargetAnimation`만 리턴하고 중간물(`MappedAnimation`, `FbxSkeletonFrames`)은 버림. 둘 다 마이그레이션 후에도 별도 경로로 다시 얻어야 함 → **Inner를 쓰는 게 더 깨끗**.

### 3. Validate harness (`quality/validate.rs:351`)

- 같은 crate 내부 호출 (`crate::ArpRetargeterInner` 경로). 이미 `pub(crate)`로도 OK
- 하지만 strong 강등의 핵심은 외부 caller인 1, 2번이라 1, 2번이 못 옮기면 의미 없음

## 결론

세 caller 모두 **retarget이 아닌 다른 이유**로 미리 계산된 조각들을 가지고 있음:
- Bevy resource lifetime (앱)
- Rubric C 채점 인자 (sweep bin)
- Validate harness 형태 (validate)

이들을 `ArpRetargeter::retarget()`로 강제 마이그레이션 = 각 caller의 파이프라인 구조 재설계 필요. 단순 rename으로 해결될 일이 아니고, **얻는 가치도 미미** (Inner의 `pub` 자체는 문제가 아니고, 그것이 "implementation detail"로 오해될 가능성만이 문제).

## 실행한 cleanup

`ArpRetargeter`와 `ArpRetargeterInner` 양쪽에 doc comment 추가:
- `ArpRetargeter` → "easy mode, 신규 caller는 이걸 써라" + 3개 caller가 왜 Inner를 직접 쓰는지 설명
- `ArpRetargeterInner` → "advanced API, pre-computed inputs를 가진 caller용. 신규 caller는 ArpRetargeter를 써라"

이렇게 doc 명시로 의도가 코드에 박힘. 미래의 누군가가 "Inner는 implementation detail이니 강등하자"고 다시 시도하기 전에 본 finding을 읽게 됨.

## 교훈

- "정리 가능 항목"으로 보이는 게 실제로는 **load-bearing pub API**일 수 있음. 강등 전에 caller의 구조적 이유를 먼저 조사할 것
- doc comment가 가장 싼 방어선. 강등 못할 거면 **왜 못 하는지**를 코드에 박아두면 미래 자신을 보호함
- "advanced vs easy mode" pub API 분리는 명시적이면 OK. `Inner`라는 이름이 오해 소지 — 미래 시점에 `ArpRetargetExecutor` 같은 이름이 더 정확할 수 있음 (지금은 rename 안 함, 별도 작업)

## 다음

#3 `quality/foot.rs` 506 LOC 감사로 넘어감. 별도 세션 단위 작업.
