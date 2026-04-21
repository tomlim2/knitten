---
title: "Shotloom devlog — 2026-04-20"
tags:
  - devlog
  - shotloom
  - stl-106
  - stl-99
  - pr-workflow
  - skill-review
date: 2026-04-20
source: claude
---

# Shotloom devlog — 2026-04-20

STL-106 VRM 1.x backward-root 대응 + 리뷰 피드백 반영. STL-99 viewer retirement PR 리베이스/CI fix/리뷰 응답. Claude Code 스킬 네임스페이스도 `meta-*` → `caol-*` 로 정리.

---

## Shotloom — STL-106 (PR #111)

VRM 1.x 입력에서 backward-facing 캐릭터가 180도 돌아간 채로 로드되던 문제 수정.

### 커밋

- `a4e1918` feat(gltf): normalize backward root on VRM 1.x sources
  - `normalize_vrm_bones_180y` 를 VRM 1.x 브랜치에도 적용
  - 새 진단 코드: `normalized_backward_root_180y_vrm1` (0.x 와 구분)
  - normalized cache v2 → v3 (stale 아티팩트 재생성)
  - 합성 unit test + `minjoon-1x-backward.vrm` fixture 회귀 테스트
- `b1d8191` docs(vrm): backward-root audit policy 확장
  - `review-code-rust.md` A2/G6/G5 셀프리뷰 대응
  - 잘못된 fixture 경로 주석 수정, 0.x-only 설명 제거, 두 코드의 severity 분리 가능성 명시
- `47e3e9e` feat(retarget): viewer VRM bytes → `normalize_vrm` 경유
  - `examples/viewer.rs` 가 raw bytes 를 직접 넘기던 걸 runtime 과 동일한 normalize 경로로 라우팅
  - 실패 시 raw fallback 유지 (smoke tool 성격)
  - 신규 crate 의존성 없음 (`shotloom-gltf` 이미 존재)
- `25be39f` test(gltf): vrm1 forward passthrough byte-identity + fixture 주석
  - PR #111 nit 대응: forward VRM1 passthrough 를 진단 부재가 아니라 byte-identity 로 직접 검증
  - cross-crate fixture resolver 의도 주석화
  - audit policy 문서의 "single diagnostic" → "pair of diagnostics"

### 다음

- PR #111 리뷰 대기 / 머지 후 stale 캐시 이슈 없는지 확인
- backward-root audit policy 에서 두 진단 코드 severity 정책 최종 결정

---

## Shotloom — STL-99 (PR #113) viewer retirement

`crates/shotloom-retarget/examples/viewer.rs` (1482 줄) 은퇴 PR. STL-127 이 동일한 smoke surface 를 `shotloom-engine` Spawn Debug Character flow 로 이관해서 viewer 예제가 중복이 됨.

### 작업 흐름 (시간 순)

**1. Rebase** — 로컬 브랜치를 `origin/main` 에 rebase. `Cargo.toml` conflict 발생.
- main 은 여전히 `viewer` feature 로 bevy 를 gate 하고 있었고, 내 브랜치는 bevy 를 `[dev-dependencies]` 로 이동시킨 상태.
- 일단 PR 쪽 ("theirs") 버전 채택 → `[dev-dependencies]` 경로로 resolve.

**2. Pre-PR 게이트 + 리뷰** — fmt / check / clippy / doc-paths 전부 통과.
- sub-agent 리뷰가 P1 A1 defect 1 건 포착 (review-code-rust.md 기준):
  - `docs/adr/adr-0025-retargeter-public-driver.md:24, 183` — 삭제될 `examples/viewer.rs` 언급이 산문에 남아있음.
  - doc-paths validator 는 산문 내 언급을 못 잡음 → 사람 눈(에이전트) 필요.
- 수정 커밋 추가 후 force-push.

**3. CI 빨간불 — `wayland-sys` 빌드 실패** (Ubuntu runner).
- 원인: `cargo test -p shotloom-retarget` 는 dev-deps 를 **항상** 컴파일. rebase conflict resolution 에서 bevy 를 `[dev-dependencies]` 로 옮겨서 `wayland` feature 까지 따라옴. runner 에 `libwayland-dev` 없음.
- 이전(main) 에서는 bevy 가 `[dependencies]` + `optional=true` + `viewer` feature gate 였어서 `cargo test` 가 bevy 를 컴파일하지 않음 → 문제없음.
- 내가 conflict 해결하며 구조를 바꾼 게 regression.

**4. CI fix** — bevy 를 다시 `[dependencies]` + `optional=true` + `viewer` feature 로 원복. `viewer.rs` 삭제 자체는 유지. fast-forward push.

