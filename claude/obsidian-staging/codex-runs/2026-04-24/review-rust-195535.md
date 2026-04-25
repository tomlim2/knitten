---
skill: cci-codex-review-rust
timestamp: 2026-04-24T19:55:35+09:00
cwd: /Users/younsoolim/Desktop/www/shotloom/.worktrees/stl-179-body-retarget-regression
model: gpt-5.4
reasoning_effort: high
---

## Prompt

```
당신은 시니어 Rust 리뷰어다. 아래 변경분을 정밀 리뷰하라.

## Scope Context (caller-provided)
- Phase: STL-179 — ADR-0030 Step 0 prerequisite. Pin body retarget output via golden regression before normalizer crate extractions (Step 1–3) begin.
- Out-of-scope: facial retarget regression (separate Step); rubric-based quality harness (STL-75); multi-clip coverage (Step 0 is one canonical clip).
- Known constraints: CI runs ubuntu-latest only; dev machine is Apple Silicon; fixtures require git-lfs; cargo test must finish under 5s per STL-179.

---

## Uncertainty Protocol (binding)
- If the diff does not give you enough to judge a concern, do not
  speculate. Flag it under an "Insufficient evidence" section and
  request the specific files you would need.
- If a finding is relevant but outside the declared scope, move it to
  an "Out-of-scope observation" section — do not mix with in-scope
  review items.
- If the caller supplied `## Binding ADRs` content below, judge the
  diff against the design intent in those ADRs, not against your own
  preferences.

---

**리뷰 체크리스트** (항목별로 발견 사항을 적되, 없으면 "OK"):
1. 소유권/대여/lifetime — 불필요한 clone, 'static 남용, 라이프타임 압박
2. Panic 유발 — unwrap/expect/인덱스 접근/슬라이싱/오버플로우
3. Result/Option — `?` 누락, 무시된 에러, `unwrap_or`로 충분한 곳
4. 관용구 — `if let` vs match, iterator 체인, `From`/`Into`
5. 성능 핫패스 — 불필요한 alloc/clone/Box, 반복문 안의 정규식 컴파일
6. 동시성 — Send/Sync, 데이터 경합, Arc/Mutex 오용
7. 에러 메시지 — 디버깅 가능성, 컨텍스트 포함 여부
8. 테스트 가능성 — 부수효과 분리, 순수 함수 추출 여지

**심각도** 표기:
- 🔴 **Block**: 머지 전 반드시 수정 (panic, 데이터 손실, 정합성 깨짐)
- 🟡 **Should**: 권장 수정 (성능, 가독성, 관용구)
- 🟢 **Nit**: 취향, 무시해도 됨

**출력 형식**:
1. 전체 요약 (3줄 이내)
2. 파일별 발견 사항 (라인 번호 + 인용 + 심각도 + 제안)
3. 머지 권장도: ✅ 머지 OK / ⚠️ 수정 후 머지 / ❌ 재작업 필요
4. **Insufficient evidence** — 이 diff만으로는 판단 불가한 항목 (필요한 파일 명시)
5. **Out-of-scope observation** — declared scope 밖이지만 참고할 만한 발견

**금지 사항**:
- "good job", "looks good" 같은 무의미한 칭찬 금지
- 변경되지 않은 줄에 대한 평가 금지
- 추측성 "might be slow" 금지 — 구체적 근거 제시

---

## Rust Review Patterns (mandatory)

Apply every pattern in this section to every changed file. Report per-pattern match/clean with severity BLOCK/SHOULD/NIT. Patterns are derived from historical Copilot findings on PR #66 + PR #72/#85/#95/STL-172 gap analyses; they cover the specific classes of issue shotloom reviewers flag.

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

---

## 변경분 (git diff origin/main..HEAD)

