---
title: "Shotloom devlog — 2026-04-21"
tags:
  - devlog
  - shotloom
  - workflow
  - skills
date: 2026-04-21
source: claude
---

# Shotloom devlog — 2026-04-21

스튜디오팀에 합류한 지 약 일주일. 그동안 PR 리뷰 응답, Linear 관리, 워크트리 운영, 컨벤션 재확인 같은 반복 작업을 손으로 하면서 실수한 포인트들을 모아서 Shotloom 전용 워크플로우 스킬 세트로 정비했다. 이번 세션은 그 정비 내역.

---

## 이번 주에 느낀 통증 포인트

- **컨벤션이 세션마다 휘발된다.** `CONTRIBUTING.md`, `docs/guidelines/*`, ADR 인덱스를 안 읽고 시작하면 PR에서 CHANGES_REQUESTED 가 바로 찍힌다. 재독을 강제할 장치가 필요.
- **PR 리뷰 응답이 수작업이다.** CI 실패 / 리뷰 코멘트 / 스코프 초과 판단이 매번 감으로 돌아감. in-scope 는 기계적으로 고칠 수 있는데 매번 같은 패턴을 반복.
- **Linear 상태가 현실과 어긋난다.** 코드는 PR 까지 갔는데 Linear 는 아직 Todo. 머지됐는데 Done 안 됨. In Progress 인데 워크트리 없음. 수동 전환이 밀리면 수명이 다 됨.
- **STL 번호가 낭비된다.** 만들었다가 안 쓴 이슈가 여럿 쌓이는데 새로 작업 시작할 때 재활용 생각 없이 새 번호 받음.
- **워크트리 운영을 안 하고 main 에서 바로 건드리는 사고.** 머지 후 워크트리/브랜치 정리도 손으로 해야 함.
- **두 에이전트 (Claude + Codex 돌쇠) 협업 시 핸드오프 문서가 없다.** 서로 뭐 하는지 모르는 상태로 같은 레포 건드림.

---

## 만든 것 — 카테고리별

### 세션 진입 & 컨벤션 재독

- `standards/shotloom-programming.md` — 레포 내 `AGENTS.md` / `CONTRIBUTING.md` / `docs/guidelines/*` / ADR 에서 68+ 개 규칙 추출. **Rust 에러 핸들링, 패닉 정책, ECS 패턴, WASM 호환성, TS 타입 디시플린, 크레이트 경계, determinism, perf 예산, 문서 co-location, 커밋/PR 규칙**. mirror 문서이므로 in-repo 원본과 충돌 시 원본 우선.
- `rules/shotloom.md` — 허브. 작업 카테고리별로 어느 문서 읽을지 라우팅 (쓸 때 → programming, 리뷰 → review-code-rust, PR → shotloom-git, 맥락 → standards/shotloom).
- `skills/shotloom-start-code/` — 코드 작성 전 mandatory pre-write gate. Linear fetch → 워크트리 생성 → 컨벤션 재독 → 카테고리 판별 → 타겟 섹션 로드 → Ready 브리핑. Linear 상태 Todo/Backlog → In Progress 자동 전환까지.

### 훅 (settings.json)

- `SessionStart` — shotloom 경로 진입 시 워크트리/PR 간단 브리핑.
- `UserPromptSubmit` — `STL-NN` / Linear URL / "리니어 작업 시작" 류 감지 시 system reminder 주입 → `/shotloom-start-code` 자동 호출 강제.
- `Stop` — dirty 워크트리 있는 상태로 세션 종료 시 경고.
- (`PreToolUse` edit-guard 는 초기에 넣었다가 너무 빡빡해서 뺌. 컨벤션으로만 유지.)

### PR 자동 응답

- `skills/shotloom-auto-pr/` — **전자동 PR 감시/응답 루프**. 3분 폴링 (ScheduleWakeup). in-scope 감지 시 자동 수정 + 커밋 + 푸시 + 인라인 답글 + 스레드 resolve. 이 스킬 한정으로 `rules/git.md` 의 per-comment 승인 게이트 면제 (memory 에 기록).
- `standards/shotloom-pr-scope-policy.md` — **in-scope / out-of-scope / ambiguous 3분류**. in-scope = diff 내부 + ≤5줄 / 기계적 실패. out-of-scope = 연기 문구 / diff 밖 + 30줄 이상 → 답글 안 달고 브리핑에 draft Linear 이슈만. ambiguous 9-10/10 = 답글 없음 + 스킵 + 브리핑. 8/10 이하는 해석 하나 골라서 진행 (정지 안 함).
- **PR 닫힘 일지** — MERGED/CLOSED 시 `~/.claude/private/ops/shotloom-pr-journal.md` 에 누적 append. auto-pr 사이클 통계 + 새 리뷰 패턴 감지 내역 포함.
- **워크트리 자동 정리** — MERGED 시점에 `git worktree remove` + `git branch -d` + Linear Done 전환. 셋 다 같은 타이밍.

