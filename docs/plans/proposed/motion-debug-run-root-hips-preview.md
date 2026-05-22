---
status: superseded
created: 2026-05-22
updated: 2026-05-22
load: triggered
trigger: working STL-519 - Debug Run preview root/hips placement stability
repo: shotloom
linear: STL-519
briefing: ../../briefings/shotloom/motion-debug-run-root-hips-preview.md
superseded_by: debug-run-vrm-normalization-mismatch.md
---

# Stabilize Debug Run Motion Preview Placement

> Superseded on 2026-05-22 by
> `debug-run-vrm-normalization-mismatch.md`. This plan remains as diagnostic
> history for the initial root/hips placement hypothesis. Do not implement it
> for STL-519 unless a later issue explicitly reopens root-motion preview
> policy.

## Spec Contract

- Briefing basis: `docs/briefings/shotloom/motion-debug-run-root-hips-preview.md`.
- Current truth: `apply_motion_preview` implements ADR-0039 by transferring hips X/Z onto the character root, and the built-in Debug Run asset is root-motion-heavy enough to visibly move the default validation character away from authored placement.
- Required change: let built-in validation animation assets opt into placement-locked editor preview without changing retargeter output or the default ADR-0039 behavior for ordinary root-motion clips; preserve Debug Run behavior even when its boot-time asset catalog entry is absent after `new_bundle`.
- Locked boundary: no bridge payload, core model schema, timeline DTO, retargeter math, or asset replacement in this PR.
- One-PR suitability: yes; the scope is engine-local metadata interpretation plus focused tests, with schema and UX work deferred.
- Proof method: add a failing-before/passing-after `apply_motion_preview` regression for a metadata-marked large-locomotion animation, preserve the existing ADR-0039 split test for unmarked clips, and manually recheck the Debug Character + Debug Run editor flow around frame 34.

## Current State

