---
status: proposed
created: 2026-05-22
updated: 2026-05-22
load: triggered
trigger: working STL-519 - Debug Run preview root/hips placement stability
repo: shotloom
linear: STL-519
briefing: ../../briefings/shotloom/motion-debug-run-root-hips-preview.md
---

# Stabilize Debug Run Motion Preview Placement

## Spec Contract

- Briefing basis: `docs/briefings/shotloom/motion-debug-run-root-hips-preview.md`.
- Current truth: `apply_motion_preview` implements ADR-0039 by transferring hips X/Z onto the character root, and the built-in Debug Run asset is root-motion-heavy enough to visibly move the default validation character away from authored placement.
- Required change: let built-in validation animation assets opt into placement-locked editor preview without changing retargeter output or the default ADR-0039 behavior for ordinary root-motion clips.
- Locked boundary: no bridge payload, core model schema, timeline DTO, retargeter math, or asset replacement in this PR.
- Proof method: add a failing-before/passing-after `apply_motion_preview` regression for a metadata-marked large-locomotion animation, preserve the existing ADR-0039 split test for unmarked clips, and manually recheck the Debug Character + Debug Run editor flow around frame 34.

## Current State

| Surface | Classification | Evidence | Meaning |
|---|---|---|---|
| Runtime motion application | Partial | `crates/shotloom-engine/src/motion.rs::apply_motion_preview` builds `HipsTranslation`, applies hips Y locally, then applies hips X/Z delta to the character root. | The observed off-placement preview happens at the application layer, not because retarget output is absent. |
| Root-motion ADR | Already Done | `docs/adr/adr-0039-vrm-root-motion-from-hips-translation.md` chooses horizontal hips delta -> character root and vertical hips Y -> hips bone. | Do not globally remove X/Z transfer without explicitly changing the ADR contract. |
| Existing root split test | Already Done | `apply_motion_preview_splits_hips_translation_into_root_xz_and_hips_y`. | Unmarked clips must keep the ADR-0039 split behavior. |
| Existing reset test | Already Done | `apply_motion_preview_resets_root_motion_when_next_clip_has_no_hips_translation`. | The implementation must keep root placement reset when a later clip has no hips translations. |
| Built-in Debug Run seed | Partial | `crates/shotloom-engine/src/app.rs::seed_debug_character_assets_from_bytes` registers `DEBUG_RUN_ANIMATION_ASSET_ID` with empty asset metadata. | The seed has a safe place to declare editor-preview policy without schema or bridge changes. |
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
| Planning consequence | Use asset-level preview metadata for the built-in debug asset; do not introduce clip schema or bridge changes. |

## Problem

The Debug Run asset is useful as a retarget stress clip because it carries real hips translation, but it is too strong as the default editor validation preview when root motion is always applied to the character root. The current code has only one policy: if the retargeted hips bone has translations, transfer X/Z to the root. That policy is correct for ADR-0039 root-motion playback, but it makes the default debug smoke flow look broken because the editor placement/gizmo expectation remains anchored to the authored character placement.

The remaining gap is not "make all root motion in-place." The gap is an explicit preview policy for built-in validation animations whose purpose is to prove pose application rather than authored traversal.

## Options Considered

| Option | Summary | Pros | Cons | Decision |
|---|---|---|---|---|
| Global suppress hips X/Z in `apply_motion_preview` | Always keep root at authored placement and only apply hips Y. | Small code diff; fixes screenshot. | Violates ADR-0039, breaks existing root split test, removes root-motion preview for all locomotion clips. | Rejected. |
| Add a clip-level `root_motion_mode` to `PerformanceClip` | Make each clip choose root-motion or placement-locked behavior. | Durable product shape; aligns with timeline spec's future root motion policy. | Requires core model, DTO, TS bridge types, command/editor wiring, serialization tests, and UX decisions beyond this urgent bug. | Rejected for this PR; follow-up candidate. |
| Replace Debug Run with a gentler asset | Keep runtime logic untouched. | Avoids new policy code. | Asset choice is product/debug-fixture scope, and it does not cover other built-in validation clips that may need explicit preview policy later. | Rejected for this PR; follow-up candidate. |
| Asset metadata declares preview root-motion mode | Mark built-in Debug Run as placement-locked for editor preview, while unmarked clips keep ADR-0039. | Small, reviewable, no bridge/schema change, preserves root-motion behavior by default, and scopes the fix to validation assets. | Free-form metadata needs a named constant and tests to avoid string drift. | Selected. |

## Requirements

