---
status: ready
created: 2026-05-18
updated: 2026-05-18
load: triggered
trigger: STL-263
repo: shotloom
linear: STL-263
spec: ../../plans/proposed/retarget-vrm0x-backward-thumb-support.md
worktree: shotloom-github/.worktrees/retarget-vrm0x-backward-thumb-support
branch: feat/retarget-vrm0x-backward-thumb-support
---

# STL-263 Briefing - VRM0.x + Backward Rig Thumb Support

## Task

- Linear: STL-263, `feat(retarget): vrm0x + backward rig thumb support`
- Parent: STL-291
- State: In Progress
- Worktree: `shotloom-github/.worktrees/retarget-vrm0x-backward-thumb-support`
- Branch: `feat/retarget-vrm0x-backward-thumb-support`
- Base: `origin/main` at `9a319cd2 feat(bridge): clear stage background props (#349)`

## Intent

After STL-291 canonicalization work, verify whether VRM0.x/backward-rig thumb behavior is now natural. If the residual thumb issue is gone, STL-263 can close as no-op with evidence. If it remains, implement a thumb-specific correction path without disturbing the STL-291 axis-bake/default-pose decisions.

## Acceptance Criteria

- STL-291 Phase 1 and Phase 2 are merged before this work proceeds.
- `finger_compare` or an agreed equivalent proves yoya/minjoon/vrm0x thumb behavior is natural like xiao/c-normal.
- If still needed, a thumb-specific algorithm lands.
- Thumb retarget snapshot coverage is stable.

## Preconditions Checked

- STL-291 child ledger shows Phase 1 through Phase 2.5 complete:
  - STL-369 Done
  - STL-398 Done
  - STL-402 Done
  - STL-408 Done
  - STL-409 Done
  - STL-417 Done
  - STL-419 Done
  - STL-433 Done
  - STL-438 Done
- Current worktree is clean.
- GitHub auth has active `tomlim2`; an inactive old `deemotl` token warning appeared.
- Git author is currently `Younsoo Tom Lim <tomandlim@gmail.com>`; expected project identity is `tomlim2 <deemo@vonvon.me>`. Warn before commit if this branch commits code.

## Standards Loaded

- `AGENTS.md`
- `CONTRIBUTING.md`
- `CLAUDE.md`
- `docs/guidelines/error-handling.md`
- `docs/guidelines/review-rust.md`
- `docs/guidelines/commit-guideline.md`
- `docs/guidelines/pr-guideline.md`
- `docs/adr/README.md`
- `docs/adr/0023-retargeter-validation-contract.md`
- `docs/adr/0030-normalizer-crate-extraction.md`
- `docs/adr/0034-source-animation-type-ownership.md`

## Ask-First Boundaries

- Do not change VRM normalization, validation, import, or cache behavior without explicit approval.
- Do not alter bridge contracts, core domain model, validation contracts, new dependencies, Bevy ordering, or CI/hook behavior without approval.
- Do not treat STL-263 as permission to rewrite STL-291 axis-bake or canonicalization behavior.
- Numeric DEFAULT_POSE changes need evidence and matching tests; previous sibling specs deliberately retained those deltas.

## Current Code Facts

- `crates/shotloom-retarget/src/lib.rs`
  - Default config maps ARP thumb bones to VRM thumb slots.
  - `rest_sync_rules` set `*Thumb* -> Skip`.
  - Non-thumb fingers use `ScalarCurl`.
- `crates/shotloom-character-model-normalizer/src/align/arp_vrm_user_pose.rs`
  - DEFAULT_POSE still applies arm and thumb user-calibrated deltas.
- `crates/shotloom-character-model-normalizer/src/align/finger_axis_map.rs`
  - Thumb bones are intentionally excluded from the v5 non-thumb finger axis map.
  - Tests assert thumb exclusion.
- `crates/shotloom-character-model-normalizer/src/align/arp_vrm.rs`
  - `UserCalibrated` takes priority over config and fallback.
  - Fallback skips thumbs because a previous DirectCopy attempt flipped the thumb toward the elbow.
  - Stage 4 applies `DirectCopy`, `UserCalibrated`, then filtered `ScalarCurl`.
- `crates/shotloom-retarget/src/retargeter.rs`
  - Runtime scalar curl helper excludes thumb.
- `crates/shotloom-retarget/examples/finger_compare.rs`
  - Current visualizer includes xiao, yoya, and vrm0x A.
  - It does not include minjoon/c-normal.
  - Its live animation helper excludes VRM thumb bones via `is_non_thumb_finger_bone`.
  - Therefore current `finger_compare` cannot literally prove animated VRM thumb naturalness without expansion or a stronger equivalent proof.

## Sibling Spec Context

- `retarget-cleanup-rig-branches.md` / STL-438
  - Completed.
  - Retained DEFAULT_POSE and thumb skip policy.
  - Explicitly deferred Thumb CMC / two-axis thumb algorithm.
- `retarget-recalibrate-default-pose.md` / STL-433
  - Completed.
  - Treats STL-263 as follow-up only if residual thumb behavior remains.
  - Six-fixture headless matrix was accepted for Phase 2f, but STL-263 still needs thumb-specific proof.
- `gltf-wire-axis-bake-normalize-vrm.md` / STL-419
  - Completed.
  - Axis-bake/normalization is already wired; STL-263 does not reopen it by default.
- `gltf-repair-vrm1-thumb-slots.md` / STL-291 Phase 1
  - Historical plan expected repair/cache behavior, but final Linear/code behavior is warning-only diagnostic for noncanonical thumb humanoid slots.
  - Trust live code and final Linear comments over stale plan details.

## Spec Risks To Resolve Next

### P1 - Verification Shape

The acceptance criterion names `finger_compare`, but current `finger_compare` does not animate VRM thumb bones and lacks minjoon/c-normal actors. The spec must decide whether STL-263 first expands `finger_compare` or replaces that visual proof with a repeatable headless thumb metric.

Question for spec: What concrete evidence decides no-op close vs algorithm implementation?

### P1 - Algorithm Entry Point

If the residual issue remains, the implementation surface is not locked. Plausible surfaces are:

- character-model-normalizer rest alignment
- retarget postprocess
- retarget config/rest-sync strategy

Question for spec: Where does thumb-specific correction live, and what invariant prevents double-applying DEFAULT_POSE?

### P2 - Fixture Matrix

Existing tests cover six families in `default_pose_recalibration.rs`, while `finger_compare` currently covers only xiao/yoya/vrm0x A.

Question for spec: Which fixtures are required for STL-263: yoya/minjoon/vrm0x only, or also xiao/c-normal/zepeto controls?

### P2 - Non-Goals

The data-layer axis-bake/slot-canonicalization work is already done. STL-263 forbids `shotloom-gltf`, `shotloom-import`, cache-version, bridge, and editor changes unless new evidence proves the data layer is wrong.

### P2 - Stable Regression Signal

Existing snapshots and default-pose tests include thumb bones but do not prove visual/natural thumb behavior.

Question for spec: Which focused test fails on a thumb regression without relying only on visual inspection?

## Recommended Next Step

Run `shotloom-draft-spec` for STL-263 using this briefing as the source. The draft spec resolves the P1 verification and algorithm-entry questions before implementation starts.
