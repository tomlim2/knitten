---
status: ready
created: 2026-05-22
updated: 2026-05-22
load: triggered
trigger: STL-519
repo: shotloom
linear: STL-519
spec: ../../plans/proposed/debug-run-vrm-normalization-mismatch.md
supersedes: motion-debug-run-root-hips-preview.md
---

### Shotloom coding mode - rust

**Issue:** STL-519 "fix(engine): Debug Run preview가 raw debug VRM 계층에 적용되는 문제 수정"

Problem: the Debug Character + built-in Debug Run happy path reaches the engine
preview, but the final Bevy-loaded VRM hierarchy can show feet above hips and
visibly broken limbs. The root/hips XZ preview policy was the first suspect, but
the engine diagnostic showed a sharper source: debug seed bytes and imported
character bytes do not use the same normalized VRM basis.

Acceptance:
- Debug Character seed path stores normalized VRM bytes in `BundledVrmAssets`.
- Imported character path and Debug Character seed path use the same normalized
  VRM basis before retarget output is applied.
- The Debug Run happy path is covered by a failing-before/passing-after engine
  regression that actually loads the VRM hierarchy and scrubs motion.
- Synthetic retarget/FK tests continue proving the Debug Run retarget output
  keeps feet below hips.
- The old root/hips placement concern remains a separate preview-policy topic,
  not the fix for this issue.

Affected:
- `crates/shotloom-engine/src/app.rs`
- `crates/shotloom-engine/src/motion.rs`
- `crates/shotloom-engine/tests/vrm_spawn_integration.rs`
- `docs/tech-debt/debug-run-vrm-normalization-mismatch.md`

Linked:
- `shotloom_gltf::normalize_vrm`
- `BundledVrmAssets`
- `shotloom_retarget::build_from_bytes`
- superseded briefing `motion-debug-run-root-hips-preview.md`

**Branch:** `fix/debug-run-normalized-vrm-seed` (candidate based on diagnostic
commit `3c4030d8`)

**Standards loaded:** AGENTS.md, CONTRIBUTING.md,
docs/guidelines/error-handling.md, docs/guidelines/review-rust.md,
docs/guidelines/spec-procedure-guideline.md,
docs/guidelines/documentation-standard.md, docs/guidelines/pr-guideline.md

**Ask-first triggers for this task:** bridge contract changes, core model or
validation changes, retargeter output semantics, Bevy plugin ordering, replacing
the embedded debug VRM/FBX assets, adding dependencies, or widening this into
root-motion product policy.

**Intent lens:** Make the built-in Debug Character path exercise the same
normalized character basis as imported characters, so the editor's default
animation smoke test proves runtime integration instead of mixing raw rendered
skeleton data with normalized retarget rest data.

**AC primitive cross-check:**
- Debug seed stores normalized bytes: codified primitive. Imported characters
  already normalize before filling `BundledVrmAssets`; debug seed must do the
  same before inserting `DEBUG_CHARACTER_VRM_ASSET_ID`.
- Feet stay below hips in the real engine path: codified with a full app
  integration test. The useful diagnostic value is the loaded hierarchy, not
  only synthetic retarget output.
- Retarget output remains valid: preserve the existing focused motion tests
  that build Debug Run retarget data from normalized VRM bytes and assert feet
  below hips.
- Root/hips XZ placement drift: related but not this root cause. Keep the
  superseded root/hips plan out of implementation unless a later issue reopens
  preview root-motion policy.

**Spec-risk handoff for `/shotloom-draft-spec`:**
- P1 Requirements: Normalize debug VRM seed bytes before writing
  `BundledVrmAssets`. Evidence: imported assets normalize at ingestion; debug
  seed previously cached raw embedded bytes. AC-trace: same basis for imported
  and debug characters.
- P1 Verification: Keep one test at the synthetic retarget layer and one test
  at the loaded engine hierarchy layer. Evidence: synthetic retarget/FK can
  pass while loaded hierarchy fails when raw bytes are rendered. AC-trace:
  failure value had foot Y above hips Y in the full app path.
- P1 Scope Guard: Do not "fix" this by changing retargeter math or suppressing
  root motion. Evidence: the failing condition is raw-vs-normalized skeleton
  basis mismatch. AC-trace: old root/hips plan is superseded.
- P2 Error Handling: Preserve the existing LFS pointer guard and lock-poison
  behavior. If normalization fails in seed, skip inserting debug bytes and log
  through the existing debug seed pattern rather than panicking.
- P2 Docs: Record the diagnostic shape and fix direction in tech debt because
  this is easy to regress when future debug assets are added.
- P3 Manual Check: After tests, open the editor, spawn Debug Character, select
  Debug Run, add a performance clip from the timeline row, and play/scrub.

**Sibling specs (Knitten docs):**
- `motion-debug-run-root-hips-preview.md` - superseded by this briefing. It
  captured the first root/hips placement hypothesis but should not drive this
  fix.
- `gltf-wire-axis-bake-normalize-vrm.md` - completed. Confirms
  `normalize_vrm` is the canonical VRM normalization boundary and that changed
  normalized bytes are meaningful runtime input.
- `retarget-recalibrate-default-pose.md` and retarget cleanup plans - completed
  sibling history. They are relevant to pose basis vocabulary, but this issue
  stays in engine debug seed bytes.

**Pre-write checklist passed:**
- [x] Linear issue is In Progress and rewritten to the corrected diagnosis.
- [x] Shotloom candidate worktree exists at `fix/debug-run-normalized-vrm-seed`.
- [x] Existing root/hips hypothesis is separated as superseded context.
- [x] Implementation scope is engine-local seed normalization plus tests.
- [x] No bridge, core schema, editor UI, or retargeter math change is required.

Ready. If this briefing is accepted, implementation can proceed from the
proposed spec.
