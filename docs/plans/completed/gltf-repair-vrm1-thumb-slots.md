---
status: completed
created: 2026-05-12
updated: 2026-05-17
load: triggered
trigger: working STL-291 Phase 1 — VRM1 thumb humanoid slot repair in shotloom-gltf
repo: shotloom
linear: STL-291
---

# Repair VRM1 thumb humanoid slot mapping at normalize-time (Phase 1 of STL-291)

## Intent

backward-stripped VRM 1.x rigs (yoya, minjoon) and VRM 0.x-converted
rigs (vrm0x-vroid, zepeto) ship a humanoid map where the wrist-attached
thumb bone (depth 1) is mislabeled `*ThumbProximal` and the next joint
(depth 2) `*ThumbMetacarpal`, while anatomy and canonical VRoid 1.x
rigs put `*ThumbMetacarpal` at depth 1. This forces every downstream
consumer (retarget, finger_axis_map, finger_compare) to carry rig-aware
branches and produces visibly inconsistent thumb poses across rigs even
when the retarget output is bit-identical.

Phase 1 lifts the fix to the canonical owner: a private repair
pass inside `shotloom-gltf` that runs as the last *metadata-mutation*
step of `finalize_normalized_vrm` — after the 180Y bone-transform
diagnostic, before `validate_normalized_vrm` and metadata extraction.
It inspects the humanoid map for each side
(left/right), and if the wrist-attached thumb bone is mapped to
`*ThumbProximal`, it swaps the slot labels of the depth-1 and depth-2
nodes. Node names, hierarchy, mesh data, transforms — all untouched;
only `extensions.VRMC_vrm.humanoid.humanBones.{left,right}Thumb*.node`
references are reassigned. Canonical rigs (xiao, c-normal) get a no-op.

This PR is the *first* of four Phase-N PRs under STL-291; subsequent
phases (axis+mesh bake, retarget rig-branch elimination, thumb CMC
algorithm) build on this canonical input. Scope here ends at humanoid
metadata canonicalization — bone frames, mesh skin, and retarget code
stay unchanged.

## Decisions (locked)

1. **Repair surface: `shotloom-gltf` private module.** New file
   `crates/shotloom-gltf/src/vrm_humanoid_slot_repair.rs`, declared
   in `lib.rs` as a private `mod` (not in `pub use`). Function:
   `pub(crate) fn repair_vrm1_thumb_humanoid_slots(json: &mut Value)
   -> Vec<VrmDiagnostic>`. ADR-0030 §"Pre-normalize boundary"
   (landed in STL-369 today) makes this the codified home for VRM
   extension JSON repair.
   *Visibility note:* `VrmDiagnostic::info` is currently a private
   ctor (`fn info(...)` at `vrm_normalization.rs:94`). For a sibling
   private module to construct info diagnostics, bump that ctor to
   `pub(crate) fn info` (one-token change, mirrors how `warning` /
   `error` are exposed via the `impl VrmDiagnostic` block).
   *Rejected:* constructing the diagnostic inside `vrm_normalization.rs`
   based on a `bool`/`Vec<Swap>` return from repair. Splits the
   diagnostic message authoring across two modules; the repair module
   owns the operation, so it owns the diagnostic text.
   *Rejected:* `pub` on `info`. `pub(crate)` is the narrowest
   visibility that compiles and matches existing intra-crate use.
   *Rejected:* placing repair in `shotloom-character-model-normalizer`.
   That crate's boundary stops at the GLB byte artifact; humanoid
   extension JSON mutation lives below it per the amended ADR.
   *Rejected:* exposing a public API. Phase 2/2.5/3 do not call this
   from outside the crate; keeping it private preserves the option of
   refolding into Phase 2 if the algorithm evolves.

