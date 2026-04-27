---
description: Codex 정밀 Rust 코드 리뷰 (uncommitted/브랜치/커밋). 회사 코드 전용, high reasoning.
argument-hint: "[--uncommitted | --base BRANCH | --commit SHA] [--context-docs <path>]... [--phase <text>] [--out-of-scope <text>] [--constraints <text>]"
allowed-tools: Bash(codex:*), Bash(bash:*), Bash(git:*), Read
---

# cci-codex-review-rust

Codex(`gpt-5.4`)에게 **Rust 변경분 정밀 리뷰**를 시킨다. high reasoning 모드로 토큰을 적극 사용. 회사 토큰 정당화 + 검증기 독립성(Claude가 짠 코드를 다른 모델이 본다) 확보.

리뷰 관점:
- 소유권/대여/lifetime
- panic 유발 (`.unwrap()`, `.expect()`, 인덱스 접근)
- Result/Option 처리
- 관용구 (idiomatic Rust)
- 성능 핫패스 (불필요한 alloc, clone)
- 동시성/Send/Sync
- 에러 메시지 품질
- **Rust 일반 베스트 프랙티스** — shotloom 레포의 경우 in-repo `docs/guidelines/review-rust.md`가 단일 소스. 사용자가 `--context-docs docs/guidelines/review-rust.md`로 직접 지정해야 하며 자동 포함은 하지 않는다.

## Arguments

- `[--uncommitted]` (기본) — staged + unstaged + untracked 변경분
- `[--base BRANCH]` — 현재 브랜치 vs 지정 브랜치 (예: `--base main`)
- `[--commit SHA]` — 특정 커밋이 도입한 변경
- `[--context-docs <path>]` — ADR/spec/design 문서 경로. 반복 사용 가능. 전체 내용이 프롬프트에 임베드됨.
- `[--phase <text>]` — 현재 작업 단계 설명 (Scope Context에 주입)
- `[--out-of-scope <text>]` — 이번 리뷰 범위 밖 항목 (Scope Context에 주입)
- `[--constraints <text>]` — 알려진 제약 (Scope Context에 주입)

**인자가 없으면 `--uncommitted`로 동작.**

Usage:
- `/cci-codex-review-rust [--uncommitted | --base main | --commit abc123]`
- `/cci-codex-review-rust --base main --context-docs docs/adr/adr-0023-retargeter-validation-contract.md --phase "Phase B Session 2 — types + rubric port" --out-of-scope "marker impl (session 3)"`

## Workflow

### Step 1: Validate
- 현재 디렉토리가 git 레포인지 확인. 아니면 안내 후 종료.
- `codex` CLI 존재 확인 (`which codex`).
- 변경분이 있는지 확인. 없으면 "변경분 없음" 출력 후 종료.
- **Substantive Rust churn 측정** (early-exit 게이트):
  - `git diff --stat` 를 선택된 범위(`--uncommitted`/`--base`/`--commit`)에 맞춰 실행.
  - `.rs` 파일의 added+deleted 라인만 카운트.
  - 다음 라인은 카운트에서 제외:
    - 빈 줄
    - 코멘트 전용 (`//`, `///`, `//!`)
    - `use` 단독
    - 본문 없는 `pub mod` 선언 단독
  - 남은 substantive 라인 합계가 **< 15** 이면 Codex 호출 없이 아래 메시지 출력 후 종료:

    > **Skill bypassed:** diff has only N substantive Rust lines (< 15). This skill is for non-trivial Rust review. Options: (a) re-run with a broader `--base` range, (b) use `cci-codex-port-bevy` for scaffold/planning work, (c) skip code review for this change.

  - 15라인 기준 근거: 최소 "함수 하나 분량의 로직"이 있어야 실질적 리뷰 가치.

### Step 2: Build review prompt
$ARGUMENTS 파싱:
- `--uncommitted` 또는 인자 없음 → `git diff HEAD && git status --short`로 변경분 수집
- `--base BRANCH` → `git diff <BRANCH>...HEAD`
- `--commit SHA` → `git show <SHA>`
- `--context-docs <path>` (반복) → 각 경로를 `Read`로 전체 내용 읽어둠
- `--phase` / `--out-of-scope` / `--constraints` → Scope Context 플레이스홀더에 치환. 플래그 미지정 시 해당 라인 자체를 드롭 (literal `<PHASE>` 로 남기지 말 것).

