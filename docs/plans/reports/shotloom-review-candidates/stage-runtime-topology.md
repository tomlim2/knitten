---
status: draft
created: 2026-05-21
source: CINEV/shotloom#385
repo: shotloom
target: review-candidate-catalog
---

# Stage Runtime Topology Review Candidates

## Purpose

Generalize the PR 385 review fixes into reusable review checks. These are not
yet Shotloom review rules. They are candidate items to fold into a future
review checklist once similar findings repeat or the team chooses to codify
them.

## Candidate Checks

| Candidate | Review question | Applies when | PR 385 signal |
|---|---|---|---|
| Runtime transition symmetry | When one branch tears down authored runtime state, does the sibling branch restore the fallback or document why it intentionally does not? | Model sync, hydration, fallback presentation, empty/no-current-state paths | The empty-stage path restored the void fallback, but the no-authoring-shot path only despawned authored Stage runtime. |
| Intentional suppression observability | If a system intentionally ignores a user-visible trigger because another owner has taken over, is there a breadcrumb or comment naming that contract? | Early returns, no-op branches, ownership takeover, compatibility systems | Mood rebuild was intentionally suppressed while authored Stage runtime owned the scene, but the branch was silent. |
| Silent dangling-reference skip | If corrupted or partially-applied model data is skipped, does the skip log, diagnose, or carry a TODO to the deferred diagnostics surface? | Runtime hydration from persisted references, graph edges, id lookups | `renderable_refs` pointing at missing renderables were skipped with no signal. |
| Duplicated spawn path drift | If two code paths construct the same runtime topology using different APIs, are shared invariants centralized or mirrored explicitly? | `Commands` versus direct `World` spawn paths, native/WASM split paths, test-only world mutation helpers | `spawn_void_stage_world` duplicated `spawn_void_stage` without the asset-lifecycle comments. |
| ECS query consolidation | If teardown or matching walks the same component family multiple times, can one `Or<...>` query express the family? | Bevy teardown, cleanup, counting, drift-repair scans | Stage runtime teardown used three separate marker queries and then unioned results. |
| Defensive fallback rationale | If a cleanup path keeps a fallback source beyond the primary world query, is the drift scenario documented? | Runtime maps, bidirectional maps, cached entity indexes | Stage runtime teardown seeded from `StageRuntimeMap`; this is useful for map/world drift, but the reason needed a comment. |
| Steady-state probe cost | If the persisted model is byte-equal to the previous model, does runtime sync still do expensive world-equality probes every tick? | Broad sync, per-frame reconciliation, large authored collections | `should_sync_stage_runtime` could walk runtime topology on every unchanged broad sync. |
| Debug-only drift probes | If a runtime-equality probe is valuable for development but expensive in release, can it be limited to debug builds? | Drift repair, invariant checking, non-user-visible consistency guards | Runtime equality checking stayed useful for debug drift tests but was unnecessary in release steady state. |
| Negative half of invariant tests | Does the test assert both what must remain and what must not reappear? | Suppression, ownership boundaries, fallback takeover, deletion | The mood-change test asserted authored Stage survived, but not that the void fallback stayed absent. |
| State flip coverage | Does the test exercise a transition after initial hydration, not only initial state? | Active marker migration, selected item changes, current-shot changes, mode flips | Multi-stage hydration covered initial active marker placement, but not flipping active stage after sync. |
| Count-return accuracy | If a helper returns a write/spawn/despawn count for tests or metrics, is every branch accounted and not hard-coded? | Test write counters, metrics, mutation accounting helpers | Void fallback despawns were not counted in one model-sync branch; void spawn count was hard-coded. |
| Multi-entity selectivity | If a marker is conditional, does a test include at least one active and one inactive entity of the same kind? | Active markers, selected flags, visibility/lock markers, ownership tags | Single-stage tests could not catch `ActiveStageRuntime` being applied to every Stage. |
| Documentation heading truth | Do documentation section names match shipped visibility and ownership rather than future intent? | Architecture docs, API sections, internal component surfaces | The heading said "Engine API Surface" while components were engine-internal. |

## Review Prompt Seeds

Use these as compact prompts for a reviewer or review agent:

- Compare every teardown branch with its nearest empty/fallback branch. Name any
  asymmetry as either a bug or an intentional transient state.
- For each early return in systems triggered by user-visible state, ask what a
  debugger would see when the trigger appears to do nothing.
- Search for `continue`, `return`, and failed lookup branches inside hydration
  loops. Require a log, diagnostic, TODO, or explicit "safe silent skip"
  rationale.
- Search for duplicate spawn/construction functions that differ only by Bevy
  API shape. Either centralize the constructed data or mirror the invariants in
  comments/tests.
- Count ECS queries over the same marker family. Prefer one query with `Or`
  when deduplication is otherwise needed.
- For "unchanged model" fast paths, separate release behavior from debug drift
  probes.
- For tests around suppression or ownership takeover, assert the forbidden
  entity/component is absent, not only that the desired entity/component remains.
- For stateful markers, test an initial state and a post-sync transition.

## Do Not Codify Yet

| Candidate | Reason to wait |
|---|---|
| Always extract duplicated spawn helpers | Sometimes Bevy API differences make the helper heavier than mirrored comments. Codify only if another duplicated topology path drifts. |
| Always log every skipped dangling reference | Stage validation diagnostics may become the canonical surface. The stable rule should name the chosen surface, not force logging. |
| Always drop steady-state runtime probes | Debug drift repair is valuable during active topology work. The likely rule is "gate expensive probes", not "remove probes". |

## Promotion Target

Likely Shotloom destinations after one more similar review round:

- `docs/guidelines/review-rust.md` §6 ECS patterns
- `docs/guidelines/code-review-guideline.md` §2 P2 tests and verification
- a Shotloom-specific "runtime topology review" satellite if Stage/Prop/Camera
  runtime hydration keeps growing
