---
title: "Day 6 (05-15): Shotloom merged PR wrapup"
tags:
  - type/devlog
  - project/shotloom
  - lang/rust
  - lib/bevy
  - area/game-dev
date: 2026-05-15
day: 6
source: claude
---

# Day 6 (05-15): Shotloom merged PR wrapup

## 14:10 — merged PRs closed ([#336](https://github.com/CINEV/shotloom/pull/336), [#335](https://github.com/CINEV/shotloom/pull/335), [#332](https://github.com/CINEV/shotloom/pull/332))

회고 — 리뷰에서 어떤 지적을 당했나, 무엇을 배웠나.

**지적 1 — debug surface는 route만 추가하면 끝이 아니었다.**
PR #336 리뷰는 debug nav ordering과 bridge command가 없는 버튼 상태를 지적했다. debug UI도 반복 탐색 surface라서 기본 placeholder 순서와 disabled affordance가 test contract에 들어가야 한다. → `c1cb64e5`에서 placeholder-first ordering과 unavailable command state를 정리했다.

**지적 2 — VRM normalization은 partial mutation을 저장하면 안 됐다.**
PR #335 리뷰는 inverse-bind matrix byte validation이 node mutation 뒤에 발생하면 corrected node rest rotations와 stale IBM bytes가 함께 persist될 수 있다고 지적했다. `docs/guidelines/review-domain.md`의 untrusted asset parsing 원칙상 graceful skip이 partial rewrite보다 안전하다. → `14956f06`에서 IBM metadata/float-byte preflight를 node mutation 전에 실행하고, non-finite IBM production regression을 byte-identical output으로 고정했다.

**지적 3 — helper contract 위반은 dummy 값으로 덮지 않는다.**
PR #335 nits는 `HumanoidMap`을 sentinel fields로 직접 구성한 점, duplicated IBM validator, clone-of-convenience, fixture test naming drift를 지적했다. "오늘 읽는 field만 안전하다"는 추론은 helper contract를 타입으로 표현하지 못한다. → `14956f06`에서 axis-bake path가 `&HashMap<usize, String>`을 직접 받고, shared validator와 borrowed JSON rebuild로 정리됐다.

**지적 4 — 승인 후 non-blocking nit도 thread hygiene가 남는다.**
PR #335 approval 이후 follow-up nit는 `collect_axis_bake_stats`의 temporary `nodes` remove/reinsert invariant가 함수명만 보면 read-only처럼 보인다고 지적했다. 승인 상태라도 읽는 사람이 놓칠 수 있는 mutation invariant는 코드 근처에 남긴다. → `faae14ef`에서 reinsertion invariant comment를 추가하고 inline reply 후 thread를 resolve했다.

**지적 5 — frontend import surface는 toast와 CSS reset 경계를 같이 본다.**
PR #332 리뷰는 Tailwind Preflight, import toasts, upload rejection code, prop spawn boundary, ADR bookkeeping을 같이 다뤘다. UI PR에서 styling pipeline과 user feedback path가 분리되어 보여도 실제 review boundary는 같은 user workflow다. → `8d20a54c` 계열 merge 결과로 debug prop panel, toast path, Tailwind ADR/docs가 함께 정리됐다.

> [!tip] 가장 중요한 배운 것 — merged PR cleanup은 Linear semantics를 PR footer로 나눈다
> `Resolves STL-NN` PR은 Linear Done까지 닫고, `Part of STL-NN` PR은 worktree만 치우고 Linear issue는 유지한다. PR #332가 `Part of STL-410`이라서 STL-410은 In Progress로 남겼다.

> [!abstract] Rule
> Wrapup에서 merged PR footer가 `Part of`이면 local worktree와 branch만 정리하고 parent Linear issue는 Done으로 이동하지 않는다. #rule

> [!warning] main checkout cleanup order
> 작업 worktree를 지울 때는 먼저 main checkout으로 이동한 뒤 `git worktree remove`를 실행한다. **교훈:** cleanup skill은 invocation cwd와 removal cwd를 분리해서 기록해야 한다.
