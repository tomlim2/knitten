# Shotloom Programming Standard

Rules to follow **when writing code** in the Shotloom repo. Sourced from in-repo guidelines, ADRs, and review checklists — this doc is a mirror, not an origin. When a rule here conflicts with the in-repo source, the in-repo source wins.

> **Related:**
> - Reviewing code: [review-code-rust.md](review-code-rust.md) + `docs/guidelines/review-rust.md`, `review-typescript.md`, `review-domain.md`
> - Opening PRs: [../rules/shotloom-git.md](../rules/shotloom-git.md)
> - Project overview: [shotloom.md](shotloom.md)
> - Hub rule: [../rules/shotloom.md](../rules/shotloom.md)

**When this doc is authoritative:** any time you edit code under `/Users/deemooooooooo/Desktop/www/shotloom-github/`. Re-read at session start — guidelines drift.

---

## 1. Rust — Error Handling

- **No `anyhow::Error` on library-crate public surfaces.** Use `#[derive(thiserror::Error)]` with typed variants. `error-handling.md §4`
- **Every wrapped cause gets `#[source]`.** External errors (`io::Error`, `serde_json::Error`) attach as sources so the chain survives logging. `error-handling.md §2.1`
- **No blanket `#[from] io::Error` on sub-enums.** Wrap at the call site with path/entity context in the variant. `error-handling.md §5`
- **Decompose error enums by caller-facing cohesion, not variant count.** Split when variants fall into disjoint handling groups. `error-handling.md §5`
- **`#[non_exhaustive]` is OFF by default.** Apply only for externally-published crates, FFI, or formal SemVer contracts. `error-handling.md §6.2`
- **Error messages:** lowercase first letter, no trailing period, include distinguishing context (path, entity ID, device name). `error-handling.md §10`
- **Typed `Result<T, E>` stays inside crates.** Conversion to `RuntimeErrorPayload` / `CommandRejectedPayload` happens at the transport/runtime-adapter boundary (`shotloom-web`, `shotloom-tauri`, `shotloom-native`), never inside `shotloom-engine`. `ADR-0018`

## 2. Rust — Panic & Unwrap Discipline

- **No `unwrap()` / `expect()` on user-facing or asset-parsing paths.** Return `Result` instead. `review-rust.md §2`
- **Allowed:** `#[cfg(test)]` modules, bootstrap `App::build` where failure is unrecoverable, compile-time-literal regex, documented infallible contexts. `error-handling.md §7.3`
- **Thread-spawn failures are recoverable** — return `RuntimeErrorPayload { kind: Platform, code: "ENGINE_THREAD_SPAWN_FAILED" }`, not panic.
- **For every `unwrap`/`expect`/`panic!`, ask:** "Could this fire in production?" If yes → `Result`. If no → add a one-line comment stating why it's provably infallible.

## 3. Rust — Unsafe & Concurrency

- **Every `unsafe` block needs a `// SAFETY:` comment** justifying the invariant. For WASM FFI, tag the original author in review if unsure. `review-rust.md §4`
- **WASM-only `unsafe impl Send/Sync`** is permitted *iff* guarded by `#[cfg(not(target_arch = "wasm32"))] compile_error!` AND documented `// SAFETY: WebEngine runs single-threaded in Web Worker`. `error-handling.md §8.2`

## 4. Rust — Bevy / ECS

- **Explicit ordering for systems that share components.** Missing `Before`/`After` → non-deterministic behavior. `review-rust.md §6`
- **`Res<T>` / `ResMut<T>` for resources, `Local<T>` for per-system state.** No global mutable state outside ECS. `review-rust.md §6`
- **Use `Changed<T>` / `Added<T>` filters** to avoid per-frame churn. `review-rust.md §6`
- **Bevy systems never return `Result`.** On failure emit one of: `Diagnostic` to `validation_diagnostics`, `runtime_error` bridge event, or `command_rejected` event. `error-handling.md §7`
- **Do not both log and emit the same error.** Emit the event; the transport seam logs on egress.

## 5. Rust — Serialization & Bridge Contract

- **Bridge-crossing types use `serde` with `#[serde(rename_all = "camelCase")]`** matching `docs/ipc/bridge-contract.md`. `review-rust.md §7`
- **New fields on existing types → `#[serde(default)]`** for forward compatibility.
- **Do NOT use `#[serde(deny_unknown_fields)]`** on forward-compatible types.
- **Bridge payloads are stable, versioned DTOs, never raw ECS state.** `ADR-0003`
- **Bridge contract change = same-PR TypeScript update.** `review-typescript.md §2`

## 6. Rust — WASM Compatibility

