---
description: Codex 정밀 Rust 코드 리뷰 (uncommitted/브랜치/커밋). 회사 코드 전용, high reasoning.
argument-hint: "[--uncommitted | --base BRANCH | --commit SHA]"
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

## Arguments

- `[--uncommitted]` (기본) — staged + unstaged + untracked 변경분
- `[--base BRANCH]` — 현재 브랜치 vs 지정 브랜치 (예: `--base main`)
- `[--commit SHA]` — 특정 커밋이 도입한 변경

**인자가 없으면 `--uncommitted`로 동작.**

Usage: `/cci-codex-review-rust [--uncommitted | --base main | --commit abc123]`

## Workflow

### Step 1: Validate
- 현재 디렉토리가 git 레포인지 확인. 아니면 안내 후 종료.
- `codex` CLI 존재 확인 (`which codex`).
- 변경분이 있는지 확인. 없으면 "변경분 없음" 출력 후 종료.

### Step 2: Build review prompt
$ARGUMENTS 파싱:
- `--uncommitted` 또는 인자 없음 → `git diff HEAD && git status --short`로 변경분 수집
- `--base BRANCH` → `git diff <BRANCH>...HEAD`
- `--commit SHA` → `git show <SHA>`

수집한 diff를 다음 프롬프트 본문에 끼워넣는다:

```
당신은 시니어 Rust 리뷰어다. 아래 변경분을 정밀 리뷰하라.

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

**금지 사항**:
- "good job", "looks good" 같은 무의미한 칭찬 금지
- 변경되지 않은 줄에 대한 평가 금지
- 추측성 "might be slow" 금지 — 구체적 근거 제시

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
