---
status: open
created: 2026-05-14
updated: 2026-05-14
load: triggered
trigger: working STL-419 — VRM axis-bake normalize_vrm wiring and diagnostic
repo: shotloom
linear: STL-419
---

# Wire VRM Axis-Bake Into normalize_vrm

## Cold-Start Summary

Shotloom now has the private Phase 2a-2d VRM axis-bake primitives in
`shotloom-gltf`: primary-child selection, correction-quaternion math,
rest-pose TRS application, direct child compensation, and inverse bind matrix
rebake. The remaining Phase 2e gap is production wiring: `normalize_vrm`
still returns only VRM0 conversion, 180Y cleanup, thumb-slot quality
diagnostics, validation diagnostics, and metadata summary. This plan wires the
existing private primitive into the normalization tail, emits one import-visible
diagnostic only when the pass mutates the artifact, keeps canonical no-op inputs
byte-stable, and bumps the native normalized-VRM cache if bytes can change.
Round 1 review judges this as one reviewable PR because it touches one
normalization boundary, one existing private primitive family, its cache/docs
contract, and focused tests; retarget pose recalibration, rig-branch removal,
thumb CMC work, and editor UI changes stay out of scope.

## Current State

| Surface | Class | Evidence |
|---|---|---|
| Production VRM normalizer | Partial | `crates/shotloom-gltf/src/vrm_normalization.rs` routes VRM1 and VRM0 through `normalize_vrm_bones_180y` and then `finalize_normalized_vrm`, but `finalize_normalized_vrm` only parses JSON with `parse_glb_json`, appends thumb-slot quality and validation diagnostics, extracts metadata, and returns `normalized.bytes`. |
| GLB parse/rebuild helpers | Already Done | `vrm_normalization.rs` has private `parse_glb(data) -> GlbParts` and `rebuild_glb(json, bin) -> Vec<u8>` helpers used by normalization code. |
| Axis-bake private primitive | Partial | `crates/shotloom-gltf/src/vrm_axis_bake/apply.rs` has `pub(super) fn apply_axis_bake_to_nodes` and private `fn apply_axis_bake_to_document_parts(...) -> AxisBakeApplyStats`; the document-parts helper mutates nodes and BIN data, but it is not callable from `vrm_normalization.rs` through `vrm_axis_bake/mod.rs`. |
| Axis-bake stats | Partial | `AxisBakeApplyStats` tracks corrected bones, compensated children, no-op alignment, skipped transform/correction/hierarchy cases, rebaked inverse bind matrices, missing inverse bind matrices, and malformed inverse bind inputs, but the type is only `pub(super)` to `vrm_axis_bake` today and cannot be named by sibling `vrm_normalization.rs`. |
| Humanoid map extraction | Partial | `crates/shotloom-gltf/src/vrm_extract.rs` has private `build_humanoid_node_map` and public `extract_humanoid_map`, but `extract_humanoid_map` calls `crate::normalize_vrm` first, so production wiring must not call it from inside `normalize_vrm`. |
| Diagnostic type and conversion | Already Done | `VrmDiagnostic` has `Warning`, `Error`, and `Info` severities in `vrm_normalization.rs`; `shotloom-import/src/lib.rs` maps all three through `convert_vrm_diagnostic`; engine direct import maps them in `crates/shotloom-engine/src/bridge/handlers/assets.rs`. |
| Native normalized VRM cache | Partial | `crates/shotloom-import/src/lib.rs` uses `NORMALIZED_VRM_CACHE_VERSION = "v3"`, previously bumped for normalized-byte changes from VRM1 180Y correction. |
| Fixture precedent | Already Done | `assets/README.md` defines VRM fixture naming and `_backward`; `crates/shotloom-gltf/tests/vrm1_backward_fixture.rs` covers yoya/minjoon backward normalization and idempotence; `crates/shotloom-gltf/tests/vrm_thumb_slot_quality.rs` covers fixture diagnostics on yoya/minjoon. |
| Diagnostics spec | Partial | `docs/specs/vrm-character-validation.md` documents 180Y normalization and the `VrmDiagnostic` boundary, but has no axis-bake diagnostic row yet. |
| Sibling Phase 2d plan | Consumed | `caol-ila/docs/plans/gltf-rebake-axis-bind-matrices.md` explicitly excluded `normalize_vrm` wiring, diagnostics, and cache bump, and names them as Phase 2e follow-up. |
| Sibling thumb-slot plan | Consumed | `caol-ila/docs/plans/gltf-repair-vrm1-thumb-slots.md` uses the same `finalize_normalized_vrm` tail, parse/rebuild, no-op byte-stability, and cache-version reasoning; its planned v4 cache note is stale relative to current live code still being v3. |

