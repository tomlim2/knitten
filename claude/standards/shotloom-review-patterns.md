# Shotloom Review Patterns (reverse-engineered from Copilot PR #66; extended from PR #72 self-review)

**Purpose:** Checklist of review heuristics reverse-engineered from the 16 inline comments github `copilot-pull-request-reviewer[bot]` left on shotloom PR #66 (STL-74 retargeter scaffold) on 2026-04-14. Patterns 1-12 reverse-engineered from PR #66; Patterns 13-17 added from PR #72 self-review gap analysis. Use as mandatory context when reviewing shotloom Rust changes, especially before opening a PR.

**How to use:**
- Read this file at the start of any shotloom self-review session.
- Pass as `--context-docs` / prompt context when dispatching `cci-codex-review-rust` or any Codex review on shotloom.
- Walk every changed file against every pattern; report match/clean per pattern.
- Reusable beyond shotloom: the patterns are generic code-review heuristics; the examples are shotloom-specific.

---

## Pattern 1: Stale doc vs current state

**Signal:** A `//!` module doc, README section, ADR status line, or Cargo comment describes the code as "scaffolded", "planned", "phase N session M", "currently exposes nothing", "gitignored", etc. — but the actual file/tree already contradicts that statement.

**Check:**
- `grep -rn '//!.*scaffold\|//!.*planned\|//!.*currently\|//!.*session\|//!.*no .* yet' <crate>/src/`
- Open every module-level doc comment and match against `pub use` / `pub fn` counts in the same file.
- Cross-check README "how to run" / "how to set up" sections against the actually committed files.
- Diff Cargo.toml feature comments against `Cargo.lock` resolved features (`cargo tree -e features` or `cargo metadata --filter-platform ...`).

**Why it matters:** Doc rot is the single easiest thing for a reviewer to spot. It signals the contributor didn't re-read their own doc prose after the last implementation pass, which makes reviewers distrust the rest of the description.

**PR #66 examples:**
- `crates/shotloom-retarget/src/lib.rs:16` — module doc said "currently exposes no types or functions" while the file already re-exported ~15 types.
- `crates/shotloom-retarget/src/lib.rs:20` — crate doc described itself as "Phase B session 1 scaffold" while the PR added layers 0–4.
- `crates/shotloom-retarget/README.md:46,54` — README referenced `examples/fixtures.example.json` and described `fixtures.json` as gitignored, but the PR committed `fixtures.json` directly with no example copy.
- `crates/shotloom-retarget/Cargo.toml:34` — dev-dep comment claimed the Bevy feature selection avoided `audio`/`alsa-sys`, but `Cargo.lock` still pulled `bevy_audio`+`alsa-sys` transitively through `bevy_vrm1`.

---

## Pattern 2: Comment contradicts code in the same function

**Signal:** Inline `//` comment inside a function asserts property X about the following block, and the block actually implements Y. Often happens after a refactor where the body changed but the narration didn't.

**Check:**
- For every `//` above a branch / loop / arithmetic block, read both independently and ask: "Does the code I'm about to read do what the comment says it does?"
- Pay extra attention to branches guarded by `if is_blender`, `if fbx_format == X`, unit-conversion blocks (cm↔m, Y-up↔Z-up), and any "pass through" / "no conversion" annotations.

**Why it matters:** Comment-code contradictions mean one of them is wrong. Usually the code is right and the comment is stale, but reviewers have to pick — and either way it's wasted review cycles.

**PR #66 example:**
- `crates/shotloom-retarget/src/mapping.rs:141` — `fbx_to_gltf_translation` had a Blender branch whose comment said "pass through" while the actual body applied a conversion; the rest of the crate's Blender handling treated Blender as already Y-up meters.

---

## Pattern 3: Dead / tautological guard condition

**Signal:** A check whose outcome is determined by a preceding operation, so the guard is either always true or always false.

**Check:**
- `.normalize_or_zero()` / `.normalize()` followed by `.length() > EPS` or `.length_squared() > EPS` on the same vector — the first op already constrained the output to `{0, 1}`, so the check is dead.
- `Option::is_some()` after an early return on `None`.
- `if x < 0 { return Err(...) }` followed later by `if x < 0 { ... }`.