2. **Call site: tail of `finalize_normalized_vrm`, before
   `validate_normalized_vrm`.** Order: 180Y diagnostic push (line
   282–293 today) → **new repair call** → `validate_normalized_vrm`
   → metadata extraction. Rationale: validate runs on the
   *post-repair* JSON so downstream invariants reflect canonical
   slot mapping; repair operates on bytes that already had 180Y
   normalization applied.
   *Rejected:* call site inside `normalize_vrm_bones_180y`. That
   helper is bone-transform layer; humanoid map mutation is a
   separate concern and belongs at the finalization stage where
   diagnostics are aggregated.

3. **GLB rewrite path: reuse `parse_glb` + `rebuild_glb`.**
   `shotloom-gltf` already has both halves of the round-trip:
   `parse_glb(bytes) -> Result<GlbParts, VrmNormalizationError>`
   (line ~1380) and `rebuild_glb(json, bin) -> Result<Vec<u8>,
   VrmNormalizationError>` (line 1427). Phase 1 calls `parse_glb`
   on `normalized.bytes`, hands the `json: &mut Value` to
   `repair_vrm1_thumb_humanoid_slots`, and if any diagnostic was
   emitted, calls `rebuild_glb(json, bin)?` to replace
   `normalized.bytes`. No-op rigs skip the rebuild entirely so the
   byte output (and `shotloom-import` cache key resolution) stay
   stable.
   *Error path is fallible by design.* `rebuild_glb` returns
   `Result<_, VrmNormalizationError>`; the caller must surface the
   error rather than fall back to a silent
   `replace_glb_json_chunk(bytes, json) -> Vec<u8>` shape. Shotloom
   treats VRM bytes as untrusted asset input; any serialization
   failure mid-finalize must propagate to the
   `Result<NormalizedVrmAsset, VrmNormalizationError>` contract of
   `normalize_vrm`. Update `finalize_normalized_vrm`'s signature
   from `-> NormalizedVrmAsset` to `-> Result<NormalizedVrmAsset,
   VrmNormalizationError>` and adjust both callers (`normalize_vrm`
   VRM 1.x branch line 245, VRM 0.x branch line 256) to propagate
   with `?`.
   *Rejected:* in-place byte-level edit. The slot reassignment is
   a structural edit (string field on different node indices);
   round-tripping JSON is the only safe way.
   *Rejected:* introducing a new `replace_glb_json_chunk` helper.
   Duplicates `rebuild_glb` and hides the fallible path.

4. **Diagnostic: `VrmDiagnostic::info`, code
   `canonicalized_thumb_humanoid_slots`.** One info entry per side
   that actually swapped (or one aggregated entry with side list in
   message — judge at implementation time based on existing
   diagnostic shape conventions in `vrm_normalization.rs`).
   *Rationale:* matches Phase 1's information-only intent
   (metadata canonicalization, no geometry change). Phase 2 is the
   one specified to use `warning` per STL-291 body. Info severity
   keeps Phase 1 below validate-error level but visible in import
   diagnostics for downstream debugging.

5. **Cache invalidation: bump
   `shotloom-import::NORMALIZED_VRM_CACHE_VERSION` from `"v3"` to
   `"v4"`.** Normalized bytes change shape (humanoid map slot
   reassignment) for non-canonical rigs; cached v3 entries must be
   re-derived. Single-line const change at
   `crates/shotloom-import/src/lib.rs:36`.

6. **Function-name prefix `vrm1` refers to the operating JSON
   format, not source flavor.** vrm0x sources reach
   `finalize_normalized_vrm` *after* `convert_vrm0` rewrites the
   humanoid extension to VRM 1.x format (line 254 → 256). The
   repair function therefore always sees VRM 1.x-shaped JSON; the
   `vrm1` prefix documents that invariant. vrm0x-derived rigs
   benefit because the repair runs on their converted form.

7. **Scope limited to thumb chain.** STL-291 Phase 1 description
   marks the smoking gun on thumb only; if other chain misalignments
   surface later, extend inside the same function (per STL-291
   body). Phase 1 PR does not introduce other chain repair on
   speculation.

## Acceptance

