---
status: accepted
---

# Review Mode

Use this reference from `shotloom-review-before-pr` Step 2. Default mode is
Auto. Auto selects Single for small low-risk diffs and Triad for large or
boundary-risk diffs.

## Evidence

Run from the Shotloom worktree:

```bash
git diff --shortstat origin/main...HEAD
git diff --name-only origin/main...HEAD
git diff --name-status origin/main...HEAD
git diff origin/main...HEAD
```

Also count matching trigger rows from
`references/LARGE_BOUNDARY_PR_LENSES.md` → `Trigger`; the same count feeds the
`triad triggers` field in the decision template.

## Surface Map

| Surface | Evidence |
|---|---|
| UI/test/docs only | `apps/editor/**`, `**/__tests__/**`, `docs/**` with no contract path |
| Bridge/API contract | `crates/shotloom-core/src/bridge/**`, `apps/editor/src/bridge/**`, `contracts/**`, `docs/ipc/**` |
| Runtime/event ordering | `crates/shotloom-engine/**`, `BridgeEvent`, `BundleChanged`, `SelectionChanged`, command echo, rejection order |
| Model/validation/persistence | validators, model collections, save/load, import/export, hydrate, migrate |
| Asset/manifest/fixtures | `assets/**`, manifest files, fixtures, snapshots, data-pack contracts |
| Cross-language contract | Rust contract code and TypeScript mirror or consumer both changed |

## Decision Rules

Select `review_mode=triad` if any condition is true:

- `files_changed >= 10`.
- `lines_added + lines_deleted >= 1000`.
- Bridge/API contract changes a DTO, event, command, rejection code, schema,
  IPC doc, or fixture snapshot.
- Model, validation, persistence, import/export, asset manifest, or runtime
  event-ordering changes can reject existing data, change saved data, or change
  editor/runtime observation order.
- Rust and TypeScript contract surfaces both change in the same branch.
- Large boundary lens batching triggers with three or more trigger rows.

Select `review_mode=single` only when all conditions are true:

- `files_changed <= 5`.
- `lines_added + lines_deleted <= 500`.
- Changed surfaces are limited to UI, tests, docs, or one low-risk helper.
- No Triad trigger above matches.

If neither rule is decisive, select `review_mode=triad`.

Compatibility:

| User override | Effective mode |
|---------------|----------------|
| `force single` | `single` |
| `force standard` | `single` |
| `force triad` | `triad` |

## Decision Template

```markdown
## Review Mode Decision - branch <branch>

Mode: Single | Triad
Reason: <one sentence>
Signals:
- files changed: <N>
- lines changed: +<A>/-<D>
- touched surfaces: <list>
- triad triggers: <list or none>
```
