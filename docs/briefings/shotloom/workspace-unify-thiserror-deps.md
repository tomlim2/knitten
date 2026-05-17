---
status: ready
created: 2026-05-16
updated: 2026-05-16
load: triggered
trigger: STL-440
repo: shotloom
linear: STL-440
spec: ../../plans/completed/workspace-unify-thiserror-deps.md
---

### Shotloom coding mode — rust

**Issue:** STL-440 "chore(workspace): thiserror을 [workspace.dependencies]로 통합"
  Problem: `thiserror = "2"` is repeated across workspace crate manifests, so a future major bump can drift across crates.
  Acceptance:
  - root `[workspace.dependencies]` contains `thiserror`
  - the named crate manifests use `thiserror = { workspace = true }`
  - `cargo check --workspace --exclude shotloom-desktop` passes
  - `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings` passes
  - `Cargo.lock` keeps the resolved `thiserror 2.0.18`
  Affected:
  - `Cargo.toml`
  - `crates/shotloom-character-model-normalizer/Cargo.toml`
  - `crates/shotloom-core/Cargo.toml`
  - `crates/shotloom-engine/Cargo.toml` (found on current base; not listed in Linear)
  - `crates/shotloom-fbx-anim/Cargo.toml`
  - `crates/shotloom-gltf/Cargo.toml`
  - `crates/shotloom-import/Cargo.toml`
  - `crates/shotloom-retarget/Cargo.toml`
  - `crates/shotloom-stage/Cargo.toml`
  Linked:
  - PR #341 review nit #6
  - `docs/guidelines/error-handling.md` §2, §4, §5
  - `docs/guidelines/review-rust.md` §10

**Branch:** `chore/workspace-unify-thiserror-deps`  (base: `origin/main`)  0 commits ahead, clean

**Standards loaded:** AGENTS.md, CLAUDE.md, CONTRIBUTING.md, docs/guidelines/error-handling.md, docs/guidelines/review-rust.md, docs/guidelines/commit-guideline.md, docs/guidelines/pr-guideline.md, docs/guidelines/dependency-audit-guideline.md
**ADRs to honor:** ADR-0021, ADR-0023, ADR-0030 are adjacent error/normalizer context; no ADR change expected.
**Ask-first triggers for this task:** scope expansion beyond manifest inheritance; adding or removing a crate dependency other than hoisting existing direct `thiserror`; any `Cargo.lock` version drift; changing CI/hook behavior.
**Intent lens:** prevent direct `thiserror` version drift across workspace crates by making the root workspace dependency the single version owner. User supplied the Linear issue as the task start signal; no chat clarification overrides the Linear scope yet.

**AC primitive cross-check:**
- AC1 `[workspace.dependencies]` has `thiserror`: codified target exists at root `Cargo.toml` `[workspace.dependencies]`; current base lacks `thiserror`.
- AC2 seven crate manifests use workspace inheritance: codified by Cargo workspace inheritance and current manifests. Current base has the seven Linear-listed direct `thiserror = "2"` entries plus an eighth direct entry in `crates/shotloom-engine/Cargo.toml`; spec must decide whether implementation follows the literal seven or all current direct workspace users.
- AC3 `cargo check --workspace --exclude shotloom-desktop`: verification-example; matches Shotloom meta rule that workspace Rust gates exclude `shotloom-desktop`.
- AC4 `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings`: verification-example; matches Shotloom meta rule and `review-rust.md` §1.
- AC5 `Cargo.lock` keeps `thiserror 2.0.18`: verification-example; current `Cargo.lock` contains direct `thiserror 2.0.18` and transitive `thiserror 1.0.69`. The spec should assert no lockfile drift for the workspace direct `thiserror 2.0.18`, not elimination of transitive `thiserror 1.x`.

**Spec-risk handoff for `/shotloom-draft-spec`:**
- P1: Decide target set: literal Linear seven manifests or all eight current direct workspace users including `crates/shotloom-engine/Cargo.toml`. Evidence: `rg '^thiserror\s*=' Cargo.toml crates/*/Cargo.toml` and `cargo metadata --no-deps` both show eight direct workspace-package users. AC-trace: Linear problem statement lists seven and says duplicate direct dependency drift is the failure mode.
- P1: Lock atomic manifest invariant before edits: root `Cargo.toml` plus every selected crate manifest must change together, and `Cargo.lock` must either stay byte-identical or have a reviewed reason. Evidence: root `[workspace.dependencies]` at `Cargo.toml:32`; selected crate manifests each own a direct `thiserror = "2"`. AC-trace: AC1, AC2, AC5.
- P2: Specify lockfile interpretation: `thiserror 2.0.18` is the direct workspace dependency target, while `thiserror 1.0.69` remains allowed if pulled transitively by third-party crates. Evidence: `Cargo.lock` has both `thiserror 2.0.18` and `thiserror 1.0.69`. AC-trace: AC5.
- P2: Verification should include a manifest-level assertion, not only compile gates. Candidate proof: `cargo metadata --no-deps` shows the selected workspace packages depend on `thiserror` with inherited workspace req after the edit, and `git diff -- Cargo.lock` is empty. Evidence: current metadata reports direct req `^2` for eight packages. AC-trace: AC2, AC5.
- P3: Choose root dependency placement. Existing `[workspace.dependencies]` is not strictly alphabetical; `thiserror` likely belongs near `serde_json`, `strum`, and other shared Rust library dependencies. Evidence: root `Cargo.toml` dependency ordering. AC-trace: AC1.

**Sibling specs (caol-ila/docs/plans/):**
- none found

**Pre-write checklist passed:**
- [x] gh auth: tomlim2 active; inactive `deemotl` token still reports failure but is not active.
- [x] commit identity: worktree config set to `tomlim2 <deemo@vonvon.me>`; inherited HEAD author differs because it is an existing main commit.
- [x] conventions re-read: AGENTS, CONTRIBUTING, CLAUDE, ADR index
- [x] category: rust
- [x] targeted sections loaded
- [x] AC primitive cross-check recorded
- [x] spec-risk handoff seeded
- [x] sibling-spec scan run (caol-ila/docs/plans/, full body via Read tool for every match)

Ready. If this briefing is OK, next step is `/shotloom-draft-spec`.
