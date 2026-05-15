---
status: open
created: 2026-05-15
updated: 2026-05-15
load: triggered
trigger: working STL-438 - retarget canonical rig branch cleanup after axis-bake
repo: shotloom
linear: STL-438
---

# Clean Up Retarget Rig Branches After Axis-Bake

## Cold-Start Summary

Shotloom's VRM import path now normalizes VRM humanoid slots and bone axes before
the retarget layer sees target rest data, and Phase 2f pinned
`DEFAULT_POSE` as active user calibration rather than legacy axis-bake debt. The
remaining Phase 2.5 gap is narrower: audit the retarget and character-model
normalizer branches that still encode rig/version/finger special cases, delete
only the branches proved redundant by the canonical artifact contract, and pin a
classification for every branch that must remain. This plan does not change
axis-bake, GLB normalization, DEFAULT_POSE numbers, or thumb CMC behavior.

## Current State

| Surface | Class | Evidence |
|---|---|---|
| Public retarget entry point | Already Done | `crates/shotloom-retarget/src/lib.rs` always maps through `mapping::normalize(..., VrmVersion::V1_0)` before rest alignment, so live public retarget calls do not dispatch on target VRM 0.x after normalization. |
| Default source-to-VRM map | Partial | `crates/shotloom-retarget/src/lib.rs` maps ARP thumb source bones directly to VRM 1.0-style thumb slots, then also carries `vrm_version_overrides` for `0.x` and `1.0`. |
| Version override config surface | Partial | `crates/shotloom-retarget/src/config.rs` keeps `RetargetConfig::vrm_version_overrides` and `resolve_vrm_bone` override precedence, with tests proving the generic config behavior. The field is deserializable config surface, not only the default config literal. |
| Rest sync rule surface | Partial | `crates/shotloom-retarget/src/lib.rs` sets default rules `*Thumb* -> Skip` and non-thumb fingers -> `ScalarCurl`; `crates/shotloom-character-model-normalizer/src/align/arp_vrm.rs` gives `UserCalibrated` first priority before those rules. |
| DEFAULT_POSE calibration | Already Done | `crates/shotloom-character-model-normalizer/src/align/arp_vrm_user_pose.rs` defines 10 arm/thumb deltas; `tests/rest_align_invariant.rs` pins all 10 through public `align_full_body_rest` even with no non-thumb axis map. |
| Fixture matrix for calibration survival | Already Done | `crates/shotloom-retarget/tests/default_pose_recalibration.rs` runs presets `1`, `2`, `6`, `8`, `9`, and `13`, asserting DEFAULT_POSE bones exist in target rest and retarget output. |
| Finger axis map | Partial | `crates/shotloom-character-model-normalizer/src/align/finger_axis_map.rs` excludes thumbs from `axis_map`, still emits thumb diagnostics, and uses fixed left/right non-thumb curl axes. The module doc states backward and VRM 0.x axis flips should be stripped before downstream code. |
| Retargeter finger dynamics | Partial | `crates/shotloom-retarget/src/retargeter.rs` carries scalar curl, splay, and twist constants plus comments that per-rig overrides are intentionally not exposed. These are runtime finger transfer policy, not obviously axis-bake cleanup. |
| Retarget crate README | Partial | `crates/shotloom-retarget/README.md` exists and already names `RetargetConfig`; it is the closest durable doc surface for default mapping and branch-classification rationale. |
| Ground and foot correction | Already Done | `crates/shotloom-retarget/src/retargeter.rs` explicitly handles toe-less rigs and sole offsets; this is target asset validity/runtime contact behavior, not a Phase 2.5 rig-branch cleanup candidate. |
| Sibling Phase 2a-2e plans | Consumed | `gltf-add-axis-primary-child-picker.md`, `gltf-add-axis-correction-calculator.md`, `gltf-apply-vrm-axis-bake-rest-pose.md`, `gltf-rebake-axis-bind-matrices.md`, and `gltf-wire-axis-bake-normalize-vrm.md` keep axis-bake private to `shotloom-gltf` and leave retarget cleanup as follow-up. |
| Sibling Phase 2f plan | Consumed | `retarget-recalibrate-default-pose.md` locks DEFAULT_POSE as calibration verdict work and explicitly excludes rig-branch removal from that PR. |

