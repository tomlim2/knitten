---
status: open
created: 2026-05-16
updated: 2026-05-16
load: triggered
trigger: STL-440
repo: shotloom
linear: STL-440
briefing: ../briefings/shotloom/workspace-unify-thiserror-deps.md
---

# Unify thiserror Workspace Dependency

## Spec Contract

- Briefing basis: `../briefings/shotloom/workspace-unify-thiserror-deps.md`
  records STL-440, the Linear seven-crate list, the current-base eighth direct
  user in `shotloom-engine`, and the lockfile invariant.
- Current truth: `origin/main` has no root `thiserror` workspace dependency and
  eight workspace-package manifests declare direct `thiserror = "2"`.
- Required change: make root `[workspace.dependencies]` own the direct
  `thiserror` version and switch every current direct workspace-package user to
  workspace inheritance.
- Locked boundary: no Rust source changes, no dependency version bump, no
  lockfile drift, no third-party transitive dependency cleanup, no docs/ADR
  amendment.
- Proof method: manifest diff, `cargo metadata --no-deps`, empty
  `Cargo.lock` diff, `cargo check --workspace --exclude shotloom-desktop`, and
  `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings`.
- One-PR suitability: this is one small chore PR because it changes only Cargo
  dependency declaration ownership and does not alter runtime behavior.

## Current State

| Surface | Path | Classification | Evidence |
|---|---|---|---|
| Root workspace dependency table | `Cargo.toml` | Missing | `[workspace.dependencies]` has shared entries such as `serde`, `serde_json`, `strum`, and `sha2`, but no `thiserror`. |
| Linear-listed normalizer crate | `crates/shotloom-character-model-normalizer/Cargo.toml` | Partial | `[dependencies]` declares `thiserror = "2"`. |
| Linear-listed core crate | `crates/shotloom-core/Cargo.toml` | Partial | `[dependencies]` declares `thiserror = "2"`. |
| Current-base engine crate | `crates/shotloom-engine/Cargo.toml` | Partial / briefing delta | `[dependencies]` declares `thiserror = "2"` even though Linear did not list it. |
| Linear-listed FBX crate | `crates/shotloom-fbx-anim/Cargo.toml` | Partial | `[dependencies]` declares `thiserror = "2"`. |
| Linear-listed GLTF crate | `crates/shotloom-gltf/Cargo.toml` | Partial | `[dependencies]` declares `thiserror = "2"`. |
| Linear-listed import crate | `crates/shotloom-import/Cargo.toml` | Partial | `[dependencies]` declares `thiserror = "2"`. |
| Linear-listed retarget crate | `crates/shotloom-retarget/Cargo.toml` | Partial | `[dependencies]` declares `thiserror = "2"`. |
| Linear-listed stage crate | `crates/shotloom-stage/Cargo.toml` | Partial | `[dependencies]` declares `thiserror = "2"`. |
| Cargo metadata | `cargo metadata --no-deps --format-version=1` | Partial | Eight workspace packages report direct `thiserror` dependency req `^2`. |
| Lockfile | `Cargo.lock` | Already Done / guard | Contains `thiserror 2.0.18` for workspace direct users and `thiserror 1.0.69` for third-party transitive users. |
| Error policy | `docs/guidelines/error-handling.md` | Already Done | §2 and §5 require `#[derive(thiserror::Error)]` for library error enums. |
| Rust review policy | `docs/guidelines/review-rust.md` | Already Done | §10 treats new Rust dependencies as supply-chain review items; this spec does not add a new external crate, it hoists an existing direct dependency. |
| Dependency audit policy | `docs/guidelines/dependency-audit-guideline.md` | Adjacent / not direct scope | Applies to audit overrides and direct dependency changes; no override or version bump is planned. |

## Problem

`thiserror` is already the workspace-wide typed-error dependency, but its
version is repeated in individual crate manifests. STL-440 exists to prevent
future drift when that direct dependency needs to move. The current base also
has one additional direct user, `shotloom-engine`, beyond Linear's seven-crate
list; leaving it direct would preserve the exact drift class this chore is meant
to remove.

## Requirements

1. Add `thiserror = "2"` to root `Cargo.toml` `[workspace.dependencies]`.
   Trace: STL-440 AC1.
