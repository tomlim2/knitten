---
title: "shotloom devlog 2026-04-29"
tags:
  - shotloom
  - devlog
date: 2026-04-29
source: claude
---

# shotloom devlog 2026-04-29

---

## 11:22 — STL-242 closed ([#204](https://github.com/CINEV/shotloom/pull/204))

회고 — pure-move refactor (foot contact 추출을 `shotloom-gltf` → `shotloom-character-model-normalizer`)로 깨끗하게 APPROVE. 3건 P3 nit 전부 ack로 닫음.

**지적 1 — `foot_contact_data_from_extracted_preserves_left_right` 테스트가 8개 distinct 값 중 4개만 assert.** 나머지 4개는 동반 테스트 `foot_side_contact_from_extracted_preserves_fields`가 within-side 4-field 전부 커버하므로 delegation으로 transitively closed. 같은 invariant를 두 곳에서 중복 핀할 필요 없다는 판단. → ack로 닫음.

**지적 2 — `shotloom-gltf` 의 backtick path `shotloom_character_model_normalizer::extract_foot_contact_data` 는 rustdoc 이 검증 못함.** intra-doc link는 cycle 때문에 불가능 (`shotloom-gltf` → `shotloom-character-model-normalizer` 의존이 단방향 boundary 위반). rename 시 silent stale 위험은 인지하지만 navigability gain 위해 유지. → ack with rename-risk note.

**지적 3 — `shotloom_character_model_normalizer::` 가 한 파일에서 8회 반복.** donor 시점 `shotloom_gltf::` 도 같은 shape이었지만 새 크레이트 이름이 두 배 길어져서 시각적 부담 증가. → 이 PR scope는 move에 한정, `use` cleanup은 follow-up drive-by로.

> [!tip] 가장 중요한 배운 것 — `From<X>` impl의 source type이 cross-crate로 이동하면 body가 byte-identical이어도 behavior change
> 이 PR이 직접 자극이 돼서 review-before-pr 스킬에 Pattern T4 가 추가됨. `From<ExtractedFootGeometry>` 의 body가 한 글자도 안 바뀌어도 source type 자체가 다른 크레이트로 이동하면 field-mapping invariant 의 contract surface 가 달라진 것. 같은 PR 안에 field-by-field assertion 으로 핀해야 한 쪽이 rename/reorder 했을 때 다른 쪽이 빌드에서 깨짐. delegation 만으로는 부족.

> [!abstract] Rule
> Cross-crate type ownership 이전 시 `From<X>` / `TryFrom<X>` / 기타 conversion impl 도 새 source 의 field-mapping invariant 를 같은 PR 에서 field-by-field 로 핀해야 함. 델리게이션 / 스모크 테스트 / "기존 caller 가 커버" 는 cross-crate boundary 에서는 충분하지 않음. #rule

---

## 11:38 — STL-243 closed ([#205](https://github.com/CINEV/shotloom/pull/205))

회고 — STL-75 인용 정리 PR. 4건 P3 nit + top-level ADR-0023 follow-up 지적. self-review 가 H1 미래시제 3건 자체 캐치했지만 ADR-discipline 패턴은 못 잡음.

**지적 1 — `VrmVersion::V0x` rationale 이 "Constructed only by `#[cfg(test)]` callers" 라고 단정.** 실제로 `detect_from_gltf_json` (line 27, non-test) 도 V0x 를 생성. `#[allow(dead_code)]` 자체는 transitive 로 정당하지만 prose 가 생성 site 를 잘못 묘사. → `bb45fb1` 에서 "Reachable only from `detect_from_gltf_json` (itself dead-code-allowed) and `#[cfg(test)]` callers" 로 재작성. 근거: `docs/guidelines/review-rust.md` §1 (allow rationale 정확성).

**지적 2 — `detect_from_gltf_json` rationale 이 "Exercised by tests" 로 시작.** descriptive 일 뿐 *왜 retain rather than delete* 가 빠짐. 동일 PR 의 `apply_wrist_twist_transfer` rationale 과 비교하면 후자는 "Not chained by the current driver; retained as standalone post-process entry point" 로 why-retain 으로 시작. → `bb45fb1` 에서 "Public probe entry retained for callers that need to dispatch on VRM version" 로 why-retain 으로 lead. 근거: §1 + sibling consistency.

