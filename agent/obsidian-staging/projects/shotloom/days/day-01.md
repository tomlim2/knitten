---
title: "Day 1 (05-12): STL-369 / STL-372 PR 리뷰 회고"
tags:
  - type/devlog
  - project/shotloom
  - area/game-dev
date: 2026-05-12
day: 1
source: agent
---

# Day 1 (05-12): STL-369 / STL-372 PR 리뷰 회고

## 16:12 — STL-369 closed ([#301](https://github.com/CINEV/shotloom/pull/301))

회고 — 리뷰에서 어떤 지적을 당했나, 무엇을 배웠나.

**지적 1 — ADR이 아직 정렬되지 않은 README로 독자를 보냈다.** 리뷰는 `crates/shotloom-gltf/README.md`가 pre-normalize 용어와 VRM extension JSON repair 책임을 설명하지 않는다고 짚었다. 이 지적은 맞다. `docs/guidelines/adr-template.md`의 Litmus test는 ADR이 세부 topology를 반복하지 말고 owning doc으로 위임하라고 하고, 링크 대상은 그 책임을 실제로 설명해야 한다. → `68f73b9c`, `docs/adr/adr-0030-normalizer-crate-extraction.md`에서 README cross-link를 제거했다.

**지적 2 — 같은 durable boundary를 ADR과 arch doc에 거의 중복해서 썼다.** 리뷰는 두 문서가 이미 drift하기 시작했다고 봤다. `docs/guidelines/documentation-standard.md`의 "one source of truth per concern" 원칙과 `docs/arch/normalizer-pipeline.md:3`의 target topology 소유권을 보면, ADR은 결정만 남기고 현재 per-crate topology는 arch doc에 있어야 한다. → `68f73b9c`, ADR subsection을 한 문장 decision + `docs/arch/normalizer-pipeline.md` 링크로 줄였다.

**지적 3 — "normalizer crates" 복수형으로 책임 범위를 넓혔다.** 리뷰는 arch doc 문장이 body/facial normalizer까지 GLB 소비자처럼 읽힌다고 지적했다. `docs/arch/normalizer-pipeline.md:16-19`의 table은 입력이 다르다. GLB는 `shotloom-character-model-normalizer` 쪽이고 body/facial은 FBX animation descriptor 쪽이다. → `68f73b9c`, `docs/arch/normalizer-pipeline.md` 문장을 `shotloom-character-model-normalizer`로 좁혔다.

**지적 4 — arch doc의 구조가 boundary를 보이게 만들지 못했다.** 리뷰는 `shotloom-gltf`가 responsibility table에 없고 paragraph만 떠 있다고 봤다. `docs/arch/`는 current architecture와 책임 표를 소유하므로, 새 boundary는 outline과 table에서 검색 가능해야 한다. → `68f73b9c`, `docs/arch/normalizer-pipeline.md:16`에 `shotloom-gltf` row를 추가하고 paragraph는 supporting prose로 남겼다.

> [!tip] 가장 중요한 배운 것 — ADR 리뷰에서는 "맞는 말"보다 "맞는 위치"가 먼저다
> Boundary 자체가 맞아도, 그 boundary가 ADR과 arch doc 양쪽에서 같은 무게로 쓰이면 곧바로 drift surface가 생긴다. ADR amendment를 할 때는 먼저 "이 문장이 decision인가, current topology인가"를 분류한 뒤 문장 수를 줄여야 한다.

> [!abstract] Rule
> ADR에는 durable decision만 남기고, current topology / per-crate responsibility / dependency diagram은 `docs/arch/` 한 곳에 둔다. #rule

> [!warning] AI review는 doc ownership drift를 충분히 잡지 못할 수 있다
> 자동 리뷰는 looks_good으로 봤지만 사람 리뷰는 README 선행 참조, 문서 중복, scope drift를 blocking으로 잡았다. **교훈:** ADR/arch 변경은 AI 리뷰 판정이 아니라 owning-doc 원칙과 outline/table 구조로 직접 검산한다.

