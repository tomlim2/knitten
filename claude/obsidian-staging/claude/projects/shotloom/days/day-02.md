---
title: "Day 2 (05-13): STL-398 PR 리뷰 회고"
tags:
  - type/devlog
  - project/shotloom
  - lang/rust
  - lib/gltf
  - area/game-dev
date: 2026-05-13
day: 2
source: codex
---

# Day 2 (05-13): STL-398 PR 리뷰 회고

## 13:42 — STL-398 closed ([#312](https://github.com/CINEV/shotloom/pull/312))

회고 — 리뷰에서 어떤 지적을 당했나, 무엇을 배웠나.

**지적 1 — 새 warning code를 spec soft-gate 표에 넣지 않았다.** 리뷰는 "`noncanonical_thumb_humanoid_slots` but does not add it to the soft-gate-checks table"이라고 짚었다. externally visible diagnostic은 코드뿐 아니라 사용자가 읽는 validation spec에도 같은 PR에서 드러나야 한다는 `documentation-checklists.md` Change Review Checklist가 맞다. → `cfbd56eb`, `docs/specs/vrm-character-validation.md`.

**지적 2 — 같은 normalized bytes를 세 번 parse하면서 실패 정책이 갈라졌다.** 리뷰는 `parse_glb_json(&normalized.bytes)`가 quality check, validation, metadata extraction에서 각각 다른 failure policy를 갖는다고 지적했다. post-normalization JSON 재파싱 실패는 asset-quality가 아니라 internal regression이므로 조용히 `.ok()`로 삼키면 안 된다. → `cfbd56eb`, `crates/shotloom-gltf/src/vrm_normalization.rs`.

**지적 3 — duplicated thumb slot node도 retargeting에는 깨진 입력인데 놓쳤다.** 리뷰는 `metacarpal.node == proximal.node`가 inverted case만큼 broken인데 strict `<`가 경고하지 않는다고 봤다. asset parsing safety 관점에서는 이상한 humanoid map을 "정상은 아니지만 통과"로 두는 것보다 warning으로 고정하는 편이 맞다. → `cfbd56eb`, `crates/shotloom-gltf/src/vrm_humanoid_slot_quality.rs`.

**지적 4 — message assertion이 항상 나오는 substring만 봤다.** 리뷰는 `"thumb retargeting may not behave correctly"`가 unconditional이라 `affected_sides.join(" and ")` branch를 검증하지 못한다고 했다. 테스트는 위험 문구가 아니라 분기 결과를 pin해야 regression을 잡는다. → `cfbd56eb`, `crates/shotloom-gltf/tests/vrm_thumb_slot_quality.rs`.

**지적 5 — cycle 방어가 있는데 synthetic cycle test가 없었다.** 리뷰는 bounded loop가 `parent_map` cycle에서 hang을 막는 방어인데, 누군가 while loop로 단순화하면 untrusted asset input에서 멈출 수 있다고 짚었다. `review-domain.md`의 asset parsing safety는 malformed GLB를 실제 fixture로 만들지 않아도 unit test로 pin해야 한다. → `cfbd56eb`, `crates/shotloom-gltf/src/vrm_humanoid_slot_quality.rs`.

> [!tip] 가장 중요한 배운 것 — warning은 코드가 아니라 작은 contract다
> 새 diagnostic은 "로그 한 줄"이 아니라 validator behavior, spec table, message shape, malformed input semantics가 함께 움직이는 contract다. optional nit이라도 diagnostic code를 추가한 PR에서는 표, parse policy, branch coverage를 한 번에 훑어야 한다.

> [!abstract] Rule
> 새 diagnostic code를 추가하면 같은 PR에서 owning spec table, failure policy, message branch coverage, malformed-input regression test를 함께 확인한다. #rule

> [!warning] APPROVED + nit replies는 merge 타이밍과 충돌할 수 있다
> 리뷰어가 이미 approved했고 nits만 남았을 때도, reply를 freeze했다가 다시 게시하는 사이 PR이 merge될 수 있다. **교훈:** optional nit 대응은 push 직후 reply/resolve/re-request 정책을 먼저 결정하고, merge 전후에 남길 신호가 무엇인지 명확히 한다.
