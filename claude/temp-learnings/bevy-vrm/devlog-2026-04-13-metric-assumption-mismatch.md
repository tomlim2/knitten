# 2026-04-13 — Metric Assumption Mismatch Cleanup

## Session frame

Started as "P0 diagnose before P3 retarget redesign". Ended as "P3 demoted, measurement stack is the real problem".

## What we actually did

Before: "0.x 모델이 F, 1.x가 B → retarget 0.x 경로 버그 → ARP retargeter 재설계 필요 (P3, 며칠짜리)"

After: measurement stack was lying in several independent ways. Retargeter itself produces grade B on 1.x models for a fast running animation, which is roughly the ceiling given the source. P3 demoted.

## Commits landed (local, 8 total, not pushed)

1. `70cb2da` refactor(retarget): delete dead is_vrm0 branching, move forward_direction to VRM load
2. `3fec8db` refactor(rubric_c): drop C1.5 RestCongruence and C1.6 Symmetry
3. `2da5bfb` feat(pop-scan): add per-bone breakdown after pop list

Plus 5 earlier commits from the prior session kept as-is.

Net: −204 LOC dead/broken code, +30 LOC diagnostic/validation. Retarget output unchanged (verified via CLI grade diff, 0 lines).

## Key findings

### 1. `is_vrm0` branching was entirely ornamental

- `VrmRestPose.is_vrm0` field: never read by the retargeter
- `retargeter.rs:198`: has_180y_root is computed internally from `root_rest_rotation.y`, passed-in is_vrm0 ignored
- `has_180y_root` itself is never read to alter retarget behavior — only logged in `[COORD]` and reported in `[RQ]` as `root180=Y/N`
- `RetargetQuality.is_vrm0` field: literal duplicate of `has_180y_root` (`is_vrm0: self.has_180y_root` at line 644)
- `quality/mod.rs:188` warning loop referenced `rest_pose_missing_offsets` which was always `Vec::new()` — dead code

The visible 0.x-vs-1.x grade difference (F vs B) came from the rest pose structure differing (180°Y baked on root), NOT from a 0.x code path. The retargeter treats all models uniformly.

### 2. Rubric C had two broken metrics

- **C1.5 RestCongruence**: compared frame 0 world rotation vs rest world rotation. Assumed animations start at rest pose. Running anim frame 0 is mid-stride → universal F for every non-rest-start clip.
- **C1.6 Symmetry**: computed L/R bone rotation delta per frame, graded mean against small thresholds (A<3°, B<5°, C<12°). Stride motion is intrinsically asymmetric → all locomotion F. `asymmetric_flag` was supposed to discount but only appended a note.

Both deleted. Weights redistributed 30/25/20/15 → 33/28/22/17 (joint_limit, ground_contact, stability, fidelity).

### 3. Rubric C still has `forward_direction` moved to VRM load

Was a hard-fail gate in rubric_c that applied retarget output rotations to `-Z` and failed if >10% pointed backward. It's actually a static VRM model property (is the hips rest pose facing −Z?), not an output quality metric. Moved to `validate_vrm_load` as a static check on `bone_rest_global["hips"] * Vec3::NEG_Z`.

### 4. A1.1 GimbalSpike is mostly a metric artifact

Ran pop_scan on `21566_M_AiFigureEightRun_250108.fbx`, threshold 5°, got 5005 pops. Per-bone breakdown:

| category | pops | % | notes |
|---|---|---|---|
| ARP IK helpers (*_stretch) | 3,656 | 73% | retargeter doesn't use these |
| foot.l/r | 1,026 | 21% | real heel-strike motion |
| root.x | 178 | 4% | root motion |
| finger c_* | ~85 | 2% | ARP finger controls |
| rest | ~60 | <2% | shoulder, spine, hand, head |

Two compounding bugs in `metric_gimbal_spike`:

1. **Bone filter missing**: `arm_stretch`, `thigh_stretch`, `leg_stretch`, `forearm_stretch` are ARP IK stretch helpers with anomalous quaternion paths. The retargeter skips them via humanoid bone mapping; the metric doesn't.
2. **3×median threshold breaks on periodic motion**: foot.l/r median delta during fast running is high (5–8°), 3× that is 24–30°, which is exactly where legitimate heel-strike peaks live. Real motion gets flagged.

A1.1 was not fixed in this session. Fix is queued as "proper redesign" requiring detector choice (MAD / fixed ceiling / percentile) + threshold recalibration on multiple animations.

