---
title: "Shotloom devlog — 2026-04-22"
tags:
  - devlog
  - shotloom
  - gltf
  - vrm
  - testing
date: 2026-04-22
source: claude
---

# Shotloom devlog — 2026-04-22

`shotloom-gltf` 의 VRM normalization 파이프라인은 import → retarget → preview 로 이어지는 캐릭터 골든 패스의 입구고, `debug_normalize_vrm_stages` 는 그 파이프라인을 단계별로 들여다볼 수 있는 유일한 디버그 진입점이다. VRM0 분기는 테스트가 두터웠지만 VRM1 분기는 0 이었고, 특히 `converted_vrm1_bytes == None` 이라는 "VRM1 경로는 VRM0 conversion 을 절대 거치지 않는다"는 불변식이 어디에도 assert 되어 있지 않았다 — 조용히 깨지면 `shotloom-retarget/examples/vrm_spec_validate.rs` 같은 downstream 툴이 엉뚱한 바이트를 보고서야 드러난다. STL-106 (PR #111) 에서 ryumiel 이 갭으로 짚고 스코프 밖이라 분리된 follow-up. PR [#143](https://github.com/CINEV/shotloom/pull/143).

---

## Why

`debug_normalize_vrm_stages` 는 import/retarget 파이프라인의 디버그 진입점으로, `crates/shotloom-retarget/examples/vrm_spec_validate.rs` 가 호출한다. VRM1 분기는 커버리지가 0이었고, 함수 시그니처상 `converted_vrm1_bytes == None` 이 VRM1 경로의 불변식이지만 어디에도 assert 가 없었다. 조용한 regression 이 생기면 downstream 예제/툴이 이상 동작할 때까지 안 보인다. STL-106 (PR #111) 스코프 밖이라 분리된 이슈.

## How

- `crates/shotloom-gltf/src/vrm_normalization.rs` 테스트 모듈에 두 개 추가.
- 기존 헬퍼 재사용: `complete_vrm1_json()` (forward), `build_vrm1_with_backward_hips()` (180Y root 주입).
- 테스트 이름은 assertion 과 1:1 매칭 — `_forward_passthrough`, `_backward_rewrites_normalized_bytes`.

## What

두 테스트:

1. **forward passthrough** — 정상 VRM1 GLB → `stages.normalized_bytes == raw_bytes`, `converted_vrm1_bytes == None`.
2. **backward rewrite** — hips 노드에 180Y rotation 주입된 VRM1 → `normalized_bytes != raw_bytes` (180Y 제거됨), `converted_vrm1_bytes == None` 불변식은 여전히 유지.

36 줄, production 코드 변경 0. `cargo test -p shotloom-gltf --lib` → 64 passed (기존 62 + 신규 2).

---

## 사이드 노트

- 브랜치 처음에 `test/normalize-vrm1-coverage` 로 만들었는데, `/shotloom-review-before-pr` G4 패턴이 잡아냄. CONTRIBUTING.md 에 허용된 prefix 는 `feat|fix|chore|hotfix|release` 뿐이고 test-only 는 `chore/` 로 가라고 명시. 이미 푸시한 상태였는데 리네임 + 구 브랜치 원격 삭제 + 재푸시로 해결. pre-PR self-review 가 여기서 값을 함.
- `/shotloom-start-code` 훅이 Linear 링크 감지해서 자동 발동 → 워크트리 생성 → 컨벤션 재독 → Ready 브리핑 흐름이 매끄러웠음. 손으로 했으면 워크트리 빠뜨렸을 것.