## Problem

The private axis-bake primitive can canonicalize humanoid bone rest axes and
rebake inverse bind matrices, but no production import path calls it. As a
result, normalized artifacts written by `shotloom-import`, spawned by engine
direct import, or inspected by downstream rest-pose code still carry the
pre-Phase-2 bone-axis state. Phase 2e must connect the primitive at the
normalization boundary without widening public API, without introducing
recursive normalization, and without weakening existing VRM validation or
diagnostic contracts.

## Locked Decisions

1. **Wire the pass inside `finalize_normalized_vrm`, after 180Y cleanup and
   before validation/metadata extraction.**
   Rationale: both VRM1 sources and VRM0-converted sources already converge at
   `finalize_normalized_vrm` after `normalize_vrm_bones_180y`. Running
   axis-bake there means validation, metadata extraction, import diagnostics,
   and cache bytes observe the final artifact. The sibling thumb-slot plan used
   the same tail-stage parse/rebuild placement for normalized JSON mutation.
   Rejected alternatives: calling from `convert_vrm0`, which misses native
   VRM1; calling before 180Y cleanup, which would compute rest axes in the
   wrong frame; calling from `shotloom-import`, which misses engine direct
   import and violates ADR-0030's `shotloom-gltf` ownership of pre-normalized
   GLB bytes.

2. **Add a crate-private axis-bake document helper; do not expose a public API.**
   Rationale: `apply_axis_bake_to_document_parts` already has the right
   primitive shape but is private to `apply.rs`. `vrm_axis_bake/mod.rs` should
   expose a `pub(crate)` wrapper usable by sibling `vrm_normalization.rs`.
   Because `pub(super)` inside `apply.rs` only reaches the `vrm_axis_bake`
   module, the wrapper must also return either a `pub(crate)` stats type or a
   narrower `pub(crate)` summary with the fields the finalizer needs for
   mutation and diagnostic counts. Keep `shotloom-gltf`'s public exports
   unchanged. ADR-0030 places this work below normalizer crates and does not
   require a stable API.
   Rejected alternatives: making `apply_axis_bake_to_document_parts` public;
   using `pub(super)` and then trying to call it from a sibling module; moving
   axis-bake code into `vrm_normalization.rs`; duplicating the rebake logic in
   the normalizer tail.

3. **Build the humanoid map directly from the already-parsed normalized JSON.**
   Rationale: `extract_humanoid_map` is public but calls `normalize_vrm`, so
   using it inside `normalize_vrm` would recurse. The production helper should
   reuse or factor the existing `build_humanoid_node_map` logic so the pass can
   construct a `HumanoidMap` from `/extensions/VRMC_vrm/humanoid/humanBones`
   and `nodes.len()` on the in-flight JSON.
   Rejected alternatives: calling `extract_humanoid_map`; hand-parsing a
   separate, incompatible map shape in `vrm_normalization.rs`; skipping the
   pass when public extraction would recurse.

4. **Emit a single `Info` diagnostic only when at least one bone is corrected.**
   Rationale: Existing normalization repairs that change bytes but preserve a
   usable asset, such as `normalized_backward_root_180y` and
   `vrm0_synthesized_meta`, are `Info`. Axis-bake is an automatic
   canonicalization, not a user-actionable validation failure. STL-291's older
   umbrella text says `Diagnostic::warning`, but STL-419 narrows Phase 2e to
   choosing a `VrmDiagnostic` code/severity/message; live code and
   `docs/tech-debt/vrm-backward-facing-audit-policy.md` keep automatic
   normalization repairs at `Info` until a stronger import policy is decided.
   The diagnostic should have a distinct code such as
   `normalized_vrm_axis_bake`, include counts for corrected bones, compensated
   children, and rebaked inverse bind matrices, and remain silent for no-op
   canonical rigs.
   Rejected alternatives: `Warning`, which overstates a successful repair and
   conflicts with current 180Y precedent; emitting one diagnostic per bone,
   which is noisy for normal imports; emitting a no-op diagnostic for
   canonical rigs, which trains users to ignore diagnostics.

