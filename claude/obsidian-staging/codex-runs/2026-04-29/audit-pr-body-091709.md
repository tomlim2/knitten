---
skill: cci-codex-audit-pr-body
timestamp: 2026-04-29T09:17:09+09:00
cwd: /Users/deemooooooooo/Desktop/www/shotloom-github/.worktrees/stl-243-re-aim-stl-75-stale-refs
model: gpt-5.4
reasoning_effort: high
---

## Prompt

```
You are auditing a Shotloom PR body for overclaims and drift from the
actual diff. For every sentence / bullet, flag it if it matches any
of these classes:

1. Quantitative claim that cannot be re-derived from the diff or a
   cited constant/bench. Check the direction of every inequality.
2. Marketing / subjective phrase ("easily", "trivially", "huge",
   "seamlessly", "well below"). Replace with a concrete number or drop.
3. Assertion not backed by a command in the Test details list.
4. Change described in Summary / Changes that is absent from the diff.
5. Count / cardinality mismatch between body and artifacts.
6. Sections not in the in-repo template (minimal: Summary / Validation
   / Related Issues only).
7. Sibling / umbrella content unrelated to THIS PR's diff.
8. Issue linkage verb mismatch (Resolves vs Part of) per pr-guideline
   §4. Resolves = PR fully closes; Part of = work continues.

Output format per finding:
- body line <N>: "<quoted>" — <why unsupported> — <concrete fix>

If nothing wrong, answer literally `OK`. Do not rewrite. Do not
comment on code-level concerns.

## Drafted PR body

## Summary

- removed 20 STL-75 citations from retarget crate + ADR-0025 after STL-75 was canceled 2026-04-28 with no successor
- deleted `IdentityRetargeter` and `ArpRetargeterInner::new` (zero callers, scaffolding for the canceled rubric work)
- retained `VrmVersion::V0x` / `detect_from_gltf_json` / `apply_wrist_twist_transfer` under `#[allow(dead_code)]` with rationale comments per `docs/guidelines/review-rust.md` §1

## Validation

- `rg STL-75 crates/ docs/` returns 0 hits
- `cargo fmt --check` clean
- `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings` clean
- `cargo check --workspace --exclude shotloom-desktop` clean
- `cargo test -p shotloom-retarget` passes (58 + 1 + 5 across lib unit, regression, fixture suites)
- `node scripts/validate-doc-paths.mjs` 957 path references verified across 145 files
- `node scripts/validate-ci-rust-coverage.mjs` 20/20 workspace crates covered

## Related Issues

Resolves STL-243

## Branch diff (git diff origin/main..HEAD)

