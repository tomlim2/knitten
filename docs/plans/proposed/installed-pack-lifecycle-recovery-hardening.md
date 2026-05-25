---
status: proposed
created: 2026-05-25
updated: 2026-05-25
owner: agent-hub
milestone: agent-artifact-pack-system
parent: docs/plans/proposed/installed-pack-lifecycle.md
---

# Installed Pack Lifecycle Recovery Hardening

## Purpose

Close the follow-up safety and recovery gaps left after the first installed
pack lifecycle installer slice.

## Problem

The first installer slice validates packs, writes a machine-local registry,
guards link mounts, and covers the basic lifecycle. It still lacks the durable
recovery and installed-set validation behavior needed before agents can treat
installed packs as resilient long-lived state.

## Goals

| Goal | Acceptance |
|------|------------|
| Durable transaction journals | Every write verb records a journal before registry, ownership-map, or link mutation. |
| Recover real partial writes | `recover` can finish or roll back journal-matching install, update, disable, enable, and uninstall transactions. |
| Active manifest-set prevalidation | Visibility-changing commands validate the planned active manifest set before exposing resolver candidates. |
| Full update reconciliation | `update` creates new owned links, removes obsolete owned links, preserves non-owned conflicts, and refreshes candidate rows. |
| Resolver visibility proof | State changes remove or restore resolver visibility before cleanup side effects can leave stale active rows. |

## Non-Goals

| Non-Goal | Owner |
|----------|-------|
| Do not implement artifact discovery or routing selection. | `artifact-pack-discovery-routing` |
| Do not migrate existing Knitten artifacts into packs. | `artifact-repo-migration-plan` |
| Do not support `mount.mode: copy` as default behavior. | Future copy-mode spec or explicit override. |
| Do not add public release gates. | `public-safety-scrub-gates` |

## Current State

| Surface | State | Evidence |
|---------|-------|----------|
| Installer CLI | First slice merged. | `scripts/install-artifact-pack.mjs` |
| Practical tests | Basic lifecycle and safety regressions covered. | `tests/installed-pack-lifecycle.test.mjs` |
| Fixtures | Virtual, link-safe, stale journal, locked registry, and conflict fixtures exist. | `tests/fixtures/installed-pack-lifecycle/` |
| Remaining gaps | Journals, full recovery, manifest-set prevalidation, and update reconciliation remain. | `docs/plans/proposed/installed-pack-lifecycle.md` |

## Todo List

| Order | Todo | Done When |
|-------|------|-----------|
| 1 | Add durable journal write/read helpers. | Journal files include transaction id, verb, registry digests, previous row, planned row, planned actions, status, and ownership metadata. |
| 2 | Wrap write verbs in journaled transactions. | `install`, `update`, `disable`, `enable`, and `uninstall` write journal before mutation and mark completion after registry and cleanup steps. |
| 3 | Implement digest-aware `recover`. | Recovery distinguishes planned, applying, committed, digest-changed, and locked states with deterministic JSON reports. |
| 4 | Validate planned active manifest sets. | Commands that expose resolver candidates validate a generated manifest-set before committing `active` visibility. |
| 5 | Reconcile update links. | Update handles added, removed, and changed link exports while deleting only installer-owned links. |
| 6 | Expand messy fixtures. | Fixtures cover partial install, partial update, registry digest drift, stale owned link, obsolete owned link, and failed cleanup. |
| 7 | Expand practical tests. | Tests prove recovery decisions, manifest-set prevalidation, update reconciliation, no live harness writes, and redacted JSON output. |
| 8 | Run objective review. | Three-perspective review reports no P0/P1 safety findings, or all findings are fixed. |

## Validation

| Check | Command |
|-------|---------|
| Patch whitespace | `git diff --check` |
| JS syntax | `node --check scripts/install-artifact-pack.mjs` |
| Fixture rewriter syntax | `node --check scripts/rewrite-installed-pack-fixture.mjs` |
| Lifecycle tests | `node --test tests/installed-pack-lifecycle.test.mjs` |
| Fixture manifests | `node scripts/validate-llm-first.mjs --check artifact-pack --artifact-pack tests/fixtures/installed-pack-lifecycle/pass/virtual-minimal` |
| Fixture manifests | `node scripts/validate-llm-first.mjs --check artifact-pack --artifact-pack tests/fixtures/installed-pack-lifecycle/pass/link-safe` |
| Spec lifecycle | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |
| Full validator | `node scripts/validate-llm-first.mjs` |

## Risks

| Risk | Control |
|------|---------|
| Recovery deletes user-owned paths. | Compare journal ownership, registry link records, ownership-map entries, symlink payload, and `created-lstat` before cleanup. |
| Registry and ownership map diverge. | Commit journal status only after registry, ownership-map, and cleanup steps are verified. |
| Manifest-set validation loads too much context. | Generate a compact manifest-set view with manifests and declared export paths only. |
| Update becomes a hidden migration path. | Keep `copy` mode rejected unless a future spec defines explicit semantics. |

## Acceptance Criteria

- [ ] All write verbs create and retire durable transaction journals.
- [ ] `recover --dry-run` reports deterministic recovery decisions without mutating state.
- [ ] `recover` mutates only journal-matching installer-owned rows and links.
- [ ] Active manifest-set validation runs before any command exposes `active` candidates.
- [ ] `update` reconciles owned links and reports non-owned conflicts.
- [ ] Messy lifecycle tests cover interrupted writes, stale journals, digest drift, and cleanup conflicts.
- [ ] Default JSON reports contain no absolute local paths unless `--verbose` is set.
- [ ] Three-perspective implementation review finds no blocking safety or contract findings.

## Open Decisions

| Decision | Default |
|----------|---------|
| Journal retention after successful commit | Remove by default; keep only when `--keep-temp` or a future debug flag requests retention. |
| Recovery mutation default | Keep `recover --dry-run` as the default test entry; explicit mutation requires no `--dry-run`. |
| Manifest-set validator input | Reuse generated temporary manifest-set until the validator supports registry JSON input. |