```diff
diff --git a/Cargo.lock b/Cargo.lock
index a2021a5..6885159 100644
--- a/Cargo.lock
+++ b/Cargo.lock
@@ -6583,6 +6583,7 @@ dependencies = [
  "gltf",
  "serde",
  "serde_json",
+ "sha2",
  "shotloom-common",
  "shotloom-fbx-anim",
  "shotloom-gltf",
diff --git a/crates/shotloom-retarget/Cargo.toml b/crates/shotloom-retarget/Cargo.toml
index dd42d6b..579fc25 100644
--- a/crates/shotloom-retarget/Cargo.toml
+++ b/crates/shotloom-retarget/Cargo.toml
@@ -56,6 +56,9 @@ examples = ["dep:bevy", "dep:bevy_vrm1", "dep:bevy_panorbit_camera", "dep:clap"]
 # depend on `shotloom-retarget` do not pull the FBX parser in.
 shotloom-fbx-anim = { path = "../shotloom-fbx-anim" }
 gltf = "1.4"
+# STL-179: body_retarget_regression golden fingerprint. Same version
+# already used by `shotloom-import`.
+sha2 = "0.10"
 
 [[example]]
 name = "fbx_viz"
diff --git a/crates/shotloom-retarget/tests/body_retarget_regression.rs b/crates/shotloom-retarget/tests/body_retarget_regression.rs
new file mode 100644
index 0000000..b2e0038
--- /dev/null
+++ b/crates/shotloom-retarget/tests/body_retarget_regression.rs
@@ -0,0 +1,378 @@
+//! Body retarget golden regression (STL-179 — ADR-0030 Step 0).
+//!
+//! Pins the per-bone rotation output of [`retarget_arp_to_vrm`] for
+//! one canonical ARP→VRM body clip so the Step 1–3 normalizer crate
+//! extractions cannot silently regress the retargeter math.
+//!
+//! Fingerprint format: each quaternion component is formatted with six
+//! fractional digits (`{:+.6}`), giving ~1e-6 tolerance per component
+//! as called out in STL-179 — below that threshold, sub-ulp drift
+//! between platforms (Apple Silicon dev / `ubuntu-latest` CI) is
+//! absorbed before hashing. Each bone then gets its own sha256 digest
+//! over its rotations, and a combined digest pins the overall shape.
+//! When a regression hits, per-bone digests isolate which bone drifted.
+//!
+//! Regenerate after an intentional retargeter change:
+//!
+//! ```text
+//! SHOTLOOM_REGEN_SNAPSHOT=1 \
+//!   cargo test -p shotloom-retarget --test body_retarget_regression
+//! ```
+//!
+//! then commit the updated `.snap` file alongside the change.
+
+use sha2::{Digest, Sha256};
+use shotloom_common::diagnostic::DiagnosticSeverity;
+use shotloom_common::workspace_root;
+use shotloom_fbx_anim::parse as parse_fbx;
+use shotloom_retarget::{
+    build_from_bytes, retarget_arp_to_vrm, RetargeterOptions, TargetAnimation,
+};
+use std::env;
+use std::fmt::Write as _;
+use std::fs;
+use std::path::{Path, PathBuf};
+
+/// Preset 1 from `crates/shotloom-retarget/examples/fixtures.json` —
+/// the primary 1.x female loaded set (`fbx_viz 1`), stable enough to
+/// serve as the single canonical clip for Step 0 per STL-179.
+const VRM_RELATIVE: &str = "assets/models/vrm1x-vroid-f-xiao.vrm";
+const FBX_RELATIVE: &str = "assets/anims/body/21353_F_AiHappy03C_241010.fbx";
+
+const SNAPSHOT_FILE: &str = "body_retarget_preset1.snap";
+const SCHEMA_VERSION: u32 = 1;
+const REGEN_ENV_VAR: &str = "SHOTLOOM_REGEN_SNAPSHOT";
+
+fn snapshot_path() -> PathBuf {
+    Path::new(env!("CARGO_MANIFEST_DIR"))
+        .join("tests/snapshots")
+        .join(SNAPSHOT_FILE)
+}
+
+fn read_fixture(relative: &str) -> Vec<u8> {
+    let path = workspace_root().join(relative);
+    fs::read(&path).unwrap_or_else(|error| {
+        panic!(
+            "failed to read fixture {} ({error}): confirm `assets/` is checked out via git-lfs",
+            path.display()
+        )
+    })
+}
+
+fn compute_animation() -> TargetAnimation {
+    let fbx_bytes = read_fixture(FBX_RELATIVE);
+    let vrm_bytes = read_fixture(VRM_RELATIVE);
+
+    let source = parse_fbx(&fbx_bytes).expect("parse preset-1 body FBX");
+    let (vrm_rest, rest_diagnostics) =
+        build_from_bytes(&vrm_bytes).expect("build VRM rest pose from preset-1 model");
+    assert!(
+        !rest_diagnostics
+            .iter()
+            .any(|d| d.severity == DiagnosticSeverity::Error),
+        "unexpected error diagnostics from build_from_bytes: {rest_diagnostics:?}"
+    );
+
+    let (animation, retarget_diagnostics) =
+        retarget_arp_to_vrm(&source, &vrm_rest, RetargeterOptions::default());
+    assert!(
+        !retarget_diagnostics
+            .iter()
+            .any(|d| d.severity == DiagnosticSeverity::Error),
+        "unexpected error diagnostics from retarget_arp_to_vrm: {retarget_diagnostics:?}"
+    );
+    animation
+}
+
+/// Stable, rounded textual representation of one bone's rotation track.
+fn bone_rotations_text(rotations: &[glam::Quat]) -> String {
+    let mut out = String::with_capacity(rotations.len() * 36);
+    for q in rotations {
+        let _ = writeln!(out, "{:+.6} {:+.6} {:+.6} {:+.6}", q.x, q.y, q.z, q.w);
+    }
+    out
+}
+
+fn hex_digest(bytes: &[u8]) -> String {
+    let digest = Sha256::digest(bytes);
+    let mut out = String::with_capacity(digest.len() * 2);
+    for byte in digest {
+        let _ = write!(out, "{byte:02x}");
+    }
+    out
+}
+
+#[derive(Debug, PartialEq, Eq)]
+struct Fingerprint {
+    schema: u32,
+    vrm: String,
+    fbx: String,
+    frame_count: usize,
+    /// `duration_secs` rounded to six fractional digits to match the
+    /// quaternion rounding tolerance — the raw `f32` is intentionally
+    /// not hashed.
+    duration_rounded: String,
+    bones: Vec<(String, usize, String)>,
+    overall: String,
+}
+
+impl Fingerprint {
+    fn from_animation(animation: &TargetAnimation) -> Self {
+        let mut bones: Vec<(String, usize, String)> = animation
+            .bones
+            .iter()
+            .map(|bone| {
+                let text = bone_rotations_text(&bone.rotations);
+                let digest = hex_digest(text.as_bytes());
+                (bone.vrm_bone_name.clone(), bone.rotations.len(), digest)
+            })
+            .collect();
+        bones.sort_by(|a, b| a.0.cmp(&b.0));
+
+        let mut combined = Sha256::new();
+        for (name, count, digest) in &bones {
+            combined.update(name.as_bytes());
+            combined.update(b":");
+            combined.update(count.to_string().as_bytes());
+            combined.update(b":");
+            combined.update(digest.as_bytes());
+            combined.update(b"\n");
+        }
+        let overall = {
+            let bytes = combined.finalize();
+            let mut out = String::with_capacity(bytes.len() * 2);
+            for byte in bytes {
+                let _ = write!(out, "{byte:02x}");
+            }
+            out
+        };
+
+        let frame_count = animation
+            .bones
+            .iter()
+            .map(|b| b.rotations.len())
+            .max()
+            .unwrap_or(0);
+
+        Self {
+            schema: SCHEMA_VERSION,
+            vrm: VRM_RELATIVE.to_string(),
+            fbx: FBX_RELATIVE.to_string(),
+            frame_count,
+            duration_rounded: format!("{:+.6}", animation.duration_secs),
+            bones,
+            overall,
+        }
+    }
+
+    fn to_text(&self) -> String {
+        let mut out = String::new();
+        out.push_str("# Shotloom body retarget golden — STL-179 (ADR-0030 Step 0).\n");
+        out.push_str(
+            "# Regenerate: SHOTLOOM_REGEN_SNAPSHOT=1 cargo test -p shotloom-retarget \\\n",
+        );
+        out.push_str("#   --test body_retarget_regression\n");
+        out.push_str(
+            "# Fingerprint = sha256(rounded-decimal per-bone rotations); ~1e-6 tolerance.\n",
+        );
+        let _ = writeln!(out, "schema {}", self.schema);
+        let _ = writeln!(out, "vrm {}", self.vrm);
+        let _ = writeln!(out, "fbx {}", self.fbx);
+        let _ = writeln!(out, "frame_count {}", self.frame_count);
+        let _ = writeln!(out, "duration {}", self.duration_rounded);
+        let _ = writeln!(out, "bone_count {}", self.bones.len());
+        out.push_str("bones\n");
+        for (name, count, digest) in &self.bones {
+            let _ = writeln!(out, "  {name} {count} {digest}");
+        }
+        let _ = writeln!(out, "overall {}", self.overall);
+        out
+    }
+
+    fn parse(text: &str) -> Result<Self, String> {
+        let mut schema = None;
+        let mut vrm = None;
+        let mut fbx = None;
+        let mut frame_count = None;
+        let mut duration = None;
+        let mut expected_bone_count = None;
+        let mut overall = None;
+        let mut bones = Vec::new();
+        let mut in_bones = false;
+
+        for (lineno, raw) in text.lines().enumerate() {
+            let line = raw.trim_end();
+            if line.is_empty() || line.starts_with('#') {
+                continue;
+            }
+            if in_bones {
+                let trimmed = line.trim_start();
+                if trimmed == line {
+                    // de-indented → leaving the bones block
+                    in_bones = false;
+                } else {
+                    let mut parts = trimmed.splitn(3, ' ');
+                    let (name, count, digest) = match (parts.next(), parts.next(), parts.next()) {
+                        (Some(n), Some(c), Some(d)) => (n, c, d),
+                        _ => return Err(format!("line {}: malformed bone entry", lineno + 1)),
+                    };
+                    let count: usize = count
+                        .parse()
+                        .map_err(|e| format!("line {}: bad bone count: {e}", lineno + 1))?;
+                    bones.push((name.to_string(), count, digest.to_string()));
+                    continue;
+                }
+            }
+            let mut parts = line.splitn(2, ' ');
+            let key = parts.next().unwrap_or("");
+            let value = parts.next().unwrap_or("").trim();
+            match key {
+                "schema" => schema = Some(value.parse::<u32>().map_err(|e| e.to_string())?),
+                "vrm" => vrm = Some(value.to_string()),
+                "fbx" => fbx = Some(value.to_string()),
+                "frame_count" => {
+                    frame_count = Some(value.parse::<usize>().map_err(|e| e.to_string())?)
+                }
+                "duration" => duration = Some(value.to_string()),
+                "bone_count" => {
+                    expected_bone_count = Some(value.parse::<usize>().map_err(|e| e.to_string())?)
+                }
+                "bones" => in_bones = true,
+                "overall" => overall = Some(value.to_string()),
+                other => return Err(format!("line {}: unknown key `{other}`", lineno + 1)),
+            }
+        }
+
+        let fingerprint = Self {
+            schema: schema.ok_or("missing schema")?,
+            vrm: vrm.ok_or("missing vrm")?,
+            fbx: fbx.ok_or("missing fbx")?,
+            frame_count: frame_count.ok_or("missing frame_count")?,
+            duration_rounded: duration.ok_or("missing duration")?,
+            bones,
+            overall: overall.ok_or("missing overall")?,
+        };
+        if let Some(expected) = expected_bone_count {
+            if expected != fingerprint.bones.len() {
+                return Err(format!(
+                    "bone_count={expected} but found {} bone entries",
+                    fingerprint.bones.len()
+                ));
+            }
+        }
+        Ok(fingerprint)
+    }
+
+    /// Returns `None` if current matches golden, else a readable diff.
+    fn diff(&self, golden: &Self) -> Option<String> {
+        if self == golden {
+            return None;
+        }
+        let mut diff = String::new();
+        if self.schema != golden.schema {
+            let _ = writeln!(diff, "schema: {} → {}", golden.schema, self.schema);
+        }
+        if self.vrm != golden.vrm {
+            let _ = writeln!(diff, "vrm: `{}` → `{}`", golden.vrm, self.vrm);
+        }
+        if self.fbx != golden.fbx {
+            let _ = writeln!(diff, "fbx: `{}` → `{}`", golden.fbx, self.fbx);
+        }
+        if self.frame_count != golden.frame_count {
+            let _ = writeln!(
+                diff,
+                "frame_count: {} → {}",
+                golden.frame_count, self.frame_count
+            );
+        }
+        if self.duration_rounded != golden.duration_rounded {
+            let _ = writeln!(
+                diff,
+                "duration: {} → {}",
+                golden.duration_rounded, self.duration_rounded
+            );
+        }
+
+        let current: std::collections::BTreeMap<&str, (usize, &str)> = self
+            .bones
+            .iter()
+            .map(|(n, c, d)| (n.as_str(), (*c, d.as_str())))
+            .collect();
+        let golden_map: std::collections::BTreeMap<&str, (usize, &str)> = golden
+            .bones
+            .iter()
+            .map(|(n, c, d)| (n.as_str(), (*c, d.as_str())))
+            .collect();
+
+        for (name, (count, digest)) in &current {
+            match golden_map.get(name) {
+                Some((g_count, g_digest)) => {
+                    if count != g_count {
+                        let _ = writeln!(diff, "  {name}: frames {g_count} → {count}");
+                    }
+                    if digest != g_digest {
+                        let _ = writeln!(
+                            diff,
+                            "  {name}: digest {}… → {}…",
+                            &g_digest[..12],
+                            &digest[..12]
+                        );
+                    }
+                }
+                None => {
+                    let _ = writeln!(diff, "  {name}: + new bone ({count} frames)");
+                }
+            }
+        }
+        for name in golden_map.keys() {
+            if !current.contains_key(name) {
+                let _ = writeln!(diff, "  {name}: - removed");
+            }
+        }
+
+        if self.overall != golden.overall {
+            let _ = writeln!(
+                diff,
+                "overall: {}… → {}…",
+                &golden.overall[..12],
+                &self.overall[..12]
+            );
+        }
+        Some(diff)
+    }
+}
+
+#[test]
+fn body_retarget_preset1_matches_golden() {
+    let animation = compute_animation();
+    assert!(
+        !animation.bones.is_empty(),
+        "retargeter returned no bones — fixtures broken?"
+    );
+    let current = Fingerprint::from_animation(&animation);
+    let snapshot = snapshot_path();
+
+    if env::var(REGEN_ENV_VAR).ok().as_deref() == Some("1") {
+        fs::create_dir_all(snapshot.parent().expect("snapshot parent"))
+            .expect("create snapshots dir");
+        fs::write(&snapshot, current.to_text()).expect("write snapshot");
+        eprintln!("regenerated snapshot: {}", snapshot.display());
+        return;
+    }
+
+    let golden_text = fs::read_to_string(&snapshot).unwrap_or_else(|error| {
+        panic!(
+            "missing snapshot {} ({error}). First run: set {REGEN_ENV_VAR}=1",
+            snapshot.display()
+        )
+    });
+    let golden = Fingerprint::parse(&golden_text).expect("golden .snap must parse");
+
+    if let Some(diff) = current.diff(&golden) {
+        panic!(
+            "body retarget output drift from golden:\n{diff}\n\n\
+             If this change is intentional, regenerate with:\n  \
+             {REGEN_ENV_VAR}=1 cargo test -p shotloom-retarget --test body_retarget_regression"
+        );
+    }
+}
diff --git a/crates/shotloom-retarget/tests/snapshots/body_retarget_preset1.snap b/crates/shotloom-retarget/tests/snapshots/body_retarget_preset1.snap
new file mode 100644
index 0000000..f4ef33d
--- /dev/null
+++ b/crates/shotloom-retarget/tests/snapshots/body_retarget_preset1.snap
@@ -0,0 +1,65 @@
+# Shotloom body retarget golden — STL-179 (ADR-0030 Step 0).
+# Regenerate: SHOTLOOM_REGEN_SNAPSHOT=1 cargo test -p shotloom-retarget \
+#   --test body_retarget_regression
+# Fingerprint = sha256(rounded-decimal per-bone rotations); ~1e-6 tolerance.
+schema 1
+vrm assets/models/vrm1x-vroid-f-xiao.vrm
+fbx assets/anims/body/21353_F_AiHappy03C_241010.fbx
+frame_count 1764
+duration +58.766666
+bone_count 53
+bones
+  VRMC_vrm.root_bone 1764 a1707a31fe9ba78d67518049c046cd836f1c667b5e328d0015529d73321a78b2
+  chest 1764 8d69c06ba5dc8f7d3097fd8772528e9c5a24a5710b8bef318e5ee10fd6fb87bf
+  head 1764 68ae1a0bd6fffa14ff0f15a12b51e56c1560fc3cb8507db2c9f958a8c5920743
+  hips 1764 b0d7414f4af2b9b812aadb725c21139778610ae16597bfca5b0e459cc82a0f19
+  leftFoot 1764 d3cd9c23bf875ce09010cdc3c3ccd3330c268322e431bd320d39b4490684a419
+  leftHand 1764 5cd469ac6be2db4e184b2e8f087a2118e35945f5d08c1c55193ff774f517e336
+  leftIndexDistal 1764 a46f1c69aa544eddc4c4cd606e3e93d76e177f15ab2c461abe06254046f5c20b
+  leftIndexIntermediate 1764 f7004c69c8b7c48af8c50216d5721c3e2af9bca6f02a91f328364d9963b31fd9
+  leftIndexProximal 1764 31efc34085ac587823b8548b5c93a5d33c9f0965ca147e23f8dda5fafd1b10d0
+  leftLittleDistal 1764 ee8a5c1c1a5fa7cd804d88d367d9c1a77a97d4143db4b4b98a0efd1cd148a4d4
+  leftLittleIntermediate 1764 17b0f7a7cee290a330455dbdf7766754698b614aa82dedda4598af60bf33024e
+  leftLittleProximal 1764 9eefa56acfd85401ff5af68705afb78027ae48e3f352207fab1bd72514d4a99d
+  leftLowerArm 1764 76acaf59b0fee536731851f21ee02d0731c20132703a2eddd22e429d0d2a2be0
+  leftLowerLeg 1764 6b1cade0db0b95ce3c526a3f484f09d31fbbf1398e2598910120c0cccd3350c9
+  leftMiddleDistal 1764 c231352abdfd133801cc8c789bf16e38d54f209866346aca2a90954b76179ffa
+  leftMiddleIntermediate 1764 46c9dee17c8788e8b3692848bb4c8ddda0d325b12a23be98372eb1e6139c5544
+  leftMiddleProximal 1764 77889e22956c0ec770cad04243afed2a5fa7702a48b7f04af7b5a3bd03898c1a
+  leftRingDistal 1764 9692c16576758124405806ed19b9af5d156ace9a038211eb409999db022bea0d
+  leftRingIntermediate 1764 2d4a7b10863265acadfb706d5edb84e168c486f77c14b0005d4806b2c3192c28
+  leftRingProximal 1764 15b8ad179d71028929c941c27ad6d961c220141f11f3d61d3591b5213501dd85
+  leftShoulder 1764 20632d6693783d098f15de31a681e345a83ae6edfa08c1930ed5e360b6478bb3
+  leftThumbDistal 1764 9ba002ed793de4f2df36e66a04d16bd05916ac6d290c2006142b84ab616b6205
+  leftThumbMetacarpal 1764 d7fe949d90a42058ad50de395cd71fac5b581ad3fface663942a8e29b569d31d
+  leftThumbProximal 1764 37cbd284092bdef76bfd5f55328de5d600762d4219f30772cba6a9e521e77dee
+  leftToes 1764 f9f335c7c4e5a81c7cfd4e0f7b46270428e5a7beb30d8044a8a91b017dc6a9be
+  leftUpperArm 1764 cc8a711af814b932f83983ea8c8a0944e030f3e7caa7a26b9ed38fab033b83c1
+  leftUpperLeg 1764 4d771ee54f37e05986ca9b0f43d76bc4fddcd48f7a090be7ccf018868b34ed82
+  neck 1764 0a3b678baf960de22c7e5a5162de72b0d09951519c9749057b88fdd2d39029f7
+  rightFoot 1764 fa118ca1795f263bacd1bff2ddfd3f7e9bb14bf01ebdf9b9226a5f9b3e1aef46
+  rightHand 1764 c8303288d16b938e99b32dff6bff1c1f7ee87cafbef4262f79a291755b2b1fb6
+  rightIndexDistal 1764 1ec527ff4d3cd21537ea06a47ff32a135f19b1739e824235e2f727a8ab5a82c5
+  rightIndexIntermediate 1764 50f07e95b29edebdae968b10069064bd69eb70df48c54dca8785bbdb5efa0a1a
+  rightIndexProximal 1764 96fe06c4cd37a63030a7b82f126d86506ddfb05c376e359904373bb08a023654
+  rightLittleDistal 1764 cc5d2671c32bc769a1320e399005aba74b84881d50b13d3f763ce2a75895c833
+  rightLittleIntermediate 1764 31bd4b68411050176e3da69cd31408e37d6823b596b6a4a08d2c948017f7e7fa
+  rightLittleProximal 1764 58c8048762568a585e3baca7cdebea1f97f1e8086c38c2c89fe4711c5e6dc1dc
+  rightLowerArm 1764 56df53019b63aede1781ab2e8826359f0feb7254aa3b5ca56648ef18f1248fb3
+  rightLowerLeg 1764 a7d46bfc1925f21959f4118fba6308c9be22980af8490c52d21691e12843e947
+  rightMiddleDistal 1764 b80a78611470645ae4a2aada1ea5469da12657b71923ff65ae3aa72330718adc
+  rightMiddleIntermediate 1764 aa85b043fdba93d22ad3f5f99440959556dcf39955428dd72e08a1e2109b4dde
+  rightMiddleProximal 1764 fd42410b60f90f3b19c98a3ebae00b461501ca717fe2a3d78ddf9da1d593c41a
+  rightRingDistal 1764 ddab5785cde1bb5d3c73f50a4d85b38d0492b6435d00ffc62c290b76f70110b7
+  rightRingIntermediate 1764 0979ffc7dcb9b2579b9c491f27501ee6506779e8c02f2c6df4edce081aa606a0
+  rightRingProximal 1764 9f346b03ed87113ae65b429ae09d2a607b02f45202844ab185b3cab92af89e68
+  rightShoulder 1764 a2b502c4861724afabd6ab8fea413e4b8fbff5262e190467e7c78deb01c4233f
+  rightThumbDistal 1764 42a8cbb39b08ad785c55a413d4a7f44a8c884fabf4454bd4376e3af922ccecf6
+  rightThumbMetacarpal 1764 922be7039baffcb2f92cfa70f1a780ca2af103682f4648e0cba2fe37e31f0cbb
+  rightThumbProximal 1764 a07edb1319f0152c158672afb383a93b8c18b618faec81845dc41eab65ac0b14
+  rightToes 1764 74e7c110f162aded1d6c93b9f804b71a93dcdbb0294b665e52a7c39ed67f18d0
+  rightUpperArm 1764 2fb35557d4fa0104c074a66604a14ae61b0c26ac6e4a6d7b42f2015a04cff0d0
+  rightUpperLeg 1764 9100b45080a95439be4beb67fc3d85b2e13a387fc56682d3b2dea2a03672c3cf
+  spine 1764 f7a9b5e4e1ec0ee1f518cf4453ebe09854c1e62b7103d3e84578e003052501a0
+  upperChest 1764 eedd78eb6e3f493931c2df8e729f56626ce5f055f2c4a6f34c0c74a79768cb2e
+overall 8349ce74c4b17f5ff3584832448caf2803e9c0945a7c0b2805bd0314fe0fe955
```
```