```diff
diff --git a/crates/shotloom-retarget/README.md b/crates/shotloom-retarget/README.md
index 0424c9f..ee94b70 100644
--- a/crates/shotloom-retarget/README.md
+++ b/crates/shotloom-retarget/README.md
@@ -4,17 +4,17 @@
 
 ARP (Auto-Rig Pro) humanoid FBX → VRM skeletal animation retargeting. This crate owns the transformation from a validated source humanoid animation onto a validated VRM target model. It does **not** own scene, actor, character, source-parser, or assembly concepts — those are caller responsibilities in `shotloom-stage`, `shotloom-import`, `shotloom-source-anim`, or editor code.
 
-See [`docs/adr/adr-0023-retargeter-validation-contract.md`](../../docs/adr/adr-0023-retargeter-validation-contract.md) for the binding design decisions: operational-vs-quality diagnostic axes (operational uses `shotloom-common::Diagnostic` per ADR-0021; quality will use crate-local `Grade` / `RubricResult` types that land in STL-75), the scope boundary against `shotloom-common`, and the type-level "both inputs validated" contract planned for the future quality pipeline.
+See [`docs/adr/adr-0023-retargeter-validation-contract.md`](../../docs/adr/adr-0023-retargeter-validation-contract.md) for the binding design decisions: operational-vs-quality diagnostic axes (operational uses `shotloom-common::Diagnostic` per ADR-0021; quality grading is deferred — when it lands it will use crate-local `Grade` / `RubricResult` types per ADR-0023), the scope boundary against `shotloom-common`, and the type-level "both inputs validated" contract planned for the future quality pipeline.
 
 ## Scope boundary
 
 - **In scope:** ARP → VRM rotation / translation transformation, rest-pose derivation, adapter layer for structural VRM differences, post-processing (wrist twist, foot contact).
 - **Out of scope (this crate):** FBX / glTF / glb file parsing, source-animation type ownership, VRM humanoid map extraction, and mesh-level foot contact analysis. Parsing and byte-level extraction live in `shotloom-import` / `shotloom-gltf`; source-animation domain types live in `shotloom-source-anim`. See ADR-0023 §3 and ADR-0034.
-- **Deferred to STL-75:** Quality grading (`quality/` module tree, rubric A/B/C evaluation, `evaluate_pipeline` public entry point), `IdentityRetargeter`, integration tests.
+- **Deferred (no successor issue today):** Quality grading (`quality/` module tree, rubric A/B/C evaluation, `evaluate_pipeline` public entry point) and integration tests. ADR-0023 locks in the contract; the implementation lands when grading is reopened.
 
 ## Public API
 
-The current driver is `retarget_arp_to_vrm`, a narrow ARP-source to VRM-target wrapper over the internal retargeter. Current exports include retarget-domain types (`MappedAnimation`, `TargetAnimation`, `VrmRestPose`, helpers) plus transitional re-exports of `shotloom-source-anim` source types for compatibility. The broader marker-gated `evaluate_pipeline` surface remains deferred to STL-75.
+The current driver is `retarget_arp_to_vrm`, a narrow ARP-source to VRM-target wrapper over the internal retargeter. Current exports include retarget-domain types (`MappedAnimation`, `TargetAnimation`, `VrmRestPose`, helpers) plus transitional re-exports of `shotloom-source-anim` source types for compatibility. The broader marker-gated `evaluate_pipeline` surface remains deferred until quality grading is reopened.
 
 ## Module layout
 
diff --git a/crates/shotloom-retarget/src/config.rs b/crates/shotloom-retarget/src/config.rs
index fd37e21..1468561 100644
--- a/crates/shotloom-retarget/src/config.rs
+++ b/crates/shotloom-retarget/src/config.rs
@@ -1,15 +1,6 @@
 //! Retarget configuration — the JSON schema produced by the sweep
 //! harness and consumed by the mapping layer.
 
-// Layer 1 port. Methods are consumed by the mapping layer (Layer 4)
-// and the orchestrate entry (Layer 6); the lint silencer is removed
-// as soon as those layers land.
-// STL-74 incremental port: these Layer 0-4 items have no in-crate
-// caller yet. The public entry point (`evaluate_pipeline`) and the
-// quality/rubric modules that will consume them land in STL-75.
-// Remove this allow once those callers exist.
-#![allow(dead_code)]
-
 use serde::Deserialize;
 use std::collections::{BTreeMap, HashMap};
 
@@ -27,9 +18,8 @@ pub struct RetargetConfig {
     /// Stored as a `BTreeMap` so `shotloom-body-anim-normalizer::normalize_body`
     /// produces deterministic `Vec<BoneTrack>` ordering across runs; the Rust
     /// `HashMap` iteration order is seeded per-process and would
-    /// otherwise introduce flake into STL-75's rubric / canonical
-    /// serialization / golden-test baselines even though no in-crate
-    /// consumer observes the order yet.
+    /// otherwise introduce flake into any future canonical-serialization
+    /// or golden-test baseline that observes mapping order.
     pub direct_map: BTreeMap<String, String>,
     /// Target-bone → source-bone chain accumulation map.
     ///
diff --git a/crates/shotloom-retarget/src/lib.rs b/crates/shotloom-retarget/src/lib.rs
index cd0c2af..42cf41c 100644
--- a/crates/shotloom-retarget/src/lib.rs
+++ b/crates/shotloom-retarget/src/lib.rs
@@ -13,29 +13,23 @@
 //! (Layer 0), core domain / config types (Layer 1), topology /
 //! VRM-compat utilities (Layer 2), rest-pose helpers and postprocess
 //! (Layer 3), and the mapping + retargeter core (Layer 4). The narrow
-//! public driver is [`retarget_arp_to_vrm`]; the broader marker-gated
-//! `evaluate_pipeline` and quality / rubric modules still land in
-//! STL-75.
+//! public driver is [`retarget_arp_to_vrm`].
 //!
-//! A temporary public API surface is exposed through root-level re-exports
-//! so in-crate callers can assemble the pipeline while STL-75 is in
-//! flight. Today that includes the core retargeting domain types
-//! (`BoneTrack`, `ExpressionTrack`, `FootContactData`, `FootSideContact`,
-//! `MappedAnimation`, `RetargetError`, `RetargetedBone`,
-//! `SourceDiagnostics`, `TargetAnimation`, `VrmRestPose`,
-//! `swing_twist_decompose`), and the cross-crate sentinel
-//! `VRM_ROOT_BONE` (injected into `shotloom_gltf::extract_vrm_rest_data`
-//! so the GLB layer stays retarget-agnostic per ADR-0025). Source-
-//! animation domain types (`SourceAsset`, `SourceBone`,
-//! `SourceBoneTrack`, `SourceFormat`, `SourceSkeletonFrames`,
-//! `compute_source_skeleton`, `euler_to_quat`) live in
-//! `shotloom-source-anim` and are imported from there directly per
+//! Public API surface is exposed through root-level re-exports so
+//! in-crate callers can assemble the pipeline. Today that includes
+//! the core retargeting domain types (`BoneTrack`, `ExpressionTrack`,
+//! `FootContactData`, `FootSideContact`, `MappedAnimation`,
+//! `RetargetError`, `RetargetedBone`, `SourceDiagnostics`,
+//! `TargetAnimation`, `VrmRestPose`, `swing_twist_decompose`), and the
+//! cross-crate sentinel `VRM_ROOT_BONE` (injected into
+//! `shotloom_gltf::extract_vrm_rest_data` so the GLB layer stays
+//! retarget-agnostic per ADR-0025). Source-animation domain types
+//! (`SourceAsset`, `SourceBone`, `SourceBoneTrack`, `SourceFormat`,
+//! `SourceSkeletonFrames`, `compute_source_skeleton`, `euler_to_quat`)
+//! live in `shotloom-source-anim` and are imported from there directly
+//! per
 //! [ADR-0034](../../../docs/adr/adr-0034-source-animation-type-ownership.md).
 //!
-//! This surface is still evolving: STL-75 will add the marker-gated
-//! `evaluate_pipeline` contract and the rubric-related types and
-//! modules.
-//!
 //! # Contract preview
 //!
 //! See [ADR-0023](../../../docs/adr/adr-0023-retargeter-validation-contract.md)
diff --git a/crates/shotloom-retarget/src/mapping.rs b/crates/shotloom-retarget/src/mapping.rs
index 113d36b..5361996 100644
--- a/crates/shotloom-retarget/src/mapping.rs
+++ b/crates/shotloom-retarget/src/mapping.rs
@@ -1,9 +1,3 @@
-// STL-74 incremental port: these Layer 0-4 items have no in-crate
-// caller yet. The public entry point (`evaluate_pipeline`) and the
-// quality/rubric modules that will consume them land in STL-75.
-// Remove this allow once those callers exist.
-#![allow(dead_code)]
-
 //! Body + facial orchestrator.
 //!
 //! Body normalization (`normalize_body`, `SourceAnimBody`,
diff --git a/crates/shotloom-retarget/src/postprocess/mod.rs b/crates/shotloom-retarget/src/postprocess/mod.rs
index 0ad3a3c..ecd826f 100644
--- a/crates/shotloom-retarget/src/postprocess/mod.rs
+++ b/crates/shotloom-retarget/src/postprocess/mod.rs
@@ -1,8 +1,3 @@
-#![allow(dead_code)]
-// STL-74 incremental port: these Layer 0-4 items have no in-crate
-// caller yet. The public entry point (`evaluate_pipeline`) and the
-// quality/rubric modules that will consume them land in STL-75.
-// Remove this allow once those callers exist.
 //! Animation post-processing — modifies a [`crate::types::TargetAnimation`]
 //! after the retargeter has produced it.
 //!
diff --git a/crates/shotloom-retarget/src/postprocess/wrist_twist.rs b/crates/shotloom-retarget/src/postprocess/wrist_twist.rs
index 7645f38..c4060bc 100644
--- a/crates/shotloom-retarget/src/postprocess/wrist_twist.rs
+++ b/crates/shotloom-retarget/src/postprocess/wrist_twist.rs
@@ -1,8 +1,3 @@
-// STL-74 incremental port: these Layer 0-4 items have no in-crate
-// caller yet. The public entry point (`evaluate_pipeline`) and the
-// quality/rubric modules that will consume them land in STL-75.
-// Remove this allow once those callers exist.
-#![allow(dead_code)]
 //! Wrist twist transfer — EXP-006.
 //!
 //! Reads each FBX wrist's per-frame forearm-relative rotation, extracts
@@ -70,6 +65,11 @@ use shotloom_source_anim::SourceSkeletonFrames;
 /// Reads `fbx_forearm` / `fbx_hand` rotation tracks from `fbx_skel`,
 /// resolved through `vrm_to_fbx`. Mutates the matching hand bone tracks
 /// in `anim` in place. Returns one log line per hand processed.
+///
+/// Retained as a drop-in post-process step. The current
+/// `retarget_arp_to_vrm` driver does not chain it; pipelines that compose
+/// post-processing manually call this directly.
+#[allow(dead_code)]
 pub fn apply_wrist_twist_transfer(
     anim: &mut TargetAnimation,
     fbx_skel: &SourceSkeletonFrames,
diff --git a/crates/shotloom-retarget/src/retargeter.rs b/crates/shotloom-retarget/src/retargeter.rs
index 957452f..97dcad4 100644
--- a/crates/shotloom-retarget/src/retargeter.rs
+++ b/crates/shotloom-retarget/src/retargeter.rs
@@ -1,15 +1,9 @@
-// STL-74 incremental port: these Layer 0-4 items have no in-crate
-// caller yet. The public entry point (`evaluate_pipeline`) and the
-// quality/rubric modules that will consume them land in STL-75.
-// Remove this allow once those callers exist.
-#![allow(dead_code)]
 use glam::{Quat, Vec3};
 use std::collections::HashMap;
 
 use crate::types::{
     ExpressionTrack, MappedAnimation, RetargetedBone, TargetAnimation, VrmRestPose,
 };
-use shotloom_source_anim::SourceAsset;
 
 // TODO(Layer 5): re-enable when quality module lands.
 // use crate::quality::RetargetQuality;
@@ -159,23 +153,6 @@ fn contact_baseline(toe_track: &[f32]) -> f32 {
 }
 
 impl ArpRetargeterInner {
-    pub(crate) fn new(
-        vrm_rest: VrmRestPose,
-        source_data: Option<shotloom_source_anim::SourceSkeletonFrames>,
-        anim: &MappedAnimation,
-        _source_root_name: &str,
-        source_hips_name: &str,
-    ) -> Self {
-        Self::new_with_options(
-            vrm_rest,
-            source_data,
-            anim,
-            _source_root_name,
-            source_hips_name,
-            RetargeterOptions::default(),
-        )
-    }
-
     pub(crate) fn new_with_options(
         vrm_rest: VrmRestPose,
         source_data: Option<shotloom_source_anim::SourceSkeletonFrames>,
@@ -943,63 +920,6 @@ impl ArpRetargeterInner {
     }
 }
 
-/// Passthrough retargeter: copies source tracks directly into target VRM
-/// bone slots with no corrections, no coord conversion, no scale. Used as
-/// the rubric-C baseline — if rubric C flags an identity retarget, rubric C
-/// is lying, not the retargeter.
-///
-/// Constructed with a `(src_name, vrm_name)` bone map. The map is the only
-/// transformation step; everything else is a byte-copy of rotation tracks.
-///
-/// Carried over from the bevy-vrm source tree for the upcoming rubric
-/// test fixtures; has no in-crate callers today and is deliberately
-/// unused in STL-74. The rubric C "identity must grade A" contract
-/// that will consume it lands with the quality modules in STL-75.
-/// See `crates/shotloom-retarget/README.md` "Deferred to STL-75".
-pub(crate) struct IdentityRetargeter {
-    pub bone_map: Vec<(String, String)>,
-}
-
-impl IdentityRetargeter {
-    pub(crate) fn new(bone_map: Vec<(String, String)>) -> Self {
-        IdentityRetargeter { bone_map }
-    }
-
-    /// Run the identity passthrough on a source asset. `vrm_rest` is
-    /// accepted for API parity with stateful retargeters but is unused —
-    /// identity ignores rest pose by definition.
-    pub(crate) fn retarget(&self, src: &SourceAsset, vrm_rest: &VrmRestPose) -> TargetAnimation {
-        let frame_count = src.frame_count;
-        let mut bones_out: Vec<RetargetedBone> = Vec::with_capacity(self.bone_map.len());
-
-        for (src_name, vrm_name) in &self.bone_map {
-            let rotations: Vec<Quat> = src
-                .tracks
-                .get(src_name)
-                .map(|t| t.rotations.clone())
-                .unwrap_or_else(|| vec![Quat::IDENTITY; frame_count]);
-
-            bones_out.push(RetargetedBone {
-                vrm_bone_name: vrm_name.clone(),
-                rotations,
-                translations: None,
-            });
-        }
-
-        let _ = vrm_rest;
-
-        TargetAnimation {
-            duration_secs: src.duration,
-            bones: bones_out,
-            expression_tracks: Vec::new(),
-            log: vec![format!(
-                "[IDENTITY] {} bones passthrough",
-                self.bone_map.len()
-            )],
-        }
-    }
-}
-
 #[cfg(test)]
 mod tests {
     use super::*;
diff --git a/crates/shotloom-retarget/src/topo.rs b/crates/shotloom-retarget/src/topo.rs
index 74753e8..fba2f72 100644
--- a/crates/shotloom-retarget/src/topo.rs
+++ b/crates/shotloom-retarget/src/topo.rs
@@ -1,8 +1,3 @@
-// STL-74 incremental port: these Layer 0-4 items have no in-crate
-// caller yet. The public entry point (`evaluate_pipeline`) and the
-// quality/rubric modules that will consume them land in STL-75.
-// Remove this allow once those callers exist.
-#![allow(dead_code)]
 use std::collections::HashMap;
 
 pub fn build_vrm_topo_order(parent_map: &HashMap<String, String>) -> Vec<String> {
diff --git a/crates/shotloom-retarget/src/vrm_compat.rs b/crates/shotloom-retarget/src/vrm_compat.rs
index 71cea1d..da358ea 100644
--- a/crates/shotloom-retarget/src/vrm_compat.rs
+++ b/crates/shotloom-retarget/src/vrm_compat.rs
@@ -1,10 +1,9 @@
-// STL-74 incremental port: these Layer 0-4 items have no in-crate
-// caller yet. The public entry point (`evaluate_pipeline`) and the
-// quality/rubric modules that will consume them land in STL-75.
-// Remove this allow once those callers exist.
-#![allow(dead_code)]
 #[derive(Debug, Clone, Copy, PartialEq, Eq)]
 pub enum VrmVersion {
+    /// VRM 0.x. Constructed only by tests today; kept so the
+    /// `config_key` mapping and `detect_from_gltf_json` extension probe
+    /// remain symmetric with the 1.0 variant when a 0.x driver wires in.
+    #[allow(dead_code)]
     V0x,
     V1_0,
 }
@@ -17,6 +16,12 @@ impl VrmVersion {
         }
     }
 
+    /// Probe a glTF JSON string for the VRM extension key and return
+    /// the matching variant. Validated by the `detect_*` tests in this
+    /// module; no production caller today, but retained as the canonical
+    /// version-detection helper for any future driver that needs to pick
+    /// `V0x` vs `V1_0` from raw JSON.
+    #[allow(dead_code)]
     pub fn detect_from_gltf_json(json_str: &str) -> Option<Self> {
         if json_str.contains("\"VRMC_vrm\"") {
             Some(VrmVersion::V1_0)
diff --git a/crates/shotloom-retarget/src/vrm_rest.rs b/crates/shotloom-retarget/src/vrm_rest.rs
index b7d01a1..92e97c8 100644
--- a/crates/shotloom-retarget/src/vrm_rest.rs
+++ b/crates/shotloom-retarget/src/vrm_rest.rs
@@ -1,8 +1,3 @@
-// STL-74 incremental port: these Layer 0-4 items have no in-crate
-// caller yet. The public entry point (`evaluate_pipeline`) and the
-// quality/rubric modules that will consume them land in STL-75.
-// Remove this allow once those callers exist.
-#![allow(dead_code)]
 //! Pure-computation helpers for building a [`VrmRestPose`] from
 //! caller-supplied bone data.
 
diff --git a/docs/adr/adr-0025-retargeter-public-driver.md b/docs/adr/adr-0025-retargeter-public-driver.md
index 2104502..d373aa5 100644
--- a/docs/adr/adr-0025-retargeter-public-driver.md
+++ b/docs/adr/adr-0025-retargeter-public-driver.md
@@ -81,8 +81,8 @@ Only what `retarget_arp_to_vrm` structurally requires:
 Everything else in `retargeter.rs`, `mapping.rs`, `postprocess.rs`,
 `correction.rs`, `vrm_compat.rs`, `topo.rs`, `finger_*` stays
 `pub(crate)`. Consumers that need lower-level access (rubric A/B/C
-evaluation in STL-75) will get a second ADR when the rubric lands —
-this ADR does not speculate that surface.
+evaluation, when quality grading is reopened) will get a second ADR
+when the rubric lands — this ADR does not speculate that surface.
 
 `build_from_bytes` is a thin assembler that delegates byte-level
 extraction to three composable `shotloom-gltf` helpers
@@ -145,9 +145,10 @@ adding a second optional argument or a builder pattern.
 - `RetargeterOptions` becomes part of the public API. Adding a new
   option requires either a default value (backwards-compatible) or a
   breaking bump.
-- The "second ADR for rubric A/B/C" commitment means STL-75 cannot
-  piggyback on `retarget_arp_to_vrm`'s surface — it must either fit
-  through this entry point or get its own explicit promotion.
+- The "second ADR for rubric A/B/C" commitment means a future quality
+  grading effort cannot piggyback on `retarget_arp_to_vrm`'s surface —
+  it must either fit through this entry point or get its own explicit
+  promotion.
 
 ### Neutral
 
@@ -183,8 +184,8 @@ adding a second optional argument or a builder pattern.
 - STL-89 S4/S5: wire the `shotloom-engine` Spawn Debug Character flow
   (STL-127) to drive male + female presets through `retarget_arp_to_vrm`
   and verify T-pose escape.
-- STL-75 (future): rubric A/B/C may require additional public surface;
-  that work will get its own ADR.
+- Quality grading (future, no successor issue today): rubric A/B/C may
+  require additional public surface; that work will get its own ADR.
 
 ## Open Questions
 
```
```

## Response

OpenAI Codex v0.125.0 (research preview)
--------
workdir: /Users/deemooooooooo/Desktop/www/shotloom-github/.worktrees/stl-243-re-aim-stl-75-stale-refs
model: gpt-5.5
provider: codex-lb-cinamon
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR, /Users/deemooooooooo/.codex/memories]
reasoning effort: medium
reasoning summaries: none
session id: 019dd698-c4e8-73f1-a486-24f1ad75f7b2
--------
user
중요: 모든 답변은 **한국어**로. 코드 블록은 영어로 두되 설명·결론·요약·권장사항은 한국어. 마크다운으로. 결론은 굵게.

---

You are auditing a Shotloom PR body for overclaims and drift from the
actual diff. For every sentence / bullet, flag it if it matches any
of these classes:

1. Quantitative claim that cannot be re-derived from the diff or a
   cited constant/bench. Check the direction of every inequality.
2. Marketing / subjective phrase ("easily", "trivially", "huge",
   "seamlessly", "well below"). Replace with a concrete number or drop.
3. Assertion not backed by a command in the Test details list.
4. Change described in Summary / Changes that is absent from the diff.
5. Count / cardinality mismatch between body and artifacts.
6. Sections not in the in-repo template (minimal: Summary / Validation
   / Related Issues only).
7. Sibling / umbrella content unrelated to THIS PR's diff.
8. Issue linkage verb mismatch (Resolves vs Part of) per pr-guideline
   §4. Resolves = PR fully closes; Part of = work continues.

Output format per finding:
- body line <N>: "<quoted>" — <why unsupported> — <concrete fix>

If nothing wrong, answer literally `OK`. Do not rewrite. Do not
comment on code-level concerns.

## Drafted PR body

## Summary

- removed 20 STL-75 citations from retarget crate + ADR-0025 after STL-75 was canceled 2026-04-28 with no successor
- deleted `IdentityRetargeter` and `ArpRetargeterInner::new` (zero callers, scaffolding for the canceled rubric work)
- retained `VrmVersion::V0x` / `detect_from_gltf_json` / `apply_wrist_twist_transfer` under `#[allow(dead_code)]` with rationale comments per `docs/guidelines/review-rust.md` §1

