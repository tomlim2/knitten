---
title: "Day 4 (05-13): STL-402 PR 리뷰 회고"
tags:
  - type/devlog
  - project/shotloom
  - lang/rust
  - lib/gltf
  - area/game-dev
date: 2026-05-13
day: 4
source: codex
---

# Day 4 (05-13): STL-402 PR 리뷰 회고

## 16:03 — STL-402 closed ([#317](https://github.com/CINEV/shotloom/pull/317))

회고 — 리뷰에서 어떤 지적을 당했나, 무엇을 배웠나.

**지적 1 — direct child guard의 rejection branch가 테스트되지 않았다.** 리뷰는 "expected-chain bone is mapped to node N, but N is NOT in this parent's `children[]`" 케이스가 빠졌다고 했다. topology picker는 production caller가 아직 없어도 잘못된 non-child를 반환하면 Phase 2b 이후 axis bake 방향 전체가 흔들린다. `docs/guidelines/code-review-guideline.md`의 P2 테스트 원칙이 맞다. → `e32d827a`, `crates/shotloom-gltf/src/vrm_axis_bake/primary_child.rs`.

**지적 2 — private helper의 정책이 파일 안에 문서화되지 않았다.** 리뷰는 four-branch policy, intentional `None`, `hips`가 chain에는 있지만 priority candidate에는 없는 asymmetry가 코드만으로는 비자명하다고 짚었다. private module이라도 "왜 None인가"와 "두 table의 역할 차이"는 후속 PR 작성자가 읽을 local contract다. → `e32d827a`, `crates/shotloom-gltf/src/vrm_axis_bake/{mod.rs,primary_child.rs}`.

**지적 3 — `binary_search`가 멀리 있는 sorted/dedup invariant에 의존했다.** 리뷰는 `valid_child_indices`의 sort invariant가 바뀌면 call site가 조용히 틀릴 수 있다고 했다. P3 maintainability nit이지만 O(n) `contains`로 충분한 작은 child list라면 cross-function coupling을 남길 이유가 없다. → `e32d827a`, `crates/shotloom-gltf/src/vrm_axis_bake/primary_child.rs`.

**지적 4 — chain table과 fallback priority table의 중복 topology가 drift할 수 있었다.** 리뷰는 새 chain step이 추가될 때 priority list mirror를 잊으면 fallback tie-break가 canonical chain과 어긋난다고 했다. 중복 table은 "같은 데이터"가 아니라 역할이 다른 policy table이라도 coherence test가 있어야 한다. → `e32d827a`, `crates/shotloom-gltf/src/vrm_axis_bake/primary_child.rs`.

**지적 5 — PR body가 unit test를 integration test로 표시했다.** 리뷰는 implementation file 안의 `#[cfg(test)]` 테스트를 PR checklist에서 `[x] Integration tests`로 주장한 점을 짚었다. PR body는 merge artifact라서 테스트 종류를 부정확하게 체크하면 나중의 독자가 coverage surface를 잘못 믿는다. → `e32d827a` 이후 PR body에서 integration checkbox를 해제.

> [!tip] 가장 중요한 배운 것 — private policy helper도 local contract가 필요하다
> production caller가 없는 Phase 2a slice는 "작고 private"하다는 이유로 정책 설명을 생략하기 쉽다. 하지만 후속 Phase가 이 helper를 기준으로 correction quaternion과 bake wiring을 쌓을 예정이라면, direct-child-only, intentional `None`, table 역할 차이는 코드보다 먼저 읽히는 contract가 되어야 한다.

> [!abstract] Rule
> 후속 PR이 의존할 private policy helper는 branch coverage뿐 아니라 intentional `None`, table role, fallback/tie behavior를 module doc과 unit test로 함께 pin한다. #rule

> [!warning] APPROVED 상태의 optional nit도 PR body truthfulness는 바로 고친다
> 리뷰어가 이미 approved했더라도 checklist가 실제 테스트 종류와 다르면 merged 기록이 틀어진다. **교훈:** nit 대응 commit 후에는 code diff만 보지 말고 PR body의 Testing checklist도 final state로 다시 맞춘다.
