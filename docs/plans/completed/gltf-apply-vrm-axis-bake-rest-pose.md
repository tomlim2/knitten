---
status: completed
created: 2026-05-14
updated: 2026-05-17
load: triggered
trigger: working STL-409 — VRM axis-bake rest-pose application
repo: shotloom
linear: STL-409
---

# Apply VRM Axis-Bake Correction to Rest Pose

## Cold-Start Summary

Shotloom already has the Phase 2a primary-child picker and Phase 2b
local correction-quaternion calculator under the private
`shotloom-gltf::vrm_axis_bake` module. The remaining Phase 2c slice is a
private `apply` module that mutates synthetic GLB `nodes[]` JSON in tests:
for each eligible humanoid bone, choose the primary child, compute
`q_corr_local`, apply `bone.local_rest = bone.local_rest * q_corr_local`,
and compensate direct children with `q_corr_local.inverse()` so their world
rest transforms stay fixed. This plan excludes production `normalize_vrm`
wiring, diagnostics, cache-version changes, mesh skinning, and
inverseBindMatrix rebake.

## Current State

| Surface | Class | Evidence |
|---|---|---|
| Private axis-bake module root | Partial | `crates/shotloom-gltf/src/vrm_axis_bake/mod.rs` declares `mod correction;` and `mod primary_child;`; no `apply` module exists. |
| Primary-child topology policy | Already Done | `crates/shotloom-gltf/src/vrm_axis_bake/primary_child.rs` selects direct children from `&HumanoidMap` plus `nodes[]`, skips malformed children, and has synthetic JSON tests. |
| Correction quaternion math | Already Done | `crates/shotloom-gltf/src/vrm_axis_bake/correction.rs` computes local-space `q_corr_local` and tests right-multiply application, invalid inputs, and opposite-direction fallback. |
| Helper visibility | Partial | `primary_child_for_humanoid_bone` and `correction_for_primary_child` are private file-local functions with `#[allow(dead_code)]`; sibling `apply.rs` cannot call them yet. |
| Rest-pose extraction precedent | Partial | `crates/shotloom-gltf/src/vrm_extract.rs` parses TRS nodes, builds parent maps, resolves global matrices, and exposes `HumanoidMap`, but its `NodeLocal` helpers are private and its JSON parsing defaults malformed components instead of using the stricter skip policy this apply helper needs. |
| GLB normalization mutation precedent | Out of scope | `crates/shotloom-gltf/src/vrm_normalization.rs` has parse/rebuild helpers and 180Y mutation logic, but STL-409 says not to wire production `normalize_vrm`. |
| Cache version | Already Done for prior phase | `crates/shotloom-import/src/lib.rs` keeps `NORMALIZED_VRM_CACHE_VERSION = "v3"`; STL-409 does not change normalized artifacts. |
| T-pose appearance validation | Out of scope | `docs/specs/vrm-character-validation.md` and `docs/tech-debt/vrm-tpose-appearance-validation.md` place mesh-skinning appearance validation outside local rotation-only checks. |
| Plan sibling Phase 2a | Already Done | `agent-hub/docs/plans/completed/gltf-add-axis-primary-child-picker.md` locks private module, no byte mutation, no cache bump, synthetic JSON tests. |
| Plan sibling Phase 2b | Already Done | `agent-hub/docs/plans/completed/gltf-add-axis-correction-calculator.md` locks right-multiply local correction, invalid-input `None`, no rest-pose mutation. |

## Problem

The existing axis-bake helpers prove how to choose a child and how to compute a
local correction, but no code applies the correction to GLB node rest
transforms. Without a small apply slice, the next phase cannot prove the core
rest-pose invariant before mesh and inverse-bind work begins: target bone local
`+Y` points at the chosen primary child while direct child world transforms and
parent-child distances stay fixed.

## Locked Decisions

1. **Add only `vrm_axis_bake::apply` in this PR.**
   Rationale: STL-409 names Phase 2c as rest pose / child compensation only.
   Phase 2a and 2b already landed the topology and math primitives. Keeping
   this PR private and JSON-test-only gives Phase 2d a verified rest-pose
   invariant before mesh rebake.
   Rejected alternatives: wiring `normalize_vrm`, rebuilding GLB bytes,
   emitting diagnostics, bumping `NORMALIZED_VRM_CACHE_VERSION`, rebaking mesh
   skinning, or updating retarget defaults in this PR.