2. Replace every current direct workspace-package manifest entry
   `thiserror = "2"` with `thiserror = { workspace = true }`.
   Trace: STL-440 AC2 and live-code audit.
3. Include the eight current direct users:
   `shotloom-character-model-normalizer`, `shotloom-core`, `shotloom-engine`,
   `shotloom-fbx-anim`, `shotloom-gltf`, `shotloom-import`,
   `shotloom-retarget`, and `shotloom-stage`.
   Trace: intent lens plus `rg '^thiserror\s*=' crates/*/Cargo.toml`.
4. Do not edit Rust source files, TypeScript files, bridge contracts, ADRs, or
   tech-debt docs.
   Trace: one-PR suitability and repository ask-first matrix.
5. Do not change the resolved direct `thiserror` version from `2.0.18`.
   Trace: STL-440 AC5.
6. Do not attempt to remove or upgrade transitive `thiserror 1.0.69` entries in
   `Cargo.lock`.
   Trace: AC5 interpretation from current lockfile evidence.
7. Treat any non-empty `Cargo.lock` diff as a blocker unless it is reviewed and
   explained before implementation finishes.
   Trace: STL-440 AC5 and dependency lockfile-scope precedent.

## Locked Decisions

1. **Apply workspace inheritance to all eight current direct users, not only the seven Linear-listed manifests.**

   Rationale: Linear's problem statement is version drift from repeated direct
   manifest entries. Live code shows `shotloom-engine` also repeats
   `thiserror = "2"` on the same base. Excluding it would keep one direct
   duplicate and leave the failure mode partially open.

   Rejected alternatives: literal seven-only implementation; filing a separate
   issue for `shotloom-engine`; deleting `shotloom-engine`'s dependency without
   proving source usage.

2. **Keep the dependency version at the same major declaration and resolved lockfile version.**

   Rationale: STL-440 is a declaration ownership chore, not an upgrade. Root
   `thiserror = "2"` should continue resolving to the existing
   `thiserror 2.0.18` lockfile package.

   Rejected alternatives: pinning `=2.0.18`; bumping `thiserror`; running a
   broad `cargo update`.

3. **Do not touch transitive `thiserror 1.0.69` lockfile users.**

   Rationale: Those entries come from third-party dependencies and are not the
   repeated direct workspace manifest problem. Removing them would require
   upstream dependency upgrades outside STL-440.

   Rejected alternatives: treating "Cargo.lock keeps thiserror 2.0.18" as a
   mandate to eliminate all `thiserror 1.x` entries; adding `[patch.crates-io]`
   or override-style fixes.

4. **Use manifest-level verification in addition to compile gates.**

   Rationale: `cargo check` and `cargo clippy` prove the dependency graph still
   compiles, but they do not directly prove every intended crate switched to
   workspace inheritance or that `Cargo.lock` stayed unchanged.

   Rejected alternatives: relying only on build success; reviewing only textual
   diff without metadata proof.

5. **Do not classify this as a new dependency addition.**

   Rationale: `thiserror` is already a direct dependency of multiple Shotloom
   library crates and is already required by error-handling policy. The change
   moves version ownership to the workspace root.

   Rejected alternatives: writing a new-dependency supply-chain justification
   or changing runtime-exposure analysis as if a new crate were entering the
   graph.

## Non-Goals

- No Rust source edits.
- No TypeScript, bridge contract, or fixture edits.
- No ADR or guideline updates.
- No `Cargo.lock` version update.
- No `cargo update`.
- No cleanup of transitive `thiserror 1.0.69`.
- No conversion of other repeated dependencies to workspace inheritance.
- No change to error enum shapes or `thiserror::Error` derives.
- No CI, hook, or workflow changes.

## Implementation Spec

### S0 - Baseline Re-Check

1. Confirm worktree:
   `/Users/deemooooooooo/Desktop/www/shotloom-github/.worktrees/workspace-unify-thiserror-deps`
   on `chore/workspace-unify-thiserror-deps`.
2. Confirm Shotloom worktree is clean.
3. Re-run:
   ```bash
   rg -n '^thiserror\s*=' Cargo.toml crates/*/Cargo.toml
   cargo metadata --no-deps --format-version=1 \
     | jq -r '.packages[] | select(.dependencies[]? | .name=="thiserror") | [.name, .manifest_path, (.dependencies[] | select(.name=="thiserror") | .req)] | @tsv'
   git diff -- Cargo.lock
   ```
