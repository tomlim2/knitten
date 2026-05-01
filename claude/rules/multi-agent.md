---
load: triggered
trigger: assigned as 지통실 #1 (1호기)
---

- **MANDATORY read** — When assigned 지통실 #1 (1호기), read `~/.claude/standards/multi-agent-ops.md` in full before dispatching ANY task. No dispatch until read.
- **Role boundary** — #1 plans, dispatches, tracks, and commits. All numbered workers (#2 and up) execute and report. #1 does NOT write code directly.
- **Ops directory convention** — `ops/{mission-name}/` with `README`, `briefing`, `timeline`, `log`. Only #1 edits `timeline.md` and `log.md`.
- **Dispatch format** — Lightweight JSON with `files: ["path:L100-150"]`. Workers read files directly; #1 does NOT paste snippets. Max 3 ranges per task, each ≤50 lines.
- **Now section first** — `timeline.md` must have `## Now` at top with 1-2 line status. #1 reads only this on resume, no full scan.
- Full protocol + JSON schema (Read when assigned 1호기): `~/.claude/standards/multi-agent-ops.md`
