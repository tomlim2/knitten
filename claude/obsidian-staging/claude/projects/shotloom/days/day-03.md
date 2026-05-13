---
title: "Day 3 (05-13): STL-380 PR body 회고"
tags:
  - type/devlog
  - project/shotloom
  - lang/typescript
  - lib/react
  - area/editor-shell
date: 2026-05-13
day: 3
source: codex
---

# Day 3 (05-13): STL-380 PR body 회고

## 13:43 - STL-380 closed ([#310](https://github.com/CINEV/shotloom/pull/310))

회고 - 리뷰에서 어떤 지적을 당했나, 무엇을 배웠나.

**지적 1 - PR description이 첫 커밋 상태를 계속 설명했다.** 리뷰는 "the PR description still describes the first commit's state, not the final state"라고 했다. `DebugSidebar.tsx` 설명이 `Debug title + Back to editor link`를 가진다고 썼지만, 최종 커밋은 clutter를 줄이려고 그 링크를 제거했다. PR body는 구현 경로가 아니라 merge 시점의 산출물을 설명해야 한다는 `docs/guidelines/pr-guideline.md` Writing Guidance가 맞다. -> merge 전에 body를 고치지 못했고, #310 merged body에는 stale 문장이 남았다.

**지적 2 - CSS 수치가 최종 코드와 달랐다.** PR body는 sidebar column을 `clamp(180px, 18vw, 240px)`라고 설명했지만, 최종 CSS는 고정 `180px`이었다. 수치가 들어간 PR prose는 테스트처럼 정확해야 한다. 특히 CSS/layout 숫자는 reviewer가 diff와 body를 서로 검산하는 지점이라 stale 값이 남으면 merged 기록이 거짓말이 된다. -> merge 전에 body를 고치지 못했고, 다음 PR부터 final diff 확인 후 body를 갱신해야 한다.

> [!tip] 가장 중요한 배운 것 - PR body도 merge artifact다
> 코드가 맞아도 PR body가 틀리면 merge commit body와 GitHub 기록이 틀린 상태로 남는다. fix-up commit이 들어간 뒤에는 코드만 다시 보는 게 아니라 `## Changes`의 명사, UI 요소, CSS 수치를 final diff로 다시 검산해야 한다.

> [!abstract] Rule
> fix-up commit 뒤에는 PR body의 final-state claim, 특히 UI 요소와 numeric CSS 값을 diff 기준으로 다시 검산한 뒤 merge한다. #rule

> [!warning] merged 후에는 "quick edit before merge"를 회수할 수 없다
> PR #310은 리뷰어가 merge 전 body 수정을 요청했지만, merge 뒤에 확인하면서 stale body가 그대로 남은 것을 봤다. **교훈:** "LGTM, one note before merge"는 approval이 아니라 merge 전 마지막 blocking checklist로 취급한다.
