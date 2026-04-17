# STL-114 execution plan

Status: draft (Claude-authored, 2026-04-17)  
Parent: STL-110 umbrella → PR #85 follow-up  
Depends on: STL-113 (PR #97) landing first — VrmRestError enum shape must be settled

---

## Scope recap

Three items carved from STL-110:

1. **P0** — `extract_foot_contact_data` silently collapses malformed skin/mesh to `((0.0, 0.0), None)`. Indistinguishable from a legitimate zero-offset asset.
2. **P1** — Hardcoded `"VRMC_vrm.root_bone"` sentinel in `shotloom-gltf` duplicates `shotloom_retarget::mapping::VRM_ROOT_BONE` and contradicts ADR-0025.
3. **P1** — `shotloom-retarget` re-exports `shotloom_gltf::VrmRestError`. Any new gltf variant becomes a breaking change in retarget.

---

## Decisions

### Item 1 — API shape: **Option B (diagnostic channel)**

Change signature from:
```rust
pub fn extract_foot_contact_data(
    normalized_bytes: &[u8],
    bone_world_position: &HashMap<String, Vec3>,
) -> ((f32, f32), Option<VrmFootContactData>)
```
to:
```rust
pub fn extract_foot_contact_data(
    normalized_bytes: &[u8],
    bone_world_position: &HashMap<String, Vec3>,
) -> (
    (f32, f32),
    Option<VrmFootContactData>,
    Vec<VrmDiagnostic>,
)
```

**Why B over A (hard-fail `Result<_>`)**:
- Foot contact is a best-effort mesh analysis. A malformed skin shouldn't abort rest-pose extraction when bone transforms are valid.
- Matches the existing `vrm_normalization` pattern (`NormalizedVrmAsset { ..., diagnostics: Vec<VrmDiagnostic> }`).
- ADR-0021 (`Diagnostic` as a distinct observation type) already blesses this shape.
- Hard-fail would force every caller to `.unwrap_or_default()` on a non-fatal condition → worse UX.

**Diagnostic codes to add** (snake_case per ADR-0021):
- `foot_contact_missing_skin` — no skin joint matches any target foot bone
- `foot_contact_missing_mesh_attributes` — mesh primitive lacks POSITION/JOINTS_0/WEIGHTS_0
- `foot_contact_out_of_range_accessor` — accessor index exceeds array (currently returns `None` silently after STL-112)

**Severity**: Info. Not a warning — a rig without toe bones is legal.

### Item 2 — Root-bone synthesis: **Move into `shotloom-retarget::build_from_bytes`**

Current `extract_vrm_rest_data` (in shotloom-gltf) synthesizes `"VRMC_vrm.root_bone"` key into `bone_rest_local` / `bone_rest_global` / `parent_map`. After the move:

- `extract_vrm_rest_data` returns raw per-bone data only. No synthetic entries.
- `shotloom-retarget::vrm_rest::build_from_bytes` reads the raw `ExtractedVrmRestData` and injects the synthetic root using `mapping::VRM_ROOT_BONE` (already the source of truth).

**Why not parameterize**: passing a sentinel string into `extract_vrm_rest_data` keeps the retarget convention leaking into gltf's function signature. ADR-0025 wants gltf retarget-agnostic. Move wins cleanly.

**API change to `ExtractedVrmRestData`**: new field `root_node_index: Option<usize>` so retarget can look up the world transform without re-scanning nodes.

### Item 3 — Re-export: **Wrap in retarget-local error**

Add `crates/shotloom-retarget/src/errors.rs`:
```rust
#[derive(Debug, thiserror::Error)]
pub enum VrmLoadError {
    #[error("VRM rest extraction failed")]
    Extract(#[from] shotloom_gltf::VrmRestError),
}
```

Remove `pub use shotloom_gltf::VrmRestError` from `lib.rs`. `build_from_bytes` returns `Result<VrmRestPose, VrmLoadError>`. Downstream callers of `shotloom_retarget::VrmRestError` → update to `VrmLoadError` (grep for them first; likely just examples).

---

## Commit split (6 commits)

| # | Subject (conventional commits, ≤80 char) | What | Depends |
|---|---|---|---|
| 1 | `refactor(gltf): expose root node index in ExtractedVrmRestData` | Add `root_node_index: Option<usize>` field, populate during extraction. No synthesis change yet. | — |
| 2 | `refactor(gltf): remove root_bone synthesis from extract_vrm_rest_data` | Drop the 3 `"VRMC_vrm.root_bone"` inserts + `parent_map` fallback. | 1 |
| 3 | `feat(retarget): synthesize root_bone in build_from_bytes` | Retarget-side root synthesis using `mapping::VRM_ROOT_BONE`. | 2 |
| 4 | `test(retarget): regression for root_bone synthesis + parent fallback` | Assert `"hips"` parent is `VRM_ROOT_BONE`, root entry present. | 3 |
| 5 | `refactor(gltf): return diagnostics from extract_foot_contact_data` | Option B shape. All call sites updated. | — |
| 6 | `test(gltf): cover foot_contact diagnostics for malformed mesh fixtures` | Fixture per diagnostic code + assertion. | 5 |
| 7 | `refactor(retarget): wrap VrmRestError in VrmLoadError` | Remove re-export, add wrapper, update callers. | 5 (so retarget caller adapts to new tuple signature in the same PR) |

Execution order: **1 → 2 → 3 → 4 → 5 → 6 → 7**.

Commits 5/6 and 1–4 are independent hunks of `vrm_extract.rs`; they don't conflict but keeping the order eases review narrative.

---

## PR body outline

```markdown
## Summary

Closes STL-114. Three linked items from STL-110 follow-up:

- **P0 foot_contact** — add `Vec<VrmDiagnostic>` channel so malformed
  skin/mesh surfaces observable signal instead of silent `(0.0, 0.0), None`.
- **P1 root_bone boundary** — move root-bone synthesis from
  `shotloom-gltf::extract_vrm_rest_data` into
  `shotloom-retarget::build_from_bytes`. `shotloom-gltf` now retarget-agnostic.
- **P1 re-export** — wrap `VrmRestError` in retarget-local `VrmLoadError`.

## Design decisions

- Picked **diagnostic Vec** over `Result<_>` for foot_contact — matches
  ADR-0021 and `vrm_normalization`. Foot contact is best-effort.
- Picked **move synthesis** over sentinel-as-parameter — keeps
  `extract_vrm_rest_data` free of retarget conventions per ADR-0025.

## Validation
- cargo fmt / clippy / test / doc-paths all green
- 3 new regression tests (root_bone, diagnostic codes, wrapper error)
```

## Risks / open questions

1. **Diagnostic type import** — Is `VrmDiagnostic` directly reusable in `extract_foot_contact_data`'s return, or do we need to convert to `shotloom-common::Diagnostic` (ADR-0021)? Check both: if `shotloom-common::Diagnostic` is the right vocabulary, use it and leave `VrmDiagnostic` for normalize-specific data only.
2. **Root-bone world transform** — Moving synthesis to retarget means retarget needs the root node's world matrix. Exposing `root_node_index` is the cheap fix; a cleaner alternative is returning a `(name, Quat, Vec3)` tuple for the root as an optional "scene-root suggestion" field. Decide before commit 1.
3. **Caller fanout for `VrmLoadError`** — `pub use shotloom_gltf::VrmRestError` in retarget's `lib.rs` is used by examples and tests. Grep before commit 7; surprise downstream consumers inflate scope.

---

## Open before starting

- STL-113 (PR #97) must land. This plan assumes the post-STL-113 enum shape (`Normalize(#[from] VrmNormalizationError)`, `MissingField(&'static str)`, etc.).
- Confirm no parallel branch is mid-flight touching `vrm_extract.rs` (compare `gh pr list --head` vs main).
