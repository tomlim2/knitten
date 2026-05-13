---
status: open
created: 2026-05-13
load: triggered
trigger: working STL-402 — VRM axis bake primary child picker
repo: shotloom
linear: STL-402
---

# Add VRM axis-bake primary child picker

## Intent

STL-291 Phase 2 needs a UniVRM-style axis + mesh bake pass, but the
first safe slice is only the deterministic child-selection primitive.
This work adds a private `shotloom-gltf` axis-bake module skeleton and a
primary-child picker that reads GLB `nodes[]` hierarchy plus
`VRMC_vrm.humanoid.humanBones`. The PR deliberately does not mutate
normalized bytes, rest pose, mesh data, inverse bind matrices, cache
version, diagnostics, or import pipeline wiring. Later Phase 2 PRs use
this picker to compute correction quaternions and apply the actual bake.

## Decisions (locked)

1. **Slice Phase 2a only.** Add the module skeleton and primary-child
   picker, then stop before correction math.
   *Rationale:* child choice is the root invariant for every later axis
   bake step; verifying it independently keeps the first Phase 2 PR
   reviewable and avoids mixing topology policy with geometry mutation.
   *Rejected:* implementing correction quaternion or inverse-bind rebake
   in the same PR. Those steps change normalized artifacts and require
   cache/diagnostic/pipeline decisions that belong in later Phase 2
   sub-issues.

2. **Keep the module private inside `shotloom-gltf`.** Add
   `crates/shotloom-gltf/src/vrm_axis_bake/mod.rs` and
   `crates/shotloom-gltf/src/vrm_axis_bake/primary_child.rs`, declared
   through a private `mod vrm_axis_bake;` in `src/lib.rs`.
   *Rationale:* ADR-0030 and `docs/arch/normalizer-pipeline.md` place
   VRM-shaped GLB artifact normalization below the normalizer crates.
   The axis-bake primitives operate on GLB JSON and are not a public
   crate API yet.
   *Rejected:* adding public exports. No downstream crate should depend
   on this helper until the full normalize-time bake contract exists.
   *Rejected:* placing the picker in `shotloom-character-model-normalizer`.
   That crate consumes repaired/normalized character data above the GLB
   artifact layer.

3. **Input shape is parsed JSON, not bytes.** The picker accepts the
   already-parsed GLB JSON `Value` or narrowly-scoped JSON pieces
   (`nodes[]`, `humanBones`) and returns node-index choices.
   *Rationale:* Phase 2a is a pure policy helper; GLB parse/rebuild
   ownership remains in `vrm_normalization.rs` when Phase 2e wires the
   pass into `finalize_normalized_vrm`.
   *Rejected:* accepting raw GLB bytes. That would couple the picker to
   parsing and create byte-level behavior in a PR that must be no-op for
   normalized output.

4. **Use explicit humanoid-chain priority for multi-child bones.**
   Single-child bones select that child directly; leaf bones return
   `None`. Multi-child bones first prefer the next humanoid slot in the
   canonical chain, including `hips -> spine` and
   `leftHand/rightHand -> middleProximal` for hand fans.
   *Rationale:* Phase 2's correction direction must be stable across
   exporter-specific child ordering. Hand and hips are the known
   multi-child cases called out by STL-291.
   *Rejected:* first child wins. glTF child array order is not a
   semantic humanoid-chain policy and would make correction depend on
   exporter ordering.
   *Rejected:* longest-child or name-only heuristics as the primary
   rule. They can be useful fallbacks later, but Phase 2a should encode
   the humanoid map as the authoritative chain source.

5. **No cache-version bump and no diagnostics in this PR.**
   `NORMALIZED_VRM_CACHE_VERSION` stays unchanged, and
   `normalize_vrm` output bytes remain byte-identical.
   *Rationale:* this PR adds tested internal selection logic only. Cache
   invalidation and surfaced diagnostics are triggered when Phase 2e
   wires a mutating normalize pass.
   *Rejected:* pre-bumping cache version. That would invalidate user
   caches before normalized artifacts actually change.

6. **Test the policy with synthetic JSON fixtures.** Unit tests live next
   to the picker and cover single child, humanoid-priority multi-child,
   hand middle-proximal priority, hips spine priority, leaf skip,
   invalid child indices, and deterministic tie behavior.
   *Rationale:* Phase 2a does not need LFS model fixtures because no
   asset bytes are normalized. Small JSON fixtures make the policy
   reviewable and fast.
   *Rejected:* fixture-only coverage. It would hide the selection policy
   inside model data and make edge cases harder to name.

## Acceptance

- [ ] `shotloom-gltf` private axis bake module skeleton이 추가됨
- [ ] primary child picker가 `nodes[]` hierarchy와 humanoid map을 입력으로 받아 deterministic하게 동작함
- [ ] 단일 child / multi-child humanoid 우선 / hand middle-proximal 우선 / hips spine 우선 / leaf skip 단위 테스트가 있음
- [ ] normalized GLB bytes를 변경하지 않음
- [ ] `NORMALIZED_VRM_CACHE_VERSION`은 변경하지 않음
- [ ] 후속 2b correction quaternion PR에서 재사용할 수 있는 함수 경계가 분리되어 있음

## File map

| Path | Kind | Note |
|------|------|------|
| `crates/shotloom-gltf/src/lib.rs` | modify | Add private `mod vrm_axis_bake;`. No `pub use` re-export. |
| `crates/shotloom-gltf/src/vrm_axis_bake/mod.rs` | add | Private module root for Phase 2 axis-bake primitives. Re-export only `pub(crate)` helpers needed by sibling modules. |
| `crates/shotloom-gltf/src/vrm_axis_bake/primary_child.rs` | add | Implement the deterministic primary-child picker and local unit tests over synthetic JSON fixtures. |

## Verification

- `cargo test -p shotloom-gltf vrm_axis_bake` — focused unit tests for
  the new picker.
- `cargo test -p shotloom-gltf` — full glTF crate regression.
- `cargo test -p shotloom-import` — confirms no cache-facing compile
  or behavior drift from private module addition.
- `git diff -- crates/shotloom-import/src/lib.rs` — must show no
  `NORMALIZED_VRM_CACHE_VERSION` change.
- `git diff --stat` and targeted re-read — must show no
  `finalize_normalized_vrm` wiring, no GLB byte rebuild, no diagnostics,
  and no normalized bytes mutation.
- Push gate before PR: `pnpm validate:rust`, `pnpm test:rust`,
  `pnpm validate:doc-paths`, and `pnpm validate:ci-rust-coverage`.
- `/shotloom-review-before-pr` after push. Rust source diff applies,
  with repo convention checks focused on keeping the PR Phase 2a-only.

## Open questions

None for Phase 2a. Follow-up issues will decide correction quaternion
math, rest-pose application, inverse-bind rebake, cache bump,
diagnostic severity, and import pipeline wiring.