- **WASM crates (`shotloom-web`, `shotloom-engine`, `shotloom-core`) must not use `std::fs`, `std::net`, `std::thread`.** Gate with `#[cfg(target_arch = "wasm32")]` and provide native fallbacks. `review-rust.md §8`
- **No blocking operations in browser event-loop code.**
- **`#[backtrace]` and `std::backtrace::Backtrace` unavailable on WASM** — feature-gate off for `wasm32`. `error-handling.md §8.3`
- **Register `console_error_panic_hook::set_once()` in WASM entry** to avoid raw `RuntimeError: unreachable executed`. `error-handling.md §8.4` (tracked as debt)
- **`wasm-bindgen` exports have stable, documented signatures.** No raw ECS internals exposed to JS. `review-rust.md §8`
- **WebGPU is primary target.** `webgpu` feature flag overrides `webgl2`. `ADR-0004`

## 7. Rust — Ownership, Lifetimes, Lints

- **Prefer owned types at API boundaries.** Watch for `clone()` hiding ownership design issues. `review-rust.md §5`
- **`'static` bounds expected for Bevy systems and async task spawns**, but flag `'static` on non-ECS boundaries if it unnecessarily restricts callers.
- **`cargo clippy --workspace -- -D warnings` must pass.** Every `#[allow(...)]` has a justifying comment explaining why the lint doesn't apply. `review-rust.md §1`
- **Consider nesting depth over raw line count.** 3+ conditionals/loops = complexity signal. Flat `match` over 50 lines is fine. `review-rust.md §5`

## 8. Rust — Dependencies

- **New Rust crate deps need justification in PR description.** Consider: maintenance status, transitive tree size, WASM compilation, simpler alternatives. `review-rust.md §10`
- **New workspace crate** → requires ADR if it defines a boundary.

## 9. TypeScript & React

- **Strict mode ON. No `any` in production code.** Prefer narrowing and discriminated unions over type assertions. `review-typescript.md §1`
- **TS types matching bridge contract stay in sync with Rust.** Command/event type changes → same-PR TS update. `review-typescript.md §2`
- **React hook rules:** no hooks in conditionals/loops. `useEffect` subscriptions/timers need cleanup. Functional updates for state depending on prior state. `review-typescript.md §3`
- **Correct `useMemo` / `useCallback` deps arrays.** Missing deps → stale; over-specifying → no caching.
- **Async functions handle rejections — no fire-and-forget.** Bridge handlers tolerate malformed input without crashing the editor. `review-typescript.md §4`
- **New runtime deps need justification.** Prefer browser built-ins and small focused libraries. `review-typescript.md §5`
- **React is a reference client.** Other frontends should implement the same bridge contract without reading React source. `docs/ipc/bridge-contract.md`

## 10. Architecture & Crate Boundaries

- **UI-free domain.** Every command/workflow has a corresponding Rust runtime API entry point or command/event pair. No capability lives only as a React UI flow. `ADR-0010`
- **Domain logic does NOT leak into React.** React owns UI-only state (panel layout, hover, drafts, shortcuts, preferences); it never owns validation rules, state derivation, or workflow orchestration. `ADR-0010`
- **Integration tests drive the runtime through the command/event protocol, not UI automation.** `ADR-0010`
- **Terminology is not interchangeable.** `Character`, `Prop`, `CineCamera` for schema. `Entity`, `Component`, `Camera3d` only for live ECS world. `ADR-0020`
- **Workspace members:** `shotloom-common`, `shotloom-core`, `shotloom-engine`, `shotloom-web`, `shotloom-native`, `shotloom-tauri`, `shotloom-render-cli`, plus import/pipeline crates.

## 11. Determinism & Performance

- **Timeline playback and export are deterministic.** Same bundle state at same frame → identical output across WASM and native. `ADR-0006`
- **Alpha sole shot frame rate: 30 fps.** Interactive preview in browser, deterministic frame-stepped export in native CLI. `product-requirements-alpha.md §4`
- **Integration tests are hermetic.** T2M/TTS use committed-fixture adapters in CI, no live calls, no ungoverned caches. `ADR-0014`
- **Perf budget:** 60 fps editor preview (min 30), ≤16.6 ms frame time. Native target 120 fps. Violations require benchmark data in PR. `shotloom.md`

## 12. Documentation Co-location

