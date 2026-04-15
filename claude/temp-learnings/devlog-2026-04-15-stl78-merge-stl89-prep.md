---
title: "04-15 (밤): STL-78 머지까지 + STL-89 prep — git-log-first, GitHub reply re-root, codex tail hang"
tags: [devlog, shotloom, stl-78, stl-89, pr-review, github-api, codex-cli]
date: 2026-04-15
---

# 04-15 (밤): STL-78 머지까지 + STL-89 prep

## 1. 세션 목표

1. STL-78 PR #72 에 달린 Copilot 코멘트 대응하고 머지까지
2. STL-89 (`retarget_arp_to_vrm` + viewer wiring) prep — 브랜치 + ADR 초안까지

둘 다 완료.

---

## 2. 오늘 얻은 교훈 3개 (재발 방지용)

### 2.1 세션 시작할 때 `git log` 먼저 읽어라

PR #72 에 달린 Copilot 인라인 코멘트 8개를 보고 "이거 다 고쳐야지" 하고 바로 codex subagent 에 P1 3개 dispatch 했는데, 나중에 `git log` 봤더니 **브랜치에 이미 commit `3f3650f` 가 있었음** — 제목이 "fix(fbx-anim-importer): address copilot review on #72 — range guard, cache invariant, naming". 즉 Copilot 코멘트 중 5개는 이미 2커밋 전에 push 로 해결된 상태였고, 내가 시킨 codex는 중복 작업을 돌린 셈.

- 원인: 세션 시작할 때 `git status` 만 보고 clean 인 것만 확인했음. `git log -10` 안 봤음.
- 결과: codex/subagent 이 이미 고친 곳을 또 고치는 바람에 VRM should_write 스코프 창크리프까지 발생. uncommitted diff 를 전부 revert 하고 진짜 필요한 2-file change (partial_cmp 주석) 만 커밋해야 했음.
- 재발 방지: **PR 리뷰 대응 세션 시작할 때 `git log --oneline -10` + 최신 커밋 메시지 전문 확인.** 특히 "address review / address copilot / address feedback" 같은 메시지가 최근에 있으면 Copilot 의 코멘트가 이미 outdated 일 가능성을 의심.

### 2.2 Copilot 리뷰는 "라운드" 개념으로 읽어야 한다

Copilot 은 PR 에 커밋이 추가되면 **새 리뷰 라운드** 를 돌린다. 즉 `gh api /pulls/{id}/comments` 로 가져오면 모든 라운드의 인라인 코멘트가 **평면적으로 섞여서** 반환됨.

- 1라운드: 커밋 `3f3650f` 전 코드에 달린 5개. `line: null`, `position: 1` 로 내려옴 (해당 라인이 현재 diff 에 없음 → GitHub UI 는 "Outdated" 로 접음).
- 2라운드: `3f3650f` 이후 돌린 새 리뷰 에서 달린 3개 (진짜 active).

내가 처음에 이걸 구분 안 하고 "코멘트 8개" 로 취급해서 답글 8개 초안 다 뽑았다가, user 가 "근데 그거 3개 아님?" 지적해서 뒤늦게 깨달음.

- 재발 방지: `gh api /pulls/{id}/reviews` 로 리뷰 단위 먼저 보고, 리뷰별 코멘트는 `/pulls/{id}/reviews/{review-id}/comments` 로 가져오자. `line: null` 은 outdated 신호로 해석.

### 2.3 GitHub review reply API 는 `in_reply_to_id` 를 re-root 한다

3 개 Copilot 코멘트 + 3 개 ryumiel follow-up 코멘트 (같은 file:line) 가 한 스레드에 공존하는 상태였음. ryumiel 코멘트에 답글을 달려고 `POST /pulls/72/comments/{ryumiel-id}/replies` 호출했는데, 반환된 객체의 `in_reply_to_id` 가 **Copilot 의 코멘트 ID** 로 나왔다. 즉 GitHub 는 같은 file:line 스레드의 최초 코멘트 (= 스레드 루트 = Copilot 꺼) 에 자동으로 re-root 함.

