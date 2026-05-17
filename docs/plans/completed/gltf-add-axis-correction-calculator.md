---
status: completed
created: 2026-05-13
updated: 2026-05-17
load: triggered
trigger: working STL-408 — VRM axis-bake correction quaternion calculator
repo: shotloom
linear: STL-408
---

# Add VRM axis-bake correction quaternion calculator

## Intent

Add the Phase 2b axis-bake math primitive below `shotloom-gltf`'s
private `vrm_axis_bake` module. The helper computes the local-space
correction quaternion that rotates a bone's local `Y` axis toward the
primary-child world direction chosen by Phase 2a. This work stays pure:
it does not parse GLB bytes, mutate JSON, apply rest-pose changes,
rebake inverse bind matrices, emit diagnostics, wire
`finalize_normalized_vrm`, or bump `NORMALIZED_VRM_CACHE_VERSION`.

## Decisions (locked)

1. **Slice Phase 2b only.** Add correction-quaternion calculation and
   tests, then stop before applying the correction to any artifact data.
   *Rationale:* the quaternion formula is the load-bearing geometry
   invariant for Phase 2c/2d/2e. Reviewing it alone keeps the PR small
   and separates math correctness from mutation/cache policy.
   *Rejected:* applying rest pose or inverse-bind rebake in the same PR.
   Those steps change normalized artifacts and need cache, diagnostic,
   and pipeline decisions.

2. **Keep the helper private inside `shotloom-gltf::vrm_axis_bake`.**
   Add `correction.rs` beside `primary_child.rs` and declare it from the
   private module root.
   *Rationale:* ADR-0030 and `docs/arch/normalizer-pipeline.md` place
   VRM-shaped GLB pre-normalization under `shotloom-gltf`. The
   calculator is an internal primitive for that layer, not a public crate
   API.
   *Rejected:* exporting the helper publicly. No downstream crate depends
   on axis-bake internals before the full normalize-time contract exists.

3. **Use narrow math inputs, not GLB JSON or bytes.** The helper accepts
   `bone_world_rotation: Quat`, `bone_world_position: Vec3`, and
   `child_world_position: Vec3`, then returns `Option<Quat>` for the
   local correction.
   *Rationale:* Phase 2b owns only the math policy. World transform
   extraction and primary-child lookup stay in caller code, which
   prevents parse/rebuild behavior from entering this PR.
   *Rejected:* accepting node indices, `HumanoidMap`, or raw JSON. That
   mixes Phase 2a topology policy and Phase 2e wiring into the math slice.

4. **Compute local correction for right-multiply application by
   conjugating the world arc into bone local space.** Phase 2c applies
   the correction as `new_local_rotation = old_local_rotation * q_local`.
   Let `d_world = normalize(child_world_position - bone_world_position)`,
   `y_world = bone_world_rotation * Vec3::Y`,
   `q_world = Quat::from_rotation_arc(y_world, d_world)`, and
   `q_local = bone_world_rotation.inverse() * q_world *
   bone_world_rotation`.
   *Rationale:* Phase 2c applies the correction in local bone space; the
   formula guarantees `bone_world_rotation * (q_local * Vec3::Y)` points
   at `d_world`. Near-identity input flows through
   `Quat::from_rotation_arc` unchanged and returns identity up to
   floating-point epsilon.
   *Rejected:* returning `q_world` directly. That makes the caller own
   space conversion and risks double-applying world-space orientation.

5. **Return `None` for invalid inputs.** No correction is produced when
   either position is non-finite, `bone_world_rotation` is non-finite,
   or the child direction satisfies
   `length_squared < LENGTH_EPSILON * LENGTH_EPSILON`, where
   `LENGTH_EPSILON = 1e-6`.
   *Rationale:* asset-derived transform data is untrusted. A pure helper
   must not normalize zero or non-finite vectors into NaN quaternions.
   *Rejected:* returning `Quat::IDENTITY` for invalid inputs. Identity
   hides data-quality failures from later callers that need to distinguish
   "already aligned" from "no usable direction".

