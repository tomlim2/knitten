---
status: completed
created: 2026-05-13
updated: 2026-05-17
load: triggered
trigger: working STL-406 — harden GLB prop import preflight
repo: shotloom
linear: STL-406
---

# Harden GLB prop import preflight

## Cold-Start Summary

STL-406 is **not** a greenfield prop import feature. The current `shotloom`
tree already has the prop import wire shape, editor entry point, engine branch,
in-memory asset overlay, and `spawn_prop_from_asset` path.

The remaining work is to replace the engine-local GLB header check with a real
`shotloom-gltf` preflight for usable prop GLB files, then document and test that
boundary. Keep this PR GLB-only. Do not add `.gltf` support in this pass.

---

## Current State

Verified against `/Users/younsoolim/Desktop/www/shotloom` on 2026-05-13.

| Surface | Current state | Evidence |
|---|---|---|
| Bridge kind | `AssetImportKind::Prop` already exists | `crates/shotloom-core/src/bridge/mod.rs` |
| Bridge command | `ImportAsset { kind, upload_id, filename, display_name }` already carries prop | `BridgeCommand::ImportAsset` |
| Rust serde test | `import_prop_asset_command_serde_round_trip` already exists | `crates/shotloom-core/src/bridge/mod.rs` |
| TS type | `AssetImportKind` already includes `"character"`, `"animation"`, and `"prop"` | `apps/editor/src/bridge/types.ts` |
| Editor UI | World Assets panel already dispatches `kind: "prop"` | `apps/editor/src/components/WorldAssetsPanel.tsx` |
| Web picker | prop picker accepts `.glb,model/gltf-binary` only | `apps/editor/src/runtime/web.ts` |
| Tauri picker | prop dialog filters `GLB` only | `crates/shotloom-tauri/src/tauri_commands.rs` |
| Engine handler | `AssetImportKind::Prop` branch registers `AssetKind::Prop` | `crates/shotloom-engine/src/bridge/handlers/assets.rs` |
| Current validation | engine-local `.glb` extension + GLB header/version/length only | `validate_prop_import_bytes` |
| Asset overlay | imported prop bytes are served as `assets/props/<asset_id>.glb` | `crates/shotloom-engine/src/bundled_asset_source.rs` |
| Spawn path | `spawn_prop_from_asset` already exists and uses registered prop assets | `crates/shotloom-engine/src/bridge/handlers/props.rs` |
| Fixture | committed GLB fixture exists | `assets/props/debug_prop.glb` |

---

## Problem

The current prop import handler accepts any `.glb` whose container header looks
valid. It does not prove that the GLB is a glTF 2.0 scene with a reachable mesh,
so a user can import bytes that register as a prop asset but later spawn as
empty or unusable scene content.

The current failure path also collapses every prop preflight failure into
`ASSET_DECODE_FAILED` with an opaque string. That is too weak for tests and UI
diagnostics.

---

## Locked Decisions

1. **Scope is GLB-only.**
   - Support `.glb` in this PR.
   - Do not support `.gltf` here. `.gltf` commonly needs external buffers and
     images, while the current upload staging and bundled asset reader model
     carries one staged byte blob and serves `assets/props/<asset_id>.glb`.
   - Rejected: silently accepting `.gltf` and hoping Bevy resolves side files.

2. **Keep the existing bridge wire shape.**
   - Use `ImportAsset { kind: "prop", upload_id, filename, display_name }`.
   - Do not add `ImportProp`.
   - Do not add `CommandAccepted`; the existing success events are
     `AssetRegistered` and `BundleChanged`.

3. **Move prop preflight into `shotloom-gltf`.**
   - Add a small prop preflight module owned by `shotloom-gltf`.
   - The engine handler calls that module and only maps its result to bridge
     events.
   - Update `shotloom-gltf` crate docs because this expands the crate from
     VRM-only language to general glTF prop preflight.

4. **Preflight proves reachable mesh content, not render quality.**
   - Required: valid GLB container, glTF asset version 2.0, at least one scene,
     and at least one scene-reachable node that references a valid mesh.
   - Scan all scenes. Pass if any scene yields at least one reachable mesh node;
     do not restrict validation to the default scene only.
   - Recommended: require the referenced mesh to contain at least one primitive.
   - VRM GLB is still valid glTF 2.0 content. If the user imports it through
     `kind: "prop"`, prop preflight may pass; asset classification is determined
     by the user's import kind, not by rejecting VRM extensions in this preflight.
   - Prop preflight is binary pass/fail and emits no success warnings. Unlike
     the VRM character path, it should not emit `ValidationDiagnostics` together
     with `AssetRegistered` in this PR.
   - Out of scope: material quality, texture availability, skinning, animation,
     scale normalization, thumbnail generation, and buffer/accessor data
     integrity beyond structural glTF parsing.

