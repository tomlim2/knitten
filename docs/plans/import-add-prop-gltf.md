---
status: open
created: 2026-05-13
updated: 2026-05-13
load: triggered
trigger: working STL-406 — GLB/GLTF prop file import path
repo: shotloom
linear: STL-406
---

# Add GLB/GLTF prop file import path

## Intent

Extend the existing `ImportAsset` bridge command with a third kind
(`"prop"`) so a user can pick a generic glTF 2.0 file (GLB or .gltf) in
the editor, run a minimal preflight, register an `AssetKind::Prop`
manifest entry, and place it through the existing `spawn_prop_from_asset`
path. The work reuses every downstream primitive that already exists —
`AssetKind::Prop`, `PropModel`, `spawn_prop`, `spawn_shot_entities` prop
traversal, World Assets panel listing, the spawn click handler from
PR #306. What stays unchanged: VRM character import path, animation
import path, prop spawn-from-registered-asset path, gizmo / selection
behaviour after spawn.

The boundary asserted by PR #313 (STL-400) — that
`ImportAsset { kind: "character" }` refuses a generic non-VRM GLB — must
remain green. This work adds a sibling kind, not a loosening of the
character validator.

## Decisions (locked)

1. **Wire shape:** `ImportAsset { kind: "prop", upload_id, filename, display_name }`
   - Rationale: mirrors existing `kind: "character"` / `kind: "animation"`
     adjacent-tagged shape per ADR-0041 and the `BridgeCommand` union in
     `crates/shotloom-core/src/bridge/`. No new envelope, no new staging
     contract.
   - Rejected: a separate `ImportProp` command. Would bifurcate the
     import surface and break the kind-tagged pattern other handlers
     already rely on.
2. **Preflight scope:** glTF 2.0 parse + at least one scene with at
   least one node referencing a mesh.
   - Rationale: matches the "minimal scene/node/mesh existence" line in
     Linear scope. Anything richer (materials, textures, skin) is out of
     scope and routes through a follow-up issue if needed.
   - Rejected: full material/texture/animation validation up front.
     Pushes work outside the issue boundary and the asset can still be
     rendered later by `shotloom-engine` even if material support is
     thin.
3. **Preflight crate ownership:** lives in `shotloom-gltf` as a new
   public function (e.g. `preflight_prop_glb(bytes) -> Result<PropPreflightReport, PropPreflightError>`),
   not duplicated into `shotloom-import` or the engine handler.
   - Rationale: `shotloom-gltf` already owns glTF parse surface; the
     handler in `shotloom-engine` should only orchestrate.
   - Rejected: inline parse inside the engine handler. Would block reuse
     from future native/CLI ingest paths and from tests that want to
     exercise preflight without spinning up the engine.
4. **Rejection taxonomy:** preflight failure surfaces as a typed error
   variant that the engine handler maps to a `CommandRejected` payload
   with a stable `reason_code`. Codes considered: `not_glb`, `bad_glb_header`,
   `unsupported_gltf_version`, `no_scene`, `no_mesh`.
   - Rationale: ADR-0021 cross-crate diagnostic type — typed errors at
     the crate boundary, mapped to a `BridgeEvent`-friendly shape at the
     handler boundary. Same shape character/animation import already
     follows.
   - Rejected: opaque string error. Loses test discrimination and review
     gate for follow-up UX work.
5. **No new ADR.** Both STL-401's closing note and STL-406's scope frame
   this as a sibling extension of an existing pattern (character/animation
   import + prop spawn), not a new architectural axis. If the rejection
   taxonomy in (4) grows into a cross-crate concern beyond this PR, file
   the ADR as a follow-up — not in this scope.
6. **Editor surface:** a file picker entry point in the World Assets
   panel (button next to the existing import controls). Drag-and-drop is
   out of scope per Linear `## 제외`.

## Acceptance

- [ ] User selects a GLB/GLTF file in the editor and imports it as a
      prop asset.
