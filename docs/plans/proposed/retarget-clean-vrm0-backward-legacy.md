---
status: proposed
created: 2026-05-19
updated: 2026-05-19
load: triggered
trigger: STL-476 retarget VRM0/backward cleanup
repo: shotloom
linear: STL-476
briefing: ../../briefings/shotloom/retarget-clean-vrm0-backward-legacy.md
---

# Clean Retarget VRM0/Backward Legacy Assumptions

## Spec Contract

- Briefing basis: `docs/briefings/shotloom/retarget-clean-vrm0-backward-legacy.md`
  records STL-476 as a cleanup-only task after VRM0/backward normalization moved
  to import/model normalization.
- Current truth: `shotloom-retarget` already drives production retarget through
  normalized VRM1-shaped input, but still exposes dead VRM0 detection and a
  log-only backward-root probe.
- Required change: shrink retarget-owned VRM0/backward leftovers without
  changing thumb, finger, facial, import, GLTF, cache, engine, bridge, or editor
  behavior.
- Locked boundary: preserve `RetargetConfig::vrm_version_overrides` as a
  deserializable custom-config schema unless a separate API-compatibility issue
  removes it.
- Proof method: prove production retarget uses the canonical normalized path,
  remove dead probes/log-only residuals, and run the existing backward/VRM0
  regression tests that should remain unchanged.

## Current State

