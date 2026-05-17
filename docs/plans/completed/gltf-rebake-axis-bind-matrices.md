---
status: completed
created: 2026-05-14
updated: 2026-05-17
load: triggered
trigger: working STL-417 — VRM axis-bake inverse bind rebake
repo: shotloom
linear: STL-417
---

# Rebake VRM Axis-Bake Inverse Bind Matrices

## Cold-Start Summary

Shotloom already has the private `shotloom-gltf::vrm_axis_bake` Phase 2a
primary-child picker, Phase 2b local correction-quaternion calculator, and
Phase 2c rest-pose apply helper. The remaining Phase 2d gap is to update
inverseBindMatrix entries for corrected joints so the skinning equation keeps
weighted vertex world positions stable after a joint rest frame rotates. This
plan proves the IBM/skinning math directly; it does not add a generic
POSITION/JOINTS_0/WEIGHTS_0 mesh decoder. The work stays private to
`shotloom-gltf`; it does not wire `normalize_vrm`, rebuild GLB bytes from the
production import path, emit diagnostics, or bump the import cache version.

## Current State

| Surface | Class | Evidence |
|---|---|---|
| Private axis-bake module | Already Done | `crates/shotloom-gltf/src/vrm_axis_bake/mod.rs` declares private `apply`, `correction`, and `primary_child` modules. |
| Rest-pose apply loop | Partial | `crates/shotloom-gltf/src/vrm_axis_bake/apply.rs:72` exposes private `apply_axis_bake_to_nodes(&HumanoidMap, &mut [Value]) -> AxisBakeApplyStats`; it mutates node TRS only. |
| Rest-pose stats | Partial | `crates/shotloom-gltf/src/vrm_axis_bake/apply.rs:19` tracks corrected bones and transform skips, but has no inverse-bind counters. |
| Transform policy | Already Done | `apply.rs` parses TRS-only nodes, rejects matrices, non-finite values, non-positive/non-uniform scales, duplicate parents, cycles, and invalid children without panic. |
| Child compensation invariant | Already Done | `apply.rs` tests direct child world position/rotation preservation and parent-child distance preservation. |
| IBM accessor precedent | Already Done | `crates/shotloom-gltf/src/vrm_normalization.rs:982` validates `skins`, `accessors`, `bufferViews`, MAT4/FLOAT shape, byte stride, and BIN bounds before writing inverse bind matrices. |
| Matrix helper precedent | Already Done | `vrm_normalization.rs:2008` defines column-major `mat4_identity`, `trs_to_mat4`, `mat4_mul`, and `mat4_inverse` for GLB normalization. These helpers are private to `vrm_normalization.rs`. |
| Byte IO precedent | Already Done | `vrm_normalization.rs:1080` writes MAT4 floats with `to_le_bytes`; tests read MAT4 with `f32::from_le_bytes` at `vrm_normalization.rs:4161`. |
| Production pipeline wiring | Missing by design | No call to axis-bake apply exists in `normalize_vrm`; STL-417 leaves Phase 2e wiring and diagnostics out of scope. |
| Dependencies | Already Done | `crates/shotloom-gltf/Cargo.toml` already depends on `glam`; no new math dependency is needed. |
| Sibling Phase 2c plan | Consumed | `caol-ila/docs/plans/completed/gltf-apply-vrm-axis-bake-rest-pose.md` explicitly excludes mesh, skin, inverseBindMatrix, accessor, bufferView, and BIN mutation. |

## Problem

Phase 2c can rotate a target bone's local rest frame while preserving direct
children, but a vertex weighted to the corrected joint still evaluates through
the old inverseBindMatrix. The skinning equation can therefore move vertices
even when the authored mesh should remain visually stable. Phase 2d must prove
the missing invariant on a small private helper without decoding mesh vertex
buffers: for every corrected joint with a valid inverseBindMatrix entry, update
that entry so
`new_joint_global * new_inverse_bind * vertex` matches
`old_joint_global * old_inverse_bind * vertex` within epsilon.

## Locked Decisions

1. **Add a private document-parts helper; do not wire production
   `normalize_vrm`.**
   Rationale: STL-417 is Phase 2d only. A helper that accepts already-parsed
   `nodes`, `skins`, `accessors`, `bufferViews`, and BIN data proves the rebake
   against realistic GLB document parts without crossing into Phase 2e import
   wiring, diagnostics, cache invalidation, or GLB parse/rebuild policy.
   Rejected alternatives: calling from `finalize_normalized_vrm`; parsing raw
   GLB bytes inside `apply.rs`; bumping `NORMALIZED_VRM_CACHE_VERSION`; adding
   `VrmDiagnostic` output.