**Shotloom 레포 컨텍스트** (자동 포함 없음):
- shotloom 레포의 Rust 리뷰 SSOT는 in-repo `docs/guidelines/review-rust.md`. 사용자가 `--context-docs docs/guidelines/review-rust.md`로 직접 지정해야 한다.
- 자동 임베드 동작은 제거되었다 (`~/.claude/standards/review-code-rust.md` 카탈로그는 폐기됨).

수집한 diff를 다음 프롬프트 본문에 끼워넣는다:

```
당신은 시니어 Rust 리뷰어다. 아래 변경분을 정밀 리뷰하라.

## Scope Context (caller-provided)
- Phase: <PHASE>
- Out-of-scope: <OUT_OF_SCOPE>
- Binding ADRs (read these first): <ADR_PATHS>
- Known constraints: <CONSTRAINTS>

---

## Uncertainty Protocol (binding)
- If the diff does not give you enough to judge a concern, do not
  speculate. Flag it under an "Insufficient evidence" section and
  request the specific files you would need.
- If a finding is relevant but outside the declared scope, move it to
  an "Out-of-scope observation" section — do not mix with in-scope
  review items.
- If the caller supplied `## Binding ADRs` content below, judge the
  diff against the design intent in those ADRs, not against your own
  preferences.

---

**리뷰 체크리스트** (항목별로 발견 사항을 적되, 없으면 "OK"):
1. 소유권/대여/lifetime — 불필요한 clone, 'static 남용, 라이프타임 압박
2. Panic 유발 — unwrap/expect/인덱스 접근/슬라이싱/오버플로우
3. Result/Option — `?` 누락, 무시된 에러, `unwrap_or`로 충분한 곳
4. 관용구 — `if let` vs match, iterator 체인, `From`/`Into`
5. 성능 핫패스 — 불필요한 alloc/clone/Box, 반복문 안의 정규식 컴파일
6. 동시성 — Send/Sync, 데이터 경합, Arc/Mutex 오용
7. 에러 메시지 — 디버깅 가능성, 컨텍스트 포함 여부
8. 테스트 가능성 — 부수효과 분리, 순수 함수 추출 여지

**심각도** 표기:
- 🔴 **Block**: 머지 전 반드시 수정 (panic, 데이터 손실, 정합성 깨짐)
- 🟡 **Should**: 권장 수정 (성능, 가독성, 관용구)
- 🟢 **Nit**: 취향, 무시해도 됨

**출력 형식**:
1. 전체 요약 (3줄 이내)
2. 파일별 발견 사항 (라인 번호 + 인용 + 심각도 + 제안)
3. 머지 권장도: ✅ 머지 OK / ⚠️ 수정 후 머지 / ❌ 재작업 필요
4. **Insufficient evidence** — 이 diff만으로는 판단 불가한 항목 (필요한 파일 명시)
5. **Out-of-scope observation** — declared scope 밖이지만 참고할 만한 발견

**금지 사항**:
- "good job", "looks good" 같은 무의미한 칭찬 금지
- 변경되지 않은 줄에 대한 평가 금지
- 추측성 "might be slow" 금지 — 구체적 근거 제시

---

## Binding ADRs / Design Docs

<여기에 --context-docs로 넘어온 각 문서의 전체 내용을 경로 헤더와 함께 임베드. 없으면 섹션 자체를 드롭.>

---

## Shotloom Review Patterns (mandatory)

<shotloom 레포일 때만 포함. `~/.claude/standards/shotloom-review-patterns.md`의 전체 내용을 그대로 임베드. Codex에게 "Apply every pattern in this section to every changed file. Report per-pattern match/clean with severity BLOCK/SHOULD/NIT. Patterns are derived from historical Copilot findings on PR #66 and cover the specific classes of issue shotloom reviewers flag." 지시 추가. 타 레포일 땐 섹션 자체 드롭.>

---

## 변경분

<여기에 git diff 출력>
```

### Step 3: Call wrapper
`bash ~/.claude/lib/cci-codex/run-codex.sh review-rust "<위 프롬프트 전체>"`

(wrapper가 high reasoning + 결과 아카이빙을 자동 처리)

### Step 4: Show result
- Codex 출력은 wrapper가 stdout으로 흘려보내므로 그대로 사용자에게 노출됨
- wrapper 마지막 줄에 아카이브 경로가 출력됨 — 그것도 그대로 보여줌
- 추가 요약/해석 없이 끝낸다 (사용자가 직접 읽음)