2. **Expose existing helpers only inside `vrm_axis_bake`.**
   Rationale: `apply.rs` needs `primary_child_for_humanoid_bone` and
   `correction_for_primary_child`, but no downstream crate needs either
   helper. Change both functions to `pub(super) fn` and call them from
   `apply.rs` through sibling module paths; keep `shotloom-gltf`'s public API
   unchanged and do not add module-root re-exports.
   Rejected alternatives: `pub`/`pub(crate)` exports from `shotloom-gltf`, or
   duplicating primary-child and correction logic inside `apply.rs`.

3. **Use a narrow apply API over `&HumanoidMap` and mutable `nodes[]`.**
   Rationale: STL-409 explicitly scopes the implementation to humanoid map plus
   `nodes[]`; this mirrors the Phase 2a picker input and avoids raw GLB parse /
   rebuild behavior. Private shape:
   `apply_axis_bake_to_nodes(humanoid: &HumanoidMap, nodes: &mut [Value]) ->
   AxisBakeApplyStats`.
   Rejected alternatives: accepting raw GLB bytes, mutating
   `HumanoidMap::json`, or changing `extract_vrm_rest_data` public types.

4. **Process target bones root-to-leaf and recompute globals after each
   successful correction.**
   Rationale: parent correction compensates direct children to preserve their
   world transforms. If a child bone is corrected later, it must start from the
   compensated local rest state. A root-to-leaf topological order prevents a
   later parent correction from invalidating an already-corrected child.
   Rejected alternatives: iterating `HashMap` order, sorting only by humanoid
   bone name, or applying all corrections from one stale global snapshot.

5. **Apply correction by right-multiplying the target local rotation.**
   Rationale: Phase 2b locked the formula for right-multiply local application:
   `new_rotation = old_rotation * q_corr_local`. The post-apply assertion is
   `new_bone_world_rotation * Vec3::Y` aligns with the vector from the bone to
   the selected primary child in world space.
   Rejected alternatives: left-multiplying `q_corr_local * old_rotation`, using
   `q_world` directly, or converting the correction into a parent-space arc at
   the apply layer.

6. **Compensate each direct child with the inverse local correction.**
   Rationale: The STL-409 brief names direct-child compensation with
   `q_corr_local.inverse()`. For each direct child of a corrected bone, write
   `child.translation = q_corr_local.inverse() * old_child_translation` and
   `child.rotation = q_corr_local.inverse() * old_child_rotation`. Leave the
   target bone's local `translation` and `scale` unchanged. Leave direct-child
   finite uniform `scale` unchanged. Synthetic tests pin world position, world
   rotation, and parent-child distance after compensation.
   Rejected alternatives: compensating only child rotation, writing
   `old_child_rotation * q_corr_local.inverse()`, compensating all descendants
   directly, or deferring compensation to the mesh-rebake phase.

7. **Skip unsupported or invalid node shapes without diagnostics.**
   Rationale: `review-domain.md` treats glTF/VRM as untrusted asset input, and
   STL-409 requires malformed nodes, missing humanoid slots, and degenerate
   child direction to skip without panic. Because production import is not
   wired, the helper returns stats for tests instead of user-facing diagnostics.
   Rejected alternatives: `panic!`, typed `Result` errors, `VrmDiagnostic`
   emission, or treating invalid inputs as identity corrections.

8. **Keep TRS-only behavior explicit.**
   Rationale: Existing rest extraction reads `translation`, `rotation`, and
   `scale`; it does not process node `matrix`. Phase 2c tests operate on
   synthetic TRS JSON. If a node uses `matrix`, non-array TRS fields, non-finite
   values, zero-length rotation, non-finite scale, or non-uniform scale on a
   target/compensated node, skip that target bone and leave the affected nodes
   unchanged.
   Rejected alternatives: decomposing arbitrary `matrix` values, adding a
   public node-transform abstraction, or silently defaulting malformed
   rotations to identity during mutation.

9. **Do not add docs outside the plan unless implementation changes the
   durable contract.**
   Rationale: This PR adds private test-covered primitives and no production
   behavior. `MAP.md`, bridge docs, ADRs, and VRM validation specs stay
   unchanged.
   Rejected alternatives: documenting a private helper as user-visible
   normalization behavior, or adding roadmap/ADR text before Phase 2e wiring.

## Non-Goals