- UI 로는 "tomlim2 replied to Copilot" 으로만 보임. ryumiel 코멘트에 직접 답한 것처럼 안 보임.
- 결국 중복 답글 3개 (`DELETE /pulls/comments/{id}`) 로 제거하고, 첫 라운드 답글 (Copilot 에게 단 것) 에 ryumiel 포인트를 묵시적으로 포함시키는 걸로 해결.
- 재발 방지: **한 file:line 에 여러 리뷰어 코멘트가 섞여 있으면, 각자에게 따로 답글 달아도 전부 같은 루트에 붙는다.** 각자에게 명시적으로 답하고 싶으면 top-level PR comment 로 가거나, 답글 본문에서 "@ryumiel re:" 로 명시적으로 가리키거나, 애초에 각 리뷰어가 별도 스레드를 연 경우에만 가능.

---

## 3. 부수 교훈 — codex CLI tail 파이프 hang

P2/P3 배치를 `codex exec ... | tail -200` 백그라운드로 dispatch 했다가 **8 분째 0 바이트 출력 + 프로세스 부재** 상태로 멈춤. harness 는 "running" 이라고 우김.

원인 추정: `tail -200` 파이프가 codex 종료까지 버퍼링하는데, 중간에 codex 가 조용히 죽거나 stdin/tty 관련 문제로 flush 안 함.

해결: kill + 파일 리다이렉트 (`> /tmp/codex-p2p3.log 2>&1`) 로 재시작 — 그런데 user 가 "그냥 Agent tool 로 해" 해서 Sonnet subagent 로 교체. 결과적으로 subagent 가 훨씬 안정적이고 결과도 깔끔. **기계적 멀티파일 작업은 subagent (Sonnet) 이 codex CLI 백그라운드보다 reliable.**

---

## 4. STL-89 prep 결과

- 브랜치 `feat/arp-vrm-wiring` (from `main@943f1da`)
- Commits:
  - `52c13bc` docs(adr): propose ADR-0025 retargeter public driver (`evaluate_pipeline`)
  - `0fa0441` docs(adr): rename ADR-0025 entry point from `evaluate_pipeline` to `retarget_arp_to_vrm`
- 핵심 결정: 공개 엔트리 이름을 ADR-0023 §9 placeholder `evaluate_pipeline` 에서 **`retarget_arp_to_vrm`** 로 대체. 이유 — `evaluate_pipeline` 은 도메인/방향 둘 다 안 드러나고 generic plumbing 처럼 읽힘. `retarget_arp_to_vrm` 은 verb-first Rust 관용 + source rig 족(ARP) + target format(VRM) 명시 + 타입/모듈 이름과 혼동 불가.
- Contract (draft):
  ```rust
  pub fn retarget_arp_to_vrm(
      source: &SourceAsset,
      vrm_rest: &VrmRestPose,
      options: RetargeterOptions,
  ) -> (TargetAnimation, Vec<Diagnostic>);
  ```
- Minimal promotion surface: `RetargeterOptions`, `vrm_rest::build_from_bevy_vrm` (new), 이미 공개인 domain types. 나머지는 `pub(crate)` 유지.
- Open questions (ADR 안에 명시):
  - `VrmRestPose` constructor 최종 이름 (`build_from_bevy_vrm` vs `from_loaded_vrm` vs `extract_rest_pose`)
  - `RetargeterOptions` 에 `#[non_exhaustive]` 붙일지
  - `init_log` 을 diagnostic 으로 흡수할지 따로 반환할지

---

## 5. 내일 재개 위치

- **S2:** `retarget_arp_to_vrm` 실제 구현 + 최소 `pub(crate)` → `pub` 승격 + 단위 테스트
- **S3:** `vrm_rest::build_from_bevy_vrm` — `bevy_vrm1::Loaded` humanoid 컴포넌트 surface 조사 먼저 (자체 매핑 테이블 금지)
- **S4/S5:** `examples/viewer.rs` 배선 + male/female preset T-pose 탈출 확인
- **S6:** full gates + 22-pattern self-review (`/shotloom-review-before-pr`) + PR (`/shotloom-make-pr`)

---

## 6. 주말 TODO — 셀프 코드리뷰 blind spot 역추적

