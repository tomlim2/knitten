---
status: open
created: 2026-05-13
updated: 2026-05-13
load: triggered
trigger: working STL-406 — GLB/GLTF prop import path
repo: shotloom
linear: STL-406
---

# Add .gltf path + scene-reachable mesh preflight + structured diagnostics for prop import

## Intent

The GLB-only prop import end-to-end already ships in main:
`AssetImportKind::Prop`, `handle_import_prop_asset`, `pickAndStageProp`
web/Tauri bindings, `WorldAssetsPanel` "Load prop" button, and
`spawn_prop_from_asset` click-spawn are all live and covered by a
happy-path engine test. STL-406's Linear body predates that work.

The actual remaining gap is four-part: (1) accept `.gltf` (text glTF,
embedded only) alongside `.glb` in the editor pickers and the engine
handler, (2) replace the magic/version/length-only check with a
scene-reachable-mesh preflight in `shotloom-gltf` that uses the
repo-precedent `gltf::Glb::from_slice` for GLB and `gltf::Gltf::from_slice`
for text glTF, (3) emit structured `ValidationDiagnostics` followed by
`CommandRejected` (the VRM/FBX precedent at `assets.rs:170-204`) on every
rejection path, and (4) update the bridge-contract and
system-architecture docs so they reflect prop import as a first-class
kind.

This work stays inside the existing wire shape — no new
`CommandRejectionCode`, no new bridge command, no new external resource
resolution. External `.bin` / texture / image handling is out of scope.

## Current State

| Surface | Path | State |
|---|---|---|
| `AssetImportKind::Prop` enum | `crates/shotloom-core/src/bridge/mod.rs:108` | Done |
| TS `AssetImportKind` includes `"prop"` | `apps/editor/src/bridge/types.ts:183` | Done |
| Engine handler `handle_import_prop_asset` | `crates/shotloom-engine/src/bridge/handlers/assets.rs:422` | Partial — GLB-only, structural check only, single rejection code, no diagnostics |
| Engine helper `validate_prop_import_bytes` | `crates/shotloom-engine/src/bridge/handlers/assets.rs:472` | Partial — magic/version/length only; to delete |
| Web picker `createWebPropBinding` accept-list | `apps/editor/src/runtime/web.ts:189` | Partial — `.glb,model/gltf-binary` only |
| Tauri picker `tauri_stage_prop_from_dialog` filter | `crates/shotloom-tauri/src/tauri_commands.rs:285` | Partial — `&["glb"]` only |
| `WorldAssetsPanel` "Load prop" + click-spawn | `apps/editor/src/components/WorldAssetsPanel.tsx:42` | Done |
| Engine handler `spawn_prop_from_asset` | `crates/shotloom-engine/src/bridge/handlers/props.rs` | Done |
| `import_prop_asset_registers_prop_ref` test | `crates/shotloom-engine/src/bridge/tests/assets.rs:653` | Happy path only |
| Fixture `assets/props/debug_prop.glb` | `assets/props/debug_prop.glb` | Done; no `.gltf` fixture |
| Bridge contract §14 `import_asset` doc | `docs/ipc/bridge-contract.md:1198` | Stale — claims only `character`/`animation` are accepted |
| System architecture prop / format section | `docs/arch/system-architecture.md:812` | Stale — `.gltf` listed under "supported if needed" |
| `shotloom-gltf` public surface | `crates/shotloom-gltf/src/lib.rs` | VRM-only; no generic glTF preflight API |
| `gltf = "1"` crate dependency | `crates/shotloom-gltf/Cargo.toml:10` | Present — no new dep needed |
| `gltf::Glb::from_slice` precedent | `crates/shotloom-gltf/src/vrm_extract.rs:227` | Use this for GLB-path preflight |
| `test_fixtures::glb_from_json` helper | `crates/shotloom-gltf/src/test_fixtures.rs:18` | Reuse for synthetic negative-test GLBs |
| `CommandRejectionCode::{AssetDecodeFailed, AssetValidationFailed}` | `crates/shotloom-core/src/bridge/mod.rs:910-912` | Reusable — no new variants needed |
| Stale fixture `UNSUPPORTED_ASSET_KIND "S1 supports only kind=character"` | `crates/shotloom-core/tests/generate_bridge_fixtures.rs:615` | Out of scope; logged as follow-up |

