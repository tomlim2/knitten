# STL-99 execution plan

Status: draft v2 (Claude-authored, 2026-04-17, revised after toy validation)  
Linear: https://linear.app/cinamon-corp/issue/STL-99  
Priority: Medium (lower than STL-110 sub-issues)  
Start condition: at least one of PR #95 / #97 merged (to keep reviewer queue ≤ 2)

---

## Pre-flight validation — toy proved the risky part

A throwaway toy at `~/Desktop/www/stl-99-toy/` (not committed to shotloom) ran the end-to-end pipeline on `avatar-sample-a-0x.vrm` (preset 13, 18.5 MB VRM 0.x). **Render succeeded in a Bevy window on Apple M4 Pro / Metal.**

### Minimum API surface the toy used (and only this)

| Call | Crate | Output shape actually consumed |
|---|---|---|
| `detect_vrm_flavor(&bytes) -> VrmFlavor` | `shotloom-gltf` | printed for log only |
| `normalize_vrm(&bytes) -> Result<NormalizedVrmAsset, VrmNormalizationError>` | `shotloom-gltf` | `normalized_bytes: Vec<u8>` (mandatory), `diagnostics: Vec<VrmDiagnostic>` (printed), `source_flavor` + `metadata_summary` (log only) |
| `VrmPlugin` + `asset_server.load::<VrmAsset>(path)` + `VrmHandle` component | `bevy_vrm1` | path-based load — in-memory byte load was NOT exercised |

**Not called by the toy** (previously listed in plan v1 as needed):
- `extract_humanoid_map` — humanoid bones are not required for render. Only `normalized_bytes` feed into `bevy_vrm1`.
- `shotloom-retarget::build_from_bytes` — retargeting is out of STL-99 acceptance scope.
- `shotloom-import` or `shotloom-engine::vrm` — toy called `shotloom-gltf` directly. Engine integration is optional.

### Observed behavior — both flavors validated end-to-end

| Fixture | Flavor | Input → Normalized | Diagnostics | Rendered? |
|---|---|---|---|---|
| `avatar-sample-a-0x.vrm` (preset 13) | Vrm0 | 18,567,024 → 18,561,104 (-6 KB) | 2 Info (license synth + 180Y 4/90) | ✅ |
| `shimaenaga-1x.vrm` (preset ≈1) | Vrm1 | 799,980 → 799,980 (identical) | 0 | ✅ |

VRM 1.x is a true byte-for-byte pass-through through `normalize_vrm` — confirmed empirically, not just inferred from code. This means STL-99's viewer code can use a single unconditional pipeline (`read → normalize_vrm → write → bevy_vrm1`) regardless of flavor — no branching required.

### Known gaps the toy did NOT prove

1. **In-memory byte load** (toy wrote normalized bytes to `assets/normalized-avatar.vrm` and used asset_server's file loader).
2. **Preset switching** (toy loaded a single hardcoded file passed via CLI arg).
3. **Diagnostic surfacing beyond stdout** (toy `println!`-ed).
4. **Interaction with STL-113/114 post-merge enum shape** (toy ran against current main enum).
5. **Backward-facing / problematic fixtures** like `minjoon-1x-backward.vrm`, `phainon-1x-backward-pmx2vrm.vrm` — normalize might emit more diagnostics or fail on these. Worth spot-checking during STL-99 implementation.

### Version compatibility note

`bevy_panorbit_camera 0.31` pulls bevy 0.17 and conflicts with shotloom's bevy 0.18. Use `bevy_panorbit_camera = "0.34"` (shotloom-retarget's version). bevy_vrm1 0.6.3 / 0.6.4 both work with bevy 0.18.

---

## Problem recap

`crates/shotloom-retarget/examples/viewer.rs` currently hands source VRM bytes directly to `bevy_vrm1`. VRM 1.x partially works; VRM 0.x doesn't because it skips `shotloom-gltf::normalize_vrm` and `shotloom-import`. Goal: rewire the viewer through the canonical pipeline and prove both 0.x and 1.x fixtures load.

## Acceptance (from Linear)

- Viewer no longer passes source bytes direct to `bevy_vrm1`.
- ≥ 1 VRM 1.x fixture loads via the assembled path.
- ≥ 1 VRM 0.x fixture loads via the assembled path.
- import/normalization diagnostics visible at viewer bring-up.
- README explains old vs new path.
- ≥ 1 preset per flavor in `fixtures.json`.

---

## Architecture

### New crate module — `shotloom-import::vrm`

The canonical pipeline should live in `shotloom-import` because that crate's purpose is "source → ready-to-consume artifact". Viewer and engine both call the same entry point.