- Production `normalize_vrm` pipeline wiring.
- GLB byte parse/rebuild integration.
- `NormalizedVrmAsset` byte changes.
- `NORMALIZED_VRM_CACHE_VERSION` changes.
- `VrmDiagnostic` or bridge diagnostic emission.
- Mesh vertex, skin, inverseBindMatrix, accessor, bufferView, or BIN mutation.
- Retarget `DEFAULT_POSE` recalibration.
- Thumb CMC alignment.
- Public `shotloom-gltf` API changes.
- ADR, bridge contract, `MAP.md`, or validation-spec updates.

## Implementation Plan

### S0 — Baseline Re-Check

Run before edits:

```bash
git status --short
rg -n "mod correction|mod primary_child|mod apply|primary_child_for_humanoid_bone|correction_for_primary_child" crates/shotloom-gltf/src/vrm_axis_bake
rg -n "NORMALIZED_VRM_CACHE_VERSION|normalize_vrm\\(|inverseBindMatrices" crates/shotloom-gltf crates/shotloom-import
```

Expected:
- `apply.rs` is absent.
- `primary_child_for_humanoid_bone` and `correction_for_primary_child` exist
  but are not callable from a sibling module.
- Cache version remains `v3`.
- Production `normalize_vrm` has no axis-bake apply call.

### S1 — Open Private Helper Visibility

Modify:

```text
crates/shotloom-gltf/src/vrm_axis_bake/primary_child.rs
crates/shotloom-gltf/src/vrm_axis_bake/correction.rs
```

Changes:
- Make `primary_child_for_humanoid_bone` visible to the private sibling apply
  module.
- Make `correction_for_primary_child` visible to the private sibling apply
  module.
- Remove or rewrite the stale `#[allow(dead_code)]` comments once `apply.rs`
  calls the helpers.
- Keep all existing Phase 2a/2b tests intact.

### S2 — Add Apply Module Skeleton

Modify:

```text
crates/shotloom-gltf/src/vrm_axis_bake/mod.rs
crates/shotloom-gltf/src/vrm_axis_bake/apply.rs
```

Add `mod apply;` from the private module root. In `apply.rs`, add private
TRS helpers:
- `NodeRestTransform { translation: Vec3, rotation: Quat, scale: Vec3 }`
- parse helpers for JSON `translation`, `rotation`, and `scale`
- write helpers that preserve field presence on unchanged nodes and write only
  changed `rotation` / `translation` fields on corrected nodes
- parent/children map builder that ignores malformed/out-of-bounds child
  entries
- global transform resolver that rejects unresolved cycles by skip/stats, not
  panic
- `AxisBakeApplyStats` with explicit count fields:
  `corrected_bones`, `compensated_children`, `no_op_already_aligned`,
  `skipped_no_primary_child`, `skipped_invalid_transform`,
  `skipped_invalid_correction`, and `skipped_unresolved_hierarchy`

### S3 — Implement Root-to-Leaf Apply Loop

Inside `apply_axis_bake_to_nodes`:
1. Build parent/children maps from current `nodes[]`.
2. Build root-to-leaf topological node order.
3. For every node in topological order, look up its humanoid bone name through
   `HumanoidMap::node_to_vrm`.
4. Use `primary_child_for_humanoid_bone(humanoid, nodes, bone_name)` to select
   the direct primary child.
5. Resolve current global transforms.
6. Call `correction_for_primary_child(bone_world_rotation, bone_world_position,
   child_world_position)`.
7. If correction is `None`, leave JSON unchanged and increment
   `skipped_invalid_correction`.
8. If correction is identity-equivalent under the test epsilon, leave JSON
   unchanged and increment `no_op_already_aligned`.
9. Write `bone.rotation = bone.rotation * q_corr_local`; leave target
   `translation` and `scale` unchanged.
10. For every valid direct child, write
    `child.translation = q_corr_local.inverse() * old_child_translation` and
    `child.rotation = q_corr_local.inverse() * old_child_rotation`.
11. Recompute globals before processing the next target bone.

### S4 — Pin Synthetic JSON Tests

Add tests in `apply.rs`:
- Parent x-axis child: correction rotates local `+Y` toward the primary child.
- Direct child world position and world rotation are preserved after
  compensation.
- Parent-child distance is preserved after compensation.
- Canonical/no-op chain keeps JSON unchanged or identity-equivalent under the
  test epsilon.
