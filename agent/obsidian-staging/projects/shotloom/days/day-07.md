---
title: "Day 7 (05-15): PR #337 wrapup"
tags:
  - type/devlog
  - project/shotloom
  - area/game-dev
date: 2026-05-15
day: 7
source: agent
---

# Day 7 (05-15): PR #337 wrapup

## [PR #337](https://github.com/CINEV/shotloom/pull/337)

회고 — 리뷰에서 어떤 지적을 당했나, 무엇을 배웠나.

**지적 1 — prose spec이 schema field shape를 다시 쓰면 contract가 둘로 갈라진다.**
리뷰는 `docs/specs/stage-map-document.md`의 required field 목록이
`contracts/stage-map/stage-map-document.schema.json`과 달라진 점을
막았다. `docs/guidelines/documentation-standard.md` §5.6과
`contracts/README.md`의 규칙상 schema가 field definition을 소유하고,
spec은 intent와 behavior를 소유해야 한다. → `367d2d4`에서 spec의
field-by-field restatement를 제거하고 schema `required` arrays를
canonical source로 가리키게 했다.

**지적 2 — transform contract는 Euler 값만으로 충분하지 않다.**
리뷰는 `rotation_order`가 intrinsic/extrinsic composition을 말하지 않는
점을 지적했다. `docs/ipc/bridge-contract.md:538`은 이미 intrinsic XYZ
Euler degree precedent를 갖고 있었고, stage map document도 같은 수학
약속을 공유해야 deterministic consumption이 가능하다. → `367d2d4`에서
`rotation_order`를 `xyz`로 제한하고 schema/spec에 intrinsic convention을
명시했다.

**지적 3 — local POC라도 path safety는 producer 신뢰로 대신하지 않는다.**
리뷰는 `asset_root_hint`의 empty string 허용, `relative_glb_path`의
traversal/absolute/URI 가능성, UNC path 누락, `absolute_glb_path`의
traversal/null-byte asymmetry를 연달아 지적했다. 로컬 debug input이어도
schema validation과 consumer canonicalization의 책임 경계를 문서화해야
한다. → `367d2d4`와 `8c009134`에서 non-empty root, relative/absolute path
guards, null-byte guard, canonical-root escape rejection rule을 추가했다.

**지적 4 — POC boundary는 ADR로 승격할지, throwaway로 남길지 드러나야 한다.**
리뷰는 Shotloom-owned offline contract가 durable architectural boundary로
보일 수 있다고 지적했다. `contracts/stage-map/README.md`와 spec이 이
contract를 production Story Previz API boundary처럼 읽히게 두면 다음 PR이
잘못된 안정성을 전제한다. → `367d2d4`에서 local POC input임을 명시하고,
POC 밖으로 승격하려면 별도 architecture decision이 필요하다고 적었다.

> [!tip] schema/prose split
> Field names, required arrays, enum values, shape constraints는 schema에 둔다.
> Spec은 source-space semantics, diagnostic selection, runtime supply,
> versioning처럼 schema만으로 설명되지 않는 intent를 맡는다.

> [!abstract] Rule
> Contract PR에서 prose가 schema field list를 반복하면, 그 순간부터
> parser와 producer가 서로 다른 문서를 믿을 수 있다. Prose는 schema를
> 링크하고 behavior만 설명한다. #rule

> [!warning] POC label is not enough
> "local POC"라는 말만으로 boundary가 사라지지 않는다. 저장소에 schema,
> examples, MAP index가 들어가면 reader는 durable contract로 읽을 수 있으니
> promotion policy와 non-production boundary를 같은 PR에서 못 박는다.