```rust
// crates/shotloom-import/src/vrm.rs (new)
pub struct ImportedVrmAsset {
    /// Post-normalize bytes. For VRM 1.x: pass-through. For VRM 0.x:
    /// converted to canonical VRM 1.x so `bevy_vrm1` consumes it unconditionally.
    pub normalized_bytes: Vec<u8>,
    /// Info/warning observations surfaced from normalization (e.g., 180Y
    /// count, license synthesis). Viewer prints these at bring-up per acceptance.
    pub diagnostics: Vec<VrmDiagnostic>,
    /// Parsed metadata for optional UI display (window title, version label).
    pub metadata: Option<shotloom_gltf::VrmMetadataSummary>,
    /// Source flavor — lets viewer log "loaded 0.x / 1.x" without re-detecting.
    pub source_flavor: shotloom_gltf::VrmFlavor,
}

pub fn import_vrm(source_bytes: &[u8]) -> Result<ImportedVrmAsset, VrmImportError>;
```

**Dropped from plan v1**: `humanoid_map` field. The toy proved `bevy_vrm1` renders from `normalized_bytes` alone — humanoid bone mapping is not needed for render. If a future retargeting consumer needs it, they call `shotloom_gltf::extract_humanoid_map(normalized_bytes)` themselves.

**Why `shotloom-import` and not retarget**:
- Retarget's job is rest-pose → retargeting. Import's job is "turn source file into stable artifact". These are different concerns; bundling them into retarget bloats retarget.
- Engine already consumes `shotloom-import::fbx` for FBX. Adding `shotloom-import::vrm` is the symmetric VRM entry point.

**`VrmImportError` shape** — thin wrapper around the gltf error for now:

```rust
#[derive(Debug, thiserror::Error)]
pub enum VrmImportError {
    #[error("VRM normalization failed")]
    Normalize(#[from] shotloom_gltf::VrmNormalizationError),
}
```

One variant for now; extend only when a real second error path surfaces.

### Viewer surface

`viewer.rs` becomes (sketch, based on the working toy):

```rust
let fixture_bytes = std::fs::read(&preset.model)?;
let imported = shotloom_import::vrm::import_vrm(&fixture_bytes)?;

println!("Loaded {:?} — {} diagnostics", imported.source_flavor, imported.diagnostics.len());
for diag in &imported.diagnostics {
    println!("  [{:?}] {}", diag.severity, diag.message);
}

// Write normalized bytes to a predictable asset path so bevy's
// asset_server.load::<VrmAsset>() can pick it up. Toy confirmed this
// works; in-memory byte loading via a custom AssetSource was NOT needed
// to satisfy acceptance.
let out_path = viewer_asset_dir().join(preset.normalized_filename());
std::fs::write(&out_path, &imported.normalized_bytes)?;

// Bevy side, inside a startup system:
let vrm_handle: Handle<VrmAsset> = asset_server.load(preset.normalized_filename());
commands.spawn((VrmHandle(vrm_handle), Transform::default()));
```

Viewer is a thin driver. No assembly lives in `viewer.rs`.

### Engine side — NOT in scope for STL-99

The toy bypassed engine entirely and used `bevy_vrm1::VrmPlugin` directly. Acceptance does not require routing the viewer through `shotloom-engine::vrm`. **Leave engine untouched** unless a follow-up issue calls for it.

### Temp-file hop is intentional, not a workaround

`bevy_vrm1 0.6.3/0.6.4`'s asset loader consumes a path. Writing normalized bytes to a known viewer-relative asset dir (e.g., `crates/shotloom-retarget/examples/.cache/normalized-<preset_id>.vrm`, gitignored) is the pragmatic choice for an example. In-memory loading via `AssetSource` is possible but adds complexity without satisfying any acceptance criterion — skip.

---

## Fixtures — already committed

`crates/shotloom-retarget/examples/fixtures.json` already carries the assets we need:

| Preset | Flavor | Path | Size |
|---|---|---|---|
| **13** | `0x` | `fixtures/models/avatar-sample-a-0x.vrm` | 18.5 MB (toy-validated) |
| **14** | `0x` | `fixtures/models/avatar-sample-b-0x.vrm` | 19.4 MB |
| **1** | `1x` | `fixtures/models/xiao-1x.vrm` | — (existing "loaded" set) |

Presets 13/14 are currently flagged `"set": "follow_up"` (reserved for this work). When STL-99 lands they should be promoted to `"set": "loaded"` — one-line JSON edit.

**No fixture creation work required.** Acceptance ">=1 per flavor" is met by promoting preset 13 (0.x) and keeping any existing 1.x preset (e.g., preset 1 "Xiao").

---

## Commit split (single PR)

Revised after toy validation — simpler than plan v1 because `humanoid_map` was dropped from `ImportedVrmAsset` and engine integration is out of scope.