2. **Keep the existing rest-pose-only helper and layer rebake on top.**
   Rationale: `apply_axis_bake_to_nodes` is already test-covered as the Phase
   2c primitive. Phase 2d should add a narrower wrapper such as
   `apply_axis_bake_to_document_parts(humanoid, nodes, skins, accessors,
   buffer_views, bin_data) -> AxisBakeApplyStats`, while preserving the
   rest-pose helper for existing tests and future isolated checks. This
   document-parts signature is a private proof seam for this PR, not a locked
   Phase 2e production API; the later pipeline wiring may adapt it to operate
   from a full JSON document root to avoid awkward sibling borrows.
   Rejected alternatives: replacing the Phase 2c helper outright; requiring
   every caller/test to construct skins and BIN data; moving apply logic into
   `vrm_normalization.rs`.

3. **Update IBM entries with the old-global to new-global delta.**
   Rationale: glTF skinning evaluates a weighted vertex with
   `joint_global * inverse_bind * vertex`. To keep the result stable after a
   corrected joint global changes from `G_old` to `G_new`, write
   `IBM_new = inverse(G_new) * G_old * IBM_old`. This formula preserves
   existing IBM content, including fixtures where the old IBM is not simply
   `inverse(G_old)`.
   Rejected alternatives: `IBM_new = inverse(G_new)` only, which discards
   authored bind data; multiplying by `q_corr_local.inverse()` only, which
   ignores parent transforms and translation/scale; updating child joint IBMs
   whose globals were preserved by Phase 2c compensation.

4. **Record old/new globals for corrected target joints during the apply
   loop.**
   Rationale: Phase 2c recomputes transform state per target because parent
   corrections change child locals. The rebake needs the exact old and new
   global matrix for each corrected target joint. Capture those pairs at the
   same point the target rotation is written, then process IBM entries from the
   captured list.
   Rejected alternatives: deriving all IBM deltas from one stale global
   snapshot; recomputing old globals after mutation; iterating skin joints and
   guessing which transforms changed from JSON diff alone.

5. **Use local matrix helpers in `vrm_axis_bake`, backed by `glam` or small
   column-major arrays.**
   Rationale: `vrm_normalization.rs` already proves the column-major layout,
   but its helpers are private and tied to 180Y normalization. Phase 2d can add
   private helpers in `apply.rs` or an adjacent `matrix.rs` without changing
   public API. `glam::Mat4` is already available if it keeps the code clearer.
   Rejected alternatives: making `vrm_normalization.rs` matrix helpers public;
   adding a new dependency; duplicating large parsing surfaces outside
   `vrm_axis_bake`.

6. **Treat malformed or absent skin data as a non-fatal skip with stats.**
   Rationale: STL-417 requires missing or malformed skin, mesh, and IBM inputs
   to skip without panic. Unlike production `normalize_vrm_bones_180y`, this
   private proof helper is not yet the import-time validation boundary, so it
   should not return `VrmNormalizationError` or emit diagnostics. Add
   observability through stats fields such as `rebaked_inverse_bind_matrices`,
   `skipped_missing_inverse_bind`, and `skipped_invalid_inverse_bind`.
   Rejected alternatives: failing the whole helper with typed errors; silently
   swallowing every malformed IBM case with no test-visible counter; defaulting
   invalid matrices to identity.

7. **Test vertex preservation with the skinning equation, not a full mesh
   decoder.**
   Rationale: The load-bearing invariant is mathematical:
   `G_new * IBM_new * v ~= G_old * IBM_old * v` for weighted vertices. A small
   synthetic fixture can include skin JSON and one logical vertex vector in the
   test without building a generic POSITION/JOINTS_0/WEIGHTS_0 mesh decoder,
   which belongs to Phase 2e or later validation tooling.
   Rejected alternatives: testing only IBM byte changes; adding a general glTF
   mesh reader; relying on real VRM fixtures before production wiring exists.

8. **No durable docs outside the plan unless implementation changes a
   durable contract.**
   Rationale: Phase 2d adds private code and unit tests only. The user-visible
   normalization behavior starts at Phase 2e, where diagnostics, cache
   invalidation, and pipeline docs become relevant.
   Rejected alternatives: updating `MAP.md`, bridge docs, architecture docs, or
   ADRs for a private helper that remains unwired.

## Non-Goals