## Response

OpenAI Codex v0.120.0 (research preview)
--------
workdir: /Users/younsoolim/Desktop/www/shotloom/.worktrees/stl-179-body-retarget-regression
model: gpt-5.4
provider: openai
approval: never
sandbox: workspace-write [workdir, /tmp, $TMPDIR, /Users/younsoolim/.codex/memories]
reasoning effort: none
reasoning summaries: none
session id: 019dbf21-7dea-7dd1-9a73-0678bfcaf211
--------
user
중요: 모든 답변은 **한국어**로. 코드 블록은 영어로 두되 설명·결론·요약·권장사항은 한국어. 마크다운으로. 결론은 굵게.

---

당신은 시니어 Rust 리뷰어다. 아래 변경분을 정밀 리뷰하라.

## Scope Context (caller-provided)
- Phase: STL-179 — ADR-0030 Step 0 prerequisite. Pin body retarget output via golden regression before normalizer crate extractions (Step 1–3) begin.
- Out-of-scope: facial retarget regression (separate Step); rubric-based quality harness (STL-75); multi-clip coverage (Step 0 is one canonical clip).
- Known constraints: CI runs ubuntu-latest only; dev machine is Apple Silicon; fixtures require git-lfs; cargo test must finish under 5s per STL-179.

---

## Uncertainty Protocol (binding)
- If the diff does not give you enough to judge a concern, do not
  speculate. Flag it under an "Insufficient evidence" section and
  request the specific files you would need.
- If a finding is relevant but outside the declared scope, move it to
  an "Out-of-scope observation" section — do not mix with in-scope
  review items.
- If the caller supplied `## Binding ADRs` content below, judge the
  diff against the design intent in those ADRs, not against your own
  preferences.

---

**리뷰 체크리스트** (항목별로 발견 사항을 적되, 없으면 "OK"):
1. 소유권/대여/lifetime — 불필요한 clone, 'static 남용, 라이프타임 압박
2. Panic 유발 — unwrap/expect/인덱스 접근/슬라이싱/오버플로우
3. Result/Option — `?` 누락, 무시된 에러, `unwrap_or`로 충분한 곳
4. 관용구 — `if let` vs match, iterator 체인, `From`/`Into`
5. 성능 핫패스 — 불필요한 alloc/clone/Box, 반복문 안의 정규식 컴파일
6. 동시성 — Send/Sync, 데이터 경합, Arc/Mutex 오용
7. 에러 메시지 — 디버깅 가능성, 컨텍스트 포함 여부
8. 테스트 가능성 — 부수효과 분리, 순수 함수 추출 여지

**심각도** 표기:
- 🔴 **Block**: 머지 전 반드시 수정 (panic, 데이터 손실, 정합성 깨짐)
- 🟡 **Should**: 권장 수정 (성능, 가독성, 관용구)
- 🟢 **Nit**: 취향, 무시해도 됨

**출력 형식**:
1. 전체 요약 (3줄 이내)
2. 파일별 발견 사항 (라인 번호 + 인용 + 심각도 + 제안)
3. 머지 권장도: ✅ 머지 OK / ⚠️ 수정 후 머지 / ❌ 재작업 필요
4. **Insufficient evidence** — 이 diff만으로는 판단 불가한 항목 (필요한 파일 명시)
5. **Out-of-scope observation** — declared scope 밖이지만 참고할 만한 발견

**금지 사항**:
- "good job", "looks good" 같은 무의미한 칭찬 금지
- 변경되지 않은 줄에 대한 평가 금지
- 추측성 "might be slow" 금지 — 구체적 근거 제시

---

## Rust Review Patterns (mandatory)

Apply every pattern in this section to every changed file. Report per-pattern match/clean with severity BLOCK/SHOULD/NIT. Patterns are derived from historical Copilot findings on PR #66 + PR #72/#85/#95/STL-172 gap analyses; they cover the specific classes of issue shotloom reviewers flag.

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

---

## 변경분 (git diff origin/main..HEAD)