| Surface | Classification | Evidence | Meaning |
|---|---|---|---|
| Runtime motion application | Partial | `crates/shotloom-engine/src/motion.rs::apply_motion_preview` builds `HipsTranslation`, applies hips Y locally, then applies hips X/Z delta to the character root. | The observed off-placement preview happens at the application layer, not because retarget output is absent. |
| Root-motion ADR | Already Done | `docs/adr/adr-0039-vrm-root-motion-from-hips-translation.md` chooses horizontal hips delta -> character root and vertical hips Y -> hips bone. | Do not globally remove X/Z transfer without explicitly changing the ADR contract. |
| Existing root split test | Already Done | `apply_motion_preview_splits_hips_translation_into_root_xz_and_hips_y`. | Unmarked clips must keep the ADR-0039 split behavior. |
| Existing reset test | Already Done | `apply_motion_preview_resets_root_motion_when_next_clip_has_no_hips_translation`. | The implementation must keep root placement reset when a later clip has no hips translations. |
| Built-in Debug Run seed | Partial | `crates/shotloom-engine/src/app.rs::seed_debug_character_assets_from_bytes` registers `DEBUG_RUN_ANIMATION_ASSET_ID` with empty asset metadata; the same function documents that boot-time asset entries are lost after `new_bundle` while bytes remain. | The seed has a safe place to declare editor-preview policy, but motion preview also needs an asset-id fallback when the catalog entry is absent. |
| Asset metadata model | Already Done | `crates/shotloom-core/src/model/asset.rs::AssetCatalogEntry.metadata` and `AssetRecord.metadata` are existing free-form JSON maps. | A small app/engine contract can use metadata while avoiding a core schema migration. |
| Evaluator output | Already Done | `crates/shotloom-core/src/evaluator/mod.rs::CharacterEvalState` carries `character_id`, `motion_asset_id`, and `local_frame` only. | A clip-level root-motion mode would require broader evaluator/DTO work; this PR should avoid that. |
| Retarget regression | Already Done | `retargeted_hips_carries_rest_translation_when_translations_are_present` uses the figure-eight run clip to assert hips translations exist. | Retarget output is intentionally preserving locomotion; this issue should not change that layer. |
| Debug asset tech debt | Already Done | `docs/tech-debt/wasm-debug-asset-embedding.md` documents the Debug Run FBX as an embedded debug asset. | Replacing the asset is a follow-up decision, not the smallest urgent fix. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-519` |
| State | In Progress |
| Owner | deemo |
| Goal | Stop the default Debug Run editor preview from sending the character visibly off authored placement while keeping root-motion semantics available. |
| Acceptance criteria | Stable/plausible Debug Run preview; no silent off-stage root motion for the default validation clip; regression coverage around `apply_motion_preview`; explicit follow-up if the asset itself should change. |
| Latest relevant comment | N/A |
| Blockers / dependencies | ADR-0039 must be respected or intentionally scoped around. |
| Related PRs | N/A |
| Current review state | No PR yet. |
| Planning consequence | Use asset-level preview metadata plus a `DEBUG_RUN_ANIMATION_ASSET_ID` fallback for the built-in debug asset; do not introduce clip schema or bridge changes. |

## Problem

The Debug Run asset is useful as a retarget stress clip because it carries real hips translation, but it is too strong as the default editor validation preview when root motion is always applied to the character root. The current code has only one policy: if the retargeted hips bone has translations, transfer X/Z to the root. That policy is correct for ADR-0039 root-motion playback, but it makes the default debug smoke flow look broken because the editor placement/gizmo expectation remains anchored to the authored character placement.

The remaining gap is not "make all root motion in-place." The gap is an explicit preview policy for built-in validation animations whose purpose is to prove pose application rather than authored traversal.

## Product Direction

This urgent fix is intentionally narrower than the durable product model.
The product-facing model should be clip-owned:

- `PerformanceClip.root_motion_mode` is the eventual source of truth for
  whether a clip evaluates as `follow_path` or `in_place`.
- Animation asset metadata should provide the default recommendation when a
  clip is created, not the final authority after authoring.
- The clip inspector should expose a small Root Motion control, such as
  `In place` / `Follow path`.
- Preview and export should initially share the same clip policy so users do
  not see one behavior while authoring and another in output.
- When `follow_path` is enabled, the viewport should distinguish authored
  placement from evaluated root motion through a path/marker visualization
  rather than making the gizmo appear wrong.

This PR only adds the emergency built-in Debug Run preview policy because the
clip-level model requires core schema, bridge DTO, TypeScript state, inspector
UI, and migration/defaulting decisions.

## Options Considered

| Option | Summary | Pros | Cons | Decision |
|---|---|---|---|---|
| Global suppress hips X/Z in `apply_motion_preview` | Always keep root at authored placement and only apply hips Y. | Small code diff; fixes screenshot. | Violates ADR-0039, breaks existing root split test, removes root-motion preview for all locomotion clips. | Rejected. |
| Add a clip-level `root_motion_mode` to `PerformanceClip` | Make each clip choose root-motion or placement-locked behavior. | Durable product shape; aligns with timeline spec's future root motion policy. | Requires core model, DTO, TS bridge types, command/editor wiring, serialization tests, and UX decisions beyond this urgent bug. | Rejected for this PR; follow-up candidate. |
| Replace Debug Run with a gentler asset | Keep runtime logic untouched. | Avoids new policy code. | Asset choice is product/debug-fixture scope, and it does not cover other built-in validation clips that may need explicit preview policy later. | Rejected for this PR; follow-up candidate. |
| Asset metadata plus built-in Debug Run fallback declares preview root-motion mode | Mark built-in Debug Run as placement-locked for editor preview, while unmarked clips keep ADR-0039. If the manifest entry is absent after `new_bundle`, the known `DEBUG_RUN_ANIMATION_ASSET_ID` still uses the same policy. | Small, reviewable, no bridge/schema change, preserves root-motion behavior by default, and covers the built-in debug lifecycle. It also mirrors the eventual product model by treating asset metadata as a default hint. | Free-form metadata needs constants, and the asset-id fallback must stay narrowly scoped to Debug Run. | Selected. |

## Requirements

1. Preserve ADR-0039 root/hips split for unmarked animation assets.
   Source: ADR-0039 and existing `apply_motion_preview_splits_hips_translation_into_root_xz_and_hips_y`.
2. Add an engine-owned metadata key/value for placement-locked motion preview.
   Source: STL-519 expected behavior and existing `AssetCatalogEntry.metadata`.
3. Mark the built-in Debug Run animation asset as placement-locked for preview.
   Source: STL-519 repro uses `DEBUG_RUN_ANIMATION_ASSET_ID` and the figure-eight run FBX.
4. `apply_motion_preview` must read the animation asset metadata from the active preview scene manifest and suppress only the root X/Z delta for placement-locked assets.
   Source: STL-519 current findings and ADR-0039 boundary.
5. `DEBUG_RUN_ANIMATION_ASSET_ID` must remain placement-locked even when the manifest entry is absent, because `new_bundle` can drop boot-time built-in asset entries while leaving built-in bytes available.
   Source: `seed_debug_character_assets_from_bytes` lifecycle comment and `in_memory_asset_bytes` resolution path.
6. Hips Y bob and bone rotations must continue to apply for placement-locked assets.
   Source: user-observed pose partly applies; expected fix is placement stability, not disabling animation.
7. Retargeter output must remain unchanged.
   Source: `retargeted_hips_carries_rest_translation_when_translations_are_present`.
8. Existing reset behavior when moving from a root-motion clip to an in-place clip must remain covered.
   Source: `apply_motion_preview_resets_root_motion_when_next_clip_has_no_hips_translation`.
9. Add a browser/manual verification step for Debug Character or Xiao + Debug Run at frame 34.
   Source: STL-519 repro and screenshot evidence.

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | no | No new parser, loader, validator, or error enum is introduced. | Keep malformed or absent metadata as default ADR behavior, not an error path. | N/A: no new `Result` surface. |
| Schema / serialization compatibility | yes | `AssetCatalogEntry.metadata` is existing free-form JSON; no typed field is added. | Use metadata key/value constants in engine code, leave JSON shape unchanged, and keep the asset-id fallback internal to engine runtime. | Existing asset catalog serde tests remain valid; new seed test asserts metadata presence without adding schema. |
| Ownership / API boundary | yes | `shotloom-retarget` owns retarget output; `shotloom-engine::motion` owns preview application. | Keep retargeter untouched and implement policy in motion preview. | `git diff -- crates/shotloom-retarget` should be empty unless tests are only read. |
| Partial mutation / rollback | no | The change mutates boot-time manifest metadata before normal insertion; no persisted multi-artifact write. | No rollback protocol needed. | N/A: no persistence or cache write sequence changes. |
| Diagnostic ownership | no | The metadata mode is optional and local to preview; absent/unknown values should default to ADR behavior. | Do not add bridge diagnostics for unknown metadata in this urgent fix. | N/A: no new diagnostic code. |
| Local absolute path exposure | no | Spec and implementation use repo-relative paths and constants. | Do not commit local screenshot paths or machine paths. | Run a local-path privacy grep over the briefing and spec; it should return no concrete machine-local paths. |
| Manifest path containment | no | No URI/path resolver changes are planned. | Do not alter asset path resolution. | N/A: existing resolver tests cover path behavior. |
| Command rejection matrix | no | No bridge command or rejection branch changes. | Keep command handlers untouched. | N/A. |
| Cross-platform CLI entrypoint | no | No CLI script changes. | None. | N/A. |
| Asset/data pack lifecycle | yes | `Debug Run` is an existing embedded LFS asset documented in `docs/tech-debt/wasm-debug-asset-embedding.md`. | Reuse existing asset; add metadata only. | Seed test proves existing built-in asset entry carries the metadata. |
| Validation context downgrade | no | No validator API changes. | None. | N/A. |
| Field-set drift | yes | Free-form metadata string and special-case asset id can drift between seed and reader. | Define engine constants for metadata key, allowed value, and Debug Run fallback policy; use constants in app seed, motion policy helper, and tests. | Compile/test references use the constants rather than repeated literals. |
| Bridge docs parity | no | No bridge wire contract changes. | No IPC docs update. | N/A. |
| Event-state visibility | no | Metadata only affects runtime preview transform; no accepted command state changes. | Do not emit new events. | Manual preview confirms visible state. |
| Input constraint parity | no | No new bridge/user input. | None. | N/A. |
| Test oracle strength | yes | Existing tests do not cover metadata-marked large hips X/Z locomotion. | Add a unit test that would fail before the metadata policy because root translation would include large X/Z. | `cargo test -p shotloom-engine motion::tests::apply_motion_preview_respects_placement_locked_preview_metadata`. |
| Scope creep | yes | Clip-level root-motion mode and asset replacement are plausible adjacent fixes. | Put both in Non-Goals / Follow-Up Candidates. | Plan-boundary proof via unchanged core DTO, editor, bridge, and asset bytes. |
| Reviewer objection | yes | Reviewer may object that free-form metadata or asset-id fallback is hidden behavior. | Use named constants, seed and motion policy tests, and document follow-up for typed clip-level root-motion mode. | Tests prove default ADR path, metadata path, and Debug Run fallback path separately. |

## Locked Decisions

1. **Default root-motion behavior remains ADR-0039.**
   Rationale: root-motion support was intentionally introduced so locomotion clips can trace their authored path.
   Rejected alternatives: make all preview clips in-place; remove hips X/Z from retarget output; or rewrite the existing root split test as if the previous ADR never existed.

2. **Placement locking is asset metadata plus a narrow Debug Run fallback, not a new clip field in this PR.**
   Rationale: `PerformanceClip` has no root-motion mode today, and adding one would expand the PR into core schema, DTO, bridge, editor, and UX work. The fallback covers the existing `new_bundle` lifecycle where built-in bytes remain available but boot-time asset entries are intentionally lost.
   Rejected alternatives: new `PerformanceClip.root_motion_mode`; new bridge command field; or TypeScript-only UI flag.

3. **Asset metadata is a default hint in the product model, but a runtime policy in this emergency PR.**
   Rationale: the durable design should let users change root-motion behavior per clip. Until that field and UI exist, Debug Run metadata is the smallest safe way to keep the built-in validation flow stable.
   Rejected alternatives: make asset metadata permanent final authority; create hidden per-clip state in the editor only; or delay the urgent fix until the full product model lands.

4. **The built-in Debug Run asset opts into placement-locked preview.**
   Rationale: the asset is the default validation path and carries known large hips X/Z deltas; this is the exact failure mode in STL-519.
   Rejected alternatives: clamp every large root delta; infer mode from FBX magnitude; or swap the built-in animation file.

5. **Placement-locked preview suppresses root X/Z only.**
   Rationale: the bug is off-placement root traversal; rotations and hips Y bob are still necessary to prove animation application.
   Rejected alternatives: disable the whole motion preview, apply only rotations, or apply full hips translation on the hips bone.

6. **Unknown or absent metadata falls back to ADR behavior for non-Debug-Run assets.**
   Rationale: existing user/imported animations should not silently change because a new optional metadata key exists; Debug Run is the only id-based exception because it is the built-in validation asset named by this issue.
   Rejected alternatives: treat unknown values as errors or diagnostics; default all built-in animations to placement-locked.

## Non-Goals

- No `PerformanceClip` schema, DTO, TypeScript bridge, or editor command changes.
- No clip inspector Root Motion control in this PR.
- No viewport root path/ghost marker visualization in this PR.
- No route/navigation/debug UI changes.
- No retargeter math, hips translation output, rest translation, or snapshot change.
- No replacement of `21566_M_AiFigureEightRun_250108.fbx`.
- No new diagnostic event, command rejection, or bridge payload.
- No ADR status change; ADR-0039 remains the default root-motion behavior.
- No camera-follow or gizmo-rendering behavior change.

## Validator Contract Matrix

| Field | Contract |
|---|---|
| Contract claim | Animation asset metadata key `preview_root_motion_mode` with value `placement_locked` means editor motion preview keeps the character root at authored placement while still applying bone rotations and hips Y. `DEBUG_RUN_ANIMATION_ASSET_ID` has the same policy when its catalog entry is absent. Missing or unknown values for other assets mean ADR-0039 root-motion behavior. |
| Negative fixture | An otherwise identical animation asset with no metadata, or with an unknown value, must still apply hips X/Z to the root through the existing ADR-0039 split. |
| Boundary rule | The metadata lives on the existing asset catalog record; it does not alter asset URI resolution, root containment, imported file paths, or byte loading. |
| Error order | Unknown metadata is not an error in this urgent fix. The reader falls back to ADR-0039 before any warning/diagnostic path. |
| Enforcement surface | Local Rust tests in `crates/shotloom-engine/src/motion.rs` and `crates/shotloom-engine/src/app.rs`; no bridge/CI schema generator change. |
| Regression proof | One test for unmarked ADR behavior, one test for placement-locked metadata behavior, one test for Debug Run fallback when the manifest entry is absent, and one seed test proving the built-in Debug Run manifest entry carries the metadata. |
| Asset lifecycle | Reuses the existing built-in Debug Run FBX, existing LFS hydration behavior, and existing size/source/license posture documented by the asset tree and `docs/tech-debt/wasm-debug-asset-embedding.md`; no new binary data is added. |
| Drift prevention | Define and use shared Rust constants for the metadata key, metadata value, and Debug Run fallback policy in the seed, reader, and tests. |

## Design Plan

### S0 - Baseline Re-check

Requirements covered: R1, R7, R8.
Risk rows: Ownership / API boundary, Scope creep.

Input:
- `crates/shotloom-engine/src/motion.rs`
- `crates/shotloom-engine/src/app.rs`
- `docs/adr/adr-0039-vrm-root-motion-from-hips-translation.md`

Output:
- Confirm the worktree is clean and the existing root split/reset tests still exist before edits.

Non-output:
- No source edits in this stage.

Failure:
- Stop and replan if `apply_motion_preview` no longer owns root translation or if Debug Run seeding moved out of `app.rs`.

Proof:
- `git status --short`
- `rg -n "apply_motion_preview_splits_hips_translation_into_root_xz_and_hips_y|DEBUG_RUN_ANIMATION_ASSET_ID|ADR-0039" crates/shotloom-engine/src docs/adr`

### S1 - Add Engine Metadata Constants

Requirements covered: R2, R4, R5.
Risk rows: Field-set drift, Schema / serialization compatibility.

Input:
- `crates/shotloom-engine/src/motion.rs` or an adjacent engine module already imported by `app.rs` and motion tests.

Output:
- A named metadata key constant, e.g. `preview_root_motion_mode`.
- A named value constant, e.g. `placement_locked`.
- A small helper that returns whether an animation asset is placement-locked for preview from metadata or the Debug Run fallback.

Non-output:
- No core model typed field.
- No bridge or TS mirror.

Failure:
- Unknown metadata value must be treated as absent metadata for this PR.

Proof:
- Compile proves seed and motion code use the same constants.

### S2 - Mark Built-in Debug Run

Requirements covered: R2, R3.
Risk rows: Asset/data pack lifecycle, Field-set drift.

Input:
- `crates/shotloom-engine/src/app.rs::seed_debug_character_assets_from_bytes`
- `DEBUG_RUN_ANIMATION_ASSET_ID`

Output:
- The `AssetCatalogEntry` for Debug Run has metadata declaring placement-locked preview mode.
- Existing seed behavior and LFS failure handling stay unchanged.

Non-output:
- No asset bytes, URI, display name, duration-extension, or `DebugRunAnimationMeta` behavior changes.

Failure:
- If FBX seeding is skipped, no metadata entry is inserted because the asset entry still should not exist.

Proof:
- Update the existing seed test around Debug Run manifest entries to assert the metadata key/value exists.

### S3 - Apply Placement-Locked Preview Policy

Requirements covered: R1, R4, R5, R6, R7, R8.
Risk rows: Test oracle strength, Reviewer objection.

Input:
- `MotionPreviewScene.manifest`
- `CharacterEvalState.motion_asset_id`
- existing `HipsTranslation`
- existing `character_placement`

Output:
- For unmarked non-Debug-Run animations, root translation remains `placement.translation + placement.rotation * hips_xz_delta`.
- For placement-locked animations, root translation remains `placement.translation`.
- For `DEBUG_RUN_ANIMATION_ASSET_ID`, root translation remains `placement.translation` even if the catalog entry is absent.
- Hips local translation still uses `Vec3::new(rest.x, frame.y, rest.z)` for both modes.

Non-output:
- No retarget cache invalidation behavior change.
- No `LastAppliedMotion` idempotence change.
- No camera or gizmo transform change.

Failure:
- If a non-Debug-Run animation asset is missing from the manifest, default to existing ADR behavior so authored scenes without catalog metadata remain compatible.

Proof:
- Add `apply_motion_preview_respects_placement_locked_preview_metadata` with a large hips X/Z delta and asset metadata; root stays at placement while hips Y updates.
- Add `apply_motion_preview_placement_locks_debug_run_without_manifest_metadata` with `DEBUG_RUN_ANIMATION_ASSET_ID` and no matching asset catalog entry.
- Keep `apply_motion_preview_splits_hips_translation_into_root_xz_and_hips_y` passing for an unmarked asset.

### S4 - Manual Runtime Verification

Requirements covered: R9.
Risk rows: Test oracle strength, Reviewer objection.

Input:
- Local Shotloom web editor.
- Built-in Debug Character / Debug Run flow or Xiao + Debug Run flow.

Output:
- Visual confirmation that around frame 34 the character remains plausibly near authored placement while animation pose still applies.

Non-output:
- No committed screenshot or local file path.

Failure:
- If the character still lifts/tilts off placement, inspect whether the issue is bone rotation/retarget quality rather than root X/Z and file a follow-up or update STL-519 before PR.

Proof:
- Manual note in PR testing: "Debug Character + Debug Run scrubbed around frame 34; placement remained stable."

## Acceptance Criteria

- [ ] Built-in Debug Run carries placement-locked preview metadata in its asset catalog entry.
- [ ] `apply_motion_preview` suppresses root X/Z only when the active animation asset declares placement-locked preview mode.
- [ ] `DEBUG_RUN_ANIMATION_ASSET_ID` is placement-locked even when its manifest entry is absent.
- [ ] Unmarked animations still use ADR-0039 root/hips split.
- [ ] Hips Y and bone rotations continue applying in both modes.
- [ ] Existing root-motion reset behavior remains covered.
- [ ] No retargeter, bridge DTO, TS command, or core schema changes are included.
- [ ] Manual Debug Run preview around frame 34 no longer visibly sends the character away from authored placement.

## Verification

Focused gates:

```bash
cargo test -p shotloom-engine motion::tests::apply_motion_preview_splits_hips_translation_into_root_xz_and_hips_y
cargo test -p shotloom-engine motion::tests::apply_motion_preview_respects_placement_locked_preview_metadata
cargo test -p shotloom-engine motion::tests::apply_motion_preview_placement_locks_debug_run_without_manifest_metadata
cargo test -p shotloom-engine seed_debug_character_assets_writes_overlay_manifest_and_meta
```

Broader local gate before commit:

```bash
cargo test -p shotloom-engine
```

Manual:

```text
Open the editor, spawn Debug Character or Xiao, select Debug Run, create a performance clip, scrub to around frame 34, and verify the actor stays visually plausible near authored placement while the run pose still applies.
```

Privacy check for docs:

- Run a local-path privacy grep over `docs/plans/proposed/motion-debug-run-root-hips-preview.md` and `docs/briefings/shotloom/motion-debug-run-root-hips-preview.md`; it should return no concrete machine-local paths.

## Traps

- Do not "fix" the symptom by deleting hips translations in `shotloom-retarget`; the retargeter is intentionally preserving locomotion data.
- Do not globally clamp root motion by magnitude; that creates hidden behavior for user-imported locomotion clips.
- Do not introduce `PerformanceClip.root_motion_mode` in this urgent PR. That is the better durable product model, but it is a larger schema and UI change.
- Do not make asset metadata the permanent product authority. It is a default hint once clip-level mode exists.
- Do not let preview/export diverge in future product work without an explicit user-facing reason.
- Do not log local screenshot paths or browser cache paths into durable docs or PR text.
- Keep `apply_motion_preview` scrub-deterministic. Do not introduce frame-to-frame accumulation.

## Follow-Up Candidates

- Add a typed clip-level root-motion mode to `PerformanceClip`, evaluator state, bridge DTOs, and editor UI. Initial modes: `in_place` and `follow_path`.
- Copy animation asset root-motion metadata into the clip as the default when creating a performance clip, then let the clip own later edits.
- Add a clip inspector Root Motion control with `In place` / `Follow path` labels.
- Add viewport root-motion visualization for `follow_path`: authored placement marker, evaluated root marker, and optional path preview.
- Keep preview/export policy unified at first; only split them later if product requirements demand it.
- Revisit whether `21566_M_AiFigureEightRun_250108.fbx` is the right default smoke-test animation or should be replaced by a gentler validation clip.
- Add a small debug overlay that visualizes authored placement versus root-motion preview path when root motion is enabled.
- Decide whether ADR-0039 should move from Proposed to Accepted after the clip-level mode lands.