- [ ] `pub(crate) fn repair_vrm1_thumb_humanoid_slots(json: &mut Value)
      -> Vec<VrmDiagnostic>` lands in
      `crates/shotloom-gltf/src/vrm_humanoid_slot_repair.rs` (private
      module).
- [ ] `finalize_normalized_vrm` calls the repair function in its
      tail, before `validate_normalized_vrm`, on the post-180Y JSON.
- [ ] On each of the four non-canonical fixtures
      (`vrm1x-cmm-f-yoya_backward.vrm`,
      `vrm1x-vroid-m-minjoon_backward.vrm`,
      `vrm0x-vroid-f-a.vrm`, `vrm1x-zepeto-f-001.vrm`),
      `normalize_vrm` output's humanoid map has `*ThumbMetacarpal`
      pointing at the wrist-attached (depth-1) node, and the returned
      diagnostics include exactly one entry with code
      `canonicalized_thumb_humanoid_slots`.
- [ ] On each of the two canonical fixtures
      (`vrm1x-vroid-f-xiao.vrm`, `vrm1x-vroid-m-c.vrm`),
      `normalize_vrm` output's diagnostics contain zero entries with
      code `canonicalized_thumb_humanoid_slots`, and the output
      bytes are byte-identical to the pre-Phase-1 baseline (no-op for
      canonical rigs — verified via a snapshot or via re-running the
      pre-existing `vrm1_backward_fixture.rs` assertions).
- [ ] One `VrmDiagnostic::info` with code
      `canonicalized_thumb_humanoid_slots` is appended when any
      side swaps.
- [ ] `NORMALIZED_VRM_CACHE_VERSION` bumped `"v3"` → `"v4"` in
      `shotloom-import/src/lib.rs`.
- [ ] Unit tests cover: canonical fixture → no-op, backward fixture
      → swap, malformed humanoid map (missing node ref) → no-op +
      benign behavior.
- [ ] Integration test through `normalize_vrm` on at least one
      backward fixture in `crates/shotloom-gltf/tests/` confirms the
      swap is observable in `NormalizedVrmAsset::diagnostics` and in
      the re-extracted humanoid map.
- [ ] Full local push gate clean (note: `pnpm validate:rust` is
      fmt + clippy only per `package.json:44`; full Rust push gate
      is the union below):
      - `pnpm validate:rust` — `fmt:rust` + `lint:rust` (clippy `-D warnings`).
      - `pnpm test:rust` — `cargo test --workspace $CARGO_WORKSPACE_EXCLUDES`
        (excludes `shotloom-desktop` via the CI-shared env var).
      - `pnpm validate:doc-paths` — markdown link target validator.
      - `pnpm validate:ci-rust-coverage` — CI Rust coverage validator.

## File map

