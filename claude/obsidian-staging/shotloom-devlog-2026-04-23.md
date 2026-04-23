---
title: "Shotloom devlog — 2026-04-23"
tags:
  - devlog
  - shotloom
  - refactor
  - workspace-root
  - fixture-paths
  - wasm
date: 2026-04-23
source: claude
---

# Shotloom devlog — 2026-04-23

STL-142 (PR #146) 의 fixture 이관에서 scope boundary 로 유예되었던 두 개의 리팩터 follow-up 을 하나로 묶어 착지 — `workspace_root()` 헬퍼 중앙화와 `FACE → FACIAL` 리네임. 둘 다 `fixture_paths.rs` 주변을 건드리므로 분리하면 동일 파일을 두 번 수정하게 되어 한 PR 로 묶는 게 자연스러웠다. 리뷰에서 `shotloom-common::paths` 가 WASM 빌드에도 들어가 host-filesystem path 가 browser binary 에 박힐 수 있다는 P3 갭을 짚어줘서, cfg gate 로 native-only 계약을 컴파일 타임 강제로 바꿨다. PR [#154](https://github.com/CINEV/shotloom/pull/154).

---

## 06:10 — STL-169 closed (merged)

**PR:** [#154](https://github.com/CINEV/shotloom/pull/154) refactor(fixtures): centralize workspace_root helper and rename face to facial — MERGED
**Linear:** [STL-169](https://linear.app/cinamon-corp/issue/STL-169/) In Progress → Done (auto-transitioned on merge)
**Branch:** `refactor/fixture-paths-workspace-root` (deleted, squash-merged)
**Worktree:** main checkout (no dedicated worktree)
**Commits on branch:** 2 (`d9e981b` refactor + `e0dde24` review-feedback fix)

**Summary:** 7개 call site 의 `workspace_root()` 복제 코드 (`.parent().and_then(|p| p.parent()).expect(...)`, `.parent().expect().parent().expect()`, `format!("{}/../..")` 등 3가지 형태) 를 `shotloom_common::workspace_root()` 단일 헬퍼로 통합. `FACE_FBX_RELATIVE` / `face_fbx()` → `FACIAL_FBX_RELATIVE` / `facial_fbx()` 리네임, 약 9개 호출자 업데이트. 순수 리팩터 — 동작 변화 없음.

## What

- `crates/shotloom-common/src/paths.rs` 에 `pub fn workspace_root() -> PathBuf` 신설. `CARGO_MANIFEST_DIR` 에서 두 단계 위를 workspace root 로 해석. 재배치되면 패닉 메시지가 `"shotloom-common must live under <workspace>/crates/"` 로 가이드.
- 7개 call site 치환: `shotloom-gltf/tests`, `shotloom-retarget/{src,tests,examples}`, `shotloom-engine/{src,tests}`, `shotloom-tauri/src`.
- `fixture_paths.rs` 의 `FACE_*` → `FACIAL_*` 리네임, `shotloom-import` + `shotloom-fbx-anim-importer/tests` 5개 호출자 업데이트.
- crate wiring: `shotloom-common` 을 `shotloom-gltf` dev-dep, `shotloom-tauri` 일반 dep 로 추가 (모두 workspace path dep, 외부 crate 추가 없음).

## Review feedback → fixups

ryumiel 의 P3 nit 3개:

- **stale locality comment (`vrm_spawn_integration.rs:430`):** `CARGO_MANIFEST_DIR = crates/shotloom-engine → 두 단계 위` 주석이 헬퍼 swap 이후 의미가 없어짐 (상수는 이제 `shotloom-common` 내부에서 평가됨). 삭제. 더불어 pre-helper `PathBuf::from(format!("{}/../.."))` 제거 후 남아 있던 `std::path::PathBuf` unused import 도 정리.
- **WASM native-only contract (`shotloom-common/src/paths.rs`):** `shotloom-common` 은 `cfg(target_arch = "wasm32")` 조건부 의존(`web-sys`) 을 갖고 있어 WASM 빌드에도 포함됨. `env!("CARGO_MANIFEST_DIR")` 는 빌드 타임에 host filesystem path 를 bake 하므로 browser runtime 에서는 무의미한 값이 반환될 뿐 아니라 host path string 이 WASM 아티팩트에 박힌다. `#[cfg(not(target_arch = "wasm32"))]` 를 `lib.rs` 의 `pub mod paths;` 와 `pub use paths::workspace_root;` 에 적용 — WASM 에서 호출하면 컴파일 에러로 거부됨. 
- **부수 효과 (스코프 확대):** `cargo check -p shotloom-web --target wasm32-unknown-unknown` 로 검증해보니 `shotloom-web → shotloom-retarget → fixture_paths → workspace_root` 의 transitive dependency 가 WASM 빌드 그래프에 들어가 있어서 cfg gate 하나만으로는 빌드가 깨졌다. `shotloom_retarget::fixture_paths` 모듈 자체와 `shotloom_fbx_anim_importer` 의 re-export 에도 같은 cfg 를 걸어서 fixture helpers 는 native-only 라는 계약을 명시적으로 일관화.
- **paired test 중복 (`paths.rs`):** `workspace_root_contains_crates_dir` 와 `workspace_root_contains_cargo_toml` 는 같은 failure mode (`shotloom-common` 의 relocation) 를 커버. 하나의 `workspace_root_points_at_repo` 테스트로 합쳐서 두 assertion 을 한 body 에 넣음.

Fixup 커밋 `e0dde24`. 3 threads resolved, ryumiel 에게 re-request review — 즉시 approve + merge.

## Learnings

- **암묵적 native-only 계약은 WASM 빌드에서 터진다.** `CARGO_MANIFEST_DIR`, `std::fs`, 파일시스템 path helpers 는 browser runtime 에 의미가 없다. 그걸 쓰는 crate 가 WASM target 을 갖는 의존 그래프에 들어가 있다면 (`shotloom-common` 이 `web-sys` 를 조건부로 의존하듯), 컴파일러한테 알려주지 않는 한 host path string 이 브라우저 아티팩트에 silently bake 될 수 있다. `#[cfg(not(target_arch = "wasm32"))]` 는 이런 "사실상 native-only 인데 타입 시스템은 모른다" 케이스를 런타임 버그에서 컴파일 에러로 밀어올리는 가장 저렴한 수단이다.
- **Cfg gate 는 transitive 하다.** 어떤 심볼을 `cfg(not(wasm32))` 로 막으면 그 심볼을 쓰는 다운스트림 crate 중 WASM 빌드에 포함되는 놈이 있는지 반드시 `cargo check -p <leaf-wasm-crate> --target wasm32-unknown-unknown` 으로 확인해야 한다. 중간 crate 에도 같은 gate 를 전파해야 빌드가 클린해진다. 이 PR 에서는 `shotloom-web → shotloom-retarget → fixture_paths` 경로였고, gate 가 리뷰 요청 범위를 넘어 `shotloom-retarget` 와 `shotloom-fbx-anim-importer` 에도 퍼졌다.
- **Squash merge 는 `git branch -d` 를 실패시킨다.** PR 이 merged 되더라도 local 브랜치의 개별 commit SHA 는 main 의 squash commit 과 다르기 때문에 `-d` 가 "not fully merged" 로 거부된다. 이 경우 `-D` 가 정상 경로 (PR merge 상태를 GitHub 에서 확인한 뒤).