**Why it matters:** Dead guards misrepresent invariants to readers and often signal that the original invariant was removed by a refactor but the guard was left behind, hiding whether the author actually thought about the edge case.

**PR #66 example:**
- `crates/shotloom-retarget/src/vrm_rest.rs:124` — `compute_virtual_rest_global` normalized `(cp - bp)` via `normalize_or_zero()` and then checked `fwd.length_squared() > 0.5`; since normalize_or_zero returns 0 or a unit vector, the branch was only distinguishing "zero" from "unit" — the `> 0.5` was arbitrary.

---

## Pattern 4: Dangling doc/path reference

**Signal:** A `///` or `//!` doc comment points to a file, path, ADR, or docs URL that does not actually exist in the repo.

**Check:**
- `grep -rno '\[`[^`]*`\]\|docs/[a-z0-9-/]*\.md\|ADR-[0-9]*' <file>` and verify every hit resolves.
- Run `node scripts/validate-doc-paths.mjs` (shotloom bundles one).
- For ADR references: verify the ADR number exists in `docs/adr/README.md`.

**Why it matters:** Doc validators catch some of these but not inline prose hits. Broken links make future-you hunt for a file that was renamed or never existed.

**PR #66 example:**
- `crates/shotloom-retarget/src/retargeter.rs:86` — doc comment referenced `docs/retarget-diagnostic-boundary.md`, but no such file existed; the canonical reference was ADR-0023.

---

## Pattern 5: Language consistency (English-only crates)

**Signal:** A Rust file inside an English-only crate has Korean (or other non-English) prose in `//` / `///` / `//!` / literal strings / error messages / commit-adjacent commentary.

**Check:**
- `grep -rl -P '[\x{AC00}-\x{D7AF}]' <crate>/src/` (Korean Hangul; extend with `\x{3040}-\x{30FF}` for Japanese kana, `\x{4E00}-\x{9FFF}` for CJK ideograph if needed).
- On macOS's default BSD grep, use `LC_ALL=en_US.UTF-8 grep -rl $'[\xea-\xed]'` as a byte-level proxy.
- Shotloom-specific: Linear comments / PR bodies / commit bodies may be Korean per `CONTRIBUTING.md`, but **source code comments must be English**.

**Why it matters:** Korean Slack / PR prose is fine in shotloom. Korean source comments shut out non-Korean-speaking reviewers and reduce the crate's reusability. Also breaks tools that grep for terms in English.

**PR #66 example:**
- `crates/shotloom-retarget/src/mapping.rs:67` — key algorithm comments (rotation order, coord convention) were in Korean while the surrounding crate was English-only.

---

## Pattern 6: Library code side effects (stdout / stderr / fs)

**Signal:** A library crate (`[lib]`, not `[[bin]]` / `[[example]]` / `[[test]]`) contains `println!`, `eprintln!`, `std::io::stdout()`, `std::io::stderr()`, or direct `std::fs::write(...)` outside a test module or a WASM-compile-time shim.

**Check:**
- `grep -rn 'println!\|eprintln!\|io::stdout\|io::stderr' <crate>/src/ | grep -v '#\[cfg(test)\]'`
- `grep -rn 'fs::\(write\|create\|remove\|rename\)' <crate>/src/` and verify each is gated to a non-library target or a clearly-scoped cache helper.

**Why it matters:** Library side effects are invisible at the call site, hard to test, and surprise downstream consumers. In shotloom they also break WASM targets because `std::io::stderr()` behaves differently in browser / worker contexts and `std::fs` is unavailable entirely.

**PR #66 example:**
- `crates/shotloom-retarget/src/retargeter.rs:168` — `ArpRetargeterInner::new_with_options` wrote adapter diagnostics directly to stderr via `eprintln!`.

---

## Pattern 7: Silent default on missing data

**Signal:** A `Vec::get(...).unwrap_or(&default)`, `Option::unwrap_or(0.0)`, or `HashMap::get(key).copied().unwrap_or_default()` pattern where the default is a structurally meaningful sentinel (e.g. `0.0` for a ground-plane height, `0` for a bone count, an empty `Vec` for a track). The default silently becomes a valid input to downstream math.