**지적 3 — `lib.rs` 모듈 doc 에 orphan `per` 한 줄.** rewrap 후 `//! per` 가 단독 줄로 떨어져 cargo-doc 은 잘 렌더되지만 source 가독성 저하. → 한 줄로 합침.

**지적 4 — `TODO(Layer 5)` 마커가 두 곳 잔존.** PR 이 모든 STL-75 / Layer 0-4 인용은 제거했지만 같은 deferred quality 작업을 가리키는 `TODO(Layer 5)` 는 못 잡음. → `TODO(quality grading)` 로 재framing, README "Deferred (no successor issue today)" 와 정렬.

**지적 5 — top-level: ADR-0023 본문이 documentation-standard 위반 잔존.** `STL-74` / `STL-75` 인용 + "Session 2 ports them" / "will land in a later session" 식 port-plan prose 가 Decision 9 에 박혀 있음. 이 PR 은 STL-75 만 광고했으므로 out-of-scope — 별도 이슈 요청. → STL-247 생성 + Pattern H7 (`/shotloom-review-before-pr`) 신설로 검사 사이드 보강.

> [!tip] 가장 중요한 배운 것 — skill-side gate absence 가 ADR-discipline 위반의 root cause 였다는 사실이 또 검증됨
> 어제(4-27) STL-208 / STL-195 close 회고 두 곳에서 결론 난 메타-인사이트 — "ADR-discipline 위반은 패턴 카탈로그 갭이 아니라 skill-side gate 가 비어있어서 발생" — 이 이번 PR 에서 다시 입증됐다. ryumiel 가 ADR-0023 prose 를 짚었을 때 self-review 가 못 잡은 이유는 4-27 에 G10 으로 캡처한 ADR-discipline 룰이 retired Claude-side standard 에 들어갔다가 in-repo SSOT 로 이전되는 과정에서 검사 사이드에서 휘발됐기 때문. 후속으로 Pattern H7 (`shotloom-review-before-pr/reference.md`) 에 박아 다시는 휘발 안 되게 함.

> [!abstract] Rule
> ADR Decision / Consequences / Alternatives 섹션에 Linear-ID 인용 + session-plan / port-plan prose 금지. Linear-ID 는 Status / Amendment 블록에만 허용. 본문 in-place rewrite 시 `Status: Accepted (amended YYYY-MM-DD)` + Amendment block 으로 supersession 기록. (Pattern H7a/b/c, `docs/guidelines/documentation-standard.md` §5.7 + §2.8 + `adr-template.md` Usage Notes) #rule

> [!warning] PR open 후 force-push 는 reviewer APPROVE 를 stale 로 클리어
> #204 머지로 main 이 앞서가면서 #205 가 CONFLICTING 으로 빠짐. ryumiel 가 이미 APPROVED 한 상태에서 rebase + `force-with-lease` push. push 후 PR `reviewDecision` 이 `""` (clear) 로 떨어짐 — GitHub 가 force-push 로 base SHA 가 바뀐 approve 를 stale 로 처리. **교훈:** PR open 후 force-push 는 `rules/git.md` 가 명시 승인 요구하는 이유가 이것. 다음부터는 conflict 발생 시 base 의 어느 PR 이 ahead 인지 먼저 확인하고, 가능하면 squash-merge 직전에 rebase 한 번에 끝내기.

> [!warning] Linear MCP `save_issue` 의 `state: "In Progress"` 문자열은 transition 미적용
> Backlog → In Progress 첫 호출이 silently 실패. `list_issue_statuses` 로 stateId UUID 받아 patch 해야 적용됨. **교훈:** state 가 "안 바뀐" 것 같으면 `get_issue` 로 즉시 확인. 문자열 매칭이 팀별로 다를 수 있어 ID 가 안전.

---

## STL-245 — VRM fixture quirk suffix 컨벤션 정착 + 3 파일 리네임

