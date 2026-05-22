---
status: proposed
created: 2026-05-22
updated: 2026-05-22
load: triggered
trigger: STL-519 - Debug Run raw debug VRM basis mismatch
repo: shotloom
linear: STL-519
briefing: ../../briefings/shotloom/debug-run-vrm-normalization-mismatch.md
supersedes: motion-debug-run-root-hips-preview.md
---

# Normalize Debug Run Seed VRM Bytes

## Spec Contract

- Briefing basis:
  `docs/briefings/shotloom/debug-run-vrm-normalization-mismatch.md`.
- Current truth: imported VRM assets enter `BundledVrmAssets` after
  `shotloom_gltf::normalize_vrm`, while the Debug Character seed path can cache
  the embedded debug VRM raw bytes.
- Required change: normalize the embedded debug VRM before inserting it into
  `BundledVrmAssets`, then pin the real Debug Character + Debug Run path with
  tests that fail if rendered hierarchy basis and retarget basis diverge.
- Locked boundary: no bridge payload, core model schema, retargeter math,
  editor UI, asset replacement, or root-motion policy change.
- One-PR suitability: yes. The implementation is engine-local and backed by a
  narrow diagnostic/regression test.
- Proof method: targeted seed tests, motion tests, ignored full app integration
  regression, and one manual web-editor happy-path check.

## Current State

| Surface | Classification | Evidence | Meaning |
|---|---|---|---|
| Imported VRM path | Already Done | Import handlers call `shotloom_gltf::normalize_vrm` before storing bytes in `BundledVrmAssets`. | Imported characters render from normalized bytes. |
| Debug Character seed path | Partial | `seed_debug_character_assets_from_bytes` owns the embedded VRM/FBX seed flow. | This is the correct insertion point for debug VRM byte normalization. |
| Retarget basis | Already Done | `shotloom_retarget::build_from_bytes` normalizes VRM input while building rest pose data. | Retarget data is computed in normalized VRM basis even when render bytes are raw. |
| Full engine repro | Partial | The failing diagnostic measured feet above hips in the loaded app hierarchy, while synthetic retarget/FK checks stayed plausible. | The bug appears after loading/applying into the real rendered skeleton. |
| Root/hips preview plan | Superseded | `motion-debug-run-root-hips-preview.md` captured the initial hypothesis. | Do not implement a root-motion policy workaround for this issue. |
| Tech-debt note | Partial | `docs/tech-debt/debug-run-vrm-normalization-mismatch.md` records the diagnosis and test commands. | Keep this note aligned with the final fix. |

## Problem

The Debug Run happy path mixes two VRM bases:

- Retarget path: normalized bytes, because `shotloom_retarget::build_from_bytes`
  normalizes the VRM while building rest pose data.
- Render path: raw embedded debug VRM bytes, because the debug seed path inserts
  the embedded VRM into `BundledVrmAssets` directly.