- [ ] Successful import produces an `AssetKind::Prop` manifest entry
      that appears in the World Assets panel.
- [ ] The imported prop asset spawns into the current shot via the
      existing `spawn_prop_from_asset` path (no new spawn command).
- [ ] Prop import failure surfaces as `CommandRejected` or a validation
      diagnostic with a stable reason code.
- [ ] `ImportAsset { kind: "character" }` continues to refuse a generic
      non-VRM GLB (PR #313 smoke test stays green).
- [ ] Rust core serde fixture and TS bridge type / snapshot pin the
      `kind: "prop"` import wire shape.
- [ ] Engine/editor tests cover prop import → asset registered → world
      asset list → spawn command dispatch (or engine spawn boundary).
- [ ] `docs/ipc/bridge-contract.md` and `docs/arch/system-architecture.md`
      reflect the new prop import path.

## File map

| File | Kind | Note |
|------|------|------|
| `crates/shotloom-core/src/bridge/mod.rs` (or kind enum) | modify | add `"prop"` variant to import-kind union + serde fixture |
| `crates/shotloom-core/src/bridge/<fixture>.rs` | modify/add | freeze `kind: "prop"` JSON shape |
| `crates/shotloom-engine/src/bridge/handlers/assets.rs` | modify | prop import handler — call preflight, register manifest entry, emit `CommandAccepted`/`CommandRejected` |
| `crates/shotloom-gltf/src/lib.rs` (or new submodule) | add | `preflight_prop_glb` + `PropPreflightError` enum |
| `crates/shotloom-gltf/tests/` | add | unit tests for each rejection code + a happy-path scene/node/mesh fixture |
| `crates/shotloom-engine/tests/` | add | integration test — prop import command → manifest entry → world-asset visibility |
| `apps/editor/src/bridge/types.ts` | modify | extend import-kind TS union with `"prop"` |
| `apps/editor/src/runtime/` | modify | wire GLB/GLTF file picker / upload staging |
| `apps/editor/src/components/WorldAssetsPanel.tsx` | modify | prop import entry point |
| `docs/ipc/bridge-contract.md` | modify | document the new import kind + rejection codes |
| `docs/arch/system-architecture.md` | modify | reflect prop import path in the bridge / import section |

## Verification

1. `cargo fmt --check`
2. `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings`
3. `cargo check --workspace --exclude shotloom-desktop`
4. `cargo test -p shotloom-gltf` (preflight unit tests)
5. `cargo test -p shotloom-core` (serde fixture pin)
6. `cargo test -p shotloom-engine` (integration test for prop import path)
7. `pnpm validate:rust`
8. `pnpm test:web` (TS bridge snapshot)
9. `node scripts/validate-doc-paths.mjs`
10. Manual repro inside `pnpm dev:web`:
    - Open editor → World Assets panel → click prop import.
    - Pick the sample `glb_furniture_001.glb` from STL-399.
    - Verify the asset appears in the list and spawns into the current
      shot when clicked.
    - Pick a corrupt or non-glTF file; verify `CommandRejected` with the
      expected reason code surfaces in the panel/toast.
11. PR #313 smoke test still passes (sanity check the character boundary
    is untouched).

## Open questions

1. Does prop import reuse the VRM upload staging caps / TTL described in
   ADR-0032 (Proposed), or does it carve out its own staging policy? If
   ADR-0032 is still proposed at PR time, default to reusing the same
   staging surface and call it out in the PR description rather than
   pre-emptively expanding the ADR.
2. Should the rejection reason codes be promoted into a shared diagnostic
   enum next to the character/animation rejection codes, or live alongside
   `shotloom-gltf`'s other preflight errors? Decide at engine-handler
   wiring time, after seeing whether the engine maps codes 1:1 or needs a
   translation layer.
3. Editor UX wording for the import button — is "Import Prop" enough, or
   should the picker filter explicitly say `.glb` / `.gltf`? Park for the
   first PR review; not a blocker for landing the wire shape.
