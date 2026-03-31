# Multi-Agent Ops Standard

Manual Orchestrator-Worker pattern for parallel Claude Code instances.

## Roles

| Role | ID | Location | Responsibility |
|------|----|----------|---------------|
| 지통실 (Control) | #1 | caol-ila | Plan, dispatch, track, commit, MR |
| Worker | #2, #3, ... | target repo | Execute tasks, report back |

## Ops Directory

Per-mission directory under `claude/ops/{mission-name}/`.

```
ops/{mission-name}/
├── README.md          # Protocol + rules (survives /compact)
├── briefing.md        # Agent context (read-only)
├── briefing-{task}.md # Task-specific context (optional)
├── conventions.md     # Target repo conventions (agent-authored)
├── timeline.md        # Task dispatch board
├── log.md             # Status log (all agents append)
└── *.md               # Task outputs (rq-results, mr-body, etc.)
```

## Task Lifecycle

```
queued → dispatched → active → done / blocked
```

- ID format: `T-NNN` (shotloom), `R-NNN` (retarget), or `{prefix}-NNN` per mission.
- #1 creates tasks in timeline.md, copies dispatch to clipboard.
- User pastes dispatch to target agent terminal.
- Agent executes, updates timeline.md status + appends to log.md.

## Dispatch Template

```markdown
# 작업 지시: {TASK-ID} {title}

너는 {N}호기다.

## 사전 준비
- briefing.md 읽기
- 브랜치 생성/체크아웃

## 목표
{1-2 sentences}

## 할 일
{numbered steps}

## 완료 조건
{acceptance criteria}

## 보고
1. timeline.md — status → done
2. log.md — 완료 기록
```

## Rules

### Commits & MR
- 커밋은 #1(지통실)에서만 작성. Workers는 커밋하지 않음.
- MR 작성도 #1 담당.

### Branch Isolation
- 같은 레포 병렬 작업 시 각자 별도 브랜치.
- 명명: `{task-id}/{agent}` (e.g. `R-005/agent2`)
- #1이 merge/cherry-pick으로 통합.

### Documents
- All docs: LLM-compact (token-efficient, table/list preferred, no prose filler).
- Briefings: read-only. Conventions: append-only.

### Clipboard
- 모든 dispatch는 pbcopy로 클립보드 복사.
- User가 target agent terminal에 붙여넣기.

### Subagents
- 간단한 작업(파일 복사, config 생성 등)은 #1이 Agent tool subagent로 직접 실행.
- timeline에 `#1 sub`으로 기록.

## Self-Contained Task Blob (v2 Dispatch)

기존 dispatch는 `briefing.md 읽기`를 사전 준비로 요구 → worker가 ops 파일을 읽느라 토큰 낭비. v2는 **자기완결적 task blob**을 클립보드로 전달한다.

### 원칙
- Worker는 ops 디렉토리를 읽지 않는다. 필요한 컨텍스트는 전부 blob에 포함.
- #1(지통실)이 코드를 미리 읽고 관련 부분만 발췌해서 blob에 넣는다.
- 결과 보고도 텍스트로 반환 (timeline/log 직접 수정 안 함 → #1이 반영).

### Task Blob 구조

```markdown
# 작업 지시: {TASK-ID} {title}

너는 {N}호기다. {레포}에서 작업한다.

## 사전 준비
- 브랜치: `{branch}` ({base}에서 생성)
- 레포: {path}

## 규칙
{mission-level rules — 소스 수정 금지, 커밋 금지 등}

## 할 일
### 1. {step title}
파일: `{path}`
현재 코드:
\```rust
{relevant snippet — #1이 미리 읽어서 발췌}
\```
변경:
\```rust
{target code}
\```

### 2. {step title}
...

## 완료 조건
{acceptance criteria — cargo test, clippy, 구체적 assert}

## 보고
작업 완료 후 결과를 텍스트로 보고하라:
- {what to report}
```

### v1 vs v2

| | v1 (기존) | v2 (task blob) |
|--|----------|---------------|
| 컨텍스트 | `briefing.md 읽기` 지시 | blob에 발췌 포함 |
| 토큰 비용 | worker가 ops 파일 전체 로드 | 필요한 것만 전달 |
| 보고 | worker가 timeline/log 직접 수정 | 텍스트 반환 → #1이 반영 |
| 의존성 | ops 디렉토리 접근 필요 | 자기완결적, ops 접근 불필요 |

### 결과 보고 — 파일 기반

Worker는 결과를 **공유 파일**에 쓴다. #1이 직접 읽는다. User 복붙 불필요.

```
~/.claude/private/ops/{task-id}-result.md
```

- Worker blob 끝에 보고 경로 명시: `결과를 {path}에 쓰라`
- #1은 작업 완료 통보 받으면 해당 파일 Read
- 파일 없으면 미완료로 판단

### #1 준비 워크플로

1. 플랜에서 변경 대상 파일 목록 확인
2. 각 파일 Read → 관련 코드 발췌
3. blob을 **파일로 작성**: `~/.claude/private/ops/{task-id}-dispatch.md`
4. `pbcopy`로 클립보드에도 복사 (편의)
5. timeline.md에 task 등록
6. User에게 "디스패치 준비됨" 알림
7. Worker 완료 후 `~/.claude/private/ops/{task-id}-result.md` Read

## Commit Flow

Worker는 커밋하지 않는다. #1(지통실)이 타겟 레포에서 직접 커밋한다.

### 커밋 타이밍 판단

| 상황 | 판단 |
|------|------|
| 다음 task가 같은 브랜치에서 이어짐 | 먼저 커밋 후 다음 task dispatch (변경사항 경계 명확) |
| 다음 task가 별도 브랜치 | 먼저 커밋 필수 |
| 연속 task가 논리적으로 하나의 변경 | 모아서 한번에 커밋 가능 (user 판단) |
| worker 작업 완료 후 즉시 | user에게 "지금 커밋할까, 다음 task 후 한번에 할까" 확인 |

### #1 커밋 절차

1. 타겟 레포로 이동 (`cd {repo_path}`)
2. `git status` + `git diff` 확인
3. 변경 내용 요약 → 커밋 메시지 작성
4. `git add` (파일별 명시) → `git commit`
5. **push는 user 요청 시에만**

### 연속 task 시 워크플로

```
R-017 dispatch → 2호기 작업 → 완료 보고 (result.md)
  → #1 result 확인 → user에게 커밋 여부 확인
  → 커밋 (or 보류)
  → R-018 dispatch → 2호기 작업 → 완료 보고
  → #1 result 확인 → 커밋
  → timeline 업데이트
```

#1은 worker 완료 후 반드시 **커밋 여부를 user에게 묻는다**. 자동 커밋하지 않는다.

## Anti-Patterns

| Don't | Do Instead |
|-------|-----------|
| Worker가 커밋 | #1이 검토 후 커밋 |
| 같은 브랜치에서 병렬 작업 | 브랜치 분리 |
| 긴 prose로 문서 작성 | LLM-compact table/list |
| dispatch에 컨텍스트 누락 | briefing.md 읽기 포함 |
| 결과 보고 안 함 | timeline + log 필수 업데이트 |

## Scaling

- 권장: 2-3 workers. 5개 넘으면 조율 오버헤드 급증.
- Worker당 5-6 tasks가 적정.
- 연구/리뷰 태스크 먼저, 구현 태스크 나중.
- Agent Teams (실험적 기능) 안정화 전까지 수동 운영 유지.