- Leaf or missing humanoid slot skips without panic.
- Invalid child references from `children` are ignored.
- Degenerate child direction skips without panic and leaves JSON unchanged.
- Malformed TRS fields skip without panic and leave JSON unchanged.
- Non-uniform scale on the target or direct child skips without panic and leaves
  JSON unchanged.
- Parent-first chain test proves topological order does not invalidate child
  alignment.
- Stats tests pin no-op, no-primary-child, invalid-transform,
  invalid-correction, and unresolved-hierarchy buckets.

### S5 — Scope Guard Re-Read

After implementation, re-read the diff and verify:
- No call to `apply_axis_bake_to_nodes` from `normalize_vrm`.
- No changes to `crates/shotloom-import/src/lib.rs`.
- No `VrmDiagnostic` additions.
- No public `pub use` additions in `crates/shotloom-gltf/src/lib.rs`.
- No mesh, skin, inverseBindMatrix, accessor, bufferView, or BIN writes.
- No docs outside code comments/rustdoc generated by the implementation.

## Acceptance Criteria

- [ ] `crates/shotloom-gltf/src/vrm_axis_bake/apply.rs` exists and is declared
      from the private `vrm_axis_bake` module.
- [ ] Existing primary-child and correction helpers are callable only inside
      the private `vrm_axis_bake` module.
- [ ] The apply helper iterates humanoid bones from `HumanoidMap::node_to_vrm`
      and `nodes[]`; it does not parse raw GLB bytes.
- [ ] After correction, target bone world local `+Y` aligns to the chosen
      primary child direction within the test epsilon.
- [ ] Direct child world position and world rotation stay fixed after
      compensation by left-multiplying child local rotation with
      `q_corr_local.inverse()`.
- [ ] Parent-child distance stays fixed after compensation.
- [ ] Target bone local `translation` and `scale` stay unchanged.
- [ ] Canonical/no-op input stays unchanged or identity-equivalent under the
      test epsilon.
- [ ] Malformed nodes, missing humanoid slots, invalid child entries,
      unresolved hierarchy, and degenerate child direction skip without panic.
- [ ] `cargo test -p shotloom-gltf vrm_axis_bake` passes.
- [ ] `cargo clippy -p shotloom-gltf -- -D warnings` passes.
- [ ] `normalize_vrm`, `NormalizedVrmAsset`, cache version, diagnostics, and
      import pipeline behavior are unchanged.

## Verification

Focused gates:

```bash
cargo fmt --check
cargo test -p shotloom-gltf vrm_axis_bake
cargo clippy -p shotloom-gltf -- -D warnings
git diff -- crates/shotloom-import/src/lib.rs
rg -n "apply_axis_bake_to_nodes|vrm_axis_bake::apply" crates/shotloom-gltf/src/vrm_normalization.rs crates/shotloom-gltf/src/lib.rs
git diff -- crates/shotloom-gltf/src/lib.rs
```

Broad gates before commit/push:

```bash
cargo check --workspace --exclude shotloom-desktop
cargo test --workspace --exclude shotloom-desktop
node scripts/validate-doc-paths.mjs
node scripts/validate-ci-rust-coverage.mjs
```

Manual repro:
- N/A: no bridge, editor, runtime command, user-facing diagnostic, or rejection
  code is in scope.

Review gate:
- After push, run `/shotloom-review-before-pr` in the same turn per the
  Shotloom rule.

## Traps

- Do not wire the helper into `normalize_vrm`; Phase 2e owns production wiring,
  diagnostics, and cache invalidation.
- Do not compensate only child rotations; child local translation must also be
  inverse-rotated to preserve child world position.
- Do not right-multiply child local rotation during compensation; use
  `q_corr_local.inverse() * old_child_rotation`.
- Do not process humanoid bones in `HashMap` iteration order; root-to-leaf
  order is required.
- Do not add public API exports from `shotloom-gltf`.
- Do not mutate mesh, skin, inverseBindMatrix, accessor, bufferView, or BIN
  data in Phase 2c.
- Do not turn invalid asset-derived TRS into identity corrections; skip and
  assert no panic.

## Follow-Up Candidates

- Phase 2d inverseBindMatrix and mesh vertex rebake.
- Phase 2e `normalize_vrm` pipeline wiring, diagnostics, and cache-version
  decision.
- Phase 2f retarget `DEFAULT_POSE` delta recalibration.
- Phase 2.5 `shotloom-retarget` rig-branch elimination.
- Phase 3 thumb CMC alignment.
- Shared node-transform helper only after a second caller appears.