4. If the direct-user count is no longer eight because main changed, update the
   implementation target to all current direct workspace-package users and note
   the delta before editing.

### S1 - Hoist the Version Owner

1. Add `thiserror = "2"` to root `Cargo.toml` `[workspace.dependencies]`.
2. Place it near the existing shared Rust library dependencies, preferably near
   `serde_json` / `strum`, so future readers see it with error/derive-facing
   shared crates.
3. Do not change any other root dependency version.

### S2 - Switch Workspace Packages to Inheritance

1. Change each selected crate manifest entry from:
   ```toml
   thiserror = "2"
   ```
   to:
   ```toml
   thiserror = { workspace = true }
   ```
2. Apply this to the eight current direct users named in Requirement 3 unless
   S0 finds a base change.
3. Do not reorder unrelated dependencies in crate manifests.

### S3 - Verify Manifest Ownership and Lockfile Stability

1. Run the `cargo metadata --no-deps` query from S0.
2. Confirm every selected package still has a `thiserror` dependency and that
   the manifest diff shows workspace inheritance.
3. Confirm no selected package still has a textual direct
   `thiserror = "2"` entry.
4. Confirm `git diff -- Cargo.lock` is empty.
5. If `Cargo.lock` changes, stop and inspect before running broad gates; do not
   accept incidental lockfile drift.

### S4 - Run Required Rust Gates

1. Run:
   ```bash
   cargo check --workspace --exclude shotloom-desktop
   cargo clippy --workspace --exclude shotloom-desktop -- -D warnings
   ```
2. If either gate fails because the workspace inheritance changed dependency
   resolution, stop and inspect dependency metadata before broadening scope.

## Acceptance Criteria

- [ ] Root `Cargo.toml` has `thiserror = "2"` under `[workspace.dependencies]`.
- [ ] Every selected workspace package manifest uses
      `thiserror = { workspace = true }`.
- [ ] No selected workspace package still contains direct `thiserror = "2"`.
- [ ] `Cargo.lock` has no diff after the manifest-only change.
- [ ] The resolved direct `thiserror` package remains `2.0.18`.
- [ ] Transitive `thiserror 1.0.69` entries are left untouched.
- [ ] `cargo check --workspace --exclude shotloom-desktop` passes.
- [ ] `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings`
      passes.

## Verification

Focused checks:

```bash
rg -n '^thiserror\s*=\s*"2"' Cargo.toml crates/*/Cargo.toml
rg -n '^thiserror\s*=\s*\{\s*workspace\s*=\s*true\s*\}' crates/*/Cargo.toml
cargo metadata --no-deps --format-version=1 \
  | jq -r '.packages[] | select(.dependencies[]? | .name=="thiserror") | [.name, .manifest_path, (.dependencies[] | select(.name=="thiserror") | .req)] | @tsv'
git diff -- Cargo.lock
```

Required gates:

```bash
cargo check --workspace --exclude shotloom-desktop
cargo clippy --workspace --exclude shotloom-desktop -- -D warnings
```

Manual repro:

- Inspect `Cargo.toml` root and the selected crate manifests in the PR diff.
  The only intended user-facing behavior label is "manifest ownership moved to
  workspace inheritance"; no runtime diagnostic, rejection, or UI string is
  introduced.

## Traps

1. Do not stop at the Linear seven-crate list if current base still has an
   eighth direct `thiserror = "2"` user. That leaves the drift class alive.
2. Do not run `cargo update` or accept incidental `Cargo.lock` churn. The chore
   should not alter resolved dependency versions.
3. Do not remove `thiserror` from crate manifests entirely. Each crate still
   needs a direct dependency declaration; only the version source moves to
   `[workspace.dependencies]`.
4. Do not treat transitive `thiserror 1.0.69` as in scope. Those are owned by
   third-party dependencies.
5. Do not expand this chore to other repeated dependencies discovered nearby.

## Follow-Up Candidates

- Audit other repeated Rust dependency declarations for workspace inheritance
  candidates in a separate tech-debt issue.
- If a future audit requires a `thiserror` major/version bump, handle that as a
  dedicated dependency update with lockfile-scope evidence.
