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
