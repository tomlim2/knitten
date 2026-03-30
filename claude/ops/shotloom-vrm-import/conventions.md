# shotloom Code Conventions — Quick Reference for VRM Import

> For Agent #2, #3. Read this before writing any code.

---

## Workspace

- **Rust edition:** 2021, **toolchain:** stable (rust-toolchain.toml)
- **Resolver:** 2
- **WASM target:** `wasm32-unknown-unknown` pre-configured
- **Workspace deps:** `bevy 0.18`, `serde 1 (derive)`, `serde_json 1`, `wasm-bindgen 0.2`
- **Workspace package:** `version = "0.1.0"`, `license = "MIT"`

---

## Crate Layout (11 crates in `crates/`)

| Crate | Bevy? | Purpose |
|-------|-------|---------|
| `shotloom-common` | NO | Shared error types, math helpers |
| `shotloom-core` | NO | Domain model, project schema, IDs, validation |
| `shotloom-gltf` | NO | **glTF/VRM asset loading** — OUR TARGET |
| `shotloom-s2m` | NO | S2M schema, JSON parsing, ingestion Passes 1-4 |
| `shotloom-stage` | NO | Void stage, mood presets, coordinate policy |
| `shotloom-import` | NO | Import orchestration (Passes 5-7) |
| `shotloom-t2m` | NO | T2M API client, motion adapter |
| `shotloom-tts` | NO | TTS API client, audio handling |
| `shotloom-engine` | YES | Bevy plugins, systems, rendering |
| `shotloom-web` | YES | WASM entrypoint, wasm-bindgen bridge |
| `shotloom-render-cli` | YES | Native headless render CLI |

**Critical rule:** `shotloom-gltf` must NOT depend on `bevy`. It parses and extracts data only.

---

## lib.rs Pattern

Every crate starts with a module-level doc comment:

```rust
//! glTF and VRM asset loading for Shotloom.
```

Currently all crates are stubs (empty lib.rs with only the doc comment).

---

## Error Handling

- **P0: No `unwrap()`/`expect()` on untrusted input** (glTF, VRM, user assets, bridge messages)
  - Test code and startup initialization are exempt
- Propagate errors with `.context()` (implies `anyhow` or similar)
- Do not swallow errors silently; comment if intentionally ignored
- Asset parsing is **user-imported external binary input** — treat as untrusted

---

## Panic Discipline

```rust
// GOOD: user asset path
parse_vrm_asset(user_file).context("Failed to parse VRM asset")?

// BAD: will panic on malformed glTF
let mesh = gltf_mesh.unwrap();

// OK: startup only
RUNTIME.init().expect("failed to initialize Bevy app")
```

---

## Clippy & Formatting

- `cargo fmt --check` — standard rustfmt (no custom rustfmt.toml found)
- `cargo clippy --workspace` with `-D warnings` (all warnings = errors)
- If suppressed: `#[allow(...)]` with justifying comment

---

## Unsafe Code

- All `unsafe` blocks require `// SAFETY:` comment justifying the invariant

---

## Serde Conventions

```rust
#[derive(Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]  // Match bridge contract
struct SomeType {
    #[serde(default)]  // For forward compatibility
    optional_field: Option<String>,
}
```

- NO `#[serde(deny_unknown_fields)]` on forward-compatible types

---

## WASM Compatibility

- NO `std::fs`, `std::net`, `std::thread` in WASM-compiled crates
- Use `#[cfg(target_arch = "wasm32")]` with native fallbacks
- No blocking operations in browser event loop paths

---

## Git Conventions

### Commit Message Format

```
type(scope): subject
                          ← blank line
Body explaining why.
                          ← blank line
Footer: issue links, BREAKING CHANGE
```

- **Types:** `feat`, `fix`, `refactor`, `perf`, `style`, `test`, `docs`, `build`, `ops`, `chore`
- **Subject:** imperative, no trailing period, ≤80 chars
- **Scope:** optional but recommended (e.g., `feat(gltf): add VRM extension parsing`)
- **Body:** explain WHY, not what. Wrap at 80 chars.
- **No Co-Authored-By lines**

### Recent examples:

```
95fb002 docs: restructure planning and document ownership
28b4419 build: normalize workspace metadata across all crates
a9f930c docs: add ADR-0009, T2M motion format, and import crate
857abb7 build(scaffold): initial project foundation
```

### Hooks

```bash
git config core.hooksPath scripts/hooks  # commit-msg hook enforces format
```

---

## Build & Test