**Check:**
- For every `.unwrap_or(...)` / `.unwrap_or_default()` / `.copied().unwrap_or(...)`: ask what the downstream math does with the default. If "treats it as valid data and keeps going" → flag. Prefer `Option`/`Result` propagation or an explicit `Diagnostic`.
- Specifically watch for `0.0` defaults inside physics / foot-contact / joint-limit / penetration math.
- Watch for `Vec::is_empty()` guards that short-circuit with a weaker output instead of erroring.

**Why it matters:** "Missing data = grounded" / "missing data = zero rotation" / "missing track = rest pose" is the single most common way a retargeter silently ships wrong data. Reviewers specifically look for this in animation / physics code.

**PR #66 example:**
- `crates/shotloom-retarget/src/retargeter.rs:786` — ground-contact weighting treated missing `leftToes`/`rightToes` source tracks as "grounded" because `source_toe_*_y` was empty → `toe_rest_*` defaulted to `0.0` → each frame applied grounded weights against a 0-height plane.

---

## Pattern 8: Early return silently disables downstream stage

**Signal:** A `return early` / `return Ok(())` / `return default` inside a multi-stage function is triggered by a condition (e.g. "axis_map is empty") that has no logical connection to the later stage, but the return is placed before that later stage runs.

**Check:**
- For multi-stage functions (`stage_1 → stage_2 → stage_3`): trace every `return` / `?` inside stage N and ask whether its condition is also valid for short-circuiting stage N+1.
- Specifically audit "classify / DirectCopy / UserCalibrated / Skip" style staged config logic — empty inputs should usually go down a "Skip" branch, not prevent the classification from running at all.

**Why it matters:** Stage-skipping early returns are invisible to unit tests that only cover one stage at a time, and the bug only shows up when callers pass the edge-case input.

**PR #66 example:**
- `crates/shotloom-retarget/src/adapters/arp_vrm.rs:457` — `align_full_body_rest` returned early when `axis_map` was empty, which skipped Stage 4 (DirectCopy/UserCalibrated/Skip classification) entirely.

---

## Pattern 9: Computed-but-unused classification result

**Signal:** A function computes a list / set / enum value ("here are the bones that should use ScalarCurl") and then the downstream step applies a different rule that ignores the computed value (e.g. applies a helper unconditionally to every bone).

**Check:**
- For every variable with a name ending in `_bones` / `_list` / `_strategy` / `_classification`: search for its usage and verify the consumer actually branches on it. `let curl_bones = ...; apply_in_place(all_bones)` is the red flag.
- Prefer typed enums over `Vec<String>` so "which subset" vs "everything" is a compile error not a review comment.

**Why it matters:** Computed-but-unused config means the author staged a refactor mid-way and didn't finish the wiring. Reviewers catch it because the variable has no second use.

**PR #66 example:**
- `crates/shotloom-retarget/src/adapters/arp_vrm.rs:478` — Stage 4 computed `curl_bones` from `rest_sync_strategy`, but the ScalarCurl application ignored `curl_bones` and unconditionally applied `finger_rest_align::apply_in_place` to every axis-mapped bone.

---

## Pattern 10: Silent catch-all fallback in config parsing

**Signal:** A `match strategy_name.as_str() { "direct" => ..., "skip" => ..., _ => Default }` pattern where unknown inputs silently become a safe-looking default.

**Check:**
- `grep -rn '_ =>' <crate>/src/` on strings parsed from config / JSON / env.
- Prefer serde enum with `deny_unknown_fields` / strict `rename_all` so typos are parse errors.
- If string matching is unavoidable, the catch-all branch must return `Err` or `log::warn!` — not `Default`.

**Why it matters:** Typo'd config strings silently become "Skip" / "Off" / "Default", and the user sees "nothing happened" instead of an error. This is almost always the wrong default.

**PR #66 example:**
- `crates/shotloom-retarget/src/adapters/arp_vrm.rs:159` — `rest_sync_strategy` silently treated unknown `strategy_name` values as `RestSyncStrategy::Skip` via `_ => Skip`, making typos invisible.

---

## Pattern 11: Test setup / comment mismatch

**Signal:** A test's body sets up state A (e.g. an empty hashmap) but the `//` comment above it describes a different state B (e.g. "a bone that only appears as a parent").