## Problem

The retarget layer still contains a mixture of old-version mapping hooks,
canonical finger transfer policy, user-authored calibration, debug diagnostics,
and true runtime asset fallbacks. Treating all of them as "rig branches" would
either remove required behavior or reopen Phase 3 thumb work. The remaining work
is to classify the branch inventory in code, delete the one proven redundant by
the normalized VRM 1.0 retarget path, and add enough tests/docs so future cleanup
does not delete DEFAULT_POSE, non-thumb ScalarCurl, or toe-less rig safety by
mistake.

## Locked Decisions

1. **Clean up only the default retarget path in this PR; keep the generic
   config schema.**
   Rationale: the public driver always calls `mapping::normalize` with
   `VrmVersion::V1_0`, while default config still carries a `0.x` thumb
   override map that cannot be reached through that driver after normalized
   imports. `RetargetConfig::vrm_version_overrides` is deserializable config
   surface with existing tests and a `BodyMappingConfig` adapter, so removing
   the field would widen the PR into API/schema cleanup.
   Rejected alternatives: delete the `vrm_version_overrides` field and
   `resolve_vrm_bone` override precedence; add a new config migration; or keep
   the unreachable default `0.x` entries without a classification test.

2. **Treat DEFAULT_POSE as retained calibration, not removable axis-bake debt.**
   Rationale: `rest_sync_strategy` resolves `UserCalibrated` before
   `rest_sync_rules`, and Phase 2f tests already pin all 10 arm/thumb deltas
   through public rest alignment and six fixture families. STL-438 accepts
   preserving branches when the reason is fixed by tests or docs.
   Rejected alternatives: remove thumb/arm DEFAULT_POSE entries; move
   `UserCalibrated` behind config rules; or reinterpret a missing non-thumb
   axis map as permission to skip Stage 4 calibration.

3. **Keep thumb CMC exclusion and thumb skip policy unless a test proves a
   narrow default-map entry is dead.**
   Rationale: `finger_axis_map` excludes thumbs because thumb CMC is multi-axis
   and STL-263 owns the algorithmic follow-up. The default rest rules also keep
   thumbs out of ScalarCurl unless DEFAULT_POSE explicitly handles them.
   Rejected alternatives: route thumbs through ScalarCurl; add a two-axis thumb
   algorithm; or delete thumb safety comments/diagnostics as if they were
   ordinary version branches.

4. **Classify non-thumb ScalarCurl as canonical runtime policy, not a deletion
   target.**
   Rationale: axis-bake canonicalizes target bone axes, but source ARP curl,
   splay, and twist transfer still depends on per-frame source motion and the
   existing non-thumb finger tests. The left/right `vrm_curl_axis_for` signs and
   retargeter scalar/splay/twist constants should remain unless focused
   before/after tests prove identical output with a simpler path.
   Rejected alternatives: replace ScalarCurl with DirectCopy in this PR; delete
   splay/twist attenuation constants; or introduce per-rig overrides.

5. **Document the branch classification close to the owning code.**
   Rationale: the acceptance criteria require the kept/removed branch rationale
   to be code-based. A short table or comments in the retarget or normalizer
   README gives durable context without changing public docs, bridge docs, or
   ADRs for a private cleanup.
   Rejected alternatives: put Linear-only rationale in the PR body with no repo
   artifact; add a new ADR for a narrow cleanup; or scatter issue IDs through
   durable docs.

6. **Use tests as the deletion guard before removing any default branch.**
   Rationale: the smallest proof is to add or update unit tests that show the
   public/default retarget path does not consult the removed default override,
   while existing crate tests continue to prove generic config override behavior
   and DEFAULT_POSE survival.
   Rejected alternatives: rely on manual reasoning only; update golden snapshots
   without identifying the removed branch; or weaken existing config tests to
   make deletion easier.