```bash
cargo check -p shotloom-gltf      # Type check our crate
cargo test -p shotloom-gltf       # Run tests
cargo clippy --workspace          # Lint everything
cargo fmt --check                 # Format check
```

---

## Review Priorities

| P | Focus | Blocking? |
|---|-------|-----------|
| P0 | Correctness & safety (no panic on untrusted input, asset parsing safety) | YES |
| P1 | Architectural boundaries (no Bevy in gltf crate, crate responsibilities) | YES |
| P2 | Tests & verification (new logic has tests) | YES |
| P3 | Maintainability (naming, nesting, dead code) | NIT |

---

## Key Architecture Rules for VRM Import

1. **`shotloom-gltf` is engine-agnostic** — parses data, returns structured types. No Bevy.
2. **`shotloom-engine` consumes parsed data** — creates Bevy components from gltf output.
3. **Asset parsing = untrusted input** — bounds validation on all buffer views, accessors, node indices.
4. **Graceful degradation** — malformed/unsupported assets produce diagnostics, never panic.
5. **New dependencies need justification** — WASM compat check, transitive size evaluation.
6. **ADR-0010** — All functionality must work without UI. Domain logic never in React layer.
7. **Deterministic** — Same input always produces same output.

---

## Key Docs to Read

| Doc | Path | When |
|-----|------|------|
| AGENTS.md | root | Entry point, build commands |
| MAP.md | root | "Where is X?" navigation |
| CONTRIBUTING.md | root | PR and commit policy |
| ADR-0010 | docs/adr/ | UI-independent functionality rule |
| Bridge contract | docs/ipc/bridge-contract.md | If touching React↔Rust boundary |
| Review guidelines | docs/guidelines/ | Before PR |

---

## MR/PR Convention

### Branch Strategy

- **Main branch:** `main` (CI runs on push to main + all PRs)
- **Feature branches:** `feat/vrm-import` etc.
- No `develop` branch — feature branches merge directly to `main`

### PR Title & Body

- **Title:** No enforced format, but follow conventional commit style (`type(scope): subject`) for consistency
- **Body must answer** (from CONTRIBUTING.md):
  - Interface changed? → Update `contracts/` + `docs/ipc/`
  - Docs/code moved? → Update `MAP.md`
  - Root workflow changed? → Update `AGENTS.md`
  - Major module added? → Add breadcrumb docs
  - New design decision? → Add ADR in `docs/adr/`
  - New structural debt? → Update `docs/tech-debt/`
  - New tricky logic? → Update module doc or canonical doc
- **1 issue ≈ 1 PR** (recommended convention, not hard rule)

### Review Process

- **Every PR must pass review before merge**
- Review order: P0 (correctness/safety) → P1 (architecture) → P2 (tests) → P3 (nits)
- Read PR description first → Check CI → Review contracts/boundaries → tests → implementation
- `nit:` prefix for non-blocking suggestions
- **Approve when all blocking issues resolved** — do not hold for nits
- Cross-boundary PRs (Rust + TS + bridge): need reviewer per domain or single cross-domain reviewer

### CI Checks (6 jobs, all must pass)

| Job | Command |
|-----|---------|
| Rust Format | `cargo fmt --check` |
| Rust Clippy | `cargo clippy --workspace -- -D warnings` |
| Rust Tests | `cargo test --workspace` |
| TypeScript Check | `pnpm --filter @shotloom/editor-web tsc --noEmit` |
| WASM Build | `cargo build -p shotloom-web --target wasm32-unknown-unknown` |
| Doc Validation | `node scripts/validate-doc-paths.mjs` + markdownlint + lychee link check |

### Local Hooks (pre-commit)

Runs automatically on commit (requires `git config core.hooksPath scripts/hooks`):
1. **Case-sensitivity check** — detect files that would break on Linux CI
2. **cargo fmt --check** — if `.rs` files staged
3. **cargo clippy --workspace -D warnings** — if `.rs` files staged
4. **markdownlint** — if `.md` files staged

### commit-msg Hook

Validates conventional commits format via `node scripts/validate-commit-message.mjs`:
- `type(scope): subject` header
- No trailing period
- ≤80 char subject
- Blank line after subject
- 80 char body wrap

### pre-push Hook

- Git LFS validation only

### Merge Strategy

- Not explicitly documented — default GitHub merge (likely merge commit or squash, check repo settings)
- No rebase policy stated

### Issue Tracking

- GitHub Issues as external issue tracker
- Issues = problem statements, PRs = shipped changes
- Roadmap items in `docs/roadmap/` (multi-PR outcomes)
- Tech debt tracked in `docs/tech-debt/`