| Surface | Classification | Evidence | Planning consequence |
|---|---|---|---|
| Public retarget driver | Already Done | `crates/shotloom-retarget/src/lib.rs::retarget_arp_to_vrm` calls `mapping::normalize(..., VrmVersion::V1_0)`. | Preserve the one public driver and make the normalized-input assumption clearer. |
| Default ARP config | Partial | `crates/shotloom-retarget/src/lib.rs::default_arp_retarget_config` sets `vrm_version_overrides: Default::default()`. | No default `0.x` override needs removal; tests should stop treating `"0.x"` as an expected default-driver path. |
| Generic config schema | In scope but retained | `crates/shotloom-retarget/src/config.rs::RetargetConfig` deserializes `vrm_version_overrides`; `resolve_vrm_bone` still honors the provided key. | Keep for custom configs; removing it is an API/schema decision outside this cleanup. |
| VRM compatibility module | Partial | `crates/shotloom-retarget/src/vrm_compat.rs` defines `V0x`, `config_key("0.x")`, and `detect_from_gltf_json`. | Remove or shrink dead VRM0 probe code so production retarget no longer carries a fake VRM0 branch. |
| Mapping adapter | Partial | `crates/shotloom-retarget/src/mapping.rs::normalize` accepts `VrmVersion` only to pass `config_key()` into `normalize_body`. | Simplify the version-key boundary if `V1_0` is the only reachable production key. |
| Backward-root log | Partial | `crates/shotloom-retarget/src/retargeter.rs::ArpRetargeterInner::new_with_options` computes `has_180y_root` and emits it only in `[COORD]`. | Remove or rename the log-only residual so retarget does not imply ownership of backward-root normalization. |
| Backward/VRM0 normalization owner | Already Done | `crates/shotloom-gltf/src/vrm_normalization.rs`, `crates/shotloom-import/src/lib.rs`, `docs/tech-debt/vrm-backward-facing-audit-policy.md`. | Do not move or duplicate normalization logic in retarget. |
| Finger axis and rest calibration | Already Done and protected | `crates/shotloom-character-model-normalizer/src/align/finger_axis_map.rs`, `crates/shotloom-character-model-normalizer/src/align/arp_vrm_user_pose.rs`, `crates/shotloom-character-model-normalizer/README.md`. | Preserve `finger_axis_map`, `ScalarCurl`, and `DEFAULT_POSE`; they are active calibration. |
| Regression tests | Already Done and protected | `crates/shotloom-retarget/tests/finger_axis_yoya_xiao.rs`, `crates/shotloom-retarget/tests/thumb_retarget_regression.rs`, `crates/shotloom-character-model-normalizer/tests/rest_align_invariant.rs`, `crates/shotloom-gltf/tests/vrm1_backward_fixture.rs`. | Use these as unchanged guards, not as a reason to add a new thumb algorithm. |
| Retarget README | Partial | `crates/shotloom-retarget/README.md` already documents retained branches after default-config cleanup. | Update wording only if implementation changes a named retained surface. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-476` |
| State | `In Progress` |
| Owner | current agent session |
| Goal | Clean stale retarget-side VRM0/backward assumptions now that normalized VRM1-shaped artifacts are produced earlier. |
| Acceptance criteria | clarify normalized public driver, remove or justify VRM0 probe/config surfaces, clean `has_180y_root`, preserve protected finger/facial/default-pose surfaces, run listed tests. |
| Latest relevant comment | N/A |
| Blockers / dependencies | N/A |
| Related PRs | N/A |
| Current review state | no PR yet |
| Planning consequence | Keep this to a single retarget cleanup PR; any import/cache/axis-bake behavior is out of scope. |

## Problem

The retarget crate still carries VRM0/backward-looking code paths that no longer
match the runtime ownership boundary. Production retarget receives normalized
VRM1-shaped rest data after `shotloom-gltf::normalize_vrm`, but
`shotloom-retarget` still has a dead JSON version probe, a `V0x` enum variant
used only for local symmetry tests, default-driver tests that exercise `"0.x"`
as if it were reachable, and a log-only `has_180y_root` residual. Those surfaces
make future implementers think retarget is still the owner of VRM0/backward
normalization.

## Requirements

1. The public retarget path must remain `retarget_arp_to_vrm(source, vrm_rest,
   options)` and must continue to map through the normalized VRM1-shaped key.
   Source: STL-476 AC, ADR-0025.
2. Retarget must not parse GLTF/VRM metadata to detect `VRM` vs `VRMC_vrm`.
   Source: STL-476 scope, README crate boundary, ADR-0030.
3. The default ARP config must rely on canonical direct-map thumb entries and
   must not encode built-in `0.x` overrides. Source: STL-476 AC, completed
   `retarget-cleanup-rig-branches` spec.
4. The public `RetargetConfig::vrm_version_overrides` schema must stay
   deserializable and tested as a custom-config compatibility surface. Source:
   current schema, completed sibling spec decision.
5. The log-only `has_180y_root` residual must be removed or rewritten so it no
   longer claims retarget has backward-root correction state. Source: STL-476 AC.
6. `ScalarCurl`, `finger_axis_map`, `DEFAULT_POSE`, facial normalizer, import,
   GLTF normalization, cache version, engine, bridge, and editor code must remain
   unchanged. Source: STL-476 exclusions and sibling specs.
7. Verification must cover both the cleanup and the protected behavior:
   retarget unit tests for mapping/config/log changes plus existing GLTF,
   character-model-normalizer, and retarget backward/thumb guards. Source:
   STL-476 AC and current regression tests.

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | no | No new parser/loader/error enum is planned. | Do not add error variants; existing serde parse behavior remains untouched. | N/A: no wrapped external errors introduced. |
| Schema / serialization compatibility | yes | `crates/shotloom-retarget/src/config.rs::RetargetConfig` has `vrm_version_overrides`. | Preserve the field and its serde default; only remove dead production VRM0 dispatch. | Existing config tests plus retained override-precedence test. |
| Ownership / API boundary | yes | `shotloom-retarget` README excludes glTF parsing; `shotloom-gltf` owns normalization. | Remove retarget-side metadata detection; keep import/GLTF untouched. | Compile proof plus unchanged `cargo test -p shotloom-gltf --test vrm1_backward_fixture`. |
| Partial mutation / rollback | no | No persisted artifact, cache, or bundle mutation is planned. | Cleanup changes are code/docs/tests only. | N/A: no mutation surface. |
| Diagnostic ownership | yes | `retargeter.rs` emits `[COORD] is_blender={} has_180y_root={}`. | Remove the stale field or replace with a normalized-input-neutral coordinate log. | Unit/integration tests must not depend on a stale log; retarget tests pass. |
| Local absolute path exposure | yes | Briefing and spec are durable Knitten docs. | Use repo-relative paths and symbolic worktree names only. | `rg -n '[/]Users[/]|[/]home[/]|Downloads[/]|Desktop[/]' docs/briefings/shotloom/retarget-clean-vrm0-backward-legacy.md docs/plans/proposed/retarget-clean-vrm0-backward-legacy.md` returns no committed local path. |
| Test oracle strength | yes | Existing tests pin backward, VRM0x, thumb, and default pose behavior. | Add/adjust tests that would fail if a dead VRM0 branch remains in production mapping; keep behavior guards unchanged. | Full `cargo test -p shotloom-retarget` plus listed targeted integration tests. |
| Scope creep | yes | STL-476 excludes thumb algorithm, GLTF, import, cache, engine, bridge, editor. | Non-Goals lock adjacent work out. | Diff proof excludes protected directories except tests/docs explicitly named. |
| Reviewer objection | yes | Likely objection: deleting `vrm_version_overrides` breaks custom config; likely objection: removing tests weakens VRM0 coverage. | Preserve schema; move proof from fake `0.x` default-driver branch to normalized-input and existing import/regression tests. | Config schema tests retained; GLTF/retarget regression tests pass. |

## Locked Decisions

1. **Retain `RetargetConfig::vrm_version_overrides` as custom-config schema.**
   Rationale: The field is a deserializable public config surface and sibling
   cleanup already retained it after removing built-in default overrides. STL-476
   asks to remove or justify unused `0.x` override surfaces; this field is
   justified when treated as custom config compatibility, not production
   normalized-driver branching.
   Rejected alternatives: deleting the field, renaming it, or changing its
   serde shape in this PR.

2. **Remove retarget-side GLTF metadata version probing.**
   Rationale: `detect_from_gltf_json` parses raw extension keys, but retarget's
   crate boundary excludes glTF parsing and the public driver receives already
   normalized rest data. Keeping the probe makes a dead owner boundary look
   alive.
   Rejected alternatives: moving detection to another retarget module,
   expanding the probe, or adding an import fallback in retarget.

3. **Collapse production mapping to the normalized VRM1-shaped key.**
   Rationale: `retarget_arp_to_vrm` already passes `VrmVersion::V1_0`; the spec
   should make this path explicit and avoid tests that imply default retarget
   supports a direct `"0.x"` production route.
   Rejected alternatives: dispatching on asset metadata, adding an option to
   `RetargeterOptions`, or restoring default `0.x` thumb overrides.

4. **Remove or neutralize `has_180y_root` in retarget logs.**
   Rationale: the value is computed from rest-pose root rotation and not used
   for behavior. Backward-root normalization diagnostics belong to
   `shotloom-gltf`/import, not retarget initialization logs.
   Rejected alternatives: changing it into a warning, exposing it as a public
   diagnostic, or using it to alter retarget math.

5. **Protect active calibration and finger policy.**
   Rationale: `DEFAULT_POSE`, non-thumb `ScalarCurl`, thumb exclusions, and
   `finger_axis_map` compensate target/source rest-pose differences after
   normalization; they are not stale backward-root cleanup.
   Rejected alternatives: removing `DEFAULT_POSE`, changing thumb CMC behavior,
   or editing `ScalarCurl`/finger-axis code in this PR.

6. **Do not add a user-facing diagnostic or migration note.**
   Rationale: this cleanup should not change behavior, serialized data, or user
   flow. Any diagnostic policy for backward-facing assets belongs to the import
   tech-debt policy.
   Rejected alternatives: adding a new retarget diagnostic, promoting
   normalized-backward diagnostics, or changing cache version.

## Non-Goals

- New thumb algorithm, thumb CMC, 2-axis, or swing-twist correction.
- Changes to `ScalarCurl`, `finger_axis_map`, `DEFAULT_POSE`, or rest-sync
  strategy classification.
- Facial normalizer or expression pipeline cleanup.
- `shotloom-gltf` normalization, axis-bake, inverse-bind rebake, or cache
  version changes.
- Import, engine, bridge, editor, or UI changes.
- Public config schema removal or migration.
- Quality grading or `evaluate_pipeline` work.

## Implementation Spec

### S0 — Baseline Re-Check

Requirements: 1-7.

Run before edits:

```bash
git status --short
rg -n "VrmVersion|vrm_version_overrides|detect_from_gltf_json|config_key|has_180y_root" crates/shotloom-retarget
rg -n "normalize_vrm_bones_180y|normalized_backward_root_180y|finger_axis_map|DEFAULT_POSE|ScalarCurl" crates/shotloom-gltf crates/shotloom-import crates/shotloom-character-model-normalizer crates/shotloom-retarget/tests
```

Expected: only retarget cleanup targets are edited in this PR, while GLTF/import
and character-model-normalizer are used as verification owners.

### S1 — Shrink VRM Version Utility

Requirements: 1, 2, 3, 4.
Risk rows: Schema / serialization compatibility, Ownership / API boundary.

Modify `crates/shotloom-retarget/src/vrm_compat.rs`,
`crates/shotloom-retarget/src/mapping.rs`, and any direct callers so production
mapping no longer exposes a VRM0 detection branch. Preferred implementation:
remove `detect_from_gltf_json`, remove `VrmVersion::V0x`, and keep only the
minimal normalized-key behavior needed by `mapping::normalize`; if the enum
becomes unnecessary, replace it with an internal constant or direct `"1.0"`
key.

Update tests that currently assert local VRM0 probe symmetry. Do not remove
`RetargetConfig::resolve_vrm_bone` override semantics.

### S2 — Reframe Default Config Tests

Requirements: 1, 3, 4.
Risk rows: Schema / serialization compatibility, Test oracle strength.

Update `default_arp_config_resolves_thumb_slots_without_version_overrides` so it
proves the default ARP config uses canonical direct-map thumb entries under the
normalized `"1.0"` route. Add or retain a separate config-level test showing
that a custom version override still wins when a caller explicitly supplies a
key. Avoid asserting that the default production driver has a `"0.x"` path.

### S3 — Remove Stale Backward-Root Log Field

Requirements: 5.
Risk rows: Diagnostic ownership, Reviewer objection.

Modify `crates/shotloom-retarget/src/retargeter.rs` to remove
`has_180y_root` from the coordinate initialization log, or rename the log to
only state coordinate-source facts that retarget actually owns. Do not emit a
new warning or diagnostic. If any test snapshots read this log, update them to
the normalized-input-neutral message.

### S4 — Update Retarget Docs and Comments

Requirements: 1, 2, 3, 4, 6.
Risk rows: Local absolute path exposure, Scope creep.

Update `crates/shotloom-retarget/README.md` and nearby comments only where the
code changed. The text should say:

- normalized VRM targets enter retarget through the canonical VRM1-shaped route;
- generic custom config overrides remain a schema compatibility feature;
- import/GLTF owns VRM0/backward normalization;
- protected calibration paths remain intentional.

Do not add issue IDs, local paths, or implementation diary text.

### S5 — Verification Pass

Requirements: 6, 7.
Risk rows: Test oracle strength, Scope creep.

Run:

```bash
cargo test -p shotloom-retarget default_arp_config_resolves_thumb_slots_without_version_overrides
cargo test -p shotloom-retarget
cargo test -p shotloom-retarget --test finger_axis_yoya_xiao
cargo test -p shotloom-retarget --test thumb_retarget_regression thumb_retarget_tracks_remain_stable_for_backward_and_vrm0x_rigs
cargo test -p shotloom-gltf --test vrm1_backward_fixture
cargo test -p shotloom-character-model-normalizer
git diff -- crates/shotloom-gltf crates/shotloom-import crates/shotloom-character-model-normalizer
```

If time or environment prevents the full set, report the skipped commands and
run at least the retarget unit test, full retarget crate test where feasible,
and the targeted backward fixture guard.

## Acceptance Criteria

- [ ] `shotloom-retarget` no longer contains a live or dead public-driver VRM0
  metadata probe.
- [ ] The public retarget path clearly maps normalized inputs through the
  VRM1-shaped route.
- [ ] Default ARP config tests no longer imply a reachable default `"0.x"`
  production path.
- [ ] `RetargetConfig::vrm_version_overrides` remains serde-compatible and
  tested as a custom-config override surface.
- [ ] `has_180y_root` is removed or rewritten so retarget logs do not claim
  backward-root normalization ownership.
- [ ] Protected calibration/finger/facial/import/GLTF/cache/editor surfaces are
  unchanged.
- [ ] Verification commands in S5 pass or skipped commands are explicitly
  reported with reason.

## Verification

Focused gates:

```bash
cargo test -p shotloom-retarget default_arp_config_resolves_thumb_slots_without_version_overrides
cargo test -p shotloom-retarget
cargo test -p shotloom-retarget --test finger_axis_yoya_xiao
cargo test -p shotloom-retarget --test thumb_retarget_regression thumb_retarget_tracks_remain_stable_for_backward_and_vrm0x_rigs
```

Ownership guards:

```bash
cargo test -p shotloom-gltf --test vrm1_backward_fixture
cargo test -p shotloom-character-model-normalizer
git diff -- crates/shotloom-gltf crates/shotloom-import crates/shotloom-character-model-normalizer
```

Manual repro: N/A. This spec removes stale internal code/log wording and does
not introduce a user-facing diagnostic, rejection code, or UI behavior.

Local-path privacy proof before committing the spec:

```bash
rg -n '[/]Users[/]|[/]home[/]|Downloads[/]|Desktop[/]' docs/briefings/shotloom/retarget-clean-vrm0-backward-legacy.md docs/plans/proposed/retarget-clean-vrm0-backward-legacy.md
```

## Traps

- Do not delete `vrm_version_overrides` just because default retarget no longer
  uses `"0.x"`; that is a broader schema compatibility change.
- Do not treat `DEFAULT_POSE`, non-thumb `ScalarCurl`, or `finger_axis_map` as
  backward-root residue. They remain active rest-pose calibration.
- Do not add GLTF/import cache changes to prove retarget cleanup; the owner
  layer already has normalization tests.
- Do not replace a dead `has_180y_root` log with a new retarget warning. That
  would move diagnostic ownership in the wrong direction.

## Follow-Up Candidates

- Separate API-compatibility issue to deprecate or remove custom
  `vrm_version_overrides`, if downstream usage is audited first.
- Backward-facing import diagnostic policy from
  `docs/tech-debt/vrm-backward-facing-audit-policy.md`.
- STL-263 thumb algorithm proof work, if the thumb-specific scope is reopened.
