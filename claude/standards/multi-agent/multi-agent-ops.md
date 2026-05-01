---
status: accepted
---
# Multi-Agent Ops Standard

Manual Orchestrator-Worker pattern for parallel Claude Code instances.

> **MANDATORY:** 지통실(#1) 1호기로 지정받으면 이 문서를 반드시 전체 읽고 시작하라. 숙지 전 dispatch 금지.

## Roles

| Role | ID | Location | Responsibility |
|------|----|----------|---------------|
| 지통실 (Control) | #1 | caol-ila | Plan, dispatch, track, commit, MR |
| Worker | #2, #3, ... | target repo | Execute tasks, report back |

## Ops Directory

```
ops/{mission-name}/
├── README.md          # Mission + files only (규칙은 이 standard에서 상속)
├── briefing.md        # Agent context (read-only)
├── briefing-{task}.md # Task-specific context (optional)
├── conventions.md     # Target repo conventions (agent-authored)
├── timeline.md        # Task dispatch board (#1만 수정)
├── log.md             # Status log (#1만 수정)
└── *.md               # Task outputs (worker 작성 가능)
```

### README 규칙
- Mission 이름 + files 목록만. Protocol/Rules 복사 금지 — 이 standard에서 상속.
- Mission-specific rules만 추가 (예: "소스 애니메이션 수정 금지").

## Task Lifecycle

`queued → dispatched → active → done / blocked`

- ID format: `{prefix}-NNN` per mission (e.g. `T-NNN`, `R-NNN`)
- #1 creates tasks in timeline.md, dispatches via clipboard/file

### Timeline 구조

```markdown
## Now
R-018 active (#2). R-017 done, 커밋 대기.

## Tasks
| ID | Task | Agent | Status | Depends |
...
```

- `## Now` 섹션은 항상 최상단. 현재 상태 1-2줄 요약.
- #1 복귀 시 `## Now`만 읽고 시작. 전체 스캔 불필요.

## Dispatch (Lightweight JSON)

Worker는 ops 디렉토리를 읽지 않는다. #1이 파일 경로와 라인 범위만 전달, worker가 직접 Read.

```json
{
  "id": "R-NNN",
  "title": "short title",
  "branch": "target branch",
  "repo": "repo name",
  "depends": "R-NNN or null",
  "goal": "1-2 sentences",
  "rules": ["no source modification", "no commits"],
  "files": ["path/to/file.rs:L100-150", "path/to/other.rs:L30-60"],
  "tasks": ["step 1", "step 2"],
  "validation": ["cargo clippy clean", "cargo test pass"]
}
```

- `snippets` 필드 없음. `files`에 `path:L시작-끝`으로 라인 범위 지정.
- Worker가 해당 파일을 직접 Read.
- 각 라인 범위 ≤50줄. task당 최대 3개 범위. 넘으면 subtask로 분할.
- `report`, `context`, `references` 필드 생략 가능. report 경로는 convention (`~/.claude/ops/{task-id}-result.md`), context는 goal로 충분, references는 files로 대체.

### #1 Dispatch Flow

1. 변경 대상 파일 경로 + 라인 범위 확인
2. JSON blob 작성 → `~/.claude/ops/{task-id}-dispatch.md`
3. `pbcopy`로 클립보드 복사
4. timeline.md `## Now` + task 테이블 업데이트
5. Worker 완료 후 `~/.claude/ops/{task-id}-result.md` Read

### #1 복귀 Flow

1. timeline.md `## Now` 섹션만 Read
2. 필요 시 result 파일 Read
3. 다음 dispatch 준비

## Rules

### Ownership
- **timeline.md, log.md는 #1만 수정.** Worker는 건드리지 않음.
- **Worker는 result 파일만 쓴다:** `~/.claude/ops/{task-id}-result.md`
- #1이 result를 읽고 timeline/log에 반영.

### Commits & MR
- Worker는 커밋하지 않음. #1(지통실)에서만 커밋 및 MR 작성.

### Branch Isolation
- 같은 레포 병렬 작업 시 각자 별도 브랜치: `{task-id}/{agent}`
- #1이 merge/cherry-pick으로 통합

### Result 파일 규칙
- Worker는 아래 필드만 작성. freeform prose 금지.
  ```
  status: done / blocked
  summary: (3줄 이내)
  files_changed: [파일 목록]
  blockers: (있으면)
  ```

### Log 작성 규칙
- 한 줄: `R-013 done. → shoulder-slerp-experiment.md`
- 상세 결과는 별도 파일. log에 기술 디테일 금지.

### Documents
- All docs: LLM-compact (table/list, no prose filler)
- Briefings: read-only. Conventions: append-only.

### Clipboard & Subagents
- dispatch는 pbcopy → user가 target agent에 붙여넣기
- 간단한 작업은 #1이 Agent tool subagent로 직접 실행 (timeline에 `#1 sub` 기록)

## Commit Flow

| 상황 | 판단 |
|------|------|
| 다음 task가 같은 브랜치 | 먼저 커밋 후 dispatch |
| 다음 task가 별도 브랜치 | 먼저 커밋 필수 |
| 연속 task가 논리적으로 하나 | 모아서 한번에 커밋 (user 판단) |

### #1 커밋 절차

1. 타겟 레포 이동 → `git status` + `git diff`
2. 변경 내용 요약 → 커밋 메시지 작성
3. `git add` (파일별) → `git commit`
4. push는 user 요청 시에만
5. **커밋 여부는 반드시 user에게 확인. 자동 커밋 금지.**

## Scaling

- 권장 2-3 workers. 5개 넘으면 조율 오버헤드 급증.
- Worker당 5-6 tasks 적정.
- 연구/리뷰 먼저, 구현 나중.
