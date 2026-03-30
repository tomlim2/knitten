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