```diff
diff --git a/Cargo.lock b/Cargo.lock
index a2021a5..6885159 100644
--- a/Cargo.lock
+++ b/Cargo.lock
@@ -6583,6 +6583,7 @@ dependencies = [
  "gltf",
  "serde",
  "serde_json",
+ "sha2",
  "shotloom-common",
  "shotloom-fbx-anim",
  "shotloom-gltf",
diff --git a/crates/shotloom-retarget/Cargo.toml b/crates/shotloom-retarget/Cargo.toml
index dd42d6b..579fc25 100644
--- a/crates/shotloom-retarget/Cargo.toml
+++ b/crates/shotloom-retarget/Cargo.toml
@@ -56,6 +56,9 @@ examples = ["dep:bevy", "dep:bevy_vrm1", "dep:bevy_panorbit_camera", "dep:clap"]
 # depend on `shotloom-retarget` do not pull the FBX parser in.
 shotloom-fbx-anim = { path = "../shotloom-fbx-anim" }
 gltf = "1.4"
+# STL-179: body_retarget_regression golden fingerprint. Same version
+# already used by `shotloom-import`.
+sha2 = "0.10"
 
 [[example]]
 name = "fbx_viz"
diff --git a/crates/shotloom-retarget/tests/body_retarget_regression.rs b/crates/shotloom-retarget/tests/body_retarget_regression.rs
new file mode 100644
index 0000000..b2e0038
--- /dev/null
+++ b/crates/shotloom-retarget/tests/body_retarget_regression.rs
@@ -0,0 +1,378 @@
+//! Body retarget golden regression (STL-179 — ADR-0030 Step 0).
+//!
+//! Pins the per-bone rotation output of [`retarget_arp_to_vrm`] for
+//! one canonical ARP→VRM body clip so the Step 1–3 normalizer crate
+//! extractions cannot silently regress the retargeter math.
+//!
+//! Fingerprint format: each quaternion component is formatted with six
+//! fractional digits (`{:+.6}`), giving ~1e-6 tolerance per component
+//! as called out in STL-179 — below that threshold, sub-ulp drift
+//! between platforms (Apple Silicon dev / `ubuntu-latest` CI) is
+//! absorbed before hashing. Each bone then gets its own sha256 digest
+//! over its rotations, and a combined digest pins the overall shape.
+//! When a regression hits, per-bone digests isolate which bone drifted.
+//!
+//! Regenerate after an intentional retargeter change:
+//!
+//! ```text
+//! SHOTLOOM_REGEN_SNAPSHOT=1 \
+//!   cargo test -p shotloom-retarget --test body_retarget_regression
+//! ```
+//!
+//! then commit the updated `.snap` file alongside the change.
+
+use sha2::{Digest, Sha256};
+use shotloom_common::diagnostic::DiagnosticSeverity;
+use shotloom_common::workspace_root;
+use shotloom_fbx_anim::parse as parse_fbx;
+use shotloom_retarget::{
+    build_from_bytes, retarget_arp_to_vrm, RetargeterOptions, TargetAnimation,
+};
+use std::env;
+use std::fmt::Write as _;
+use std::fs;
+use std::path::{Path, PathBuf};
+
+/// Preset 1 from `crates/shotloom-retarget/examples/fixtures.json` —
+/// the primary 1.x female loaded set (`fbx_viz 1`), stable enough to
+/// serve as the single canonical clip for Step 0 per STL-179.
+const VRM_RELATIVE: &str = "assets/models/vrm1x-vroid-f-xiao.vrm";
+const FBX_RELATIVE: &str = "assets/anims/body/21353_F_AiHappy03C_241010.fbx";
+
+const SNAPSHOT_FILE: &str = "body_retarget_preset1.snap";
+const SCHEMA_VERSION: u32 = 1;
+const REGEN_ENV_VAR: &str = "SHOTLOOM_REGEN_SNAPSHOT";
+
+fn snapshot_path() -> PathBuf {
+    Path::new(env!("CARGO_MANIFEST_DIR"))
+        .join("tests/snapshots")
+        .join(SNAPSHOT_FILE)
+}
+
+fn read_fixture(relative: &str) -> Vec<u8> {
+    let path = workspace_root().join(relative);
+    fs::read(&path).unwrap_or_else(|error| {
+        panic!(
+            "failed to read fixture {} ({error}): confirm `assets/` is checked out via git-lfs",
+            path.display()
+        )
+    })
+}
+
+fn compute_animation() -> TargetAnimation {
+    let fbx_bytes = read_fixture(FBX_RELATIVE);
+    let vrm_bytes = read_fixture(VRM_RELATIVE);
+
+    let source = parse_fbx(&fbx_bytes).expect("parse preset-1 body FBX");
+    let (vrm_rest, rest_diagnostics) =
+        build_from_bytes(&vrm_bytes).expect("build VRM rest pose from preset-1 model");
+    assert!(
+        !rest_diagnostics
+            .iter()
+            .any(|d| d.severity == DiagnosticSeverity::Error),
+        "unexpected error diagnostics from build_from_bytes: {rest_diagnostics:?}"
+    );
+
+    let (animation, retarget_diagnostics) =
+        retarget_arp_to_vrm(&source, &vrm_rest, RetargeterOptions::default());
+    assert!(
+        !retarget_diagnostics
+            .iter()
+            .any(|d| d.severity == DiagnosticSeverity::Error),
+        "unexpected error diagnostics from retarget_arp_to_vrm: {retarget_diagnostics:?}"
+    );
+    animation
+}
+
+/// Stable, rounded textual representation of one bone's rotation track.
+fn bone_rotations_text(rotations: &[glam::Quat]) -> String {
+    let mut out = String::with_capacity(rotations.len() * 36);
+    for q in rotations {
+        let _ = writeln!(out, "{:+.6} {:+.6} {:+.6} {:+.6}", q.x, q.y, q.z, q.w);
+    }
+    out
+}
+
+fn hex_digest(bytes: &[u8]) -> String {
+    let digest = Sha256::digest(bytes);
+    let mut out = String::with_capacity(digest.len() * 2);
+    for byte in digest {
+        let _ = write!(out, "{byte:02x}");
+    }
+    out
+}
+
+#[derive(Debug, PartialEq, Eq)]
+struct Fingerprint {
+    schema: u32,
+    vrm: String,
+    fbx: String,
+    frame_count: usize,
+    /// `duration_secs` rounded to six fractional digits to match the
+    /// quaternion rounding tolerance — the raw `f32` is intentionally
+    /// not hashed.
+    duration_rounded: String,
+    bones: Vec<(String, usize, String)>,
+    overall: String,
+}
+
+impl Fingerprint {
+    fn from_animation(animation: &TargetAnimation) -> Self {
+        let mut bones: Vec<(String, usize, String)> = animation
+            .bones
+            .iter()
+            .map(|bone| {
+                let text = bone_rotations_text(&bone.rotations);
+                let digest = hex_digest(text.as_bytes());
+                (bone.vrm_bone_name.clone(), bone.rotations.len(), digest)
+            })
+            .collect();
+        bones.sort_by(|a, b| a.0.cmp(&b.0));
+
+        let mut combined = Sha256::new();
+        for (name, count, digest) in &bones {
+            combined.update(name.as_bytes());
+            combined.update(b":");
+            combined.update(count.to_string().as_bytes());
+            combined.update(b":");
+            combined.update(digest.as_bytes());
+            combined.update(b"\n");
+        }
+        let overall = {
+            let bytes = combined.finalize();
+            let mut out = String::with_capacity(bytes.len() * 2);
+            for byte in bytes {
+                let _ = write!(out, "{byte:02x}");
+            }
+            out
+        };
+
+        let frame_count = animation
+            .bones
+            .iter()
+            .map(|b| b.rotations.len())
+            .max()
+            .unwrap_or(0);
+
+        Self {
+            schema: SCHEMA_VERSION,
+            vrm: VRM_RELATIVE.to_string(),
+            fbx: FBX_RELATIVE.to_string(),
+            frame_count,
+            duration_rounded: format!("{:+.6}", animation.duration_secs),
+            bones,
+            overall,
+        }
+    }
+
+    fn to_text(&self) -> String {
+        let mut out = String::new();
+        out.push_str("# Shotloom body retarget golden — STL-179 (ADR-0030 Step 0).\n");
+        out.push_str(
+            "# Regenerate: SHOTLOOM_REGEN_SNAPSHOT=1 cargo test -p shotloom-retarget \\\n",
+        );
+        out.push_str("#   --test body_retarget_regression\n");
+        out.push_str(
+            "# Fingerprint = sha256(rounded-decimal per-bone rotations); ~1e-6 tolerance.\n",
+        );
+        let _ = writeln!(out, "schema {}", self.schema);
+        let _ = writeln!(out, "vrm {}", self.vrm);
+        let _ = writeln!(out, "fbx {}", self.fbx);
+        let _ = writeln!(out, "frame_count {}", self.frame_count);
+        let _ = writeln!(out, "duration {}", self.duration_rounded);
+        let _ = writeln!(out, "bone_count {}", self.bones.len());
+        out.push_str("bones\n");
+        for (name, count, digest) in &self.bones {
+            let _ = writeln!(out, "  {name} {count} {digest}");
+        }
+        let _ = writeln!(out, "overall {}", self.overall);
+        out
+    }
+
+    fn parse(text: &str) -> Result<Self, String> {
+        let mut schema = None;
+        let mut vrm = None;
+        let mut fbx = None;
+        let mut frame_count = None;
+        let mut duration = None;
+        let mut expected_bone_count = None;
+        let mut overall = None;
+        let mut bones = Vec::new();
+        let mut in_bones = false;
+
+        for (lineno, raw) in text.lines().enumerate() {
+            let line = raw.trim_end();
+            if line.is_empty() || line.starts_with('#') {
+                continue;
+            }
+            if in_bones {
+                let trimmed = line.trim_start();
+                if trimmed == line {
+                    // de-indented → leaving the bones block
+                    in_bones = false;
+                } else {
+                    let mut parts = trimmed.splitn(3, ' ');
+                    let (name, count, digest) = match (parts.next(), parts.next(), parts.next()) {
+                        (Some(n), Some(c), Some(d)) => (n, c, d),
+                        _ => return Err(format!("line {}: malformed bone entry", lineno + 1)),
+                    };
+                    let count: usize = count
+                        .parse()
+                        .map_err(|e| format!("line {}: bad bone count: {e}", lineno + 1))?;
+                    bones.push((name.to_string(), count, digest.to_string()));
+                    continue;
+                }
+            }
+            let mut parts = line.splitn(2, ' ');
+            let key = parts.next().unwrap_or("");
+            let value = parts.next().unwrap_or("").trim();
+            match key {
+                "schema" => schema = Some(value.parse::<u32>().map_err(|e| e.to_string())?),
+                "vrm" => vrm = Some(value.to_string()),
+                "fbx" => fbx = Some(value.to_string()),
+                "frame_count" => {
+                    frame_count = Some(value.parse::<usize>().map_err(|e| e.to_string())?)
+                }
+                "duration" => duration = Some(value.to_string()),
+                "bone_count" => {
+                    expected_bone_count = Some(value.parse::<usize>().map_err(|e| e.to_string())?)
+                }
+                "bones" => in_bones = true,
+                "overall" => overall = Some(value.to_string()),
+                other => return Err(format!("line {}: unknown key `{other}`", lineno + 1)),
+            }
+        }
+
+        let fingerprint = Self {
+            schema: schema.ok_or("missing schema")?,
+            vrm: vrm.ok_or("missing vrm")?,
+            fbx: fbx.ok_or("missing fbx")?,
+            frame_count: frame_count.ok_or("missing frame_count")?,
+            duration_rounded: duration.ok_or("missing duration")?,
+            bones,
+            overall: overall.ok_or("missing overall")?,
+        };
+        if let Some(expected) = expected_bone_count {
+            if expected != fingerprint.bones.len() {
+                return Err(format!(
+                    "bone_count={expected} but found {} bone entries",
+                    fingerprint.bones.len()
+                ));
+            }
+        }
+        Ok(fingerprint)
+    }
+
+    /// Returns `None` if current matches golden, else a readable diff.
+    fn diff(&self, golden: &Self) -> Option<String> {
+        if self == golden {
+            return None;
+        }
+        let mut diff = String::new();
+        if self.schema != golden.schema {
+            let _ = writeln!(diff, "schema: {} → {}", golden.schema, self.schema);
+        }
+        if self.vrm != golden.vrm {
+            let _ = writeln!(diff, "vrm: `{}` → `{}`", golden.vrm, self.vrm);
+        }
+        if self.fbx != golden.fbx {
+            let _ = writeln!(diff, "fbx: `{}` → `{}`", golden.fbx, self.fbx);
+        }
+        if self.frame_count != golden.frame_count {
+            let _ = writeln!(
+                diff,
+                "frame_count: {} → {}",
+                golden.frame_count, self.frame_count
+            );
+        }
+        if self.duration_rounded != golden.duration_rounded {
+            let _ = writeln!(
+                diff,
+                "duration: {} → {}",
+                golden.duration_rounded, self.duration_rounded
+            );
+        }
+
+        let current: std::collections::BTreeMap<&str, (usize, &str)> = self
+            .bones
+            .iter()
+            .map(|(n, c, d)| (n.as_str(), (*c, d.as_str())))
+            .collect();
+        let golden_map: std::collections::BTreeMap<&str, (usize, &str)> = golden
+            .bones
+            .iter()
+            .map(|(n, c, d)| (n.as_str(), (*c, d.as_str())))
+            .collect();
+
+        for (name, (count, digest)) in &current {
+            match golden_map.get(name) {
+                Some((g_count, g_digest)) => {
+                    if count != g_count {
+                        let _ = writeln!(diff, "  {name}: frames {g_count} → {count}");
+                    }
+                    if digest != g_digest {
+                        let _ = writeln!(
+                            diff,
+                            "  {name}: digest {}… → {}…",
+                            &g_digest[..12],
+                            &digest[..12]
+                        );
+                    }
+                }
+                None => {
+                    let _ = writeln!(diff, "  {name}: + new bone ({count} frames)");
+                }
+            }
+        }
+        for name in golden_map.keys() {
+            if !current.contains_key(name) {
+                let _ = writeln!(diff, "  {name}: - removed");
+            }
+        }
+
+        if self.overall != golden.overall {
+            let _ = writeln!(
+                diff,
+                "overall: {}… → {}…",
+                &golden.overall[..12],
+                &self.overall[..12]
+            );
+        }
+        Some(diff)
+    }
+}
+
+#[test]
+fn body_retarget_preset1_matches_golden() {
+    let animation = compute_animation();
+    assert!(
+        !animation.bones.is_empty(),
+        "retargeter returned no bones — fixtures broken?"
+    );
+    let current = Fingerprint::from_animation(&animation);
+    let snapshot = snapshot_path();
+
+    if env::var(REGEN_ENV_VAR).ok().as_deref() == Some("1") {
+        fs::create_dir_all(snapshot.parent().expect("snapshot parent"))
+            .expect("create snapshots dir");
+        fs::write(&snapshot, current.to_text()).expect("write snapshot");
+        eprintln!("regenerated snapshot: {}", snapshot.display());
+        return;
+    }
+
+    let golden_text = fs::read_to_string(&snapshot).unwrap_or_else(|error| {
+        panic!(
+            "missing snapshot {} ({error}). First run: set {REGEN_ENV_VAR}=1",
+            snapshot.display()
+        )
+    });
+    let golden = Fingerprint::parse(&golden_text).expect("golden .snap must parse");
+
+    if let Some(diff) = current.diff(&golden) {
+        panic!(
+            "body retarget output drift from golden:\n{diff}\n\n\
+             If this change is intentional, regenerate with:\n  \
+             {REGEN_ENV_VAR}=1 cargo test -p shotloom-retarget --test body_retarget_regression"
+        );
+    }
+}
diff --git a/crates/shotloom-retarget/tests/snapshots/body_retarget_preset1.snap b/crates/shotloom-retarget/tests/snapshots/body_retarget_preset1.snap
new file mode 100644
index 0000000..f4ef33d
--- /dev/null
+++ b/crates/shotloom-retarget/tests/snapshots/body_retarget_preset1.snap
@@ -0,0 +1,65 @@
+# Shotloom body retarget golden — STL-179 (ADR-0030 Step 0).
+# Regenerate: SHOTLOOM_REGEN_SNAPSHOT=1 cargo test -p shotloom-retarget \
+#   --test body_retarget_regression
+# Fingerprint = sha256(rounded-decimal per-bone rotations); ~1e-6 tolerance.
+schema 1
+vrm assets/models/vrm1x-vroid-f-xiao.vrm
+fbx assets/anims/body/21353_F_AiHappy03C_241010.fbx
+frame_count 1764
+duration +58.766666
+bone_count 53
+bones
+  VRMC_vrm.root_bone 1764 a1707a31fe9ba78d67518049c046cd836f1c667b5e328d0015529d73321a78b2
+  chest 1764 8d69c06ba5dc8f7d3097fd8772528e9c5a24a5710b8bef318e5ee10fd6fb87bf
+  head 1764 68ae1a0bd6fffa14ff0f15a12b51e56c1560fc3cb8507db2c9f958a8c5920743
+  hips 1764 b0d7414f4af2b9b812aadb725c21139778610ae16597bfca5b0e459cc82a0f19
+  leftFoot 1764 d3cd9c23bf875ce09010cdc3c3ccd3330c268322e431bd320d39b4490684a419
+  leftHand 1764 5cd469ac6be2db4e184b2e8f087a2118e35945f5d08c1c55193ff774f517e336
+  leftIndexDistal 1764 a46f1c69aa544eddc4c4cd606e3e93d76e177f15ab2c461abe06254046f5c20b
+  leftIndexIntermediate 1764 f7004c69c8b7c48af8c50216d5721c3e2af9bca6f02a91f328364d9963b31fd9
+  leftIndexProximal 1764 31efc34085ac587823b8548b5c93a5d33c9f0965ca147e23f8dda5fafd1b10d0
+  leftLittleDistal 1764 ee8a5c1c1a5fa7cd804d88d367d9c1a77a97d4143db4b4b98a0efd1cd148a4d4
+  leftLittleIntermediate 1764 17b0f7a7cee290a330455dbdf7766754698b614aa82dedda4598af60bf33024e
+  leftLittleProximal 1764 9eefa56acfd85401ff5af68705afb78027ae48e3f352207fab1bd72514d4a99d
+  leftLowerArm 1764 76acaf59b0fee536731851f21ee02d0731c20132703a2eddd22e429d0d2a2be0
+  leftLowerLeg 1764 6b1cade0db0b95ce3c526a3f484f09d31fbbf1398e2598910120c0cccd3350c9
+  leftMiddleDistal 1764 c231352abdfd133801cc8c789bf16e38d54f209866346aca2a90954b76179ffa
+  leftMiddleIntermediate 1764 46c9dee17c8788e8b3692848bb4c8ddda0d325b12a23be98372eb1e6139c5544
+  leftMiddleProximal 1764 77889e22956c0ec770cad04243afed2a5fa7702a48b7f04af7b5a3bd03898c1a
+  leftRingDistal 1764 9692c16576758124405806ed19b9af5d156ace9a038211eb409999db022bea0d
+  leftRingIntermediate 1764 2d4a7b10863265acadfb706d5edb84e168c486f77c14b0005d4806b2c3192c28
+  leftRingProximal 1764 15b8ad179d71028929c941c27ad6d961c220141f11f3d61d3591b5213501dd85
+  leftShoulder 1764 20632d6693783d098f15de31a681e345a83ae6edfa08c1930ed5e360b6478bb3
+  leftThumbDistal 1764 9ba002ed793de4f2df36e66a04d16bd05916ac6d290c2006142b84ab616b6205
+  leftThumbMetacarpal 1764 d7fe949d90a42058ad50de395cd71fac5b581ad3fface663942a8e29b569d31d
+  leftThumbProximal 1764 37cbd284092bdef76bfd5f55328de5d600762d4219f30772cba6a9e521e77dee
+  leftToes 1764 f9f335c7c4e5a81c7cfd4e0f7b46270428e5a7beb30d8044a8a91b017dc6a9be
+  leftUpperArm 1764 cc8a711af814b932f83983ea8c8a0944e030f3e7caa7a26b9ed38fab033b83c1
+  leftUpperLeg 1764 4d771ee54f37e05986ca9b0f43d76bc4fddcd48f7a090be7ccf018868b34ed82
+  neck 1764 0a3b678baf960de22c7e5a5162de72b0d09951519c9749057b88fdd2d39029f7
+  rightFoot 1764 fa118ca1795f263bacd1bff2ddfd3f7e9bb14bf01ebdf9b9226a5f9b3e1aef46
+  rightHand 1764 c8303288d16b938e99b32dff6bff1c1f7ee87cafbef4262f79a291755b2b1fb6
+  rightIndexDistal 1764 1ec527ff4d3cd21537ea06a47ff32a135f19b1739e824235e2f727a8ab5a82c5
+  rightIndexIntermediate 1764 50f07e95b29edebdae968b10069064bd69eb70df48c54dca8785bbdb5efa0a1a
+  rightIndexProximal 1764 96fe06c4cd37a63030a7b82f126d86506ddfb05c376e359904373bb08a023654
+  rightLittleDistal 1764 cc5d2671c32bc769a1320e399005aba74b84881d50b13d3f763ce2a75895c833
+  rightLittleIntermediate 1764 31bd4b68411050176e3da69cd31408e37d6823b596b6a4a08d2c948017f7e7fa
+  rightLittleProximal 1764 58c8048762568a585e3baca7cdebea1f97f1e8086c38c2c89fe4711c5e6dc1dc
+  rightLowerArm 1764 56df53019b63aede1781ab2e8826359f0feb7254aa3b5ca56648ef18f1248fb3
+  rightLowerLeg 1764 a7d46bfc1925f21959f4118fba6308c9be22980af8490c52d21691e12843e947
+  rightMiddleDistal 1764 b80a78611470645ae4a2aada1ea5469da12657b71923ff65ae3aa72330718adc
+  rightMiddleIntermediate 1764 aa85b043fdba93d22ad3f5f99440959556dcf39955428dd72e08a1e2109b4dde
+  rightMiddleProximal 1764 fd42410b60f90f3b19c98a3ebae00b461501ca717fe2a3d78ddf9da1d593c41a
+  rightRingDistal 1764 ddab5785cde1bb5d3c73f50a4d85b38d0492b6435d00ffc62c290b76f70110b7
+  rightRingIntermediate 1764 0979ffc7dcb9b2579b9c491f27501ee6506779e8c02f2c6df4edce081aa606a0
+  rightRingProximal 1764 9f346b03ed87113ae65b429ae09d2a607b02f45202844ab185b3cab92af89e68
+  rightShoulder 1764 a2b502c4861724afabd6ab8fea413e4b8fbff5262e190467e7c78deb01c4233f
+  rightThumbDistal 1764 42a8cbb39b08ad785c55a413d4a7f44a8c884fabf4454bd4376e3af922ccecf6
+  rightThumbMetacarpal 1764 922be7039baffcb2f92cfa70f1a780ca2af103682f4648e0cba2fe37e31f0cbb
+  rightThumbProximal 1764 a07edb1319f0152c158672afb383a93b8c18b618faec81845dc41eab65ac0b14
+  rightToes 1764 74e7c110f162aded1d6c93b9f804b71a93dcdbb0294b665e52a7c39ed67f18d0
+  rightUpperArm 1764 2fb35557d4fa0104c074a66604a14ae61b0c26ac6e4a6d7b42f2015a04cff0d0
+  rightUpperLeg 1764 9100b45080a95439be4beb67fc3d85b2e13a387fc56682d3b2dea2a03672c3cf
+  spine 1764 f7a9b5e4e1ec0ee1f518cf4453ebe09854c1e62b7103d3e84578e003052501a0
+  upperChest 1764 eedd78eb6e3f493931c2df8e729f56626ce5f055f2c4a6f34c0c74a79768cb2e
+overall 8349ce74c4b17f5ff3584832448caf2803e9c0945a7c0b2805bd0314fe0fe955
```

codex
변경된 테스트와 스냅샷이 실제 리포지토리 구조와 맞는지 먼저 확인하고, 그 다음 패턴별로 diff 범위만 기준으로 결함 여부를 정리하겠습니다.
exec
/bin/zsh -lc 'ls assets/models/vrm1x-vroid-f-xiao.vrm' in /Users/younsoolim/Desktop/www/shotloom/.worktrees/stl-179-body-retarget-regression
exec
/bin/zsh -lc 'ls crates/shotloom-retarget/examples/fixtures.json' in /Users/younsoolim/Desktop/www/shotloom/.worktrees/stl-179-body-retarget-regression
 succeeded in 0ms:
assets/models/vrm1x-vroid-f-xiao.vrm

 succeeded in 0ms:
crates/shotloom-retarget/examples/fixtures.json

exec
/bin/zsh -lc 'ls assets/anims/body/21353_F_AiHappy03C_241010.fbx' in /Users/younsoolim/Desktop/www/shotloom/.worktrees/stl-179-body-retarget-regression
 succeeded in 0ms:
assets/anims/body/21353_F_AiHappy03C_241010.fbx

exec
/bin/zsh -lc "rg -n \"fn retarget_arp_to_vrm|fn build_from_bytes|workspace_root\" crates/shotloom-retarget crates/shotloom-common -g '*.rs'" in /Users/younsoolim/Desktop/www/shotloom/.worktrees/stl-179-body-retarget-regression
 succeeded in 0ms:
crates/shotloom-common/src/lib.rs:10:pub use paths::workspace_root;
crates/shotloom-common/src/paths.rs:24:pub fn workspace_root() -> PathBuf {
crates/shotloom-common/src/paths.rs:37:    fn workspace_root_points_at_repo() {
crates/shotloom-common/src/paths.rs:38:        let root = workspace_root();
crates/shotloom-retarget/src/vrm_rest.rs:59:pub fn build_from_bytes(
crates/shotloom-retarget/src/vrm_rest.rs:362:    fn build_from_bytes_produces_valid_rest_pose() {
crates/shotloom-retarget/src/vrm_rest.rs:428:    fn build_from_bytes_rejects_non_vrm() {
crates/shotloom-retarget/src/vrm_rest.rs:448:    fn build_from_bytes_converts_foot_contact_diagnostic() {
crates/shotloom-retarget/examples/fbx_viz.rs:30:use shotloom_common::workspace_root;
crates/shotloom-retarget/examples/fbx_viz.rs:85:    let workspace_root = workspace_root();
crates/shotloom-retarget/examples/fbx_viz.rs:126:    let animation_abs = resolve_path(&workspace_root, &preset.animation);
crates/shotloom-retarget/src/fixture_paths.rs:3:use shotloom_common::workspace_root;
crates/shotloom-retarget/src/fixture_paths.rs:10:    workspace_root().join(relative)
crates/shotloom-retarget/src/lib.rs:110:pub fn retarget_arp_to_vrm(
crates/shotloom-retarget/src/lib.rs:349:    fn retarget_arp_to_vrm_returns_non_empty_animation_for_basic_arp_asset() {
crates/shotloom-retarget/src/lib.rs:402:    fn retarget_arp_to_vrm_tolerates_missing_optional_toe_tracks() {
crates/shotloom-retarget/tests/fixture_presets.rs:2:use shotloom_common::workspace_root;
crates/shotloom-retarget/tests/fixture_presets.rs:55:    workspace_root().join(path)
crates/shotloom-retarget/tests/body_retarget_regression.rs:26:use shotloom_common::workspace_root;
crates/shotloom-retarget/tests/body_retarget_regression.rs:53:    let path = workspace_root().join(relative);

codex
참조 경로와 식별자는 실제로 존재합니다. 이제 diff 내부 로직에서 실패 모드가 잘못된지, 그리고 패턴 체크리스트 기준으로 빠진 방어가 있는지 좁혀 보겠습니다.
exec
/bin/zsh -lc "sed -n '1,220p' crates/shotloom-retarget/src/lib.rs" in /Users/younsoolim/Desktop/www/shotloom/.worktrees/stl-179-body-retarget-regression
 succeeded in 0ms:
//! ARP (humanoid FBX) → VRM skeletal animation retargeting.
//!
//! This crate owns the transformation from a validated source humanoid
//! animation onto a validated VRM target model, plus the rubric-based
//! quality grading of the result. It does **not** own scene, actor,
//! character, or assembly concepts — those are caller responsibilities
//! in `shotloom-stage`, `shotloom-import`, or editor code.
//!
//! # Current state
//!
//! The crate now carries the full Layer 0–4 retargeter ported from the
//! bevy-vrm reference: source-animation data and views (Layer 0), core
//! domain / config types (Layer 1), topology / VRM-compat / finger-axis
//! utilities (Layer 2), rest-pose helpers, postprocess, and the ARP→VRM
//! structural adapter (Layer 3), and the mapping + retargeter core
//! (Layer 4). The main public entry point (`evaluate_pipeline`) and the
//! quality / rubric modules still land in STL-75.
//!
//! A temporary public API surface is exposed through root-level re-exports
//! so in-crate callers can assemble the pipeline while STL-75 is in
//! flight. Today that includes source asset / skeleton helpers
//! (`compute_source_skeleton`, `euler_to_quat`, `SourceAsset`,
//! `SourceBone`, `SourceBoneTrack`, `SourceFormat`,
//! `SourceSkeletonFrames`), core retargeting domain types
//! (`BoneTrack`, `ExpressionTrack`, `FootContactData`, `FootSideContact`,
//! `MappedAnimation`, `RetargetError`, `RetargetedBone`,
//! `SourceDiagnostics`, `TargetAnimation`, `VrmRestPose`,
//! `swing_twist_decompose`), and the cross-crate sentinel
//! `VRM_ROOT_BONE` (injected into `shotloom_gltf::extract_vrm_rest_data`
//! so the GLB layer stays retarget-agnostic per ADR-0025).
//!
//! This surface is still evolving: STL-75 will replace it with the
//! marker-gated `evaluate_pipeline` contract and add the rubric-related
//! types and modules.
//!
//! # Contract preview
//!
//! See [ADR-0023](../../../docs/adr/adr-0023-retargeter-validation-contract.md)
//! for the binding design decisions. None of the symbols below exist in
//! this crate or in `shotloom-common` yet — they describe the API the
//! ADR locks in, and land in later sessions.
//!
//! - **Operational diagnostic axis** — the public entry point will
//!   report "can retarget run" via `shotloom-common`'s `Diagnostic`
//!   type (ADR-0021), kept separate from the quality-grade axis below.
//! - **Quality grade axis** — crate-local `Grade` / `RubricResult`
//!   (planned) will carry the 4-level rubric scoring of "how faithful
//!   was it."
//! - **Type-level validation** — the public entry point will consume
//!   `shotloom-common::ValidatedSource<'_>` / `ValidatedTarget<'_>`
//!   marker types (planned), enforcing "both inputs validated" at
//!   compile time.
//! - **Scope boundary** — ARP→VRM transformation only. Scene, actor,
//!   character, and assembly remain caller concerns.

#[cfg(not(target_arch = "wasm32"))]
pub mod fixture_paths;

// Layer 0 — source-animation domain types (ADR-0023 §6).
pub(crate) mod source_anim;
pub(crate) mod source_data;

// Layer 1 — core domain types + retarget config.
pub(crate) mod config;
pub(crate) mod types;

// Layer 2 — utilities (topo, vrm_compat, finger_axis_map).
// NOTE: finger_rest_align depends on adapters (Layer 3) and lands there.
pub(crate) mod finger_axis_map;
pub(crate) mod topo;
pub(crate) mod vrm_compat;

// Layer 3 — rest pose + postprocess + adapters + finger_rest_align.
pub(crate) mod adapters;
pub(crate) mod finger_rest_align;
pub(crate) mod postprocess;
pub(crate) mod vrm_rest;

// Layer 4 — mapping + retargeter.
pub(crate) mod mapping;
pub(crate) mod retargeter;

use std::collections::{BTreeMap, HashMap};

use shotloom_common::diagnostic::Diagnostic;

use crate::config::RetargetConfig;

pub use mapping::VRM_ROOT_BONE;
pub use retargeter::RetargeterOptions;
// `shotloom_gltf::VrmRestError` is intentionally not re-exported here
// — see STL-114. Re-exporting the type across the retarget boundary
// would couple its public API to every variant of an error enum owned
// by a different crate. Downstream callers that need the type should
// import it from `shotloom_gltf` directly (per
// `docs/guidelines/error-handling.md` §6, `#[non_exhaustive]` is off
// by default inside this workspace and is not a substitute for proper
// boundary isolation).
pub use source_data::{
    compute_source_skeleton, euler_to_quat, SourceAsset, SourceBone, SourceBoneTrack, SourceFormat,
    SourceSkeletonFrames,
};
pub use types::{
    swing_twist_decompose, BoneTrack, ExpressionTrack, FootContactData, FootSideContact,
    MappedAnimation, RetargetError, RetargetedBone, SourceDiagnostics, TargetAnimation,
    VrmRestPose,
};
pub use vrm_rest::{build_from_bevy_vrm, build_from_bytes, compute_virtual_rest_global};