5. **Use broad bridge rejection code plus detailed diagnostic code.**
   - Keep `CommandRejectionCode::AssetDecodeFailed` for container / parse
     failures.
   - Use `CommandRejectionCode::AssetValidationFailed` for valid glTF that does
     not meet the prop scene/mesh requirement.
   - Emit `ValidationDiagnostics` before `CommandRejected` with stable diagnostic
     codes such as:
     - `prop_not_glb`
     - `prop_bad_glb_header`
     - `prop_unsupported_gltf_version`
     - `prop_invalid_gltf`
     - `prop_no_scene`
     - `prop_no_reachable_mesh`
   - Do not add a lowercase `reason_code` field to `CommandRejected`; that is
     not the current bridge shape.
   - Diagnostic message ownership is fixed in the engine mapper. The mapper must
     use the message table in S2; implementation must not invent ad hoc strings
     at call sites.
   - Non-`InvalidGltf` messages are fixed static strings. `InvalidGltf(detail)`
     uses the fixed prefix from S2 plus the parser detail.

6. **Preserve existing runtime invariants.**
   - `handle_import_asset` must keep taking staged bytes before validation so
     rejection paths still evict staged uploads.
   - Imported prop URI remains `assets/props/<asset_id>.glb`.
   - Character import must continue rejecting generic non-VRM GLB.

---

## Non-Goals

- `.gltf` multi-file import.
- External buffer or image resolution.
- New bridge command or new event type.
- New prop spawn behavior.
- Drag-and-drop import.
- Prop thumbnail generation.
- New ADR, unless implementation reveals a broader import-contract decision.

---

## Implementation Plan

### S0 — Baseline Check

Before editing, verify the current state:

```bash
cd /Users/younsoolim/Desktop/www/shotloom
git status --short
rg -n "AssetImportKind::Prop|handle_import_prop_asset|pickAndStageProp|createWebPropBinding|tauri_stage_prop_from_dialog" crates apps
```

Expected:
- Prop import branch exists.
- World Assets panel already dispatches `kind: "prop"`.
- Web and Tauri pickers are GLB-only.

### S1 — Add `shotloom-gltf` Prop Preflight

Add a new module:

```text
crates/shotloom-gltf/src/prop_preflight.rs
```

Expose from `crates/shotloom-gltf/src/lib.rs`:

```rust
pub use prop_preflight::{preflight_prop_glb, PropPreflightError};
```

Suggested API:

```rust
pub fn preflight_prop_glb(filename: &str, bytes: &[u8]) -> Result<(), PropPreflightError>;

pub enum PropPreflightError {
    NotGlb,
    BadGlbHeader,
    UnsupportedGltfVersion,
    InvalidGltf(String),
    NoScene,
    NoReachableMesh,
}
```

Do not expose a `PropPreflightReport` in this PR. No out-of-module consumer
needs counts yet, so a report type would be speculative public API.

Implementation notes:
- Use the existing `gltf` crate dependency.
- Validate the filename extension inside `preflight_prop_glb` before inspecting
  bytes. A missing or non-`.glb` extension, compared with
  `eq_ignore_ascii_case("glb")`, returns `PropPreflightError::NotGlb`.
- Classify container header failures before handing bytes to the `gltf` crate:
  - `BadGlbHeader`: bytes are shorter than the 12-byte GLB header, the header
    cannot be read, the GLB container version is unsupported, or the declared
    total length is inconsistent.
  - `NotGlb`: the filename is not `.glb`, or a readable 12-byte header exists
    but the magic is not `glTF`.
- Use `gltf::Glb::from_slice(bytes)` for GLB container parsing, matching the
  precedent in `crates/shotloom-gltf/src/vrm_extract.rs`. Do not call
  `gltf::Gltf::from_slice` directly on GLB container bytes.
- Inspect the GLB JSON chunk before typed glTF parsing.
  Read `/asset/version` from the raw JSON and reject any missing or non-`"2.0"`
  value as `UnsupportedGltfVersion`. Calling a typed glTF parser first can
  collapse glTF 1.0 input into a generic parse error, which would make this
  variant unreachable.
- Traverse each scene's root nodes and descendants. Count a mesh node only when
  it is reachable from a scene root.
- Scan every scene. Validation passes if any scene contains at least one
  reachable mesh node.

Tests:
- Place synthetic negative unit tests inline in
  `crates/shotloom-gltf/src/prop_preflight.rs` under `#[cfg(test)]`.
- Put the committed fixture happy-path coverage in the existing
  `crates/shotloom-gltf/tests/` integration-test layout.
