---
title: 2026-05-14 STL-406 prop GLB preflight closed recap
tags:
  - type/devlog
  - project/shotloom
  - area/game-dev
  - lang/rust
  - lib/bevy
date: 2026-05-14
source: STL-406 closed
---

# 2026-05-14 STL-406 closed — prop GLB preflight

## 14:26 — STL-406 closed ([#326](https://github.com/CINEV/shotloom/pull/326))

회고 — 리뷰에서 어떤 지적을 당했나, 무엇을 배웠나.

**지적 1 — imported asset path 에 recursive traversal 을 둔 것.** ryumiel: "`has_reachable_mesh` is recursive with no depth bound" and "the linear-chain stack-blow path is unpinned." `review-domain.md` §2 의 원칙은 외부 입력으로 engine worker 를 panic-abort 시키지 않는 것; cycle guard 는 fresh linear chain 을 막지 못한다. → `210a97a0`, `crates/shotloom-gltf/src/prop_preflight.rs`: iterative worklist traversal + depth-10,000 regression.

**지적 2 — parser detail 보존을 unit tier 에만 맡긴 것.** ryumiel: "`Parse { source: gltf::Error }` arm produces only ... the gltf-crate detail never reaches the wire." bridge contract 는 diagnostic/rejection surface 가 stable code 와 useful detail 을 같이 운반해야 한다; mapper 에서 source chain 이 끊기면 editor-visible failure 가 흐려진다. → `210a97a0`, `crates/shotloom-engine/src/bridge/handlers/assets.rs`, `crates/shotloom-engine/src/bridge/tests/assets.rs`: `BadGlbHeader::Parse` detail preservation and dispatch-level coverage.

**지적 3 — JSON chunk 를 upload cap 만으로 충분하다고 본 것.** ryumiel: "`serde_json::from_slice::<Value>` has no JSON-chunk byte cap." 150 MiB upload cap 은 resident amplification 을 막는 cap 이 아니고, import preflight 는 parse 전에 per-format memory bound 를 가져야 한다. → `210a97a0`, `crates/shotloom-gltf/src/prop_preflight.rs`: 4 MiB JSON chunk cap + typed `JsonChunkTooLarge` path.

**지적 4 — discriminant-only `PartialEq` 가 test 를 속일 수 있었던 것.** ryumiel: "Hand-rolled `PartialEq` compares discriminant only." payload-bearing error 는 equality 로 assert 하면 distinct source regression 을 가릴 수 있다. → `210a97a0`, `crates/shotloom-gltf/src/prop_preflight.rs`: public `PartialEq`/`Eq` removed, tests switched to `matches!`.

**지적 5 — bridge contract/doc/test surface 를 같은 table 로 잠그지 않은 것.** Follow-up review said "Six follow-up nits remain (test discrimination strengthening, contract-surface precision)." 새 prop preflight variant 하나가 mapper, diagnostic message, bridge fixture, editor snapshot, docs table 을 동시에 건드리는 contract surface 라는 점이 뒤늦게 드러났다. → `cb7758d0`, `docs/ipc/bridge-contract.md`, `MAP.md`, `crates/shotloom-core/tests/generate_bridge_fixtures.rs`, editor bridge snapshots: header variants, JSON cap ordering, `prop_json_too_large`, and explicit 4 MiB docs aligned.

> [!tip] 가장 중요한 배운 것 — import preflight 는 "valid enough" 가 아니라 adversarial boundary 다
> scene reachability 같은 작은 graph helper 도 uploaded bytes 에서 온 순간 denial/panic surface 가 된다. cycle 만 보면 graph algorithm 을 본 것이고, depth/memory cap 까지 봐야 product boundary 를 본 것이다.

> [!abstract] Rule
> Any traversal or parse over user-supplied asset bytes must pin stack depth, heap growth, source-detail propagation, and bridge-contract coverage in the same PR. #rule

> [!warning] review thread resolution 과 final mergeability 는 별개로 계속 확인해야 한다
> 이 PR 은 blocking + nits + follow-up nit round 를 거치며 review state 가 여러 번 바뀌었다. APPROVED 가 떠도 unresolved contract nits or ruleset state 를 마지막에 다시 확인해야 한다. **교훈:** merge 전에는 reviewDecision, unresolved threads, required checks 를 한 번 더 fetch 한다.
