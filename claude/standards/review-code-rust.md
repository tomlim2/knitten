---
title: Rust Code Review Standard
description: Pattern-based pre-PR self-review checklist for Rust code. Derived from real Copilot review findings on Shotloom PR #66 (16 defects across 3 review rounds). Load this before pushing any Rust PR.
---

# Rust Code Review Standard

Pre-PR self-review checklist for Rust crates. Each pattern below was extracted from a real defect a reviewer (human or AI) caught on a Shotloom PR after the author pushed. Running through this list before push catches the same class of defect locally and avoids a review round-trip.

**How to use:** Before opening a PR, read this file in full and walk through every pattern against your diff. Treat each pattern as a `grep`-able constraint, not a vague guideline. If a pattern doesn't apply, say so explicitly in your self-review notes.

---

## Pattern A — Doc ↔ Code coherence

**The single most common defect class.** Comments, docstrings, README sections, and PR descriptions drift away from the code they describe, especially after a refactor. A reviewer who reads the doc first and the code second will catch this every time.

### A1 — Identifier name in a comment must exist in the code

Every identifier mentioned in a `//`, `///`, or `//!` comment (function name, struct name, file path, module path, ADR number) must actually exist at the time of the commit. Renames and deletions break this silently.

**Self-check:**
```bash
# Grep every backticked identifier inside docs and verify it resolves.
rg -o '`[A-Za-z_][A-Za-z0-9_]*`' src/**/*.rs | sort -u
```

**Real defect:** `retargeter.rs` doc comment referenced `docs/retarget-diagnostic-boundary.md` after the file was renamed to `adr-0023-retargeter-validation-contract.md`. Dead reference.

### A2 — File paths in docs must resolve

Every `path/to/file.md` or `crates/foo/bar.rs` mentioned in a comment, README, or PR body must exist relative to the repo root. The Shotloom repo enforces this on markdown via `node scripts/validate-doc-paths.mjs`, but Rust comments are not covered — check them by hand.

**Self-check:** for each `\`docs/...\`` or `\`crates/...\`` mention in a touched file, run `ls` against it.

**Real defect:** Same as A1, plus README pointed at `examples/fixtures.example.json` after the workflow switched to a committed `examples/fixtures.json`.

### A3 — Crate-level state descriptions go stale fast

`//! # Current state` blocks, `//! Status:` lines, `Phase X session Y` notes, "scaffold" / "WIP" / "stub" labels — all of these must be updated *in the same commit* that changes what they describe. A reviewer who reads `lib.rs` first will trust this block.

**Self-check:** open `lib.rs` and `mod.rs` of every touched crate; verify the top-of-file description matches what the crate now contains.

**Real defect:** `lib.rs` said "Still the Phase B session 1 scaffold" *after* this PR ported Layer 0–4. Caught twice — first time the API enumeration was updated but the opening sentence wasn't.