## Problem

Users can already import GLB props end-to-end but:

- `.gltf` (text + embedded buffer) files are rejected by the editor
  file pickers and the engine handler, even though the Linear title
  and AC promise "GLB/GLTF" support and the system-architecture doc
  permits it.
- Any malformed but GLB-magic-valid prop file passes preflight as
  long as its length header matches, then registers as an asset and
  only fails later when downstream loading discovers no scene or no
  reachable mesh. Users get no structured rejection at import time.
- The current check passes glTF files that have a `meshes` array but
  no node references to those meshes from any scene root, registering
  unusable assets.
- Editor toasts have no diagnostic code to render — the handler only
  emits `CommandRejected` with a free-text English message.
- `docs/ipc/bridge-contract.md §14` still claims prop import does not
  exist, which is wrong-shape relative to the implementation already
  in main.

## Locked Decisions

1. **Add a public `preflight_prop_gltf` API to `shotloom-gltf` and
   call it from `handle_import_prop_asset`.**
   *Rationale:* `shotloom-gltf` is the engine-agnostic glTF/VRM model
   layer per ADR-0030 and the crate-root docstring. Generic glTF
   preflight is a model-layer concern; the engine handler should not
   parse glTF JSON inline. The crate already depends on `gltf = "1"`,
   so no new dependency is needed.
   *Rejected alternatives:* inline parse inside the handler
   (duplicates format knowledge in the engine layer); a new
   `shotloom-prop-import` crate (out of scope and ADR-worthy).

2. **Detect format by leading 4 bytes (`glTF` magic → GLB; otherwise
   text glTF) and dispatch to format-specific parsers matching
   repo precedent.**
   For GLB: `gltf::Glb::from_slice(bytes)` (matches `vrm_extract.rs:227`),
   then read the JSON chunk; for text glTF: `gltf::Gltf::from_slice(bytes)`.
   *Rationale:* matching `vrm_extract.rs` precedent keeps the
   crate's GLB parsing surface consistent; the typed glTF parser is
   the right tool for `.gltf` JSON.
   *Rejected alternatives:* trust the filename extension (clients
   can send arbitrary names; staged bytes do not carry an extension
   contract); single-parser approach via `Gltf::from_slice` for
   both (breaks the established crate precedent and complicates
   version-probe handling for GLB).

3. **Probe `/asset/version == "2.0"` from the raw JSON chunk before
   typed parsing.**
   Read the JSON chunk (GLB) or the entire `.gltf` body, deserialize
   to `serde_json::Value`, and check `/asset/version`. A missing or
   non-`"2.0"` value rejects with `gltf_unsupported_version`. Only
   then do we pass the bytes to `gltf::Glb` / `gltf::Gltf`.
   *Rationale:* the typed `gltf` crate can collapse glTF 1.0 input
   into a generic parse error; without the explicit version probe,
   the `gltf_unsupported_version` diagnostic would be unreachable.
   Source: Codex draft Decision 4 — verified against `gltf` crate
   behavior.
   *Rejected alternatives:* skip the probe and rely on the typed
   parser — loses the version-specific diagnostic.

4. **Embedded-only `.gltf` support in this PR.**
   The preflight accepts `.gltf` files whose buffers and images are
   either inlined as `data:` URIs or absent at the prop layer (we
   only need scene topology, not buffer bytes, to register the asset
   manifest entry). External `.bin` / texture / image URIs are
   rejected with a structured diagnostic.
   *Rationale:* multi-file upload staging is out of brief scope and
   would require a wire-protocol change. The minimal e2e the AC asks
   for fits embedded-only glTF.
   *Rejected alternatives:* zip-bundle support; multi-upload staging
   contract. Both belong in a follow-up issue.