- Happy path: `assets/props/debug_prop.glb` passes.
- Reject a valid GLB payload when `filename` has a non-`.glb` extension.
- Reject non-GLB bytes.
- Reject GLB with unsupported `/asset/version`.
- Reject GLB with no `scenes`.
- Reject GLB with scene nodes but no reachable mesh.
- Reject GLB with mesh array but mesh node unreachable from every scene root.

Use synthetic GLBs for negative cases. `shotloom-gltf` already has
`test_fixtures::glb_from_json` behind `#[cfg(any(test, feature = "test-fixtures"))]`.

### S2 — Replace Engine-Local Header Check

Modify:

```text
crates/shotloom-engine/src/bridge/handlers/assets.rs
```

Replace `validate_prop_import_bytes` with a call to
`shotloom_gltf::preflight_prop_glb(&filename, bytes.as_ref())`.

Delete the old `validate_prop_import_bytes` helper. After the change, the prop
registration path must have no remaining definition or call site for
`validate_prop_import_bytes`; `shotloom_gltf::preflight_prop_glb` is the only
prop-byte validation path before registration.

Add a mapper:

```rust
fn prop_preflight_error_to_events(
    err: &PropPreflightError,
) -> (CommandRejectionCode, Diagnostic)

fn prop_preflight_diagnostic_message(err: &PropPreflightError) -> String
```

Mapping policy:

| Error class | Command rejection | Diagnostic code | Diagnostic message source |
|---|---|---|---|
| `NotGlb` | `AssetDecodeFailed` | `prop_not_glb` | `Prop import expects a binary .glb file.` |
| `BadGlbHeader` | `AssetDecodeFailed` | `prop_bad_glb_header` | `Prop GLB has an invalid container header.` |
| `UnsupportedGltfVersion` | `AssetValidationFailed` | `prop_unsupported_gltf_version` | `Prop GLB must declare glTF asset version 2.0.` |
| `InvalidGltf(detail)` | `AssetDecodeFailed` | `prop_invalid_gltf` | `Prop GLB could not be parsed as glTF 2.0: {detail}` |
| `NoScene` | `AssetValidationFailed` | `prop_no_scene` | `Prop GLB must contain at least one scene.` |
| `NoReachableMesh` | `AssetValidationFailed` | `prop_no_reachable_mesh` | `Prop GLB must contain a mesh node reachable from a scene.` |

The mapper owns both the diagnostic code and the diagnostic message. Implement
the message function as a fixed `match`/static table over `PropPreflightError`.
Use `Diagnostic::error(code, prop_preflight_diagnostic_message(err))`. Do not
rely on `Display` output or construct diagnostic messages in the import handler
body. Only `InvalidGltf(detail)` may include dynamic detail, and it must use the
stable prefix shown above.

On failure:
1. Emit `BridgeEvent::ValidationDiagnostics { diagnostics: vec![diagnostic] }`.
2. Emit `BridgeEvent::CommandRejected { rejection }`.
3. Return without registering the asset.

On success:
- Keep the existing flow:
  - build `AssetCatalogEntry { kind: AssetKind::Prop, uri: "assets/props/<id>.glb" }`
  - cache bytes in `BundledVrmAssets`
  - emit `AssetRegistered`
  - emit `BundleChanged`
- Preserve the existing `cache_imported_asset_bytes` failure path and message.
  If caching imported prop bytes fails, return through that existing rejection
  path without registering the asset.

Tests:
- Engine prop import rejection test covers the two-event failure order:
  `ValidationDiagnostics` then `CommandRejected`.
- Editor bridge snapshot covers the prop rejection wire shape, for example
  `apps/editor/src/bridge/__tests__/__snapshots__/prop_import_rejected.expected.json`.

### S3 — Adjust Editor Only If Needed

No new editor feature should be required for GLB-only hardening.

Check but do not expand by default:
- `apps/editor/src/runtime/web.ts` should stay `.glb,model/gltf-binary`.
- `crates/shotloom-tauri/src/tauri_commands.rs` should stay `GLB`.
- `apps/editor/src/components/WorldAssetsPanel.tsx` already dispatches
  `kind: "prop"`.

Only edit editor files if diagnostics/toast handling currently hides the
failure details needed by acceptance.

### S4 — Update Docs

Update:

| File | Required update |
|---|---|
| `crates/shotloom-gltf/src/lib.rs` | Mention general GLB prop preflight in crate docs. |
| `docs/ipc/bridge-contract.md` | Document `ImportAsset kind: "prop"`, GLB-only scope, success events, rejection mapping. |
| `docs/arch/system-architecture.md` | Describe prop GLB import as a narrow asset pipeline under existing import architecture. |
| `MAP.md` | Update only if the new `shotloom-gltf` prop preflight public surface needs a navigation entry. |