**Check:**
- Read every test function's comment header and verify it matches the first five lines of the body.
- Watch specifically for tests that were copy-pasted from a sibling and only partially updated.

**Why it matters:** Comment/setup mismatch means either the comment is stale (low trust) or the test is wrong (hiding a missed case). Either way reviewers have to investigate.

**PR #66 example:**
- `crates/shotloom-retarget/src/topo.rs:87` — test comment said "a bone that only appears as a parent, never as a child key" but the setup built an empty `map`.

---

## Pattern 12: PR description / commit state drift

**Signal:** The PR body describes one state (e.g. "fixtures.json is gitignored, contributors copy from example"), but the actual commits contradict it (the PR ships a committed `fixtures.json` and no example file).

**Check:**
- Before opening a PR, read the draft description end-to-end against `git show HEAD --stat` and `git ls-files`.
- Specifically verify any sentence beginning with "contributors should…", "this file is…", "we gitignore…", or describing a workflow.

**Why it matters:** Reviewers read the description to understand intent. When the description says X and the diff says Y, reviewers assume the author doesn't know which one is true, which lowers trust on the whole PR.

**PR #66 example:**
- PR #66 body claimed `examples/fixtures.json` was gitignored and contributors copied from `fixtures.example.json`, but the PR actually committed `examples/fixtures.json` with no example variant.

---

## Pattern 13: Cross-layer silent fallback

**Signal:** A parser / input layer accepts a value (enum, index, tag, order) whose validity range depends on a downstream catch-all fallback in a sibling crate. The current layer looks like it just stores the value; the downstream layer looks like it is defensive. Neither layer alone treats an out-of-range value as an error.

**Check:**
- For every value your parser stores as a narrow integer (`u8` / `u16` / enum discriminant), grep the downstream consumers in sibling crates for catch-all match arms on that same value.
- If the downstream fallback exists, validate the range at the parser boundary instead of relying on the sibling.

**Why it matters:** Silent catch-all across a crate boundary is invisible to Pattern 10, which only sees one file. The importer treats it as "retarget's problem", the retarget treats it as "importer's problem". The result is wrong-but-plausible output.

**PR #72 example:**
- `crates/shotloom-fbx-anim-importer/src/parse/model.rs` parsed FBX `RotationOrder` as `i32` and cast to `u8` without range-checking.
- `shotloom_retarget::euler_to_quat` had a catch-all arm that silently rewrote any out-of-range value to `XYZ`, so a malformed rig got plausible-but-wrong FK output.
- Fix: add an explicit `0..=5` range check at the importer side and return `Error::Parse` on violation.

---

## Pattern 14: Architectural invariant drift

**Signal:** A data structure invariant has become stronger than a sibling's, but the code still carries the sibling's weaker-invariant defensive logic. Typical smell is a `fs::read` + byte-compare + rewrite chain on a content-addressable path, or a `HashMap::contains_key` guard after a just-inserted `entry().or_default()`.

**Check:**
- When mirroring a pattern from a sibling crate, re-derive the invariants before copying.
- Ask "is this defensive check still load-bearing given what this crate stores?"
- Look specifically for `read + compare + rewrite` on `sha256` / `blake3` / content-hash paths.

**Why it matters:** Inherited defensive code is worse than missing defensive code because it looks intentional and gets left untouched by reviewers. It also adds real cost (I/O, allocation) for a branch that can never trigger.

**PR #72 example:**
- `crates/shotloom-import/src/fbx.rs` imported the `fs::read` + byte-compare + rewrite path from `import_vrm_to_cache`.
- The VRM path caches post-normalization bytes, so two imports of the same source hash can legitimately produce different normalized bytes and the compare is load-bearing there.
- The FBX path caches raw source bytes keyed by source `sha256`, so the same hash always means the same bytes and the compare is redundant I/O on every non-first import.
- Fix: replace with an existence check only, write once on miss.

---

## Pattern 15: Mirrored-pattern inheritance

**Signal:** "We just followed the existing sibling" is presented as a reason not to audit. A new crate's module structure, error shape, cache layout, or validation flow is labelled "mirrors import_vrm_to_cache" / "same as shotloom-gltf" / "like the existing pattern" without an explicit review of the source.