That mismatch can make the final loaded hierarchy look wrong even when the
retarget output itself is valid. The visible symptom is feet above hips and
unstable limbs during the Debug Character + Debug Run preview.

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-519` |
| State | In Progress |
| Priority | Urgent |
| Labels | `runtime`, `bug` |
| Project | Shotloom - bravo |
| Goal | Make Debug Character + Debug Run use the same normalized VRM basis as imported characters. |
| Acceptance | normalized debug seed bytes; seed/motion/full-app regressions; manual editor happy path. |
| Blockers | None after the raw-vs-normalized diagnosis; implementation is engine-local. |
| Related PRs | None yet for STL-519. |
| Current review state | No implementation PR yet; spec review only. |
| Planning consequence | Implement seed normalization and hierarchy regression, not root-motion policy. |
| Superseded premise | root/hips XZ placement policy was the initial hypothesis, but the confirmed bug is raw-vs-normalized debug VRM basis mismatch. |
| Current candidate | `fix/debug-run-normalized-vrm-seed`, commits `3c4030d8` and `f2d6080f`. |

## Requirements

1. Normalize `DEBUG_CHARACTER_VRM_ASSET_ID` bytes before inserting them into
   `BundledVrmAssets`.
2. Keep the existing Git LFS pointer guard before attempting normalization.
3. Keep the existing lock-poison and seed-failure posture: log and skip the
   debug asset rather than panic.
4. Preserve Debug Run FBX seeding behavior.
5. Do not change retargeter output semantics, root-motion application policy,
   bridge commands, timeline schema, or editor UI.
6. Add or keep a seed test proving the debug VRM overlay bytes equal
   `shotloom_gltf::normalize_vrm(raw_debug_vrm).normalized_bytes`.
7. Add or keep a focused motion test proving Debug Run retarget/FK output keeps
   feet below hips.
8. Add or keep a full app integration regression that spawns Debug Character,
   applies/scrubs Debug Run, and proves the loaded hierarchy pose changes
   plausibly with feet below hips.
9. Document the diagnostic and fix boundary so future debug seed assets follow
   the import path's normalization rule.

## Options Considered

| Option | Summary | Pros | Cons | Decision |
|---|---|---|---|---|
| Change root/hips preview policy | Suppress or clamp root X/Z from Debug Run. | Addresses the first visual suspicion. | Does not explain feet above hips in loaded hierarchy; risks violating existing root-motion behavior. | Rejected for STL-519. |
| Change retargeter math | Alter `shotloom-retarget` output so feet stay below hips after application. | Would centralize motion behavior. | Synthetic retarget/FK checks already show plausible output; this widens scope into pose semantics without evidence. | Rejected. |
| Normalize debug seed bytes | Store normalized embedded VRM bytes in `BundledVrmAssets`, matching imported characters. | Smallest boundary; directly removes raw-vs-normalized basis mismatch; easy to test. | Requires a full loaded-app regression because seed tests alone cannot prove hierarchy application. | Selected. |
| Replace embedded debug VRM or FBX | Swap to a friendlier validation asset. | Could reduce visible awkwardness. | Avoids the mismatch instead of fixing it; asset policy scope. | Follow-up only. |

## Non-Goals

- No root/hips XZ suppression, clamp, or placement-lock policy.
- No `PerformanceClip.root_motion_mode`.
- No retargeter rest-pose recalibration.
- No VRM normalizer algorithm change.
- No asset replacement for `vrm1x-vroid-f-xiao.vrm` or the Debug Run FBX.
- No TypeScript/editor wiring change.
- No bridge, IPC, or contract change.
- No Bevy schedule/plugin-order change.

## Locked Decisions

1. **The source of truth is raw-vs-normalized seed mismatch, not root-motion
   traversal.**
   Rationale: the full loaded hierarchy failed while synthetic retarget/FK
   remained plausible, which points at render-basis mismatch rather than
   retarget output absence or root X/Z policy.
   Rejected alternatives: implementing the superseded root/hips placement plan
   for STL-519, or treating visible off-placement motion as the same bug as
   feet above hips.

2. **Debug seed bytes must follow the import path's normalization rule.**
   Rationale: imported characters already render from normalized bytes. Built-in
   debug characters should not be a special raw-byte path when they share the
   same runtime cache.
   Rejected alternatives: normalizing only for retarget input, or leaving the
   debug render path raw because the asset is embedded.

3. **The fix belongs in `seed_debug_character_assets_from_bytes`.**
   Rationale: this is the earliest engine-local place where the embedded debug
   VRM enters the same in-memory byte cache used by runtime character loading.
   Rejected alternatives: patching the Bevy loader, adding bridge/editor flags,
   or special-casing motion application after the wrong bytes are already in
   the cache.

4. **Normalization failure is non-fatal for app startup.**
   Rationale: a bad embedded debug asset should disable the debug seed and
   surface through existing logging rather than crashing normal editor startup.
   Rejected alternatives: panic on app startup, silently insert raw fallback
   bytes after normalization failure, or ignore the existing LFS guard posture.

5. **Tests must include a loaded hierarchy check.**
   Rationale: synthetic retarget tests are necessary but insufficient because
   this bug was a mismatch between retarget basis and rendered skeleton basis.
   Rejected alternatives: browser-only visual verification, or only unit tests
   that never load the Bevy VRM hierarchy.

## Risk Map

| Risk | Applies? | Evidence | Plan response | Proof |
|---|---|---|---|---|
| Error source chain | yes | `normalize_vrm` can fail while app startup should remain usable. | Preserve seed failure logging and skip only the debug VRM overlay entry. | Seed tests plus no new panic path. |
| Schema / serialization compatibility | no | No `shotloom-core`, bridge DTO, or bundle schema changes. | Keep work inside engine seed/cache path. | `git diff` excludes schema/contract files except docs. |
| Ownership / API boundary | yes | Import path already owns normalized VRM bytes; engine seed owns embedded debug bytes. | Mirror import behavior in `seed_debug_character_assets_from_bytes`; do not edit retargeter. | Retarget tests unchanged; seed test pins bytes. |
| Partial mutation / rollback | no | The seed path inserts into an in-memory overlay during startup/debug setup, not a persisted multi-artifact transaction. | On failure, skip the debug VRM entry rather than partially inserting raw bytes. | Seed failure tests and manual app startup. |
| Diagnostic ownership | yes | Normalization failure belongs to seed logging; retarget diagnostics are not the owner of this mismatch. | Keep failure reporting at the seed boundary and avoid new bridge diagnostics. | No command rejection or event contract changes. |
| Asset lifecycle | yes | Debug VRM and FBX are embedded debug assets with LFS guards. | Keep raw LFS pointer check before normalization and preserve FBX seed logic. | Existing LFS guard tests still pass. |
| Test oracle strength | yes | Synthetic retarget can pass while loaded hierarchy fails. | Require both focused motion tests and ignored full app integration regression. | `motion::tests::debug_run_vrm1_preview_` and `vrm_spawn_integration`. |
| Scope creep | yes | Root-motion product policy and asset replacement are adjacent. | Put them in Non-Goals and Follow-Up Candidates. | Spec excludes editor, bridge, core schema, retargeter math. |
| Reviewer objection | yes | Reviewers may ask why an ignored full app test is required or why debug startup can skip a failed asset. | Document the basis mismatch and keep a fast seed test plus explicit ignored integration command. | Verification lists both targeted and ignored commands. |
| Local path exposure | no | Durable repo docs should not include machine-local paths. | Use repo-relative paths in the Shotloom tech-debt note and Knitten plan. | Privacy grep/manual review before PR. |

## Traps

- Do not infer the fix from the screenshot alone. The screenshot is compatible
  with root-motion drift, but the loaded hierarchy diagnostic is the deciding
  evidence for STL-519.
- Do not prove this only in synthetic retarget/FK code. That layer can pass
  while the real Bevy-loaded skeleton still uses raw debug bytes.
- Do not add a root-motion product field while fixing this urgent bug. That is
  a separate product/UI/bridge decision.

## Design Plan

### S0 - Baseline Re-check

Input:
- Current Shotloom worktree.
- `crates/shotloom-engine/src/app.rs`
- `crates/shotloom-engine/src/motion.rs`
- `crates/shotloom-engine/tests/vrm_spawn_integration.rs`

Output:
- Confirmed implementation entry points and existing test names.

Non-output:
- No source edits in this stage.

Failure:
- Stop if debug seeding moved out of `app.rs` or if the full app regression no
  longer uses the Debug Character path.

Proof:

Run before edits:

```bash
git status --short
rg -n "seed_debug_character_assets_from_bytes|DEBUG_CHARACTER_VRM_ASSET_ID|BundledVrmAssets" crates/shotloom-engine/src/app.rs
rg -n "debug_run_vrm1_preview_|scrubbed_motion_changes_debug_character_pose" crates/shotloom-engine
```

Expected:
- Worktree is clean or only contains intentional diagnostic changes.
- Debug VRM and Debug Run FBX seeding still live in `app.rs`.
- Existing tests identify both synthetic and full app paths.

### S1 - Normalize Debug VRM Seed Bytes

Modify:

```text
crates/shotloom-engine/src/app.rs
```

Input:
- Raw `DEBUG_VRM_BYTES`.
- Existing `BundledVrmAssets` overlay lock.
- Existing debug seed LFS guard.

Output:
- Normalized bytes stored under `DEBUG_CHARACTER_VRM_ASSET_ID`.

Non-output:
- No Debug Run FBX behavior change.
- No panic on normalization failure.

Failure:
- On normalization failure, log and skip inserting the debug VRM overlay entry.

Proof:
- Seed normalization test from S2.

Plan:
- Keep the LFS pointer check on the raw embedded VRM bytes.
- Call `shotloom_gltf::normalize_vrm(debug_vrm_bytes)`.
- Insert `normalized.normalized_bytes` into `BundledVrmAssets` for
  `DEBUG_CHARACTER_VRM_ASSET_ID`.
- If normalization fails, log the failure and leave the debug VRM absent from
  the overlay.
- Do not change the Debug Run FBX path.

### S2 - Pin Seed Normalization

Modify:

```text
crates/shotloom-engine/src/app.rs
```

Input:
- Embedded raw debug VRM fixture bytes.
- Runtime overlay bytes after seed.

Output:
- A regression test comparing overlay bytes with direct `normalize_vrm` output.

Non-output:
- No brittle byte fixture copied into the test body.

Failure:
- If fixture normalization fails, fail the test because debug seed cannot be
  trusted.

Proof:
- `cargo test -p shotloom-engine seed_debug_character_assets_tests`

Plan:
- Add or update a seed test to compare the bytes stored for
  `DEBUG_CHARACTER_VRM_ASSET_ID` with a direct `normalize_vrm` result from the
  embedded raw VRM.
- Keep existing missing-LFS-pointer and FBX seed behavior assertions intact.

### S3 - Pin Retarget and Loaded-App Behavior

Modify as needed:

```text
crates/shotloom-engine/src/motion.rs
crates/shotloom-engine/tests/vrm_spawn_integration.rs
```

Input:
- Built-in Debug Run FBX.
- Embedded debug VRM after seed.
- Engine app test harness.

Output:
- Focused motion regression and full loaded-app regression.

Non-output:
- No retargeter math change.
- No browser-only verification as the only proof.

Failure:
- If the full app regression is too slow for normal CI, keep it ignored but
  document the exact command and why it exists.

Proof:
- `cargo test -p shotloom-engine motion::tests::debug_run_vrm1_preview_`
- `cargo test -p shotloom-engine --test vrm_spawn_integration scrubbed_motion_changes_debug_character_pose -- --ignored --nocapture`

Plan:
- Keep the focused Debug Run retarget/FK test so a future retarget regression is
  visible separately.
- Add or keep an ignored full app regression that:
  - boots the engine app,
  - spawns Debug Character,
  - creates or simulates the Debug Run performance path,
  - scrubs motion,
  - verifies the loaded hierarchy pose changes and feet remain below hips.

### S4 - Document the Boundary

Modify:

```text
docs/tech-debt/debug-run-vrm-normalization-mismatch.md
```

Input:
- Diagnostic values from the failing loaded hierarchy.
- Final verification commands.

Output:
- Durable note explaining the raw-vs-normalized basis mismatch and confirming
  root-motion policy was not changed.

Non-output:
- No local machine paths.
- No claim that root-motion policy is fixed or decided here.

Failure:
- If the implementation changes the diagnosis, update Linear and this spec
  before PR.

Proof:
- `node scripts/validate-doc-paths.mjs`
- `git diff --check`

Plan:
- Record the raw-vs-normalized mismatch.
- Record the diagnostic and final verification commands.
- State that root-motion policy is intentionally not changed here.

## Verification

Required commands:

```bash
cargo fmt --check
git diff --check
cargo test -p shotloom-engine seed_debug_character_assets_tests
cargo test -p shotloom-engine motion::tests::debug_run_vrm1_preview_
cargo test -p shotloom-engine --test vrm_spawn_integration scrubbed_motion_changes_debug_character_pose -- --ignored --nocapture
node scripts/validate-doc-paths.mjs
```

Manual check:
- Open the web editor.
- Spawn Debug Character.
- Select Debug Run.
- Add the performance clip from the timeline row.
- Play or scrub.
- Expected: the character runs plausibly; feet do not invert above hips.

## Follow-Up Candidates

- Reopen root-motion preview policy only if the character still travels in a
  confusing way after the basis mismatch is fixed.
- Add a typed debug-asset seed helper if future built-in VRM assets repeat this
  pattern.
- Consider a product-level clip root-motion mode separately from this bug.

## Implementation Candidate

An already validated candidate branch exists:

- Branch: `fix/debug-run-normalized-vrm-seed`
- Diagnostic commit: `3c4030d8 test(engine): capture debug run VRM pose mismatch`
- Fix commit: `f2d6080f fix(engine): normalize debug VRM seed bytes`

The candidate should still be reviewed against this spec before PR creation.