## Non-Goals

- VRM axis-bake algorithm, rest-pose application, inverse bind rebake, or
  `normalize_vrm` wiring changes.
- `NORMALIZED_VRM_CACHE_VERSION` or normalized GLB byte changes.
- Removing the `RetargetConfig::vrm_version_overrides` schema field or the
  generic `resolve_vrm_bone` behavior.
- Deleting or numerically changing DEFAULT_POSE arm/thumb deltas.
- Implementing Thumb CMC or any two-axis thumb algorithm from STL-263.
- Replacing non-thumb ScalarCurl with DirectCopy or a new automatic axis
  algorithm.
- Changing bridge protocol, editor UI, command payloads, or diagnostics.
- Adding dependencies, moving crates, or writing a new ADR.

## Implementation Plan

### S0 - Baseline Re-Check

Run before edits:

```bash
git status --short
rg -n "default_arp_retarget_config|vrm_version_overrides|VrmVersion::V0x|VrmVersion::V1_0|rest_sync_rules" crates/shotloom-retarget/src crates/shotloom-body-anim-normalizer/src
rg -n "DEFAULT_POSE|UserCalibrated|ScalarCurl|is_handled_finger|vrm_curl_axis_for" crates/shotloom-character-model-normalizer/src crates/shotloom-character-model-normalizer/tests crates/shotloom-retarget/tests
```

Expected:
- Worktree is clean.
- The public retarget driver still normalizes with `VrmVersion::V1_0`.
- Generic config tests still cover override precedence.
- DEFAULT_POSE invariant tests and six-fixture retarget tests are present.

### S1 - Add a Branch Classification Note

Modify one small documentation surface, preferably:

```text
crates/shotloom-retarget/README.md
```

Use `crates/shotloom-character-model-normalizer/README.md` only if the final
implementation changes normalizer-owned comments or tests beyond the existing
DEFAULT_POSE note.

Record the retained/deleted classification:
- removed or collapsed: default `0.x` thumb override entries in
  `default_arp_retarget_config`, if S2 proves they are unreachable from the
  public normalized path;
- retained: generic `vrm_version_overrides` schema behavior;
- retained: `UserCalibrated` DEFAULT_POSE priority;
- retained: thumb exclusion from ScalarCurl pending STL-263;
- retained: non-thumb ScalarCurl and retargeter splay/twist transfer policy;
- retained: toe-less and foot-contact runtime fallbacks.

Do not include concrete Linear issue IDs in durable docs.

### S2 - Remove the Proven-Dead Default Override Entries

Modify:

```text
crates/shotloom-retarget/src/lib.rs
```

Expected narrow change:
- remove the unreachable `0.x` and redundant `1.0` thumb entries from the
  default `vrm_version_overrides` literal, or replace the literal with an empty
  map if the focused tests prove direct_map fully covers the default public
  path;
- keep `RetargetConfig::vrm_version_overrides` and
  `RetargetConfig::resolve_vrm_bone` unchanged;
- keep `rest_sync_rules` unchanged unless a test failure proves a narrower
  default is needed.

If removal changes retarget output for any matrix fixture, stop and convert the
affected entry into a documented retained branch instead of forcing deletion.

### S3 - Add Focused Regression Tests

Modify or extend:

```text
crates/shotloom-retarget/src/lib.rs
crates/shotloom-retarget/src/config.rs       # read/keep existing generic override tests
crates/shotloom-character-model-normalizer/tests/rest_align_invariant.rs # read/keep existing DEFAULT_POSE invariant
```

Test shape:
- one unit test around `default_arp_retarget_config` proving the default direct
  map resolves thumb slots for the public `VrmVersion::V1_0` path without
  version overrides;
- keep the existing generic config test proving override precedence for parsed
  custom config, so API behavior is intentionally retained; change it only if
  the narrow default-map cleanup forces an assertion update;
- rely on existing per-fixture tests in
  `crates/shotloom-retarget/tests/default_pose_recalibration.rs` for the
  six-family matrix rather than adding another slow collected-failures loop;