5. **Five structured diagnostic codes, all mapped to existing
   `CommandRejectionCode` variants — no protocol additions.**

   | Diagnostic code | Rejection code | When |
   |---|---|---|
   | `gltf_decode_failed` | `AssetDecodeFailed` | Magic mismatch, truncated bytes, JSON parse failure, typed-parser structural error |
   | `gltf_unsupported_version` | `AssetValidationFailed` | `/asset/version` missing or not `"2.0"` |
   | `gltf_no_scene` | `AssetValidationFailed` | `scenes` is empty, or `scene` index is missing and `scenes.len() > 0` (no entry-point scene) |
   | `gltf_no_reachable_mesh` | `AssetValidationFailed` | Scenes exist with at least one root, but DFS over node trees finds no node with `mesh.is_some()` |
   | `gltf_external_resources` | `AssetValidationFailed` | Any buffer or image URI that is not a `data:` URI |

   Every rejection emits one `BridgeEvent::ValidationDiagnostics`
   carrying a `Diagnostic { severity: Error, code, message,
   related_ids: vec![], source: Some("prop_import"), suggestion:
   None, recoverable: Some(false), location: None }`, followed by
   the matching `BridgeEvent::CommandRejected`. This mirrors the
   VRM path at `assets.rs:170-204`.
   *Rationale:* keeps the editor's existing rejection toast surface
   unchanged while letting the editor branch on `diagnostic.code`
   for targeted UX later. Adding new `CommandRejectionCode` enum
   variants would be a wire-protocol change requiring snapshot churn
   across all bridge consumers.
   *Rejected alternatives:* new
   `CommandRejectionCode::PropImportFailed` (protocol change + ADR
   territory); single bucket code without a diagnostic (loses
   editor-side branchability); split scene-empty vs scene-no-default
   (user-facing distinction is too thin to justify two codes —
   collapsed into `gltf_no_scene`).

6. **Diagnostic message ownership: a fixed `match` mapper in the
   engine handler.**
   Add `fn prop_preflight_diagnostic_message(err: &PropPreflightError) -> String`
   beside `handle_import_prop_asset`. The mapper is the only place
   that constructs prop-import diagnostic messages. Only
   `gltf_decode_failed` carries dynamic detail (the parser error
   string) — every other variant maps to a fixed message.
   *Rationale:* keeps message text out of the call-site, makes
   review and i18n trivial, and prevents ad-hoc strings from
   diverging across rejection paths.
   *Rejected alternatives:* relying on `Display` impl of the error
   enum (couples message text to the model-layer error type);
   inline `format!` at every rejection site (duplicates strings).

7. **Preserve the staged-byte drain invariant.**
   The current outer handler order — `upload_staging.take_with_len`
   then `decrement_budget` then dispatch by kind — satisfies the
   `runtime-architecture.md §8.3` rule that rejections evict staged
   bytes on every exit path. The new `preflight_prop_gltf` call must
   stay inside `handle_import_prop_asset` (after the drain) so the
   invariant holds.
   *Rationale:* the comment at `assets.rs:93-97` is explicit about
   this invariant; the VRM and animation paths preserve it; the
   new `.gltf` and diagnostic paths must too.
   *Rejected alternatives:* moving validation before the staging
   take to short-circuit cleanly — would leak budget on the
   failure branch.

8. **Cache the original bytes; the URI extension tracks input
   format.**
   `build_prop_asset_entry` stores
   `uri = format!("assets/props/{asset_id}.{ext}")` where `ext` is
   `glb` or `gltf` based on the detected format (not the filename).
   The bytes cached in the `BundledVrmAssets` overlay are the
   original input bytes.
   *Rationale:* downstream loaders use the URI extension to
   dispatch the correct format reader. Normalizing `.gltf` to GLB
   on import would require encoding logic and is out of brief
   scope.
   *Rejected alternatives:* always store as `.glb` and re-encode
   text glTF (out of scope, encoding policy is ADR-worthy).