pub fn retarget_arp_to_vrm(
    source: &SourceAsset,
    vrm_rest: &VrmRestPose,
    options: RetargeterOptions,
) -> (TargetAnimation, Vec<Diagnostic>) {
    let config = default_arp_retarget_config();
    let mapped = match mapping::retarget(source, &config, vrm_compat::VrmVersion::V1_0) {
        Ok(mapped) => mapped,
        Err(error) => {
            let diagnostic = Diagnostic::error(
                "retarget_mapping_failed",
                format!("ARP→VRM mapping failed: {error}"),
            )
            .with_source("shotloom_retarget")
            .with_recoverable(true)
            .with_suggestion(
                "Validate the source asset and required ARP markers before calling retarget_arp_to_vrm.",
            );
            return (empty_target_animation(source.duration), vec![diagnostic]);
        }
    };
    let source_frames = compute_source_skeleton(source);
    let retargeter = retargeter::ArpRetargeterInner::new_with_options(
        vrm_rest.clone(),
        Some(source_frames),
        &mapped,
        "root",
        "root.x",
        options,
    );
    let animation = retargeter.apply(&mapped);
    let diagnostics = animation
        .log
        .iter()
        .filter(|line| line.starts_with("[ADAPTER]") || line.starts_with("[STAGE-"))
        .map(|line| {
            let diagnostic = if line.contains("unknown strategy") {
                Diagnostic::warning("retarget_adapter_warning", line.clone())
            } else {
                Diagnostic::info("retarget_adapter_info", line.clone())
            };
            diagnostic
                .with_source("shotloom_retarget")
                .with_recoverable(true)
        })
        .collect();
    (animation, diagnostics)
}