| # | Subject | What |
|---|---|---|
| 1 | `feat(import): add vrm import pipeline wrapping normalize_vrm` | New module `shotloom-import::vrm` with `ImportedVrmAsset` (normalized_bytes + diagnostics + metadata + source_flavor) + `import_vrm`. Thin wrapper; `VrmImportError` is `#[from] VrmNormalizationError` only. |
| 2 | `test(import): cover vrm0 and vrm1 happy paths through import_vrm` | Unit tests using preset 13 (0.x) and preset 1 (1.x) bytes. Asserts `source_flavor`, non-empty `normalized_bytes`, at least the known 180Y diagnostic on 0.x. |
| 3 | `test(import): reject non-vrm bytes via VrmImportError::Normalize` | Regression test: non-VRM input surfaces `VrmImportError::Normalize(VrmNormalizationError::UnsupportedFlavor)`. |
| 4 | `refactor(retarget): route example viewer through import_vrm` | Viewer calls `import_vrm`, prints diagnostics to stdout, writes normalized bytes to a gitignored `examples/.cache/` path, loads that path via `bevy_vrm1::asset_server.load`. |
| 5 | `feat(retarget): promote vrm 0.x presets to loaded set` | `fixtures.json`: flip presets 13 and 14 from `"set": "follow_up"` to `"set": "loaded"`. Keep 1.x preset (1 "Xiao") as-is. |
| 6 | `docs(retarget): document viewer old vs new load path in README` | README paragraph pair: "Before (direct bevy_vrm1 on source bytes — 0.x broken)" and "After (normalize via import_vrm → cached path → bevy_vrm1)". |

**Execution order**: 1 → 2 → 3 → 4 → 5 → 6. Commits 1/2/3 land the import helper; 4/5/6 consume it.

**Commits dropped from plan v1**: none — tests for humanoid_map were folded into the general happy-path commit since humanoid_map is no longer a field.

## PR split decision — **single PR**

Arguments for single:
- The import helper and viewer rewire are tightly coupled; splitting means PR A lands an unused helper.
- Reviewer gets one coherent review of the full load path.

Arguments for splitting:
- Reviewer bottleneck — 2 small PRs might land faster.

**Decision: single PR.** Size is moderate (~400-600 lines including fixtures + tests + README). Splitting helper + consumer creates a dead-helper PR that looks speculative.

---

## Test strategy

Per `rules/testing.md`: new surface needs unit coverage.

**Unit tests in `shotloom-import::vrm`**:
- `import_vrm_produces_imported_asset_for_vrm0_fixture` — happy VRM0 path, checks `humanoid_map.node_to_vrm` contains expected bones.
- `import_vrm_produces_imported_asset_for_vrm1_fixture` — happy VRM1 path.
- `import_vrm_rejects_non_vrm_bytes` — error surfaces as `VrmImportError::Normalize(...)`.
- `import_vrm_surfaces_normalization_diagnostics_on_vrm0` — preset-13-shaped input produces at least the 180Y-normalization diagnostic (toy observed it at severity Info).

**No Bevy smoke test for viewer.rs.** Viewer is a binary whose full integration test requires a GPU / WebGPU surface. Unit-covering `import_vrm` gives confidence in the assembly path; the Bevy hop was already validated by the pre-flight toy.

Document in PR body: "viewer manual verification — ran `cargo run --example viewer -- 13` (VRM 0.x) and `-- 1` (VRM 1.x), both rendered on macOS/Metal. Preflight proof: toy at `~/Desktop/www/stl-99-toy/` rendered preset 13 before this PR was drafted."

---

## README diff outline

Two new sections in `crates/shotloom-retarget/examples/README.md` (create if absent):

**§ Load path — old vs new (1 paragraph)**  
Before STL-99: viewer handed source VRM bytes directly to `bevy_vrm1`. VRM 0.x broke because `normalize_vrm` and VRM 0.x → 1.x conversion were skipped. After STL-99: viewer routes through `shotloom_import::vrm::import_vrm` which runs `shotloom_gltf::normalize_vrm` and surfaces diagnostics. `bevy_vrm1` only ever sees post-normalization bytes, so both 0.x and 1.x fixtures render via a single code path.

**§ Running the viewer (1 paragraph)**  
`cargo run --example viewer -- <preset>` where `<preset>` is a key from `fixtures.json` (e.g. `1` for a VRM 1.x asset, `13` for a VRM 0.x asset). Diagnostics (normalization info, license synthesis notes) print to stdout at bring-up.

---

## Risks / open questions (revised after toy)

1. **Cached normalized-bytes path in examples/** — writing `examples/.cache/normalized-<preset>.vrm` alongside the binary is the simplest route (toy used `assets/normalized-avatar.vrm` and it worked). Ensure `.cache/` is gitignored at the repo root, or add a local `examples/.cache/.gitignore` with `*`. Avoid committing multi-megabyte normalized artifacts.
2. **Dependency on STL-113 post-merge enum shape** — `VrmImportError::Normalize(#[from] VrmNormalizationError)` depends on nothing STL-113 touches, since STL-113 is about `VrmRestError`, not `VrmNormalizationError`. STL-99 is therefore independent of STL-113 merge order for its own crate. If STL-99 starts BEFORE STL-113 lands, it uses `VrmNormalizationError` directly, untouched.
3. **STL-114 re-export removal** — STL-99 must import from `shotloom_gltf` directly (not `shotloom_retarget`) for any type it uses. Toy already followed this — only `shotloom_gltf::*` symbols were touched.

---

## Prerequisites

- PR #95 or #97 merged (reviewer queue ≤ 2).
- Presets 13/14 on disk — verified (toy read them).
- Toy proof-of-concept already recorded in `Pre-flight validation` section above.