### 코딩 사이클 헬퍼

- `skills/shotloom-check-gates/` — `cargo fmt/clippy/check/test` + `node validate-doc-paths` + `pnpm lint:md/mermaid` 병렬. `--fast` 기본, `--full` 은 test 포함.
- `skills/shotloom-commit/` — 게이트 자동 실행 → 컨벤셔널 커밋 메시지 드래프트 → 사용자 승인 → 커밋. `commit-guideline.md` 준수.
- `skills/shotloom-status/` — 활성 작업 대시보드 (워크트리 + 열린 PR + Linear in-flight). 상태 불일치 표시.

### Linear 관리

- `skills/shotloom-linear-today/` — 오늘 할 일. assigned + Todo/In Progress/In Review/Backlog. 워크트리/PR 크로스 참조.
- `skills/shotloom-linear-move/` — 상태 전환. `start-code` 와 `auto-pr` 이 auto-caller 로 등록 (승인 없이 호출). 수동 호출은 승인 요구.
- `skills/shotloom-linear-stale/` — 주간 청소. dead In Progress / state 미스매치 / zombie Todo / **재사용 가능한 STL 번호** 분리 표시.
- `commands/shotloom-linear-create-issue.md` — Step 0.5 추가. 새 이슈 만들기 전에 본인이 만들었다가 버린 Canceled/오래된 Backlog 이슈를 title 유사도로 스캔해서 reuse 후보로 제시. reuse 선택 시 `save_issue` 로 덮어쓰기.
- `skills/shotloom-blocker-to-linear/` — 작업 중 Linear 이슈에 progress/blocker 코멘트. 승인 게이트 유지.

### 기타

- `skills/shotloom-draft-adr/` — ADR 드래프트. 기존 ADR 충돌/supersedes 스캔 + 템플릿 + `docs/adr/README.md` 인덱스 갱신.
- `skills/shotloom-sync-codex/` — Codex 돌쇠 와의 `.agent/handoff.md` 읽기/쓰기/append. 돌쇠 위치 `~/.codex/codex-base/`.
- `memory/feedback_auto_pr_approval_exempt.md` — auto-pr 만 승인 면제. 다른 플로우는 그대로.
- `memory/feedback_linear_autostart.md` — Linear 언급 시 auto-start.

---

## 연결 흐름

```
User:    "STL-99 구현해줘"
         ↓ UserPromptSubmit hook
         ↓ /shotloom-start-code STL-99
         ↓   Linear fetch + worktree 생성 + In Progress
         ↓   컨벤션 재독 + programming.md 해당 섹션 로드
         ↓   Ready 브리핑
Code →   /shotloom-commit (게이트 + 드래프트 + 커밋)
         ↓
PR open: /shotloom-make-pr
         ↓
         /shotloom-auto-pr <N>   (3분 폴링 시작)
         ↓   in-scope 자동 수정 + 답글
         ↓   out-of-scope / ambiguous → 브리핑
PR merge:
         ↓   워크트리 삭제 + 로컬 브랜치 삭제
         ↓   Linear Done 전환
         ↓   pr-journal.md 에 최종 기록
```

---

## 설계 판단 메모

- **mirror vs source**: programming.md 는 in-repo 가이드라인의 복사본. 충돌 시 원본 우선을 명시. 계속 드리프트 위험 → 주기적 refresh 필요.
- **approval exempt 범위 제한**: auto-pr 만 면제. `shotloom-respond-pr` (수동 대응) 은 기존 게이트 유지. 이렇게 해야 "정신 차려보니 이상한 댓글이 나가 있음" 사고 없음.
- **워크트리 디렉토리명에 STL-NN 넣기**: 브랜치명은 레포 룰대로 `<type>/<summary>` (STL-NN 없음), 워크트리 경로는 `.worktrees/stl-<NN>-<summary>` (명확성). 분리.
- **Ambiguity 8/10 이하 통과**: 자동 루프가 완벽한 판단 못 하는 걸 인정. 10점 만점에 9-10 만 멈추고, 나머진 best interpretation 으로 진행. 틀리면 리뷰어가 다시 코멘트 달 테니 그때 학습.
- **edit-guard 뺀 이유**: main 에서 편집 차단이 생각보다 일상 작업을 방해함. 핫픽스/docs-only 수정까지 escape hatch 필요하게 됨. 컨벤션으로만 유지하는 게 실용적.

---

## 다음

- 실제 STL 작업 한 건으로 풀 사이클 돌려보고 빠진 곳 수정.
- `shotloom-linear-week` / `shotloom-linear-show` / `shotloom-linear-handoff` 는 관찰 후 추가.
- review-code-rust.md 패턴 학습 루프 (auto-pr Step 4.3) 실전 테스트 필요.
- Linear MCP 호출이 실패하는 케이스 (rate limit, auth 만료 등) 에 대한 fallback 확인.