- rely on `rest_align_invariant.rs` for the DEFAULT_POSE
  `UserCalibrated` no-finger-axis proof, and do not edit it unless the
  implementation accidentally regresses the invariant.

Each new test should assert behavior beyond presence: the resolved target bone
name must match the canonical VRM 1.0 slot, and the default override map should
be empty or not contain version-specific thumb entries after cleanup.

### S4 - Scope Guard and Verification

After edits:

```bash
git diff -- crates/shotloom-gltf crates/shotloom-import
rg -n "NORMALIZED_VRM_CACHE_VERSION|normalized_vrm_axis_bake|apply_axis_bake_tail_stage" crates/shotloom-import/src/lib.rs crates/shotloom-gltf/src/vrm_normalization.rs
cargo fmt --check
cargo test -p shotloom-character-model-normalizer
cargo test -p shotloom-retarget
pnpm validate:docs
```

Expected:
- no diff in `shotloom-gltf` or `shotloom-import`;
- no cache-version or axis-bake diagnostic changes;
- both requested crate test suites pass;
- docs validation passes, or any missing local binary is recorded without
  weakening the successful markdown/doc-path checks.

## Acceptance Criteria

- [ ] The PR classifies every audited branch as removed, retained, or deferred
      with code-path evidence.
- [ ] The default retarget config no longer carries a proved-dead
      version-specific thumb override branch, or the PR documents why no branch
      can be removed safely.
- [ ] Generic `RetargetConfig::vrm_version_overrides` behavior stays intact.
- [ ] DEFAULT_POSE `UserCalibrated` priority and all 10 arm/thumb deltas remain
      intact.
- [ ] Thumb ScalarCurl exclusion remains explicitly tied to the STL-263
      algorithm boundary without adding issue IDs to durable docs.
- [ ] `cargo test -p shotloom-character-model-normalizer` passes.
- [ ] `cargo test -p shotloom-retarget` passes.
- [ ] The PR description lists removed branches and retained branches with the
      same rationale as the code/docs classification.

## Verification

- `cargo fmt --check` - formatting gate for Rust/doc-adjacent edits.
- `cargo test -p shotloom-character-model-normalizer` - proves DEFAULT_POSE and
  finger-axis invariants survive.
- `cargo test -p shotloom-retarget` - proves default mapping cleanup and fixture
  matrix behavior survive.
- `pnpm validate:docs` - proves durable docs do not violate repo doc rules.
- `git diff -- crates/shotloom-gltf crates/shotloom-import` - must be empty.
- `rg -n "NORMALIZED_VRM_CACHE_VERSION|normalized_vrm_axis_bake" crates/shotloom-import/src/lib.rs crates/shotloom-gltf/src/vrm_normalization.rs` - inspect only; no changes expected.
- No new user-facing diagnostic, error, rejection code, or manual repro path is
  introduced by this cleanup.
- `/shotloom-review-before-pr` after implementation push, with Rust and docs
  review focused on deletion safety and scope creep.

## Traps

- Do not delete the `vrm_version_overrides` config field just because the
  default map no longer needs default version entries; that would be public-ish
  schema cleanup outside this PR.
- Do not route thumbs through ScalarCurl. Thumb CMC is deliberately deferred to
  STL-263, and DEFAULT_POSE covers only the current hand-authored calibration.
- Do not treat foot/toe-less rig handling as axis-bake debt. Those branches
  defend runtime contact behavior for legitimate optional VRM bones.
- Do not touch `shotloom-gltf`, `shotloom-import`, or cache versioning; any
  normalized artifact mutation means the plan has escaped Phase 2.5.

## Follow-Up Candidates

- STL-263 thumb CMC / two-axis thumb transfer.
- A later config-schema cleanup if external custom retarget configs are retired
  or migrated.
- A shotloom-native DEFAULT_POSE calibration host to replace the upstream
  viewer workflow.
- Optional retargeter quality-grade work for scalar curl, splay, and twist
  fidelity once the cleanup branch is settled.
