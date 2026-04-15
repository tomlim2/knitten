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

## Self-review checklist (before push)

Run through this list every time, in order:

```
[ ] A1 — Every backticked identifier in changed comments resolves
[ ] A2 — Every file path in changed comments / README exists
[ ] A3 — lib.rs / mod.rs top-of-file state descriptions match current code
[ ] A4 — PR body matches `git ls-files` for changed crates
[ ] A5 — Every new test name describes its actual setup
[ ] A6 — Numeric claims in comments re-derived from types / constants / bench

[ ] B1 — Every classifier bucket is the only input to its handler
[ ] B2 — No early return drops downstream stages that don't need the missing data

[ ] C1 — No `unwrap_or(default)` where `default` overlaps a real measurement
[ ] C2 — No magnitude check immediately after `normalize_or_zero`
[ ] C3 — No silent `_ =>` arm in config parsing without a warning surface

[ ] D1 — No `eprintln!` / `println!` / `dbg!` in library code
[ ] D2 — No `.unwrap()` / `.expect()` in library hot paths
[ ] D3 — No mixed-language comments in English-only crates
[ ] D4 — Every `#[allow(dead_code)]` has a justifying comment

[ ] E1 — `cargo metadata --filter-platform x86_64-unknown-linux-gnu` clean of audio/udev
[ ] E2 — `Cargo.lock` regenerated after any `Cargo.toml` dep change
[ ] E3 — Filesystem ops reviewed for Windows semantics (rename, canonicalize, symlink)

[ ] F1 — Narrow integers / enum discriminants range-checked at parser boundary
[ ] F2 — Inherited defensive code re-validated against this crate's actual invariants
[ ] F3 — Mirrored-pattern sources read with review glasses; defects fixed in both places
```

If any line cannot be ticked or explicitly waived ("N/A — no Cargo.toml changes"), do not push. Fix it locally, re-run the gates, then push.

---

## Provenance

Patterns A–E (excluding A6, E3) were reverse-engineered from 16 Copilot review comments on [Shotloom PR #66 (STL-74)](https://github.com/CINEV/shotloom/pull/66), spanning three review rounds (2026-04-14). A6, E3, and Pattern group F (F1–F3) were added from PR #72 self-review gap analysis (2026-04-15, merged from the earlier `shotloom-review-patterns.md`). Each pattern maps to at least one real defect caught after push. Update this file whenever a new defect class shows up that this checklist doesn't cover — this is the **single source of truth** for Rust pre-PR review patterns. Both `shotloom-review-before-pr` (local) and `cci-codex-review-rust` (remote) load this file directly; do not maintain a parallel checklist.
