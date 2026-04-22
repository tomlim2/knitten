---
title: "Shotloom devlog — 2026-04-22"
tags:
  - devlog
  - shotloom
  - gltf
  - vrm
  - testing
  - adr
  - normalizer
  - character-model
  - retarget
  - architecture
date: 2026-04-22
source: claude
---

# Shotloom devlog — 2026-04-22

`shotloom-gltf` 의 VRM normalization 파이프라인은 import → retarget → preview 로 이어지는 캐릭터 골든 패스의 입구고, `debug_normalize_vrm_stages` 는 그 파이프라인을 단계별로 들여다볼 수 있는 유일한 디버그 진입점이다. VRM0 분기는 테스트가 두터웠지만 VRM1 분기는 0 이었고, 특히 `converted_vrm1_bytes == None` 이라는 "VRM1 경로는 VRM0 conversion 을 절대 거치지 않는다"는 불변식이 어디에도 assert 되어 있지 않았다 — 조용히 깨지면 `shotloom-retarget/examples/vrm_spec_validate.rs` 같은 downstream 툴이 엉뚱한 바이트를 보고서야 드러난다. STL-106 (PR #111) 에서 ryumiel 이 갭으로 짚고 스코프 밖이라 분리된 follow-up. PR [#143](https://github.com/CINEV/shotloom/pull/143).

---

## Why

`debug_normalize_vrm_stages` 는 import/retarget 파이프라인의 디버그 진입점으로, `crates/shotloom-retarget/examples/vrm_spec_validate.rs` 가 호출한다. VRM1 분기는 커버리지가 0이었고, 함수 시그니처상 `converted_vrm1_bytes == None` 이 VRM1 경로의 불변식이지만 어디에도 assert 가 없었다. 조용한 regression 이 생기면 downstream 예제/툴이 이상 동작할 때까지 안 보인다. STL-106 (PR #111) 스코프 밖이라 분리된 이슈.

## How

- `crates/shotloom-gltf/src/vrm_normalization.rs` 테스트 모듈에 두 개 추가.
- 기존 헬퍼 재사용: `complete_vrm1_json()` (forward), `build_vrm1_with_backward_hips()` (180Y root 주입).
- 테스트 이름은 assertion 과 1:1 매칭 — `_forward_passthrough`, `_backward_rewrites_normalized_bytes`.

## What

두 테스트:

1. **forward passthrough** — 정상 VRM1 GLB → `stages.normalized_bytes == raw_bytes`, `converted_vrm1_bytes == None`.
2. **backward rewrite** — hips 노드에 180Y rotation 주입된 VRM1 → `normalized_bytes != raw_bytes` (180Y 제거됨), `converted_vrm1_bytes == None` 불변식은 여전히 유지.

36 줄, production 코드 변경 0. `cargo test -p shotloom-gltf --lib` → 64 passed (기존 62 + 신규 2).

---

## 사이드 노트

- 브랜치 처음에 `test/normalize-vrm1-coverage` 로 만들었는데, `/shotloom-review-before-pr` G4 패턴이 잡아냄. CONTRIBUTING.md 에 허용된 prefix 는 `feat|fix|chore|hotfix|release` 뿐이고 test-only 는 `chore/` 로 가라고 명시. 이미 푸시한 상태였는데 리네임 + 구 브랜치 원격 삭제 + 재푸시로 해결. pre-PR self-review 가 여기서 값을 함.
- `/shotloom-start-code` 훅이 Linear 링크 감지해서 자동 발동 → 워크트리 생성 → 컨벤션 재독 → Ready 브리핑 흐름이 매끄러웠음. 손으로 했으면 워크트리 빠뜨렸을 것.

---

## STL-127 — ADR-0029: Normalizer Crate Layer (오늘 메인)

Shotloom 의 캐릭터 import 파이프라인은 지금 `shotloom-retarget` 한 크레이트 안에 **세 가지 성격이 다른 일**이 얽혀 있다 — (1) VRM/ARP 같은 source format adapter, (2) rest pose 정규화 (`align_full_body_rest`, `vrm_rest`, `vrm_normalization`), (3) 실제 retarget math. 이 얽힘은 두 개의 구조적 문제로 번진다. 첫째, `CharacterModel` (serde record in `shotloom-core`) 은 정규화된 rest pose 를 들고 있지 않아서 retarget / engine / preview 각 call site 가 raw import 에서 매번 재도출한다. 도출 경로가 호출자마다 달라 결과 drift 를 잡기 어렵다. 둘째, retargeter 의 public surface 가 source format 고유 이름 (VRM bone map, ARP skeleton name) 을 뱉는다. FBX / PMX 를 로드맵에 올린 이상 "post-import 표현은 source-agnostic" 이라는 계약이 필요한데 지금은 source identity 가 retargeter 까지 흘러 들어간다. 동시에 프로젝트는 곧 ARP rest pose → A-pose 정규화 shape 마이그레이션을 예정하고 있어서, 이 구조 문제를 A-pose 작업 시작 *전에* 닫아두지 않으면 retarget / engine / core 크레이트 시그니처가 그 시점에 또 한 번 깨진다. ADR-0029 는 지금 얻어야 하는 구조적 가치 — **A-pose 가 내려와도 downstream 크레이트 시그니처가 바뀌지 않는 경계** — 에 집중하고, A-pose 자체의 수학·버저닝은 후속 ADR 로 뺀다. 7+ 캐릭터 동시 스폰 capacity 는 functional floor 로 명시 (검증은 별도 follow-up). PR [#153](https://github.com/CINEV/shotloom/pull/153), Linear STL-127.

### Why

`shotloom-retarget::adapters::arp_vrm::align_full_body_rest` 가 `VrmRestPose` 를 in-place 로 변형해 ARP skeleton 과 맞추는데, 이 "재구성" 로직이 retarget math 와 같은 크레이트에 살고 있다. 매 source 포맷이 늘 때마다 adapter 가 하나 더 붙고, `vrm_rest.rs` / `vrm_normalization.rs` / `adapters/` 사이 중복은 누가 authoritative 인지 불분명해진다. 결과적으로 retargeter 의 시그니처가 source format 특성을 지고 있어서, FBX source 를 추가하는 작업이 retargeter 크레이트 안을 들여다봐야 하는 작업이 된다. `CharacterModel` 은 metadata facade 에만 머물고 정규화된 runtime 상태가 없어, engine spawn / preview / retarget 이 제각각 re-derive 하는 것도 이 구조의 결과다. A-pose 마이그레이션이 내려오기 전에 이 경계를 닫아야 downstream 이 안전하다 — 지금 정리하는 비용은 크레이트 두 개 추가와 `CharacterModel` 필드 하나, 나중에 정리하는 비용은 retarget+engine+core 시그니처를 동시에 깨는 multi-PR refactor.

### How

두 개 크레이트로 정규화 책임을 분리하고, 정규화된 character runtime 상태를 `CharacterModel` 안으로 들여온다.

- **`shotloom-character-normalizer`** — `ImportedVrmAsset` (향후 FBX / PMX) → source-agnostic normalized rest pose + character-specific data (foot contact, sole offset) 생산. 오늘 `shotloom-retarget::adapters` / `vrm_rest` / 관련 `shotloom-gltf::vrm_extract` 로직이 전부 이쪽으로 이주.
- **`shotloom-animation-normalizer`** — `ImportedFbxAnimation` (향후 다른 source animation) → `NormalizedAnimation`. 애니메이션 키프레임·본 네임 리맵.
- **`CharacterModel` 확장** — `shotloom-core::model::entity::CharacterModel` 에 `#[serde(default, skip)] pub rest_pose: Option<RestPose>` 추가. `#[serde(skip)]` 로 on-disk 포맷은 backward-compatible 유지 (outliner / inspector / casting / dialog 가 같은 파일을 계속 읽음). `rest_pose` 는 runtime 에 normalizer 를 태워서 채우고, `None` 이면 "정규화 안 됨 — retarget 호출하지 말 것" 이라는 programmer-error 신호.
- **Retarget 시그니처 수렴** — `pub fn retarget(character: &CharacterModel, anim: &NormalizedAnimation, options: RetargeterOptions) -> (TargetAnimation, Diagnostics)` 단 한 줄. Source format 이름이 외부 contract 에서 사라진다.
- **Layering** — `core ← normalizer ← retarget / engine`. `RestPose` 타입은 `shotloom-core` 에 두어 `CharacterModel` 이 normalizer 크레이트에 의존하지 않는다. `RestPose` 는 shotloom-standard bone naming 으로 source 흔적을 지운다.
- **Canonical pose identifier 는 도입하지 않는다** — `CanonicalPoseId` enum, `ACTIVE_CANONICAL_POSE` const, per-asset pose tag 전부 거부. 현재 inhabit 되는 variant 는 하나 (`CinevArpV1`) 뿐이고, A-pose variant 의 body 는 A-pose 수학이 정해질 때나 쓸 수 있다. dead variant 로 미래 shape 을 광고하는 것보다, A-pose 가 실제로 내려올 때 필요한 versioning (cache key, migration) 을 그 시점에 설계한다.

### What

- **문서 3 개**, 코드 변경 0.
  - `docs/adr/adr-0029-canonical-rest-pose-normalization.md` — 287 줄. Status Proposed, Context / Decision / Consequences / Alternatives (5개: A retarget 내부 유지, B CanonicalPoseId 선도입, C 단일 normalize 크레이트, D serde 포함 rest pose, E `CharacterModel` 순수 유지 + `RestPose` 별도 전달) / 9단계 migration plan / Related links.
  - `docs/adr/README.md` — Proposed 섹션에 ADR-0029 인덱스 엔트리 추가.
  - `.agent/canonical-rest-pose-plan.md` — 189 줄, 9단계 implementation plan. 각 단계별 blast radius 와 rollback 메모 포함.
- **로컬 게이트** — CI 통과 (Code Gate ✅, Docs Gate ✅, Markdown Lint ✅, Link Check ✅, Doc Path Validation ✅, Mermaid ✅). ADR 링크는 `validate-doc-paths.mjs` 기준 전부 resolve.
- **Scope trim** — 첫 커밋 (`5264f54`) 에는 9번째 단계로 "7-캐릭터 spawn 검증" 이 들어갔으나, 후속 커밋 (`179a14c`) 에서 분리. capacity constraint 는 Context 에 design constraint 로 남지만, 검증은 follow-up ticket 으로 빠진다 — 이 ADR 의 스코프는 크레이트 경계·시그니처 정리에 한정.
- **Migration plan 요약** — (1) ADR accept, (2) golden regression test 로 `align_full_body_rest` 이동 시 per-bone drift 방어선, (3) 두 normalizer 크레이트 scaffold + stub delegation, (4) `RestPose` + `CharacterModel::rest_pose` 추가, (5) `align_full_body_rest` 이주, (6) animation mapping 이주, (7) retarget 시그니처 교체, (8) `shotloom-engine::motion::apply_motion_preview` 가 normalizer 를 먼저 태우도록 rewire, (9) retarget / gltf 쪽 orphan 코드 삭제.

### 사이드 노트

- **왜 두 크레이트인가 (Alternative C 기각)** — character 정규화 (skeleton 구조, foot contact, sole offset) 와 animation 정규화 (키프레임 맵핑, bone-name remap) 는 입력·출력·변경 주기가 전부 disjoint. 하나로 묶으면 FBX importer 찍을 때마다 character path 가 재컴파일되고 그 반대도 성립. `Cargo.toml` member 하나 더 늘리는 비용은 이 isolation 을 살 만한 가치가 있다.
- **왜 `#[serde(skip)]` 인가 (Alternative D 기각)** — `CharacterModel` 은 outliner / inspector / casting / dialog 가 공유하는 save-file 표면이다. normalized 결과를 serde schema 에 태우면 normalizer 내부 shape 변화가 save 포맷 migration 을 트리거한다. ADR 이 막으려는 바로 그 coupling. `#[serde(skip)]` 은 "shape 은 바이너리가 정의하고 save 파일은 안 본다" 는 contract.
- **왜 `CharacterModel` 에 합치나 (Alternative E 기각)** — "순수 `CharacterModel` + 별도 `RestPose` 인자" 는 retargeter facade 가 `(&CharacterModel, &RestPose, &NormalizedAnimation)` 3-tuple 이 되고, 모든 downstream caller 가 둘을 짝 맞춰 들고 다녀야 한다. 이건 ADR-0029 초안이 실제로 제안했던 구조였고, 이번 revision 이 뒤집은 부분. 한쪽에 묶어 두면 caller 코드가 정규화 상태를 잊지 못한다.
- **A-pose 를 지금 설계하지 않는 이유** — A-pose 수학이 안 정해진 상태에서 미래 shape 에 맞춘 versioning / cache key / pose tag 를 만들면, 유일하게 구현된 variant (`CinevArpV1`) 만 살고 나머지는 "미래 구현 예정" 주석이 된다. ADR 은 "지금 구조적으로 얻을 수 있는 것 — signature stability — 에만 commit" 이라고 명시. A-pose 가 실제로 내려올 때 별도 ADR.
- **정규화 이동의 가장 큰 리스크** — `align_full_body_rest` 가 크레이트 경계를 넘으면서 per-bone 결과가 조용히 drift 하는 것. Migration plan Step 2 에 "ARP→VRM 한 클립의 per-bone output 을 pin 하는 golden regression" 을 선행 조건으로 박아둠. 구현 PR 은 이 테스트가 green 인 상태에서 시작해야 한다.

---

## STL-142 — chore(retarget): consolidate test fixtures under assets/

Retarget 파이프라인과 엔진 런타임이 `crates/shotloom-retarget/fixtures/` 와 `assets/models/` 두 루트에서 동일 캐릭터를 서로 다른 네이밍으로 읽던 이원화 상태를, 단일 루트 `assets/` 아래로 통합했다. 이 작업은 Shotloom 의 VRM 골든 패스 — import → normalize → retarget → preview — 가 "모든 테스트 픽스처는 한 곳에 있고, 파일명만으로 spec version / source / gender / variant 가 드러난다" 라는 전제 위에 서게 하는 기반 정비다. STL-99 (viewer 퇴역) 가 비-goal 로 남겨둔 잔여 중복을 닫아서 향후 VRM 스펙·방향 regression 작업이 깨끗한 asset surface 에서 시작할 수 있게 한다. PR [#146](https://github.com/CINEV/shotloom/pull/146).

### Why

두 루트에 같은 캐릭터가 다른 이름 (`xiao-1x.vrm` vs `vroid_f_xiao.vrm`) 으로 존재해 어느 쪽을 canonical 로 취급해야 할지 불투명했다. commit `eaafa33` 가 `{source}_{gender}_{name}` 컨벤션을 도입했지만 ADR/spec 어디에도 공식화되지 않아 새 픽스처가 ad-hoc 네이밍으로 떠내려갔다. `backward` 방향성·`pmx2vrm` 파이프라인 같은 특성이 파일명에 섞여 있거나 누락돼 STL-96/106/107 류 orientation 추적이 수동 조사에 의존했다.

### How

한 커밋에 구조 이동 + 네이밍 전환을 묶었고, 후속 세 커밋이 사용자 메타데이터 피드백을 반영했다.

- `assets/models/` (VRM), `assets/anims/body/` (AI 팀 ARP export), `assets/anims/facial/` (UE export) 로 재배치. FBX 는 모션 ID + 날짜가 upstream identifier 라 파일명 보존.
- 네이밍 컨벤션 `vrm{version}-{source}-{gender}-{name}[_variant].vrm`. 필드 구분자는 repo 전역 관례를 따라 `-`, variant 접미사는 name 속 하이픈과 구분되도록 `_` 로 분기. gender 는 항상 채워 field count 를 4 로 고정 (`x` = unknown).
- `source` enum 에 `vroid` (VRoid Studio) / `cmm` (VRoid Community, VRoid Hub 커뮤니티 모델) / `booth` (Booth 마켓) / `pmx` (PMX→VRM 변환) / `zepeto` / `vrm` (fallback) 까지 노출.
- 새 `assets/README.md` 가 canonical 컨벤션 문서. `MAP.md`, `shotloom-retarget/README.md`, ADR-0024 가 새 경로로 리디렉트. `fixture_paths.rs` / `fixture_presets.rs` 가 workspace root 기준으로 path 를 resolve 하게 바꿔 교차-crate 참조가 하나의 기준을 공유하도록 정리.
- `fixtures.json` / `bridge.rs` (`DEBUG_CHARACTER_VRM_PATH`) / `native_vrm_load.rs` / `vrm1_backward_fixture.rs` / `vrm_spawn_integration.rs` 가 yoya 등 renamed fixture 를 따라가도록 업데이트.
- 중복 6 종 (xiao, ghostpumpking, moth, shimaenaga, yoya, zepeto-001) 은 `assets/models/` 의 canonical 을 남기고 `fixtures/` 쪽 중복본 제거. 전체 `crates/shotloom-retarget/fixtures/` 디렉토리 소멸.

### What

- 구조: VRM 13 개 이동·리네임 + FBX 11 개 이동 + fixture 트리 완전 제거. 커밋 4 개 (`225623a` 구조 이동 + `4d74d2b` 메타데이터 보정 + `7d94eda` avatar VRoid 태깅 + `95a9008` README source 설명).
- 새 파일 1 개 (`assets/README.md`, 60 LoC 이상), 네이밍 컨벤션 문서 + fixture 추가 가이드 포함.
- 로컬 게이트: `cargo fmt --check`, `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings`, `cargo check`, `cargo test` (99 shotloom-engine, 5 fixture_presets 포함 전 crate pass), `node scripts/validate-doc-paths.mjs` (862/862). `/shotloom-review-before-pr` 22 패턴 전부 clean.
- 테스트 수정: `fixture_presets.rs` 의 `resolve_path` 를 crate manifest dir → workspace root 기준으로 전환. `vrm1_backward_fixture.rs` 의 `fixture_path` 를 `assets/models/` 로 재조정.

### 사이드 노트

- 중간에 발견한 이슈: `assets/anims/body/17857_M_AIStndWide_241204.fbx` 가 LFS 파일이 아니라 `fixtures/anims/body/` 쪽을 가리키는 symlink 였다. 원본을 `git rm` 하면서 symlink 가 dangling 상태가 됐고, `apply_motion_preview_retargets_and_updates_a_named_bone` 테스트가 fs::copy 단계에서 터져서 발견. `git restore --staged --worktree` 로 원본을 되살린 뒤 `git mv` 로 제대로 이동해 해결.
- 네이밍 토론 과정에서 결정: 필드 구분자는 repo 전역이 하이픈이고, underscore 는 Rust 파일명 (snake_case) 외에는 거의 쓰이지 않으므로 파일 네이밍도 하이픈 기본. variant 만 underscore 로 분기해 이름 속 하이픈과 시각적 충돌 회피. 버전은 `vrm1x`/`vrm0x` 한 토큰으로 합쳐 파일 리스팅에서 spec version 이 한눈에 grouping.
- ADR 여부 논의 후 "asset 네이밍은 runtime 계약을 바인딩하지 않으므로 ADR 오버킬" 로 결론. README 하나로 정리하고, 향후 production asset 파이프라인이 정해질 때 ADR 로 승격할지 재검토.
