---
status: accepted
---

# Review Mode

Use this reference from `shotloom-decide-review-mode`. Default behavior returns
`needsTriad=false` for small low-risk diffs and `needsTriad=true` for large or
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
`triggers` field in the decision JSON.

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

Set `needsTriad=true` if any condition is true:

| Trigger id | True when |
|---|---|
| `large-file-count` | `files_changed >= 10`. |
| `large-line-count` | `lines_added + lines_deleted >= 1000`. |
| `bridge-api-contract` | Bridge/API contract changes a DTO, event, command, rejection code, schema, IPC doc, or fixture snapshot. |
| `rust-ts-contract` | Rust contract code and TypeScript mirror or consumer both changed. |
| `runtime-proof-artifacts` | Runtime code and fixtures, snapshots, golden files, or generated proof artifacts changed together. |
| `model-validation-persistence` | Model, validation, persistence, import/export, hydrate, migrate, or save/load behavior changed. |
| `asset-manifest-fixture` | Asset, manifest, catalog, fixture, snapshot, or data-pack contract changed. |
| `event-ordering` | Runtime/editor observation order, command echo, rejection order, or bridge event sequencing changed. |
| `cross-ownership` | Three or more ownership surfaces changed. |
| `boundary-lens-count` | Three or more large-boundary trigger rows match. |

Set `needsTriad=false` only when all conditions are true:

- `files_changed <= 5`.
- `lines_added + lines_deleted <= 500`.
- Changed surfaces are limited to UI, tests, docs, or one low-risk helper.
- No Triad trigger above matches.

If neither rule is decisive, set `needsTriad=true`.

Compatibility:

| User override | Effective output |
|---------------|----------------|
| `force single` | `needsTriad=false` |
| `force standard` | `needsTriad=false` |
| `force triad` | `needsTriad=true` |

## Decision Template

```json
{
  "needsTriad": true,
  "reason": "<one sentence>",
  "triggers": ["<trigger>"],
  "signals": {
    "branch": "<branch>",
    "filesChanged": 0,
    "linesAdded": 0,
    "linesDeleted": 0,
    "touchedSurfaces": []
  }
}
```