## The pattern: metric assumption mismatch

Three metrics failed the same class of bug in one session:
- C1.5: assumed anim starts at rest
- C1.6: assumed bilateral motion is symmetric
- A1.1: assumed all bones are real deformation, used global median as anomaly baseline

All three had a reasonable-sounding implementation and passed code review (presumably). All three silently broke on any real motion clip. Opus critic named this exactly: "the pattern has burned you twice — A1.1 is a third instance."

**Rule of thumb going forward**: before trusting a new metric, write down its assumption in one sentence and check against running-gait reality. If the assumption can't be stated, the metric isn't ready to gate decisions.

## Retargeter state after cleanup

Running anim (`21566_M_AiFigureEightRun`) best grades after removing broken metrics:

- `vroid_1x_m_c_normal` → B (C1.1=A C1.2=C C1.3=B C1.4=B)
- `vroid_1x_f_xiao` → B
- `vroid_1x_f_m_small` → B

C1.4 Fidelity=B means path-length ratio 0.87–1.15 — retargeter faithfully follows source motion. This is the real ceiling given the source. P3 ARP retarget structural refactor is not urgent.

## Debt inventory — next session starts here

### High priority (same assumption-mismatch class, almost certainly broken)

1. **C1.3 Stability** (`rubric_c.rs`) — identical `3×median` anomaly detector as A1.1. Same bug. Periodic motion will false-F.
2. **A1.4 Smoothness** (`rubric_a.rs`) — jerk 99th percentile thresholds 5000/10000/20000 deg/s³. Fast motion suspect.
3. **C1.2 GroundContact** (`rubric_c.rs`) — uses min Y as ground proxy. Floating animations get wrong baseline. Per-frame slide thresholds (25mm consecutive) confuse normal swing with retarget bugs.
4. **A1.1 GimbalSpike fix** — diagnosed but not fixed. Needs: bone filter (skip `*_stretch`, `c_*`, `*.x`, `*_twist`), replace 3×median with MAD or fixed angular-velocity ceiling, recalibrate grade thresholds.

### Medium priority (dead / ornamental state)

5. **RetargetQuality hardcoded fields** — `shoulder_ratio: 1.0`, `arm_ratio: 1.0`, `unmatched_bones: 0` at `retargeter.rs:646`. Never computed. `diagnostics()` reads them and generates lying messages.
6. **`has_180y_root` telemetry** — still logged in `[COORD]` and `[RQ]` lines but the retargeter doesn't branch on it. Either compute and use it or delete the log fields.
7. **`quality/foot.rs`** — 709 LOC, has its own `has_180y_root` branch at line 399. Never audited this session.
8. **`VrmVersion::V0x`/`V1_0` enum** — used by `retarget_test.rs` bin and `validate.rs`. After this cleanup, confirm uses are real and not telemetry-only.
9. **`validate-pipeline` vs `retarget-test` bins** — two validation bins. Possibly redundant after cleanup.

### Lower priority (structural refactor)

10. **`retargeter.rs::new_with_options` 185 LOC** — original P3 todo. Extract scale calc, coord detect, topo build, BoneData build, correction pairs into free functions. Value is still there, just not urgent.
11. **`vrm_rest.rs` 709 LOC** — comment archaeology suggests workarounds accumulated over time. Worth a read-through audit once A1.1 is trusted.

### Infrastructure missing

12. **Regression harness** (Opus strong recommendation) — freeze rubric A + C scores as JSON snapshots under `artifacts/quality_baselines/YYYY-MM-DD/`, add `cargo test --test golden_retarget` that diffs against them with per-metric tolerance bands. Without this, the deleted-metrics class of bug will keep recurring.
13. **Benchmark pack** — 1 run, 1 walk, 1 idle FBX marked trusted/suspect in a checked-in manifest. Do not curate a "clean" FBX library until A1.1 is trusted (circular dependency).

## Decision log for next session

**If actual quarterly goal is "accept motion from more sources":**
→ Skip all metric work, go to P1 SourceAnim abstraction. Ship grade-B retarget as-is. Metrics are internal tooling.

**If goal is "trust the scorecard and iterate retarget quality":**
→ Follow the verification-first execution plan below. Do NOT start with "fix A1.1" — start with fixtures.

**Either way**, do NOT curate new source FBXs until the scorer is trustworthy. The selection bias would lock a flawed metric into the benchmark.

## Execution plan (verification-first)