5. **Rebuild GLB bytes only when axis-bake mutates nodes or BIN data.**
   Rationale: The existing 180Y normalizer returns the input bytes unchanged
   when no 180Y root exists, and the no-op test asserts byte identity for a
   forward VRM1 fixture. Canonical VRoid inputs should preserve that behavior:
   parse the GLB once, run the pass, and call `rebuild_glb` only when
   `corrected_bones > 0` or `rebaked_inverse_bind_matrices > 0`.
   Rejected alternatives: always rebuilding after parse, which changes bytes
   even when the semantic pass is no-op; using JSON string surgery; treating
   no-op stats as a diagnostic-worthy event.

6. **Bump `NORMALIZED_VRM_CACHE_VERSION` from `v3` to `v4` when production
   bytes can change.**
   Rationale: STL-419 makes normalized artifacts differ for noncanonical rigs.
   The native import cache key currently uses source hash plus version, so old
   v3 artifacts would otherwise be reused even though the normalizer contract
   changed. The existing v2 -> v3 comment is the precedent for byte-affecting
   normalization changes.
   Rejected alternatives: relying on same-path rewrite when bytes differ,
   which does not help callers that already have a v3 artifact; skipping the
   bump because engine direct import has no native cache; changing cache path
   shape beyond the version segment.

7. **Keep malformed skin/IBM inputs non-fatal inside axis-bake and let
   structural validation remain the hard-gate owner.**
   Rationale: The Phase 2d primitive already records skipped missing or invalid
   inverse bind data without panicking. Phase 2e should preserve that behavior
   so malformed optional skin data does not turn an otherwise parseable VRM
   into a new normalization error. Existing `validate_normalized_vrm_json`
   remains responsible for structural hard-gate diagnostics.
   Rejected alternatives: returning `VrmNormalizationError` for every malformed
   IBM path; silently dropping skip counters; adding a new command rejection
   code.

8. **Keep `debug_normalize_vrm_stages.normalized_bytes` equal to the final
   production normalized bytes.**
   Rationale: STL-419 requires the staging helper or an equivalent debug path
   to observe Phase 2e results. The existing struct already has one
   `normalized_bytes` field, so update the helper to run the same axis-bake
   tail and avoid a new wire/debug schema.
   Rejected alternatives: adding a new `axis_baked_bytes` field; leaving debug
   output at the post-180Y/pre-axis-bake stage; adding a separate public debug
   API.

## Non-Goals

- Phase 2f retarget `arp_vrm_user_pose::DEFAULT_POSE` delta recalibration.
- Phase 2.5 `shotloom-retarget` rig-branch elimination.
- Phase 3 thumb CMC alignment algorithm.
- Editor UI, command payload, or bridge protocol changes.
- Generic mesh decoder or vertex-buffer inspection beyond existing IBM rebake.
- Changing `NormalizedVrmAsset` or `VrmNormalizationDebugStages` public fields.
- Adding dependencies or moving axis-bake modules out of `shotloom-gltf`.
- New ADRs or roadmap scope.
- Treating axis-bake skip counters as command rejections.
- Changing existing 180Y diagnostic codes or severity.

## Implementation Plan

### S0 — Baseline Re-Check

Run before edits:

```bash
git status --short
rg -n "finalize_normalized_vrm|debug_normalize_vrm_stages|parse_glb\\(|rebuild_glb\\(" crates/shotloom-gltf/src/vrm_normalization.rs
rg -n "apply_axis_bake_to_document_parts|AxisBakeApplyStats|HumanoidMap|build_humanoid_node_map" crates/shotloom-gltf/src
rg -n "NORMALIZED_VRM_CACHE_VERSION|convert_vrm_diagnostic" crates/shotloom-import/src/lib.rs crates/shotloom-engine/src/bridge/handlers/assets.rs
```

Expected:
- Shotloom worktree is clean.
- `apply_axis_bake_to_document_parts` is still private to `apply.rs`.
- `extract_humanoid_map` still calls `normalize_vrm`.
- cache version is still `v3`.

### S1 — Make the Private Primitive Callable From Normalization

Modify:

```text
crates/shotloom-gltf/src/vrm_axis_bake/apply.rs
crates/shotloom-gltf/src/vrm_axis_bake/mod.rs
```

Changes:
- Expose the document-parts helper to the parent crate with the narrowest
  visibility needed by sibling `vrm_normalization.rs`: a `pub(crate)` wrapper
  from `vrm_axis_bake/mod.rs`, plus either a `pub(crate)` `AxisBakeApplyStats`
  or a smaller `pub(crate)` output summary.