9. **Extend editor file pickers to accept both formats.**
   Web `createWebPropBinding` accept-list becomes
   `.glb,.gltf,model/gltf-binary,model/gltf+json`; Tauri
   `tauri_stage_prop_from_dialog` filter becomes
   `&["glb", "gltf"]` (display name `"glTF"`).
   *Rationale:* the engine now accepts both; the picker must let
   users select either.
   *Rejected alternatives:* accept only `.glb` and reject `.gltf`
   uploads with a friendlier error — defeats the AC.

10. **Test seam: extend the existing tests file, add one negative
    per rejection class, and add one `.gltf` happy-path fixture.**
    Negative cases use `test_fixtures::glb_from_json` (already
    exported under `cfg(test)`) for synthetic GLB JSON content;
    text-glTF negatives use inline JSON authored in the test
    module. No extra binary blobs checked into LFS. The one new
    positive fixture `assets/props/debug_prop_embedded.gltf` (text
    glTF with inlined single-triangle buffer) is small (< 4 KB)
    and checked in without LFS.
    *Rationale:* `glb_from_json` is the established way to author
    synthetic GLB content in this crate; inline `.gltf` JSON for
    text-format negatives is symmetric.
    *Rejected alternatives:* a binary fixture per case (LFS bloat);
    fixture reuse from VRM-shaped test fixtures (wrong topology
    for prop preflight assertions).

11. **VRM-extension GLBs imported as `kind: "prop"` are accepted.**
    Prop preflight checks structural glTF 2.0 validity only — it
    does not reject files for carrying `VRMC_vrm` or other
    extensions. Asset classification is determined by the import
    kind, not by the file's extensions.
    *Rationale:* a user who picks a VRM file as a prop has chosen
    that classification deliberately. The character path
    (`normalize_vrm`) still rejects non-VRM GLBs for
    `kind: "character"` — that boundary is preserved separately.
    *Rejected alternatives:* reject VRM-extension files in prop
    preflight — surprises the user, over-constrains the model
    layer, and entangles the two import kinds.

## Non-Goals

- New `CommandRejectionCode` enum variants.
- New bridge command, event, or wire-form change.
- External `.bin` / texture / image resource resolution (requires
  multi-upload staging redesign).
- glTF animation, skeleton, or material processing.
- Re-encoding `.gltf` → `.glb` at import time.
- Editor UX redesign around toast diagnostic codes (the diagnostic
  emission is enough for this PR; editor consumption is a
  follow-up).
- ADR creation — the change reuses ADR-0030 scoping; if a reviewer
  insists, the ADR becomes a separate follow-up.
- Updating any character/animation path or its tests.
- Fixing the stale `UNSUPPORTED_ASSET_KIND "S1 supports only
  kind=character"` rejection fixture at
  `crates/shotloom-core/tests/generate_bridge_fixtures.rs:615` —
  logged as follow-up.
- TS bridge snapshot pinning diagnostic codes from the editor side
  — Rust-side test assertions are the in-scope evidence; TS
  snapshot is a follow-up.

## Implementation Plan

**Stage A — Preflight primitive in `shotloom-gltf`:**