- Production `normalize_vrm` or `finalize_normalized_vrm` wiring.
- GLB parse/rebuild integration in the import pipeline.
- `NormalizedVrmAsset` byte changes observable from `normalize_vrm`.
- `NORMALIZED_VRM_CACHE_VERSION` changes.
- `VrmDiagnostic`, bridge diagnostic, or command rejection changes.
- Generic mesh decoding for POSITION / JOINTS_0 / WEIGHTS_0 accessors.
- Retarget `DEFAULT_POSE` recalibration.
- `shotloom-retarget` rig-branch elimination.
- Thumb CMC alignment.
- Public `shotloom-gltf` API changes.
- ADR, bridge contract, `MAP.md`, or validation-spec updates.

## Implementation Plan

### S0 — Baseline Re-Check

Run before edits:

```bash
git status --short
rg -n "apply_axis_bake_to_nodes|AxisBakeApplyStats|inverseBindMatrices|MAT4_BYTE_LEN|mat4_" crates/shotloom-gltf/src
rg -n "NORMALIZED_VRM_CACHE_VERSION|apply_axis_bake_to_nodes" crates/shotloom-import crates/shotloom-gltf/src/vrm_normalization.rs
```

Expected:
- worktree is clean.
- `apply_axis_bake_to_nodes` exists only in the private axis-bake module/tests.
- inverseBindMatrix write precedent exists only in `vrm_normalization.rs`.
- no production axis-bake apply call exists in `normalize_vrm`.
- cache version remains unchanged.

### S1 — Extend Private Stats and Correction Capture

Modify:

```text
crates/shotloom-gltf/src/vrm_axis_bake/apply.rs
```

Changes:
- Add private stats fields for inverse-bind work:
  `rebaked_inverse_bind_matrices`, `skipped_missing_inverse_bind`, and
  `skipped_invalid_inverse_bind` or equivalent names.
- Factor the Phase 2c apply loop so it can collect
  `CorrectedJoint { node_index, old_global_matrix, new_global_matrix }` for
  every target bone whose local rest rotation actually changed.
- Keep `apply_axis_bake_to_nodes(&HumanoidMap, &mut [Value])` available and
  returning the same rest-pose behavior for existing tests.
- Do not expose any helper outside `vrm_axis_bake`.

### S2 — Add Matrix and IBM Access Helpers

Add private helpers in `apply.rs` or a private sibling module:
- TRS/global transform to column-major matrix, matching glTF MAT4 storage and
  the `vrm_normalization.rs` helper convention (`matrix[column * 4 + row]`).
- MAT4 accessor metadata reader for `componentType = 5126`, `type = "MAT4"`,
  `count`, `bufferView`, optional accessor `byteOffset`, optional
  bufferView `byteOffset`, `byteLength`, and optional `byteStride`.
- MAT4 read/write helpers using little-endian f32 values.
- Bounds checks using checked arithmetic or saturating-free explicit checks so
  malformed offsets cannot panic.

Reuse the shape of `vrm_normalization.rs:982-1084`, but adapt failure handling
to skip/stats rather than typed errors.

### S3 — Implement Private Document-Parts Rebake Helper

Add a helper with a shape close to:

```rust
pub(super) fn apply_axis_bake_to_document_parts(
    humanoid: &HumanoidMap,
    nodes: &mut [Value],
    skins: &[Value],
    accessors: &[Value],
    buffer_views: &[Value],
    bin_data: &mut [u8],
) -> AxisBakeApplyStats
```

Behavior:
1. Run the same root-to-leaf rest-pose correction as Phase 2c.
2. Capture old/new global matrices for every corrected target node.
3. Build a map from corrected node index to its old/new global matrices.
4. For each skin with `joints` and `inverseBindMatrices`, find joint slots
   whose node index was corrected.
5. Read the old IBM matrix from the accessor slot.
6. Write `IBM_new = inverse(G_new) * G_old * IBM_old` into the same accessor
   slot.
7. Increment rebake stats per written matrix.
8. Skip absent skin/IBM data and malformed accessor/bufferView/BIN shapes
   without panicking.

### S4 — Pin Synthetic Tests

Add or extend tests in `apply.rs`:
- One corrected joint with one logical weighted vertex proves
  `new_global * new_ibm * vertex` matches the pre-rebake world position.
- One mixed-weight vertex split across a corrected joint and an uncorrected
  joint proves slot indexing and untouched-joint behavior compose correctly.
- Existing Phase 2c child-world and parent-child distance tests remain green.
- Existing canonical/no-op input does not rewrite JSON or IBM bytes.
- A non-identity old IBM is preserved through the delta formula, proving the
  helper does not blindly replace with `inverse(G_new)`.
