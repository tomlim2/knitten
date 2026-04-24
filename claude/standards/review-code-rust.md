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

### D5 — No `#[non_exhaustive]` on workspace-internal types

`docs/guidelines/error-handling.md` §6 (and §11's forbidden-anti-patterns list) is explicit: `#[non_exhaustive]` is **off by default inside this workspace**. It is meant for types that cross a SemVer boundary to non-workspace consumers (published crate, FFI/plugin API). Shotloom's crates are atomically built, so the annotation only suppresses the compiler exhaustiveness check — a new variant silently falls into `_ =>` catch-alls instead of producing a compile error. That is exactly the safety net the guideline wants preserved.

The correct lever for boundary decoupling is **not re-exporting the type** across crates (keep it qualified as `other_crate::Error`). If a guideline exception is genuinely needed for a specific type, document it in `error-handling.md` with rationale — do not add the attribute silently.

**Self-check:** `rg '#\[non_exhaustive\]' crates/<changed-crate>/src/`. Zero hits expected. If the attribute is present, grep for any `pub use other_crate::Error` that may have motivated it — remove the re-export, not the exhaustiveness check.

**Real defect (PR #118):** `VrmRestError` in `shotloom-gltf` was marked `#[non_exhaustive]` to protect `shotloom-retarget::build_from_bytes` from future variant additions. Reviewer flagged it as P1 blocking per error-handling.md §6. Fix: remove `#[non_exhaustive]`; the already-applied re-export drop from `shotloom-retarget::lib` alone achieves the desired decoupling.

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

[ ] B1 — Every classifier bucket is the only input to its handler
[ ] B2 — No early return drops downstream stages that don't need the missing data

[ ] C1 — No `unwrap_or(default)` where `default` overlaps a real measurement
[ ] C2 — No magnitude check immediately after `normalize_or_zero`
[ ] C3 — No silent `_ =>` arm in config parsing without a warning surface

[ ] D1 — No `eprintln!` / `println!` / `dbg!` in library code
[ ] D2 — No `.unwrap()` / `.expect()` in library hot paths
[ ] D3 — No mixed-language comments in English-only crates
[ ] D4 — Every `#[allow(dead_code)]` has a justifying comment
[ ] D5 — No `#[non_exhaustive]` on workspace-internal types (use re-export boundary, not exhaustiveness suppression)

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
```

If any line cannot be ticked or explicitly waived ("N/A — no Cargo.toml changes"), do not push. Fix it locally, re-run the gates, then push.

---

## Provenance

Patterns A–E (excluding A6, E3) were reverse-engineered from 16 Copilot review comments on [Shotloom PR #66 (STL-74)](https://github.com/CINEV/shotloom/pull/66), spanning three review rounds (2026-04-14). A6, E3, and Pattern group F (F1–F3) were added from PR #72 self-review gap analysis (2026-04-15, merged from the earlier `shotloom-review-patterns.md`). A7 was added 2026-04-17 from a P0 review comment on [PR #85](https://github.com/CINEV/shotloom/pull/85) where `vrm_rest::build_from_bytes` promised defensive `Result` returns but indexed directly. Group G (G1–G7) was added 2026-04-17 to cover structural / repo-convention defects surfaced across PR #85 round-2 review and the PR #95 self-review gap (missing regression test on a bug-fix PR). Each pattern maps to at least one real defect caught after push. Update this file whenever a new defect class shows up that this checklist doesn't cover — this is the **single source of truth** for Rust pre-PR review patterns. Both `shotloom-review-before-pr` (local) and `cci-codex-review-rust` (remote) load this file directly; do not maintain a parallel checklist.
