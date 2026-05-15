---
status: open
created: 2026-05-15
updated: 2026-05-15
load: triggered
trigger: working STL-433 — DEFAULT_POSE recalibration after VRM axis-bake
repo: shotloom
linear: STL-433
---

<!-- markdownlint-disable MD013 -->

# Recalibrate DEFAULT_POSE After VRM Axis-Bake

## Cold-Start Summary

Shotloom's VRM import path now applies the Phase 2e humanoid axis-bake tail
inside `shotloom-gltf::normalize_vrm`, and the native normalized artifact cache
is keyed at `v4` for that byte-level contract. The remaining Phase 2f gap is
above that GLB layer: verify whether the retarget-side
`arp_vrm_user_pose::DEFAULT_POSE` arm and thumb deltas are still intentional
user-pose calibration after axis-bake, or whether any are removable legacy
offsets. This plan keeps the PR focused on evidence, regression coverage, and
calibration documentation; it does not change the axis-bake algorithm,
`normalize_vrm`, rig-branch refactors, or thumb CMC behavior.

## Current State

| Surface | Class | Evidence |
|---|---|---|
| Axis-bake production path | Already Done | `crates/shotloom-gltf/src/vrm_normalization.rs` routes both VRM1 and VRM0 through `finalize_normalized_vrm`; that tail calls `apply_axis_bake_tail_stage` and emits `normalized_vrm_axis_bake` only when the artifact changes. |
| Normalized artifact cache | Already Done | `crates/shotloom-import/src/lib.rs` sets `NORMALIZED_VRM_CACHE_VERSION = "v4"` with a comment naming the axis-bake tail stage. |
| DEFAULT_POSE data | Partial | `crates/shotloom-character-model-normalizer/src/align/arp_vrm_user_pose.rs` defines 10 user-authored arm/thumb deltas: upper arms, lower arms, and thumb metacarpal/proximal/distal on both sides. |
| DEFAULT_POSE dispatch | Partial | `crates/shotloom-character-model-normalizer/src/align/arp_vrm.rs` prioritizes `UserCalibrated` from `arp_vrm_user_pose::lookup` before config rules and fallback strategies, then applies `old_local * user_delta`. No public invariant test currently pins all 10 entries. |
| Existing retarget golden | Already Done | `crates/shotloom-retarget/tests/body_retarget_regression.rs` pins preset 1 retarget output with angular tolerance and refuses catastrophic snapshot regeneration. |
| Existing convention endpoint test | Partial | `crates/shotloom-retarget/tests/finger_axis_yoya_xiao.rs` verifies yoya and VRM0x wrist rest pose match xiao within 30 degrees, but it explicitly does not pin finger-axis output or all Phase 2f rig families. |
| Fixture registry | Already Done | `crates/shotloom-retarget/examples/fixtures.json` includes xiao, c-normal, zepeto, yoya, minjoon backward, and VRM0x A/B; `tests/fixture_presets.rs` checks presence, asset existence, and FBX parse/mode validation. |
| Visual comparison tool | Already Done | `crates/shotloom-retarget/examples/finger_compare.rs` visualizes xiao, yoya, and VRM0x A, but does not cover c-normal, zepeto, or minjoon. |
| Current worktree patch | Partial | `git status` shows staged edits to `crates/shotloom-character-model-normalizer/README.md` and `tests/rest_align_invariant.rs` from an interrupted pre-plan attempt. Implementation must re-read and either reuse or adjust them; do not assume they are complete. |
| Sibling Phase 2e plan | Consumed | `caol-ila/docs/plans/gltf-wire-axis-bake-normalize-vrm.md` names Phase 2f as the follow-up for `DEFAULT_POSE` recalibration after production axis-bake wiring. |

## Problem

Phase 2e made axis-baked normalized VRM artifacts observable through import, but
retarget still carries hand-authored DEFAULT_POSE deltas that were calibrated
before that import contract existed. Removing or shrinking those deltas without
proof can regress arm and thumb rest alignment; leaving them undocumented after
axis-bake makes Phase 2.5 and STL-263 planning ambiguous. The next PR must prove
the smallest useful answer: either current deltas remain intentional and are
regression-pinned, or specific deltas change with test and PR evidence.