1. Add `crates/shotloom-gltf/src/prop_preflight.rs` with:
   - `pub fn preflight_prop_gltf(bytes: &[u8]) -> Result<GltfFormat, PropPreflightError>`
   - `pub enum GltfFormat { Glb, Gltf }`
   - `pub enum PropPreflightError { Decode(String), UnsupportedVersion, NoScene, NoReachableMesh, ExternalResources(String) }`

   The function returns only the detected format on success; no
   `PropPreflight` report struct. Reason: the engine consumer needs
   only the format (for URI extension); scene/mesh/node counts
   would be speculative public API.

   Body, in order:
   - **Step 1 — Format detect.** 4-byte magic compare. If first 4
     bytes are `b"glTF"` → `GltfFormat::Glb`; else
     `GltfFormat::Gltf`.
   - **Step 2 — Extract raw JSON.** For `Glb`: call
     `gltf::Glb::from_slice(bytes)` (matches `vrm_extract.rs:227`
     precedent) and take `glb.json` as the JSON chunk bytes. For
     `Gltf`: the JSON chunk is the whole input. Either step's
     failure → `Decode(error.to_string())`.
   - **Step 3 — Version probe.** Deserialize the JSON chunk into
     `serde_json::Value` and read `/asset/version`. Missing,
     non-string, or non-`"2.0"` → `UnsupportedVersion`. JSON parse
     failure here → `Decode(error.to_string())`.
   - **Step 4 — Typed parse.** Call `gltf::Gltf::from_slice(bytes)`
     to get the typed `Gltf` view (the crate handles both
     formats). Any error here → `Decode(error.to_string())`. This
     is a second pass on GLB but the cost is acceptable for
     preflight; it avoids hand-walking the raw JSON.
   - **Step 5 — Scene check.** `gltf.scenes().len() == 0` →
     `NoScene`. If scenes exist but `gltf.default_scene().is_none()`
     also → `NoScene` (the user-facing distinction between
     empty-scenes and no-default-scene is too thin to split — see
     Decision 5).
   - **Step 6 — Reachable mesh check.** Walk the default scene's
     root nodes via DFS, recursing through `node.children()`.
     Count every visited node with `node.mesh().is_some()` as a
     reachable mesh. If the count is zero → `NoReachableMesh`.
   - **Step 7 — External-resource check.** For each
     `gltf.buffers()` whose `Source` is `buffer::Source::Uri(s)`,
     require `s.starts_with("data:")`; else
     `ExternalResources(s.to_string())`. Same for `gltf.images()`
     with image `Source::Uri(s)`. (`Source::Bin` and `Source::View`
     are inlined; accept.)
   - **Step 8 — Success.** Return `Ok(format)`.

2. Declare `mod prop_preflight;` from `lib.rs` and re-export
   `preflight_prop_gltf`, `GltfFormat`, and `PropPreflightError`.

3. Unit tests in `prop_preflight.rs` (synthetic GLBs via
   `test_fixtures::glb_from_json`):
   - happy GLB (reads `assets/props/debug_prop.glb` from
     `CARGO_MANIFEST_DIR/../../assets/props/`).
   - happy embedded text `.gltf` (new fixture
     `assets/props/debug_prop_embedded.gltf`).
   - `Decode`: wrong magic, truncated bytes, malformed JSON, broken
     GLB length header.
   - `UnsupportedVersion`: synthetic glTF with
     `asset.version = "1.0"`.
   - `NoScene`: synthetic glTF with empty `scenes` array.
   - `NoScene`: synthetic glTF with non-empty `scenes` but no
     `scene` index (covers the no-default-scene case).
   - `NoReachableMesh`: synthetic glTF with one scene, one root
     node with no mesh and no children.
   - `NoReachableMesh`: synthetic glTF with a `meshes` array but
     no node references any mesh.
   - `ExternalResources`: synthetic glTF with
     `buffers[0].uri = "external.bin"`.
   - `ExternalResources`: synthetic glTF with
     `images[0].uri = "external.png"`.

**Stage B — Engine handler integration:**

4. In `crates/shotloom-engine/src/bridge/handlers/assets.rs`:
   - Replace the body of `handle_import_prop_asset` to call
     `shotloom_gltf::preflight_prop_gltf(&bytes)`.
   - On `Err(e)`:
     - Compute `(rejection_code, diag_code) =
       prop_preflight_error_to_rejection(&e)` per the Decision 5
       table.
     - Compute `message = prop_preflight_diagnostic_message(&e)`
       per Decision 6.
     - `bridge.emit_event(ValidationDiagnostics { … }, cmd_id)`.
     - `bridge.emit_event(CommandRejected { rejection: … }, cmd_id)`.
     - Return without registering an asset.
   - On `Ok(format)`:
     - Pass `format` to `build_prop_asset_entry`.
     - Keep the rest of the success flow: `cache_imported_asset_bytes`
       → `manifest.assets.insert_entry` → `AssetRegistered` →
       `BundleChanged`. **Do not change** the existing
       `cache_imported_asset_bytes` failure-path behavior or its
       error message.
   - **Delete** `validate_prop_import_bytes` (lines 472-498). The
     prop registration path must have no remaining definition or
     call site for it; `shotloom_gltf::preflight_prop_gltf` is the
     only prop-byte validation path before registration.