1. Preserve ADR-0039 root/hips split for unmarked animation assets.
   Source: ADR-0039 and existing `apply_motion_preview_splits_hips_translation_into_root_xz_and_hips_y`.
2. Add an engine-owned metadata key/value for placement-locked motion preview.
   Source: STL-519 expected behavior and existing `AssetCatalogEntry.metadata`.
3. Mark the built-in Debug Run animation asset as placement-locked for preview.
   Source: STL-519 repro uses `DEBUG_RUN_ANIMATION_ASSET_ID` and the figure-eight run FBX.
4. `apply_motion_preview` must read the animation asset metadata from the active preview scene manifest and suppress only the root X/Z delta for placement-locked assets.
   Source: STL-519 current findings and ADR-0039 boundary.
5. Hips Y bob and bone rotations must continue to apply for placement-locked assets.
   Source: user-observed pose partly applies; expected fix is placement stability, not disabling animation.
6. Retargeter output must remain unchanged.
   Source: `retargeted_hips_carries_rest_translation_when_translations_are_present`.
7. Existing reset behavior when moving from a root-motion clip to an in-place clip must remain covered.
   Source: `apply_motion_preview_resets_root_motion_when_next_clip_has_no_hips_translation`.
8. Add a browser/manual verification step for Debug Character or Xiao + Debug Run at frame 34.
   Source: STL-519 repro and screenshot evidence.

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | no | No new parser, loader, validator, or error enum is introduced. | Keep malformed or absent metadata as default ADR behavior, not an error path. | N/A: no new `Result` surface. |
| Schema / serialization compatibility | yes | `AssetCatalogEntry.metadata` is existing free-form JSON; no typed field is added. | Use metadata key/value constants in engine code and leave JSON shape unchanged. | Existing asset catalog serde tests remain valid; new seed test asserts metadata presence without adding schema. |
| Ownership / API boundary | yes | `shotloom-retarget` owns retarget output; `shotloom-engine::motion` owns preview application. | Keep retargeter untouched and implement policy in motion preview. | `git diff -- crates/shotloom-retarget` should be empty unless tests are only read. |
| Partial mutation / rollback | no | The change mutates boot-time manifest metadata before normal insertion; no persisted multi-artifact write. | No rollback protocol needed. | N/A: no persistence or cache write sequence changes. |
| Diagnostic ownership | no | The metadata mode is optional and local to preview; absent/unknown values should default to ADR behavior. | Do not add bridge diagnostics for unknown metadata in this urgent fix. | N/A: no new diagnostic code. |
| Local absolute path exposure | no | Spec and implementation use repo-relative paths and constants. | Do not commit local screenshot paths or machine paths. | Run a local-path privacy grep over the briefing and spec; it should return no concrete machine-local paths. |
| Manifest path containment | no | No URI/path resolver changes are planned. | Do not alter asset path resolution. | N/A: existing resolver tests cover path behavior. |
| Command rejection matrix | no | No bridge command or rejection branch changes. | Keep command handlers untouched. | N/A. |
| Cross-platform CLI entrypoint | no | No CLI script changes. | None. | N/A. |
| Asset/data pack lifecycle | yes | `Debug Run` is an existing embedded LFS asset documented in `docs/tech-debt/wasm-debug-asset-embedding.md`. | Reuse existing asset; add metadata only. | Seed test proves existing built-in asset entry carries the metadata. |
| Validation context downgrade | no | No validator API changes. | None. | N/A. |
| Field-set drift | yes | Free-form metadata string can drift between seed and reader. | Define engine constants for metadata key and allowed value, and use those constants in app seed, motion policy helper, and tests. | Compile/test references use the constants rather than repeated literals. |
| Bridge docs parity | no | No bridge wire contract changes. | No IPC docs update. | N/A. |
| Event-state visibility | no | Metadata only affects runtime preview transform; no accepted command state changes. | Do not emit new events. | Manual preview confirms visible state. |
| Input constraint parity | no | No new bridge/user input. | None. | N/A. |
| Test oracle strength | yes | Existing tests do not cover metadata-marked large hips X/Z locomotion. | Add a unit test that would fail before the metadata policy because root translation would include large X/Z. | `cargo test -p shotloom-engine motion::tests::apply_motion_preview_respects_placement_locked_preview_metadata`. |
| Scope creep | yes | Clip-level root-motion mode and asset replacement are plausible adjacent fixes. | Put both in Non-Goals / Follow-Up Candidates. | Plan-boundary proof via unchanged core DTO, editor, bridge, and asset bytes. |
| Reviewer objection | yes | Reviewer may object that free-form metadata is hidden behavior. | Use named constants, a seed test, a motion policy test, and document follow-up for typed clip-level root-motion mode. | Tests prove default ADR path and metadata path separately. |

