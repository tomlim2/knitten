---
title: "Shotloom devlog - 2026-05-13"
tags:
  - devlog
  - shotloom
  - gltf
  - vrm
  - import
date: 2026-05-13
source: codex
---

# Shotloom devlog - 2026-05-13

---

## STL-398 - feat(gltf): repair VRM1 thumb humanoid slots

이번 작업은 Shotloom의 VRM import/normalization 파이프라인에서 normalized VRM artifact가 downstream retarget/rest-pose 소비자에게 제공하는 humanoid slot 계약을 좁게 고정했다. node hierarchy, node name, mesh, transform은 source skeleton의 구조로 보존하고, `*ThumbMetacarpal`/`*ThumbProximal` humanoid slot의 `node` mapping만 canonical thumb-chain order로 보정하게 했다. 이로써 import cache를 거쳐 들어오는 VRM1-shaped asset이 thumb metacarpal을 wrist-attached node로 안정적으로 노출하고, retarget 쪽 wrist rest pose 검증이 같은 전제를 공유할 수 있다. PR: https://github.com/CINEV/shotloom/pull/312, issue: STL-398.

### Why

일부 VRM1-shaped normalized asset은 `*ThumbMetacarpal`과 `*ThumbProximal` slot이 thumb chain에서 반대로 매핑될 수 있었다. 이 상태를 그대로 넘기면 skeleton 구조 자체는 맞아도 humanoid metadata가 retarget/rest-pose consumer에게 다른 의미로 읽힌다. 이번 PR은 skeleton 자체를 변형하지 않고 metadata slot만 보정하는 최소 surface로 문제를 처리했다.

### How

`shotloom-gltf`에 private `vrm_humanoid_slot_repair` pass를 추가하고, 기존 180Y normalization 뒤와 validation/metadata extraction 앞에서 실행되게 했다. repair pass는 `leftHand`/`rightHand` 기준 hierarchy depth를 계산해 proximal slot이 metacarpal slot보다 wrist에 가까운 경우에만 두 slot의 `node` 값을 swap한다. no-op asset은 original bytes를 그대로 반환하고, repair가 일어난 경우에만 GLB를 rebuild하며 `canonicalized_thumb_humanoid_slots` info diagnostic을 추가한다. `shotloom-import`의 normalized VRM cache namespace는 v4로 올려 이전 cache artifact가 재사용되지 않게 했다.

### What

새 production module과 integration regression test를 추가했고, 기존 normalization debug stages에도 같은 repair 결과가 반영되게 했다. fixture coverage는 yoya/minjoon/VRM0 converted fixture의 repair case와 xiao/m-c/zepeto canonical no-op case를 모두 확인한다. local PR gate는 `cargo fmt --check`, `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings`, `cargo check --workspace --exclude shotloom-desktop`, `cargo test --workspace --exclude shotloom-desktop`, `node scripts/validate-doc-paths.mjs` 모두 통과했다.

### 사이드 노트

- `cargo doc --workspace --exclude shotloom-desktop --no-deps`는 touched `vrm_normalization.rs`의 기존 path-style rustdoc link를 경고로 띄웠다. 해당 링크는 plain path prose로 정리했고, 남은 unresolved-link 경고는 이번 diff 밖의 `shotloom-fbx-anim/src/types.rs`에 있었다.
- `cargo doc` 실행 중 rustc long-type text artifact가 repo root에 생겨서 untracked cleanup이 필요했다.

---

## STL-400 - test(gltf): generic GLB import boundary smoke

이번 작업은 Shotloom의 glTF import 경계에서 일반 non-VRM GLB가 어디까지 통과하고 어디서 막히는지를 테스트로 고정했다. 샘플 자체는 `shotloom-gltf` 레이어에서 glTF 2.0 binary asset으로 파싱되고 mesh/material을 가진다. 반면 bridge `ImportAsset(kind: Character)` 경로는 현재 VRM 전용 검증을 수행하므로 같은 파일을 character asset으로 등록하지 않는다. 이 기준선은 이후 prop/generic glTF import를 설계할 때 기존 VRM 경계와 새 asset kind 경계를 분리해서 볼 수 있게 한다. PR: https://github.com/CINEV/shotloom/pull/313, issue: STL-400.

### Why