An earlier draft proposed "Phase 0 regression harness → Phase 1 A1.1 fix → ...". That order was wrong. A harness freezes current output; it does not verify correctness. Snapshotting a broken metric locks the broken state in. Fixtures must come first.

Revised order:

### Phase 0 — Fixture infrastructure (blocking prerequisite)

Build `crates/humanoid_retarget/tests/fixtures/` with 6 hand-written synthetic animations. Constructors use `glam::Quat::from_rotation_*` directly — no shared helpers with production code. Expected metric outputs computed by hand and written in comments before any metric runs.

1. `identity_30_frames` — all bones static. Every metric should grade A.
2. `arm_linear_sweep` — single bone rotates 0° → 90° linearly over 30 frames (3°/frame). Any spike detector should return 0 spikes (continuous motion).
3. `single_discontinuity` — all frames identity except frame 100 jumps 30°. Spike detector should return exactly 1 spike.
4. `periodic_arm_swing` — sinusoidal arm rotation. Spike detector should return 0 (periodic ≠ discontinuous). This is the case A1.1 currently false-flags.
5. `mirrored_jumping_jack` — L/R bones in perfect mirror. Any symmetry metric should grade A.
6. `fast_heel_strike` — foot.r at 20°/frame. Reproduces the running-anim false positive at minimum complexity.

Add `cargo test --test metric_fixtures`. Run all existing metrics against all fixtures. Record which combinations pass green and which fail red.
- **Passing fixtures:** treated as current-correct until proven otherwise. Future edits that break them are regressions.
- **Failing fixtures:** locked-in bug reproductions. They become the red tests that drive the corresponding fix.

Only after all fixtures produce the hand-computed expected values is a regression snapshot meaningful. Snapshot comes last, not first.

**Time estimate:** 3–4h (fixture builders + assertions + initial green/red recording). Touches tests only, zero production code risk.

### Phase 1 — Dead state cleanup (promoted from mid-priority)

Dead code cannot have bugs. Deleting unused state is the lowest-risk work available and reduces the surface area for Phase 2+ fixtures. Each change verified by the pattern proven today: CLI grade diff before/after must be 0 lines.

- `RetargetQuality.shoulder_ratio` / `arm_ratio` / `unmatched_bones` — hardcoded to 1.0 / 1.0 / 0 in `retargeter.rs:646`. Either compute them honestly or delete the fields and the `diagnostics()` messages that read them.
- `has_180y_root` telemetry in `[COORD]` and `[RQ]` log lines — unused by retarget logic, only logged. Either delete the log fields or justify why the log is load-bearing.
- `quality/foot.rs` audit — 709 LOC, has its own `has_180y_root` branch at line 399, never reviewed this session.
- `VrmVersion::V0x` / `V1_0` enum — audit real uses after today's cleanup; may be log-only.
- `validate-pipeline` vs `retarget-test` — two validator bins, possibly redundant.

**Time estimate:** 2–3h, mostly mechanical. Delegable to Sonnet with a "CLI diff must stay 0 lines" acceptance criterion.

### Phase 2 — A1.1 red → green

Not "redesign A1.1". The task is "write red tests that reproduce the ARP-stretch-bone pollution and the bimodal-periodic false positive, then write the minimum detector change that turns them green."

Red tests (added to Phase 0 fixtures or new ones):
- `stretch_bones_only` — animation where only `arm_stretch.l`, `leg_stretch.r` etc. move. A1.1 on real deformation bones should not see these (assertion: they are excluded from scoring, not that they score zero).
- `periodic_arm_swing` from Phase 0 — currently red.
- `fast_heel_strike` from Phase 0 — currently red.

Implementation of the fix:
- Add a bone-name filter using the retargeter's existing humanoid bone map, so only bones the retargeter actually uses contribute to A1.1.
- Replace `3 × median` with either MAD-based threshold (`k × MAD` where `k ≈ 3.5`) or a fixed anatomical angular-velocity ceiling (e.g., 1500°/sec). Pick by running both against all 6 Phase 0 fixtures and seeing which gives the expected grades with less threshold tuning.
- Recalibrate A / B / C / F grade boundaries using the 6 fixtures as anchors.
- Rename "GimbalSpike" → "AngularVelocityOutliers" (the metric does not detect gimbal lock; naming was wrong).

All red tests become green before landing. Commit the fixture additions and the detector change in **separate commits** per the philosophy rules.

**Time estimate:** 3–4h.