6. **Use a deterministic local `+X` 180-degree fallback for opposite
   direction.** If the current local `Y` world direction and child
   direction satisfy `dot <= OPPOSITE_DOT_THRESHOLD`, where
   `OPPOSITE_DOT_THRESHOLD = -1.0 + 1e-6`, return
   `Quat::from_rotation_x(PI)` in local space.
   *Rationale:* shortest-arc rotation is underdetermined at 180 degrees;
   choosing local `+X` keeps output stable across platforms and avoids
   implementation-defined fallback axes.
   *Rejected:* calling `Quat::from_rotation_arc` for exact/near-opposite
   input. That path is numerically fragile and can choose unstable axes.

7. **Use existing `glam`; add no dependencies.** `shotloom-gltf` already
   depends on `glam = 0.30`, so the helper uses `glam::{Quat, Vec3}`.
   *Rationale:* the crate already has the math library needed for this
   primitive.
   *Rejected:* adding a geometry/math dependency. The operation is one
   quaternion/vector helper and does not justify new supply-chain risk.

## Acceptance

- [ ] `crates/shotloom-gltf/src/vrm_axis_bake/correction.rs` exists and
      is connected through the private module root.
- [ ] The helper returns a deterministic quaternion that aligns the
      current bone world rotation's local `Y` axis to the primary-child
      world direction.
- [ ] The identity case returns identity or an epsilon-equivalent
      quaternion.
- [ ] The 90-degree axis-direction case is verified by expected
      quaternion or rotated-vector assertions.
- [ ] Zero-length child direction and non-finite transform/input return
      an explicit no-correction result.
- [ ] Near-opposite direction uses the deterministic local `+X`
      180-degree fallback and is pinned by a unit test.
- [ ] Normalized GLB bytes, rest pose, inverseBindMatrix, mesh data, and
      `NORMALIZED_VRM_CACHE_VERSION` stay unchanged.
- [ ] The function boundary is reusable by the follow-up Phase 2c apply
      step.

## File map

| Path | Kind | Note |
|------|------|------|
| `crates/shotloom-gltf/src/vrm_axis_bake/mod.rs` | modify | Add `mod correction;` and keep the axis-bake helpers private. No public crate export. |
| `crates/shotloom-gltf/src/vrm_axis_bake/correction.rs` | add | Implement the pure correction-quaternion helper and local unit tests over synthetic `Quat` / `Vec3` inputs. |
| `crates/shotloom-gltf/src/vrm_axis_bake/primary_child.rs` | read-only | Existing Phase 2a context only. Do not change topology policy in this PR. |
| `crates/shotloom-import/src/lib.rs` | read-only | Verify `NORMALIZED_VRM_CACHE_VERSION` remains `v3`; no cache behavior changes. |

## Verification

- `cargo test -p shotloom-gltf vrm_axis_bake` — focused tests for
  primary-child and correction helpers.
- `cargo clippy -p shotloom-gltf -- -D warnings` — focused lint pass for
  new Rust math code.
- `cargo fmt --check` — formatting gate.
- `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings`
  — workspace lint gate before commit/push.
- `cargo check --workspace --exclude shotloom-desktop` — workspace type
  check.
- `cargo test --workspace --exclude shotloom-desktop` — workspace
  regression gate.
- `node scripts/validate-doc-paths.mjs` — doc path gate.
- `git diff -- crates/shotloom-import/src/lib.rs` — must show no
  `NORMALIZED_VRM_CACHE_VERSION` change.
- Targeted diff re-read — must show no `finalize_normalized_vrm`
  wiring, no normalized-byte mutation, no rest-pose application, no
  inverse-bind rewrite, and no diagnostics.
- `/shotloom-review-before-pr` after push. Rust review applies; the key
  review target is math determinism plus keeping the PR Phase 2b-only.

## Open questions

None for Phase 2b. Follow-up issues own applying this correction to
bone rest pose, rebaking inverse bind matrices and mesh data, adding
diagnostics, bumping cache version, and wiring the normalize pipeline.