VRM normalization/retarget 파이프라인이 fixture별 finger quirk를 코드에서 감지하지 않고 **파일명만으로** 분기할 수 있게 만드는 fixture-hygiene 작업. 기존 `_backward` 컨벤션이 yoya/phainon에는 박혀 있는데 동일 quirk가 있는 moth/ghostpumpking에는 누락돼 있어서, 다음 normalizer PR (STL-127 family) 때 "이 fixture는 어느 path를 exercise하는가?"가 매번 fresh detection으로 재계산되던 비용을 잘라냄. PR [#206](https://github.com/CINEV/shotloom/pull/206), STL-245.

### Why

`assets/models/`에 13개 VRM fixture가 있고, finger bone child translation을 ±X 축에 대해 비교하면 quirk가 세 종류로 갈림: (1) bone-length axis가 표준의 반대 (X-flip), (2) rest pose가 progressively curled, (3) humanoid에 finger 본 자체 없음. 첫 quirk는 `_backward` 라는 suffix로 yoya/phainon에 이미 표현돼 있었지만, 동일 X-flip을 갖는 moth/ghostpumpking에는 박혀 있지 않아서 normalizer 코드가 매번 양쪽 path를 다 시도해야 했음. 컨벤션이 절반만 적용된 상태가 가장 나쁨 — suffix가 없으면 "X-flip 아님"으로 잘못 읽히기 때문.

### How

세 파일 `git mv`로 리네임:

- `vrm1x-cmm-x-moth.vrm` → `_backward` 추가 (yoya와 동일 X-flip)
- `vrm1x-cmm-x-ghostpumpking.vrm` → `_backward_curled` 추가 (X-flip + distal Y ≈ -0.99 progressive curl)
- `vrm1x-booth-x-shimaenaga.vrm` → `_nofingers` 추가 (humanoid에 finger 본 0개)

Suffix 카탈로그를 `assets/README.md`의 새 `Variant suffixes` 서브섹션에 박음 — Linear scope는 `assets/models/README.md` 신규 생성이라고 명시했지만, `assets/README.md`가 이미 VRM 파일명 컨벤션 (`vrm{version}-{source}-{gender}-{name}[_variant].vrm`) + 기존 `_backward` 정의를 owning하고 있어서 한 곳에 모음. 카탈로그 행마다 검출 기준 (length-axis err > 90° / distal `Y` abs > 0.7 / finger bone count 0) 박음.

`crates/shotloom-retarget/examples/fixtures.json`의 preset 7/11/12 (Ghostpumpking/Moth/Shimaenaga)의 `desc` 갱신 + `model` 경로 새 파일명으로 교체. LFS pointer는 `git mv` 후 oid 그대로 유지됨 확인 (`git lfs ls-files`).

### What

실제 변경 (5 files, 24+/7-):

- `assets/README.md` — `Variant suffixes` 서브섹션 신규 (3행 표 + VRM 0.x prefix 예외 한 줄)
- `assets/models/vrm1x-{moth,ghostpumpking,shimaenaga}.vrm` — git mv 3건
- `crates/shotloom-retarget/examples/fixtures.json` — preset 3개 desc/model 갱신

게이트 통과: `cargo fmt --check`, `cargo clippy --workspace --exclude shotloom-desktop --all-targets -- -D warnings`, `cargo test --workspace --exclude shotloom-desktop`, `node scripts/validate-doc-paths.mjs` (957/145), `node scripts/validate-ci-rust-coverage.mjs` (20/20). Repo-wide grep으로 옛 basename 0 hit 확인.

### 사이드 노트

- Linear AC가 명시한 `assets/models/README.md`보다 기존 `assets/README.md` (parent 레벨)에 편입하는 게 single-source-of-truth 측면에서 우수. PR body에서 결정 명시.
- 기존 `assets/README.md`의 `_backward` 정의는 "root-node 180Y facing" 한 줄이었는데 Linear 분석 결과 같은 quirk가 finger length-axis X-flip으로 드러난다는 게 본질이라, 새 표에서 두 증상 (root 180Y + finger length err > 90°)을 한 항목으로 묶음. 기존 `_backward` 붙은 yoya/phainon/minjoon도 모두 같은 관계 안에 들어가 의미 파괴 없이 확장됨.
- markdownlint MD056 (`table-column-count`)이 표 셀 안의 `` `|Y|` `` 같은 inline-code의 리터럴 파이프도 셀 separator로 카운트함. 처음 commit 시 5 셀로 잡혀서 hook fail. 셀 텍스트를 "absolute value of … `Y`"로 풀어 써서 해결. 표 안에서 절댓값 표기는 `|x|` 대신 `\|x\|` 이스케이프 또는 자연어로 풀어야 안전.

---

## STL-222 — body-anim-normalizer ↔ character-model-normalizer mirror invariant 컴파일 타임 락

shotloom 의 normalizer 파이프라인은 ADR-0030 으로 세 크레이트 (`shotloom-character-model-normalizer`, `shotloom-body-anim-normalizer`, facial) 로 split 되어 있고, dependency direction 이 `docs/arch/normalizer-pipeline.md` 의 "no normalizer depends on a sibling normalizer" 규약에 묶여 있음. 이 제약 때문에 character-model 측의 `RestAlignTrack` 은 body 측 `BoneTrack` 의 8 필드를 type system 으로 공유하지 못하고 review-only mirror 로만 유지돼 있었음 — PR #188 round-2 에서 ryumiel 이 weak pin 을 지적, AFDS v2 의 cross-crate contract 코드 레벨 핀 권고에 따라 STL-222 로 후속 처리. PR [#207](https://github.com/CINEV/shotloom/pull/207), STL-222.

### Why

PR #188 round-1 은 `RestAlignTrack` rustdoc 에 mirror invariant 를 명문화 (양쪽 같은 PR 에서 변경) 했지만 실제 enforcement 는 review 뿐이었음. 한쪽 필드 rename 이 다른 쪽 빌드를 깨뜨리지 않으니 reviewer 가 놓치면 그대로 main 에 들어감. AFDS v2 §"Cross-crate contracts" 는 가능한 한 코드로 핀하라고 권고하는데, ADR-0030 이 사이블링 dep 을 막아둬서 shared type / cross-crate equivalence test 두 옵션이 다 막힘. 같은 쪽 (body 측) 에서 강하게 핀할 수 있는 최대치는 destructure pattern 이라는 결론.

### How

옵션 A 채택 (Linear AC 의 1순위 권고):

1. `crates/shotloom-body-anim-normalizer/src/types.rs` 의 `tests` 모듈에 `bone_track_field_set_is_mirror_pin_for_rest_align_track` 추가. 핵심은 `let BoneTrack { ... } = track;` 형태의 destructure 인데 `..` rest pattern 을 의도적으로 빼서, `BoneTrack` 에 필드 추가 / 제거 / 이름 변경이 일어나면 패턴 매칭이 컴파일 자체에서 실패하도록 만듦. 기존 `bone_track_fields_round_trip` 도 8 필드 explicit constructor 를 들고 있긴 하지만 sentinel 은 이름과 rustdoc 으로 "이건 cross-crate mirror pin" 임을 명시적으로 anchor 함.
2. `crates/shotloom-character-model-normalizer/src/types.rs:24` 의 `RestAlignTrack` rustdoc 에서 weak-pin 단락을 갱신 — sentinel test 의 fully-qualified 이름 (`shotloom_body_anim_normalizer::types::tests::bone_track_field_set_is_mirror_pin_for_rest_align_track`) 을 cross-reference 하고, 양쪽 rustdoc 모두 `docs/arch/normalizer-pipeline.md` 를 dependency-direction 의 SSOT 로 가리키도록 정렬.

옵션 B (공통 크레이트 추출) 와 C (`From/Into` + roundtrip) 는 사용 패턴 늘어나면 ADR 작성 후 승격하기로 issue 본문에 명시. 현재는 `BoneTrack` callers 가 `shotloom-retarget` 한 곳뿐이라 옵션 A 의 가벼움이 비용 대비 정당화됨.

### What

- Diff: 2 files, +44 / −7. body-anim-normalizer 에 sentinel test 12 줄 + 14 줄 rustdoc, character-model-normalizer 의 `RestAlignTrack` rustdoc weak-pin 단락 1개 갱신.
- 게이트 통과: `cargo fmt --check`, `cargo clippy --workspace --exclude shotloom-desktop --all-targets -- -D warnings`, `cargo test --workspace --exclude shotloom-desktop --lib` (`bone_track_field_set_is_mirror_pin_for_rest_align_track ... ok` 포함 body-anim-normalizer 9 tests pass), `node scripts/validate-doc-paths.mjs` 957/957.
- self-review 1차 (`/shotloom-review-before-pr`): H5 finding 1건 — sentinel rustdoc 이 "ADR-0030 forbids …" 라고 인용했으나 ADR-0030 본문 (line 54-55) 은 dependency direction 룰을 `docs/arch/normalizer-pipeline.md` 로 위임. 기존 `RestAlignTrack` rustdoc 도 normalizer-pipeline.md 를 인용하는 상태라 양쪽 인용처가 어긋남 → follow-up commit `8e663c8` 으로 인용처를 normalizer-pipeline.md 로 정렬, "no sibling-normalizer dependency" 본문 quote 도 함께 추가.
- self-review 2차: H5 fix 후 양쪽 rustdoc 모두 ADR-0030 비인용, normalizer-pipeline.md 일치. A1 / D1 / D2 / G6 / H1-H6 / I / T 패널 모두 클린.
- 커밋 분리: 본 commit (`refactor(body-anim-normalizer): pin BoneTrack mirror via sentinel test`) + follow-up commit (`docs(body-anim-normalizer): cite normalizer-pipeline.md for sibling-dep ban`). 한 PR 안에서 self-review 발견 사항을 별도 commit 으로 두는 패턴 유지.

### 사이드 노트

- `let X { ... } = t;` 패턴 destructure 는 rust 에서 field-set 핀의 표준 idiom 인데, body 안에서 한 번 사용하고 버리는 형태로 충분히 컴파일 에러 enforcement 가 작동함. 별도 `assert_eq!` 나 `const _: ()` 트릭 없이 패턴 자체가 lint 역할을 함. `..` rest pattern 을 빼는 게 핵심.
- ADR vs arch doc 인용 위계: ADR 은 결정 근거 (왜 세 크레이트로 split 했는지) 의 SSOT, arch doc (`normalizer-pipeline.md`) 는 토폴로지 룰 (어느 크레이트가 어디에 의존할 수 있는지) 의 SSOT. 둘이 같은 invariant 를 다루더라도 인용은 룰의 SSOT 쪽으로 가야 함. 다음 cross-crate 룰 인용도 이 분리를 따라가는 게 좋음.
- shotloom CONTRIBUTING.md 의 branch type 화이트리스트 (`feat/`, `fix/`, `chore/`, `hotfix/`, `release/`) 는 conventional commit type 보다 좁음. commit subject 는 `refactor:` 로 가도 branch 는 `chore/...` 로 만들어야 함. 이번 STL-222 도 commit 은 `refactor(body-anim-normalizer):` 였지만 branch 는 `chore/bonetrack-field-name-sentinel`.

---

## 14:10 — STL-222 closed ([#207](https://github.com/CINEV/shotloom/pull/207))

회고 — ryumiel `/pr-review` 가 LGTM 으로 APPROVE 하면서 P3 nit 3건 inline 으로 깜. 모두 doc/style 한정, 비블로킹. self-review 가 못 잡고 reviewer 가 잡은 두 가지 패턴이 있어서 그게 본 회고의 핵심.

**지적 1 — rustdoc 이 sentinel 의 coverage 를 over-claim 함.** RestAlignTrack rustdoc 이 한 단락 안에서 "any field rename, type change, or visibility change" 와 "the strongest available pin" 을 병치 → full coverage 로 읽힘. 실제 sentinel 은 destructure pattern 의 본질상 이름 + 개수만 핀하지 type / visibility 는 못 잡음 (`_` 바인딩이 타입을 무시, 같은-크레이트 destructure 가 visibility 를 무시). 리뷰어 지적: "rustdoc 자체는 기술적으로 정확하지만 병치가 full coverage 처럼 읽힐 수 있음" — 정확함. 핀의 *기능적* 한계를 doc 이 *언어적으로* 가린 케이스. → 양쪽 rustdoc 에 "Pins the *field set* (names + count) only; type-only and visibility-only edits still rely on review" 명시 추가 (`033a5be`).

**지적 2 — 컴파일타임 체크에 `#[test]` ceremony 를 쓴 게 부적절.** sentinel 이 `#[test] fn` 안에 inner fn + dead-code-suppression `let _ =` 으로 짜여 있었음. `cargo test` 출력에 0 assertion test 가 "ok" 로 나오는 게 의도 misrepresent. 리뷰어 지적: "module 스코프의 `const _: fn(BoneTrack) = |track| { … };` 가 의도를 더 직접 표현". 더 강한 이유 — `#[test]` 형태를 미래 maintainer 가 "tightening" 한답시고 runtime `assert!` 박을 위험이 있음 (그리고 그 가드를 한 줄 주석에 의존하는 건 약함). const item 형태는 closure body 가 type-check 만 되고 실행 안 되는 게 *구조적으로* 보장돼서 tightening 시도 자체가 dead — runtime assertion 이 절대 fire 안 함. → `#[test]` → module-scope `const _: fn(BoneTrack)` 이행 (`033a5be`), 양쪽 rustdoc cross-reference 도 새 const sentinel 가리키도록 갱신.

**지적 3 — destructure rustdoc 의 orphan line break.** "This destructure / without a `..` rest pattern" 에서 prepositional phrase 가 거의 빈 줄로 떨어짐 — cosmetic. self-review (Pattern H 단계) 에서 봤지만 minimum-scope 핑계로 미뤘던 것. 리뷰어가 정확히 그 부분 짚음. const item 으로 옮기면서 reflow 가 자연스럽게 따라옴. → `033a5be` 에 같이 묶임.

> [!tip] 가장 중요한 배운 것 — Rust 컴파일타임 sentinel 의 표준 idiom 은 `#[test]` 가 아니라 `const _: fn(T)`
> "compile-time only field-set pin" 같은 패턴을 짤 때 첫 instinct 는 `#[cfg(test)]` 안의 `#[test] fn` 인데, 이건 두 가지가 잘못됨: (1) test runner output 에 0-assertion ok 라인이 misleading, (2) 미래 maintainer 가 안에 `assert!` 박을 위험이 *prose* 가드에 의존. 더 정확한 idiom 은 module-scope `const _: fn(T) = |t| { let T { ... } = t; };` — 같은 컴파일 에러를 internal-mechanism 으로 강제하면서, closure body 가 type-check 만 되고 nothing ever calls it 이라 future-tightening 이 *structurally* 차단됨. doc 에서 prose 로 약속하지 말고 construct 로 강제하는 게 핵심.

> [!abstract] Rule
> Rust 에서 "compile-time only" 의도를 가진 sentinel / pin / type-equivalence check 는 `#[test]` 대신 module-scope `const _: fn(T) = |t| { … };` (또는 `const _: ()` w/ `let X { … } = …` 패턴 동등 형태) 로 표현. test ceremony 는 runtime assertion 의 의미가 있을 때만. doc 에서 "this is compile-time only" 라고 *prose* 로 promise 하지 말고 construct 자체가 그렇게 *make* 되도록 짠다. #rule

> [!warning] APPROVED 후 optional nit 만 남은 사이클에서 자동 재리뷰 요청은 noise
> 기존 `/shotloom-respond-pr` 는 reply 1건만 posted 돼도 reviewer 재리뷰 요청을 always run 하게 짜여 있었음. APPROVED + 모든 finding 이 reviewer 가 명시적으로 non-blocking 이라고 표시한 nit 인 케이스에서, 추가 ping 은 reviewer 가 요청한 적 없는 알림이 됨 → user feedback 으로 스킬 자체에 APPROVED-state branch 를 박음. default 가 `reply + resolve, no re-request` 로 바뀌고, re-request 는 `with-rerequest` 옵션으로 숨겨짐. 같은 cycle 에 Step 7 의 "never resolve threads" 정책도 이 case 에 한해 예외 (graphql `resolveReviewThread` 호출) 로 명시. **교훈:** reviewer 가 이미 닫은 round 에서 author 가 thread 닫고 사이클 종료를 본인 쪽에서 하는 게 정상; 매번 ping 보내는 게 아니라.

> [!warning] `gh repo view` 가 cwd 가 외부면 `--jq` flag 없이 호출되면 stderr 로 나감
> `/shotloom-auto-pr start 207` 시도가 `gh repo view -q .nameWithOwner` 호출 단계에서 fail (cwd 가 shotloom worktree 가 아닌 Claude 하니스 worktree 였음, 그리고 `-q` 가 `--json` 없이 들어가서 거부됨). watcher 프로세스도 안 떴고 PID 파일도 없음. 결과적으로 user 가 `/shotloom-auto-pr` 를 안 쓰겠다고 했지만, 실패 원인 자체는 cwd 문제 + cli flag 문제 두 layer. **교훈:** auto-pr start 전에 `gh repo view -q .nameWithOwner` 가 실제 shotloom 을 가리키는지 직접 확인. cwd-aware skill 들 (auto-pr, make-pr, respond-pr, review-before-pr) 모두 동일 패턴 — Claude 하니스 worktree 안에서 invoke 하면 cwd 가 거기에 묶여 있어 shotloom 명령이 실패할 수 있음.