## Locked Decisions

1. **Default root-motion behavior remains ADR-0039.**
   Rationale: root-motion support was intentionally introduced so locomotion clips can trace their authored path.
   Rejected alternatives: make all preview clips in-place; remove hips X/Z from retarget output; or rewrite the existing root split test as if the previous ADR never existed.

2. **Placement locking is asset metadata, not a new clip field in this PR.**
   Rationale: `PerformanceClip` has no root-motion mode today, and adding one would expand the PR into core schema, DTO, bridge, editor, and UX work.
   Rejected alternatives: new `PerformanceClip.root_motion_mode`; new bridge command field; or TypeScript-only UI flag.

3. **The built-in Debug Run asset opts into placement-locked preview.**
   Rationale: the asset is the default validation path and carries known large hips X/Z deltas; this is the exact failure mode in STL-519.
   Rejected alternatives: clamp every large root delta; infer mode from FBX magnitude; or swap the built-in animation file.

4. **Placement-locked preview suppresses root X/Z only.**
   Rationale: the bug is off-placement root traversal; rotations and hips Y bob are still necessary to prove animation application.
   Rejected alternatives: disable the whole motion preview, apply only rotations, or apply full hips translation on the hips bone.

5. **Unknown or absent metadata falls back to ADR behavior.**
   Rationale: existing user/imported animations should not silently change because a new optional metadata key exists.
   Rejected alternatives: treat unknown values as errors or diagnostics; default all built-in animations to placement-locked.

## Non-Goals

- No `PerformanceClip` schema, DTO, TypeScript bridge, or editor command changes.
- No route/navigation/debug UI changes.
- No retargeter math, hips translation output, rest translation, or snapshot change.
- No replacement of `21566_M_AiFigureEightRun_250108.fbx`.
- No new diagnostic event, command rejection, or bridge payload.
- No ADR status change; ADR-0039 remains the default root-motion behavior.
- No camera-follow or gizmo-rendering behavior change.

## Design Plan

### S0 - Baseline Re-check

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

Input:
- `crates/shotloom-engine/src/motion.rs` or an adjacent engine module already imported by `app.rs` and motion tests.

Output:
- A named metadata key constant, e.g. `preview_root_motion_mode`.
- A named value constant, e.g. `placement_locked`.
- A small helper that returns whether an animation asset is placement-locked for preview.

Non-output:
- No core model typed field.
- No bridge or TS mirror.

Failure:
- Unknown metadata value must be treated as absent metadata for this PR.

Proof:
- Compile proves seed and motion code use the same constants.

### S2 - Mark Built-in Debug Run

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

Input:
- `MotionPreviewScene.manifest`
- `CharacterEvalState.motion_asset_id`
- existing `HipsTranslation`
- existing `character_placement`

Output:
- For unmarked animations, root translation remains `placement.translation + placement.rotation * hips_xz_delta`.
- For placement-locked animations, root translation remains `placement.translation`.
- Hips local translation still uses `Vec3::new(rest.x, frame.y, rest.z)` for both modes.

Non-output:
- No retarget cache invalidation behavior change.
- No `LastAppliedMotion` idempotence change.
- No camera or gizmo transform change.

Failure:
- If the animation asset is missing from the manifest, default to existing ADR behavior so authored scenes without catalog metadata remain compatible.

Proof:
- Add `apply_motion_preview_respects_placement_locked_preview_metadata` with a large hips X/Z delta and asset metadata; root stays at placement while hips Y updates.
- Keep `apply_motion_preview_splits_hips_translation_into_root_xz_and_hips_y` passing for an unmarked asset.

### S4 - Manual Runtime Verification

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
- Do not log local screenshot paths or browser cache paths into durable docs or PR text.
- Keep `apply_motion_preview` scrub-deterministic. Do not introduce frame-to-frame accumulation.

## Follow-Up Candidates

- Add a typed clip-level root-motion mode to `PerformanceClip`, evaluator state, bridge DTOs, and editor UI.
- Revisit whether `21566_M_AiFigureEightRun_250108.fbx` is the right default smoke-test animation or should be replaced by a gentler validation clip.
- Add a small debug overlay that visualizes authored placement versus root-motion preview path when root motion is enabled.
- Decide whether ADR-0039 should move from Proposed to Accepted after the clip-level mode lands.
