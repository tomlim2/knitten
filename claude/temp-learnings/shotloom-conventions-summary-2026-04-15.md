---
title: 'Shotloom conventions quick reference (STL-78 porting)'
tags: [shotloom, conventions, reference, stl-78]
date: 2026-04-15
---

# Shotloom Conventions Summary

## Sources read

- `CONTRIBUTING.md`
- `AGENTS.md`
- `docs/guidelines/pr-guideline.md`
- `docs/guidelines/commit-guideline.md`
- `docs/guidelines/review-rust.md`
- `docs/guidelines/code-review-guideline.md`
- `docs/guidelines/documentation-checklists.md`
- `docs/adr/adr-0023-retargeter-validation-contract.md` with focus on §3, §6, §9

## Branch + commit

- Branch naming: `<type>/<description>`
- Allowed branch types: `feat/`, `fix/`, `chore/`, `hotfix/`, `release/`
- Branch description: lowercase, numbers, hyphens only; no spaces, underscores, repeated hyphens; dots only for `release/v1.2.0`
- Use `chore/` for docs/style/test/build/ops/repo maintenance
- Do not put Linear IDs in branch names
- Current branch at read time: `feat/fbx-anim-importer`
- Commit header: `<type>(<scope>): <short summary>`; scope optional
- Allowed commit types: `feat`, `fix`, `refactor`, `docs`, `test`, `chore`, `perf`, `build`, `ops`, `style`
- Commit subject rules: lowercase `type/scope`, imperative, specific, no trailing period, <= 80 chars, one concern per commit
- Commit body: blank line after subject; wrap at 80; explain why; group by behavior/subsystem/reviewer concern; no file-by-file changelog
- Commit footers: optional `Related to STL-123`; do not use `Resolves` in commits
- Breaking change commit rule: `!` before `:` and explicit `BREAKING CHANGE:` description in body
- Current HEAD at read time: `c2c92d79f51804c575083b2d2911b06f1a66bf03`

## PR template + policy

- PR title follows commit subject format exactly
- Minimum PR sections:
  `## Summary`
  `## Validation`
  `## Related Issues`
- Expanded PRs should add `Why`, `Changes`, `Impact`, `Testing`, `Breaking Changes`
- Summary: 1-3 bullets on outcomes, not vague cleanup
- Changes: group by behavior/concern; avoid file-by-file lists
- Testing: concrete verification, not just "tested locally"
- Every PR must include one of:
  `Resolves STL-123`
  `Related to STL-123`
  `No issue: <clear reason>`
- `Resolves` belongs only in PR description, not commit messages
- Breaking-change PR rule: `!` in title and explicit `Breaking Changes` section describing consumer action
- Review workflow priority: description first, CI second, contracts/boundaries before tests before implementation
- Do not approve externally visible behavior changes without corresponding doc updates
- Cross-boundary PRs need reviewer coverage for each affected domain
- Never merge your own PR; never push directly to `main`; never skip hooks with `--no-verify`; never expand PR scope beyond linked issue

## Rust review gates (P0/P1/P2/P3 with emphasis on panic discipline, error propagation, WASM compat §8, dep supply chain §10)