**질문:** 오늘 PR #72 에서 Copilot/ryumiel 이 잡은 지적사항을, 왜 내가 여러 번 돌린 셀프 코드리뷰에서는 못 걸러냈는가?

**조사 대상 (오늘 외부 리뷰가 처음 잡아낸 것들):**

1. `RotationOrder` i32 → u8 silent cast, downstream `euler_to_quat` XYZ fallback (Group C silent fallback)
2. `should_write` byte-compare 가 SHA-256 콘텐츠 어드레서블 캐시에서 중복 I/O (성능 + 디자인)
3. Windows `fs::rename` overwrite-failure 경로 (플랫폼 특이사항)
4. `write_artifact_atomically` 의 `!exists()` vs `rename` race (동시성)
5. `NORMALIZED_FBX_CACHE_VERSION` naming — 실제로는 normalization 단계 없음 (네이밍 ↔ 구현 mismatch)
6. `~12 MB` per-bone 추정 주석이 실제 `Quat+Vec3` ≈ 28 B/frame 대비 ~4x 과장 (산수 검증 누락)
7. `partial_cmp().unwrap()` panic 을 이유로 든 주석이 실제 `f32::total_cmp` 코드와 불일치 (doc↔code drift)
8. `assert_parse_err_contains` non-exhaustive match 가 미래 variant 추가 시 컴파일 에러 far-from-site (defensive test 설계)

**가설 (검증 필요):**