- **Update `MAP.md`** when docs/code move or a new major path is added. `CONTRIBUTING.md`
- **Update `AGENTS.md`** for root entry/workflow changes.
- **Update breadcrumb docs** in module parent on major module add/reshape.
- **Major modules ship three docs:** `<module>/README.md` (purpose, public surface, entry points, deps), `<module>/architecture.md` (local data flow, design, constraints), `<module>/tests/README.md` (how to run, fixtures, env vars). `documentation-standard.md §5.13`
- **Behavior/boundary/workflow changes** → update `contracts/`, related `docs/ipc/` material, and affected tests in the same PR.
- **New durable design decision** → ADR in `docs/adr/`. **New structural debt** → entry in `docs/tech-debt/`. **New tricky logic** → module doc or canonical architecture doc with link from primary docs.
- **Run before pushing docs:** `pnpm lint:md`, `pnpm check:md`, `pnpm validate:doc-paths`, `pnpm validate:mermaid`. Link checks via `lychee`.

## 13. Testing

- **Tests required with new modules** (per generic `rules/testing.md`). Legitimate exceptions: pure scaffold, verbatim upstream ports with follow-up test commit in same PR.
- **`unwrap`/`expect` freely permitted in `#[cfg(test)]`.** Exhaustive typed errors are test overhead. `error-handling.md §4`
- **Integration tests are hermetic and deterministic.** No live network, no credentials. `ADR-0014`
- **Integration tests drive the runtime via command/event protocol, not UI.** `ADR-0010`
- **Never weaken an assertion to make a test pass.** Fix the code.

## 14. Git, Commits, PRs

- **Conventional Commits** subject: `<type>(<scope>): <short summary>`. Types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `build`, `ops`, `style`. Breaking → `!` + body `BREAKING CHANGE:`. Subject ≤80 chars. `commit-guideline.md`
- **Body explains why, not file-by-file what.** Group by behavior/subsystem/reviewer concern. 80-char wraps. Blank line after subject.
- **Branch names:** `<type>/<description>`. Types: `feat/`, `fix/`, `chore/`, `hotfix/`, `release/`. Lowercase, hyphens only. **No Linear IDs in branch names.** `CONTRIBUTING.md`
- **Linear linkage required per PR** (`Resolves STL-NN` / `Related to STL-NN`) OR explicit `No issue: <reason>` for chore/style/ops.
- **Pre-commit runs:** case-sensitivity detect, `cargo fmt --check`, `cargo clippy --workspace -- -D warnings`, Biome on web files, doc-path validation, Mermaid validation, markdownlint. **Never `--no-verify`.**
- **Never `git add -f`** to bypass `.gitignore`. Ask for alternate location or keep local-only. `CLAUDE.md Hard Rules`
- **Never:** push to `main`, merge own PR without review, commit secrets, expand PR scope beyond linked issue, create PR without reading `pr-guideline.md`.

## 15. Repository Language

- **All repo artifacts in English** — code, comments, commits, PR descriptions, docs. Korean only in Linear issues per `CONTRIBUTING.md`. Conversation with user may be any language. `CLAUDE.md`

## 16. Ask-First Decisions

Per `AGENTS.md` decision matrix, ask before:
- Adding new dependencies
- File moves affecting imports
- CI changes
- Hook behavior changes
- Bevy ECS ordering / plugin changes
- WASM / native runtime split changes
- Stage / character contract changes
- VRM normalization, validation, asset-pipeline contract changes (`ADR-0012`, `ADR-0023`)

## 17. Known Tech Debt (be aware, do not recreate)

Tracked in `docs/tech-debt/`:
- `error-typing-string-blob-variants`
- `error-typing-manual-error-impls`
- `tauri-thread-spawn-panic`
- `wasm-panic-hook-missing`

---

## Pre-Write Checklist (session start)

Before touching Shotloom code in a new session:

1. `cat AGENTS.md` — workflow + ask-first matrix
2. `cat CONTRIBUTING.md` — pre-commit, PR policy, branch naming
3. `ls docs/guidelines/` — skim filenames, re-read any that applies to your task
4. `cat docs/adr/README.md` — current ADR index
5. `ls .agent/` if present — repo-scoped agent guidance
6. This doc — re-read sections relevant to your change

Stale memory causes defects. 2-minute re-read beats 2-hour rework.

---

## Provenance

Mined from in-repo sources on 2026-04-21 (see Explore agent output in session log). Sources:
- `AGENTS.md`, `CONTRIBUTING.md`, `CLAUDE.md`
- `docs/guidelines/error-handling.md`, `review-rust.md`, `review-typescript.md`, `review-domain.md`, `commit-guideline.md`, `pr-guideline.md`, `documentation-standard.md`, `documentation-checklists.md`, `code-review-guideline.md`
- `docs/adr/` (ADR-0003, 0004, 0006, 0010, 0012, 0014, 0018, 0020, 0023)
- `docs/product-requirements-alpha.md`, `docs/ipc/bridge-contract.md`
- `docs/tech-debt/`

When any of these change, refresh this doc.