| Path | Kind | Note |
|------|------|------|
| `crates/shotloom-gltf/src/vrm_humanoid_slot_repair.rs` | add | New private module. Owns the JSON-level repair function + its unit tests (`#[cfg(test)] mod tests`). Walks `extensions.VRMC_vrm.humanoid.humanBones`; for each side, finds depth-1 node from `*Hand` via children traversal in `nodes[]`, checks the current slot mapping, swaps `*ThumbMetacarpal` ↔ `*ThumbProximal` `node` index entries when depth-1 holds `*ThumbProximal`. Returns `Vec<VrmDiagnostic>` (empty if no swap). |
| `crates/shotloom-gltf/src/lib.rs` | modify | Add `mod vrm_humanoid_slot_repair;` (private). No `pub use` re-export. |
| `crates/shotloom-gltf/src/vrm_normalization.rs` | modify | (a) Bump `VrmDiagnostic::info` ctor (line 94) from private `fn info` to `pub(crate) fn info` so the sibling module can construct info diagnostics. (b) Inside `finalize_normalized_vrm` (currently line 275–304): after the 180Y info-diagnostic push and *before* `validate_normalized_vrm`, call `parse_glb(&normalized.bytes)?` to get `GlbParts { json, bin }`, call `repair_vrm1_thumb_humanoid_slots(&mut json)`, extend `diagnostics` with the result, and if non-empty call `normalized.bytes = rebuild_glb(json, bin)?;`. Keep the no-op path byte-stable (don't rebuild when zero diagnostics). (c) Change `finalize_normalized_vrm`'s return type from `NormalizedVrmAsset` to `Result<NormalizedVrmAsset, VrmNormalizationError>` and propagate `?` from both call sites in `normalize_vrm` (lines 245, 256). |
| `crates/shotloom-import/src/lib.rs` | modify | `NORMALIZED_VRM_CACHE_VERSION: &str = "v3"` → `"v4"` (single-line). |
| `crates/shotloom-gltf/tests/vrm_humanoid_slot_repair.rs` (or extend `vrm1_backward_fixture.rs`) | add or modify | LFS-fixture-driven test: run `normalize_vrm` on `vrm1x-cmm-f-yoya_backward.vrm` and assert the resulting humanoid map places `*ThumbMetacarpal` at the wrist-attached node; run on `vrm1x-vroid-f-xiao.vrm` and assert no diagnostic with code `canonicalized_thumb_humanoid_slots`. Decide between new test file vs extension of existing backward-fixture test at implementation time based on which keeps cohesion (separate file probably cleaner — distinct concern). |

## Verification

- `cargo test -p shotloom-gltf` — unit + fixture tests pass.
- `cargo test -p shotloom-import` — cache-version regression covered if
  any test pins `NORMALIZED_VRM_CACHE_VERSION`.
- `cargo test --workspace --exclude shotloom-desktop` — workspace
  green (no downstream regression from the slot reassignment).
- Manual check: re-run `crates/shotloom-retarget/examples/finger_compare`
  with all six rigs and capture the output for the PR body. **Pass
  criterion is at the humanoid-map layer, not the visual-posture
  layer.** Phase 1's job is to canonicalize the `*ThumbMetacarpal` ↔
  depth-1 mapping; a visible posture delta between
  yoya/minjoon/vrm0x/zepeto and xiao/c-normal is *expected* to
  remain because Phase 2 (axis + mesh bake) is what aligns the
  underlying bone frames. The PR description should explicitly
  document (i) the humanoid map is now canonical on all six rigs
  (verified by the AC integration tests, not by eyeballing
  finger_compare), and (ii) any residual visual delta is Phase 2
  scope. Do not block on visual identity in this PR.
- Full push gate (see Acceptance list above for the explicit script
  decomposition): `pnpm validate:rust` + `pnpm test:rust` +
  `pnpm validate:doc-paths` + `pnpm validate:ci-rust-coverage`.
  `pnpm validate:rust` alone is fmt + clippy only and is not the
  full gate — do not stop there.
- `/shotloom-review-before-pr` after push — Rust source diff applies,
  Pattern groups A–F (Rust review) + G–H (repo conventions / doc
  discipline) all in scope. Cache-version bump must include a
  one-line rationale in commit body so review's "feature flag /
  config change" check passes.
- PR description references STL-291 with `Part of STL-291` (Phase 1
  of multi-phase epic) — *not* `Resolves`. Cross-link STL-369
  (ADR-0030 boundary clarification) as the codified rationale for
  the in-`shotloom-gltf` placement.

## Open questions

1. **Diagnostic granularity.** One aggregated `info` diagnostic vs
   one per side. Resolve at implementation time by matching the
   shape of existing repair diagnostics in `vrm_normalization.rs`
   (e.g. the 180Y diagnostic at line 283 is single-entry with
   counts in the message — adopt the same shape unless side-level
   detail clearly aids debugging).

(Resolved during review: GLB round-trip uses existing `parse_glb`
+ `rebuild_glb` — no new helper needed; fixture set is complete in
`assets/models/` — see Acceptance for the exact six filenames.)