5. Update `build_prop_asset_entry` signature to take a
   `GltfFormat` and select the URI extension:
   - `GltfFormat::Glb` → `assets/props/{asset_id}.glb`
   - `GltfFormat::Gltf` → `assets/props/{asset_id}.gltf`

6. Add tests in
   `crates/shotloom-engine/src/bridge/tests/assets.rs`:
   - `import_prop_asset_registers_gltf_entry` — happy text `.gltf`
     (asserts URI ends in `.gltf`, `AssetRegistered` then
     `BundleChanged`).
   - `import_prop_asset_rejects_with_decode_diagnostic` — wrong
     magic. Asserts the two-event order
     `ValidationDiagnostics` then `CommandRejected`, the
     diagnostic `code = "gltf_decode_failed"`, the rejection
     `code = AssetDecodeFailed`, and that NO `AssetRegistered`
     event is emitted.
   - `import_prop_asset_rejects_when_unsupported_version` —
     synthetic glTF with `asset.version = "1.0"`. Assert
     `code = "gltf_unsupported_version"` + `AssetValidationFailed`.
   - `import_prop_asset_rejects_when_no_scene` — empty `scenes`.
     Assert `code = "gltf_no_scene"`.
   - `import_prop_asset_rejects_when_no_reachable_mesh` —
     scene with one node, no mesh. Assert
     `code = "gltf_no_reachable_mesh"`.
   - `import_prop_asset_rejects_when_external_buffer` —
     `buffers[0].uri = "external.bin"`. Assert
     `code = "gltf_external_resources"`.
   - Every rejection test additionally asserts that the upload
     staging map no longer contains the upload_id (drain
     invariant preserved).

**Stage C — Editor picker accept-list:**

7. Update `createWebPropBinding` in
   `apps/editor/src/runtime/web.ts` accept argument to
   `".glb,.gltf,model/gltf-binary,model/gltf+json"`.

8. Update `tauri_stage_prop_from_dialog` in
   `crates/shotloom-tauri/src/tauri_commands.rs:285`:
   `add_filter("glTF", &["glb", "gltf"])`.

9. The existing `WorldAssetsPanel.test.tsx` mocks
   `pickAndStageProp` so it covers the dispatch shape unchanged;
   no test churn there. No new editor unit test needed for the
   accept-list change (the binding is a thin DOM input wrapper).

**Stage D — Docs:**

10. Update `docs/ipc/bridge-contract.md §14`:
    - Replace the sentence "S1 accepts `kind: \"character\"` and
      `kind: \"animation\"`" with a sentence covering all three
      kinds, including the GLB-and-embedded-`.gltf` acceptance
      for `kind: "prop"`.
    - Add a payload example with `"kind": "prop"`.
    - Add a bullet listing the five new diagnostic codes mapped
      to the existing rejection codes (the same table from
      Decision 5).

11. Update `docs/arch/system-architecture.md` line 812:
    - Remove the "`.gltf` supported if needed" conditional and
      describe the embedded-only `.gltf` path as part of Alpha
      prop import.

12. Update `crates/shotloom-gltf/src/lib.rs` crate-root docstring
    to mention generic glTF prop preflight in addition to VRM
    normalization.

## Acceptance Criteria

