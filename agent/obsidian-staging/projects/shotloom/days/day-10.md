---
title: "Day 10 (05-15): PR #342 wrapup"
tags:
  - type/devlog
  - project/shotloom
  - area/game-dev
date: 2026-05-15
day: 10
source: agent
---

# Day 10 (05-15): PR #342 wrapup

## [PR #342](https://github.com/CINEV/shotloom/pull/342)

1. 지적 — bridge batch input은 valid subset만 보는 것이 아니라 batch envelope도
   제한해야 한다. 리뷰는 `spawn_background_props`가 placement별 검증은 하면서
   전체 batch 길이, source 길이, display name 길이, tag 개수와 길이를 cap하지
   않는다고 지적했다. `docs/guidelines/error-handling.md`의 bounded diagnostic
   원칙과 `docs/ipc/bridge-contract.md`의 bridge contract discipline을 같이
   적용하면, partial success 이전에 command envelope 자체가 유한해야 한다. →
   `8370da6a`에서 batch/source/display-name/tag caps와 over-cap
   `INVALID_PAYLOAD` path가 추가됐다.

2. 지적 — caller-supplied tag는 ownership namespace를 spoof할 수 없어야 한다.
   리뷰는 caller가 `background_map`, `map:`, `source:`, `object:` 같은
   engine-owned ownership tag를 직접 넣을 수 있는 점을 막으라고 했다. map
   document ownership은 import provenance와 cleanup boundary가 공유하는
   authority라서, bridge payload가 같은 namespace를 쓰면 나중에 clear/filter
   command가 잘못된 prop을 소유한 것처럼 볼 수 있다. → `8370da6a`에서 reserved
   tag namespace rejection과 authoritative ownership tag emission이 분리됐다.

3. 지적 — untrusted placement identity는 diagnostic text와 entity relation에
   그대로 들어가면 안 된다. 리뷰는 asset id, object id, display label이 길거나
   reserved entity id처럼 보일 때 diagnostics와 related id가 오염될 수 있다고
   봤다. user-facing message는 bounded display로 잘라야 하고, related entity는
   valid object id가 있을 때만 object relation으로 삼아야 한다. →
   `8370da6a`에서 `BoundedDisplay`와 safe related-id fallback이 추가됐다.

4. 지적 — render spawn failure 후 rollback된 prop에 warning을 남기면 안 된다.
   리뷰는 render entity spawn 중간 실패 시 ECS prop은 rollback되는데 이미
   append된 warning diagnostic이 성공하지 않은 placement를 설명할 수 있다고
   지적했다. mutation이 commit되기 전 warning이 외부로 노출되면 event stream과
   bundle state가 서로 다른 세계를 가리킨다. → `8370da6a`에서 render spawn이
   모두 성공한 뒤에만 placement warnings가 append되도록 순서가 바뀌었다.

5. 지적 — GitHub ruleset의 merge gate는 CI pass만으로 끝나지 않는다.
   PR은 `Code Gate`와 `Docs Gate`가 모두 pass였지만 `mergeStateStatus=BLOCKED`
   상태였다. `main branch` ruleset에는 `required_review_thread_resolution=true`
   가 있었고, outdated nit thread 두 개가 unresolved라 merge button이 막혔다.
   → thread를 resolve한 뒤 `mergeStateStatus=CLEAN`, unresolved thread count `0`
   으로 바뀌었다.

> [!abstract] Rule
> Bridge command는 placement별 partial success를 지원하더라도 command envelope
> 자체는 먼저 bounded input이어야 한다. Cap 없는 batch, source, display label,
> tag는 success/failure semantics 이전의 contract violation이다. #rule

> [!tip] merge gate
> PR mergeability를 볼 때는 checks, approval, review thread resolution을 함께
> 본다. `MERGEABLE`과 `BLOCKED`가 같이 뜨면 ruleset의 non-CI gate를 먼저 확인한다.

> [!warning] ownership tags
> Engine-owned tag namespace를 bridge caller에게 열어두면 cleanup/filter command가
> 나중에 provenance를 잘못 믿을 수 있다.