**5. 리뷰어 (ryumiel) 라운드 3** — P3 nit 3 건 (none blocking, but cleanup-worthy):
- `adr-0025.md:31, 200` — "wire the viewer", "S4 viewer wiring" → engine 기준으로 수정 요청.
- `Cargo.toml:47` — `[features] viewer = [...]` 이름/주석이 stale (viewer 는 없어졌고 이제 `fbx_viz` 와 `vrm_spec_validate` 를 gate 함). rename 또는 history comment.
- `README.md:43` — `fbx_viz` 의 `compute_source_skeleton` 경로 설명이 혼란 유발 (실제 import 는 `shotloom_fbx_anim_importer` 경유 re-export).

**6. Review response** — `/shotloom-respond-pr 113` 스킬로 처리.
- `viewer` feature → `examples` 로 rename (option 1 채택, one-line change, 외부 소비자 없음). `required-features` 도 전부 업데이트. 주석에 STL-99 gloss 추가.
- ADR-0025 문구 2 건 교체.
- README 문구 1 건 교체 (crate path 제거).
- 3 개 thread 에 inline reply 포스트 + 전부 resolve.
- PR description 도 rename 반영 + validation 수치 업데이트 (838 paths across 126 files).

### 새 review pattern: A8 (review-code-rust.md)

이번 리뷰에서 배운 게 있어서 standards 에 새 패턴 추가:

**A8 — Symbol / feature / narrative names outlive their original referent**

기존 A1 (이름이 더 이상 resolve 안 됨) 과 A2 (경로가 깨짐) 는 `cargo check` / `grep` / `doc-paths` 로 잡힘. 하지만 A8 은:

- `[features] viewer = [...]` — `viewer` 라는 이름은 여전히 컴파일됨 (다른 걸 gate 할 뿐).
- `# Viewer-only dependencies` 주석 — 삭제된 것과 무관한 예제를 여전히 설명.
- `"wire the viewer"` ADR 문구 — 산문이라 doc-paths validator 가 못 잡음.

전부 **semantic staleness** — syntactic tool 로는 안 걸림. 삭제/rename 할 때마다 **base name (경로 X) 으로 survivor 를 grep** 하는 셀프체크를 추가함.

```bash
rg -nI --glob '!target' --glob '!node_modules' 'viewer' docs/ crates/shotloom-retarget/ README*.md
```

review-code-rust.md Provenance 에도 기록 (PR #113, 2026-04-20).

### 커밋 히스토리 (branch: `chore/retire-retarget-viewer`)

```
bfa4f67 chore(retarget): address PR #113 stale viewer references
0227215 fix(retarget): keep bevy optional to prevent CI wayland-sys failure
43fa982 docs(adr-0025): update viewer refs after STL-99 retirement
5724644 docs(retarget): drop viewer references from fixtures.json (STL-99)
1cca681 chore(retarget): retire viewer.rs example and supporting code (STL-99)
```

### 배운 것

- **Rebase conflict 해결은 "PR side 채택" 이 항상 옳지 않다.** 이번엔 PR side 가 CI 환경 제약 (dev-deps always compile, wayland-sys on ubuntu) 과 충돌. 해결 전에 "main 이 왜 그 구조였는지" 먼저 이해해야 했음.
- **산문 속 stale reference 는 validator 로 못 잡는다.** ADR/README 내 narrative 가 해당. Sub-agent 리뷰가 잡음.
- **Feature name 은 primary consumer 삭제 시 반드시 재검토.** `viewer` feature 가 이미 `fbx_viz` / `vrm_spec_validate` 를 gate 하고 있었는데 리네임 안 함 → 리뷰어가 잡음.
- **커밋 메시지 80 자 제한** — commit-msg hook 에 의해 강제됨 (`Subject is 82 characters; keep it at 80 or fewer`). 처음엔 첫 커밋 subject 가 82 자라서 한 번 리젝당함.

---

## caol-ila — 스킬 카테고리 리네임

- `meta-*` → `caol-*` (16 개 스킬). cross-ref 전체 업데이트.
- 신규 스킬: `caol-brief-today` (아침/점심/저녁 브리핑, obsidianAvailable gating 포함)
- `shotloom-open-web` 스킬 초안 (WASM + Vite 런처)
- `standards/slash-commands.md` 에 Frontmatter Reference (전체 필드 테이블) + 스킬/커맨드 precedence + 문자열 치환 + dynamic shell 주입 섹션 추가
- `caol-make-skill` reference.md 분리

---

## 메모

- **Obsidian 미등록 머신** 이라 devlog 는 `caol-ila/claude/temp-learnings/` 에 저장 후 push. 나중에 vault 있는 머신에서 `claude/projects/shotloom/` 로 이관.
