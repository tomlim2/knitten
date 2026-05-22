---
status: superseded
created: 2026-05-22
updated: 2026-05-22
load: triggered
trigger: STL-519
repo: shotloom
linear: STL-519
spec: ../../plans/proposed/motion-debug-run-root-hips-preview.md
superseded_by: debug-run-vrm-normalization-mismatch.md
---

> Superseded on 2026-05-22 by
> `debug-run-vrm-normalization-mismatch.md`. This briefing captured the first
> root/hips XZ placement hypothesis. The confirmed STL-519 cause is the
> Debug Character seed path caching raw embedded VRM bytes while retarget data
> is built from normalized VRM bytes.

### Shotloom coding mode - rust

**Issue:** STL-519 "fix(motion): Debug Run preview root/hips split sends character off stage"
  Problem: built-in Debug Run reaches motion preview, but the retargeted hips X/Z curve is transferred to the character root and visibly sends the actor away from authored placement around frame 34.
  Acceptance:
  - Debug Run preview keeps the character grounded/plausibly within the intended validation area.
  - Preview root motion does not silently throw the default debug character off-stage.
  - Regression coverage pins the chosen `apply_motion_preview` policy for large hips X/Z locomotion.
  - If the default Debug Run clip is the wrong smoke-test asset, capture that as an explicit follow-up rather than hiding it in a code workaround.
  Affected: `crates/shotloom-engine/src/motion.rs`, `crates/shotloom-engine/src/app.rs`, `crates/shotloom-retarget/tests/body_retarget_regression.rs`
  Linked: ADR-0039, ADR-0018, ADR-0021

**Branch:** `fix/motion-debug-run-root-hips-preview` (base: `origin/main` at `4716c512`) 0 commits ahead, clean

**Standards loaded:** AGENTS.md, CONTRIBUTING.md, docs/guidelines/error-handling.md, docs/guidelines/review-rust.md, docs/guidelines/commit-guideline.md, docs/guidelines/pr-guideline.md
**ADRs to honor:** ADR-0039 "VRM Root Motion from Hips Translation" (Proposed), ADR-0018 runtime telemetry/error boundaries, ADR-0021 diagnostics are observations
**Ask-first triggers for this task:** bridge contract changes, core model/validation changes, new dependencies, Bevy ECS ordering/plugin-registration changes, replacing built-in assets, accepting or amending ADR-0039, changing retargeter output semantics rather than preview application policy
**Intent lens:** Prevent the default editor validation flow from producing an obviously broken character preview while preserving scrub determinism and not accidentally undoing the root-motion model ADR-0039 deliberately introduced.

**AC primitive cross-check:**
- Expected grounded/plausible preview: wrong-shape if interpreted as "always suppress root X/Z". ADR-0039 and `apply_motion_preview_splits_hips_translation_into_root_xz_and_hips_y` codify hips X/Z transfer to the character root, so the spec must first decide the preview policy: root-motion-enabled default, preview-clamped default, explicit per-clip mode, or debug-asset replacement.
- Root should not silently go off-stage for default Debug Run: codified symptom, policy missing. `crates/shotloom-engine/src/motion.rs` computes `delta_xz = frame - rest` and applies it as an absolute placement-relative root offset; diagnostic numbers show frame 34 about `(+0.523, 0, +1.456)` and frame 90 about `(-0.597, 0, +5.918)`.
- Regression around `apply_motion_preview`: codified primitive exists. `crates/shotloom-engine/src/motion.rs` already has unit tests for root/hips split and reset when the next clip has no hips translation; add or update tests to pin the chosen large-locomotion preview behavior.
- Replace Debug Run default validation clip: verification-example / follow-up candidate. `crates/shotloom-engine/src/app.rs` seeds `21566_M_AiFigureEightRun_250108.fbx` as "Debug Run"; changing the asset is a product/debug smoke-test decision, not required unless the spec chooses asset replacement over application-policy change.

**Spec-risk handoff for `/shotloom-draft-spec`:**
- P1 Requirements: Decide the root-motion policy for editor preview before editing code. Evidence: ADR-0039 and `motion.rs` lines around the root X/Z split. AC-trace: STL-519 expected behavior conflicts with the current codified root-motion behavior for the default validation clip.
- P1 Locked Decisions: If root X/Z is suppressed, clamped, normalized, or made explicit for preview, state whether ADR-0039 remains the future export/runtime model or must be amended. Evidence: ADR-0039 says clips with `RetargetedBone.translations = Some` apply root motion; the Debug Run clip is named there as the motivating example. AC-trace: suggested scope asks to decide suppress/clamp/normalize versus explicit camera/placement-aware root motion.
- P1 Verification: Add a failing large-locomotion test at the `apply_motion_preview` layer, not only a retargeter diagnostic test. Evidence: temporary diagnostic showed large hips translations are valid retarget output; the visible bug appears when applying those values to the root. AC-trace: suggested scope calls for regression coverage around `apply_motion_preview`.
- P2 Non-Goals: Do not change `shotloom-retarget` hips output semantics unless new evidence proves retarget output is wrong. Evidence: `retargeted_hips_carries_rest_translation_when_translations_are_present` intentionally uses the same figure-eight locomotion clip to prove hips translations exist. AC-trace: issue says retarget/evaluator path is active and likely failure point is preview application.
- P2 Implementation Spec: Preserve scrub determinism and reset behavior across clips. Evidence: ADR-0039 rejects frame-to-frame accumulation; existing tests pin reset when the next clip has no hips translation. AC-trace: expected behavior is preview stability, not accumulated gameplay motion.
- P2 Traps: Bevy `Entity despawned` warnings were observed during browser probing; keep them as a follow-up note unless implementation touches entity lifetime or recreation. Evidence: browser probe logs. AC-trace: issue notes they may be unrelated.
- P3 Testing: Include a browser/editor manual repro after unit tests: spawn Debug Character or Xiao, apply Debug Run, create a performance clip, scrub around frame 34, and confirm the actor remains visually plausible relative to the gizmo ring. Evidence: user screenshot and local repro. AC-trace: issue repro steps.

**Sibling specs (Knitten docs):**
- `retarget-vrm0x-backward-thumb-support.md` - HEAD - stance: uses the same figure-eight run asset as a thumb-active retarget proof; agrees that the clip carries meaningful motion, but it is retarget verification, not editor preview policy.
- `retarget-vrm0x-backward-thumb-support.md` briefing - HEAD - stance: keeps retarget math/test boundaries explicit; agrees that runtime/editor fixes should not reopen data-layer retarget decisions without evidence.
- `editor-add-debug-sidebar-nav.md` - completed - stance: debug route/sidebar layout only; no runtime motion policy overlap.
- `editor-front-navigation-cleanup.md` - working-tree in primary Knitten checkout - stance: debug/dev navigation naming; no runtime motion overlap, but reinforces that this task should not rename debug concepts.
- Direct sibling for Debug Run root/hips preview policy: none found.

**Pre-write checklist passed:**
- [x] gh auth: tomlim2 active; stale `deemotl` auth warning observed
- [x] Shotloom repo commit identity: tomlim2 <deemo@vonvon.me>
- [x] conventions re-read: AGENTS, CONTRIBUTING, ADR index
- [x] category: rust
- [x] targeted sections loaded
- [x] AC primitive cross-check recorded
- [x] spec-risk handoff seeded
- [x] sibling-spec scan run (Knitten docs/plans/ + docs/briefings/shotloom/, full body read for relevant matches)

Ready. If this briefing is OK, next step is `/shotloom-draft-spec`.
