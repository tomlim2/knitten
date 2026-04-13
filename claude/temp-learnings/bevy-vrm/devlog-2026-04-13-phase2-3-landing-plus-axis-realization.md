# 2026-04-13 — Phase 2/3 landing + three-axis realization + next plan

Continuation of `devlog-2026-04-13-metric-assumption-mismatch.md`. That devlog ended with an execution plan (Phase 0 → Phase 6). This session executed Phase 0 through Phase 3, validated against real assets, and then the user reframed the entire rubric system as a three-axis separation problem — which exposed a structural flaw in my Phase 2/3 fixtures that Phase 2/3's green tests did not catch.

## Session frame

Before: "Phase 0 (fixtures) is the blocking prerequisite. Land that, then Phase 1 dead-state, then Phase 2 (A1.1 red→green)."

After: "Phase 0–3 landed. 13/13 fixtures green. 132/132 real-sweep pairings pass. **But** the Rubric C fixtures I wrote aren't Pure C — they test output-in-isolation, not retarget transformation quality. The whole Rubric A/B/C system needs per-axis purity as the test-design principle, and most of what I shipped today treats that principle as optional."

## Commits landed (7 total, local only, not pushed)

1. `9423f7e` test(metric_fixtures): 6 hand-written Phase 0 fixtures
2. `4674d7d` refactor(quality): delete hardcoded shoulder/arm/unmatched fields
3. `3d8a8d4` refactor(quality): delete has_180y_root telemetry field
4. `56108c6` test(metric_fixtures): add stretch_bones_only fixture
5. `c51cd61` fix(rubric_a): A1.1 hybrid threshold + max-rate + bone filter
6. `64d31e4` fix(rubric_c): C1.3 Stability uses shared hybrid-threshold detector
7. `b7b03bc` fix(rubric_a): A1.4 Smoothness per-bone jerk + velocity-scaled threshold

Net: +7 fixtures, 3 metric rewrites, 3 dead-state deletions. No push, no visible user-facing change.

## Phase 0 — fixture infrastructure (landed)

Built `crates/humanoid_retarget/tests/fixtures/mod.rs` with 26-bone ARP-ish skeleton and 7 hand-written synthetic animations:

1. `identity_30_frames` — static baseline
2. `arm_linear_sweep` — constant 3°/frame
3. `single_discontinuity` — one 30° jump at frame 10
4. `periodic_arm_swing` — 30° sinusoid
5. `mirrored_jumping_jack` — bilateral mirror
6. `fast_heel_strike` — 10°×(i mod 5) sawtooth on 6 leg bones (reproduces devlog's running-anim false-positive shape)
7. `stretch_bones_only` — same sawtooth on 4 ARP stretch helpers (added in Phase 2)

Design rules enforced: screen-sized builders, `glam::Quat::from_rotation_*` only, hand-computed expected values in comments, no shared code path with metrics, positive/negative pairs. Built a test runner `tests/metric_fixtures.rs` that ran rubric A against each fixture and — with stubbed VrmRestPose/RetargetResult/VrmSkeletonFrames — rubric C as well.

Phase 0 initial result: 9/13 green, 4 locked red (single_discontinuity A1.1, fast_heel_strike A1.1, fast_heel_strike C1.3, stretch_bones_only A1.1).

## Phase 1 — dead state cleanup (partial)

Two items deleted, two verified-live, one deferred:

1. ✅ `RetargetQuality.shoulder_ratio/arm_ratio/unmatched_bones` (hardcoded 1.0/1.0/0) — deleted.
2. ✅ `has_180y_root` telemetry field on Retargeter and RetargetQuality — deleted; init `[COORD]` log line kept with local variable.
3. ⏸ `quality/foot.rs` 506 LOC audit — deferred, needs dedicated session.
4. ✅ `VrmVersion::V0x/V1_0` enum — verified load-bearing. `arp_body.json` has real `vrm_version_overrides` dispatching thumb bones (`c_thumb1.l → leftThumbProximal`) on `config_key()`. Not log-only. Not deleting.
5. ✅ `validate-pipeline` vs `retarget-test` bins — verified distinct. `validate-pipeline` (31 LOC) is a single-model pass/fail gate. `retarget-test` (185 LOC) is multi-model × multi-FBX bulk scorer with `--save`/`--baseline`. Different purposes.

Net cleanup: −35 / +6 lines, every test count preserved at every commit.

## Phase 2 — A1.1 red→green (landed)

Rewrote `metric_gimbal_spike` → `metric_angular_velocity_outliers`. Three orthogonal fixes:

1. **Hybrid threshold replaces `3 × median`**: `if median < 2° { 15° } else { 4.5 × median }`. Two modes because the two bug classes have opposite distributions — isolated discontinuity in near-static data (median=0 → old threshold=0 → silent zero) vs periodic active motion with in-band peaks at 4× median (old 3×median flagged legitimate 40° peaks).
2. **Bone filter**: skip `*_stretch.*`, `c_*`, `*_twist.*` — ARP rig helpers the retargeter doesn't consume.
3. **Max per-bone rate grading**: not averaged. A single bone with one spike in 29 frames produces rate 3.45; averaged over 21 static bones that becomes 0.16 → false Grade A. Max-rate is the only way fixture 3 actually turns green.

New grade boundaries: `max_rate == 0 → A, <5 → B, <15 → C, else → F`. Renamed metric because "gimbal spike" was never correct — the detector measures angular velocity outliers, not gimbal lock.

All 3 A1.1 reds (fixtures 3, 6, 7) flipped green.

## Phase 3 — pattern inheritance (landed)

Shared helpers factored to `pub(super)` in `rubric_a.rs`:
- `STATIC_MEDIAN_FLOOR_DEG`, `STATIC_SPIKE_THRESHOLD_DEG`, `ACTIVE_MULTIPLIER`
- `is_non_deformation_bone`, `quat_angle_between`, `spike_rate_from_deltas`

### C1.3 Stability fix

C1.3 had the same `3 × median` shape as old A1.1. Rewrote to:
- Use shared `spike_rate_from_deltas` with degree-per-frame units
- Apply shared bone filter (harmless on VRM side — no stretch bones there, but keeps metrics behaviourally symmetric)
- Grade on max per-bone rate, same A/B/C/F boundaries as A1.1

rubric_c_fast_heel_strike flipped green (was F).

### A1.4 Smoothness fix

A1.4 had three failure modes: global p99 dilutes single-bone outliers (missed fixture 3's 2 jerk spikes), fixed thresholds flagged fast legitimate motion (fast_heel_strike hit F), no bone filter (stretch bone pollution).

The A1.1/C1.3 hybrid-delta detector does not transplant — jerk distributions are zero-heavy even for active motion, so `median_jerk` collapses into the "static" branch. Used **median velocity** as the static/active indicator instead:

- `median_vel < 50°/s` → static absolute threshold 15 000 deg/s³
- `median_vel ≥ 50°/s` → threshold = `median_vel × FPS × 4.5` (jerk budget scales with typical per-frame velocity)

Grade on max per-bone spike rate, same boundaries. Fixture single_discontinuity now grades C (2 spikes on arm.l), fast_heel_strike and stretch_bones_only grade A.

## Final fixture state

All 13 metric_fixtures tests green. All other test suites unchanged at every step (13/13 integration + 3/3 + 5/5).

|                         | A1.1 | A1.2 | A1.3 | A1.4 | C1.1 | C1.2 | C1.3 |
|-------------------------|------|------|------|------|------|------|------|
| identity                |  A   |  A   |  A   |  A   |  A   |  A   |  A   |
| arm_linear_sweep        |  A   |  A   |  A   |  A   |  A   |  A   |  A   |
| single_discontinuity    |  B   |  A   |  A   |  C   |  A   |  A   |  B   |
| periodic_arm_swing      |  A   |  A   |  A   |  A   |  A   |  A   |  A   |
| mirrored_jumping_jack   |  A   |  A   |  A   |  A   |  A   |  A   |  A   |
| fast_heel_strike        |  A   |  A   |  A   |  A   |  A   |  A   |  A   |
| stretch_bones_only      |  A   |  A   |  A   |  A   | (n/a) | (n/a) | (n/a) |

## Real-asset validation (132 pairings)

Ran `retarget-test` against 12 production VRMs × 11 production FBXs + arp_body.json. **132/132 pipelines pass** (zero NaN, zero hard fail on retarget pipeline itself).

Focused comparison against devlog baseline on running anim × vroid 1.x:

| Pairing | Devlog baseline | Post-phase-3 |
|---|---|---|
| vroid_1x_m_c_normal × 21566 | C1.1=A C1.2=C C1.3=B C1.4=B → B | C1.1=A C1.2=C C1.3=A C1.4=B → **B** |
| vroid_1x_f_xiao × 21566 | → B | C1.1=A C1.2=C C1.3=A C1.4=A → **B** |
| vroid_1x_f_m_small × 21566 | → B | C1.1=A C1.2=C C1.3=A C1.4=B → **B** |

Overall grade preserved at the devlog's "real ceiling" (B). C1.3 moved B→A on multiple pairings — false positives on legitimate running motion are gone. Rubric A on the running FBX itself: `A1.1=B A1.2=C A1.3=B A1.4=A → Overall B`. A1.4 on the real running anim is now A (was going to be F pre-Phase 3). Phase 2/3 fixes validated against real data.

Full sweep saved at `claude/temp-learnings/bevy-vrm/retarget-test-2026-04-13-post-phase3.txt`.

## Findings from the sweep (not acted on, surfaced for next sessions)

1. **A1.2 BoneSymmetry = C on 10/11 FBX files.** Universal pattern. A1.2 reads bind_world L/R pairs, not animation. Every ARP rig grades C. Likely the ARP bind pose has legitimate axis asymmetry (sign difference on a rotation axis?) that A1.2 doesn't normalize. Universally penalizing every ARP input by ~20 points on the A rubric.
2. **B1.2 Proportion = F on all 12 VRMs.** Rubric B universal-failure pattern — every model scores the worst grade on the proportion metric. Either every real VRM truly has bad proportions (unlikely given vroid models are standard humanoids) or B1.2 is broken. Metric bug suspected.
3. **C1.2 GroundContact = F on ~half of 132 pairings.** Matches Phase 4 in the original devlog — `min Y` as ground proxy is structurally broken. Needs `foot_sole_offset`.
4. **C1.4 Fidelity = F frequently** — path-length ratio outside [0.65, 1.35]. Legit scale mismatch between FBX skeleton and VRM skeleton. Fidelity as a metric is working, result dominated by proportion mismatches.
5. `FC_00078` facial-only FBX hard-fails `output_has_bones` on every VRM pairing. Retarget pipeline correctly rejects body-retargeting a facial-only animation, but retarget-test runs Rubric C without gating on Rubric A's `bind_pose` facial-FBX exemption upstream.

## The three-axis realization

Mid-session reframe from the user: **Rubric A / B / C are not two axes, they're three, and they measure three independent variables**:

- **Rubric A** = property of the FBX input alone. `evaluate(animation)`. Retargeter or VRM do not exist. Independent variable = **animation data**.
- **Rubric B** = property of the VRM model alone. `evaluate(model)`. Animation does not exist. Independent variable = **model data**. Bone completeness, proportions, T-pose validity, sole offset — all static properties of the .vrm file.
- **Rubric C** = property of the `(FBX, VRM) → output` transformation. `evaluate(input, model, output)`. Independent variable = **the retargeter algorithm**. The question Rubric C answers: "given clean input and valid model, did the retargeter do its one job?"

**Decisive case**: retarget output is bad. Who is at fault? Three candidates. Rubric C that doesn't control for A and B is guessing.

Concrete examples from this sweep:
- `vrm_0x_m_moth × 21566 running → F`. Rubric B on moth: `B1.1_Completeness=F`. **Model** is missing bones. Retargeter innocent.
- `vroid_1x_m_c_normal × 21566 → B`. Rubric A on running: B. Rubric B on vroid: B. Rubric C: B. Three axes aligned → retargeter at its ceiling given the inputs. Not a retargeter bug.
- `CoolBanana × 17857 → F` with C1.4 Fidelity=F. Rubric B on CoolBanana: C. **Model proportions bad**. Retargeter faithfully scaling between mismatched skeletons.

## The Pure-per-axis fixture principle

What I should have done in Phase 0, realized only now:

Each fixture holds **two axes at canonical clean** and moves **exactly one axis**. Then:
- All metrics on the canonical-canonical-canonical case must grade A. Any non-A is a metric bug. This is the fastest universal-failure detector — if B1.2 fails on a canonical VRM, the metric is broken, locked-in in 20 minutes.
- Degrading exactly one axis must cause exactly the corresponding metric to drop. Cross-axis contamination is an attribution bug.

**My Phase 0–3 fixtures satisfy this for Rubric A only.** A fixtures are pure because they construct `FbxData` and call `rubric_a::evaluate(&fbx)` — no model, no retargeter.

**My Rubric C fixtures are NOT Pure C.** I built `VrmSkeletonFrames/RetargetResult/VrmRestPose` stubs by copying FBX track rotations 1:1 onto VRM bone names. That is an **identity retargeter on a stub model**, and the C rubric metrics grade the result the same way they'd grade the input — so my C tests are measuring output-in-isolation, which is the same information Rubric A already carries. They do not validate "did the retargeter's transformation preserve quality." The fixtures are green because A-style bugs are fixed; they would stay green under any retargeter that faithfully transmitted rotations, including a broken one that collapses axis orientation.

**Real Rubric C metric should measure input→output residual**, not output in isolation. Only `C1.4 Fidelity` currently does this (path length ratio). `C1.3 Stability` reads only output and is structurally the same shape as A1.1 — it answers "does the animation have pops?" not "did the retargeter introduce pops?"

This realization does NOT invalidate the Phase 2/3 detector fixes — the detectors themselves are improved regardless of which axis they belong to. But it means the Phase 2/3 **tests** do not prove what I thought they proved. Rubric C is still unverified as a retargeter quality metric.

## Decision-start consult for next session

Ran `/dev-decision-start` with the question "what's the smallest 3-hour entry point for next session?" Five candidates:
- (a) Pure B fixture (canonical_vrm_rest) to reproduce B1.2 universal-F
- (b) Identity retargeter fixture to lock the Rubric C output-in-isolation contradiction
- (c) Phase 4 (C1.2 GroundContact)
- (d) A1.2 BoneSymmetry universal-C fix (10-min patch)
- (e) Rubric snapshot freeze as Phase 5 light

Codex (implementer) picked **(b)**. Core argument: the Rubric C structural flaw compounds with every session that ignores it. Every C fixture added under the current (broken) design is technical debt. An `IdentityRetargeter` stub + `assert fidelity_residual == 0` + `#[ignore]` marker on a C1.3 contradiction test is the cheapest proof that C1.3 is mis-specified. Explicitly warned against pinning threshold numbers; the goal is shape proof, not calibration. Accepted risk: B/A universal-failure bugs stay unfixed another session.

Opus (critic) picked **(d)+(a)**: free 10-min A1.2 fix as warm-up to clear sweep noise, then canonical_vrm_rest B fixture to prove the fixture→reproduce→fix→sweep-confirm loop on the simpler axis (B is static state, no retargeter stub complexity). Explicitly warned against (b) unless I already know the residual formula. Key risk flagged: authoring a canonical VRM fixture could eat 2h if I try to make a real .vrm file instead of a Rust struct literal.

Gemini: auth error, no response.

Divergence resolved in favor of (b), rationale:
1. Opus's own dissent section endorses (b) *if* the residual formula is already known — it is. `C1.4 Fidelity` path_length_ratio is the template.
2. Structural C-axis flaw compounds. B1.2 is a local bug that can wait.
3. User constraint "단순하게 단순하게" favors Codex's 5-line `impl Retargeter { input.clone() }` + one assertion over Opus's "bisect B1.2 threshold" path which explicitly needs calibration work.
4. A1.2 warm-up (from Opus step 1) is essentially free and clears confounder. Fold it into the front of the plan as a sanity check but not the main deliverable.

## Next session plan (locked)

1. **A1.2 BoneSymmetry fix (10 min)** — warm-up. Investigate why the metric grades C on every ARP rig, fix it, re-run 132 sweep, confirm distribution becomes non-universal. If it's not a 10-min fix, abandon and move on — it was free-or-drop.
2. **Rubric C definition in devlog** — one sentence: *"Rubric C measures input→output residual only. Output-in-isolation is forbidden."* Locks the rule before code.
3. **`IdentityRetargeter` stub** — trivial `impl` returning `input.clone()`. Reuse existing fixture harness.
4. **Two tests**:
   - `c14_identity_passthrough_zero_residual` — positive control, must pass (proves C1.4 Fidelity is a correctly-shaped C metric).
   - `c13_identity_passthrough_should_not_fail` — marked `#[ignore = "golden contradiction: C1.3 is output-in-isolation, not residual. Fix in C1.3 residual-based redesign."]`. Locks the evidence that C1.3 is mis-specified.
5. **Devlog paragraph** — name C1.3 as structurally wrong and blocking Phase 4/5 until redesign.
6. **Bonus (time permitting, ≤30 min)**: Canonical VRM B fixture as Rust struct literal. Skip if field discovery takes >20 min.

Gotchas from the consult:
- Verify the "identity" retargeter is actually identity. Coordinate conversion, root-motion removal, hip-height normalization, resample — any one of them sneaking in breaks the passthrough invariant.
- Do not pin numeric thresholds this session.
- Do not author a real .vrm file if step 6 is attempted.

Hard stop before Phase 4. Phase 4 is a separate session.

## Loose ends

- 9 local commits not pushed. User has not given push approval.
- User invoked `/dev-decision-start` explicitly to force simplicity. Any scope creep tomorrow betrays that framing.
- Pop_scan re-run post-Phase-2 is worth doing — the ARP stretch filter should collapse a large fraction of the 5005 pops the original devlog counted. Not done this session.

---

## Post-plan session execution (same day, after `/dev-decision-start`)

The locked plan above actually ran. Two commits landed beyond the decision-start output:

- **`f6a1431` fix(rubric_a): A1.2 BoneSymmetry uses position mirror, not quat angle**
  - Root cause: old metric compared `Quat::from_mat4(lm)` vs `Quat::from_mat4(rm)` via angular distance. Category error — quaternions can't represent reflections. Bilaterally-symmetric bones have opposite rotation axes (left arm +X, right arm −X), so quat angular distance between them is ~180° by construction, not ~0°. The metric was grading every real ARP rig C because its formula returned its maximum value when the mirror was perfect.
  - Fix: extract bind_world translations, mirror left by negating X, compare to right. Delta in mm. Boundaries <1mm A, <5mm B, <20mm C, else F.
  - Real sweep validation: A1.2 flipped from 10/11 C to 11/11 A. Multiple Overall grades improved B→A downstream.
  - Fixture impact: zero (all fixtures use identity bind matrices, so mirror delta = 0 before and after). This bug was only visible on real assets, confirming Pure-B fixtures would have caught it.

- **`7480f52` test(metric_fixtures): lock Rubric C identity-passthrough contradiction**
  - `src/quality/rubric_c.rs` doc block now explicitly states the axis rule: *"Rubric C measures input→output residual only. Output-in-isolation is forbidden."*
  - New `#[ignore]`-marked test `rubric_c_identity_passthrough_c13_should_not_flag_input_spikes` feeds `single_discontinuity` (known Rubric A non-A input) through the existing identity-transform C runner. Asserts C1.3 == A (retargeter introduced zero new deltas, so any C metric grading < A is reading the wrong variable).
  - `cargo test` default: 13 passed, 1 ignored with full explanatory message.
  - `cargo test -- --ignored` surfaces: `C1.3_Stability = B — max=3.45/100f (leftUpperArm)` — the golden contradiction as executable evidence.
  - This replaces "prose debt" with "code debt." The next metric session's acceptance criterion is clear: unignore the test, make it green via residual-based redesign.

**Session total now 9 commits, all local:** 9423f7e, 4674d7d, 3d8a8d4, 56108c6, c51cd61, 64d31e4, b7b03bc, f6a1431, 7480f52.

---

## Three-axis pipeline ordering rule (user-provided, late session)

User explicitly added two more rules after seeing the sweep and the contradiction lock. The three-axis separation isn't just "three independent variables" — it's also **pipeline ordering** and **code ownership**:

| # | Data owner (code location) | Rubric | Evaluation target |
|---|---|---|---|
| 1 | model loader (VRM parsing/load) | B | Model static properties |
| 2 | `resource_anim` / FBX loader | A | Animation static properties |
| 3 | retargeter | C | (1) and (2) connection quality |

**Sequencing**: (1) and (2) must be checked first. Only if both pass (or at minimum, only if neither is hard-failed) does (3) run. Validator binaries must apply the same gating.

**Practical consequence** on today's work: my `retarget-test` sweep reports `vrm_0x_m_moth × 21566 → F` as if the retargeter failed, but moth's Rubric B is already F (`B1.1_Completeness=F`). The correct reporting is `Model: F (blocks retarget eval)` — don't even compute C. Same for `FC_00078_F_SuddenFlutter` facial-only FBX vs body VRMs.

Saved as memory: `feedback_rubric_pipeline_ordering.md`. Paired with `feedback_rubric_a_vs_c.md` which now also covers Rubric B.

User then asked: *"If this doesn't fit the current code, is full redesign worth considering?"* Answer: yes, conditionally. Tiered redesign proposed:
- **Tier 1** — Contract redesign (1 session, zero crate moves). Change `rubric_c::evaluate` signature to require A/B results as inputs. Change runners to gate C on A+B. Redesign C1.3 as residual-based so the locked `#[ignore]` test turns green. All within `humanoid_retarget`.
- **Tier 2** — Crate-boundary moves (2-3 sessions, tier 1 first). `rubric_a` → FBX loader crate, `rubric_b` → VRM loader crate, `rubric_c` stays in retargeter. Shared types via a new `quality_types` module.
- **Tier 3** — Full rubric redesign (multi-session, needs `/dev-decision-start`). Possibly replace `Grade::A/B/C/F` with `Diagnostic {severity, code, ...}` model, touch `VrmRestPose/RetargetResult/VrmSkeletonFrames` contracts, etc.

---

## Reframe: shotloom as porting target, not porting destination

User corrected my interpretation: *"아니 저기에 넣을 용도이기에 대충 vrm bevy에서 맞춰보자는거임"* — **bevy-vrm stays the R&D workbench, but design decisions now target shotloom's conventions so that eventual port is a mechanical operation, not a redesign.**

### Shotloom structure survey (done this session)

Shotloom repo: `/Users/deemooooooooo/Desktop/www/shotloom-github`. Cargo workspace with 13 member crates + apps/desktop + apps/editor (React).

Relevant crates for porting:

| Shotloom crate | Size | Current state | Rubric axis match |
|---|---|---|---|
| `shotloom-gltf` | 3114 LOC | **Already has VRM 1.0 humanoid bone validation.** Hard-gates 15 required bones, emits diagnostics. Uses `VrmDiagnostic` + `shotloom_common::diagnostic::Diagnostic`. | **Rubric B owner, already half-implemented.** Extend here, don't create new crate. |
| `shotloom-t2m` | 1 LOC stub | Text-to-motion API client. ADR-0014 mandates trait-based `live`/`fixture` provider pattern. | **Rubric A owner candidate.** Implementation pending. |
| `shotloom-engine::vrm` | 38 LOC | Thin wrapper over `bevy_vrm1` — just `spawn_vrm(commands, asset_server, path)`. No retargeting. | Too small to host Rubric C. Needs new crate. |
| `shotloom-retarget` | — | **Does not exist.** | **Rubric C owner, needs creation.** |
| `shotloom-import` | 366 LOC | Pass 5-7 orchestration. Already consumes `Vec<Diagnostic>` from normalization. Native-only (no bevy dep). | **Gating orchestrator.** A+B+C sequencing lives here. |

### Shotloom design constraints that must shape bevy-vrm work

1. **Diagnostic-based reporting, not letter grades.** `shotloom_common::diagnostic::Diagnostic {severity: Error/Warning/Info, code, message, location, suggestion, recoverable}`. ADR-0021 formalized it. **Do not introduce new `Grade` semantics in shotloom-side code.** Bevy-vrm's `Grade::A/B/C/F` must be translatable to severity via a simple mechanical mapping: A→nothing emitted, B→Info, C→Warning, F→Error.

2. **`Retargeter` trait with provider-style adapters (ADR-0014 pattern).** T2M and TTS both ship `Live` + `Fixture` adapters behind a trait. The retargeter should follow the same shape: `Retargeter` trait with `ArpHumanoidRetargeter` (live ARP-based) and `IdentityRetargeter` (fixture/test) impls. The identity retargeter I built as test stub is already trait-impl-shaped — formalize it.

3. **Rubric C = residual function.** `shotloom-import::import_and_validate` needs a function that takes (input clip, retargeter output) and emits diagnostics about how well the transformation preserved the intent. Not "does the output have pops." Bevy-vrm's C1.3 needs to match this shape before port.

4. **Ownership ties data to validation.** `shotloom-gltf` owns VRM loading AND VRM quality. `shotloom-t2m` owns motion loading AND motion quality. Bevy-vrm currently has everything in `humanoid_retarget::quality::`, which is fine for R&D but the APIs must be separable along those seams. Specifically: `rubric_a::evaluate(&fbx)` must be self-contained (no retargeter or VRM dependencies), `rubric_b::evaluate(&vrm_rest)` must be self-contained, `rubric_c` must take both outputs + retargeter output as inputs.

5. **`shotloom-common::quality_detector` target module.** Pure detector helpers (`spike_rate_from_deltas`, `is_non_deformation_bone`, the four constants) belong in a common module because multiple rubric crates will consume them. Bevy-vrm should place these in `humanoid_retarget::quality::detector` as `pub(crate)` free functions. On port, copy the whole file to `shotloom-common::quality_detector`.

### Bevy-vrm stays in bevy-vrm

Things NOT to do in the coming sessions:
- Do not create new crates in bevy-vrm matching shotloom layout. `humanoid_retarget` stays one crate.
- Do not introduce `Diagnostic` type in bevy-vrm. `Grade` stays. Just structure the data so translation is mechanical.
- Do not move bevy-vrm R&D binaries (`retarget-test`, `pop-scan`, `validate-pipeline`). They're research tools; shotloom will use `shotloom-import` orchestration instead.
- Do not rename `struct Retargeter` → `struct ArpHumanoidRetargeter` crate-wide unless a type alias preserves the old name. Call-site churn is a distraction.

### Updated next-session plan (supersedes the pre-reframe plan above)

Target: "bevy-vrm Tier 1 contract redesign, shaped for shotloom port."

1. **`Retargeter` trait definition** (30 min)
   ```rust
   pub trait Retargeter {
       fn retarget(
           &self,
           input: &FbxData,
           vrm_rest: &VrmRestPose,
       ) -> Result<RetargetResult, RetargetError>;
   }
   ```
   Current `struct Retargeter` → `struct ArpRetargeter`, add trait impl. Preserve old name via `pub type Retargeter = ArpRetargeter;` so all call sites keep working.

2. **`IdentityRetargeter` struct + trait impl** (30 min)  
   Promote the existing `build_c_inputs` test helper logic into an independent `IdentityRetargeter` struct with a real `impl Retargeter`. Tests consume it through the trait, not through an ad-hoc helper. Shotloom port will copy this struct verbatim into `shotloom-retarget`.

3. **`humanoid_retarget::quality::detector` module promotion** (20 min)  
   Move `STATIC_MEDIAN_FLOOR_DEG`, `STATIC_SPIKE_THRESHOLD_DEG`, `ACTIVE_MULTIPLIER`, `is_non_deformation_bone`, `quat_angle_between`, `spike_rate_from_deltas` out of `rubric_a.rs` into a new `quality/detector.rs` as `pub(crate)` free functions. Both `rubric_a` and `rubric_c` import from this. On port, `detector.rs` becomes `shotloom-common::quality_detector` with a one-file copy.

4. **`tests/metric_fixtures.rs` gating** (20 min)  
   `run_c` helper now:
   ```
   let a = rubric_a::evaluate(&fbx);
   if a.has_hard_fail() {
       return RubricResult::skipped("upstream rubric_a hard-failed");
   }
   // rubric_b stubbed for now — pass
   let c = rubric_c::evaluate(&fbx, &retargeter_output, &vrm_rest);
   ```
   This mirrors the shotloom-import orchestration pattern. Shotloom port replaces the stub with real Rubric B.

5. **C1.3 residual redesign** (1.5h)  
   New signature: `fn metric_temporal_stability_residual(input_deltas, output_deltas) -> MetricResult`. Subtract input deltas from output deltas at matching frames, apply the shared `spike_rate_from_deltas` on the residual, grade the max per-bone rate. Completion criterion: the locked `#[ignore]` contradiction test under `cargo test -- --ignored` now passes, and its `#[ignore]` attribute is removed.

**Total estimate: 3 hours.** Same scope as the previous Tier 1 plan but with shotloom-compat shaping throughout.

### What the shotloom port looks like after all bevy-vrm tiers land (reference, not action)

Rough file-level mapping for the eventual port:

```
bevy-vrm/crates/humanoid_retarget/src/            →  shotloom-github/crates/...
├── retargeter.rs                                 →  shotloom-retarget/src/arp.rs
├── types.rs                                      →  shotloom-retarget/src/types.rs (partial) +
│                                                    shotloom-common/src/retarget_types.rs (shared)
├── mapping.rs, topo.rs, vrm_rest.rs              →  shotloom-retarget/src/*.rs (1:1)
├── finger_*.rs                                   →  shotloom-retarget/src/finger/*.rs (1:1)
├── quality/detector.rs                           →  shotloom-common/src/quality_detector.rs (1:1)
├── quality/rubric_a.rs                           →  shotloom-t2m/src/quality.rs
│                                                    (Grade→Diagnostic translation)
├── quality/rubric_b.rs                           →  shotloom-gltf/src/quality.rs
│                                                    (augment existing validate_humanoid_bones)
├── quality/rubric_c.rs                           →  shotloom-retarget/src/quality.rs
│                                                    (residual-based)
├── quality/fk_evaluate.rs                        →  shotloom-retarget/src/fk.rs
├── quality/foot.rs                               →  (defer — still unaudited)
├── quality/mod.rs                                →  (delete — split across owners)
└── tests/fixtures/, tests/metric_fixtures.rs     →  shotloom-retarget/tests/ +
                                                    shotloom-t2m/tests/ +
                                                    shotloom-gltf/tests/
```

The bin targets in `humanoid_retarget/src/bin/` do not port — shotloom's `shotloom-import::import_and_validate` orchestrates the pipeline natively.

Port sequencing when bevy-vrm is ready:
1. `shotloom-common::quality_detector` first (pure helpers, no deps)
2. `shotloom-retarget` crate scaffold + `Retargeter` trait + `IdentityRetargeter` impl
3. `ArpRetargeter` impl (the real retargeter)
4. Rubric C residual eval (depends on retargeter types)
5. Rubric A in `shotloom-t2m` (parallelizable with 4)
6. Rubric B augment in `shotloom-gltf` (parallelizable)
7. Gating in `shotloom-import::import_and_validate`
8. Delete bevy-vrm `humanoid_retarget` or mark as archived

None of this happens this month. It's reference material for the eventual ADR in shotloom.

---

## Commit log at end of 2026-04-13 session

```
7480f52 test(metric_fixtures): lock Rubric C identity-passthrough contradiction
f6a1431 fix(rubric_a): A1.2 BoneSymmetry uses position mirror, not quat angle
b7b03bc fix(rubric_a): A1.4 Smoothness per-bone jerk + velocity-scaled threshold
64d31e4 fix(rubric_c): C1.3 Stability uses shared hybrid-threshold detector
c51cd61 fix(rubric_a): A1.1 hybrid threshold + max-rate + bone filter
56108c6 test(metric_fixtures): add stretch_bones_only fixture for A1.1 filter
3d8a8d4 refactor(quality): delete has_180y_root telemetry field
4674d7d refactor(quality): delete hardcoded shoulder/arm/unmatched fields
9423f7e test(metric_fixtures): add 6 hand-written Phase 0 fixtures
```

All local, all green (13 metric_fixtures + 13 integration + 3 + 5 all pass, 1 ignored golden contradiction). Zero pushes. Zero production-retarget regressions.