- [ ] `crates/shotloom-gltf/src/prop_preflight.rs` exists with
      public `preflight_prop_gltf` (returning
      `Result<GltfFormat, PropPreflightError>`), `GltfFormat`, and
      `PropPreflightError`; unit tests cover decode
      (4 cases) / unsupported-version (1) / no-scene (2 cases) /
      no-reachable-mesh (2 cases) / external-buffer (1) /
      external-image (1) / happy-GLB (1) / happy-embedded-`.gltf`
      (1) — 13 total.
- [ ] `handle_import_prop_asset` delegates structural validation
      to `preflight_prop_gltf` and emits structured
      `ValidationDiagnostics` followed by `CommandRejected` (in
      that order, test-asserted) with exactly one of
      `gltf_decode_failed`, `gltf_unsupported_version`,
      `gltf_no_scene`, `gltf_no_reachable_mesh`,
      `gltf_external_resources` on every rejection.
- [ ] `validate_prop_import_bytes` definition and call site are
      deleted; the only prop-byte validation path before
      registration is `shotloom_gltf::preflight_prop_gltf`.
- [ ] `prop_preflight_diagnostic_message` mapper function owns
      every prop-import diagnostic message; only `Decode(detail)`
      carries dynamic detail and uses a fixed prefix.
- [ ] Editor web picker accept-list includes both `.gltf` and
      `.glb`; Tauri picker filter accepts both extensions.
- [ ] A `.gltf`-format prop import registers as an
      `AssetKind::Prop` manifest entry whose URI ends in `.gltf`
      and is spawnable via the existing `spawn_prop_from_asset`
      path.
- [ ] A VRM-extension GLB imported as `kind: "prop"` passes
      preflight and registers as a prop asset.
- [ ] No new `CommandRejectionCode` variants; no new bridge
      command; no new bridge event.
- [ ] `docs/ipc/bridge-contract.md §14` lists `kind: "prop"` with
      an example payload and the five diagnostic-code mappings.
- [ ] `docs/arch/system-architecture.md` prop / format section
      reflects that `.gltf` (embedded) is now accepted, not
      conditional.
- [ ] `crates/shotloom-gltf/src/lib.rs` crate docs mention prop
      preflight alongside VRM normalization.
- [ ] All pre-existing prop import behavior is preserved:
      `WorldAssetsPanel` UX unchanged, the existing
      `import_prop_asset_registers_prop_ref` test stays green,
      and `spawn_prop_from_asset` tests stay green.
- [ ] The existing `cache_imported_asset_bytes` failure-path
      behavior and message are unchanged.
- [ ] Staged-byte drain invariant preserved: every rejection
      path drains `upload_staging.take_with_len`; engine tests
      assert post-rejection that the upload_id is no longer in
      the staging map.
- [ ] The character path's non-VRM GLB rejection at
      `kind: "character"` is unchanged.

## Verification

- `cargo test -p shotloom-gltf prop_preflight` — focused
  preflight unit tests.
- `cargo test -p shotloom-engine -- bridge::tests::assets::import_prop` —
  focused engine integration tests.
- `cargo fmt --check` — formatting gate.
- `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings` —
  workspace lint gate.
- `cargo check --workspace --exclude shotloom-desktop` — workspace
  type check.
- `cargo test --workspace --exclude shotloom-desktop` — workspace
  regression gate.
- `pnpm validate:rust` — repo-orchestrated Rust gate.
- `pnpm test:web` — full editor test gate (covers existing
  `WorldAssetsPanel.test.tsx`).
- `node scripts/validate-doc-paths.mjs` — doc-path gate after
  `bridge-contract.md` and `system-architecture.md` edits.
- `node scripts/validate-ci-rust-coverage.mjs` — CI Rust
  coverage gate.
- Targeted re-read of `git diff -- crates/shotloom-core/src/bridge/mod.rs` —
  must show NO new `CommandRejectionCode` variant.
- Targeted re-read of `git diff -- contracts/` — must show NO
  wire-shape change.
- Targeted re-read of
  `git diff -- crates/shotloom-engine/src/bridge/handlers/assets.rs` —
  must show `validate_prop_import_bytes` removed (no remaining
  definition or call site).
