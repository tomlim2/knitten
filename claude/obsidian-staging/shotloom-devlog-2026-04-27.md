---
title: "Shotloom Devlog — 2026-04-27"
tags:
  - devlog
  - shotloom
  - retarget
  - normalizer
  - adr-0030
  - crate-architecture
date: 2026-04-27
source: claude
---

# Shotloom Devlog — 2026-04-27

ADR-0030 (`shotloom-retarget`에서 normalization 책임 분리)의 첫 단계.
캐릭터 모델 측 정규화를 retarget crate에서 떼어내 새로운
`shotloom-character-model-normalizer` crate로 이전. 이걸로 retarget 엔진은
"본 회전 매핑 + ground correction" 본업만 남게 되고, 캐릭터별
preprocess (rest pose 정렬, 손가락 axis 도출, 사용자 calibrated 자세)는
caller가 retarget 호출 *전*에 직접 실행하는 구조로 바뀌었다. body /
face animation normalizer (Steps 2/3)는 sibling으로 따라오고, Step 4
cleanup이 retarget/gltf의 leftover dead code를 정리한다.
PR [#178](https://github.com/CINEV/shotloom/pull/178), STL-195, umbrella STL-127.

## Big picture

ADR-0030의 dependency invariant는 단방향: `parsers → import →
normalizers → retarget → engine`. 오늘 작업은 그 그림에서 normalizer
계층의 첫 번째 crate를 만든 것. 이 단계로
- retarget이 자기 책임 (retarget math) 만 짊어지게 됨
- character model 정규화가 명시적인 crate boundary를 가짐
- 새 source format (PMX character, 다른 DCC 캐릭터)을 추가할 때 정확히
  하나의 crate만 건드리면 됨

이 패턴을 통해 STL-129 (engine 측 `TargetAnimation → Bevy AnimationClip`
베이킹) 같은 후속 작업도 retarget의 흔들림 없이 진행 가능. 또
ADR-0030 Out of scope에 있는 STL-183 (`SourceAsset` / `SourceFormat`
relocation) 이 들어오면 normalizer → retarget 의 transitional types-only
의존도 끊을 수 있다.

## Why

### 왜 character normalizer를 분리하는가

`shotloom-retarget` 안에 세 가지가 섞여있었다:
1. **Retarget math** — 본 회전 매핑, ground correction (이건 retarget의
   본업)
2. **Per-character preprocess** — VRM rest pose를 ARP rest와 정렬,
   손가락 axis 도출, 손목/팔 같은 본의 사용자 calibrated 자세 박아두기
   (이건 캐릭터 모델 임포트 한번에 산출되는 *정적* 데이터)
3. **Per-animation preprocess** — 본 이름 매핑, 좌표 변환 (Step 2 분리
   대상)

(2)와 (3)은 입력/출력/canonical target/변경 cadence가 다 달라서 한
crate에 묶이면 결합만 늘었다. ADR-0030이 셋을 sibling crate로 분리.
이번 PR은 (2)를 분리하는 첫 작업.

### 왜 caller-orchestrated로 바꿨는가

Cycle 회피. `align_full_body_rest`의 시그니처는 `BoneTrack` /
`RetargetConfig` (둘 다 retarget 타입)을 받는다. 함수를 새 crate로
옮기면 normalizer가 retarget을 dep해야 하고 (transitional types-only),
retarget이 그 함수를 다시 import 하면 cycle. 컴파일 안 됨.

해결: retarget이 inline으로 호출하던 구조 자체를 폐기. caller가
retarget 호출 *전*에 직접 alignment 실행. 이건 ADR-0030 본문이 명시한
target dataflow ("Callers driving a retarget import the relevant
normalizer crate alongside `shotloom-retarget`") 와 일치. 부수적으로
`RetargeterOptions::arp_vrm_rest_align: bool` field와 inline `if
options.arp_vrm_rest_align { … }` 블록도 제거. 호출자 0개라 실효 영향
없음.

### 왜 이름을 `character-model-normalizer`로 바꿨는가

ADR-0030 원안은 `shotloom-character-normalizer`. 그런데 sibling이
`shotloom-body-anim-normalizer`, `shotloom-facial-anim-normalizer` —
둘 다 `-anim-` 명시. character 만 무명이라 "이게 anim 인가 model 인가"
헷갈림 (실제로 사용자가 헷갈렸다). `model`을 추가해서 정적 rig + mesh
+ rest pose 임을 명시. 축 두 개가 (model vs anim) × (character vs body
vs face) 이름에서 직접 읽힘. ADR-0030이 아직 Proposed 라 amendment
자유로움.

## How

### 의존 구조 검증

`align_full_body_rest`의 시그니처 deps:
- `BoneTrack` — `shotloom_retarget::types::BoneTrack` (이미 pub 재export ✅)
- `RetargetConfig` — `shotloom_retarget::config::RetargetConfig` (re-export
  추가 필요 → `pub use config::{glob_match, RetargetConfig};`)
- `glob_match` — `shotloom_retarget::config::glob_match` (위와 함께 추가)
- `SourceFormat` — `shotloom_retarget::source_data::SourceFormat` (이미
  pub 재export ✅, 테스트 fixture에서 사용)

Cycle 시나리오 분석:
- 만약 retarget이 새 crate를 dep → cycle (둘 다 서로 의존)
- 만약 caller가 alignment 호출 → 단방향, 컴파일 가능
- 그래서 caller-orchestrated 가 유일한 컴파일 가능 옵션

D vs A 옵션 토론:
- D = retarget에 사본 유지, 새 crate에도 사본 = 564 LOC duplication.
  STL-183 후 정리 가정 — but STL-183은 SourceAsset/SourceFormat만
  다루고 BoneTrack/RetargetConfig은 안 다루므로 cycle 안 풀림. 부채만
  쌓임.
- A = caller-orchestrated, 단일 source of truth. 1줄 deletion에 가까운
  "API 변경" (호출자 0개라 실효 영향 없음).
- 결정: A. 사용자도 동의.

### 4개 파일 이동

`git mv`로 history 보존 (94–98% similarity):
- `adapters/arp_vrm.rs` (639 LOC) — Stage 4 strategy dispatch + 메인 align fn
- `adapters/arp_vrm_user_pose.rs` (125 LOC) — 사용자 calibrated 자세
- `finger_rest_align.rs` (174 LOC) — Stage 2
- `finger_axis_map.rs` (480 LOC) — Stage 1, 캐릭터 한정이라 같이 이동

각 파일의 `use crate::*` 를 `use shotloom_retarget::*` 로 교체. 같은 새
crate 내부 참조는 `crate::` 유지. `super::arp_vrm_user_pose` 는 모듈
구조가 평탄해지면서 `crate::arp_vrm_user_pose` 로 변경.

### retarget 정리

- `lib.rs`: `pub(crate) mod adapters;`, `mod finger_rest_align;`,
  `mod finger_axis_map;` 제거. `pub use config::{glob_match,
  RetargetConfig};` 추가 (transitional types-only).
- `retargeter.rs`: `RetargeterOptions::arp_vrm_rest_align` field 제거 +
  inline `if options.arp_vrm_rest_align { … }` 블록 (line 192–219) 제거.
  `mut vrm_rest` → `vrm_rest` (이제 mutate 안 함).
- `RetargeterOptions`에서 `#[non_exhaustive]` 제거 (workspace-internal
  타입 금지 per `error-handling.md §6` / D5).

### Self-review에서 잡은 결함

1. **postprocess/mod.rs** doc-comment가 옮긴 `adapters::arp_vrm` 경로를
   가리키고 있었음 → `shotloom-character-model-normalizer::arp_vrm` 로
   repoint. (A1)
2. **ADR-0025**가 inline에서 `arp_vrm_rest_align` field를 전제로
   서술하고 있었음 (still Proposed 라 amendment 가능) → header에 Step 1
   amendment 박스 + 표 footnote 추가. (A1/G5)
3. **CI lane 미등록**: 새 crate가 `.github/workflows/code.yml` 어느
   lane에도 안 들어가서 `validate-ci-rust-coverage.mjs` 가 HARD FAIL.
   STL-193 PR #177 가 동일 결함으로 막혔던 사례 (review-code-rust.md G9
   의 Real defect) — 그래서 같은 PR 안에서 등록 의무. → `rust-core-
   and-contracts` lane 에 추가, 17/17 통과. (G9)
4. **D5** `RetargeterOptions` 의 `#[non_exhaustive]` — 빈 struct + 워크
   스페이스 내부 타입에 금지된 attribute. 1줄 제거 + 게이트 재검증.

### 게이트 최종

- `cargo fmt --check` — clean
- `cargo check --workspace --exclude shotloom-desktop` — clean
- `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings` — clean
- `cargo test --workspace --exclude shotloom-desktop` — 44 test 그룹 모두
  green (새 crate 20 unit + 1 integration)
- `node scripts/validate-doc-paths.mjs` — 891/891
- `node scripts/validate-ci-rust-coverage.mjs` — 17/17
- Exit criterion: `rg 'adapters::arp_vrm::align_full_body_rest'
  crates/shotloom-retarget/` → 0 hits ✅

## What

- 새 crate `shotloom-character-model-normalizer` (workspace member 16번째)
- 4개 파일 git-mv로 이동 + import path 수정
- `RetargeterOptions::arp_vrm_rest_align` + inline 호출 블록 + 빈 struct
  의 `#[non_exhaustive]` 제거
- `shotloom-retarget` lib.rs에서 옮긴 모듈 선언 제거 + `RetargetConfig`
  / `glob_match` pub 재export 추가
- `crates/shotloom-retarget/src/postprocess/mod.rs` doc-ref repoint
- `crates/shotloom-retarget/src/adapters/mod.rs` 삭제 (빈 디렉토리 정리)
- ADR-0030 amendment (이름 `character-normalizer` → `character-model-
  normalizer` + sibling symmetry rationale)
- ADR-0025 amendment (header + table + rationale paragraph 에서
  `arp_vrm_rest_align` 제거 반영)
- `.github/workflows/code.yml` rust-core-and-contracts lane 에 새 crate
  등록
- 새 integration test `tests/rest_align_invariant.rs` (empty bone-track
  no-op invariant)
- STL-127 umbrella body 업데이트 (Step 1 sub-issue STL-195 link + 이름
  amendment 안내)
- STL-195 sub-issue 생성 (Linear) + In Progress
- Project learning 문서 업데이트 (`learnings/projects/shotloom.md` 의
  Convention 섹션에 "Three normalizer crates: input/output/canonical
  separation" 추가)

### 사이드 노트

- ADR-0030의 dependency direction 표현 ("normalizers → retarget") 이
  데이터 흐름과 의존성 방향 양쪽으로 읽힐 수 있어 처음에 헷갈렸음.
  명확화: 데이터는 normalizer→retarget 방향으로 흐르지만 *런타임 의존*
  은 forbidden direction (target state). 즉 retarget이 normalizer를
  Cargo dep해도 OK (post-Step 1), normalizer가 retarget을 runtime
  call하는 건 X (target state). transitional types-only는 허용 (현재
  단계).
- `git mv` 후 한 번 디렉토리 이름을 다시 바꾸면서 (`character-
  normalizer` → `character-model-normalizer`) staged renames이 RD (renamed/
  deleted) 상태로 꼬였음. `git rm -r --cached` + `git add`로 정리.
  교훈: 이름 결정은 `git mv` *전에* 확정.
- `RetargeterOptions {}` 빈 struct에 `#[non_exhaustive]` 가 붙어있는
  의미가 사실상 0이라는 걸 D5 sweep에서 잡힘. variant도 없는데
  exhaustiveness 보호 의미 없음. 이런 경우 attribute 자체가 dead — 빈
  struct + non_exhaustive 조합은 future smell.

---

## PR #179 — body-anim-normalizer 크레이트 boundary + 이름 정렬

### Big picture

Shotloom의 retarget 파이프라인은 지금까지 "정규화(소스 본 이름 매핑 + 좌표 변환) + retarget math"가 한 크레이트(`shotloom-retarget`)에 섞여 있어서, 새 소스 포맷(PMX, ARP 외 DCC, AI 생성 면 데이터)을 추가할 때마다 retarget 코어를 건드려야 했다. ADR-0030 가 이걸 깨서 normalizer 3종(body / character / face)을 별도 크레이트로 빼는 결정을 내렸고, STL-127 가 그 umbrella, STL-194 가 body 절반. 이번 [PR #179](https://github.com/CINEV/shotloom/pull/179) 는 body normalizer 의 **Phase 1+2** — 크레이트 경계 + 출력 타입(`BoneTrack`) 소유권 + `mapping.rs` 함수 이름 정렬 — 을 처리. 실제 함수 본체 이동(Phase 3)은 source 타입 재배치(STL-183) 머지 후 별도 PR.

### Why

ADR-0030의 한 줄짜리 큰 그림은 **"normalize ≠ retarget, 크레이트 경계로 강제하자"**. 그런데 막상 시작해보니 source types(`SourceAsset`, `SourceFormat`, `SourceBone`)가 retarget 안에 박혀 있어서 normalizer 함수를 옮기는 순간 Cargo 순환 의존이 생김. ADR이 이걸 미리 알고 "until STL-183 lands, normalizers link shotloom-retarget for type definitions only" 라고 prerequisite을 명시해둠. 그래서 이번 PR은 대신:

1. **경계는 미리 만든다** — 빈 크레이트 + 출력 타입 소유권만 이전 (cycle 없음).
2. **이름은 미리 정렬한다** — `retarget_body/facial/retarget` → `normalize_body/facial/normalize`. 이미 정규화 작업인데 retarget 라고 잘못 적혀있던 것뿐. 미리 정리하면 Phase 3 가 순수 relocation이 됨 (relocation + rename 동시 X).
3. **함수 본체 이동은 STL-183 머지 후로 미룬다.**

이 staging이 PR body Phase 1/2/3 섹션에 명시됨. STL-194 description도 같은 framing으로 갱신.

### How

- **Branch base 결정**: PR #172 (body retarget 골든 회귀 테스트, 아직 OPEN) 에서 분기. 회귀 테스트가 워크트리에 처음부터 존재 → 매 커밋마다 `cargo test -p shotloom-retarget --test body_retarget_regression` 으로 가드. PR base를 `test/body-retarget-regression` 으로 설정해서 stack PR — #172 머지되면 자동으로 main으로 rebase됨.
- **5 커밋 분리**: scaffold → BoneTrack 이동 → 함수 rename → enum + staged-extraction doc → CI lane 등록. 각 커밋이 독립적으로 reviewable.
- **G9 사전 적발**: `/shotloom-review-before-pr` 가 신규 크레이트 CI lane 등록 누락 잡음. STL-193 PR #177 face-normalizer 가 정확히 같은 결함으로 Code Gate fail 했던 게 review-code-rust.md G9로 캡쳐돼서 이번엔 **PR open 전에** 발견 → 같은 브랜치에서 즉시 픽스. 패턴 캡쳐의 ROI.
- **함수 이름 sweep**: `retarget_body/facial/retarget` 제거 직전에 `rg` 로 외부 호출자 0개 확인 → 안전한 rename.

### What

- **신규 크레이트 `crates/shotloom-body-anim-normalizer/`**: Cargo.toml + src/lib.rs + src/types.rs.
  - `BoneTrack` 정의 ownership.
  - `CanonicalTarget` enum (`Cr` 단일 variant, A-pose는 후속 ADR).
  - 크레이트 doc에 Phase 1/2/3 staged extraction 명시.
- **`shotloom-retarget`**:
  - `BoneTrack` 정의 제거, `pub use shotloom_body_anim_normalizer::BoneTrack` re-export.
  - `mapping::retarget_body/facial/retarget` → `normalize_body/facial/normalize`.
  - `crates/shotloom-retarget/Cargo.toml` body-anim-normalizer path dep 추가 (역방향 dep 없음).
- **CI**: `.github/workflows/code.yml` `rust-core-and-contracts` lane에 `-p shotloom-body-anim-normalizer` 추가.
- **Linear STL-194**: description에 Phase 1/2/3 framing 명시, In Review로 transition.

### 사이드 노트

- **Cycle 발견 타이밍**: BoneTrack 이동 commit 후에 다음으로 SourceAnimBody 옮기려고 하다가 cycle 발견. 만약 처음부터 함수 이동까지 한 번에 시도했으면 더 큰 revert가 필요했을 것. 작은 commit + 다음 단계 시도 패턴 덕분에 cheap 한 단계에서 막힘.
- **ADR 가 prerequisite을 명시한 것의 가치**: ADR-0030 §Dependency direction의 "until STL-183 lands" 한 줄 덕분에, cycle 만났을 때 "이건 ADR이 이미 인정한 임시 단계" 라고 즉시 framing 가능했음. ADR이 미래 한계점을 미리 적어두면 staging 결정이 훨씬 빨라진다.
- **`character-normalizer` rename 예고**: 사용자가 `shotloom-character-normalizer` → `shotloom-character-model-normalizer` 로 rename 할 예정이라고 알려줌. 내 PR엔 현재 이름으로 그대로 둠 — rename PR이 ADR-0030 + 모든 cross-reference를 sweep할 때 자동으로 픽스됨 (Pattern A8 concept-word sweep). 미리 바꾸면 ADR과 어긋나서 리뷰어 confuse.
- **PR base가 `test/body-retarget-regression`**: stack PR. PR #172 가 main으로 머지되면 GitHub가 자동으로 base를 main으로 옮겨줌. 그동안 diff에 #172 변경분이 안 섞여 보임.

---

## 11:55 — STL-179 closed (merged)

**PR:** [#172](https://github.com/CINEV/shotloom/pull/172) `test(retarget): pin body retarget output via golden regression` — MERGED 2026-04-27 02:20 UTC
**Linear:** [STL-179](https://linear.app/cinamon-corp/issue/STL-179) In Progress → **Done**
**Branch:** `test/body-retarget-regression` (squash-merged, force-deleted)
**Worktree:** `.worktrees/stl-127-body-retarget-regression` (removed)
**Parent:** STL-127 (ADR-0030 normalizer 3-crate 추출 umbrella)

**Summary:** ADR-0030 Step 0 안전망 — body retargeter의 per-bone 회전 출력을 golden snapshot으로 pin해서 Step 1-3 crate 이동 중 silent 수학 회귀를 잡는다. fixtures.json preset 1 (1764 frames × 53 bones), bone당 5개 균등 샘플 quaternion, `Quat::angle_between` 5e-3 rad tolerance, snapshot header에 tolerance 명시(코드 수정 없이 조정 가능). LFS pointer 미다운로드 가드 + 회귀 시 stderr에 전체 snapshot dump → CI 로그만으로 regen 가능. 이로써 Step 1 (PR #177/#178/#179 — facial/character/body normalizer scaffold) 이 silent regression 없이 진행됨이 보장.

**Side note:** close-task 실행 시점에 `~/.claude/private/caol-config/doc-paths.json` 누락 확인 → 같은 세션에서 layer-1 config 생성. 13개 purpose (devlog/learning/topic/postmortem/consulting/research/notes/experiment/tutoring/drinks/vocab/private-data/ops) × {default, no-vault} 매핑. 이제 `/learn-log-day` 정상 동작.

---

## 15:36 — STL-193 closed (merged)

**PR:** [#177](https://github.com/CINEV/shotloom/pull/177) docs(adr): propose ARKit 52 canonical + scaffold facial-anim-normalizer — MERGED 2026-04-27 06:36 UTC
**Linear:** [STL-193](https://linear.app/cinamon-corp/issue/STL-193/featretarget-scaffold-shotloom-facial-anim-normalizer-arkit-52-adr) In Progress → Done (auto via `Resolves STL-193` on merge)
**Branch:** `feat/adr-0032-arkit-52-facial` (deleted; tip was `cd96b95`)
**Worktree:** `.worktrees/stl-193-arkit-52-facial` (removed)
**Commits on branch:** 8 (`e883edb` … `cd96b95`)
**Parent:** STL-127 (ADR-0030 normalizer 3-crate 추출 umbrella) — Step 3

**Summary:** ADR-0033이 Accepted로 land. ARKit 52 채널 가치 시맨틱 (`[0,1]` clamp, bilateral 쌍 독립, 채널 비배타, scalar-weight 출력) + `x.<source>.<name>` 확장 namespace + baseline-shadowing 금지를 pin. 결정만 ~80줄, ADR-0030이 미뤘던 두 항목을 정확히 닫음. 52 채널 이름 표는 ADR에서 빠지고 `shotloom-facial-anim-normalizer/lib.rs`의 `pub const ARKIT_52_CHANNEL_NAMES: &[&str; 52]`로 이동, length / uniqueness / per-group alphabetical-order 테스트 3개로 drift를 구조적으로 차단. 리뷰에서 잡힌 Jaw 알파벳 anomaly (`jawForward, jawLeft, jawRight, jawOpen` — `jawOpen`이 `jawRight` 앞에 와야 자체 규칙 충족)는 `groups_are_contiguous_and_alphabetical` 테스트가 자동 수정.

> [!tip] Skill drift fixed mid-PR
> ADR이 245줄로 비대해진 근본 원인은 `shotloom-draft-adr` 스킬이 자체 inline Markdown skeleton을 들고 있어서 `docs/guidelines/adr-template.md`와 어긋나 있던 것. 같은 세션에서 스킬을 in-repo 템플릿 단일 소스 강제로 재작성 (H2 list verbatim, no additions/removals, G10 self-check 추가, inventory/grammar는 source code로 보내야 함을 명시). caol-ila 커밋 `fb1be60`. 다음 ADR PR부터 같은 defect class 발생 안 함. PR 본문에도 process note 남김 ([issuecomment-4324546875](https://github.com/CINEV/shotloom/pull/177#issuecomment-4324546875)).

> [!info] Review cycle
> ryumiel: 두 라운드 구조 비판 (04:30 + 05:40) — "ADR 245줄, 진짜 결정은 ~60줄. 52-channel list는 source가 owns해야 한다." plan A (재구성) 수용 → 커밋 `01f7580`로 ADR 슬림화 + 상수 추가. APPROVED 후 5개 P3 nits (Status flip, README index move, Cargo description, empty `[dependencies]` drop, VRM citation 구체화) → 커밋 `0744ca2` + URL fix `cd96b95` (lychee가 VRM URL 404 잡아 `main` → `master` 정정).