일반 GLB fixture 없이 import 확장을 시작하면 파일 자체가 깨진 것인지, Shotloom bridge가 VRM 전용이라 거절하는 것인지가 섞인다. 이번 PR은 그 둘을 분리했다. 샘플은 정상 glTF로 읽히지만 현재 제품 경로에서는 의도적으로 등록되지 않는다는 사실을 먼저 남겨, 다음 구현 PR이 바꿔야 할 경계를 명확하게 만든다.

### How

`assets/samples/glb_furniture_001.glb`를 Git LFS fixture로 추가하고 `assets/README.md`에서 samples 디렉터리의 역할을 generic non-VRM smoke asset으로 갱신했다. `shotloom-gltf` integration test는 GLB container, JSON asset version, non-VRM extension absence, mesh/material presence를 확인한다. `shotloom-engine` bridge test는 같은 bytes를 `ImportAsset(kind: Character)`로 넣었을 때 `ASSET_VALIDATION_FAILED`와 `vrm_validation_failed`가 나오고, `AssetRegistered`, `BundleChanged`, manifest entry, cache entry가 남지 않으며 staging bytes가 소비되는지 확인한다.

### What

브랜치는 `origin/main`에서 다시 만든 `chore/gltf-import-boundary-smoke`만 PR로 사용했다. 처음 잘못 push된 stale branch는 삭제했고, Linear attachment도 PR #313과 현재 commit만 남도록 정리했다. local gate는 `cargo fmt --check`, targeted glTF/engine tests, targeted clippy, workspace clippy/check/test, `node scripts/validate-doc-paths.mjs`, `pnpm validate:mermaid`를 통과했다. `$shotloom-review-before-pr` cold-start code review는 clean이었고, docs review가 지적한 PR Why의 issue ID 노출과 assignee 누락은 PR metadata 수정으로 해결했다.

---

## STL-403 - docs(guidelines): add UI feedback surface guidance

이번 작업은 Shotloom editor의 feedback surface 선택 기준을 작게 문서화했다. Toast, inline feedback, banner, modal dialog, destructive modal, progress overlay가 각각 언제 맞는지 한 파일에서 확인하게 만들고, 기존 `ToastProvider`/Radix Dialog 구현을 바꾸지 않았다. Alpha failure-mode의 구체적 매핑은 계속 `docs/specs/error-ux.md`가 소유하고, 이 문서는 review vocabulary와 authoring guardrail만 담당한다. PR: https://github.com/CINEV/shotloom/pull/316, issue: STL-403.

### Why

Shotloom에는 이미 toast provider와 delete confirmation dialogs가 있었지만, 새 UI 작업에서 어떤 surface를 골라야 하는지 확인할 짧은 기준 문서가 없었다. 이 공백을 그대로 두면 warning, error, confirmation, progress 상태가 PR마다 다르게 해석된다.

### How

`docs/guidelines/ui-feedback-surfaces.md`를 새로 추가하고, `docs/guidelines/README.md`와 `MAP.md`에서 찾을 수 있게 연결했다. 초안의 과한 Vercel reference, 코드 예시, 긴 copy table, Tailwind 설명은 삭제하고, Shotloom 현재 구조에 맞는 판별표와 필수 규칙만 남겼다.

### What

runtime, dependency, component code는 건드리지 않았다. 검증은 `pnpm validate:doc-paths`, `pnpm validate:durable-doc-linear-refs`, targeted `markdownlint-cli2`, `git diff --check origin/main..HEAD`로 끝냈다. Draft PR로 열어두었고, draft 상태라 CI 이후 `/claude-review` 트리거는 보류했다.

---

## STL-402 - feat(gltf): add axis-bake primary-child picker

이번 작업은 Shotloom의 VRM normalization 레이어에서 axis-bake correction을 하기 전에 필요한 topology policy를 먼저 고정했다. 실제 bone rotation, mesh bake, inverse bind matrix rebake, cache version 변경은 하지 않고, 각 humanoid bone이 방향을 잡을 때 사용할 primary child node를 deterministic하게 고르는 private helper와 테스트만 추가했다. 이 PR은 다음 correction-quaternion / normalize-time wiring 작업이 “어느 child를 기준으로 본 방향을 계산하는가”를 다시 결정하지 않게 만드는 기반 작업이다. PR: https://github.com/CINEV/shotloom/pull/317, issue: STL-402.