### Phase 3 — Pattern inheritance (C1.3 + A1.4)

Both use the same anomaly-detector shape A1.1 had. After Phase 2, apply the same fix (or the new shared detector helper) to C1.3 Stability and A1.4 Smoothness. Re-run Phase 0 fixtures — they should already exercise the failure modes. If not, add targeted fixtures.

**Time estimate:** 2h (mostly reuse).

### Phase 4 — C1.2 GroundContact (deferred)

Originally planned to fix `min Y → vrm_rest.foot_sole_offset` as the absolute ground reference. But `foot_sole_offset` itself is upstream state with no fixture coverage. Fixing C1.2 would mean trusting an unverified layer.

Correct sequence: (a) add fixtures for `foot_sole_offset` extraction in `vrm_rest.rs`, (b) once that is green, build C1.2 fixtures on top, (c) then fix C1.2. This is a separate multi-phase chunk, not part of this round.

### Phase 5 — Benchmark pack (final)

Codex's original recommendation to label 3–5 FBXs as trusted/suspect depends on a trustworthy scorer. Until Phase 0–3 are complete, any labels would either reflect the current broken metrics (circular) or reflect human judgment that cannot be cross-checked against the metric (no feedback loop). **Defer until Phase 3 lands.** After that, benchmark labels can be validated by correlation with fixture-verified metrics.

### Phase 6 — Structural refactor (conditional)

`retargeter.rs::new_with_options` 185 LOC extraction was originally P3. Still valuable for readability, but only worth doing **after** fixtures exist that can verify "the extracted functions produce identical output to the original". Without those, any refactor is flying blind. Lowest urgency of all.

## Insights from re-examining the debt inventory through the verification lens

1. **Every remaining metric (C1.1, C1.2, C1.3, C1.4, A1.1, A1.2, A1.3, A1.4) is currently unverified.** None has a fixture. Today we proved three were broken by accident; the other five are equally at risk until fixtures exist. Phase 0 is not optional.

2. **Downstream metrics depend on upstream unverified state.** C1.2 depends on `foot_sole_offset`, which depends on `vrm_rest` extraction, which depends on the FBX parser. Each layer trusts the next with no checkpoint. Fixtures must propagate bottom-up: parser fixtures first, extraction fixtures next, and so on. Skipping layers means the top-layer fixture is implicitly trusting a pile of unverified code.

3. **Dead-state cleanup (Phase 1) reduces Phase 2 fixture complexity.** A struct with 30 fields is harder to assert over than one with 20. Cleaning first makes later fixtures more readable. This is why Phase 1 is promoted from mid-priority to immediately after Phase 0.

4. **P3 ARP retargeter refactor was originally impossible to verify.** Splitting `new_with_options` into smaller functions requires proving "outputs are byte-identical before and after". A CLI grade-diff harness proves only that grades are the same — it does not prove that intermediate quaternion paths are unchanged. Only a fixture with hand-computed expected bone rotations can do that. This is why Phase 6 must come after Phase 0.

5. **Codex's "benchmark first" recommendation was internally circular.** Labels reflecting a broken metric teach the broken metric. Labels from human judgment with no fixture check cannot be verified. The only escape is to make fixtures the source of truth first, then use benchmarks as a secondary correlation check. The verification philosophy makes this visible; without it, benchmark labeling feels productive but locks in bias.

6. **The rule "fixture commits and metric commits land separately" was about to be violated by the original plan.** Doing "A1.1 detect + fix + recalibrate" in one session as a single unit would have produced a single squashed commit where a future reviewer cannot distinguish "what test broke first" from "what change fixed it". The rule forces a cleaner bisection history. Applied to the revised plan: every phase above lands as at least two commits — fixture first, then the change the fixture required.

## Scope note

Every change in this session — and every item in the debt inventory above — operates on the **diagnostic / measurement layer only**. None of it changes the retargeted animation the viewer plays. `rubric_a/b/c`, `RetargetQuality`, `validate-pipeline`, `retarget-test`, `pop-scan` are all consumed exclusively by CLI bins (grep confirmed: 0 references from `src/` app code). The retargeter in `retargeter.rs::apply()` does not call the rubric system; rubric evaluates retargeter output post hoc.

Practical consequence: every fix listed in the debt inventory can land without risking visible regression in the Bevy viewer. The user will see no change.

## Verification philosophy

Meta-question raised during session: if diagnostic code can rot, how do you verify the diagnostic code itself? And what happens if the verifier rots too?