Do not document `.gltf` as supported.

---

## Acceptance Criteria

- [ ] `shotloom_gltf::preflight_prop_glb` exists and is public.
- [ ] `preflight_prop_glb` takes both `filename` and `bytes`, and rejects
      non-`.glb` filenames before registration.
- [ ] Prop GLB preflight rejects non-GLB bytes, malformed GLB, unsupported glTF
      version, no scene, and no scene-reachable mesh.
- [ ] `assets/props/debug_prop.glb` passes preflight.
- [ ] `ImportAsset { kind: "prop" }` uses the new preflight.
- [ ] The `validate_prop_import_bytes` definition and call site are removed;
      prop registration has no validation path except
      `shotloom_gltf::preflight_prop_glb`.
- [ ] Failed prop import emits `ValidationDiagnostics` with a stable diagnostic
      code and mapper-owned message, then `CommandRejected`.
- [ ] Mapper tests cover every `PropPreflightError` variant and assert rejection
      code, diagnostic code, and exact fixed message or `InvalidGltf` prefix.
- [ ] Editor bridge snapshots include a prop import rejection fixture covering
      the `ValidationDiagnostics` plus `CommandRejected` event sequence.
- [ ] Failed prop import does not register an asset and still drains staged
      upload bytes.
- [ ] Existing `cache_imported_asset_bytes` failure behavior and message are
      unchanged.
- [ ] Successful prop import still emits `AssetRegistered` and `BundleChanged`.
- [ ] Imported prop asset still spawns through existing `spawn_prop_from_asset`.
- [ ] VRM GLB is not rejected solely for having VRM extensions when imported as
      `kind: "prop"`.
- [ ] Generic non-VRM GLB still fails under `kind: "character"`.
- [ ] Docs state GLB-only support and do not promise `.gltf`.

---

## Verification

Run focused gates first:

```bash
cargo fmt --check
cargo test -p shotloom-gltf prop_preflight
cargo test -p shotloom-gltf
cargo test -p shotloom-engine import_prop
cargo test -p shotloom-core import_prop
pnpm test:web -- src/bridge/__tests__/contract.test.ts
pnpm test:web -- WorldAssetsPanel
node scripts/validate-doc-paths.mjs
```

Then run broader gates if focused gates are green:

```bash
cargo clippy --workspace --exclude shotloom-desktop -- -D warnings
cargo check --workspace --exclude shotloom-desktop
pnpm validate:rust
pnpm test:web
```

Manual repro:

1. `pnpm dev:web`
2. Open editor.
3. Open World Assets.
4. Import `assets/props/debug_prop.glb`.
5. Confirm the prop asset appears.
6. Click it and confirm `spawn_prop_from_asset` places it in the current shot.
7. Import targeted invalid samples and confirm each emits
   `ValidationDiagnostics` followed by `CommandRejected`:
   - Rename a text file to `.glb`: `prop_not_glb`.
   - Import a zero-byte `.glb`: `prop_bad_glb_header`.
   - Import a GLB whose JSON declares non-`"2.0"` `/asset/version`:
     `prop_unsupported_gltf_version`.
   - Import a structurally invalid glTF 2.0 GLB: `prop_invalid_gltf`.
   - Import a glTF 2.0 GLB with `scenes: []`: `prop_no_scene`.
   - Import a GLB with mesh data but no mesh node reachable from any scene root:
     `prop_no_reachable_mesh`.
8. Try a VRM GLB through `kind: "prop"` and confirm it follows the prop path if
   it is valid glTF 2.0 with a reachable mesh.
9. Try generic GLB as `kind: "character"` through the existing character path or
   smoke test; confirm it still fails.

---

## Traps

- Do not implement `.gltf` unless the task is explicitly expanded to multi-file
  import.
- Do not add `CommandAccepted`; no such bridge event exists.
- Do not add a separate `ImportProp` command.
- Do not add lowercase `reason_code` to `CommandRejected`.
- Do not move validation above staged-byte draining in `handle_import_asset`.
- Do not change the existing `cache_imported_asset_bytes` failure path.
- Do not change `assets/props/<asset_id>.glb` URI shape.
- Do not modify prop spawn, gizmo, or selection behavior as part of this PR.
- Do not reject VRM-extension GLBs solely because they are VRM when the user
  imports them as `kind: "prop"`.
- Do not treat prop preflight as full buffer/accessor integrity validation.
- Do not loosen character VRM validation to make prop GLBs pass there.

---

## Follow-Up Candidates

- `.gltf` import with external buffer/image bundling.
- Prop thumbnail generation.
- Rich material/texture diagnostics.
- Asset inspector metadata for imported props.
- Shared import diagnostic taxonomy if multiple import kinds need the same
  structured rejection detail.