### Why

본을 실제로 돌리기 전에 bone direction의 기준점이 필요하다. 단일 child bone은 단순하지만, `hips`처럼 spine과 legs가 갈라지거나 hand처럼 여러 finger root가 붙은 경우 child array 순서에 의존하면 exporter마다 결과가 달라진다. 이번 PR은 이 선택 정책을 mutation 없는 helper로 먼저 분리해, later bake pass가 같은 topology invariant를 쓰게 한다.

### How

`shotloom-gltf` 안에 private `vrm_axis_bake` module을 만들고, `HumanoidMap`과 GLB JSON `nodes[]` slice를 입력으로 받는 selector를 추가했다. selector는 single child를 직접 선택하고, multi-child에서는 expected humanoid chain slot을 우선한다. expected child가 없으면 direct humanoid child를 local priority table로 정렬하고, 그래도 usable child가 없으면 `None`을 반환한다. invalid index, malformed child entry, missing parent node는 모두 synthetic JSON unit test로 고정했다.

### What

production normalization path는 아직 호출하지 않는다. `finalize_normalized_vrm`, import cache, diagnostics, normalized GLB bytes는 변경하지 않았다. 검증은 `cargo fmt --check`, `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings`, `cargo check --workspace --exclude shotloom-desktop`, `cargo test --workspace --exclude shotloom-desktop`, `cargo test -p shotloom-gltf vrm_axis_bake`, `cargo clippy -p shotloom-gltf -- -D warnings`, `node scripts/validate-doc-paths.mjs`를 통과했다. `$shotloom-review-before-pr` cold-start code/docs review도 최종 clean이었다. PR은 draft로 열었고, draft 상태라 `/claude-review` 트리거는 보류했다.

---

## STL-408 - feat(gltf): add axis-bake correction calculator

이번 작업은 Shotloom의 VRM normalization 레이어에서 axis-bake가 실제 bone rotation을 쓰기 전에 필요한 quaternion math contract를 private helper로 고정했다. primary-child picker가 고른 child direction을 기준으로 local +Y를 어떻게 돌릴지 계산하되, GLB bytes, node transforms, inverse bind matrices, normalized VRM cache는 아직 변경하지 않는다. 이 PR은 다음 normalize-time wiring 작업이 topology 선택과 correction 수학을 분리해서 검토할 수 있게 만든다. PR: https://github.com/CINEV/shotloom/pull/321, issue: STL-408.

### Why

axis-bake는 본을 실제로 돌리기 전에 “어떤 local correction을 old local rotation에 합성할 것인가”를 명확히 해야 한다. 이 계산이 implicit하게 normalization mutation 안에 들어가면 near-opposite vector, exact-opposite fallback, non-unit rotation 같은 edge case가 bake 동작과 섞여 리뷰된다. 이번 PR은 그 수학 primitive만 먼저 분리했다.

### How

`shotloom-gltf`의 private `vrm_axis_bake` module에 correction helper를 추가했다. helper는 finite input만 받고, finite non-unit `Quat`은 normalize한 뒤 child position delta를 world-space direction으로 만든다. exact-opposite singular case는 deterministic local +X 180-degree fallback을 반환하고, non-singular near-opposite direction은 axis-angle path로 실제 child direction을 보존한다. 반환된 correction은 Phase wiring에서 `old_local_rotation * correction` 형태로 사용할 local-space delta 계약을 테스트로 고정했다.

### What

새 unit tests는 identity, local right-multiply composition, zero/near-zero child direction, non-finite position/rotation, finite non-unit rotation normalization, zero-length rotation rejection, exact-opposite fallback, near-opposite preservation을 확인한다. production normalization path는 아직 호출하지 않는다. local PR gate는 `cargo fmt --check`, `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings`, `cargo check --workspace --exclude shotloom-desktop`, `cargo test --workspace --exclude shotloom-desktop`, `node scripts/validate-doc-paths.mjs` 모두 통과했다. `$shotloom-review-before-pr` cold-start code/docs review도 최종 clean이었다. PR은 draft로 열었고, draft 상태라 `/claude-review` 트리거는 보류했다.
