---
status: proposed
created: 2026-05-18
updated: 2026-05-18
load: triggered
trigger: working STL-263 - VRM0.x and backward rig thumb support
repo: shotloom
linear: STL-263
briefing: ../../briefings/shotloom/retarget-vrm0x-backward-thumb-support.md
---

# Verify VRM0.x and Backward Rig Thumb Retargeting

## Spec Contract

- Briefing basis: `docs/briefings/shotloom/retarget-vrm0x-backward-thumb-support.md` on the existing Knitten doc branch.
- Current truth: STL-291 Phase 1 through Phase 2.5 are complete; live Shotloom code still lacks an AC-shaped thumb verification surface.
- Required change: add repeatable thumb-retarget evidence before adding a new thumb algorithm.
- Locked boundary: do not change GLB normalization, import cache, bridge payloads, editor UI, DEFAULT_POSE numbers, or non-thumb ScalarCurl.
- Proof method: run thumb-active visual comparison, add a focused thumb snapshot/metric, and use the result to close no-op or create the next algorithm spec.
- One-PR suitability: this spec defines the evidence PR only; algorithm code is a second PR under STL-263 when this PR proves a residual defect.

## Current State

| Surface | Classification | Evidence | Meaning |
|---|---|---|---|
| Linear issue | Partial | `STL-263` is In Progress and depends on STL-291 Phase 1 + 2. | The issue permits no-op close after verification, or algorithm work if residual thumb behavior remains. |
| Parent dependency | Already Done | STL-291 child ledger shows STL-369, STL-398, STL-402, STL-408, STL-409, STL-417, STL-419, STL-433, STL-438 Done. | Data-layer canonicalization is no longer the blocker for STL-263 verification. |
| Fixture registry | Already Done | `crates/shotloom-retarget/examples/fixtures.json` has xiao `1`, c-normal `2`, zepeto `6`, yoya `8`, minjoon `9`, and vrm0x A `13`. | The named AC families already exist as local fixtures. |
| Fixture taxonomy | Already Done | `assets/README.md` defines `_backward`, `vrm0x-*`, and `normalized_backward_root_180y*` meaning. | Verification can distinguish backward VRM1 from VRM0.x conversion paths without new fixture labels. |
| Current visual tool | Partial | `crates/shotloom-retarget/examples/finger_compare.rs` contains xiao, yoya, and vrm0x A only; `apply_animated_frame` gates live bones with `is_non_thumb_finger_bone`. | The current example cannot satisfy the literal STL-263 thumb visual AC. |
| Prior exploration commit | Missing from main | Linear attachment `a8fa2afe` expands `finger_compare` with `--include-thumb`, `--show-mesh`, and six actor families. | Reuse the shape as evidence input, not as landed code. Reapply against current main instead of cherry-picking blindly. |
| Thumb snapshot precedent | Missing from main | Linear attachment `5773a448` adds `thumb_retarget_regression.rs` and `thumb_retarget_run.snap`. | The prior test shape is useful, but it only snapshots xiao; STL-263 requires backward/VRM0.x coverage too. |
| Old ingest canonicalization attempt | Superseded | Linear attachment `e92d7fda` canonicalizes thumb chain naming inside `shotloom-retarget/src/vrm_rest.rs`. | Do not reapply: STL-291 moved data canonicalization into `shotloom-gltf` and final Phase 1 behavior is diagnostic-driven. |
| Default retarget config | Partial | `crates/shotloom-retarget/src/lib.rs` maps ARP `c_thumb*` to VRM thumb slots and keeps `*Thumb* -> Skip` in `rest_sync_rules`. | Runtime thumb tracks exist, but thumb rest sync stays out of ScalarCurl. |
| DEFAULT_POSE dispatch | Already Done | `crates/shotloom-character-model-normalizer/src/align/arp_vrm_user_pose.rs` defines six thumb deltas; `arp_vrm.rs` gives `UserCalibrated` priority over rules. | Existing thumb calibration remains active and must not be double-applied. |
| Finger axis map | Already Done | `crates/shotloom-character-model-normalizer/src/align/finger_axis_map.rs` excludes thumbs from returned `axis_map` and tests the exclusion. | Removing this guard is algorithm work, not proof work. |
| Retarget runtime scalar curl | Already Done | `crates/shotloom-retarget/src/retargeter.rs::is_scalar_curl_finger` rejects thumb. | Non-thumb ScalarCurl stays unchanged. |
| Body golden precedent | Already Done | `crates/shotloom-retarget/tests/body_retarget_regression.rs` uses sampled quaternion snapshots with `Quat::angle_between` tolerance and LFS pointer checks. | Thumb regression tests reuse this pattern. |
| Sibling spec STL-438 | Consumed | `docs/plans/completed/retarget-cleanup-rig-branches.md` retains thumb skip policy and defers Thumb CMC. | STL-263 cannot silently route thumbs through non-thumb ScalarCurl. |
| Sibling spec STL-433 | Consumed | `docs/plans/completed/retarget-recalibrate-default-pose.md` pins DEFAULT_POSE as active calibration and names STL-263 as thumb follow-up. | Numeric DEFAULT_POSE edits are out of scope for the proof PR. |
| Sibling spec STL-419 | Consumed | `docs/plans/completed/gltf-wire-axis-bake-normalize-vrm.md` wires axis-bake into `normalize_vrm`. | STL-263 proof starts from normalized artifacts and does not reopen cache/byte mutation. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-263` |
| State | In Progress |
| Owner | deemo |
| Goal | Prove whether VRM0.x/backward thumb behavior is natural after STL-291; add thumb-specific correction only if residual behavior remains. |
| Acceptance criteria | STL-291 Phase 1+2 complete; yoya/minjoon/vrm0x thumb visual matches xiao/c-normal; algorithm lands if needed; thumb snapshot stable. |
| Latest relevant comment | N/A |
| Blockers / dependencies | Parent `STL-291`; now satisfied by completed child issues through Phase 2.5. |
| Related PRs | Historical PR #228 merged; old Linear attachments from `feat/retarget-canonicalize-thumb-chain` are not on main. |
| Current review state | No active PR for STL-263. |
| Planning consequence | First PR lands proof infrastructure and evidence. Algorithm work begins only when proof shows a residual defect. |

## Problem

STL-263 asks for thumb naturalness evidence on yoya, minjoon, and VRM0.x after STL-291. The live verifier does not animate VRM thumb bones and omits minjoon/c-normal actors, so it cannot prove the acceptance criterion. Existing headless retarget snapshots cover body output and DEFAULT_POSE survival, but they do not isolate thumb-active frames across the named rig families. The remaining safe first step is to make the verification primitive real, then use that primitive to decide no-op close versus a new thumb algorithm.

## Requirements

1. Add thumb-active visual verification to `finger_compare`.
   Source: Linear visual AC and prior exploration commit `a8fa2afe`.
2. Cover the six comparison families: xiao, c-normal, zepeto, yoya, minjoon, and VRM0.x A.
   Source: Linear AC plus fixture registry precedent from STL-433.
3. Keep thumb live animation opt-in in the example.
   Source: STL-246 four-finger visualizer precedent and old exploration commit `a8fa2afe`.
4. Add a headless thumb retarget regression that fails on missing, static, or numerically drifting thumb tracks.
   Source: Linear snapshot AC and `body_retarget_regression.rs` snapshot pattern.
5. Include at least one backward family and one VRM0.x family in the headless thumb proof.
   Source: Linear title and AC.
6. Preserve data-layer boundaries.
   Source: STL-291, STL-419, and STL-438 sibling specs.
7. Preserve DEFAULT_POSE and non-thumb ScalarCurl invariants.
   Source: STL-433 and STL-438 sibling specs.
8. Treat a visual/headless residual failure as new evidence that requires an algorithm spec update before code changes.
   Source: Linear approach list says the algorithm choice is decided after data analysis.

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | no | This PR adds example/test code and no parser/loader/validator error enum. | No new `thiserror` variant or external source wrapper. | N/A: no error type is introduced. |
| Schema / serialization compatibility | no | No bridge contract, config schema, GLB JSON/BIN, or snapshot format consumed by runtime changes. | Keep new snapshot under test-only `tests/snapshots`. | `cargo test -p shotloom-retarget --test thumb_retarget_regression`. |
| Ownership / API boundary | yes | Thumb normalization belongs to `shotloom-gltf`; thumb retarget proof belongs to `shotloom-retarget`. | Modify `finger_compare` and retarget tests only. Do not touch `shotloom-gltf`, `shotloom-import`, or bridge/editor crates. | `git diff -- crates/shotloom-gltf crates/shotloom-import apps/editor contracts` is empty. |
| Partial mutation / rollback | no | The work mutates source files and test snapshots only; no runtime state/cache/persistence write path changes. | No atomicity protocol needed. | N/A: no coupled runtime artifact mutation. |
| Diagnostic ownership | no | No new diagnostic code or severity is added. | Verification uses test assertions and example CLI flags. | N/A: no diagnostic or rejection path changes. |
| Test oracle strength | yes | Current `finger_compare` omits thumb live animation; current body snapshot uses an FBX with no meaningful thumb movement for STL-263. | Add thumb-active fixture proof, static-track guard, sampled quaternion comparison, and manual naturalness verdict. | Test fails when thumb bones are missing, unchanged across active frames, or drift beyond tolerance; visual gate catches direction/naturalness defects. |
| Scope creep | yes | Old exploration commit `e92d7fda` changes retarget ingest naming; sibling specs moved that concern to STL-291 data layer. | Put ingest canonicalization, cache, and axis-bake in Non-Goals. | N/A: plan-boundary proof via empty diffs outside retarget example/tests. |
| Reviewer objection | yes | Likely objection: visual proof alone is subjective. | Pair visual example with headless thumb snapshot/metric and family matrix. | `cargo test -p shotloom-retarget --test thumb_retarget_regression`. |

## Locked Decisions

1. **Make STL-263 proof-first before algorithm-first.**
   Rationale: Linear explicitly lists no-op as an acceptable outcome after STL-291, and current live code lacks a verifier that can prove the AC.
   Rejected alternatives: implement 2-axis decomposition before proving residual failure; close no-op using the current `finger_compare`; or rely only on PR screenshots.

2. **Update `finger_compare` rather than create a second visualizer.**
   Rationale: `finger_compare` is the named AC tool and already owns source/target side-by-side rig comparison. Extending actor metadata and live-bone selection is smaller than adding another Bevy example.
   Rejected alternatives: new example binary; screenshot-only script; or hiding the change in a test helper.

3. **Keep thumb live animation behind an explicit `--include-thumb` flag.**
   Rationale: the existing example is a four-finger STL-246 verifier, and thumb inclusion changes the visual question.
   Rejected alternatives: always animate thumbs; remove the existing non-thumb view; or split the actor roster by separate binaries.

4. **Use the six-family actor set from the prior exploration, but reapply manually against current main.**
   Rationale: Linear attachments prove the shape was explored, but the branch was deleted and current main changed through STL-291/STL-438.
   Rejected alternatives: blind cherry-pick of old commits; limiting verification to xiao/yoya/vrm0x; or omitting minjoon despite the AC.

5. **Headless proof must include backward and VRM0.x fixtures, not only xiao.**
   Rationale: old `5773a448` is a useful snapshot pattern, but xiao is the already-natural control. STL-263 targets residual behavior in yoya/minjoon/VRM0.x.
   Rejected alternatives: xiao-only snapshot; body-regression reuse without thumb-active coverage; or pure visual approval.

6. **Do not reapply retarget-layer thumb-chain naming canonicalization.**
   Rationale: STL-291 data-layer work owns import canonicalization; live code emits `noncanonical_thumb_humanoid_slots` and normalizes axes before retarget.
   Rejected alternatives: port `e92d7fda` into `shotloom-retarget/src/vrm_rest.rs`; swap thumb names inside retarget maps; or bump normalized cache from STL-263.

7. **Do not remove the thumb exclusion guard in `finger_axis_map` during the proof PR.**
   Rationale: STL-438 retained thumb CMC exclusion and Linear says algorithm choice comes after data analysis.
   Rejected alternatives: route thumbs through ScalarCurl; add 2-axis/swing-twist code in the same proof PR; or delete tests that pin thumb exclusion.

8. **If proof exposes residual failure, stop before algorithm implementation and update the spec.**
   Rationale: the correct algorithm depends on measured failure shape: slot mismatch, metacarpal opposition, proximal curl, or twist.
   Rejected alternatives: preselect 2-axis decomposition without evidence; collapse all thumb segments into one rule; or patch DEFAULT_POSE numbers as a surrogate algorithm.

9. **Treat the first STL-263 PR as evidence-only and reviewable by itself.**
   Rationale: current main lacks the acceptance-test primitive. Combining visualizer expansion, headless snapshot design, residual classification, and a new thumb algorithm makes one PR too large and forces an unmeasured algorithm choice.
   Rejected alternatives: ship proof plus 2-axis algorithm together; leave the issue blocked until an algorithm is guessed; or split the proof across separate visual and headless PRs.

## Non-Goals

- `shotloom-gltf` VRM normalization, humanoid slot diagnostics, axis-bake, inverse-bind rebake, or cache-version edits.
- `shotloom-import`, engine import, editor UI, bridge payload, command, or event edits.
- DEFAULT_POSE numeric changes.
- Non-thumb ScalarCurl, splay, twist, or finger-axis-map rewrites.
- Thumb CMC, 2-axis decomposition, swing-twist, or per-segment policy implementation before residual evidence exists.
- New dependencies, ADRs, roadmap entries, or fixture files.
- Cherry-picking deleted exploration commits without current-main review.
- Durable Shotloom docs that mention concrete Linear IDs.

## Implementation Spec

### S0 - Baseline Re-Check

Run before edits:

```bash
git status --short
rg -n "enum VrmActor|ACTORS|is_non_thumb_finger_bone|apply_animated_frame|show_mesh|include_thumb" crates/shotloom-retarget/examples/finger_compare.rs
rg -n "\"1\"|\"2\"|\"6\"|\"8\"|\"9\"|\"13\"" crates/shotloom-retarget/examples/fixtures.json
rg -n "is_scalar_curl_finger|\\*Thumb\\*|DEFAULT_POSE|is_handled_finger_rejects_thumb" crates/shotloom-retarget/src crates/shotloom-character-model-normalizer/src crates/shotloom-character-model-normalizer/tests
```

Expected:
- Worktree is clean.
- `finger_compare` has three target actors and no `--include-thumb` flag.
- Fixture IDs `1`, `2`, `6`, `8`, `9`, and `13` exist.
- Thumb exclusion and DEFAULT_POSE dispatch tests still exist.

### S1 - Expand `finger_compare` To Match The Visual AC

Modify:

```text
crates/shotloom-retarget/examples/finger_compare.rs
```

Requirements covered: R1, R2, R3.
Risk Map rows: Ownership / API boundary, Test oracle strength, Reviewer objection.

Changes:
- Add actor variants and `ACTORS` entries for c-normal, zepeto, and minjoon.
- Keep xiao, yoya, and VRM0.x A.
- Add `--include-thumb` to include `{left,right}Thumb*` in live target animation and source-skeleton classification.
- Add `--show-mesh` or equivalent mesh visibility control if the example currently hides meshes unconditionally.
- Keep the old four-finger behavior as the default when `--include-thumb` is absent.
- Update top-of-file usage docs so the STL-263 verification command is explicit.

Verification:

```bash
cargo run -p shotloom-retarget --example finger_compare --features examples -- --paused --start-frame 196 --include-thumb --show-mesh
```

Manual pass condition:
- xiao and c-normal act as natural controls.
- yoya, minjoon, and VRM0.x A show thumb motion in the same frame range.
- If yoya/minjoon/VRM0.x A still bend opposite to the controls, capture the failing frame and update this spec before algorithm implementation.

### S2 - Add Thumb-Active Headless Regression

Modify or add:

```text
crates/shotloom-retarget/tests/thumb_retarget_regression.rs
crates/shotloom-retarget/tests/snapshots/thumb_retarget_run.snap
```

Requirements covered: R4, R5, R8.
Risk Map rows: Schema / serialization compatibility, Test oracle strength, Reviewer objection.

Test shape:
- Reuse `body_retarget_regression.rs` helpers where practical: LFS pointer check, sampled frame positions, `Quat::angle_between`, unit-quaternion guard, and explicit regeneration env var.
- Use `assets/anims/body/21566_M_AiFigureEightRun_250108.fbx` because prior exploration identified meaningful thumb activity.
- Cover these target fixture IDs: `1`, `2`, `8`, `9`, and `13`. Include `6` only if it exposes all six thumb bones through `build_from_bytes`; otherwise document it as visual-only coverage in the test comment.
- Assert all six thumb output tracks exist for each included fixture:
  - `leftThumbMetacarpal`
  - `leftThumbProximal`
  - `leftThumbDistal`
  - `rightThumbMetacarpal`
  - `rightThumbProximal`
  - `rightThumbDistal`
- Assert the source FBX has non-trivial thumb activity before comparing target output.
- Assert each target thumb track is non-static across sampled frames.
- Compare sampled target quaternions against the snapshot under the same `5e-3` rad tolerance used by body regression unless measured cross-platform drift forces a documented local constant.

Verification:

```bash
cargo test -p shotloom-retarget --test thumb_retarget_regression
```

Failure handling:
- Missing thumb bones, static target thumb tracks, or unstable snapshot output block no-op close.
- Opposite-bending, wrong segment transfer, or unnatural control mismatch from the visual gate becomes evidence for the algorithm spec update.

### S3 - Preserve Existing Thumb Boundaries

Read but do not modify unless S1/S2 produce compile fallout:

```text
crates/shotloom-retarget/src/lib.rs
crates/shotloom-retarget/src/retargeter.rs
crates/shotloom-character-model-normalizer/src/align/finger_axis_map.rs
crates/shotloom-character-model-normalizer/src/align/arp_vrm_user_pose.rs
crates/shotloom-character-model-normalizer/tests/rest_align_invariant.rs
```

Requirements covered: R6, R7, R8.
Risk Map rows: Ownership / API boundary, Scope creep.

Required invariant:
- `*Thumb* -> Skip` remains in default rest sync rules.
- `UserCalibrated` remains higher priority than config rules.
- `is_handled_finger_rejects_thumb` remains true.
- `is_scalar_curl_finger_rejects_thumb_and_non_finger` remains true.
- DEFAULT_POSE thumb deltas remain unchanged.

### S4 - Record Evidence In PR Body, Not Durable Repo Docs

Requirements covered: R1, R2, R4, R5, R8.
Risk Map rows: Test oracle strength, Reviewer objection.

PR body content:
- Visual command run and sampled frame.
- Included actor families.
- Headless test command.
- Verdict:
  - `No residual thumb algorithm needed` with passing visual/headless proof; or
  - `Residual thumb algorithm required` with failing family, failing bone segment, frame, and candidate algorithm entry point for the next spec.

Do not add a new Shotloom durable doc for this proof unless implementation changes a durable rule. If documentation is necessary, omit concrete Linear IDs.

### S5 - Verification Gate

Run after edits:

```bash
git diff -- crates/shotloom-gltf crates/shotloom-import apps/editor contracts
cargo fmt --check
cargo test -p shotloom-character-model-normalizer
cargo test -p shotloom-retarget --test thumb_retarget_regression
cargo test -p shotloom-retarget
pnpm validate:docs
```

Expected:
- No diff in data-layer, bridge, editor, or contract paths.
- Character-model-normalizer tests pass unchanged.
- Thumb regression passes or fails with actionable residual evidence.
- Full retarget tests pass.
- Docs validation passes or reports only an unavailable local tool.

## Acceptance Criteria

- [ ] `finger_compare` has opt-in thumb live animation.
- [ ] `finger_compare` includes xiao, c-normal, zepeto, yoya, minjoon, and VRM0.x A.
- [ ] Default `finger_compare` still supports the old non-thumb four-finger comparison.
- [ ] Headless thumb regression covers at least one natural control, one backward rig, and one VRM0.x rig.
- [ ] The test fails on missing thumb tracks, static thumb tracks, or sampled quaternion drift.
- [ ] `shotloom-gltf`, `shotloom-import`, editor, bridge, and contract paths have no diff.
- [ ] DEFAULT_POSE thumb values and thumb ScalarCurl exclusion remain unchanged.
- [ ] PR body states no-op-close proof or residual algorithm evidence.

## Verification

| Gate | Command | Pass condition |
|---|---|---|
| Baseline search | S0 commands | Expected surfaces match current-state table. |
| Visual proof | `cargo run -p shotloom-retarget --example finger_compare --features examples -- --paused --start-frame 196 --include-thumb --show-mesh` | All six actors load; thumb motion is visible for named target families. |
| Focused thumb proof | `cargo test -p shotloom-retarget --test thumb_retarget_regression` | Tracks exist, source thumb is active, target thumb is non-static, snapshot stays within tolerance. |
| Normalizer invariant | `cargo test -p shotloom-character-model-normalizer` | DEFAULT_POSE and thumb exclusion invariants remain green. |
| Retarget suite | `cargo test -p shotloom-retarget` | Existing retarget behavior remains green. |
| Scope guard | `git diff -- crates/shotloom-gltf crates/shotloom-import apps/editor contracts` | Empty output. |
| Docs | `pnpm validate:docs` | Documentation checks pass or missing local binary is reported. |

Manual repro lines:
- Visual thumb verification: run the S1 command and inspect xiao/c-normal controls against yoya/minjoon/VRM0.x A at the same paused frame.
- Snapshot regeneration: run `SHOTLOOM_REGEN_THUMB_SNAPSHOT=1 cargo test -p shotloom-retarget --test thumb_retarget_regression` only after deliberate accepted output change.

## Traps

- Do not cherry-pick `e92d7fda`; retarget-layer thumb chain naming canonicalization conflicts with STL-291 ownership.
- Do not route thumbs through `ScalarCurl`; sibling specs preserve thumb exclusion until a dedicated CMC algorithm exists.
- Do not edit DEFAULT_POSE numbers to make visual output look closer; STL-433 treats those as calibrated values.
- Do not use a xiao-only snapshot as STL-263 proof; xiao is a control, not the failing family.
- Do not treat a regenerated snapshot as naturalness proof by itself; pair it with visual family comparison and non-static assertions.
- Do not commit screenshots or generated media unless the PR process explicitly requests artifacts.

## Follow-Up Candidates

- Thumb-specific algorithm spec if proof shows residual yoya/minjoon/VRM0.x failure.
- Dedicated 2-axis or swing-twist thumb CMC implementation after measured failure classification.
- Promotion of additional VRM0.x/backward fixtures from follow-up to loaded set after end-to-end verification.
