---
title: "04-14 (오후): STL-74 리뷰 대응 revision + 스킬/룰 정비"
tags: [devlog, shotloom, shotloom-retarget, stl-74, pr-workflow, lfs, bevy]
date: 2026-04-14
---

# 04-14 (오후): STL-74 리뷰 대응 revision + 스킬/룰 정비

## 왜 이 작업을 했나

오전에 올린 STL-74 draft PR #66(Layer 0–4 retargeter 코드 포팅)에 리뷰어 `ryumiel`이 `CHANGES_REQUESTED`로 5건 피드백을 남김. 동시에 Linux CI `Rust Tests`가 실패 — alsa-sys 빌드 에러. 여기에 대응하면서 "앞으로는 이런 피드백 안 받게" 하는 룰과 스킬까지 같이 정비.

---

## 무엇을 했나

### PR #66 리뷰 피드백 5건

1. **CI Rust Tests FAILURE** (Linux, alsa-sys) — bevy 0.18의 `ui` feature bundle이 `audio → bevy_audio → vorbis → alsa-sys`를 transitively 활성화. GHA ubuntu runner에 `libasound2-dev`가 없어서 터짐.
2. **PR title/description guideline 미준수** — `docs/guidelines/pr-guideline.md` 기준 재작성 필요.
3. **shotloom-retarget에 unit test 없음.**
4. **`fixtures.example.json` 인라인 코멘트:** 절대경로 JSON 말고 LFS 자산 체크인해서 누구나 clone하면 열수있게.
5. **Code Gate FAILURE** — Rust Tests 실패 전파.

### Sub-agent로 shotloom 규약 감사 (이 단계가 결정적이었음)

리뷰어 5건만 대응하는 게 아니라 sub-agent 하나 풀어서 `CONTRIBUTING.md` / `pr-guideline.md` / `commit-guideline.md` / `code-review-guideline.md` / `review-rust.md`를 전체 재독하게 시킴. 결과: **리뷰어가 명시 안 했지만 내가 어긴 규약 9건 추가 발견**. 재검토 들어가면 CHANGES_REQUESTED 한 바퀴 더 돌 위험 항목들.

| 항목 | 근거 |
|---|---|
| MAP.md에 새 크레이트 엔트리 없음 | CONTRIBUTING.md L163 |
| `crates/shotloom-retarget/README.md` 없음 | CONTRIBUTING.md L167 |
| 새 dep(bevy) justification 누락 | review-rust.md L122–125 |
| `#![allow(dead_code)]` 주석 없음 (14파일) | review-rust.md L12–14 |
| `unwrap()` 비-테스트 코드 P0 (3사이트) | review-rust.md L23 |
| PR title `(STL-74)` 접미사 | pr-guideline.md L19 |
| PR body `## Test plan` → `## Testing`이 실제 컨벤션 | pr-guideline.md expanded template |
| "code-review-guideline.md P0/P1 전부 pre-PR 게이트로 취급" | code-review-guideline.md L41 |

### Revision 작업 (5 신규 커밋)

1. `5a4be34` — **fix:** bevy dev-dep features 좁힘 (`ui` 제거, `3d_bevy_render + scene + default_app + default_platform`만). `cargo metadata --filter-platform x86_64-unknown-linux-gnu`로 audio features 전무 확인.
2. `9538e4b` — **chore:** MAP.md 엔트리 + `crates/shotloom-retarget/README.md` + `#![allow(dead_code)]` 14파일 justification block (sub-agent 병렬 편집) + `get(_).unwrap()` 3곳 `[idx]`로 교체.
3. `8bcce62` — **test:** 65 unit tests 추가 (3 sub-agent 병렬). source_data 10, topo 5, vrm_compat 7, config 16, finger_axis_map 14, types 9, vrm_rest 4. `cargo test --workspace` 그린.
4. `cdb1d4b` — **feat:** `fixtures/` 디렉토리 + 자산 7개 LFS 체크인 (VRM 4 + FBX 3, 총 ~57MB, 1개는 기존 ghostpumpking과 SHA256 중복으로 LFS 자동 dedup). `.gitattributes`에 `*.fbx` 추가. `viewer.rs`를 `CARGO_MANIFEST_DIR` 기준 resolve로 바꿔서 cwd 무관하게 `cargo run -p shotloom-retarget --example viewer -- 1`로 즉시 실행 가능.
5. `gh pr edit 66 --title --body-file` — title에서 `(STL-74)` 제거, body를 shotloom expanded template 섹션 구조로 재작성 (Summary / Why / Changes / New dependencies / Impact / Scope boundary / Testing / Breaking Changes / Related Issues).

### 스킬 1개 + 룰 2개 생성 (caol-ila main)

**Skill — `shotloom-make-pr`** (`~/.claude/skills/shotloom-make-pr/SKILL.md`)

"shotloom PR 올리는 전체 플로우"를 재사용 가능하게:
- sanity check (branch, gh account=tomlim2, commit identity=tomlim2<deemo@vonvon.me>)
- 매 세션 `pr-guideline.md` 재독
- 로컬 CI-equivalent 게이트 5종 (fmt, clippy, check, **test**, doc validator)
- 최근 merged PR 3–5개 샘플링해서 톤 맞춤
- draft 작성 → **유저 승인 대기** → `gh pr create`
- supersedes 코멘트 자동 (인자로 prior PR 번호 받음)
- Common failures + fixes 테이블 (alsa-sys, let-chain, is_none_or 등)