## Validation

- `rg STL-75 crates/ docs/` returns 0 hits
- `cargo fmt --check` clean
- `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings` clean
- `cargo check --workspace --exclude shotloom-desktop` clean
- `cargo test -p shotloom-retarget` passes (58 + 1 + 5 across lib unit, regression, fixture suites)
- `node scripts/validate-doc-paths.mjs` 957 path references verified across 145 files
- `node scripts/validate-ci-rust-coverage.mjs` 20/20 workspace crates covered

## Related Issues

Resolves STL-243

## Branch diff (git diff origin/main..HEAD)

```diff
diff --git a/crates/shotloom-retarget/README.md b/crates/shotloom-retarget/README.md
index 0424c9f..ee94b70 100644
--- a/crates/shotloom-retarget/README.md
+++ b/crates/shotloom-retarget/README.md
@@ -4,17 +4,17 @@
 
 ARP (Auto-Rig Pro) humanoid FBX → VRM skeletal animation retargeting. This crate owns the transformation from a validated source humanoid animation onto a validated VRM target model. It does **not** own scene, actor, character, source-parser, or assembly concepts — those are caller responsibilities in `shotloom-stage`, `shotloom-import`, `shotloom-source-anim`, or editor code.
 
-See [`docs/adr/adr-0023-retargeter-validation-contract.md`](../../docs/adr/adr-0023-retargeter-validation-contract.md) for the binding design decisions: operational-vs-quality diagnostic axes (operational uses `shotloom-common::Diagnostic` per ADR-0021; quality will use crate-local `Grade` / `RubricResult` types that land in STL-75), the scope boundary against `shotloom-common`, and the type-level "both inputs validated" contract planned for the future quality pipeline.
+See [`docs/adr/adr-0023-retargeter-validation-contract.md`](../../docs/adr/adr-0023-retargeter-validation-contract.md) for the binding design decisions: operational-vs-quality diagnostic axes (operational uses `shotloom-common::Diagnostic` per ADR-0021; quality grading is deferred — when it lands it will use crate-local `Grade` / `RubricResult` types per ADR-0023), the scope boundary against `shotloom-common`, and the type-level "both inputs validated" contract planned for the future quality pipeline.
 
 ## Scope boundary
 
 - **In scope:** ARP → VRM rotation / translation transformation, rest-pose derivation, adapter layer for structural VRM differences, post-processing (wrist twist, foot contact).
 - **Out of scope (this crate):** FBX / glTF / glb file parsing, source-animation type ownership, VRM humanoid map extraction, and mesh-level foot contact analysis. Parsing and byte-level extraction live in `shotloom-import` / `shotloom-gltf`; source-animation domain types live in `shotloom-source-anim`. See ADR-0023 §3 and ADR-0034.
-- **Deferred to STL-75:** Quality grading (`quality/` module tree, rubric A/B/C evaluation, `evaluate_pipeline` public entry point), `IdentityRetargeter`, integration tests.
+- **Deferred (no successor issue today):** Quality grading (`quality/` module tree, rubric A/B/C evaluation, `evaluate_pipeline` public entry point) and integration tests. ADR-0023 locks in the contract; the implementation lands when grading is reopened.
 
 ## Public API
 
-The current driver is `retarget_arp_to_vrm`, a narrow ARP-source to VRM-target wrapper over the internal retargeter. Current exports include retarget-domain types (`MappedAnimation`, `TargetAnimation`, `VrmRestPose`, helpers) plus transitional re-exports of `shotloom-source-anim` source types for compatibility. The broader marker-gated `evaluate_pipeline` surface remains deferred to STL-75.
+The current driver is `retarget_arp_to_vrm`, a narrow ARP-source to VRM-target wrapper over the internal retargeter. Current exports include retarget-domain types (`MappedAnimation`, `TargetAnimation`, `VrmRestPose`, helpers) plus transitional re-exports of `shotloom-source-anim` source types for compatibility. The broader marker-gated `evaluate_pipeline` surface remains deferred until quality grading is reopened.
 
 ## Module layout
 
diff --git a/crates/shotloom-retarget/src/config.rs b/crates/shotloom-retarget/src/config.rs
index fd37e21..1468561 100644
--- a/crates/shotloom-retarget/src/config.rs
+++ b/crates/shotloom-retarget/src/config.rs
@@ -1,15 +1,6 @@
 //! Retarget configuration — the JSON schema produced by the sweep
 //! harness and consumed by the mapping layer.
 
-// Layer 1 port. Methods are consumed by the mapping layer (Layer 4)
-// and the orchestrate entry (Layer 6); the lint silencer is removed
-// as soon as those layers land.
-// STL-74 incremental port: these Layer 0-4 items have no in-crate
-// caller yet. The public entry point (`evaluate_pipeline`) and the
-// quality/rubric modules that will consume them land in STL-75.
-// Remove this allow once those callers exist.
-#![allow(dead_code)]
-
 use serde::Deserialize;
 use std::collections::{BTreeMap, HashMap};
 
@@ -27,9 +18,8 @@ pub struct RetargetConfig {
     /// Stored as a `BTreeMap` so `shotloom-body-anim-normalizer::normalize_body`
     /// produces deterministic `Vec<BoneTrack>` ordering across runs; the Rust
     /// `HashMap` iteration order is seeded per-process and would
-    /// otherwise introduce flake into STL-75's rubric / canonical
-    /// serialization / golden-test baselines even though no in-crate
-    /// consumer observes the order yet.
+    /// otherwise introduce flake into any future canonical-serialization
+    /// or golden-test baseline that observes mapping order.
     pub direct_map: BTreeMap<String, String>,
     /// Target-bone → source-bone chain accumulation map.
     ///
diff --git a/crates/shotloom-retarget/src/lib.rs b/crates/shotloom-retarget/src/lib.rs
index cd0c2af..42cf41c 100644
--- a/crates/shotloom-retarget/src/lib.rs
+++ b/crates/shotloom-retarget/src/lib.rs
@@ -13,29 +13,23 @@
 //! (Layer 0), core domain / config types (Layer 1), topology /
 //! VRM-compat utilities (Layer 2), rest-pose helpers and postprocess
 //! (Layer 3), and the mapping + retargeter core (Layer 4). The narrow
-//! public driver is [`retarget_arp_to_vrm`]; the broader marker-gated
-//! `evaluate_pipeline` and quality / rubric modules still land in
-//! STL-75.
+//! public driver is [`retarget_arp_to_vrm`].
 //!
-//! A temporary public API surface is exposed through root-level re-exports
-//! so in-crate callers can assemble the pipeline while STL-75 is in
-//! flight. Today that includes the core retargeting domain types
-//! (`BoneTrack`, `ExpressionTrack`, `FootContactData`, `FootSideContact`,
-//! `MappedAnimation`, `RetargetError`, `RetargetedBone`,
-//! `SourceDiagnostics`, `TargetAnimation`, `VrmRestPose`,
-//! `swing_twist_decompose`), and the cross-crate sentinel
-//! `VRM_ROOT_BONE` (injected into `shotloom_gltf::extract_vrm_rest_data`
-//! so the GLB layer stays retarget-agnostic per ADR-0025). Source-
-//! animation domain types (`SourceAsset`, `SourceBone`,
-//! `SourceBoneTrack`, `SourceFormat`, `SourceSkeletonFrames`,
-//! `compute_source_skeleton`, `euler_to_quat`) live in
-//! `shotloom-source-anim` and are imported from there directly per
+//! Public API surface is exposed through root-level re-exports so
+//! in-crate callers can assemble the pipeline. Today that includes
+//! the core retargeting domain types (`BoneTrack`, `ExpressionTrack`,
+//! `FootContactData`, `FootSideContact`, `MappedAnimation`,
+//! `RetargetError`, `RetargetedBone`, `SourceDiagnostics`,
+//! `TargetAnimation`, `VrmRestPose`, `swing_twist_decompose`), and the
+//! cross-crate sentinel `VRM_ROOT_BONE` (injected into
+//! `shotloom_gltf::extract_vrm_rest_data` so the GLB layer stays
+//! retarget-agnostic per ADR-0025). Source-animation domain types
+//! (`SourceAsset`, `SourceBone`, `SourceBoneTrack`, `SourceFormat`,
+//! `SourceSkeletonFrames`, `compute_source_skeleton`, `euler_to_quat`)
+//! live in `shotloom-source-anim` and are imported from there directly
+//! per
 //! [ADR-0034](../../../docs/adr/adr-0034-source-animation-type-ownership.md).
 //!
-//! This surface is still evolving: STL-75 will add the marker-gated
-//! `evaluate_pipeline` contract and the rubric-related types and
-//! modules.
-//!
 //! # Contract preview
 //!
 //! See [ADR-0023](../../../docs/adr/adr-0023-retargeter-validation-contract.md)
diff --git a/crates/shotloom-retarget/src/mapping.rs b/crates/shotloom-retarget/src/mapping.rs
index 113d36b..5361996 100644
--- a/crates/shotloom-retarget/src/mapping.rs
+++ b/crates/shotloom-retarget/src/mapping.rs
@@ -1,9 +1,3 @@
-// STL-74 incremental port: these Layer 0-4 items have no in-crate
-// caller yet. The public entry point (`evaluate_pipeline`) and the
-// quality/rubric modules that will consume them land in STL-75.
-// Remove this allow once those callers exist.
-#![allow(dead_code)]
-
 //! Body + facial orchestrator.
 //!
 //! Body normalization (`normalize_body`, `SourceAnimBody`,
diff --git a/crates/shotloom-retarget/src/postprocess/mod.rs b/crates/shotloom-retarget/src/postprocess/mod.rs
index 0ad3a3c..ecd826f 100644
--- a/crates/shotloom-retarget/src/postprocess/mod.rs
+++ b/crates/shotloom-retarget/src/postprocess/mod.rs
@@ -1,8 +1,3 @@
-#![allow(dead_code)]
-// STL-74 incremental port: these Layer 0-4 items have no in-crate
-// caller yet. The public entry point (`evaluate_pipeline`) and the
-// quality/rubric modules that will consume them land in STL-75.
-// Remove this allow once those callers exist.
 //! Animation post-processing — modifies a [`crate::types::TargetAnimation`]
 //! after the retargeter has produced it.
 //!
diff --git a/crates/shotloom-retarget/src/postprocess/wrist_twist.rs b/crates/shotloom-retarget/src/postprocess/wrist_twist.rs
index 7645f38..c4060bc 100644
--- a/crates/shotloom-retarget/src/postprocess/wrist_twist.rs
+++ b/crates/shotloom-retarget/src/postprocess/wrist_twist.rs
@@ -1,8 +1,3 @@
-// STL-74 incremental port: these Layer 0-4 items have no in-crate
-// caller yet. The public entry point (`evaluate_pipeline`) and the
-// quality/rubric modules that will consume them land in STL-75.
-// Remove this allow once those callers exist.
-#![allow(dead_code)]
 //! Wrist twist transfer — EXP-006.
 //!
 //! Reads each FBX wrist's per-frame forearm-relative rotation, extracts
@@ -70,6 +65,11 @@ use shotloom_source_anim::SourceSkeletonFrames;
 /// Reads `fbx_forearm` / `fbx_hand` rotation tracks from `fbx_skel`,
 /// resolved through `vrm_to_fbx`. Mutates the matching hand bone tracks
 /// in `anim` in place. Returns one log line per hand processed.
+///
+/// Retained as a drop-in post-process step. The current
+/// `retarget_arp_to_vrm` driver does not chain it; pipelines that compose
+/// post-processing manually call this directly.
+#[allow(dead_code)]
 pub fn apply_wrist_twist_transfer(
     anim: &mut TargetAnimation,
     fbx_skel: &SourceSkeletonFrames,
diff --git a/crates/shotloom-retarget/src/retargeter.rs b/crates/shotloom-retarget/src/retargeter.rs
index 957452f..97dcad4 100644
--- a/crates/shotloom-retarget/src/retargeter.rs
+++ b/crates/shotloom-retarget/src/retargeter.rs
@@ -1,15 +1,9 @@
-// STL-74 incremental port: these Layer 0-4 items have no in-crate
-// caller yet. The public entry point (`evaluate_pipeline`) and the
-// quality/rubric modules that will consume them land in STL-75.
-// Remove this allow once those callers exist.
-#![allow(dead_code)]
 use glam::{Quat, Vec3};
 use std::collections::HashMap;
 
 use crate::types::{
     ExpressionTrack, MappedAnimation, RetargetedBone, TargetAnimation, VrmRestPose,
 };
-use shotloom_source_anim::SourceAsset;
 
 // TODO(Layer 5): re-enable when quality module lands.
 // use crate::quality::RetargetQuality;
@@ -159,23 +153,6 @@ fn contact_baseline(toe_track: &[f32]) -> f32 {
 }
 
 impl ArpRetargeterInner {
-    pub(crate) fn new(
-        vrm_rest: VrmRestPose,
-        source_data: Option<shotloom_source_anim::SourceSkeletonFrames>,
-        anim: &MappedAnimation,
-        _source_root_name: &str,
-        source_hips_name: &str,
-    ) -> Self {
-        Self::new_with_options(
-            vrm_rest,
-            source_data,
-            anim,
-            _source_root_name,
-            source_hips_name,
-            RetargeterOptions::default(),
-        )
-    }
-
     pub(crate) fn new_with_options(
         vrm_rest: VrmRestPose,
         source_data: Option<shotloom_source_anim::SourceSkeletonFrames>,
@@ -943,63 +920,6 @@ impl ArpRetargeterInner {
     }
 }
 
-/// Passthrough retargeter: copies source tracks directly into target VRM
-/// bone slots with no corrections, no coord conversion, no scale. Used as
-/// the rubric-C baseline — if rubric C flags an identity retarget, rubric C
-/// is lying, not the retargeter.
-///
-/// Constructed with a `(src_name, vrm_name)` bone map. The map is the only
-/// transformation step; everything else is a byte-copy of rotation tracks.
-///
-/// Carried over from the bevy-vrm source tree for the upcoming rubric
-/// test fixtures; has no in-crate callers today and is deliberately
-/// unused in STL-74. The rubric C "identity must grade A" contract
-/// that will consume it lands with the quality modules in STL-75.
-/// See `crates/shotloom-retarget/README.md` "Deferred to STL-75".
-pub(crate) struct IdentityRetargeter {
-    pub bone_map: Vec<(String, String)>,
-}
-
-impl IdentityRetargeter {
-    pub(crate) fn new(bone_map: Vec<(String, String)>) -> Self {
-        IdentityRetargeter { bone_map }
-    }
-
-    /// Run the identity passthrough on a source asset. `vrm_rest` is
-    /// accepted for API parity with stateful retargeters but is unused —
-    /// identity ignores rest pose by definition.
-    pub(crate) fn retarget(&self, src: &SourceAsset, vrm_rest: &VrmRestPose) -> TargetAnimation {
-        let frame_count = src.frame_count;
-        let mut bones_out: Vec<RetargetedBone> = Vec::with_capacity(self.bone_map.len());
-
-        for (src_name, vrm_name) in &self.bone_map {
-            let rotations: Vec<Quat> = src
-                .tracks
-                .get(src_name)
-                .map(|t| t.rotations.clone())
-                .unwrap_or_else(|| vec![Quat::IDENTITY; frame_count]);
-
-            bones_out.push(RetargetedBone {
-                vrm_bone_name: vrm_name.clone(),
-                rotations,
-                translations: None,
-            });
-        }
-
-        let _ = vrm_rest;
-
-        TargetAnimation {
-            duration_secs: src.duration,
-            bones: bones_out,
-            expression_tracks: Vec::new(),
-            log: vec![format!(
-                "[IDENTITY] {} bones passthrough",
-                self.bone_map.len()
-            )],
-        }
-    }
-}
-
 #[cfg(test)]
 mod tests {
     use super::*;
diff --git a/crates/shotloom-retarget/src/topo.rs b/crates/shotloom-retarget/src/topo.rs
index 74753e8..fba2f72 100644
--- a/crates/shotloom-retarget/src/topo.rs
+++ b/crates/shotloom-retarget/src/topo.rs
@@ -1,8 +1,3 @@
-// STL-74 incremental port: these Layer 0-4 items have no in-crate
-// caller yet. The public entry point (`evaluate_pipeline`) and the
-// quality/rubric modules that will consume them land in STL-75.
-// Remove this allow once those callers exist.
-#![allow(dead_code)]
 use std::collections::HashMap;
 
 pub fn build_vrm_topo_order(parent_map: &HashMap<String, String>) -> Vec<String> {
diff --git a/crates/shotloom-retarget/src/vrm_compat.rs b/crates/shotloom-retarget/src/vrm_compat.rs
index 71cea1d..da358ea 100644
--- a/crates/shotloom-retarget/src/vrm_compat.rs
+++ b/crates/shotloom-retarget/src/vrm_compat.rs
@@ -1,10 +1,9 @@
-// STL-74 incremental port: these Layer 0-4 items have no in-crate
-// caller yet. The public entry point (`evaluate_pipeline`) and the
-// quality/rubric modules that will consume them land in STL-75.
-// Remove this allow once those callers exist.
-#![allow(dead_code)]
 #[derive(Debug, Clone, Copy, PartialEq, Eq)]
 pub enum VrmVersion {
+    /// VRM 0.x. Constructed only by tests today; kept so the
+    /// `config_key` mapping and `detect_from_gltf_json` extension probe
+    /// remain symmetric with the 1.0 variant when a 0.x driver wires in.
+    #[allow(dead_code)]
     V0x,
     V1_0,
 }
@@ -17,6 +16,12 @@ impl VrmVersion {
         }
     }
 
+    /// Probe a glTF JSON string for the VRM extension key and return
+    /// the matching variant. Validated by the `detect_*` tests in this
+    /// module; no production caller today, but retained as the canonical
+    /// version-detection helper for any future driver that needs to pick
+    /// `V0x` vs `V1_0` from raw JSON.
+    #[allow(dead_code)]
     pub fn detect_from_gltf_json(json_str: &str) -> Option<Self> {
         if json_str.contains("\"VRMC_vrm\"") {
             Some(VrmVersion::V1_0)
diff --git a/crates/shotloom-retarget/src/vrm_rest.rs b/crates/shotloom-retarget/src/vrm_rest.rs
index b7d01a1..92e97c8 100644
--- a/crates/shotloom-retarget/src/vrm_rest.rs
+++ b/crates/shotloom-retarget/src/vrm_rest.rs
@@ -1,8 +1,3 @@
-// STL-74 incremental port: these Layer 0-4 items have no in-crate
-// caller yet. The public entry point (`evaluate_pipeline`) and the
-// quality/rubric modules that will consume them land in STL-75.
-// Remove this allow once those callers exist.
-#![allow(dead_code)]
 //! Pure-computation helpers for building a [`VrmRestPose`] from
 //! caller-supplied bone data.
 
diff --git a/docs/adr/adr-0025-retargeter-public-driver.md b/docs/adr/adr-0025-retargeter-public-driver.md
index 2104502..d373aa5 100644
--- a/docs/adr/adr-0025-retargeter-public-driver.md
+++ b/docs/adr/adr-0025-retargeter-public-driver.md
@@ -81,8 +81,8 @@ Only what `retarget_arp_to_vrm` structurally requires:
 Everything else in `retargeter.rs`, `mapping.rs`, `postprocess.rs`,
 `correction.rs`, `vrm_compat.rs`, `topo.rs`, `finger_*` stays
 `pub(crate)`. Consumers that need lower-level access (rubric A/B/C
-evaluation in STL-75) will get a second ADR when the rubric lands —
-this ADR does not speculate that surface.
+evaluation, when quality grading is reopened) will get a second ADR
+when the rubric lands — this ADR does not speculate that surface.
 
 `build_from_bytes` is a thin assembler that delegates byte-level
 extraction to three composable `shotloom-gltf` helpers
@@ -145,9 +145,10 @@ adding a second optional argument or a builder pattern.
 - `RetargeterOptions` becomes part of the public API. Adding a new
   option requires either a default value (backwards-compatible) or a
   breaking bump.
-- The "second ADR for rubric A/B/C" commitment means STL-75 cannot
-  piggyback on `retarget_arp_to_vrm`'s surface — it must either fit
-  through this entry point or get its own explicit promotion.
+- The "second ADR for rubric A/B/C" commitment means a future quality
+  grading effort cannot piggyback on `retarget_arp_to_vrm`'s surface —
+  it must either fit through this entry point or get its own explicit
+  promotion.
 
 ### Neutral
 
@@ -183,8 +184,8 @@ adding a second optional argument or a builder pattern.
 - STL-89 S4/S5: wire the `shotloom-engine` Spawn Debug Character flow
   (STL-127) to drive male + female presets through `retarget_arp_to_vrm`
   and verify T-pose escape.
-- STL-75 (future): rubric A/B/C may require additional public surface;
-  that work will get its own ADR.
+- Quality grading (future, no successor issue today): rubric A/B/C may
+  require additional public surface; that work will get its own ADR.
 
 ## Open Questions
 
```

