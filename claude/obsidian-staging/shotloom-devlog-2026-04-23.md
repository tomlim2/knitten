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

---

## 15:47 — STL-170 closed (merged)

**PR:** [#155](https://github.com/CINEV/shotloom/pull/155) docs(adr): replace stale fixture names in ADR-0024 with directory layout — MERGED
**Linear:** [STL-170](https://linear.app/cinamon-corp/issue/STL-170/) In Progress → Done (auto-transitioned on merge)
**Branch:** `chore/adr-0024-fixture-names` (force-deleted, squash-merged as `cbeedf9`)
**Worktree:** `.worktrees/pr-155-adr-0024` (removed)
**Commits on branch:** 2 (`3975fec` initial + `47810dd` review-feedback fixup)

**Summary:** ADR-0024 fixture 이름 교정 follow-up. STL-142 (PR #146) 에서 scope boundary 로 유예되었던 doc-only drift — `test_anim_{male,female,face}.fbx` 는 repo 에 존재한 적 없는 이름이라 실제 `assets/anims/{body,facial}/` 디렉토리 레이아웃을 언급하는 방향으로 교체 (Option B). 리뷰에서 ryumiel 의 P2/P3 nit 2개가 들어와 같은 bullet 위에서 merged: (1) "Upstream ARP export IDs" 는 body 전용 패턴이므로 facial 은 source-pipeline ID 로 구분, (2) `FbxImportMode::Body/Face` variant 명을 직접 인용하고 `facial/` 디렉토리가 `Face` 모드에 매핑된다는 점 명시. Fixup 커밋 `47810dd` — review 는 이미 APPROVED 상태라 re-request 불필요.

## Learnings

- **Doc-only PR 도 worktree 를 쓰는 게 안전하다.** main 의 다른 변경이 진행 중인 상태에서 빠르게 PR 에 응답하려면 worktree 분리가 치즈. 2줄 doc 편집에도 `.worktrees/pr-155-adr-0024/` 를 만들어 두니 본 worktree 의 uncommitted changes 에 영향 없이 작업/커밋/푸시가 끝났다.
- **P2 + P3 nit 가 같은 라인에 겹치면 한 edit 으로 묶는 게 깔끔.** 각각 별도 commit 으로 쪼개면 diff 충돌이 나고 PR 타임라인만 늘어난다. 두 reviewer 의 diff 제안이 서로 호환되면 merge 해서 한 번에 반영, inline reply 에서 "merged with above" 로 양쪽 스레드 닫는 게 실무상 가장 효율적.

---

## 15:04 — PR #153 (STL-127) review 대응, re-review 대기

**PR:** [#153](https://github.com/CINEV/shotloom/pull/153) docs(adr): propose normalizer crate extraction — OPEN (CHANGES_REQUESTED → awaiting re-review)
**Linear:** [STL-127](https://linear.app/cinamon-corp/issue/STL-127/) In Progress (유지)
**Force-push 후 HEAD:** `6623afc` (rebase on `origin/main` + ADR 번호 0029 → 0030 재발급)

ryumiel 의 review 블로커 9개 (P0×3, P1×3, P2×2, P3×1) 전원 처리. 핵심 변경:

- **ADR ID 충돌 해소** (P0 blocking 3건): PR #142 가 ADR-0029 를 선점 (timeline out-of-shot visual convention) → 이 ADR 은 0030 으로 재번호, 파일명 `adr-0030-normalizer-crate-extraction.md`, H1, README index 모두 업데이트.
- **`.agent/normalizer-extraction-plan.md` 제거** (P0): AFDS v2 §3 위반 — 실행 plan 은 repo 에 커밋하지 않고 Linear sub-issue 로 이관. 하나의 durable 문장 ("Step 0 golden regression 이 Steps 1/2 에 선행해야 함") 만 Consequences > Negative 에 살림.
- **ADR 에서 Migration plan 섹션 완전 제거** (P1): `adr-template.md` Usage Notes ("task history 금지") 위반 — per-step exit criteria / blast radius / rollback 은 STL-127 umbrella 아래 sub-issue 로 옮김.
- **P1 blocking — Step 1 exit criterion 부정확** / **P1 blocking — Step 4 파일 레퍼런스 오류 (`vrm_normalization.rs` ↔ `vrm_extract.rs` 혼동)**: 둘 다 Migration plan 섹션 안에 있었으므로 섹션 제거로 moot. Sub-issue 에 올바른 call-site 4종 (`RestAlignOverride` 타입 재배치 / `align_finger_rest` re-export / `retargeter.rs:193` 호출부 rewire / `arp_vrm_user_pose.rs` 처분) + 올바른 파일 참조 넣을 것.
- **P2 nit — `shotloom-import` 가 Related 에 빠짐**: 추가. `ImportedVrmAsset` (crates/shotloom-import/src/lib.rs), `ImportedFbxAnimation` (crates/shotloom-import/src/fbx.rs) 모두 import crate 에 살고, `ImportedFbxAnimation` 은 cache descriptor 라서 body/face normalizer 가 `parse_with_config` 로 재파싱한다는 점 명시. Dependency 다이어그램에도 `shotloom-import` hop 추가.
- **P2 nit — Context 의 face 서술 오버스테이트**: "run through ad-hoc code paths" 가 face 에도 적용되는 것처럼 읽혔지만 face 는 구현 0. 문장 분리: "character, body animation 은 ad-hoc 경로 / facial 은 구현 없지만 경계는 선점 필요."
- **P3 nit — "CR" 약어 미정의**: 첫 등장에 "CR (CINEV Rest) pose, on the CINEV ARP rig" 로 확장.

PR-level 권고 4건 중:
- **제목에서 ADR ID 제거**: `docs(adr): propose ADR-0029 …` → `docs(adr): propose normalizer crate extraction` — 수용.
- **`Related to` → `Part of`** (pr-guideline §4): 수용.
- **STL-127 umbrella + per-step sub-issue**: PR-time 변경 아님. Linear 에서 별도로 진행 — 오늘 [STL-179](https://linear.app/cinamon-corp/issue/STL-179/) (Step 0) 착지.
- **ADR 을 Step 0 또는 Step 3 결과물과 묶어서 랜딩**: scope 확대라 거절. 각각 별도 PR 로 진행 예정이라 답변.

9 inline threads 전부 resolved, ryumiel 재리뷰 요청. 현재 상태: MERGEABLE, waiting.

## 15:54 — STL-179 생성 (STL-127 Step 0 sub-issue)

**Issue:** [STL-179](https://linear.app/cinamon-corp/issue/STL-179/) `test(retarget): pin body retarget output via golden regression (STL-127 Step 0)` — Backlog, parent STL-127.

ADR-0030 의 Step 0 전제조건 (body retarget golden regression) 을 공식 Linear 항목으로 분리. 실제 구현은 로컬 브랜치 `test/body-retarget-regression` @ `346b355` 에 이미 착지 중 — PR 개시 전에 scope 재검토 필요.

**Scope 요약:**
- `crates/shotloom-retarget/tests/body_retarget_regression.rs` 신설
- 한 개의 ARP→VRM body clip 에 대해 per-bone `TargetAnimation.bones[i].rotations[f]` snapshot pin
- bit-exact → 부동소수점 드리프트 시 1e-6 각도 허용치로 완화
- fixture 는 `assets/anims/body/` 의 기존 ARP export 사용

## 15:58 — STL-172 worktree 준비 후 정리

**Linear:** [STL-172](https://linear.app/cinamon-corp/issue/STL-172/) `chore(fbx-anim): rename shotloom-fbx-anim-importer crate to shotloom-fbx-anim` — Backlog 유지.

Worktree `.worktrees/stl-172-rename-fbx-anim-crate/` + 브랜치 `chore/rename-fbx-anim-crate` (`origin/main` 기반) 생성했으나 커밋 없이 EOD. 빈 상태라 worktree + 브랜치 모두 제거. 내일 `/shotloom-start-code STL-172` 로 재생성하면 됨.

## Today's Linear snapshot (EOD)

| ID | Status | 비고 |
|---|---|---|
| STL-127 | In Progress | umbrella, PR #153 re-review 대기 |
| STL-169 | Done | PR #154 merged |
| STL-170 | Done | PR #155 merged |
| STL-179 | Backlog | STL-127 Step 0, 로컬 커밋 있음 |
| STL-172 | Backlog | 워크트리 정리됨, 내일 `/shotloom-start-code STL-172` 로 재시작 |
| STL-75 | Todo | 장기 방치, 우선순위 재평가 필요 |

## Learnings (추가)

- **Review 블로커를 문서 섹션 하나로 묶어서 해소할 수 있으면 많은 커밋을 아낀다.** PR #153 의 9개 블로커 중 4개 (Migration plan 섹션 내부의 Step 1/4/nit 들) 는 섹션 자체를 통째로 제거하는 한 번의 edit 으로 moot 처리. "P1 blocking 을 하나씩 고치지 말고, 그 P1 을 품은 구조적 결정을 바꿀 수 있는지" 먼저 물어본다.
- **ADR ID 충돌은 rebase 타이밍 이슈다.** PR #142 가 ADR-0029 를 선점한 걸 이 브랜치가 몰랐다 — `origin/main` 으로 rebase 하고 나서야 README merge conflict 로 드러남. ADR 을 그린필드로 쓸 때도 `git fetch origin main && git rebase origin/main` 를 draft 제출 직전에 한 번 더 돌리는 게 예방책.
- **Linear umbrella → sub-issue 분해는 ADR 승인 기다리는 동안의 좋은 병렬 작업.** PR #153 이 re-review 대기 중일 때 STL-179 를 먼저 파서 Step 0 가 독립적으로 진행 가능한 상태로 옮겨놓음. ADR 이 approved 되면 그 다음날 바로 Step 0 PR 을 올릴 수 있게 됨.
