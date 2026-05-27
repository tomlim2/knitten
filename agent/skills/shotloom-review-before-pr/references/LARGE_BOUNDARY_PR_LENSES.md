---
status: accepted
---

# Large Boundary PR Lenses

Use this reference from `shotloom-review-before-pr` when a Shotloom PR crosses
bridge, model, runtime, editor, fixture, and contract-doc boundaries.

Large-boundary batches own cross-surface consistency only. They do not perform
general code review, broad docs review, PR body review, or release checks.

## Trigger

Run large boundary lens batching when the diff touches two or more rows:

| Changed Surface | Trigger Evidence |
|---|---|
| Rust bridge DTOs | `crates/shotloom-core/src/bridge/**` |
| TypeScript bridge mirrors | `apps/editor/src/bridge/**` |
| Engine handlers | `crates/shotloom-engine/src/bridge/handlers/**` |
| Model validation | `crates/shotloom-core/src/model/**` |
| Fixture snapshots | `apps/editor/src/bridge/__tests__/__snapshots__/**` |
| IPC contract docs | `docs/ipc/bridge-contract.md` |
| Cross-owner movement | promote, demote, import, save, load, migrate, hydrate |
| Event sequencing | `BridgeEvent`, `BundleChanged`, `SelectionChanged`, `ShotLoaded` |

## Batch Order

| Batch | Lenses | Stop Condition |
|---|---|---|
| A Shape | Surface Map, Diff Risk Classification, Contract Mirror | Stop if mirror mismatch or undocumented public field exists. |
| B Behavior | Negative Path Coverage, Atomicity/Rollback, Ownership Boundary | Stop if data loss, partial mutation, or missing blocker rejection coverage exists. |
| C Runtime/UI | Event Sequencing, State Sync, TS/Editor Consumer | Stop if UI cannot observe state transition or stale state can remain. |
| D Contract Docs | Docs-As-Contract, Existing Contract Section Drift | Stop if contract docs describe a false wire shape or omit a new public contract field. |
| E Boundary Verify | Prior Boundary Finding Verification, Boundary Regression Scan | Stop if a prior boundary blocker is not directly verified on current `HEAD`. |

## Trigger-To-Batch Map

| Trigger Evidence | Required Batches |
|---|---|
| Rust bridge DTOs and TypeScript bridge mirrors | A, C, D, E |
| Rust bridge DTOs and fixture snapshots | A, D, E |
| Engine handlers and model validation | B, E |
| Engine handlers and event sequencing | B, C, E |
| Engine handlers and fixture snapshots | A, B, E |
| Model validation and fixture snapshots | A, B, E |
| IPC contract docs plus any Rust or TS contract surface | A, D, E |
| Cross-owner movement plus model validation | B, C, E |
| Cross-owner movement plus IPC contract docs | B, D, E |
| Event sequencing plus TypeScript bridge mirrors | C, D, E |
| Three or more trigger rows match | A, B, C, D, E |

## Lens Checks

| Lens | Check |
|---|---|
| Surface Map | List changed Rust, TS, fixture, docs, runtime, and model surfaces before findings. |
| Diff Risk Classification | Classify each surface as contract, state mutation, persistence, runtime, UI, docs, or test-only. |
| Contract Mirror | For each field/event/rejection code, compare Rust, TS, fixtures, and docs. |
| Negative Path Coverage | For each command/rejection pair, require a test and no-mutation assertion or explicit P3 deferral. |
| Atomicity/Rollback | For each multi-collection mutation, verify rollback on closure failure and post-mutation validation failure. |
| Ownership Boundary | Verify Stage-owned, shot-owned, asset-owned, and runtime-owned data do not silently cross boundaries. |
| Event Sequencing | Verify success echo, state cleanup, and `BundleChanged` order match consumer needs. |
| State Sync | Verify selection, active IDs, cache maps, and desired runtime entities cannot remain stale. |
| TS/Editor Consumer | Verify optional/required fields and discriminants match Rust wire semantics. |
| Docs-As-Contract | Verify command matrix, event payloads, rejection catalog, and contract sections match current code. |
| Existing Contract Section Drift | Search contract docs for changed field/event/code names and update nearby stale contract prose. |
| Prior Boundary Finding Verification | Re-open every previous boundary blocker and cite the exact current evidence that fixes it. |
| Boundary Regression Scan | Inspect files touched by boundary fixes for new cross-surface mismatches. |

## Result Template

```markdown
## Lens Batch Result - <batch>

| Lens | Result | Must Fix | Follow-Up |
|---|---|---:|---:|
| <lens> | pass/fail | <count> | <count> |

## Stop Point

- Fix before next batch:
- Accepted follow-up:
- Targeted checks to run:
- Resume from:
```

## Rules

- Run only matching batches.
- Stop between batches when blocker findings exist.
- Resume any later batch from current `HEAD`.
- Do not run all lenses in one broad pass.