---

## 16:24 — STL-372 closed ([#295](https://github.com/CINEV/shotloom/pull/295))

회고 — 첫 라운드 CHANGES_REQUESTED에서 무엇이 깨졌고, 왜 그렇게 갔는지.

**지적 1 — synthetic popstate는 HTML spec 위반.** ryumiel의 Blocking | Contracts: "`pushState`/`replaceState` deliberately do not fire `popstate` per the HTML spec." React Router 7, TanStack Router 모두 자체 listener set으로 subscribe → notify를 돌리고 popstate는 back/forward 전용으로만 둔다. 내가 추가한 synthetic event는 spec과 정면 충돌. → 33befb91에서 custom pushState/replaceState 라우터를 통째로 React Router v7 BrowserRouter로 교체.

**지적 2 — 부모 이슈 candidate table을 읽지 않고 시작했다.** Blocking | Documentation: 부모 이슈의 candidate table이 TanStack Router (long-term-fit)와 React Router v6 (safe-choice)를 명시하고 `자체 minimal`을 "deps 0, 가치 의문"으로 flag했는데, PR은 정확히 그 flag된 옵션을 그대로 ship했고 PR 본문에 rationale도 없었다. → 9031adbc에서 React Router v7로 교체 + ADR-0046 갱신.

**지적 3 — load-bearing helper에 단위 테스트 0개.** Blocking | Tests: `shouldUseClientNavigation`은 modifier keys, button, target, download, origin 비교가 얽힌 gnarly 로직인데 zero unit tests. Back/forward popstate, same-route no-op 등 PR이 load-bearing이라고 선언한 동작 3개도 uncovered. → 9031adbc에서 custom helper 자체를 제거하고 router 테스트를 root render + unknown-route redirect + persistent viewport mount로 재구성.

**지적 4 — nit들도 동일한 root cause.** `javascript:`/`data:` URL을 `new URL().origin === "null"`이라 통과시키는 점, `onNavigate(pathname)`이 search/hash를 조용히 drop하는 점, smoke probe가 status만 보고 body를 안 보는 점, nginx `/assets/` block의 `add_header` 상속 fragility — 모두 "spec / convention을 직접 확인하지 않고 직관으로 짠 코드"의 증상. 코드를 통째로 갈아치우면서 같이 사라짐.

> [!tip] 가장 중요한 배운 것 — 부모 이슈의 trade-off 분석이 이미 답을 줬다
> 부모 이슈가 candidate table에서 `자체 minimal`을 "가치 의문"으로 명시했는데, 나는 그걸 안 읽고 그 옵션을 구현했다. 첫 라운드 CHANGES_REQUESTED 4건 중 3건이 Blocking이었던 이유는 단순히 디테일 실수가 아니라 **선택 자체가 부모 이슈와 어긋났기 때문**. 새 PR을 시작할 때 부모/상위 이슈의 alternatives 섹션을 먼저 읽었다면 첫 커밋부터 React Router v7으로 갔을 것.

> [!abstract] Rule
> 새 컴포넌트/서브시스템을 시작할 때, 부모 이슈와 직전 ADR의 "Alternatives considered" / "candidate table"을 첫 단계에서 읽고, 선택한 옵션이 그 분석과 일치하는지 PR 본문에 한 줄로 기록한다. 일치하지 않으면 시작하지 않는다. #rule

> [!warning] spec 인용 없이 spec-adjacent 코드를 짜지 말 것
> synthetic popstate는 "그럴듯해 보이는" 코드였지만 HTML spec과 정면 충돌했고, 리뷰어가 React Router / TanStack Router 소스를 직접 인용하며 지적했다. **교훈:** browser API를 흉내내는 코드를 짤 때는 짜기 전에 reference implementation 1개의 소스를 펴서 그 패턴을 따른다. 직관으로 짜고 리뷰에서 spec 인용을 당하는 흐름이 가장 비싸다.