- Multiple skins or multiple joint slots update only corrected joint slots.
- Missing `skins`, missing `inverseBindMatrices`, missing `accessors`, missing
  `bufferViews`, out-of-range indices, wrong component type, wrong accessor
  type, count mismatch, too-small stride, and out-of-bounds BIN ranges skip
  without panic and leave bytes unchanged.
- Byte-stride greater than 64 writes the correct matrix slot and preserves
  padding bytes.
- Matrix/unsupported TRS cases still skip through the existing transform stats.

### S5 — Scope Guard Re-Read

After implementation, verify:
- no call to the document-parts helper from `vrm_normalization.rs`.
- no diff in `crates/shotloom-import/src/lib.rs`.
- no new `VrmDiagnostic` code or severity.
- no public `pub use` from `crates/shotloom-gltf/src/lib.rs`.
- no docs outside this private helper's code comments.
- `git diff` shows the PR is limited to private `vrm_axis_bake` code/tests
  unless a small private module split is cheaper and justified.

## Acceptance Criteria

- [ ] A private inverseBindMatrix rebake path exists inside
      `shotloom-gltf::vrm_axis_bake`.
- [ ] Existing rest-pose apply behavior remains available through
      `apply_axis_bake_to_nodes`.
- [ ] Corrected joint IBM entries are updated with
      `inverse(G_new) * G_old * IBM_old`.
- [ ] A synthetic weighted-vertex test proves world position preservation
      within L2 epsilon after rest-pose correction and IBM rebake.
- [ ] A mixed corrected/uncorrected joint weighted-vertex test proves only the
      corrected joint slot is rebaked and blended world position is preserved.
- [ ] Existing child world transform and parent-child distance preservation
      tests remain green.
- [ ] Canonical/no-op input leaves node JSON and IBM bytes unchanged or
      identity-equivalent.
- [ ] Missing or malformed skin, accessor, bufferView, inverseBindMatrix, and
      BIN data skip without panic and leave bytes unchanged.
- [ ] Strided MAT4 accessors are handled without overwriting padding.
- [ ] No production `normalize_vrm` wiring, diagnostics, cache-version bump,
      public API export, or durable doc update lands in this PR.
- [ ] `cargo test -p shotloom-gltf vrm_axis_bake` passes.
- [ ] `cargo clippy -p shotloom-gltf -- -D warnings` passes.

## Verification

Focused gates:

```bash
cargo fmt --check
cargo test -p shotloom-gltf vrm_axis_bake
cargo clippy -p shotloom-gltf -- -D warnings
git diff -- crates/shotloom-import/src/lib.rs
rg -n "apply_axis_bake_to_document_parts|apply_axis_bake_to_nodes" crates/shotloom-gltf/src/vrm_normalization.rs crates/shotloom-gltf/src/lib.rs
```

Broad gates before commit/push:

```bash
cargo check --workspace --exclude shotloom-desktop
cargo test --workspace --exclude shotloom-desktop
node scripts/validate-doc-paths.mjs
node scripts/validate-ci-rust-coverage.mjs
```

Manual repro:
- N/A: this PR has no editor, bridge, runtime command, user-facing diagnostic,
  or import-pipeline behavior. The manual-equivalent evidence is the synthetic
  skinning-equation unit test.

Review gate:
- After push, run `/shotloom-review-before-pr` in the same turn per Shotloom
  worktree rules before opening a PR.

## Traps

- Do not wire this helper into `normalize_vrm`; that turns the work into Phase
  2e and requires diagnostics plus cache invalidation decisions.
- Do not replace IBM with `inverse(G_new)` unconditionally; that erases any
  existing authored inverse-bind content.
- Do not update child joint IBMs merely because their parent was corrected;
  Phase 2c compensation preserves child globals, so only joints whose own
  global matrix changes need rebake.
- Do not treat malformed accessors like production validation errors in this
  private helper; STL-417 asks for panic-free skip behavior.
- Do not add generic mesh decoding to prove the vertex invariant; use the
  skinning equation directly in focused tests.

## Follow-Up Candidates

- Phase 2e: wire axis-bake into `finalize_normalized_vrm`, emit diagnostics,
  rebuild normalized GLB bytes, and bump the normalized VRM cache version.
- Phase 2f: recalibrate retarget `DEFAULT_POSE` deltas after normalized
  geometry is observable through import.
- Phase 2.5: remove rig-specific retarget branches once Phase 2 visuals are
  stable.
- Phase 3: thumb CMC alignment algorithm.
- Optional shared matrix/accessor utility if multiple future glTF mutation
  passes need the same private helpers.