**Real defect (PR #178, comment 3145053780):** `shotloom-character-model-normalizer/src/lib.rs` rustdoc lead claimed responsibility for "foot contact / sole offset extraction" alongside rest pose alignment. `rg foot|sole crates/shotloom-character-model-normalizer/src/` returned only the rustdoc prose — the actual foot/sole code was in `shotloom-gltf::vrm_extract` and deferred to a later step. `Cargo.toml`'s `description` correctly omitted foot work, so the two source-of-truth surfaces (rustdoc, Cargo.toml) described the same crate differently. Fix: rewrote the lead to match Cargo.toml's three-responsibility framing exactly, and split current scope from future scope into separate paragraphs so the symmetry survives later edits.

### A4 — PR description must match committed file layout

The PR body lives in GitHub's database, not in git. It does not auto-update when you change a file. If you commit a file the PR body claims is gitignored, or rename a fixture the PR body still references, the body is wrong.

**Self-check:** before push, diff your PR body against `git ls-files crates/<changed-crate>/`. Anything in the body that names a path/file/extension must resolve in `ls-files`.

**Real defect:** PR #66 body said `examples/fixtures.json` was gitignored and contributors copy from `fixtures.example.json`, but the actual layout was a committed `fixtures.json` with LFS-tracked assets. Caught twice — once on the file, once on the README.

### A6 — Numeric claims in comments must be traceable

Any comment that makes a quantitative claim ("~12 MB per bone", "~55 minutes of animation", "~3x faster", "~100k rows") must be re-derivable from `std::mem::size_of`, a constant, or a linked benchmark. Off-by-4x memory estimates and off-by-10x perf estimates are both common and poison future capacity planning.

**Self-check:** for every numeric comment in touched files, re-derive the number inline. Prefer `approximately 28 bytes per frame (Quat + Vec3 at 4x + 3x f32)` over `approximately 12 MB`.

**Real defect (PR #72):** `MAX_FRAME_COUNT` comment in `shotloom-fbx-anim-importer/src/types.rs` estimated "~12 MB per bone track" at 100k frames. Actual per-bone shape is `Quat (16 B) + Vec3 (12 B) + padding ≈ 32 B`, so ~3.2 MiB per bone — 4x smaller than claimed.

### A5 — Test name must describe the test setup

A test named `single_root_no_children` whose body builds an empty `HashMap` is lying about what it covers. A future maintainer reading the name will assume the wrong invariant.

**Self-check:** for every `#[test] fn name() { ... }`, ask: "does the body actually exercise what the name promises?" Rename or extend the body — never both.

**Real defect:** `topo.rs::single_root_no_children` built an empty map; renamed to `empty_map_returns_empty_order` with matching comment.

### A7 — Documented error-handling contract must match implementation

If a rustdoc on a `Result`-returning function promises defensive behavior ("Returns `Err` if...", "exists for API consistency and defensive robustness", "validates..."), the body must actually return `Err` on those inputs — not panic via direct `[]` indexing, `unwrap()`, or arithmetic overflow. A `Result` return type is a contract; unreachable-by-current-invariant is not the same as unreachable-by-type. This is especially load-bearing when:

- The invariant that makes the panic "unreachable" lives in a **different function** (a builder, a validator) that callers can bypass.
- The struct field feeding the index is `pub` (callers can mutate it after construction) or deserialized from untrusted bytes.
- The doc literally names the error variant the function is supposed to return.

**Self-check:** for every `pub fn ... -> Result<_, E>` in touched files, grep the body for `[`, `.unwrap(`, `.expect(`, and unchecked arithmetic. For each hit, ask: "if an adversarial caller constructs the input, does this panic or return `Err`?" If the doc promises `Err`, the body must use `.get(i).ok_or(...)?`, `checked_add`, etc. Do not rely on "an upstream builder guarantees this" unless the builder is the only constructor AND the relevant field is private.

**Real defect (PR #85):** `vrm_rest::build_from_bytes` doc promised *"Returns `VrmRestError` if the GLB JSON structure is inconsistent... `Result` exists for API consistency and defensive robustness"*, but the body used `locals[node_index]` and `global_mats[node_index]` at four sites. The invariant came from `build_humanoid_node_map`, and `HumanoidMap.node_to_vrm` was `pub` — so the panic was reachable. Fix: replace each `v[i]` with `v.get(i).ok_or_else(|| VrmRestError::InvalidHumanoidNodeIndex { ... })?` and reuse the existing error variant.

### A8 — Category-changing rename: sweep the concept word, not just the identifier

When a rename crosses a **category boundary** — "importer" → "parser", "service" → "worker", "handler" → "dispatcher", "client" → "consumer" — the hyphenated identifier is only half of the drift surface. The other half is the English-language self-description in package metadata, module headers, README ledes, and ADR prose. Those surfaces use the *word* ("importer"), not the *token* ("foo-bar-importer"), so a token-only `rg` reports clean while the crate still describes itself as the old category.

**Self-check:** for every rename PR whose rationale is "the old name describes the wrong category", identify the old role-noun (the category word) and grep each touched crate for that word as a whole word (`rg -w <word>`). Cover at minimum:

- `Cargo.toml` — `description`, `keywords`, any doc comment above `[package]`
- `src/lib.rs` / `src/mod.rs` — `//!` headers (first ~30 lines)
- `README.md` — lede (first 3–5 lines) and the "Scope" / "Purpose" section
- ADR prose paragraphs that name the crate (don't limit to ADRs edited in this PR — sibling ADRs that reference the renamed crate also drift)
- Cross-crate docs that name the crate by role: `MAP.md`, guideline files, tech-debt entries

A single rename PR that fails A8 signals the whole point of the rename is half-delivered: the name changed, but the self-description still asserts the old category.

**Real defect (PR for STL-172):** crate renamed `shotloom-fbx-anim-importer` → `shotloom-fbx-anim` because "Layer 1 is a parser, not an importer; `shotloom-import` is the importer." Initial commit swept the hyphenated identifier across 28 files cleanly. Token-only self-review reported all 22 patterns clean. Concept-word sweep (`rg -w importer crates/shotloom-fbx-anim/`) then found three residual self-descriptions still calling the crate an "importer": the `Cargo.toml` package `description`, the `README.md` lede, and the `src/lib.rs` `//!` header. Fix: rename the role-noun in all three to "parser" in a follow-up commit on the same branch.

### A9 — Parsed / derived struct fields must be cross-checked or dropped

If a parser populates struct fields (`schema_version`, `source_path`, `expected_frame_count`) and the consumer never validates or correlates them, those fields are dead weight pretending to be a contract. A schema bump, a fixture-path swap, or a hand-edit that desyncs the header from the body silently loads stale data — the parser reports success and the compare/consume stage can't see the drift.

The same failure mode applies to **derived summary fields** (a top-level `frame_count` that should equal `max(bones[i].rotations.len())`): if the consumer only checks the per-bone fields, the summary floats free and a reviewer can't tell from reading the output whether it was asserted or just copied.

**Fix options (pick one; don't leave the field as dead weight):**

1. **Cross-check at parse time** — validate version/identity fields against the current compile-time constant, matching whatever other validation the parser already does (e.g., `bone_count` equals the length of the bone array):
   ```rust
   if golden.schema != SCHEMA_VERSION {
       return Err(format!(
           "snapshot schema {} but this test expects {SCHEMA_VERSION} — regenerate via {REGEN_ENV_VAR}=1",
           golden.schema
       ));
   }
   ```
2. **Assert in the compare stage** — for derived summary fields, recompute from the current data and emit a structural diff on mismatch.
3. **Drop the field** — if neither the parser nor the consumer has a use for it, remove it from the struct + file format entirely.

**Self-check:** for every parser `fn parse(...) -> Result<Struct, _>` in touched files, list the fields it populates and grep the rest of the module for each field name. Every field must be either read-and-validated, read-and-cross-checked against a derived value, or deleted.

**Real defect (PR #172, comments 3140687008 + 3140687021):** `body_retarget_regression.rs::Golden::parse` populated `schema`, `vrm`, `fbx`, and a top-level `frame_count` field. Only `bone_count` was cross-checked; the other four silently floated. A `SCHEMA_VERSION` bump or a `VRM_RELATIVE` / `FBX_RELATIVE` swap without regen would have loaded a stale golden with no error. Fix: added schema / vrm / fbx equality checks next to the existing `bone_count` check, and added a `max(per-bone frame_count) == golden.frame_count` assertion in `compare()`.

---

## Pattern B — Classifier / dispatch asymmetry

**You build buckets based on a classifier, then ignore the buckets in one branch.** This pattern hides because three out of four strategy branches honor the classification — only one is wrong, and tests of the other three pass.

### B1 — Every bucket built by the classifier must be the *only* input to its handler

If you write:
```rust
let mut direct_bones: Vec<String> = Vec::new();
let mut curl_bones: Vec<String> = Vec::new();
for item in &all_items {
    match classify(item) {
        Strategy::Direct => direct_bones.push(item),
        Strategy::Curl   => curl_bones.push(item),
        Strategy::Skip   => {}
    }
}
```
then **every** downstream consumer must read from the bucket, not from `all_items`. A handler that takes `all_items` directly silently bypasses the classifier — config rules like `("*Index*", "Skip")` become silent no-ops.

**Self-check:** for every `match classify(...)` block that builds buckets, grep the function body for re-uses of the original collection. Each re-use is a bug candidate.

**Real defect:** Stage 4 ScalarCurl branch passed the raw `axis_map` into `apply_in_place`, ignoring the `curl_bones` list the classifier built. DirectCopy and UserCalibrated branches honored their classifications; only ScalarCurl was asymmetric.

### B2 — Early returns must not swallow downstream stages

If a function runs N stages and stage K bails early, stages K+1..N are dropped silently. This is correct only when every later stage genuinely depends on K. Most "no work for stage K" cases should warn-and-continue, not return.

**Self-check:** every `if foo.is_empty() { return ...; }` near the top of a multi-stage function — ask "does this skip work that the *other* stages also need to do?"

**Real defect:** `align_full_body_rest` returned early when `axis_map` was empty, dropping DirectCopy and UserCalibrated for rigs without finger candidates. Only ScalarCurl actually needed `axis_map`.

### B3 — Helper `assert!` / `panic!` on edge input must not preempt the caller's structured error path

When a helper is called from a pipeline whose *whole purpose* is to produce a readable diff/report on bad input (a test comparator, a validator, a diagnostics collector), `assert!(x > 0, ...)` or `panic!("bad input")` inside the helper throws away the caller's error-reporting value. The test fails with a raw backtrace that doesn't name the offending entity (bone, row, field) — exactly the thing the pipeline was designed to surface.

This hits hardest in **two-stage diff pipelines**:
```
stage 1: collect current state into a comparable shape (may touch helpers)
stage 2: compare against golden, accumulate per-item diffs, render a report
```
If stage 1 panics on an edge input (zero-length track, missing field, duplicate key), stage 2 never runs and the report never prints. The test's diff machinery is wasted — you get a Rust backtrace instead of "bone `J_Bip_R_Hand`: frame_count 1764 → 0".

**Fix pattern:** helpers in a diff/validate pipeline should accept edge inputs and produce a value the comparator can flag:
```rust
fn sample_positions(frame_count: usize) -> Vec<usize> {
    if frame_count == 0 {
        return Vec::new(); // caller's compare() will surface `frame_count 0` per bone
    }
    ...
}
```
Keep `assert!` / `panic!` for *pipeline-wide invariants* that genuinely can't be reported per-item (e.g. the fixture file is missing entirely) — not for per-item edge cases the comparator was written to handle.

**Self-check:** for every helper called from a test/validator pipeline, ask "if this input is degenerate, does the caller's report surface it more cleanly?" `rg 'assert!\(.+>\s*0' crates/<changed-crate>/tests/` is a good starting point.

**Real defect (PR #172, comment 3140687015):** `sample_positions(0)` had `assert!(frame_count > 0, "cannot sample an empty rotation track")`. A future retargeter regression that emitted a zero-frame bone would panic from inside `Golden::from_animation` before `compare()` ran — the test's otherwise-polished diff report with bone name + frame-count mismatch never printed. Fix: return `Vec::new()` and let `compare()`'s existing `rotations.len() != expected.frame_count` branch surface the bone name and `0 → N` delta.

---

## Pattern C — Silent fallback in the hot path

**`unwrap_or`, `normalize_or_zero`, `_ => Default::default()`, `.get(idx).copied().unwrap_or(0.0)` — every one of these is a silent value substitution that a reviewer will trace through to find a wrong answer.** Reviewers (especially Copilot) flag these by default.

### C1 — `unwrap_or(default)` on a missing collection is a bug magnet

If `vec.get(i).copied().unwrap_or(default)` returns `default` when `i >= vec.len()`, ask: does `default` equal a value that has *real meaning* downstream? If yes, you've conflated "missing" with that meaning, and the math will be wrong on missing data.

**Self-check:** grep `unwrap_or\|or_default\|unwrap_or_default` in changed files. For each match, trace the default value into its consumer. If the consumer interprets the default as a valid measurement, raise it to a `match` with a real "missing" branch.

**Real defect:** ground-contact weighting for the toe track did `source_toe_*_y.get(frame).copied().unwrap_or(toe_rest_*)` — when the source rig had no toe bones, the vec was empty and every frame fell through to `toe_rest_*` (which was `0.0`). `(0.0 - 0.0).abs() < margin` was always true → `target = 1.0` → ground correction applied unconditionally. The fix was to guard at setup time with an explicit "VRM target lacks leftToes/rightToes" early check.

### C2 — `normalize_or_zero()` followed by a magnitude check is meaningless

`Vec3::normalize_or_zero()` returns either a unit vector or `Vec3::ZERO`. Checking `result.length_squared() > 0.5` after this collapses to "input was not literally zero" — sub-millimeter offsets pass the check and feed numerically unstable operations like `Quat::from_rotation_arc` near-degenerate inputs.

**Self-check:** grep `normalize_or_zero` and audit the *next 5 lines* for any magnitude condition. If found, move the epsilon test to the *raw* delta before normalizing.

**Real defect:** `compute_virtual_rest_global` did exactly this. Fix: check `(cp - bp).length_squared() > 1e-8` first, then `normalize()`.

### C3 — Wildcard `_ =>` arms in config parsing must warn, not skip

```rust
match strategy_name.as_str() {
    "ScalarCurl" => Strategy::ScalarCurl,
    "DirectCopy" => Strategy::DirectCopy,
    "Skip"       => Strategy::Skip,
    _            => Strategy::Skip, // ← config typo → silent skip
}
```
A user who writes `"ScalaCurl"` in a JSON config gets zero feedback and a confused "why isn't my rule applying?" debug session.

**Fix options (in increasing strictness):**
1. **Warn-at-entry** — keep the per-bone classifier infallible, but add a `validate_*_rules(config)` walk that runs once per pipeline entry and pushes a warning per unknown name. This is the minimum.
2. **Return `Result`** — make the classifier fail loud at parse time.
3. **Serde enum** — deserialize directly into an enum so serde validates at config-load time. Strictest, but requires touching all callers.

**Self-check:** every `match name.as_str() { ... _ => default }` in a config-parsing path is a candidate.

**Real defect:** `rest_sync_strategy` had `_ => Skip` with no warning surface. Fixed by adding `parse_strategy_name` + `validate_rest_sync_rules` called once at Stage 4 entry.

### C4 — `HashMap::insert` / `BTreeMap::insert` with discarded return silently overwrites on duplicate key

Building a lookup table with `map.insert(k, v);` and discarding the return value means a second entry with the same key wipes the first with no signal. If the keys come from data that is *supposed* to be unique (deduped bone names, stage IDs, asset handles), the ignored `Option<V>` is the only place the duplicate is detectable — and the later consumer can't tell 1 → 1 from N → 1.

This bites hardest in test or diagnostic code that exists specifically to catch upstream regressions: the test index silently absorbs the duplicate, and the very class of bug the test is meant to catch becomes invisible.

**Fix pattern:**
```rust
if map.insert(k, v).is_some() {
    report.structural.push(format!("duplicate `{k}` in output"));
}
```
Or, when building a final map: collect into a `Vec<(K, V)>` and assert uniqueness, or use `map.entry(k).or_insert(v)` if "first wins" is the intended semantic.

**Self-check:** `rg '\.insert\([^)]+\);$' crates/<changed-crate>/` — every hit where the key is supposed to be unique is a candidate. Pay special attention when the map is built from user output / retargeter output / any collection whose upstream contract is "no duplicates."

**Real defect (PR #172, comment 3140687013):** `current_by_name.insert(&bone.vrm_bone_name, &bone.rotations);` in the body retarget regression test built a lookup map by `vrm_bone_name`. If the retargeter ever emitted two bones with the same name (the exact regression class this test was written to guard against), the second silently overwrote the first and the later compare-loop could not see the duplicate. Fixed by checking `.is_some()` on the return and pushing a structural diff.

---

## Pattern D — Library hygiene

**Library crates have stricter rules than binaries.** They're consumed in WASM, in test harnesses, in tooling that doesn't want surprise stderr noise — anything that "just works" in a CLI may break a downstream caller.

### D1 — No `eprintln!` / `println!` in library code

Library crates must not write to stdout/stderr directly. Reasons: (1) WASM/browser embeds get noise they can't filter, (2) test harnesses get polluted output, (3) callers lose the ability to redirect or suppress, (4) async runtimes get unexpected blocking IO.

**Fix pattern:** collect lines into a `Vec<String>` log that the caller receives via the return value. Let the caller decide whether to `eprintln!` them or pipe them to a tracing facade.

**Self-check:** `rg '\beprintln!|\bprintln!|\bdbg!' crates/<changed-crate>/src/`. Zero hits expected. Examples and binaries are exempt; tests are exempt.

**Real defect:** `ArpRetargeterInner::new_with_options` had `eprintln!` for adapter diagnostics. Refactored to push into `init_log` only.

### D2 — No `unwrap()` / `expect()` on library hot paths

Per Shotloom's `review-rust.md` P0: library code (non-test, non-example) must not call `.unwrap()` or `.expect()`. The exception is when an invariant is upheld elsewhere in the same function and a comment explains it — but even then, prefer `[idx]` indexing (which panics with a clearer location) or `match` with a `RetargetError` variant.

**Self-check:** `rg '\.unwrap\(\)|\.expect\(' crates/<changed-crate>/src/ --type rust | grep -v test`.

### D3 — Mixed-language source comments

If the surrounding crate / repo / docs are English-only, every new `//` comment must also be in English. Korean, Japanese, etc. block non-native maintainers from understanding the code's *rationale* (the WHY that a future reader cannot reconstruct from the code itself).

**Self-check:** `rg '[가-힣]|[ぁ-んァ-ン一-龯]' crates/<changed-crate>/src/`. Zero hits expected for English-only crates.

**Real defect:** `mapping.rs` had Korean comments left over from the bevy-vrm port — bind-override rationale, finger recompute helper. Translated in 341bcf2.

### D4 — `#[allow(dead_code)]` needs a comment block explaining when it can be removed

Bare `#[allow(dead_code)]` is a code smell. Every instance must have a sibling comment explaining: (1) why the dead code exists, (2) which future caller will activate it, (3) when the allow can be removed.

**Real defect:** Earlier round of PR #66 had bare `#![allow(dead_code)]` at module roots; reviewer made every one carry a justifying STL-74/STL-75 reference block.

**Real defect (PR #178, comment 3145053791):** `shotloom-character-model-normalizer/src/arp_vrm.rs` carried a "backwards-compatible aliases for older callers" block (`pub use align_full_body_rest as align_finger_rest;` + `pub type FingerRestOverride = RestAlignOverride;`) with `#[allow(unused_imports)]` on the alias. `rg 'align_finger_rest|FingerRestOverride'` returned only the declaration sites — zero callers anywhere in the workspace. Two compounding defects: (1) the `#[allow(unused_imports)]` cannot fire on a `pub use` (the re-export is itself part of the public API), so the `allow` was decorative; (2) the "older callers" comment had no referent inside the repo — the aliases were dead-on-arrival. Fix: deleted the entire block. The dead-`allow` is the louder signal that the surrounding code is also dead.

### D5 — No `#[non_exhaustive]` on workspace-internal types

`docs/guidelines/error-handling.md` §6 (and §11's forbidden-anti-patterns list) is explicit: `#[non_exhaustive]` is **off by default inside this workspace**. It is meant for types that cross a SemVer boundary to non-workspace consumers (published crate, FFI/plugin API). Shotloom's crates are atomically built, so the annotation only suppresses the compiler exhaustiveness check — a new variant silently falls into `_ =>` catch-alls instead of producing a compile error. That is exactly the safety net the guideline wants preserved.

The correct lever for boundary decoupling is **not re-exporting the type** across crates (keep it qualified as `other_crate::Error`). If a guideline exception is genuinely needed for a specific type, document it in `error-handling.md` with rationale — do not add the attribute silently.

**Self-check:** `rg '#\[non_exhaustive\]' crates/<changed-crate>/src/`. Zero hits expected. If the attribute is present, grep for any `pub use other_crate::Error` that may have motivated it — remove the re-export, not the exhaustiveness check.

**Real defect (PR #118):** `VrmRestError` in `shotloom-gltf` was marked `#[non_exhaustive]` to protect `shotloom-retarget::build_from_bytes` from future variant additions. Reviewer flagged it as P1 blocking per error-handling.md §6. Fix: remove `#[non_exhaustive]`; the already-applied re-export drop from `shotloom-retarget::lib` alone achieves the desired decoupling.

### D6 — Umbrella plugin must not re-export internal asset paths or sub-plugins

When a "facade" plugin (`MaterialsPlugin`, `ShotloomVrmPlugin`) wraps internal plugins to enforce an invariant — e.g. ADR-0031 Decision #4 *"one shared `Handle<StandardMaterial>` constructed at startup, read by callers via `Res<PlaceholderMaterial>`"* — every public sibling of the canonical entry point becomes an alternate route that silently defeats the invariant. Two specific shapes recur:

1. **`pub const ASSET_PATH: &str = "..."`** re-exported from the crate root. A caller can `asset_server.load(ASSET_PATH)` and wrap their own `StandardMaterial` around it — same image, **different material handle**, ADR violated with no compile-time signal.
2. **`pub struct InnerPlugin`** re-exported alongside the umbrella plugin. A caller can `add_plugins(InnerPlugin)` instead of the umbrella, bypassing whatever wiring the umbrella adds (resource init order, cross-cutting `add_systems`, additional sub-plugins).

The fix is the umbrella precedent already used in the same crate: re-export only the umbrella plugin and the read-only Resource; demote everything else to `pub(crate)`. Sibling examples in `shotloom-engine`: `ShotloomVrmPlugin` hides `VrmPlugin`, `DEBUG_CHARACTER_VRM_PATH` is `pub(crate)`.

**Self-check:** for every new or modified `pub use` line in a crate's `lib.rs` / `mod.rs`, walk each re-exported item and ask: *"is this item the only path to the invariant the umbrella plugin owns?"* If the item is a path constant, a sub-plugin, or anything else the umbrella plugin's contract assumes nobody else touches, demote it to `pub(crate)`. Then verify there is no other crate already importing it — if there is, the demotion is a public-API break and must be reviewed first. `rg 'pub use [a-z_]+::\{[^}]*PATH' crates/<changed-crate>/src/` and `rg 'pub use [a-z_]+::\{[^}]*Plugin' crates/<changed-crate>/src/` are good starting greps.

**Real defect (PR #166, comment 3140592023):** [`shotloom-engine/src/lib.rs`](https://github.com/CINEV/shotloom/blob/main/crates/shotloom-engine/src/lib.rs) re-exported `MaterialsPlugin, PlaceholderMaterial, PlaceholderMaterialPlugin, PLACEHOLDER_CHECKER_PATH` from `materials::*`. Reviewer flagged P1 blocking: the path constant + inner plugin gave callers two ways to bypass the "one shared handle" invariant ADR-0031 Decision #4 promised. Fix in d19aa39: re-export reduced to `MaterialsPlugin, PlaceholderMaterial`; the constant and inner plugin are `pub(crate)`.

**Real defect (PR #178, comment 3145053788):** `shotloom-character-model-normalizer/src/lib.rs` declared `pub mod arp_vrm; pub mod arp_vrm_user_pose; pub mod finger_axis_map; pub mod finger_rest_align;` alongside a curated `pub use arp_vrm::{align_full_body_rest, RestAlignOverride}; pub use finger_axis_map::FingerAxisEntry;`. The `pub mod` declarations made every `pub` item under each submodule (`RestSyncStrategy`, `DEFAULT_POSE`, `compute_overrides`, `apply_in_place`, …) reachable as `shotloom_character_model_normalizer::arp_vrm::*` — a strictly larger surface than the curated re-export contract advertised. Each moved file's `#![allow(dead_code)]` justification claimed the public surface was "reachable via this crate's `lib.rs` re-exports", which the over-broad `pub mod` rendered untrue. Same shape as D6: the curated public surface had two routes (the `pub use` line *and* the `pub mod` path) and only one was load-bearing. Fix: flipped all four to `pub(crate) mod`, matching the donor crate (`shotloom-retarget/src/lib.rs`)'s `pub(crate) mod foo;` + explicit `pub use foo::Item;` pattern. Generalizes D6 from "umbrella plugin" to any crate whose contract is "the `pub use` block is the surface" — `pub mod` next to a curated `pub use` is itself the smell.

### D7 — Invariant-bearing `Resource` fields must be private with accessor

When a `Resource` exists to enforce a "one X constructed at startup, read-only by callers" contract — `PlaceholderMaterial(pub Handle<StandardMaterial>)`, `BridgeResource`, `ShotEntityIdComponent`, `EngineUploadStaging`, `DebugCharacterCounter` — a `pub` tuple field or `pub` named field lets any system holding `ResMut<TheResource>` overwrite the invariant at runtime with zero compile-time signal. There is no `Resource`-level "frozen after init" attribute; the only way to make the invariant a *type-level* contract is to close the field.

The codebase convention for invariant-bearing Resources is:

```rust
#[derive(Resource, Clone, Debug)]
pub struct PlaceholderMaterial {
    handle: Handle<StandardMaterial>,
}

impl PlaceholderMaterial {
    pub(crate) fn new(handle: Handle<StandardMaterial>) -> Self {
        Self { handle }
    }

    pub fn handle(&self) -> &Handle<StandardMaterial> {
        &self.handle
    }
}
```

Avoid `impl Deref<Target = Inner>` on the Resource — `Deref` re-opens the *"is this the canonical handle or a clone with different identity"* ambiguity the private field exists to eliminate.

**Bag-of-data Resources** (configuration values, DTO-like state with no invariant the runtime relies on) may keep `pub` fields. The pattern fires only when the Resource's docstring or owning ADR makes a *uniqueness* / *identity* / *constructed-once* claim.

**Self-check:** for every `#[derive(Resource)]` in the diff, read the type's docstring and the ADR it cites. If the contract uses words like *"one"*, *"shared"*, *"canonical"*, *"constructed at startup"*, *"invariant"*, the field must be private with a `pub(crate) fn new` + `pub fn accessor(&self) -> &Inner`. `rg '#\[derive\([^)]*Resource[^)]*\)\]' -A 2 crates/<changed-crate>/src/` lists every Resource — check each.

**Real defect (PR #166, comment 3140592033):** [`shotloom-engine/src/materials/placeholder.rs`](https://github.com/CINEV/shotloom/blob/main/crates/shotloom-engine/src/materials/placeholder.rs) defined `pub struct PlaceholderMaterial(pub Handle<StandardMaterial>);`. Reviewer flagged P1 blocking: any system with `ResMut<PlaceholderMaterial>` could swap `.0` to a different handle, breaking ADR-0031 Decision #4's "one shared handle" invariant at runtime. Fix in d19aa39: closed the field, added `new()` (pub(crate)) + `handle()` (pub) accessor; in-file test reads via `resource.handle()`.

### D8 — Recursive walk of caller-influenced graph data must short-circuit on cycles

A DFS / recursive helper that walks a graph built from caller-supplied data (`HashMap<String, String>` parent maps, bone hierarchies parsed from imported assets, scene-graph node references read from glTF / VRM / FBX) must mark each node as visited *before* recursing into the next neighbour. The opposite order (recurse first, mark second) infinite-recurses on any cyclic input — A → B → A enters `visit("A")`, recurses into `visit("B")`, recurses back into `visit("A")`, and the visited check is still false because the first call has not reached its `insert` line. Stack overflow.

Today's caller may sanitize cycles upstream — but if the function is `pub` (or becomes reachable via a future `pub use`), an adversarial or buggy caller can trigger the panic. The fix is one line and converts a pathological cycle into a deterministic short-circuit at the second visit.

**Fix pattern:**
```rust
fn visit(node: &str, ..., visited: &mut HashSet<String>, ...) {
    if visited.contains(node) {
        return;
    }
    // Mark BEFORE descending — a cyclic input would otherwise re-enter
    // this node before the original call reaches its insert line.
    visited.insert(node.to_string());
    if let Some(parent) = parent_map.get(node) {
        visit(parent, ..., visited, ...);
    }
    // post-order work goes here
}
```

**Self-check:** for every recursive helper in changed files that takes a caller-supplied `HashMap` / `Vec` of parent / child / neighbour relationships, locate the `visited.insert` line and confirm it appears *before* the recursive call. If insert is after recurse, write a 2-line test with a deliberate cycle and assert termination.

**Real defect (PR #178, comment 3145053784):** `shotloom-character-model-normalizer/src/arp_vrm.rs` `topo_sort_bones`'s inner `visit` helper inserted into `visited` *after* the recursive `visit(parent, …)` call. The single in-tree caller (`shotloom-gltf::vrm_extract`) rejected cycles upstream, so the bug was unreachable in production. But `align_full_body_rest` is a `pub` API and the crate's rustdoc forward-references future `ImportedVrmAsset` callers — a future caller passing a malformed parent_map would stack-overflow with no diagnostic. Fix: moved `visited.insert(bone.to_string())` before the parent recursion; added two tests (cycle-termination + acyclic-ordering-preserved) to lock the fix.

---

## Pattern E — Build / platform regressions

### E1 — New dev-dependencies must not pull in OS-system packages on Linux CI

Heavy graphics / audio / input crates (`bevy`, `winit`, `cpal`, `gilrs`) often default-enable features that link `alsa-sys`, `libudev-sys`, `libxkbcommon`, etc. These need OS packages (`libasound2-dev`, `libudev-dev`) that GitHub Actions ubuntu-latest does **not** install by default. CI explodes.

**Self-check before push:**
1. `cargo metadata --filter-platform x86_64-unknown-linux-gnu` and grep for `alsa-sys|udev-sys|gilrs|cpal` in the output.
2. If any appear, set `default-features = false` on the offending dep and explicitly enumerate the features you actually need.
3. Verify with `cargo tree -i alsa-sys` (etc.) returning nothing.

**Real defect:** Initial PR #66 push pulled `bevy` defaults via the smoke viewer dev-dep. CI failed on `alsa-sys`. Fix: narrow features to `default_app + default_platform + 3d_bevy_render + scene` and re-resolve `Cargo.lock`.

### E2 — `Cargo.lock` must match `Cargo.toml` after dep-tree changes

If you narrow features in `Cargo.toml` but forget to re-resolve `Cargo.lock`, the lockfile still pins the old transitive deps and CI sees the old graph. `cargo check` locally won't catch this if the deps are already cached.

**Self-check:** after any `Cargo.toml` dep change, run `cargo update -p <crate>` (or delete and re-resolve `Cargo.lock`) and commit the lockfile in the *same commit* as the `Cargo.toml` change.

**Real defect:** Even after the bevy feature narrow, `Cargo.lock` still listed `alsa`, `alsa-sys`, `bevy_audio`, `cpal`. Required a follow-up `chore: regenerate Cargo.lock` commit.

### E3 — Windows portability on filesystem ops

Shotloom ships a Windows desktop target (Tauri). Any `fs::rename` into an existing path, `Path::canonicalize` compare, `fs::symlink`, or permissions manipulation must work on Windows, not just POSIX. The classic trap: POSIX `rename` atomically replaces an existing destination; Windows errors out. macOS-only dev blinds the reviewer because local tests pass.

**Self-check:** for every `fs::rename` / `fs::symlink` / permissions call, ask "does this work on Windows?" Prefer designs that make overwrite unnecessary (content-addressable caches that only write once) over `cfg(windows)` branches.

**Real defect (PR #72):** `write_artifact_atomically` used "rename; if failed and dest exists, delete dest and retry" — on Windows that becomes "first rename always fails, delete the good cache, retry, if retry fails lose everything". Fixed by removing the overwrite path entirely (content-addressable cache never overwrites).

---

## Pattern F — Cross-crate & inherited-pattern hygiene

**Bugs that hide at crate boundaries or get copied verbatim from a sibling.** None of Patterns A–E catch these because each pattern only sees one file.

### F1 — Cross-layer silent fallback

A parser / input layer accepts a value (enum, index, tag, order) whose validity range depends on a downstream catch-all fallback in a sibling crate. Neither layer alone treats an out-of-range value as an error: the parser trusts the consumer, the consumer trusts the parser.

**Self-check:** for every narrow integer (`u8`, `u16`, enum discriminant) your parser stores, grep downstream consumers in sibling crates for catch-all match arms on that value. If a downstream fallback exists, validate at the parser boundary instead.

**Real defect (PR #72):** `shotloom-fbx-anim-importer/src/parse/model.rs` parsed FBX `RotationOrder` as `i32` → `u8` with no range check. `shotloom_retarget::euler_to_quat` had a catch-all silently rewriting any out-of-range value to `XYZ`. Malformed rigs got plausible-but-wrong FK output. Fix: `0..=5` check at the importer, return `Error::Parse`.

### F2 — Architectural invariant drift after mirroring

When you mirror a pattern from a sibling crate, the data invariants may have diverged. Inherited defensive code (a `fs::read` + byte-compare + rewrite chain, a `HashMap::contains_key` guard after `entry().or_default()`) looks intentional and gets left untouched by reviewers, but does real I/O / allocation work for a branch that can never trigger — or worse, masks a divergence that makes the check load-bearing in one place and redundant in another.

**Self-check:** when mirroring a pattern, re-derive the invariants first. Ask "is this defensive check still load-bearing given what this crate stores?" Look specifically for `read + compare + rewrite` on content-hash paths.

**Real defect (PR #72):** `shotloom-import/src/fbx.rs` inherited VRM import's `fs::read + byte-compare + rewrite` path. VRM caches post-normalization bytes (compare is load-bearing: same source hash can legitimately produce different normalized bytes). FBX caches raw source bytes keyed by source sha256 (same hash always means same bytes — compare is redundant I/O on every non-first import). Fix: existence check only, write once on miss.

### F3 — Mirrored-pattern inheritance

"We just followed the existing sibling" is presented as a reason not to audit. A new crate's module structure, error shape, cache layout, or validation flow is labelled "mirrors import_vrm_to_cache" / "same as shotloom-gltf" without an explicit review of the source. Every bug in the source becomes your bug in the mirror, and the mirror gets reviewed against the mirror target rather than against the actual invariants.

**Self-check:** for every mirrored pattern, open the source and read it with review glasses before copying. Pattern A–F findings in the source are especially likely to propagate. When you find defects in the source, either fix in both places or open a follow-up issue — do not silently inherit.

**Real defect (PR #72):** `fbx.rs::write_artifact_atomically` was lifted verbatim from `import_vrm_to_cache`. Both had the same "if second rename fails you lose the cache" bug. FBX self-review caught it on the FBX side but did not open a parallel VRM ticket because VRM was "existing, out of scope".

---

## Pattern G — Structural / convention coherence

**The PR's code is correct in isolation but drifts from the repo's structural rules.** Each failure here is a reviewer round-trip even when the code itself is fine, because the repo has a published shape that reviewers enforce. Always read `CONTRIBUTING.md`, `AGENTS.md`, `docs/guidelines/*.md`, and `docs/adr/README.md` before opening the PR; repo-local rule files in `~/.claude/rules/<repo>-*.md` override the generic ones.

### G1 — New files land in the crate responsible for the concern

Every new Rust file must match the responsibility of its owning crate per the repo's ADRs and recent precedent. Do not drop a parsing helper into the runtime crate because it is convenient; do not add a retarget-only sentinel to the gltf parsing crate.

**Self-check:** for each new file, `git log --oneline -- crates/<crate>/` the last few merges — does the crate's existing content look like your new file? If no, either move the file or justify the expansion in the PR body.

**Real defect (PR #85):** `shotloom-gltf::vrm_extract` hardcoded `"VRMC_vrm.root_bone"` despite ADR-0025 saying gltf is retarget-agnostic. The string belonged in `shotloom-retarget::mapping`. Flagged P1 by reviewer, tracked as STL-114.

### G2 — Commit subject + body match `docs/guidelines/commit-guideline.md`

Conventional commits, lowercase type+scope, imperative mood, subject ≤ 80 characters, no trailing period, blank line before body, body wraps at 80 characters. Breaking changes need both `!` in subject and `BREAKING CHANGE:` in body. Linear IDs go in the footer (`Related to STL-NN`), not the subject.

**Self-check:** `git log origin/main..HEAD --format='%s%n%b%n---'` — visually audit each subject against the guideline and verify footers exist where expected.

### G3 — PR title + body match the repo's recent merged pattern

PR title format, section headings (`## Summary`, `## Test plan`, `## Validation`), checkbox list formatting, and footer (`Related to STL-NN` / `Closes STL-NN`) vary by repo. Match the last 3–5 merged PRs in the same repo. A PR with the wrong body shape draws a review round-trip even when the code is perfect.

**Self-check:** `gh pr list --state merged --limit 5 --json title,body` before drafting. Copy the section skeleton from whichever merged PR is most similar in scope.

### G4 — Branch name follows repo convention, not Linear's auto-suggestion

Shotloom: `feat/<description>`, `fix/<description>`, `refactor/<description>`, `chore/<description>`, `release/vX.Y.Z` — **no STL-NN prefix**. Linear's auto-generated `deemo/stl-NN-*` is a UI hint, not the canonical branch name. Other CINEV repos may have different conventions; check CONTRIBUTING before creating.

**Self-check:** `git rev-parse --abbrev-ref HEAD` and compare against `grep -E '^(feat|fix|refactor|chore)/' <(git branch -r)` recent entries. Rename locally before pushing if needed.

### G5 — ADR / tech-debt register kept current with structural moves

When a PR moves, deletes, or re-owns code across crate boundaries, the architectural record must move with it:
- A new boundary decision → new ADR under `docs/adr/` with an entry in `docs/adr/README.md`.
- A resolved structural debt → the tech-debt file is **deleted** (not marked Resolved) and the `docs/tech-debt/README.md` entry removed. The resolution lives in the commit/PR history and the related ADR.
- A new structural debt accepted in this PR → a new `docs/tech-debt/<slug>.md` file plus a README register entry.

**Self-check:** for each cross-crate file move, cross-crate API shape change, or "this is a boundary decision" comment in the PR body, ask "does `docs/adr/` or `docs/tech-debt/` reflect this?" If no, add or remove the artifact in the same PR.

**Real defect (PR #85):** `docs/tech-debt/vrm-rest-extraction-boundary.md` was left marked "Resolved" after the refactor landed; reviewer asked to delete it per `docs/guidelines/documentation-standard.md` §5.9. Fixed in 5abada1.

### G6 — Doc paths referenced in docs / comments resolve

Every `docs/...` / `crates/...` / `scripts/...` path in a changed markdown file or Rust comment must point to something that actually exists at commit time. Shotloom runs `node scripts/validate-doc-paths.mjs` both pre-commit and in CI, but Rust `///` comments and ADR cross-links can still drift.

**Self-check:** `node scripts/validate-doc-paths.mjs` locally after the final commit, plus `rg -o '\`(docs|crates|scripts)/[^\`]+\`' <(git diff origin/main..HEAD)` + `ls` spot-check for Rust comment refs.

### G7 — Bug-fix PRs ship a regression test (`rules/testing.md`)

Per `rules/testing.md`, a bug fix must ship a test that fails on `main` and passes on the branch. "Pattern-clean" is not enough if the fix has no tripwire — a future refactor can re-introduce the same defect silently. Regression tests are mandatory for any panic fix, logic bug, or silent-fallback correction.

**Self-check:** for every commit whose type is `fix`, grep the diff for a corresponding `#[test] fn ..._regression_*` or `..._survives_*` / `..._rejects_*` / `..._returns_*` test. If absent, add before opening the PR. Optionally verify the test fails pre-fix by temporarily reverting and running `cargo test`.

**Real defect (PR #95 self-review, 2026-04-17):** Fix commit `714ff7f` (accessor panic guard) opened the PR without a regression test. Pattern-clean across A–F but testing.md violated. Added `fb137e0 test(gltf): add regression test for accessor out-of-bounds panic` after self-review flagged it.

### G8 — Snapshot / fixture regen paths must assert structural invariants before overwriting the canonical

A test or tool that regenerates a golden file behind an env var (`SHOTLOOM_REGEN_SNAPSHOT=1`, `UPDATE_SNAPSHOTS=1`, `--accept`) runs *after* the code-under-test. If the code-under-test is broken (retargeter yielding 12 bones instead of 53, parser dropping half the input, classifier miscategorizing every entry), the regen path writes the broken output to disk and the canonical fixture is clobbered. A developer who runs regen on a red branch — a common reflex while iterating — commits the regression as the new golden.

The unconditional write is the bug. Snapshot infrastructure should refuse to overwrite the canonical unless the current output passes basic structural gates (bone count within expected band, at least N records, required schema fields populated). The guard is cheap and narrow — the alternative is `git diff` on a binary-ish text blob to notice the regression after the fact.

**Fix pattern:** before `fs::write(&snapshot, ...)`, gate on a minimum sanity floor matching whatever structural property the fixture is *supposed* to have:
```rust
if current.bones.len() < 50 {
    panic!(
        "refusing to regen snapshot with only {} bones — body retarget should produce ~53. \
         Investigate fixtures or retargeter before regen.",
        current.bones.len()
    );
}
fs::write(&snapshot, current.to_text()).expect("write snapshot");
```
Set the floor at "obviously broken" — not at the exact expected value. The goal is blocking "I deleted half the bones and regenerated" catastrophes, not catching subtle drift (that's what the compare path is for).

**Self-check:** for every test/script with a regen branch (`rg 'REGEN|UPDATE_SNAPSHOT|accept' tests/ scripts/`), grep the branch body for `fs::write` / `std::fs::write` / equivalent. Every `write_to_canonical` call must be preceded by at least one `assert!` or `if ... panic!` on a structural property of the current output.

**Real defect (PR #172, comment 3140687025):** `body_retarget_preset1_matches_golden` wrote `body_retarget_preset1.snap` unconditionally when `SHOTLOOM_REGEN_SNAPSHOT=1`. A broken branch producing 12 bones would have overwritten the 53-bone canonical with zero signal. Fix: added `if current.bones.len() < 50 { panic!(...) }` immediately before `fs::create_dir_all` in the regen branch.

### G10 — ADR carries definition + rationale only, never implementation detail

ADRs are decision records. Their content is **what was decided** (names, categories, invariants, contracts) and **why** (trade-offs, rejected alternatives, source-of-truth links). Implementation detail — data shapes, function signatures, Rust constant shapes (`ARKIT_52_CHANNEL_NAMES: &[&str; 52]`), worked examples, operational playbooks ("MetaHuman uses jaw bone for jawOpen, MMD uses…") — belongs to:

- the corresponding source file's doc comment (`lib.rs` / `mod.rs` `//!` block)
- a follow-up *implementation* PR's diff and tests
- a `docs/specs/` doc, an operator runbook, or an ADR comment thread

Why this matters: an ADR that carries impl detail develops two failure modes. (1) The detail goes stale because nobody re-opens the ADR when the code changes. (2) The ADR reads like an issue tracker for the impl PR rather than a durable design rationale, drowning the "why" under the "how". Reviewers skim the ADR for the decision and miss it because the schema example is louder.

A symptom that almost always means G10 fires: the ADR **states "schema deferred"** in one section and **shows the schema** (field layout, worked example) in the same or next section. The ADR is contradicting itself — the deferred-schema sentence is the right call, and everything example-shaped should move out.

**Self-check:** for every ADR in the diff, walk each section and ask: "is this defining what we decided, or showing how it will be coded?" The latter category — Rust type signatures, `{ field: Type }` shapes, `ARRAY: &[T; N]`, language like "iteration order is part of the contract", representative-cases tables, worked input/output examples — moves out. Source-of-truth tables (the canonical name list itself) stay because the names ARE the contract.

**Real defect (PR #177, STL-193):** ADR-0032 first draft included §3 source-namespace example list (`metahuman236`, `vrm1`, …), §3 worked channel examples (`x.metahuman236.cheekRaiserLeft`), §3 `parse_channel_name → Result<ChannelKind, ParseError>` Rust signature, §4 binding-row data shape `{ name, axis, range_deg: [0, 15] }` with worked bone-target examples, and a 5-row representative-cases table covering VRM 0/1 / MetaHuman / Skyrim / MMD / hand-rigged characters. ADR-0030 had already declared "VRM per-character binding schema is out of scope," so §4 was contradicting the parent ADR by showing the schema it claimed to defer. User feedback during self-review: "ADR은 정의 근거만, 나머지는 코드에서 구현되든가" — too tracker-style. Fix: trimmed from 305 → 125 lines, kept categorical decisions ("binding row may target blendshape, expression, or face bone") + rationale, moved schema details to the first face impl PR's territory.

**Real defect (PR #179, STL-194):** ADR-0025 §sentinel-convention illustrated the post-validation failure case with a parenthetical naming the symbol `mapping::retarget(...)`. A later refactor renamed the internal pipeline stage `mapping` → `normalize`, and the parenthetical rotted (`mapping::retarget` no longer existed). The defect is not the rename — the defect is that the ADR carried a code-symbol path as an illustration in the first place. Per documentation-standard.md §5.7 ("ADRs preserve durable 'why'") and §5.4 ("describe intended behavior, not implementation detail"), the right surface for `module::function(...)` references is the source file's `//!` doc or a follow-up impl PR, not ADR prose. Fix: rewrote the parenthetical in domain terms — "an internal normalization, retarget, or postprocess pass returns `Err(RetargetError)`" — so a future rename of the underlying module can't desync the ADR.

**Real defect (PR #178, comment 3145053773):** ADR-0025 (still `Proposed`) carried a "Step 1 amendment (2026-04-27, STL-195)" block at the top, stamped with a PR merge date and a Linear ticket ID, framing a flag removal as part of a multi-step migration plan. The block was the most visible symptom of using a Proposed ADR as a progress / issue tracker (AFDS §5.7) instead of a durable design rationale — the body was freely mutable, so the structural decision could be edited in place. Fix: deleted the amendment block, rewrote the §"Why `RetargeterOptions` is required" rationale paragraph in present tense without the dropped flag reference (the structural argument — force callers to acknowledge per-call options — survives), tightened the contract-surface table footnote to drop the "per ADR-0030 Step 1" temporal language, and moved the dated metadata to the PR description and Linear. Pattern: when a Proposed ADR collects an "amendment block" tied to a PR/STL anchor, that is itself the smell — the right move is editing the body in place and putting the merge-trail metadata in the PR / Linear, not stacking dated annotations on the ADR.

### G11 — ADR system-architecture content belongs in `docs/arch/`, not the ADR body

ADRs carry the **decision and rationale**. System architecture — dependency direction diagrams, cross-crate output contracts, runtime invariants ("no normalizer depends on X at runtime"), per-component responsibility tables — describes **system shape**, not the decision behind it. Per `docs/guidelines/documentation-standard.md` §5.3, system architecture lives in `docs/arch/`. ADRs should link to the arch doc and keep only the durable "why".

The failure mode mirrors G10. An ADR that absorbs arch content (a) goes stale because the topology evolves through impl PRs that nobody re-opens the ADR to update, (b) hides the decision under the diagram so a reviewer skims the ADR for the rationale and finds the topology instead, and (c) creates a second source-of-truth for system shape that drifts against `docs/arch/`. Worst case: the ADR's diagram and a later `docs/arch/` doc disagree, and there is no rule for which wins.

**Self-check:** for every ADR in the diff, walk each section and ask: "is this naming what we decided / why we decided it, or is this describing how the components are wired?" The latter category — `Dependency direction` ASCII diagrams, "minimum output contract" bullet lists, per-crate responsibility tables that list inputs and outputs (as opposed to listing rejected alternatives), runtime-invariant bullets — moves to `docs/arch/<topic>.md` (creating it if needed). The ADR keeps Decision (names, categories), §Why X, §Alternatives Considered, and Consequences. Cross-link both directions: ADR §Decision points at the arch doc, arch doc §Related points at the ADR.

**Real defect (PR #178, comment 3145053776):** ADR-0030 (still `Proposed`) carried a §"Dependency direction and minimum output contract" block (15-line ASCII diagram showing `parsers → import → normalizers → retarget → engine` plus a runtime-invariant bullet list) and a §"Decision" crate table listing inputs and responsibilities for each of the three normalizer crates. Per AFDS §5.3 those describe system shape, not a decision. Same ADR also carried a "Naming amendment (2026-04-27, pre-acceptance)" block at the top, a `(revised 2026-04-22, 2026-04-23, 2026-04-27)` chronology line (that's git history), STL-127 / STL-183 / STL-195 ticket IDs embedded in the body (lines 172, 222, 256), and a §Negative footnote pointing at "Linear sub-issues under STL-127" for per-step orchestration. Fix: created `docs/arch/normalizer-pipeline.md` carrying the dependency diagram, the per-crate output contract bullets, and the runtime invariant. Rewrote ADR-0030 to keep §Context, §Decision (names + Why three + Why ARKit 52 + canonical targets table), §Consequences, §Out of scope, and §Alternatives — with the §Decision pointing at the new arch doc for topology, dependency direction, and per-crate output contract. Stripped all STL ticket IDs from the ADR body (they live in PR description + Linear), dropped the chronology line, dropped the "Linear sub-issues" sentence from §Negative. Updated `docs/arch/README.md` to index the new doc.

### G9 — New workspace member crate must register in a CI test lane

Adding a new `crates/<name>/` entry to the workspace `members = [...]` list silently bypasses CI test coverage unless the crate is also wired into a `cargo test -p <crate>` lane in `.github/workflows/code.yml` (or added to the `EXCLUDED` map in `scripts/validate-ci-rust-coverage.mjs` with a reason). The `Code Gate` job runs the validator and rejects the PR with `ERROR: workspace crates not assigned to any CI test lane`. This bites scaffold/extraction PRs in particular: the crate has no tests yet so the author assumes lane registration can wait, but the validator runs against every PR and fails on first push.

`cargo test -p <crate>` on a no-test crate exits 0, so registering an empty crate in the lane is harmless and future-proofs the lane the moment tests land. Lane choice follows responsibility: pipeline crates (parsers, importers, normalizers, retarget) go to `rust-core-and-contracts`; runtime crates go to `rust-engine` or `rust-native`; binary / WASM / platform-specific crates go to `EXCLUDED` with a one-line reason.

**Self-check:** for every new entry in workspace `members`, verify `node scripts/validate-ci-rust-coverage.mjs` passes locally. If fails, edit `.github/workflows/code.yml` to add `-p <crate-name>` to the appropriate lane's `cargo test` block in the SAME PR that creates the crate.

**Real defect (STL-193 PR #177):** The scaffold for `shotloom-facial-anim-normalizer` landed without registering the crate in any CI lane. `Code Gate` failed with `workspace crates not assigned to any CI test lane: shotloom-facial-anim-normalizer`. Fix: added `-p shotloom-facial-anim-normalizer` to `rust-core-and-contracts` lane next to its sibling pipeline crates (`shotloom-import`, `shotloom-fbx-anim`, `shotloom-retarget`) in a follow-up commit on the same branch.

---

## Self-review checklist (before push)

Run through this list every time, in order:

```
[ ] A1 — Every backticked identifier in changed comments resolves
[ ] A2 — Every file path in changed comments / README exists
[ ] A3 — lib.rs / mod.rs top-of-file state descriptions match current code
[ ] A4 — PR body matches `git ls-files` for changed crates
[ ] A5 — Every new test name describes its actual setup
[ ] A6 — Numeric claims in comments re-derived from types / constants / bench
[ ] A7 — Every `pub fn -> Result<_, _>` whose doc promises defensive behavior uses `.get`/`checked_*` — no `[]`, `unwrap`, or unchecked arithmetic on caller-influenced indices
[ ] A9 — Every parsed / derived struct field is cross-checked against a compile-time constant or a correlated value — no dead header fields

[ ] B1 — Every classifier bucket is the only input to its handler
[ ] B2 — No early return drops downstream stages that don't need the missing data
[ ] B3 — No `assert!` / `panic!` in helpers that a caller's diff/validate pipeline would report per-item

[ ] C1 — No `unwrap_or(default)` where `default` overlaps a real measurement
[ ] C2 — No magnitude check immediately after `normalize_or_zero`
[ ] C3 — No silent `_ =>` arm in config parsing without a warning surface
[ ] C4 — No `map.insert(k, v);` discarding the return when `k` is supposed to be unique

[ ] D1 — No `eprintln!` / `println!` / `dbg!` in library code
[ ] D2 — No `.unwrap()` / `.expect()` in library hot paths
[ ] D3 — No mixed-language comments in English-only crates
[ ] D4 — Every `#[allow(dead_code)]` has a justifying comment
[ ] D5 — No `#[non_exhaustive]` on workspace-internal types (use re-export boundary, not exhaustiveness suppression)
[ ] D6 — Umbrella plugin re-exports only the facade + read-only Resource; sub-plugins and asset path constants are `pub(crate)`
[ ] D7 — Every invariant-bearing `Resource` (uniqueness / identity / constructed-once contract) has private fields + `pub(crate) fn new` + `pub fn accessor`
[ ] D8 — Every recursive helper that walks caller-supplied graph data (parent maps, hierarchies) marks `visited.insert` BEFORE the recursive descent, with a cycle-termination test if the helper is `pub` or reachable via `pub use`

[ ] E1 — `cargo metadata --filter-platform x86_64-unknown-linux-gnu` clean of audio/udev
[ ] E2 — `Cargo.lock` regenerated after any `Cargo.toml` dep change
[ ] E3 — Filesystem ops reviewed for Windows semantics (rename, canonicalize, symlink)

[ ] F1 — Narrow integers / enum discriminants range-checked at parser boundary
[ ] F2 — Inherited defensive code re-validated against this crate's actual invariants
[ ] F3 — Mirrored-pattern sources read with review glasses; defects fixed in both places

[ ] G1 — New files in the crate that owns the responsibility per ADR / recent precedent
[ ] G2 — Every commit subject + body follows `docs/guidelines/commit-guideline.md`
[ ] G3 — PR title + body shape matches the last 3–5 merged PRs in the same repo
[ ] G4 — Branch name uses `feat/fix/refactor/chore/release` prefix, no Linear ID prefix
[ ] G5 — ADR added/updated or tech-debt entry added/deleted when structure shifts
[ ] G6 — `node scripts/validate-doc-paths.mjs` clean + Rust comment path refs spot-checked
[ ] G7 — Every `fix:` commit in this PR has a paired regression test that fails on `main`
[ ] G8 — Every snapshot / fixture regen path asserts a structural floor before overwriting the canonical
[ ] G9 — Every new workspace member crate is registered in a `cargo test -p` lane in `.github/workflows/code.yml` (or in the `EXCLUDED` map with a reason); `node scripts/validate-ci-rust-coverage.mjs` passes
[ ] G10 — Every ADR in the diff carries definition + rationale only; no Rust type signatures, data-shape `{ field: Type }` blocks, worked code examples, or operational playbooks (those move to lib.rs doc / impl PR / specs)
[ ] G11 — Every ADR in the diff names the decision and rationale only; no dependency-direction diagrams, output-contract bullets, runtime-invariant lists, or per-component responsibility tables in the body (those move to `docs/arch/<topic>.md` with bidirectional cross-link); no STL ticket IDs, dated amendment blocks, or `(revised YYYY-MM-DD)` chronology lines (those live in PR description + Linear + git log)
```

If any line cannot be ticked or explicitly waived ("N/A — no Cargo.toml changes"), do not push. Fix it locally, re-run the gates, then push.

---

## Provenance

Patterns A–E (excluding A6, E3) were reverse-engineered from 16 Copilot review comments on [Shotloom PR #66 (STL-74)](https://github.com/CINEV/shotloom/pull/66), spanning three review rounds (2026-04-14). A6, E3, and Pattern group F (F1–F3) were added from PR #72 self-review gap analysis (2026-04-15, merged from the earlier `shotloom-review-patterns.md`). A7 was added 2026-04-17 from a P0 review comment on [PR #85](https://github.com/CINEV/shotloom/pull/85) where `vrm_rest::build_from_bytes` promised defensive `Result` returns but indexed directly. Group G (G1–G7) was added 2026-04-17 to cover structural / repo-convention defects surfaced across PR #85 round-2 review and the PR #95 self-review gap (missing regression test on a bug-fix PR). C4, A9, B3, and G8 were all added 2026-04-25 from the [PR #172 (STL-179)](https://github.com/CINEV/shotloom/pull/172) review cycle — reverse-engineered from eight inline comments + one review-body P1 on the body retarget regression test. C4 (`insert()` discards return → silent overwrite) from comment 3140687013. A9 (parsed / derived struct fields must be cross-checked or dropped) from comments 3140687008 (snapshot `schema`/`vrm`/`fbx` parsed but never validated) and 3140687021 (top-level `frame_count` field derived but never asserted). B3 (helper `assert!`/`panic!` on edge input must not preempt the caller's diff path) from comment 3140687015 (`sample_positions(0)` panicked inside `from_animation` before `compare()` could surface the bone name). G8 (snapshot regen path must assert a structural floor before overwriting) from comment 3140687025 (`SHOTLOOM_REGEN_SNAPSHOT=1` on a broken branch would clobber the 53-bone golden with 12-bone garbage). Three inline comments (#4 redundant `.abs()`, #5 inline `glam::`/`std::` prefix vs hoisted import, #7 missing explanatory comment on a `continue`) were filtered as ad-hoc / style / local semantic, not recurring shapes. G10 was added 2026-04-27 from PR #177 (STL-193) self-review feedback: ADR-0032 first draft inflated to 305 lines by carrying schema-detail content (data shapes, worked examples, representative-cases table, Rust constant shape) that contradicted the ADR's own "schema deferred" stance and read like an issue tracker rather than design rationale. Trimmed to 125 lines (definition + rationale only) per user feedback "ADR은 정의 근거만". G9 was added 2026-04-27 from CI failure on [PR #177 (STL-193)] — scaffold for `shotloom-facial-anim-normalizer` landed without registering the crate in any `cargo test -p` lane in `.github/workflows/code.yml`, and `validate-ci-rust-coverage.mjs` rejected the `Code Gate` job. Fix: register the new crate in `rust-core-and-contracts` lane in the SAME PR that creates it. G10 second real defect added 2026-04-27 from [PR #179 (STL-194)] inline comment 3145096053 — ADR-0025 carried the symbol path `mapping::retarget(...)` as a parenthetical illustration; renaming the internal `mapping` module to `normalize` rotted the reference. Reinforces that even one-line code-symbol references in ADR prose violate the "definition + rationale only" rule and rot under refactor; rewrote the parenthetical in domain terms (normalization / retarget / postprocess pass). D6 and D7 were added 2026-04-25 from two P1 blocking review comments on [PR #166 (STL-186)](https://github.com/CINEV/shotloom/pull/166): comment 3140592023 (umbrella plugin re-exporting the inner plugin + asset path constant gave callers a path around the ADR-0031 "one shared handle" invariant) and comment 3140592033 (`pub` tuple field on the invariant-bearing `PlaceholderMaterial` Resource let any `ResMut` holder swap the handle out at runtime). D8 and G11 were added 2026-04-27 from [PR #178 (STL-195)](https://github.com/CINEV/shotloom/pull/178) review (STL-127 Step 1 character-model normalizer scaffold). D8 from comment 3145053784 — `topo_sort_bones`'s recursive `visit` helper inserted into `visited` after the recursive `visit(parent, …)` call, stack-overflowing on cyclic `parent_map`; today's caller sanitizes upstream but the function is `pub` and forward-references future `ImportedVrmAsset` callers, so the latent panic is a public-API hazard. G11 from comment 3145053776 — ADR-0030 carried §"Dependency direction and minimum output contract" (ASCII diagram + runtime invariant bullets) and a §Decision crate-and-responsibilities table inside the ADR body, despite AFDS §5.3 placing system architecture in `docs/arch/`. Created `docs/arch/normalizer-pipeline.md` for the topology + contract content, ADR §Decision now points at it. Same PR also produced four cross-pattern Real defect entries (A3 lib.rs claims foot/sole code that lives in `shotloom-gltf::vrm_extract`; D4 dead `pub use … as align_finger_rest` alias with non-firing `#[allow(unused_imports)]`; D6 generalized from "umbrella plugin" to "any `pub mod` shadowing a curated `pub use` is over-exposure"; G10 ADR-0025 amendment-block-as-progress-tracker on a still-`Proposed` ADR). Each pattern maps to at least one real defect caught after push. Update this file whenever a new defect class shows up that this checklist doesn't cover — this is the **single source of truth** for Rust pre-PR review patterns. Both `shotloom-review-before-pr` (local) and `cci-codex-review-rust` (remote) load this file directly; do not maintain a parallel checklist.