Honest answer: infinite regress is not solvable, but practical layering makes it almost never hit in real engineering. The rule is **every verification layer must be drastically simpler than the layer above it**, so that correctness can be inspected by eye instead of by another machine.

### The trust ladder (top = most suspect, bottom = irreducible)

```
Production metric (500 LOC, complex)
    ↑ verified by
Synthetic fixture (10-20 LOC, hand-calculated expected value in comment)
    ↑ verified by
Pure math (quaternion algebra, human head)
    ↑ verified by
Visual cross-check in the Bevy viewer (human eye)
```

Every layer is 10× smaller than the one above. If the fixture is as complex as the metric, the ladder fails.

### Rules that keep fixtures from rotting

1. **Screen-sized.** A fixture that does not fit on one screen cannot be reviewed. Example target: `fn arm_rotates_90_deg_over_30_frames() -> FbxData` in under 20 lines.

2. **Expected value in a comment, hand-computed.** Never assert against what the metric currently returns — that is circular. Compute the expected value from the input definition, write it in the comment, assert against the comment:
   ```rust
   // Arm rotates 0° → 90° linearly over 30 frames → 3°/frame uniform
   // median delta = 3°, threshold = 3× = 9°, no delta exceeds 9°
   // Expected spike count = 0
   assert_eq!(spike_count, 0);
   ```
   A reviewer must be able to verify the comment **without running the metric**.

3. **No shared code path between fixture builder and metric.** If the fixture calls `my_rotation_helper()` and the metric also calls it, a bug in that helper poisons both in the same direction. Fixtures should use raw `glam::Quat::from_rotation_y()` style constructors only.

4. **Positive and negative pairs.** A spike detector test needs both "fixture has one spike → detector returns 1" and "fixture has no spike → detector returns 0". With only the positive case, a detector that returns constant would still pass.

5. **Independent derivation cross-check.** When possible, compute the expected value two different ways and compare. Example: for a path-length-ratio metric, hand-compute the path from the fixture's point list, and also compute it from the metric's formula applied to the same points. Disagreement means one is wrong.

### When fixtures and metrics drift together

The nightmare case: a refactor touches both in the same PR and they rot in matching directions. Defenses:

- **Visual cross-check (ultimate oracle).** Save the fixture as a real FBX, load it in the viewer, watch it. If "arm rotates 90° over 30 frames" does not look like 90° arm rotation on screen, the fixture is wrong. The human eye does not share bugs with the code. This is what the user unconsciously used when they said "0.x works good" earlier in the session.

- **Time-separated commits.** Rule: fixture edits and metric edits never land in the same commit. A reviewer looking at "metric change" must see a reason the existing fixture still passes; if both changed together, reviewer has nothing to check against.

- **External oracle.** Run the same fixture through a different tool (Blender retargeter, Maya quality scripts, ARP's own diagnostics). If your metric and the external tool agree, at least two independent implementations saw the same thing. This is expensive but the strongest defense.

### The irreducible layer

Eventually you must declare "this cannot be wrong":

- `glam::Quat` algebra (trust the math library)
- IEEE 754 float semantics (trust the hardware)
- The hand-written expected value in the comment (trust human arithmetic)
- "I saw the arm rotate on screen" (trust human eyes)

Today's three metric bugs landed precisely because **none** of these irreducible layers were ever touched. No fixtures, no hand-computed expected values, no visual cross-check. "Code compiles and produces numbers" was treated as "code is correct."

### Practical rules for this project going forward

1. **No new metric lands without:** a screen-sized fixture, a hand-computed expected value in a comment, a positive and a negative test case, and a visual spot-check in the viewer.
2. **Metric edits and fixture edits ship in separate commits.**
3. **Before trusting a metric to gate any decision** (A-grade, F-grade, curation), state its assumption in one sentence. If the assumption cannot be stated, the metric is not ready.
4. **Regression harness freezes current output but does not verify correctness.** Treat it as a drift detector, not a truth source. A passing harness after a metric edit means "nothing silently changed", not "the change is correct."

This philosophy lives in this devlog as a reference. If a future session proposes a metric change, it should either follow these rules or justify in writing why it is skipping them.

## Loose ends

- 8 local commits not pushed. User has not given push approval.
- No new feature shipped this session. Value is direction reset + debt reduction.
- Timeboxed A1.1 forensics landed in ~20 minutes, well under the 2h budget. Remaining budget saved for next session's fix.
