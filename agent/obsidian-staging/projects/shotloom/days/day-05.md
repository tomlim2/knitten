---
title: "Day 5 (05-13): STL-400 PR 리뷰 회고"
tags:
  - type/devlog
  - project/shotloom
  - lang/rust
  - lib/bevy
  - area/game-dev
date: 2026-05-13
day: 5
source: agent
---

# Day 5 (05-13): STL-400 PR 리뷰 회고

## 17:55 — STL-400 closed ([#313](https://github.com/CINEV/shotloom/pull/313))

회고 — 리뷰에서 어떤 지적을 당했나, 무엇을 배웠나.

**지적 1 — 외부 fixture의 출처와 재배포 권리를 먼저 증명했어야 했다.**
리뷰어는 "`glb_furniture_001.glb` is identifiable third-party game content"라고 지적했다. 테스트 fixture도 repo에 들어가는 순간 배포물이고, "테스트용"이라는 의도만으로 IP 리스크가 사라지지 않는다. → `2a08f446`에서 문제 fixture를 제거하고 `assets/samples/box.glb`와 `assets/README.md` provenance table로 교체했다.

**지적 2 — default-empty assertion은 회귀 테스트가 아니었다.**
`BundleModelResource::demo()`와 `BundledVrmAssets::default()`가 원래 비어 있어서 `.is_empty()` checks는 command가 실행되지 않아도 통과했다. `docs/guidelines/code-review-guideline.md` §2의 P2 테스트 검증 원칙상, 테스트는 변경 전에도 참인 상태가 아니라 실제 경계 조건을 고정해야 한다. → `2a08f446`에서 빈 manifest/cache assertion을 제거하고 rejection event와 staging-consumption assertion만 남겼다.

**지적 3 — 같은 fixture를 찾는 방식이 PR 안에서 갈라졌다.**
`shotloom-gltf` 테스트는 `shotloom_common::workspace_root()`를 쓰는데 engine 테스트는 수동 parent walk를 복제했다. 유지보수 nit라도 새 테스트 안에서는 같은 boundary helper를 써야 파일 이동과 workspace layout 변화에 덜 취약하다. → `2a08f446`에서 engine 테스트도 `workspace_root()`로 맞췄다.

**지적 4 — attribution 문서는 발견 가능성과 링크까지 포함해야 했다.**
승인 후 남은 nits는 heading case, `samples/` bullet의 provenance forward link, CC BY 4.0 source/license hyperlink였다. 문서 리뷰의 핵심은 "정보가 있다"가 아니라 "스캔하는 독자가 필요한 근거에 도달한다"이다. → `51fb170b`에서 `assets/README.md`의 heading, layout link, source/license links를 정리했다.

> [!tip] 가장 중요한 배운 것 — asset fixture는 코드보다 먼저 provenance가 필요하다
> importer boundary 테스트는 파일 하나로 끝나지 않는다. GLB bytes, LFS hydration, license, attribution, README discoverability가 함께 fixture contract가 된다.

> [!abstract] Rule
> Repo에 binary fixture를 추가할 때는 첫 커밋부터 source URI, license URI, redistribution safety, LFS note를 같은 PR에 포함한다. #rule

> [!warning] 승인 후 optional nit 처리
> PR이 APPROVED여도 optional thread가 남아 있으면 reviewer가 재확인을 요구하지 않는다는 뜻이지, thread hygiene가 끝났다는 뜻은 아니다. **교훈:** APPROVED + non-blocking nits는 reply 후 thread resolve, 재리뷰 요청 없음 경로로 닫는다.

> [!warning] root checkout branch cleanup
> 이번 작업 branch는 별도 worktree가 아니라 repo root checkout이었다. PR merge 후 `main`으로 switch/pull은 가능했지만 squash/merge 형태 차이 때문에 `git branch -d`가 fully-merged 판정을 못 했다. **교훈:** `-D`는 쓰지 말고, branch 삭제가 거절되면 남긴 사실을 wrapup 결과에 명시한다.