## Locked Decisions

1. **Treat Phase 2f as a calibration-verdict PR, not a numeric rewrite by default.**  
   Rationale: The live code already documents the deltas as user-authored visual
   calibration, and no shotloom-native calibration host exists. If headless
   regression evidence stays green, the correct outcome can be "no numeric
   delta change" plus a durable invariant and PR matrix summary.  
   Rejected alternatives: deleting DEFAULT_POSE entries just because axis-bake
   now exists; editing quaternion literals without a visual calibration source;
   folding Phase 2.5 rig-branch removal into this PR.

2. **Use headless retarget matrix coverage as the required equivalent to full `finger_compare`.**  
   Rationale: `finger_compare.rs` currently covers only xiao, yoya, and VRM0x
   A. STL-433 allows "finger_compare or equivalent retarget verification"; a
   headless test over the six named rig families is repeatable in CI and covers
   c-normal, zepeto, and minjoon as well.  
   Rejected alternatives: relying only on manual visual notes; expanding
   `finger_compare` UI in this PR; requiring screenshot artifacts from an
   example that is not shaped for all six fixtures.

3. **Pin the public rest-alignment entry point, not private helper internals.**  
   Rationale: Callers consume `align_full_body_rest`, which runs Stage 3 and
   Stage 4 together. A public invariant test should prove all 10 DEFAULT_POSE
   bones enter the `UserCalibrated` bucket and retain their intended magnitude
   even when Stage 3 finds no non-thumb finger axis map.  
   Rejected alternatives: testing `arp_vrm_user_pose::lookup` alone, which does
   not prove dispatch; making private helpers public for test access; snapshotting
   warning text beyond the small Stage 4 count needed as a behavioral pin.

4. **Add a retarget fixture-matrix smoke test only if it adds evidence not already covered.**  
   Rationale: Existing `fixture_presets.rs` validates fixture presence and FBX
   parse, while `body_retarget_regression.rs` pins one full output. Phase 2f
   needs rig-family evidence, so a focused test should retarget xiao, c-normal,
   zepeto, yoya, minjoon, and one VRM0x sample and assert no error diagnostics
   plus expected DEFAULT_POSE target bones in output.  
   Rejected alternatives: broadening the golden snapshot to every fixture;
   regenerating snapshots when no numeric output changed; adding slow visual
   assertions that CI cannot evaluate.

5. **Keep durable repo docs free of concrete Linear issue IDs.**  
   Rationale: Repository docs are durable knowledge and the doc guard rejects
   concrete Shotloom issue IDs in durable docs. The module README may document
   the axis-bake recalibration status and future calibration workflow, but issue
   linkage belongs in commit footers, PR body, and Linear.  
   Rejected alternatives: writing "STL-433" or sibling issue IDs into
   `crates/shotloom-character-model-normalizer/README.md`; putting task state
   into Shotloom docs.

6. **No coupled persisted artifact mutation is in scope.**  
   Rationale: This PR may mutate Rust tests, README text, and possibly
   calibration constants. It must not write normalized GLB JSON/BIN, cache
   artifacts, bundle state, or bridge events. Therefore no JSON+BIN or
   cache+manifest atomicity protocol is needed.  
   Rejected alternatives: touching `normalize_vrm`, cache write paths, or asset
   persistence to "prove" Phase 2f; those belong to completed Phase 2e or future
   asset-pipeline work.

## Non-Goals

- Phase 1/2 axis-bake algorithm changes in `shotloom-gltf`.
- `shotloom-gltf::normalize_vrm` or `NORMALIZED_VRM_CACHE_VERSION` changes.
- `finger_axis_map.rs` rig-branch removal or default retarget config cleanup.
- Thumb CMC alignment algorithm work.
- Public API, bridge protocol, or editor UI changes.
- New dependencies, ADRs, or roadmap entries.
- Golden snapshot regeneration unless a deliberate numeric delta change makes
  it necessary.
- Visualizer UI expansion for all fixture families.

## Implementation Plan

### S0 — Baseline Re-Check

Run before changing files:

```bash
git status --short
git diff --cached -- crates/shotloom-character-model-normalizer/README.md crates/shotloom-character-model-normalizer/tests/rest_align_invariant.rs
rg -n "DEFAULT_POSE|UserCalibrated|apply_user_calibrated_one|align_full_body_rest" crates/shotloom-character-model-normalizer/src crates/shotloom-character-model-normalizer/tests
rg -n "\"1\"|\"2\"|\"6\"|\"8\"|\"9\"|\"13\"|retarget_arp_to_vrm|build_from_bytes" crates/shotloom-retarget/tests crates/shotloom-retarget/examples
```

Expected:

- Only the two known staged files are dirty.
- The staged invariant/README edits are either aligned with this plan or are
  patched before commit.
- DEFAULT_POSE still contains 10 arm/thumb entries.
- Fixture IDs for the six target families remain present.

### S1 — Lock the DEFAULT_POSE Dispatch Invariant

Modify:

```text
crates/shotloom-character-model-normalizer/tests/rest_align_invariant.rs
```

Changes:

- Add or keep a public `align_full_body_rest` integration test that constructs
  identity rest data for all 10 DEFAULT_POSE bones.
- Assert Stage 4 reports 10 `UserCalibrated` bones synced.
- Assert each override delta magnitude matches the documented intent:
  upper arms 80 degrees, lower arms 15/10 degrees, thumb metacarpals 10
  degrees, thumb proximal/distal 25 degrees.
- Assert the no-non-thumb-finger case still runs Stage 4, because arm/thumb
  calibration must not depend on a ScalarCurl axis map.

### S2 — Add Rig-Family Retarget Evidence

Modify or add one focused retarget test:

```text
crates/shotloom-retarget/tests/default_pose_recalibration.rs
```

Target fixtures from `examples/fixtures.json`:

| Fixture | Family |
|---|---|
| `1` | xiao / VRoid 1.x female |
| `2` | c-normal / VRoid 1.x male |
| `6` | zepeto 1.x |
| `8` | yoya backward |
| `9` | minjoon backward |
| `13` | VRM0x sample A |

Behavior:

- Load fixture metadata from the existing fixture registry or duplicate only the
  minimal path constants if reusing the registry would add test ceremony.
- Parse each fixture's FBX, build VRM rest with `build_from_bytes`, then run
  `retarget_arp_to_vrm`.
- Fail on any `DiagnosticSeverity::Error` from rest extraction or retarget.
- Assert each target `VrmRestPose` exposes all 10 DEFAULT_POSE bone names in
  `bone_rest_local` before retargeting.
- Assert each `TargetAnimation.bones` output contains all 10 DEFAULT_POSE bone
  names; if a fixture fails this, the failure is Phase 2f evidence, not a
  reason to weaken the test silently.
- Print or collect per-fixture summary data suitable for PR description:
  family label, model path, animation path, error count, DEFAULT_POSE bone
  coverage.

### S3 — Document the Recalibration Verdict

Modify only if the verdict is no numeric change or the maintenance rule needs
durable context:

```text
crates/shotloom-character-model-normalizer/README.md
```

Changes:

- Add a short axis-bake recalibration status note.
- State that existing arm/thumb deltas remain active calibration unless the PR
  actually changes numbers.
- State future numeric edits require viewer or shotloom-native calibration
  evidence and matching invariant updates.
- Do not include concrete Linear IDs.

### S4 — Numeric Delta Change Path, Only If Evidence Demands It

Modify only if S1/S2 or manual calibration shows a specific delta is wrong:

```text
crates/shotloom-character-model-normalizer/src/align/arp_vrm_user_pose.rs
crates/shotloom-character-model-normalizer/tests/rest_align_invariant.rs
crates/shotloom-retarget/tests/snapshots/body_retarget_preset1.snap
```

Changes:

- Update only the affected quaternion literals.
- Update adjacent degree annotations.
- Update invariant expectations in the same commit.
- Regenerate body retarget snapshot only if the output actually changes and
  the floor guard stays above the catastrophic-bone-count threshold.
- Record before/after rationale in the PR description by rig family.

### S5 — Scope Guard and Verification

After edits:

```bash
git diff -- crates/shotloom-gltf crates/shotloom-import
rg -n "NORMALIZED_VRM_CACHE_VERSION|apply_axis_bake_tail_stage|normalized_vrm_axis_bake" crates/shotloom-import/src/lib.rs crates/shotloom-gltf/src/vrm_normalization.rs
cargo fmt --check
cargo test -p shotloom-character-model-normalizer
cargo test -p shotloom-retarget
pnpm validate:docs
```

Expected:

- No changes in `shotloom-gltf` or `shotloom-import`.
- Cache version and axis-bake diagnostic code remain unchanged.
- Rust tests pass.
- `pnpm validate:docs` passes if local `lychee` is installed; if `lychee` is
  absent, record that markdownlint/doc-path/Linear-ref/Mermaid passed and link
  checking was blocked by the missing binary.

## Acceptance Criteria

- [ ] The PR contains a clear Phase 2f verdict: current DEFAULT_POSE values are
      still intentional, or specific changed deltas are listed with rationale.
- [ ] All 10 DEFAULT_POSE arm/thumb entries are pinned through
      `align_full_body_rest` as `UserCalibrated` behavior.
- [ ] A six-family retarget verification covers xiao, c-normal, zepeto, yoya,
      minjoon, and VRM0x.
- [ ] `cargo test -p shotloom-character-model-normalizer` passes.
- [ ] `cargo test -p shotloom-retarget` passes.
- [ ] Related retarget snapshot/regression tests pass; snapshots are regenerated
      only if numeric calibration changes require it.
- [ ] The PR description summarizes rig-family evidence and states whether
      STL-263/thumb CMC work can start.
- [ ] No `shotloom-gltf`, `shotloom-import`, bridge, editor, dependency, or ADR
      changes land in this PR.

## Verification

Focused gates:

```bash
cargo fmt --check
cargo test -p shotloom-character-model-normalizer
cargo test -p shotloom-retarget --test default_pose_recalibration
cargo test -p shotloom-retarget --test body_retarget_regression
cargo test -p shotloom-retarget
```

Doc gates:

```bash
pnpm validate:doc-paths
pnpm test:durable-doc-linear-refs
pnpm validate:durable-doc-linear-refs
pnpm validate:mermaid
pnpm lint:md
```

Broad gate before PR:

```bash
pnpm validate:docs
```

Manual repro:

- If no numeric delta changes: no required visual repro; PR body must state the
  six-family headless matrix is the equivalent retarget verification.
- If numeric delta changes: run
  `cargo run -p shotloom-retarget --example finger_compare --features examples -- --paused --start-frame <frame>`
  for at least the affected visual family and record the observed before/after
  frame in the PR.
- User-facing diagnostics/rejections: N/A; this PR adds no diagnostics,
  rejection codes, commands, events, or persisted artifacts.

Persisted artifact proof:

- N/A; this PR must not mutate normalized GLB bytes, cache artifacts, bundle
  state, or bridge event streams. Scope guard verifies no `shotloom-gltf` or
  `shotloom-import` diff.

Review gate:

- After push, run `/shotloom-review-before-pr` before opening the PR.

## Traps

- Do not assume axis-bake makes DEFAULT_POSE removable; the deltas target a
  natural user pose, not only pre-bake rig-coordinate drift.
- Do not change quaternion literals without matching invariant expectations and
  retarget regression evidence.
- Do not let a no-finger-axis fixture skip Stage 4; arm/thumb calibration is
  independent of the non-thumb ScalarCurl axis map.
- Do not write concrete Shotloom Linear IDs into durable Shotloom docs.
- Do not change `normalize_vrm`, cache version, or axis-bake diagnostics in a
  Phase 2f PR.
- Do not claim six-family visual coverage if only the three-actor
  `finger_compare` example ran.
- Do not regenerate golden snapshots as a substitute for explaining whether a
  calibration delta changed.

## Follow-Up Candidates

- Phase 2.5 retarget rig-branch elimination after Phase 2f evidence is stable.
- STL-263 / Phase 3 thumb CMC alignment if residual thumb behavior remains after
  axis-bake and DEFAULT_POSE recalibration.
- A shotloom-native calibration host to replace the upstream bevy-vrm viewer
  workflow.
- A reusable fixture-matrix helper if more retarget tests need the same preset
  loading boilerplate.
