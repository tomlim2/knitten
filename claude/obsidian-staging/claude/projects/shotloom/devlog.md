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