- **H1 — Pattern coverage gap:** 현재 `review-code-rust.md` 22-pattern 이 Group A (doc↔code), B (classifier asymmetry), C (silent fallback), D (library hygiene), E (build/platform), F (cross-crate) 로 나뉘어 있는데, **"수치/단위 검증" (#6) + "플랫폼 특이 IO" (#3) + "동시성 race" (#4) 는 어느 Group 에도 명시적으로 없음.** 체크리스트가 산수/플랫폼/동시성 축을 커버 안 하면 반복적으로 놓친다.
- **H2 — Diff-local reading bias:** 셀프 리뷰를 할 때 나는 `git diff` 단위로 파일 별로 읽는다. 그런데 #4 race, #3 Windows, #2 redundant I/O 는 **파일 단위가 아니라 호출 체인 전체** (`import_fbx_to_cache` → `should_write` → `write_artifact_atomically` → `fs::rename`) 를 머릿속에 그려야 잡힌다. 셀프 리뷰 시점에 "이 변경이 전체 I/O path 어디에 걸리는지" 를 명시적으로 스케치 안 했다.
- **H3 — 주석을 코드처럼 안 읽음:** #5 네이밍 드리프트, #6 12 MB 과장, #7 `partial_cmp` stale 주석 — 모두 **주석 자체의 사실 주장**이 틀린 케이스. 내가 셀프 리뷰할 때 주석은 "설명이니까 맞겠지" 로 넘기고 산수/패턴 일치 검증을 안 했다. Group A (doc↔code) 가 명시돼 있음에도 적용이 느슨했다.
- **H4 — Test 가 코드와 동시에 움직일 때 두 쪽 다 테스트 대상이 됨:** #8 은 "테스트를 테스트 하는" 메타 층. 내가 테스트를 작성하면서 미래 확장성까지 체크 안 했다. 테스트는 한 번 쓰고 잊는 대상이 아닌데.
- **H5 — Self-review repetition fatigue:** 3회 self-review 중 2-3회차에 "지난번에 봤으니 괜찮겠지" 로 커버리지가 줄어든 가능성. 매 회차에 동일한 pattern pass 를 돌렸는지, 아니면 회차마다 다른 각도만 봤는지 기록이 없음.

**조사 방법 (주말):**

1. `review-code-rust.md` 22 pattern 을 위 8 건과 매핑 — 각 defect 가 어느 pattern 으로 잡혔어야 했는지 표로 작성. Pattern coverage 구멍이 보이면 pattern 18-22 추가.
2. 셀프 리뷰 체크리스트에 **"산수/플랫폼/동시성/주석-사실"** 4 개 축을 명시적 bullet 으로 추가 (H1, H2 커버).
3. `/shotloom-review-before-pr` 스킬에 **"주석의 사실 주장을 코드와 대조" step** 추가 (H3 커버). 예: `grep -n "MB\|MiB\|ms\|panic\|unwrap" $DIFF_FILES` 같은 보조 grep 한 줄.
4. 회차별 self-review 기록 템플릿 — 매 회차에 어느 pattern 을 돌렸는지 명시적으로 체크 (H5 커버).
5. 결과를 `devlog-2026-04-18-self-review-blindspot.md` (토요일자) 로 기록하고, pattern 확장이 있으면 `standards/review-code-rust.md` 에 반영.

**우선순위:** H1 + H3 부터. 산수 + 주석-사실 불일치는 오늘 가장 많이 놓친 축이고 grep 수준 자동화로도 부분적으로 잡을 수 있음.

---

## 7. 주말 문서 정리 대상

이번 주 만들어둔 문서들 구조 리뷰 + 중복/이관 정리.

### 7.1 이중 관리 구조: `order/` vs `.agent/`

- `shotloom/.agent/handoff-stl-89.md` — repo-scoped 운영 메모리 (shotloom 체크아웃에 딸려옴)
- `~/.codex/order/stl-89-retarget-arp-to-vrm-wiring.md` — codex CLI 주문 큐
- 둘은 같은 내용 복사본. 오늘 만들 때 "source of truth = shotloom/.agent, 복사본 = ~/.codex/order" 로 결정했는데 원칙이 제대로 지켜질지 검증 필요.
- 주말 검토 항목:
  - 원칙 문서화: 어느 쪽이 canonical 인지 `~/.codex/order/README.md` 와 shotloom 의 `.agent/README.md` 둘 다에 교차 명시.
  - 복사본 드리프트 방지 방법 — symlink vs 수동 sync vs 복사만 허용. symlink 는 shotloom 체크아웃 상태 의존이라 위험. 수동 sync 가 현실적일 듯.
  - 완료된 order 는 어디로 — `~/.codex/order/archive/` 이관 vs Linear 완료 표시로 충분.

### 7.2 `.agent/` 폴더 구조 (shotloom)

- 오늘 `.agent/handoff-stl-89.md` 하나만 넣었는데, `~/.claude/standards/shotloom.md` 의 `.agent/` 섹션은 `README.md` + `working-rules.md` + `project-guide.md` + `checklists.md` 를 권장한다.
- 아직 `README.md` 조차 없어서 다음 agent 가 `.agent/` 폴더를 처음 열면 handoff 파일 하나만 보이는 상태. 주말에:
  - `.agent/README.md` — index (handoff 파일들 + 향후 working-rules 등 설명)
  - 필요 시 `.agent/working-rules.md` — shotloom 에서 agent 가 지켜야 하는 반복적 운영 rule (`rules/shotloom-git.md` 와 중복 안 되게 주의)

### 7.3 `~/.codex/order/` 디렉토리 구조

- 지금: `order/README.md` + `order/stl-89-*.md` 만 존재.
- 검토:
  - `order/archive/` 하위 도입 여부
  - order 파일 이름 규칙 (`<issue-id>-<slug>.md`) 확정 — 현재는 README 에 한 줄로만 있음
  - `order/` 외에 `prompts/`, `skills/` 같은 기존 폴더와 역할 분리 재검토. 특히 "반복적으로 쓰는 지시 템플릿" 과 "일회성 작업 주문" 이 섞이면 안 됨.

### 7.4 devlog → Obsidian 아카이빙

- 오늘자 `devlog-2026-04-15-stl78-merge-stl89-prep.md` 는 `caol-ila/claude/temp-learnings/` 에 있음 (평일 용).
- 주말에 이 devlog + 4/14 devlog 들을 Obsidian vault `claude/` 하위로 이관하고, `temp-learnings/` 는 비우는 게 `maximize-codex-sonnet` / `weekday-temp-storage` 메모리 규칙에 맞음.
- 메모리에 기록된 규칙: *"평일 devlog/learning은 caol-ila temp-learnings로, 주말에 Obsidian 아카이빙"*

**우선순위:** 7.1 (이중 관리 원칙) 이 제일 시급. 지금 분산돼 있어서 다음 세션에 찾을 때 헷갈릴 위험이 있음.