- Keep `apply_axis_bake_to_nodes` available for existing unit tests.
- Add an `AxisBakeApplyStats` method or local helper that answers whether the
  pass changed the artifact, using at least `corrected_bones` and
  `rebaked_inverse_bind_matrices`.
- Do not `pub use` anything from `shotloom-gltf/src/lib.rs`.

### S2 — Add Non-Recursive Humanoid Map Construction

Modify one of:

```text
crates/shotloom-gltf/src/vrm_extract.rs
crates/shotloom-gltf/src/vrm_normalization.rs
```

Preferred shape:
- Factor `build_humanoid_node_map` into a `pub(crate)` helper or add a small
  `pub(crate) fn humanoid_map_from_normalized_json(json: &Value, bytes: Vec<u8>)
  -> Result<HumanoidMap, VrmRestError>` that does not call `normalize_vrm`.
- From the normalizer tail, pass the already-parsed JSON and final bytes after
  180Y cleanup.
- If the humanoid map cannot be built because `humanBones` is missing or a
  mapped node index is invalid, skip axis-bake and rely on the existing
  `validate_normalized_vrm_json` diagnostics (`missing_humanoid_bones`,
  `missing_required_bone`, `invalid_humanoid_bone_node`) that run later in the
  same tail. Do not add a second axis-bake-specific validation diagnostic for
  the same malformed metadata.

### S3 — Wire Axis-Bake Into the Finalizer Tail

Modify:

```text
crates/shotloom-gltf/src/vrm_normalization.rs
```

Changes:
1. Replace the current `parse_glb_json(&normalized.bytes)?` tail with
   `parse_glb(&normalized.bytes)?` so JSON and BIN are both available.
2. Build the humanoid map from the parsed JSON without calling
   `extract_humanoid_map`.
3. Borrow `nodes`, `skins`, `accessors`, and `bufferViews` from the JSON into
   the document-parts helper and pass mutable BIN data.
4. When the stats report mutation, rebuild bytes with `rebuild_glb(json, bin)?`.
5. Push one `VrmDiagnostic::info` with code `normalized_vrm_axis_bake`, a
   concise count-based message, and no `asset_context`.
6. Run thumb-slot quality diagnostics, structural validation, and metadata
   extraction on the post-axis-bake JSON.
7. Preserve existing 180Y diagnostic text byte-for-byte.

If Rust borrow rules make simultaneous sibling borrows too awkward, add a
private JSON-root wrapper inside `vrm_axis_bake` that owns the sibling lookup
and calls the document-parts helper internally.

### S4 — Keep Debug Stages Aligned

Modify:

```text
crates/shotloom-gltf/src/vrm_normalization.rs
```

Changes:
- Refactor the shared post-180Y tail enough that `debug_normalize_vrm_stages`
  can return the same final `normalized_bytes` as `normalize_vrm`.
- Do not add fields to `VrmNormalizationDebugStages`.
- Keep `converted_vrm1_bytes` as the post-VRM0-conversion/pre-normalization
  bytes it already represents.
- Add or update a debug-stage regression that compares
  `debug_normalize_vrm_stages(input).normalized_bytes` with
  `normalize_vrm(input).normalized_bytes` for at least one axis-baked fixture.

### S5 — Bump Native Cache Version and Document Diagnostic Code

Modify:

```text
crates/shotloom-import/src/lib.rs
docs/specs/vrm-character-validation.md
```

Changes:
- Change `NORMALIZED_VRM_CACHE_VERSION` from `"v3"` to `"v4"` and update the
  adjacent comment to name axis-bake rest-pose + inverse bind rebake.
- Add `normalized_vrm_axis_bake` to the `Info-only diagnostics` table in
  `docs/specs/vrm-character-validation.md`, and add a short normalization
  paragraph near `Backward-facing root normalization` describing that the pass
  aligns humanoid local +Y axes to primary children and rebakes inverse bind
  matrices while preserving no-op canonical inputs.
- Do not change engine bridge contracts; existing diagnostic mapping is enough.
- Do not change runtime character-thumbnail cache salts; that cache key already
  includes `normalized_vrm_sha256`, so changed normalized bytes naturally create
  a different thumbnail key.

### S6 — Pin Focused Tests

Modify or add tests in:

```text
crates/shotloom-gltf/src/vrm_axis_bake/apply.rs
crates/shotloom-gltf/tests/vrm_axis_bake_normalization.rs
crates/shotloom-gltf/tests/vrm1_backward_fixture.rs
crates/shotloom-import/src/lib.rs
```

