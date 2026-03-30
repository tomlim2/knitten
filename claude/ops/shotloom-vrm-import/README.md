# ops/shotloom-vrm-import

Mission: VRM importer in shotloom-gltf.
Control=#1(caol-ila). Work=#2(shotloom), #3(bevy-vrm).

## Files
- `briefing.md` — agent context (read-only)
- `briefing-t010.md` — T-010 specific context
- `conventions.md` — shotloom code conventions (#2 authored)
- `timeline.md` — task dispatch board
- `log.md` — status log

## Protocol

### Dispatch
- #1 writes task to timeline.md + creates clipboard dispatch for user to paste.
- Tasks: T-NNN. Status: queued → dispatched → active → done / blocked.

### Agent Reporting
- On completion, agent MUST:
  1. Update own task status to `done` in timeline.md
  2. Append entry to log.md
- #1 updates timeline for agents that were dispatched before this rule (T-010).

### Commits & MR
- 커밋은 #1(지통실)에서만 작성. 2·3호기는 커밋하지 않음.
- MR 작성도 #1 담당.

### Documents
- All docs are LLM-first: token-efficient, no prose filler, table/list preferred.
- Briefings are read-only. Conventions are append-only (new sections OK).

### Clipboard
- All dispatch instructions are copied to clipboard via pbcopy.
- User pastes to target agent terminal.

### Branch Isolation
- 같은 레포 병렬 작업 시 각자 별도 브랜치. 명명: `{task-id}/{agent}`. #1이 통합.
