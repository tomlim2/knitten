---
title: "04-14: STL-74 PR open + sequential-PR 패턴 정리"
tags: [devlog, shotloom, shotloom-retarget, stl-74, pr-workflow]
date: 2026-04-14
---

# 04-14: STL-74 PR open + sequential-PR 패턴

### 왜 이 작업을 했나

bevy-vrm `humanoid_retarget` → shotloom `shotloom-retarget` 이식을 STL-74(코드) / STL-75(품질 평가)로 쪼갠 뒤, STL-74 코드 포팅(Layer 0–4)을 마무리하고 draft PR을 올림. 그 다음 스텝으로 "75를 지금 시작할지 / 74 리뷰를 먼저 받을지"를 결정해야 했다.

---

### 무엇을 했나

- Layer 3 커밋 `11e7278` — rest pose + postprocess + adapters, vrm_rest slim화 (ADR-0023 §3, glb 파서 제거)
- Layer 4 커밋 `9daa673` — mapping + retargeter + source_anim, `RetargetError` 추가, `ArpRetargeterInner` → `pub(crate)`, 레거시 wrapper 드롭 (ADR-0023 Decision 9)
- `feat/shotloom-retarget` 브랜치 push, **Draft PR #66** 오픈
  - https://github.com/CINEV/shotloom/pull/66
  - 5 커밋 / +4027 LOC / 22 파일
- 게이트 그린: `cargo fmt --check`, `cargo clippy -p shotloom-retarget -- -D warnings`, `cargo check --workspace --exclude shotloom-desktop`, `node scripts/validate-doc-paths.mjs` (786 refs / 114 files)

---

### Sequential-PR 패턴 (기억할 것)

의존성 있는 두 PR을 연달아 올릴 때, **upstream PR의 리뷰가 끝나기 전에는 downstream 브랜치를 따지 않는다.**

**이유:**
- Downstream(75)이 upstream(74)의 public 표면(타입 이름, 가시성, 모듈 경계)에 직접 얹히는 구조면, 리뷰에서 네이밍/`pub(crate)` 범위/모듈 분할이 바뀌는 순간 downstream을 통째로 재작업해야 한다.
- Draft라도 리뷰 피드백이 들어오면 upstream 브랜치 자체가 force-push될 수 있고, 그 사이 downstream은 stale base 위에서 계속 자라게 된다 → 두 브랜치 모두 흔들림.
- ADR-0023 Decision 9의 "single public entry point" 같은 설계 원칙은 리뷰어가 가장 먼저 건드리는 지점.

**허용되는 병행 작업:**
- Downstream 설계 준비만 — 의존 그래프 정리, 원본 파일 재읽기, 포팅 순서 초안. **코드 작성은 금지.**
- 74가 실제 머지되거나, 리뷰어가 "표면은 이대로 동결"이라고 합의해준 뒤에 75 브랜치 생성.

**적용 체크리스트:**
1. Downstream이 upstream의 타입/함수/모듈을 `use`하는가? → 순차 실행 강제
2. Upstream이 scaffold 수준이고 downstream이 독립 파일만 추가하는가? → 병행 가능
3. Upstream이 draft인가? → draft여도 리뷰 피드백 전에는 순차

---

### 배운 점

- Draft PR은 "공개 피드백 요청"이지 "표면 동결"이 아니다. Downstream 시작 기준은 draft 여부가 아니라 **리뷰어의 표면 합의**.
- STL-74/75 분할 자체가 이미 이 패턴을 전제로 한 것이었음에도, 리뷰 대기 시간이 아까워서 병행하려는 충동이 있었다. 재작업 비용이 대기 시간보다 훨씬 크다.

---

### 다음 스텝

- STL-74 PR #66 리뷰 대기
- 대기 중에는 STL-75 준비만 — `quality/*` 모듈 의존 그래프 스케치, 원본 재독, Layer 5/6/7 포팅 순서 초안
- 74 머지 후 `feat/shotloom-retarget-quality` 브랜치 생성, STL-75 코드 시작

#devlog #shotloom #pr-workflow
