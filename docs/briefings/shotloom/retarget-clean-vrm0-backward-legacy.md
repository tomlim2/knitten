---
status: ready
created: 2026-05-19
updated: 2026-05-19
load: triggered
trigger: STL-476
repo: shotloom
linear: STL-476
spec: ../../plans/proposed/retarget-clean-vrm0-backward-legacy.md
---

# Ready Briefing: Retarget VRM0/Backward Legacy Cleanup

## Issue

- Linear: `STL-476` — `refactor(retarget): VRM0/backward legacy 전제 정리`
- Project: `Shotloom - bravo`
- State: `In Progress`
- Category: Rust retarget cleanup
- Branch: `chore/retarget-clean-vrm0-backward-legacy`
- Worktree: sibling Shotloom worktree
  `shotloom-worktrees/retarget-clean-vrm0-backward-legacy`

## Problem

VRM0/backward-facing normalization is now owned by import/model normalization,
but `shotloom-retarget` still has a few legacy-looking VRM0/version/root-rotation
surfaces that can imply retarget is responsible for that normalization. The
task is cleanup only: remove or narrow stale retarget-side assumptions while
preserving active calibration and thumb/finger behavior.

## Acceptance Summary

- Make the normalized, VRM1-shaped public-driver assumption explicit.
- Remove or justify retained VRM0 version/probe/config override surfaces in
  retarget.
- Remove or narrow the residual `has_180y_root` diagnostic path if it is log-only.
- Do not change `ScalarCurl`, `finger_axis_map`, `DEFAULT_POSE`, facial,
  `shotloom-gltf`, import, engine, or editor behavior.
- Add focused regression coverage or update existing coverage around the exact
  cleanup boundary.

## Loaded Standards

- `AGENTS.md`
- `CONTRIBUTING.md`
- `CLAUDE.md`
- `docs/guidelines/error-handling.md`
- `docs/guidelines/review-rust.md`
- `docs/guidelines/commit-guideline.md`
- `docs/guidelines/pr-guideline.md`
- `docs/adr/adr-0025-retargeter-public-driver.md`
- `docs/adr/adr-0030-normalizer-crate-extraction.md`
- `docs/arch/normalizer-pipeline.md`

`gh auth status` reports the active account as `tomlim2`; an inactive
`deemotl` credential warning is present but does not block local planning.

## Current Code Evidence

- Public entrypoint `retarget_arp_to_vrm` always calls
  `mapping::normalize(source, &config, vrm_compat::VrmVersion::V1_0)` in
  `crates/shotloom-retarget/src/lib.rs`.
- Default ARP config keeps `vrm_version_overrides` empty, but the config schema
  and resolver still support version-specific overrides in
  `crates/shotloom-retarget/src/config.rs`.
- `crates/shotloom-retarget/src/vrm_compat.rs` still defines `V0x`, `V1_0`,
  `config_key()`, and `detect_from_gltf_json()` even though production retarget
  appears to use only `V1_0`.
- `crates/shotloom-retarget/src/retargeter.rs` computes `has_180y_root` from
  rest-pose root rotation and only includes it in a coordinate log line.
- `crates/shotloom-character-model-normalizer/src/align/finger_axis_map.rs`
  documents that `_backward` fixtures have their X-flip stripped by
  `shotloom_gltf::normalize_vrm_bones_180y`; production retarget sees a
  canonical rest pose.
- `crates/shotloom-retarget/tests/finger_axis_yoya_xiao.rs` pins the normalized
  yoya backward/VRM0x wrist rest-pose behavior.
- `crates/shotloom-retarget/tests/thumb_retarget_regression.rs` pins thumb
  behavior and should stay in scope only as a safety check, not as a new
  algorithm surface.

## Spec-Risk Handoff

- Decide the deletion boundary for `vrm_compat.rs`: remove `V0x`/detection if
  they are dead, or retain a minimal `V1_0` shape if needed by the mapper API.
- Treat `vrm_version_overrides` carefully. STL-438 explicitly retained the
  generic custom-config schema after removing default rig thumb overrides, so
  deleting this field would broaden scope beyond a narrow cleanup.
- If removing the `has_180y_root` log field, verify no tests/docs depend on the
  exact `[COORD]` diagnostic string.
- Preserve active calibration: `DEFAULT_POSE`, non-thumb `ScalarCurl`, thumb
  regression tests, and `finger_axis_map` are not obsolete merely because
  VRM0/backward normalization moved earlier in the pipeline.
- Add a small proof that production retarget no longer routes through a VRM0
  branch, rather than changing GLTF/import normalization behavior.

## Sibling Plan Inventory

- `docs/plans/completed/retarget-cleanup-rig-branches.md` agrees with this
  scope: default rig thumb overrides were removed, while generic config schema,
  `DEFAULT_POSE`, thumb exclusions, and runtime fallbacks were retained.
- `docs/plans/completed/gltf-wire-axis-bake-normalize-vrm.md` agrees:
  axis-bake was wired in `shotloom-gltf`/import and retarget cleanup was left as
  follow-up.
- `docs/plans/completed/gltf-apply-vrm-axis-bake-rest-pose.md` agrees:
  rest-pose mutation was proven privately in GLTF axis-bake helpers, not in
  retarget math.
- `docs/plans/completed/retarget-recalibrate-default-pose.md` agrees:
  `DEFAULT_POSE` is active calibration, not removable axis-bake debt.
- `docs/plans/proposed/retarget-vrm0x-backward-thumb-support.md` is adjacent
  but non-overlapping: it is a proof-first thumb support plan, not this cleanup.
- `docs/briefings/shotloom/retarget-vrm0x-backward-thumb-support.md` confirms
  the same thumb-specific non-goals.

## Ask-First Triggers

- VRM normalization, import cache, or GLTF byte mutation changes.
- Public config/API/schema changes that remove a deserializable field.
- Bridge/editor/engine behavior changes.
- `DEFAULT_POSE`, `ScalarCurl`, thumb algorithm, or facial-retarget changes.
- New dependencies, file moves, or CI/hook behavior changes.

## Suggested Next Step

Run the Shotloom draft-spec workflow for `STL-476` and write the proposed spec
before implementation. The implementation should start from the existing
worktree and branch above.