- `P0` Correctness and safety: blocking
- Panic discipline: no `unwrap()` or `expect()` on user-facing or asset-parsing paths
- Allowed panic exceptions: tests, one-time startup with descriptive `expect`, provably infallible contexts
- Error propagation: add context with `.context()` or equivalent; do not silently swallow errors; comment intentional ignores
- Unsafe: require `// SAFETY:` invariant comment; scrutinize WASM FFI/raw pointer invariants
- Review focus also includes WASM/native divergence and timeline correctness
- `P1` Architectural boundaries: blocking
- Ownership/lifetimes: prefer owned API-boundary types; flag unnecessary clones; `'static` is normal for Bevy ECS/tasks, not for arbitrary public APIs
- ECS: explicit ordering for shared component access, avoid hidden query conflicts, prefer `Res`/`ResMut`, use `Changed`/`Added`
- Serde/bridge: contract casing must match, add `#[serde(default)]` for forward compatibility, avoid `deny_unknown_fields` on forward-compatible types, enum strategy must match contract
- WASM compat (§8): no `std::fs`, `std::net`, `std::thread` in WASM-targeted crates such as `shotloom-web`, `shotloom-engine`, `shotloom-core`
- WASM compat (§8): `#[cfg(target_arch = "wasm32")]` must be correct with native fallbacks where needed
- WASM compat (§8): no blocking work on browser event-loop paths
- WASM compat (§8): `wasm-bindgen` exports need stable, documented signatures
- Dependency supply chain (§10): new Rust crates need PR justification for maintenance status, transitive weight, simpler alternatives, and WASM viability
- `P2` Tests and verification: blocking
- New logic needs tests; bug fixes need regression tests; CI must pass; if CI fails twice, treat as real
- `P3` Maintainability: non-blocking `nit:`
- Watch deep nesting over raw length; avoid dead code; comments only for non-obvious invariants

## Co-location checklist

- Interface changed: update `contracts/`, related `docs/ipc/`, and affected tests
- Docs/code moved or new major path added: update `MAP.md`
- Root entry or workflow changed: update `AGENTS.md` and `WORKFLOW.md`
- Major module added or reshaped: update module `README.md`, `architecture.md`, and local test docs when needed
- Durable design decision changed: add or update an ADR
- New structural debt discovered or resolved: update `docs/tech-debt/`
- New or updated doc must live in the right bucket:
  `docs/arch/` cross-module architecture
  module docs for owned algorithms/internals
  `docs/specs/` intended behavior
  `docs/roadmap/` forward-looking direction only
  `docs/knowledge/` repo-authored external integration knowledge
  `docs/harness/` harness/environment assumptions
- Legacy bucket file touched: reclassify or delete; do not add new files to retirement buckets
- Externally visible behavior changes require corresponding doc updates before approval

## Pre-commit hook gates

- Case-sensitivity filename check
- `cargo fmt --check`
- `cargo clippy --workspace -- -D warnings`
- `lint-staged` for staged frontend files via Biome
- `scripts/validate-doc-paths.mjs`
- `scripts/validate-mermaid.mjs`
- `markdownlint-cli2` on staged markdown
- `commit-msg` hook also enforces Conventional Commit header shape, `!` placement, no trailing period, blank line after subject, <= 80-char subject, and 80-char body wrapping

## ADR-0023 §3 §6 §9 constraints for STL-78

- `shotloom-retarget` scope is ARP-shaped source skeletal animation -> VRM target transformation and grading only
- `shotloom-retarget` does not own scene/actor/character containers
- `shotloom-retarget` does not parse VRM/FBX/other asset files
- `shotloom-retarget` does not own asset lifecycle, caching, persistence, or UI presentation
- Public API should accept validated inputs and return output plus diagnostics; composition with scene/character concepts stays in callers
- Source-data types live in `shotloom-retarget`, not in `fbx_rig`
- Port the data-type half only:
  `SourceAsset`
  `SourceBone`
  `SourceBoneTrack`
  `SourceSkeletonFrames`
  `SourceFormat`
- Port FK utility under neutral naming:
  `compute_source_skeleton(&SourceAsset)`
  plus `euler_to_quat`
- Do not depend on `fbx_rig`
- Do not depend on `vrm0_compat`
- Do not depend on `fbxcel`
- Future FBX import, if added, is a separate `shotloom-fbx` crate
- Future `shotloom-fbx` must produce `shotloom_retarget::SourceAsset`
- Dependency direction is importer -> retarget, never retarget -> importer
- Session 2 public surface is `evaluate_pipeline` only
- Drop top-level convenience wrappers `retarget(...)` and `retarget_with_skeleton(...)`
- Keep `ArpRetargeterInner` as `pub(crate)`, implementation detail only
- Keep `IdentityRetargeter` as `pub(crate)` only if tests require it
- Session-2-facing re-exports stay narrow around:
  `evaluate_pipeline`
  source-data types
  animation/rest-pose outputs
  quality types
  `rubric_to_diagnostics`