**Rule — `testing.md`**

- 새 모듈/함수/public API는 **같은 PR에 유닛 테스트 필수**
- `cargo test --workspace`는 **PR 블로커** (push 전 반드시 통과)
- 최소 coverage surface 정의 (happy+edge, invariant, regression for bug fix, serde round-trip)
- 예외 3가지(scaffold, smoke example, verbatim port w/ follow-up test commit in same PR)
- 리뷰어가 "테스트 추가하세요" 요청했다 = 룰 위반, 리뷰 피드백 X

**Rule — `conventions.md`**

- **세션 시작 시 매번** 대상 레포의 CONTRIBUTING/AGENTS/docs/guidelines/docs/adr 재독
- "어제 읽었다"는 무효 — guideline drift 때문
- PR 열기 전 sub-agent로 convention audit 돌리기 (MAP.md, breadcrumb README, ADR index, allow-comment, dep justification, test coverage)
- **리뷰 시에도** 매번 `code-review-guideline.md` + `review-<lang>.md` + `pr-guideline.md` 재독. 리뷰 세션도 예외 없음.
- 레포-specific rule 파일(`shotloom-git.md`)이 generic rule 대비 우선

---

## 배운 점

- **Linux CI에서 alsa 깨지는 건 shotloom만의 문제가 아님** — bevy 0.18 feature graph의 ADT가 `ui` bundle 안에 audio를 넣어놔서, `ui` 쓰는 순간 자동으로 끌려옴. 이걸 피하려면 `default-features = false` + 서브피처 직접 나열. 특히 `default_platform + 3d_bevy_render + scene` 조합이 audio-free 기본 셋.
- **cargo tree는 on-platform 기반 — 실제 feature 확인은 `cargo metadata --filter-platform ...`로.** 처음엔 cargo tree로 봤다가 feature 확인 안 돼서 metadata JSON에서 직접 resolved feature 집합 확인.
- **리뷰어 1건 피드백 = 진짜 빚 1건이 아니라 관련 빚 5~9건**. 리뷰어는 surface만 찌르고 지나가니까, sub-agent로 전체 규약 감사 돌려서 묵시적 빚 전부 털어내는 게 두 번째 CHANGES_REQUESTED 막는 유일한 방법.
- **LFS 체크인은 GitLab LFS 써본 사람한테 낯선 게 아님 — 같은 protocol이고 서버만 다름.** 유저가 "이거 똑같은거냐"고 물었을 때 바로 "똑같다"가 답. 차이는 오직 스토리지·대역폭 비용 위치 (GitHub는 조직 과금, GitLab self-hosted는 디스크).
- **`env!("CARGO_MANIFEST_DIR")`는 bevy example/test를 cwd-invariant하게 만드는 표준 패턴.** `AssetPlugin::file_path`를 런타임에 세팅할 수 있으니까 절대경로 자산 로딩도 asset root 이동으로 해결됨.
- **`get(idx).unwrap()`은 `[idx]`와 동일하게 panic하지만 clippy 기준으론 후자가 idiomatic.** review-rust.md P0 pass.

---

## 다음 스텝

### 1. CI 결과 확인 (currently pending)

`cdb1d4b` 푸시 직후 GHA re-run 중. `Rust Tests`가 이번에 그린 나오면 alsa fix 검증 완료. 결과 확인 후:
- 녹색 → 리뷰어에게 재검토 요청 코멘트 남기기
- 빨강 → 원인 파악 후 재수정

### 2. **FBX 임포터 포팅** (다음 태스크)

현재 shotloom은 FBX 파서가 없어서 viewer가 "VRM만 로드, 애니메이션은 T-pose"에서 멈춰있음. bevy-vrm의 `crates/fbx_rig/` (1188 LOC 단일 파일, 자체 바이너리 FBX 리더)를 포팅하면 retargeter가 실제로 "돌아가는" 걸 시각적으로 증명 가능.

**결정 필요 사항:**
- **포팅 위치:** 기존 `shotloom-import` (지금은 VRM 정규화 전용) vs 신규 크레이트 `shotloom-fbx` vs `shotloom-gltf` 확장
- **범위:** 전체 1188 LOC? 또는 bevy-vrm에서 실제 사용되는 public API만 (read_from_bytes, `FbxAsset` 구성)?
- **테스트 자산:** 지금 LFS에 들어간 3개 FBX를 fixture로 그대로 재사용 가능
- **ADR:** 파일 포맷 파서 크레이트 소유권에 대한 ADR 하나 필요할 수도 (ADR-0023 §3 확장 / 수정)

**블로커:** STL-74 PR #66가 먼저 머지돼야 안전하게 feat branch 딸 수 있음 (방금 저장한 sequential-PR dependency 룰대로). 74 리뷰 끝날 때까지는 설계 준비만(의존 그래프 스케치, fbx_rig 재독, API 축소 후보 정리), 코드 작성 금지.

### 3. STL-75 (품질 평가) — STL-74 머지 + FBX 임포터 후

- `quality/{detector, fk_evaluate, rubric_a/b/c, score, projection}` 포팅
- `orchestrate.rs` + public `evaluate_pipeline` entry
- Grade 시스템 (A/B/C/F, rubric 가중치, LLM gate 연동)
- Integration tests over 실제 리타게팅 파이프라인

---

#devlog #shotloom #stl-74 #pr-workflow #lfs #bevy #ci
