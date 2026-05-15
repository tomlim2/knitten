---
title: "shotloom 개발일지"
tags:
  - type/devlog
  - project/shotloom
  - area/game-dev
date: 2026-05-12
source: claude
---

# shotloom 개발일지

Shotloom 작업 회고. PR 본문에 이미 남은 변경 요약은 반복하지 않고, 리뷰에서 틀린 점과 다음 작업 규칙만 남긴다.

---

## 프로젝트 개요

| 항목 | 내용 |
|------|------|
| 시작일 | 2026-05-12 |
| 스택 | Rust, Bevy, WebGPU/WASM, React, TypeScript |
| 목표 | 웹 우선 cinematic scene editor의 안정적인 런타임, authoring UI, import/export 파이프라인 구축 |

---

## 현재 상태 (2026-05-12 기준)

| 기능 | 상태 | 비고 |
|------|------|------|
| Devlog staging | 진행 | Resolver fallback 경로 기준으로 기록 |

---

## TODO

- [ ] Vault 사용 가능 환경에서 `learn-archive-week`로 staging 기록을 정리한다.

---

## Day 1 (05-12): STL-369 PR 리뷰 회고
- PR 리뷰에서 ADR/arch 문서의 책임 분산, 선행 참조, 범위 drift 지적을 기록.
- 배운 것: ADR에는 durable decision만 두고 현재 topology는 `docs/arch/`로 위임한다.
- [[shotloom/days/day-01|상세]]

## Day 2 (05-13): STL-398 PR 리뷰 회고
- VRM thumb slot warning PR에서 diagnostic spec table, parse policy, malformed input test 지적을 기록.
- 배운 것: 새 diagnostic code는 warning text가 아니라 spec, failure policy, branch coverage까지 묶인 작은 contract다.
- [[shotloom/days/day-02|상세]]

## Day 3 (05-13): STL-380 PR body 회고
- PR #310에서 final code와 PR description이 어긋난 두 문장(Debug header link, sidebar width)을 기록.
- 배운 것: fix-up commit 뒤에는 PR body의 UI 요소와 numeric CSS claim을 final diff로 다시 검산한다.
- [[shotloom/days/day-03|상세]]

## Day 4 (05-13): STL-402 PR 리뷰 회고
- PR #317에서 private policy helper의 undocumented branch policy, table drift risk, PR testing checklist mismatch를 기록.
- 배운 것: 후속 PR이 의존할 private helper는 intentional `None`, table role, fallback/tie behavior를 문서와 테스트로 같이 pin한다.
- [[shotloom/days/day-04|상세]]

## Day 5 (05-13): STL-400 PR 리뷰 회고
- PR #313에서 GLB fixture provenance, default-empty assertion, fixture path helper, attribution discoverability 지적을 기록.
- 배운 것: binary fixture는 source/license/LFS/discoverability까지 함께 test contract로 다뤄야 한다.
- [[shotloom/days/day-05|상세]]

## Day 6 (05-15): Shotloom merged PR wrapup
- PR #336, #335, #332 wrapup에서 review findings와 local worktree cleanup rule을 기록.
- 배운 것: `Part of` PR은 merged여도 parent Linear issue를 Done으로 닫지 않는다.
- [[shotloom/days/day-06|상세]]