- Manual repro from `pnpm dev:web`: click Load prop and pick
  (a) the existing `debug_prop.glb`, (b) the new embedded
  `debug_prop_embedded.gltf`, (c) a malformed glb with wrong
  magic, (d) a glTF declaring `asset.version = "1.0"`, (e) a
  glTF with empty `scenes`, (f) a glTF with one scene + node but
  no mesh, (g) a glTF that references `external.bin`. Verify the
  panel populates for (a)+(b) and the toast /
  `validation_diagnostics` carries the matching code from the
  Decision 5 table for (c) through (g).
- Manual repro: pick a VRM `.glb` via the prop loader and confirm
  it registers (Decision 11).
- `/shotloom-review-before-pr` after push — Rust + TS + docs
  lenses apply; key review targets are diagnostic-code coverage,
  the mapper-function ownership of message strings, reuse of
  existing `CommandRejectionCode` variants, the staged-byte drain
  invariant, and the `validate_prop_import_bytes` deletion.

## Traps

- **Do not add new `CommandRejectionCode` variants.** Diagnostic
  granularity belongs in the `Diagnostic.code` string field; the
  enum is the wire protocol and changing it churns snapshots
  across every bridge consumer.
- **Do not move the `preflight_prop_gltf` call above the
  `upload_staging.take_with_len` drain.** That leaks the upload
  budget on every rejection path. The handler comment at
  `assets.rs:93-97` is the canonical invariant.
- **Do not normalize `.gltf` → `.glb` at import time.** Downstream
  loaders dispatch on URI extension; re-encoding would require
  an encoder choice and is out of scope.
- **Do not trust the filename extension for format detection.**
  The Tauri picker and the web staging layer can send arbitrary
  filenames for staged bytes. Always magic-detect from the
  leading 4 bytes.
- **Do not accept external `.bin` / texture / image URIs.** The
  upload-staging contract is single-file; resolving external
  resources at preflight time would silently fetch arbitrary
  URIs. Reject every non-`data:` URI on `buffers` and `images`.
- **Do not skip the `/asset/version` JSON probe.** The typed
  `gltf` crate can collapse glTF 1.0 inputs into a generic parse
  error; without the explicit probe, the
  `gltf_unsupported_version` diagnostic is unreachable.
- **Do not reject VRM-extension GLBs at the prop preflight.**
  Decision 11: prop import is structural-only. The character
  path's VRM rejection lives at `normalize_vrm` and is separate.
- **Do not invent diagnostic messages outside the
  `prop_preflight_diagnostic_message` mapper.** Inline `format!`
  at rejection sites fragments the message surface; review and
  i18n must have a single source of truth.
- **Do not change the
  `cache_imported_asset_bytes` failure-path behavior or
  message.** That path is shared with VRM/animation imports and
  must stay byte-identical in observable output.
- **Do not extend the test fixture set with multiple binary
  GLBs.** Use `test_fixtures::glb_from_json` for synthetic GLB
  content; inline glTF JSON for text-format negatives.

## Follow-Up Candidates

- External-resource glTF support (multi-upload staging redesign).
- Editor toast UX that branches on `diagnostic.code` to render
  case-specific help text.
- TS bridge snapshot pinning the five diagnostic codes from the
  editor side (Rust-side assertions cover them in this PR).
- Fix the stale `UNSUPPORTED_ASSET_KIND "S1 supports only
  kind=character"` rejection fixture at
  `crates/shotloom-core/tests/generate_bridge_fixtures.rs:615`.
- Prop normalization / re-encoding policy (would require an ADR).
- Sharing the structural preflight with the character import path
  (currently `normalize_vrm` covers VRM-shaped validation
  independently; sharing could reduce duplication).
- `.glTF-Binary` / zip-bundle / `.glTF-Asset` extension support.

## Open Questions

None for this PR. Multi-file upload, normalization policy, and
ADR authoring belong in separate follow-up issues if pursued.