Coverage:
- Canonical VRoid 1.x fixture stays byte-identical and emits no
  `normalized_vrm_axis_bake` diagnostic.
- yoya and minjoon backward fixtures produce normalized bones whose local +Y
  points toward the chosen primary child after `normalize_vrm`.
- At least one VRM0 fixture proves the converted path also gets axis-baked.
- The local +Y assertion uses the post-normalize JSON and the same
  primary-child policy as production; it must not call `extract_humanoid_map`
  in a way that hides a failed first pass behind a second normalization.
- Applying `normalize_vrm` twice is idempotent for a fixture that axis-bakes on
  the first pass.
- Existing malformed/missing IBM unit tests remain non-panicking; add a
  production-tail regression if needed to prove skip behavior survives parse
  and rebuild wiring.
- Cache path/version test expects `vrm/v4/<hash>.normalized.vrm`.

## Acceptance Criteria

- [ ] `normalize_vrm` calls the axis-bake rest-pose + inverse bind rebake pass
      for both VRM1 and VRM0-converted sources.
- [ ] Canonical VRoid 1.x input remains no-op and byte-stable, with no
      `normalized_vrm_axis_bake` diagnostic.
- [ ] yoya, minjoon, and at least one `vrm0x-*` fixture have local +Y aligned
      to the selected primary child after normalization.
- [ ] A single `Info` `VrmDiagnostic` with code `normalized_vrm_axis_bake`
      appears only when axis-bake changes the artifact.
- [ ] Missing or malformed skin/inverseBindMatrices inputs skip without panic
      and do not conflict with existing validation diagnostics.
- [ ] `NORMALIZED_VRM_CACHE_VERSION` is bumped to `v4` with a comment naming
      the normalized-byte contract change.
- [ ] `debug_normalize_vrm_stages(...).normalized_bytes` matches the final
      production normalized bytes for axis-baked inputs.
- [ ] `cargo test -p shotloom-gltf vrm_axis_bake` passes.
- [ ] `cargo clippy -p shotloom-gltf -- -D warnings` passes.

## Verification

- Focused: `cargo test -p shotloom-gltf vrm_axis_bake`
- Focused: `cargo test -p shotloom-gltf --test vrm1_backward_fixture`
- Focused: `cargo test -p shotloom-gltf --test vrm_axis_bake_normalization`
- Focused cache check: `cargo test -p shotloom-import normalized_artifact_path`
- Required lint: `cargo clippy -p shotloom-gltf -- -D warnings`
- Broader Rust gate before PR: `pnpm validate:rust`
- Broader tests before PR if time permits or shared behavior moved:
  `pnpm test:rust`
- Manual diagnostic repro: import or normalize a backward fixture and confirm
  one `Info` diagnostic with code `normalized_vrm_axis_bake`.
- Manual no-op repro: normalize canonical `vrm1x-vroid-f-xiao.vrm` and confirm
  no `normalized_vrm_axis_bake` diagnostic and byte-identical output.

## Traps

- Do not call `extract_humanoid_map` from inside `normalize_vrm`; it calls
  `normalize_vrm` and would recurse.
- Do not call `extract_humanoid_map` in fixture assertions if that would
  normalize the already-normalized output again and mask the first-pass result.
- Do not always rebuild GLB bytes after parsing; canonical no-op byte identity
  is an existing normalization invariant.
- Do not promote axis-bake to `Warning` without an explicit policy decision;
  current automatic normalization repairs are `Info`.
- Do not make axis-bake a public `shotloom-gltf` API just to cross a module
  boundary.
- Do not let cache v3 serve post-axis-bake artifacts after normalized bytes
  change.
- Do not touch runtime thumbnail cache versions for this normalized-byte change;
  the thumbnail key already includes the normalized VRM hash.

## Follow-Up Candidates

- Phase 2f: recalibrate `arp_vrm_user_pose::DEFAULT_POSE` delta against the
  new canonical axis-baked normalized artifacts.
- Phase 2.5: remove downstream retarget rig branches that axis-bake makes
  obsolete.
- Phase 3: thumb CMC alignment algorithm.
- Decide whether backward-facing and axis-bake diagnostics should eventually
  become warnings for imported third-party assets.
- Add a reusable non-public VRM fixture analysis helper if more normalization
  passes need local-axis assertions.
