---
title: PR #262 closed — debug spawn run preview
tags:
  - type/devlog
  - project/shotloom
  - area/game-dev
date: 2026-05-08
source: claude
---

# PR #262 — debug spawn run preview (paused, re-review 대기)

## 11:35 — closed ([#262](https://github.com/CINEV/shotloom/pull/262))

`ryumiel` round 1 리뷰 → 블로커 2개 + nit 8개 대응 완료 (`fda9def`) → 머지.

**지적 1 — VRM seed가 FBX parse 성공에 종속됨 (Blocking).** `app.rs:585` 에서 VRM seed가 FBX early-return 안에 있어서 FBX 실패 시 debug character 자체가 렌더 안 됨 — doc comment는 "FBX 실패 시 Idle fallback"이라 했는데 실제로는 VRM도 같이 죽음. VRM과 FBX는 독립 자산이라 early-return을 분리해야 함. → VRM byte-overlay를 FBX 파싱 전으로 이동.

**지적 2 — `seed_debug_character_assets` boot post-conditions 테스트 없음 (Blocking).** 세 가지 early-return 경로가 CI 신호 없이 Idle로 silent degrade 가능. → `seed_debug_character_assets_writes_overlay_manifest_and_meta`, `seed_debug_character_assets_is_idempotent_on_repeat_call`, `debug_spawn_seeded_clip_uses_run_motion_when_meta_present` 3개 유닛 테스트 추가.

**지적 3 — `motion.rs:318` translation-write가 모든 retarget 애니에 영향 (Notable nit).** debug spawn 로컬 픽스로 제출했는데 실제로는 rest-pose write가 모든 retarget 경로에 적용됨 — behavioral expansion. 현재 no-op이라 문제 없지만 per-clip opt-out 부재. → tech-debt 항목으로 등록.

**지적 4 — 16MB `include_bytes!` tech-debt 엔트리 없음 (Notable nit).** wasm 번들 +16.7MB (VRM 14.7 + FBX 2.0). pre-alpha 수준에서 허용되지만 cleanup trigger 없이 박으면 안 됨. → `docs/tech-debt/wasm-debug-asset-embedding.md` 신규 작성.

> [!tip] 독립 자산은 early-return을 공유하면 안 된다
> VRM과 FBX는 각자 실패/성공 경로가 있고 서로 무관함. 하나의 early-return 블록으로 묶으면 "A 실패 시 B도 죽음"이라는 숨겨진 의존성이 생김. 자산별 fallback을 doc comment에 적었으면 코드도 그 모양이어야 함.

> [!abstract] Rule
> 독립 자산(VRM, FBX 등)의 seed 로직은 early-return을 공유하지 말 것 — 실패 경로가 다르면 분리. doc comment의 fallback 설명과 실제 early-return 구조가 일치하는지 PR 전 확인. #rule