**Check:**
- For every mirrored pattern, open the source and read it with review glasses before copying.
- Every bug in the source becomes your bug in the mirror.
- Pattern 13 / 14 / 7 / 10 findings in the source are especially likely to propagate.

**Why it matters:** Mirroring is an attractive shortcut because it guarantees structural consistency, but it silently inherits whatever defects the original has. The mirrored copy then gets reviewed against the mirror target rather than against the actual invariants, so the inherited defects never get named.

**PR #72 example:**
- `fbx.rs::write_artifact_atomically` was lifted verbatim from `import_vrm_to_cache`.
- Both versions had the same "if second rename fails you lose the cache" bug.
- The FBX self-review caught the issue on the FBX side but did not open a parallel ticket on the VRM side because the VRM code was "existing, out of scope".
- Fix: audit the source before copying; when you find defects, either fix them in both places or open a follow-up issue.

---

## Pattern 16: Quantitative comment accuracy

**Signal:** A comment makes a numeric claim, such as "~12 MB per bone", "~55 minutes of animation", "roughly 3x faster", or "about 100k rows", and the claim is not traceable to the surrounding type definitions, constants, or benchmarks.

**Check:**
- For every numeric comment, re-derive the number from `std::mem::size_of`, fixture measurements, or linked benchmark output.
- Off-by-4x memory estimates and off-by-10x perf estimates are both common.
- Prefer "approximately 28 bytes per frame (`Quat` + `Vec3` samples at `4x + 3x f32`)" over "approximately 12 MB".

**Why it matters:** Wrong capacity claims mislead future capacity planning, and a reviewer who re-derives the math and finds it wrong loses trust in every other claim in the file.

**PR #72 example:**
- The `MAX_FRAME_COUNT` doc comment in `crates/shotloom-fbx-anim-importer/src/types.rs` estimated "~12 MB per bone track" at `100_000` frames.
- Actual per-bone shape is `Quat` (16 B) + `Vec3` (12 B) + padding, approximately 32 B per frame, which is about 3.2 MiB per bone and roughly 4x smaller than the comment claimed.
- Fix: either cite the per-frame byte math inline or drop the MB number and reference the types directly.

---

## Pattern 17: Platform portability

**Signal:** Filesystem / path / newline / locking / rename code assumes POSIX semantics (atomic rename-over-existing, case-sensitive paths, forward slashes) without either a `cfg(windows)` branch or an explicit native-only scope in the crate `Cargo.toml`.

**Check:**
- For every `fs::rename` into an existing path, `Path::canonicalize` compare, `fs::symlink`, or permissions manipulation, ask "does this work on Windows?"
- For the rename case specifically: POSIX atomic-replace vs Windows error if dest exists.
- Prefer designs that make the overwrite path unnecessary, such as content-addressable caches that only write once, over platform-conditional fallbacks.

**Why it matters:** shotloom has a Windows desktop target via Tauri. Any native-only module that breaks on Windows breaks the desktop build. macOS-only development blinds reviewers to the problem because everything passes locally.

**PR #72 example:**
- `write_artifact_atomically` originally used a "rename; if rename failed and destination exists, delete destination then rename again" pattern inherited from VRM import.
- On Windows this becomes "first rename always fails on existing files, delete the good cache, retry rename, if that fails lose everything".
- Combined with Pattern 14, the fix is to remove the overwrite path entirely: content-addressable cache never overwrites, so the Windows concern disappears.

---

## Quick-use mapping (Codex prompt template)

When dispatching Codex for a shotloom Rust self-review, include this file as context and ask Codex to:

1. Report per-pattern match/clean (one line each), plus a severity tag (BLOCK/SHOULD/NIT).
2. Cross-reference findings with shotloom ADRs (ADR-0023, ADR-0024 for FBX scope) and `docs/guidelines/review-rust.md`.
3. Skip "looks good" / unchanged-line commentary.
4. End with `merge-ok` / `fix-then-merge` / `rework`.

Example include directive:

```
Binding review patterns (apply each pattern to every changed file):
<paste contents of this file>
```

## Maintenance

- When a new reviewer comment catches a class of issue not covered here, add a new pattern with the `Signal` / `Check` / `Why` / `Example` shape.
- Do not collapse patterns: each one is meant to be a separate checkbox in a review pass.
- Keep examples anchored to a specific PR so provenance is traceable.
