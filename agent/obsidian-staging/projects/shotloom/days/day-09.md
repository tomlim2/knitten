---
title: "Day 9 (05-15): PR #341 wrapup"
tags:
  - type/devlog
  - project/shotloom
  - area/game-dev
date: 2026-05-15
day: 9
source: agent
---

# Day 9 (05-15): PR #341 wrapup

## [PR #341](https://github.com/CINEV/shotloom/pull/341)

1. 지적 — semantic schema mismatch도 source chain을 보존해야 한다.
   리뷰는 `SchemaMismatch { label, message: String }`가
   `serde_json::Error`를 문자열로 바꾸면서 `source()` chain을 잃는다고
   지적했다. `docs/guidelines/error-handling.md` §5는 external error
   stringification을 금지하고, §2.4는 wrapped cause에 `#[source]`를
   요구한다. Parse path만 source를 보존하면 충분하지 않다. schema data
   mismatch도 typed cause를 보존해야 downstream formatter와 review가 원인
   계층을 볼 수 있다. → `cecc34a8`에서 `SchemaMismatch`가 optional
   `serde_json::Error` source를 보존하게 바뀌고, internal validator mismatch는
   `source: None`으로 분리됐다.

2. 지적 — validation guard는 happy-path parser coverage와 별개로 pin한다.
   AI review와 human review 모두 `schema_version`, `document_id`/`map_id`
   cross-check, confidence bound, non-finite transform 같은 guard 전용 테스트
   누락을 짚었다. 이 guard들은 resolver가 신뢰하는 v1 contract fence라서,
   selected map happy path 테스트만으로는 regression 방지가 안 된다. →
   `cecc34a8`에서 schema version mismatch, id mismatch, bad numeric values,
   transform severity, source-chain behavior coverage가 추가됐다.

3. 지적 — partial resolve와 aggregate no-placement는 별개의 resolver
   contract다. 리뷰는 모든 object가 미해결인 경우의 aggregate error와 일부만
   resolve되는 경우를 따로 검증하라고 했다. 둘을 섞으면 "하나라도 성공하면
   document 전체가 usable"이라는 POC behavior와 "아무 placement도 없으면
   error diagnostic"이라는 failure label이 흐려진다. → `cecc34a8`에서 partial
   resolution과 no-placement diagnostic severity/location coverage가
   추가됐다.

4. 지적 — per-candidate diagnostic은 aggregate diagnostic과 역할이 다르다.
   리뷰는 `ObjectType` lookup miss가 조용히 fallthrough하고 마지막
   `MAP_ASSET_MISSING` aggregate에만 기대는 점을 지적했다. Aggregate는 object
   최종 실패를 설명하지만, catalog gap이 어느 candidate에서 났는지는
   per-candidate diagnostic이 소유한다. → `cecc34a8`에서 missing
   `object_type` lookup entry가 warning diagnostic을 내게 됐다.

5. 지적 — filesystem resolver는 반복 canonicalize를 피하고 root authority를
   한 번만 세운다. 리뷰는 `asset_root` canonicalize가 candidate마다 반복되어
   Map_1038 같은 다수 prop 문서에서 N*M syscall이 된다고 봤다. 또한
   `asset_root_hint`는 metadata이고 caller-supplied resolver root가 권위라는
   문서 boundary가 필요했다. → `cecc34a8`에서 document resolve call당 한 번
   canonicalize하고, docs가 resolver root authority를 명시했다.

> [!abstract] Rule
> Parser error variant가 external parser error를 받아 semantic mismatch로
> 바꾸더라도 source chain은 끊지 않는다. User-facing message와 typed cause는
> 서로 다른 책임이다. #rule

> [!tip] resolver diagnostics
> Resolver diagnostic은 aggregate와 per-candidate를 분리한다. Aggregate는
> "이 object/document가 usable한가"를 말하고, per-candidate는 "어떤 lookup
> 규칙이 왜 실패했는가"를 말한다.

> [!warning] guard tests
> Contract guard는 happy-path fixture tests에 묻히면 안 된다. Version, id
> cross-check, finite float, confidence bounds처럼 downstream이 전제하는
> fence는 malformed input을 직접 넣는 negative test가 필요하다.
