---
title: "Shotloom devlog — 2026-04-24"
tags:
  - devlog
  - shotloom
  - crate-rename
  - fbx-anim
  - adr-0024
  - review-checklist
date: 2026-04-24
source: claude
---

# Shotloom devlog — 2026-04-24

---

## STL-172 — chore(fbx-anim): rename shotloom-fbx-anim-importer crate to shotloom-fbx-anim

Shotloom의 import 파이프라인은 워크스페이스에 크레이트 경계가 3층으로 누워 있다 — Layer 1(바이트 파싱, WASM-capable), Layer 2(CAS 캐시 + diagnostics + source reference, native-only), Layer 3(retargeter 소비). 문제는 이 계층 이름 규약이 VRM 쪽은 format-keyed (`shotloom-gltf`)인데 FBX 쪽만 role suffix가 붙어 있어서 (`shotloom-fbx-anim-importer`), 같은 워크스페이스에 "importer" 이름이 둘 존재했다는 것 — 진짜 importer인 `shotloom-import`와 Layer 1 파서가 이름을 공유. 이번 PR은 Layer 1을 `shotloom-fbx-anim`으로 rename해서 VRM 쪽과 대칭을 맞추고, 향후 `shotloom-fbx-model` 같은 mesh/scene 전용 크레이트 추가 시 재rename 없이 `-anim` qualifier로 구분되도록 보험을 추가한다. 내부 구조/contract/캐시 layout은 전혀 안 바뀜 — 순수 네이밍 정리. [PR #163](https://github.com/CINEV/shotloom/pull/163), Linear STL-172.

### Why

이 rename의 trigger는 후속 ADR-0030/0031 작업(normalizer 추출, SourceAsset 재배치)을 앞두고 크레이트 경계 이름이 실제 역할과 맞지 않으면 이후 리팩터링에서 "진짜 importer가 누구냐"가 매번 리뷰 라운드트립이 되는 비용. `shotloom-import`는 CAS 캐시/diagnostics/source ref를 소유하는 Layer 2 오케스트레이션 — 진짜 importer. Layer 1은 fbxcel 래퍼로 FBX 바이트를 `SourceAsset`으로 변환할 뿐이라 parser에 더 가깝다. 이름 먼저 정리하고 후속 구조 변경을 해야 다음 ADR에서 혼란이 없다.

### How

- 디렉토리: `git mv crates/shotloom-fbx-anim-importer crates/shotloom-fbx-anim`.
- Cargo manifest 체인: 해당 크레이트 `Cargo.toml`의 `name`, 워크스페이스 root `Cargo.toml` `members`, dependent 3개 크레이트(`shotloom-import`, `shotloom-retarget` dev-dep, `shotloom-engine`)의 dependency.
- 모든 `use shotloom_fbx_anim_importer::…` → `use shotloom_fbx_anim::…` (production, tests, `fbx_viz` example). `Cargo.lock` 재생성.
- CI: `.github/workflows/code.yml`의 `cargo test -p` 패키지 리스트.
- Docs: `MAP.md`, `shotloom-retarget/README.md`, `docs/guidelines/error-handling.md`, 3개 `docs/tech-debt/` 파일, ADR-0024 본문 전체. ADR 파일명은 immutable 규약 유지 + 말미에 History 섹션 추가.
- 크레이트 self-description(package `description`, README lede, `lib.rs` `//!` 헤더) 3군데 "FBX animation importer" → "FBX animation parser" — **첫 커밋에서 놓쳤다가 사용자 지적으로 2nd 커밋에서 수정** (`db06a27`).

### What

- 2 커밋: `7325cd9` (bulk rename, 40 files), `db06a27` (self-description alignment, 3 files).
- 총 변경: 28 tracked files + `Cargo.lock`. 코드 60줄 삽입 / 47줄 삭제.
- Gates: `cargo fmt --check` / `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings` / `cargo check --workspace --exclude shotloom-desktop` / `cargo test --workspace --exclude shotloom-desktop` (0 failures) / `node scripts/validate-doc-paths.mjs` (874/874 paths) 모두 clean.
- `/shotloom-review-before-pr` — 22 패턴 모두 clean.

### 사이드 노트

- **Worktree cwd가 main repo로 튕겨나가는 이슈.** `/shotloom-review-before-pr`를 처음 돌릴 때 Bash 세션의 cwd가 worktree → main repo(`main` 브랜치)로 조용히 되돌아간 상태에서 sweep을 돌렸다. 결과적으로 rename 전 main 브랜치를 리뷰하면서 "all 22 patterns clean"이라고 잘못 보고. 사용자가 "테스터 쪽도 한번 더 볼래요?"라고 한 덕분에 발견 → `pwd`를 찍어 깨달음. **재발 방지로 `shotloom-review-before-pr` SKILL.md Step 1에 cwd/pwd 검증 + `HEAD == main`이면 abort 규칙 추가.**
- **Category-changing rename은 token sweep으로 부족.** 이름을 importer → parser로 바꾼 rationale이 있으면, drift surface는 하이픈 토큰(`shotloom-fbx-anim-importer`)이 아니라 영어 단어("importer") 자체. 첫 커밋에서 token만 grep해서 3군데(`Cargo.toml` description, README lede, `lib.rs` `//!`) 놓쳤다. **`~/.claude/standards/review-code-rust.md`에 신규 패턴 A8 추가** — category-changing rename이면 old role-noun을 `rg -w`로 각 touched crate의 `Cargo.toml`/`README.md`/`src/lib.rs`/`src/mod.rs`에서 전수 스윕. 실제 defect로 STL-172 이름까지 박아둠.
- ADR 파일명 immutable 규약은 shotloom-github 전반 convention. rename으로 content가 바뀌어도 filename은 그대로, 본문 말미 `## History` 섹션으로 기록. MAP.md 등의 relative link는 그대로 유지되므로 doc-paths validator도 clean.
- Acceptance criterion "`rg` empty result"는 deliberately 3건 유지 — ADR History(2) + README rename 노트(1). Rename을 설명하는 것과 모든 언급을 지우는 것은 양립 불가. PR 본문 "Deviation from strict acceptance"에 명시.

### 후속

- **ADR-0030 / STL-183**: normalizer 크레이트 추출, `SourceAsset`을 `shotloom-retarget` 밖으로 재배치. 이번 rename이 해당 리팩터링의 선결 정리.
- shotloom-import가 "진짜 importer"라는 인식이 이제 이름으로도 정당화되므로, Layer 2 쪽 에러 타이핑/캐시 정책 논의(STL-94, STL-95 family)에 쓸 용어가 깔끔해짐.
