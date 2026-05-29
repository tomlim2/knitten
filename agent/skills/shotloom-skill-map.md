# Shotloom Skill Map

Use this map to choose between Shotloom user-facing orchestrators and
leaf/component skills.

## User-Facing Orchestrators

| Skill | Owns | Stops when |
|---|---|---|
| `shotloom-prepare-task` | `shotloom-start-task` -> `shotloom-draft-spec` -> spec review -> Knitten docs commit/push | Reviewed spec exists and implementation needs separate user approval. |
| `shotloom-implement-code` | Approved spec or structured findings -> Shotloom source/doc changes | Implementation diff exists and caller must decide the next review/commit step. |
| `shotloom-review-before-pr` | Evidence packet -> code/docs review -> fixes -> `prReady` decision | `prReady=true` or unresolved blocker is known. |
| `shotloom-respond-pr` | PR comments -> classification -> fixes -> replies/re-request path | Review response cycle is complete or needs user decision. |
| `shotloom-wrapup-task` | Task closure -> Linear/worktree cleanup -> retrospective handoff | Task closeout is complete or blocked. |

## Leaf / Component Skills

| Skill | Function |
|---|---|
| `shotloom-start-task` | Create the task worktree and Ready briefing from a Linear issue. |
| `shotloom-draft-spec` | Write and review the implementation spec after start-task. |
| `shotloom-review-task-plan` | Review an existing spec before implementation. |
| `shotloom-review-code` | Return code-quality findings JSON. |
| `shotloom-review-docs` | Return docs/wording/markup findings JSON. |
| `shotloom-review-triad` | Run the three-lens review when selected by review mode. |
| `shotloom-decide-review-mode` | Select single/standard/triad review mode. |
| `shotloom-check-gates` | Run local Shotloom gates. |
| `shotloom-commit` | Commit a prepared Shotloom diff. |
| `shotloom-make-pr` | Draft and open a PR after `prReady=true`. |
| `shotloom-watch-pr` | Poll PR checks, comments, and review state. |
| `shotloom-verify-review` | Verify submitted review comments landed. |
| `shotloom-linear-today` | List current assigned Shotloom Linear work. |
| `shotloom-linear-stale` | Find stale Shotloom Linear issues. |
| `shotloom-linear-move` | Move a Shotloom Linear issue state. |
| `shotloom-blocker-to-linear` | Post blocker/progress notes to Linear. |
| `shotloom-open-web` | Launch the local web editor. |
| `shotloom-deploy-web` | Deploy/verify/rollback web image. |
| `shotloom-send-deploy-status` | Send deploy status notices. |
| `shotloom-draft-adr` | Draft a Shotloom ADR. |
| `shotloom-analyze-rig` | Run ad-hoc retarget/rig analysis scripts. |
| `shotloom-promote-findings` | Promote operational findings into validation or ledgers. |
| `shotloom-promote-review-patterns` | Promote reusable review patterns. |
| `shotloom-auto-pr` | Background PR watcher/responder. |

## Selection Rules

| Request shape | Rule |
|---|---|
| Full task lifecycle step | Use one user-facing orchestrator. |
| Exact utility request | Use the matching leaf/component skill. |
| Ambiguous Shotloom request | Start with `shotloom-router`. |
| Review lens request | Use `shotloom-review-before-pr` unless the user names a specific lens. |
| PR comment response | Use `shotloom-respond-pr`; do not use `shotloom-review-pr`. |
| Human reviewer mode | Use `shotloom-review-pr`. |