fn empty_target_animation(duration_secs: f32) -> TargetAnimation {
    TargetAnimation {
        duration_secs,
        bones: Vec::new(),
        expression_tracks: Vec::new(),
        log: Vec::new(),
    }
}

fn default_arp_retarget_config() -> RetargetConfig {
    let direct_map = BTreeMap::from([
        ("root.x".to_string(), "hips".to_string()),
        ("spine_01.x".to_string(), "spine".to_string()),
        ("spine_02.x".to_string(), "chest".to_string()),
        ("spine_03.x".to_string(), "upperChest".to_string()),
        ("neck.x".to_string(), "neck".to_string()),
        ("head.x".to_string(), "head".to_string()),
        ("shoulder.l".to_string(), "leftShoulder".to_string()),
        ("arm_stretch.l".to_string(), "leftUpperArm".to_string()),
        ("forearm_stretch.l".to_string(), "leftLowerArm".to_string()),
        ("hand.l".to_string(), "leftHand".to_string()),
        ("shoulder.r".to_string(), "rightShoulder".to_string()),
        ("arm_stretch.r".to_string(), "rightUpperArm".to_string()),
        ("forearm_stretch.r".to_string(), "rightLowerArm".to_string()),
        ("hand.r".to_string(), "rightHand".to_string()),
        ("thigh_stretch.l".to_string(), "leftUpperLeg".to_string()),
        ("leg_stretch.l".to_string(), "leftLowerLeg".to_string()),
        ("foot.l".to_string(), "leftFoot".to_string()),
        ("toes_01.l".to_string(), "leftToes".to_string()),
        ("thigh_stretch.r".to_string(), "rightUpperLeg".to_string()),
        ("leg_stretch.r".to_string(), "rightLowerLeg".to_string()),
        ("foot.r".to_string(), "rightFoot".to_string()),
        ("toes_01.r".to_string(), "rightToes".to_string()),
        ("c_thumb1.l".to_string(), "leftThumbMetacarpal".to_string()),
        ("c_thumb2.l".to_string(), "leftThumbProximal".to_string()),
        ("c_thumb3.l".to_string(), "leftThumbDistal".to_string()),
        ("c_index1.l".to_string(), "leftIndexProximal".to_string()),
        (
            "c_index2.l".to_string(),
            "leftIndexIntermediate".to_string(),
        ),
        ("c_index3.l".to_string(), "leftIndexDistal".to_string()),
        ("c_middle1.l".to_string(), "leftMiddleProximal".to_string()),
        (
            "c_middle2.l".to_string(),
            "leftMiddleIntermediate".to_string(),
        ),
        ("c_middle3.l".to_string(), "leftMiddleDistal".to_string()),
        ("c_ring1.l".to_string(), "leftRingProximal".to_string()),
        ("c_ring2.l".to_string(), "leftRingIntermediate".to_string()),
        ("c_ring3.l".to_string(), "leftRingDistal".to_string()),
        ("c_pinky1.l".to_string(), "leftLittleProximal".to_string()),
        (
            "c_pinky2.l".to_string(),
            "leftLittleIntermediate".to_string(),
        ),
        ("c_pinky3.l".to_string(), "leftLittleDistal".to_string()),
        ("c_thumb1.r".to_string(), "rightThumbMetacarpal".to_string()),
        ("c_thumb2.r".to_string(), "rightThumbProximal".to_string()),
        ("c_thumb3.r".to_string(), "rightThumbDistal".to_string()),
        ("c_index1.r".to_string(), "rightIndexProximal".to_string()),
        (

exec
/bin/zsh -lc "sed -n '1,220p' crates/shotloom-common/src/paths.rs" in /Users/younsoolim/Desktop/www/shotloom/.worktrees/stl-179-body-retarget-regression
 succeeded in 0ms:
//! Workspace-relative path helpers shared across crates.
//!
//! All Shotloom crates live under `<repo>/crates/*`, so this crate's
//! own `CARGO_MANIFEST_DIR` is `<repo>/crates/shotloom-common`. Walking
//! up two parents yields the workspace root regardless of which crate
//! depends on this helper. Tests and examples use this to resolve
//! fixtures in the shared `assets/` tree (STL-142 consolidated
//! fixtures there).
//!
//! Native-only: `CARGO_MANIFEST_DIR` bakes a host filesystem path at
//! compile time, which has no meaning in a WASM/browser runtime. The
//! module is gated to `cfg(not(target_arch = "wasm32"))` in `lib.rs`
//! so calling it from WASM is a compile error rather than a silent
//! host-path leak into the browser binary.

use std::path::PathBuf;

/// Absolute path to the workspace root (the directory containing
/// `Cargo.toml`, `crates/`, and `assets/`).
///
/// Panics if `shotloom-common` is ever relocated out of `<repo>/crates/`.
/// The panic message points at the invariant so a future move is
/// obvious in the failure.
pub fn workspace_root() -> PathBuf {
    PathBuf::from(env!("CARGO_MANIFEST_DIR"))
        .parent()
        .and_then(|p| p.parent())
        .expect("shotloom-common must live under <workspace>/crates/")
        .to_path_buf()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn workspace_root_points_at_repo() {
        let root = workspace_root();
        assert!(
            root.join("crates").is_dir(),
            "expected {} to contain a `crates/` directory",
            root.display(),
        );
        assert!(
            root.join("Cargo.toml").is_file(),
            "expected {} to contain a workspace Cargo.toml",
            root.display(),
        );
    }
}

exec
/bin/zsh -lc "rg -n \"pub struct TargetAnimation|struct TargetAnimation|vrm_bone_name|rotations\" crates/shotloom-retarget -g '*.rs'" in /Users/younsoolim/Desktop/www/shotloom/.worktrees/stl-179-body-retarget-regression
 succeeded in 0ms:
crates/shotloom-retarget/src/postprocess/wrist_twist.rs:39://! applies to FBX bone rotations before measurement.
crates/shotloom-retarget/src/postprocess/wrist_twist.rs:91:        let Some(fars) = fbx_skel.bone_rotations.get(fak) else {
crates/shotloom-retarget/src/postprocess/wrist_twist.rs:94:        let Some(fhrs) = fbx_skel.bone_rotations.get(fhk) else {
crates/shotloom-retarget/src/postprocess/wrist_twist.rs:97:        let Some(rh) = anim.bones.iter_mut().find(|b| b.vrm_bone_name == vrm_hand) else {
crates/shotloom-retarget/src/postprocess/wrist_twist.rs:101:        let n = rh.rotations.len().min(fars.len()).min(fhrs.len());
crates/shotloom-retarget/src/postprocess/wrist_twist.rs:115:            rh.rotations[f] = (rh.rotations[f] * extra).normalize();
crates/shotloom-retarget/src/mapping.rs:256:                let rotations = if is_blender {
crates/shotloom-retarget/src/mapping.rs:258:                    track.rotations.iter().map(|&r| rest_inv * r).collect()
crates/shotloom-retarget/src/mapping.rs:260:                    track.rotations.clone()
crates/shotloom-retarget/src/mapping.rs:277:                    vrm_bone_name: VRM_ROOT_BONE.to_string(),
crates/shotloom-retarget/src/mapping.rs:280:                    rotations,
crates/shotloom-retarget/src/mapping.rs:316:            let rotations = if is_blender {
crates/shotloom-retarget/src/mapping.rs:318:                track.rotations.iter().map(|&r| rest_inv * r).collect()
crates/shotloom-retarget/src/mapping.rs:320:                track.rotations.clone()
crates/shotloom-retarget/src/mapping.rs:349:                vrm_bone_name: vrm_bone,
crates/shotloom-retarget/src/mapping.rs:352:                rotations,
crates/shotloom-retarget/src/mapping.rs:392:                for (i, &r) in track.rotations.iter().enumerate() {
crates/shotloom-retarget/src/mapping.rs:445:            vrm_bone_name: vrm_bone.clone(),
crates/shotloom-retarget/src/mapping.rs:448:            rotations: accumulated,
crates/shotloom-retarget/src/retargeter.rs:27:    /// Index into active_bones / bone_rotations arrays
crates/shotloom-retarget/src/retargeter.rs:55:    all_rotations: Vec<Vec<Quat>>,
crates/shotloom-retarget/src/retargeter.rs:247:                    .find(|t| t.vrm_bone_name == name)
crates/shotloom-retarget/src/retargeter.rs:305:            .map(|t| (t.vrm_bone_name.as_str(), t))
crates/shotloom-retarget/src/retargeter.rs:408:            .map(|t| (t.vrm_bone_name.as_str(), t.src_bone_name.as_str()))
crates/shotloom-retarget/src/retargeter.rs:461:    /// Stores results in `buffers.all_rotations` and `buffers.all_translations`.
crates/shotloom-retarget/src/retargeter.rs:479:                    .rotations
crates/shotloom-retarget/src/retargeter.rs:522:                buffers.all_rotations[bd.idx].push(local);
crates/shotloom-retarget/src/retargeter.rs:531:    /// Modifies `buffers.all_rotations` and `buffers.world_rot/world_pos`
crates/shotloom-retarget/src/retargeter.rs:595:                    buffers.all_rotations[pair.bone_idx][frame] = new_local;
crates/shotloom-retarget/src/retargeter.rs:610:                        let desc_local = buffers.all_rotations[desc_idx][frame];
crates/shotloom-retarget/src/retargeter.rs:624:    /// `buffers.all_rotations`, `buffers.world_rot`, and
crates/shotloom-retarget/src/retargeter.rs:687:                    buffers.all_rotations[foot_idx][frame] =
crates/shotloom-retarget/src/retargeter.rs:703:                .find(|t| t.vrm_bone_name == "leftToes")
crates/shotloom-retarget/src/retargeter.rs:708:                .find(|t| t.vrm_bone_name == "rightToes")
crates/shotloom-retarget/src/retargeter.rs:767:                        let lr = buffers.all_rotations[idx]
crates/shotloom-retarget/src/retargeter.rs:844:            .map(|t| t.rotations.len())
crates/shotloom-retarget/src/retargeter.rs:851:            .map(|t| (t.vrm_bone_name.as_str(), t))
crates/shotloom-retarget/src/retargeter.rs:870:        let all_rotations: Vec<Vec<Quat>> =
crates/shotloom-retarget/src/retargeter.rs:879:            all_rotations,
crates/shotloom-retarget/src/retargeter.rs:900:            let rotations = std::mem::take(&mut buffers.all_rotations[bd.idx]);
crates/shotloom-retarget/src/retargeter.rs:901:            if rotations.is_empty() {
crates/shotloom-retarget/src/retargeter.rs:907:                if let Some(&first_rot) = rotations.first() {
crates/shotloom-retarget/src/retargeter.rs:933:                vrm_bone_name: bd.vrm_name.clone(),
crates/shotloom-retarget/src/retargeter.rs:934:                rotations,
crates/shotloom-retarget/src/retargeter.rs:1002:            let rotations: Vec<Quat> = src
crates/shotloom-retarget/src/retargeter.rs:1005:                .map(|t| t.rotations.clone())
crates/shotloom-retarget/src/retargeter.rs:1009:                vrm_bone_name: vrm_name.clone(),
crates/shotloom-retarget/src/retargeter.rs:1010:                rotations,
crates/shotloom-retarget/src/finger_axis_map.rs:38:    pub vrm_bone_name: String,
crates/shotloom-retarget/src/finger_axis_map.rs:51:pub fn is_handled_finger(vrm_bone_name: &str) -> bool {
crates/shotloom-retarget/src/finger_axis_map.rs:52:    let lower = vrm_bone_name.to_lowercase();
crates/shotloom-retarget/src/finger_axis_map.rs:63:pub fn is_any_finger(vrm_bone_name: &str) -> bool {
crates/shotloom-retarget/src/finger_axis_map.rs:64:    let lower = vrm_bone_name.to_lowercase();
crates/shotloom-retarget/src/finger_axis_map.rs:102:pub fn vrm_curl_axis_for(vrm_bone_name: &str) -> Vec3 {
crates/shotloom-retarget/src/finger_axis_map.rs:103:    let is_right = vrm_bone_name.to_lowercase().starts_with("right")
crates/shotloom-retarget/src/finger_axis_map.rs:104:        || vrm_bone_name.to_lowercase().contains("right");
crates/shotloom-retarget/src/finger_axis_map.rs:113:/// **world space** using both rigs' global rest rotations.
crates/shotloom-retarget/src/finger_axis_map.rs:176:        .filter(|t| is_any_finger(&t.vrm_bone_name))
crates/shotloom-retarget/src/finger_axis_map.rs:178:    sorted_tracks.sort_by(|a, b| a.vrm_bone_name.cmp(&b.vrm_bone_name));
crates/shotloom-retarget/src/finger_axis_map.rs:185:        let name = &track.vrm_bone_name;
crates/shotloom-retarget/src/finger_axis_map.rs:231:                    vrm_bone_name: name.clone(),
crates/shotloom-retarget/src/finger_axis_map.rs:259:            .find(|t| t.vrm_bone_name == *hand_name)
crates/shotloom-retarget/src/finger_axis_map.rs:321:    fn identity_track(vrm_bone_name: &str) -> BoneTrack {
crates/shotloom-retarget/src/finger_axis_map.rs:323:            vrm_bone_name: vrm_bone_name.to_string(),
crates/shotloom-retarget/src/finger_axis_map.rs:324:            src_bone_name: vrm_bone_name.to_string(),
crates/shotloom-retarget/src/finger_axis_map.rs:326:            rotations: vec![Quat::IDENTITY],
crates/shotloom-retarget/src/finger_axis_map.rs:338:    fn finger_track_with_rest(vrm_bone_name: &str, rest_angle_rad: f32) -> BoneTrack {
crates/shotloom-retarget/src/finger_axis_map.rs:341:            vrm_bone_name: vrm_bone_name.to_string(),
crates/shotloom-retarget/src/finger_axis_map.rs:342:            src_bone_name: vrm_bone_name.to_string(),
crates/shotloom-retarget/src/finger_axis_map.rs:344:            rotations: vec![Quat::IDENTITY, Quat::from_rotation_x(rest_angle_rad * 0.5)],
crates/shotloom-retarget/src/source_data.rs:84:    pub rotations: Vec<Quat>,
crates/shotloom-retarget/src/source_data.rs:97:    pub bone_rotations: HashMap<String, Vec<Quat>>,
crates/shotloom-retarget/src/source_data.rs:178:    let mut bone_rotations: HashMap<String, Vec<Quat>> = HashMap::new();
crates/shotloom-retarget/src/source_data.rs:202:                .and_then(|t| t.rotations.get(frame))
crates/shotloom-retarget/src/source_data.rs:227:                bone_rotations.entry(name.clone()).or_default().push(rot);
crates/shotloom-retarget/src/source_data.rs:236:        bone_rotations,
crates/shotloom-retarget/src/adapters/arp_vrm_user_pose.rs:8://! Unlike automatic rest sync (which reads ARP source bone rotations
crates/shotloom-retarget/src/adapters/arp_vrm_user_pose.rs:50:    pub vrm_bone_name: &'static str,
crates/shotloom-retarget/src/adapters/arp_vrm_user_pose.rs:62:        vrm_bone_name: "leftUpperArm",
crates/shotloom-retarget/src/adapters/arp_vrm_user_pose.rs:66:        vrm_bone_name: "leftLowerArm",
crates/shotloom-retarget/src/adapters/arp_vrm_user_pose.rs:71:        vrm_bone_name: "rightUpperArm",
crates/shotloom-retarget/src/adapters/arp_vrm_user_pose.rs:75:        vrm_bone_name: "rightLowerArm",
crates/shotloom-retarget/src/adapters/arp_vrm_user_pose.rs:87:        vrm_bone_name: "leftThumbMetacarpal",
crates/shotloom-retarget/src/adapters/arp_vrm_user_pose.rs:91:        vrm_bone_name: "leftThumbProximal",
crates/shotloom-retarget/src/adapters/arp_vrm_user_pose.rs:95:        vrm_bone_name: "leftThumbDistal",
crates/shotloom-retarget/src/adapters/arp_vrm_user_pose.rs:99:        vrm_bone_name: "rightThumbMetacarpal",
crates/shotloom-retarget/src/adapters/arp_vrm_user_pose.rs:103:        vrm_bone_name: "rightThumbProximal",
crates/shotloom-retarget/src/adapters/arp_vrm_user_pose.rs:107:        vrm_bone_name: "rightThumbDistal",
crates/shotloom-retarget/src/adapters/arp_vrm_user_pose.rs:120:pub fn lookup(vrm_bone_name: &str) -> Option<Quat> {
crates/shotloom-retarget/src/adapters/arp_vrm_user_pose.rs:123:        .find(|p| p.vrm_bone_name == vrm_bone_name)
crates/shotloom-retarget/src/adapters/arp_vrm.rs:46://! boundary so the quaternion double-cover (q ≡ -q as rotations but
crates/shotloom-retarget/src/adapters/arp_vrm.rs:180:    vrm_bone_name: &str,
crates/shotloom-retarget/src/adapters/arp_vrm.rs:184:    if let Some(delta) = super::arp_vrm_user_pose::lookup(vrm_bone_name) {
crates/shotloom-retarget/src/adapters/arp_vrm.rs:192:                if crate::config::glob_match(pattern, vrm_bone_name) {
crates/shotloom-retarget/src/adapters/arp_vrm.rs:206:    let lower = vrm_bone_name.to_lowercase();
crates/shotloom-retarget/src/adapters/arp_vrm.rs:231:        .find(|t| t.vrm_bone_name == bone_name)
crates/shotloom-retarget/src/adapters/arp_vrm.rs:390:        match rest_sync_strategy(&track.vrm_bone_name, config) {
crates/shotloom-retarget/src/adapters/arp_vrm.rs:391:            RestSyncStrategy::DirectCopy => direct_bones.push(track.vrm_bone_name.clone()),
crates/shotloom-retarget/src/adapters/arp_vrm.rs:392:            RestSyncStrategy::ScalarCurl => curl_bones.push(track.vrm_bone_name.clone()),
crates/shotloom-retarget/src/adapters/arp_vrm.rs:394:                user_calib_bones.push((track.vrm_bone_name.clone(), q))
crates/shotloom-retarget/src/vrm_rest.rs:132:/// rest rotations. The retargeter's `pass2_direction_correction`
crates/shotloom-retarget/src/finger_rest_align.rs:56:    pub vrm_bone_name: String,
crates/shotloom-retarget/src/finger_rest_align.rs:116:            vrm_bone_name: vrm_name.clone(),
crates/shotloom-retarget/src/finger_rest_align.rs:146:        vrm_rest_local.insert(o.vrm_bone_name.clone(), o.new_local);
crates/shotloom-retarget/src/finger_rest_align.rs:147:        vrm_rest_global.insert(o.vrm_bone_name.clone(), o.new_global);
crates/shotloom-retarget/src/finger_rest_align.rs:150:            vrm_name: o.vrm_bone_name.clone(),
crates/shotloom-retarget/src/finger_rest_align.rs:163:fn segment_depth(vrm_bone_name: &str) -> u32 {
crates/shotloom-retarget/src/finger_rest_align.rs:164:    let lower = vrm_bone_name.to_lowercase();
crates/shotloom-retarget/src/types.rs:95:    /// vrm_bone_name → local rest rotation
crates/shotloom-retarget/src/types.rs:97:    /// vrm_bone_name → skeleton-space global rest rotation
crates/shotloom-retarget/src/types.rs:99:    /// vrm_bone_name → local rest translation
crates/shotloom-retarget/src/types.rs:101:    /// vrm_bone_name → world position at rest (for A-pose detection)
crates/shotloom-retarget/src/types.rs:103:    /// vrm_bone_name → parent vrm_bone_name
crates/shotloom-retarget/src/types.rs:127:    pub vrm_bone_name: String,
crates/shotloom-retarget/src/types.rs:128:    pub rotations: Vec<Quat>,
crates/shotloom-retarget/src/types.rs:138:pub struct TargetAnimation {
crates/shotloom-retarget/src/types.rs:167:    pub vrm_bone_name: String,
crates/shotloom-retarget/src/types.rs:168:    /// Source bone name (with prefix, for looking up world rotations).
crates/shotloom-retarget/src/types.rs:174:    /// `full_anim = src_local_rest * rotations[frame]` (see
crates/shotloom-retarget/src/types.rs:180:    /// - **UE / Maya** — `rotations` is the raw source-local animation
crates/shotloom-retarget/src/types.rs:183:    ///   folded into *both* fields at mapping time: `rotations` is
crates/shotloom-retarget/src/types.rs:186:    ///   inside `full_anim = src_local_rest * rotations[frame]`, so the
crates/shotloom-retarget/src/types.rs:189:    /// Callers must therefore not assume `rotations` are raw source-local
crates/shotloom-retarget/src/types.rs:192:    pub rotations: Vec<Quat>,
crates/shotloom-retarget/src/types.rs:195:    /// [`Self::rotations`] when reconstructing the full local animated
crates/shotloom-retarget/src/types.rs:196:    /// rotation via `full_anim = src_local_rest * rotations[frame]`.
crates/shotloom-retarget/src/types.rs:200:    /// `lcl_rot_rest⁻¹` folded into `rotations`). See [`Self::rotations`]
crates/shotloom-retarget/src/lib.rs:292:        rotations: Vec<Quat>,
crates/shotloom-retarget/src/lib.rs:296:            rotations,
crates/shotloom-retarget/src/lib.rs:394:            .any(|bone| bone.vrm_bone_name == "hips"));
crates/shotloom-retarget/src/lib.rs:456:            .any(|bone| bone.vrm_bone_name == "leftFoot"));
crates/shotloom-retarget/tests/body_retarget_regression.rs:12://! over its rotations, and a combined digest pins the overall shape.
crates/shotloom-retarget/tests/body_retarget_regression.rs:88:fn bone_rotations_text(rotations: &[glam::Quat]) -> String {
crates/shotloom-retarget/tests/body_retarget_regression.rs:89:    let mut out = String::with_capacity(rotations.len() * 36);
crates/shotloom-retarget/tests/body_retarget_regression.rs:90:    for q in rotations {
crates/shotloom-retarget/tests/body_retarget_regression.rs:125:                let text = bone_rotations_text(&bone.rotations);
crates/shotloom-retarget/tests/body_retarget_regression.rs:127:                (bone.vrm_bone_name.clone(), bone.rotations.len(), digest)
crates/shotloom-retarget/tests/body_retarget_regression.rs:153:            .map(|b| b.rotations.len())
crates/shotloom-retarget/tests/body_retarget_regression.rs:176:            "# Fingerprint = sha256(rounded-decimal per-bone rotations); ~1e-6 tolerance.\n",

codex
**전체 요약**

이번 diff의 핵심 리스크는 2개입니다. 첫째, `sha2`가 테스트 전용 용도인데 런타임 의존성으로 추가되어 crate 소비자에게 불필요한 빌드 비용을 전가합니다. 둘째, fixture가 git-lfs 포인터인 경우 현재 실패 경로가 그 사실을 식별하지 못해, STL-179의 알려진 제약을 진단 메시지에 제대로 반영하지 못합니다.

소유권/대여, panic hot path, 동시성, classifier/fallback 계열, Windows FS 의미론, 회귀 테스트 존재 여부 자체는 이번 diff 범위에서는 큰 문제를 보지 못했습니다.

체크리스트 요약: `1 OK`, `2~3 일부 보완 필요`, `4 OK`, `5 1건`, `6 OK`, `7 1건`, `8 OK`.

**파일별 발견 사항**

1. [crates/shotloom-retarget/Cargo.toml](/Users/younsoolim/Desktop/www/shotloom/.worktrees/stl-179-body-retarget-regression/crates/shotloom-retarget/Cargo.toml:56)  
   인용: `sha2 = "0.10"`  
   심각도: 🟡 **Should**  
   제안: 이 의존성은 현재 [body_retarget_regression.rs](/Users/younsoolim/Desktop/www/shotloom/.worktrees/stl-179-body-retarget-regression/crates/shotloom-retarget/tests/body_retarget_regression.rs:1) 에서만 사용됩니다. `[dependencies]`가 아니라 `[dev-dependencies]`로 옮기는 편이 맞습니다. 지금 형태는 라이브러리 사용자와 일반 `cargo build -p shotloom-retarget` 경로에도 불필요한 해시 crate를 끌어옵니다.  
   패턴 판정: `A1 clean`, `A6 clean`, `E2 clean`, `G6 clean`, 그 외는 이 파일 기준 `N/A`.

2. [crates/shotloom-retarget/tests/body_retarget_regression.rs](/Users/younsoolim/Desktop/www/shotloom/.worktrees/stl-179-body-retarget-regression/crates/shotloom-retarget/tests/body_retarget_regression.rs:53)  
   인용: `fs::read(&path)... "confirm assets/ is checked out via git-lfs"` 와 `parse_fbx(&fbx_bytes).expect("parse preset-1 body FBX")`  
   심각도: 🟡 **Should**  
   제안: 현재는 “파일이 아예 없을 때만” git-lfs 힌트를 주고, 더 흔한 실패 모드인 “LFS 포인터 파일은 존재하지만 blob이 미다운로드된 상태”에서는 `parse preset-1 body FBX` / `build VRM rest pose...` 같은 불충분한 panic으로 끝납니다. `version https://git-lfs.github.com/spec/v1` 헤더를 검사해 명시적으로 `git lfs pull` 힌트를 주거나, 최소한 `expect(...)` 메시지에 fixture 경로와 LFS 힌트를 포함시키는 편이 디버깅 가능성이 훨씬 높습니다.  
   패턴 판정: `A1 clean`, `A2 clean`, `A5 clean`, `A6 clean`, `B1 clean`, `B2 clean`, `C1 clean`, `C2 clean`, `C3 clean`, `D1 clean`(테스트 코드의 `eprintln!`만 존재), `D2 clean`(라이브러리 hot path 아님), `D3 clean`, `D4 clean`, `D5 clean`, `E3 clean`, `F1 clean`, `F2 clean`, `F3 clean`, `G6 clean`, `G7 clean`.

3. [crates/shotloom-retarget/tests/body_retarget_regression.rs](/Users/younsoolim/Desktop/www/shotloom/.worktrees/stl-179-body-retarget-regression/crates/shotloom-retarget/tests/body_retarget_regression.rs:298)  
   인용: `&g_digest[..12]`, `&digest[..12]`  
   심각도: 🟢 **Nit**  
   제안: `parse()`가 digest 길이를 검증하지 않기 때문에 `.snap` 파일이 수동 편집/충돌 해소로 잘못 잘린 경우, “파싱 실패”가 아니라 여기서 슬라이싱 panic이 납니다. `parse()`에서 64-hex를 검증하거나, 표시용 prefix는 `get(..12)`로 방어하면 테스트 실패 원인이 더 직접적으로 드러납니다.  
   패턴 판정: `2. Panic 유발`에만 경미한 보완 포인트가 있고, 나머지 관련 패턴은 위 항목과 동일하게 clean입니다.

4. [crates/shotloom-retarget/tests/snapshots/body_retarget_preset1.snap](/Users/younsoolim/Desktop/www/shotloom/.worktrees/stl-179-body-retarget-regression/crates/shotloom-retarget/tests/snapshots/body_retarget_preset1.snap:1)  
   발견 사항: `OK`  
   패턴 판정: `A2 clean`, `A6 clean`, `G6 clean`, 그 외는 `N/A`.

5. `Cargo.lock`  
   발견 사항: `OK`  
   패턴 판정: `E2 clean`(의존성 변경과 lockfile 갱신이 함께 들어왔음), 그 외는 `N/A`.

**머지 권장도**

⚠️ 수정 후 머지

**Insufficient evidence**

- `A4` PR 본문 일치 여부: 실제 PR description이 diff에 없어서 판단 불가. 필요한 자료: PR 본문.
- `G2` 커밋 메시지 규약 준수 여부: diff만으로는 불가. 필요한 자료: `git log origin/main..HEAD --format='%s%n%b%n---'`.
- `G3` PR 제목/본문 형식 준수 여부: diff만으로는 불가. 필요한 자료: PR 제목과 본문.
- `G4` 브랜치 명명 규칙 준수 여부: diff만으로는 불가. 필요한 자료: 현재 브랜치명.
- STL-179의 `cargo test` 5초 제약 충족 여부: 코드만으로는 판단 불가. 필요한 자료: `cargo test -p shotloom-retarget --test body_retarget_regression`의 실제 wall-clock 시간, 가능하면 `ubuntu-latest` 기준 측정값.
- Apple Silicon vs `ubuntu-latest` 간 golden 안정성: 반올림 설계 의도는 보이지만 실제 교차 플랫폼 결과는 diff만으로 검증 불가. 필요한 자료: 두 플랫폼에서 생성/검증한 테스트 로그.

**Out-of-scope observation**

- 없음.

**결론: 런타임 의존성 분리(`sha2` → `dev-dependencies`)와 git-lfs 실패 진단 보강은 머지 전에 정리하는 편이 맞습니다.**
tokens used
62,894
**전체 요약**

이번 diff의 핵심 리스크는 2개입니다. 첫째, `sha2`가 테스트 전용 용도인데 런타임 의존성으로 추가되어 crate 소비자에게 불필요한 빌드 비용을 전가합니다. 둘째, fixture가 git-lfs 포인터인 경우 현재 실패 경로가 그 사실을 식별하지 못해, STL-179의 알려진 제약을 진단 메시지에 제대로 반영하지 못합니다.

소유권/대여, panic hot path, 동시성, classifier/fallback 계열, Windows FS 의미론, 회귀 테스트 존재 여부 자체는 이번 diff 범위에서는 큰 문제를 보지 못했습니다.

체크리스트 요약: `1 OK`, `2~3 일부 보완 필요`, `4 OK`, `5 1건`, `6 OK`, `7 1건`, `8 OK`.

**파일별 발견 사항**

1. [crates/shotloom-retarget/Cargo.toml](/Users/younsoolim/Desktop/www/shotloom/.worktrees/stl-179-body-retarget-regression/crates/shotloom-retarget/Cargo.toml:56)  
   인용: `sha2 = "0.10"`  
   심각도: 🟡 **Should**  
   제안: 이 의존성은 현재 [body_retarget_regression.rs](/Users/younsoolim/Desktop/www/shotloom/.worktrees/stl-179-body-retarget-regression/crates/shotloom-retarget/tests/body_retarget_regression.rs:1) 에서만 사용됩니다. `[dependencies]`가 아니라 `[dev-dependencies]`로 옮기는 편이 맞습니다. 지금 형태는 라이브러리 사용자와 일반 `cargo build -p shotloom-retarget` 경로에도 불필요한 해시 crate를 끌어옵니다.  
   패턴 판정: `A1 clean`, `A6 clean`, `E2 clean`, `G6 clean`, 그 외는 이 파일 기준 `N/A`.

2. [crates/shotloom-retarget/tests/body_retarget_regression.rs](/Users/younsoolim/Desktop/www/shotloom/.worktrees/stl-179-body-retarget-regression/crates/shotloom-retarget/tests/body_retarget_regression.rs:53)  
   인용: `fs::read(&path)... "confirm assets/ is checked out via git-lfs"` 와 `parse_fbx(&fbx_bytes).expect("parse preset-1 body FBX")`  
   심각도: 🟡 **Should**  
   제안: 현재는 “파일이 아예 없을 때만” git-lfs 힌트를 주고, 더 흔한 실패 모드인 “LFS 포인터 파일은 존재하지만 blob이 미다운로드된 상태”에서는 `parse preset-1 body FBX` / `build VRM rest pose...` 같은 불충분한 panic으로 끝납니다. `version https://git-lfs.github.com/spec/v1` 헤더를 검사해 명시적으로 `git lfs pull` 힌트를 주거나, 최소한 `expect(...)` 메시지에 fixture 경로와 LFS 힌트를 포함시키는 편이 디버깅 가능성이 훨씬 높습니다.  
   패턴 판정: `A1 clean`, `A2 clean`, `A5 clean`, `A6 clean`, `B1 clean`, `B2 clean`, `C1 clean`, `C2 clean`, `C3 clean`, `D1 clean`(테스트 코드의 `eprintln!`만 존재), `D2 clean`(라이브러리 hot path 아님), `D3 clean`, `D4 clean`, `D5 clean`, `E3 clean`, `F1 clean`, `F2 clean`, `F3 clean`, `G6 clean`, `G7 clean`.

3. [crates/shotloom-retarget/tests/body_retarget_regression.rs](/Users/younsoolim/Desktop/www/shotloom/.worktrees/stl-179-body-retarget-regression/crates/shotloom-retarget/tests/body_retarget_regression.rs:298)  
   인용: `&g_digest[..12]`, `&digest[..12]`  
   심각도: 🟢 **Nit**  
   제안: `parse()`가 digest 길이를 검증하지 않기 때문에 `.snap` 파일이 수동 편집/충돌 해소로 잘못 잘린 경우, “파싱 실패”가 아니라 여기서 슬라이싱 panic이 납니다. `parse()`에서 64-hex를 검증하거나, 표시용 prefix는 `get(..12)`로 방어하면 테스트 실패 원인이 더 직접적으로 드러납니다.  
   패턴 판정: `2. Panic 유발`에만 경미한 보완 포인트가 있고, 나머지 관련 패턴은 위 항목과 동일하게 clean입니다.

4. [crates/shotloom-retarget/tests/snapshots/body_retarget_preset1.snap](/Users/younsoolim/Desktop/www/shotloom/.worktrees/stl-179-body-retarget-regression/crates/shotloom-retarget/tests/snapshots/body_retarget_preset1.snap:1)  
   발견 사항: `OK`  
   패턴 판정: `A2 clean`, `A6 clean`, `G6 clean`, 그 외는 `N/A`.

5. `Cargo.lock`  
   발견 사항: `OK`  
   패턴 판정: `E2 clean`(의존성 변경과 lockfile 갱신이 함께 들어왔음), 그 외는 `N/A`.

**머지 권장도**

⚠️ 수정 후 머지

**Insufficient evidence**

- `A4` PR 본문 일치 여부: 실제 PR description이 diff에 없어서 판단 불가. 필요한 자료: PR 본문.
- `G2` 커밋 메시지 규약 준수 여부: diff만으로는 불가. 필요한 자료: `git log origin/main..HEAD --format='%s%n%b%n---'`.
- `G3` PR 제목/본문 형식 준수 여부: diff만으로는 불가. 필요한 자료: PR 제목과 본문.
- `G4` 브랜치 명명 규칙 준수 여부: diff만으로는 불가. 필요한 자료: 현재 브랜치명.
- STL-179의 `cargo test` 5초 제약 충족 여부: 코드만으로는 판단 불가. 필요한 자료: `cargo test -p shotloom-retarget --test body_retarget_regression`의 실제 wall-clock 시간, 가능하면 `ubuntu-latest` 기준 측정값.
- Apple Silicon vs `ubuntu-latest` 간 golden 안정성: 반올림 설계 의도는 보이지만 실제 교차 플랫폼 결과는 diff만으로 검증 불가. 필요한 자료: 두 플랫폼에서 생성/검증한 테스트 로그.

**Out-of-scope observation**

- 없음.

**결론: 런타임 의존성 분리(`sha2` → `dev-dependencies`)와 git-lfs 실패 진단 보강은 머지 전에 정리하는 편이 맞습니다.**
