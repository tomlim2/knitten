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
| Parallel branches | Three implementation slices exist and must be pushed before integration starts. | `feat/20260525-181056-installed-pack-journal-recovery`, `feat/20260525-181106-installed-pack-manifest-set-prevalidation`, `feat/20260525-181200-installed-pack-update-reconciliation` |

## Brainstorming

### Integration Shape

| Option | Benefit | Risk | Decision |
|--------|---------|------|----------|
| Pick one branch as winner. | Fastest path. | Drops two proven slices and loses test evidence. | Reject. |
| Merge all three blindly. | Preserves all work. | High conflict risk in installer control flow. | Reject. |
| Journal wrapper as outer skeleton. | Centralizes lock, journal, recovery, and cleanup ordering. | Requires careful insertion of validation and update reconciliation hooks. | Accept. |
| Manifest-set gate before journal. | Avoids journal writes for invalid active sets. | May miss journaling validation decisions. | Reject for write verbs that mutate state. |
| Manifest-set gate inside transaction before visibility commit. | Journal records planned state and failed validation without exposing candidates. | Needs planned registry materialization helpers. | Accept. |
| Update reconciliation inside the same transaction. | One journal can describe added, removed, changed, and conflict link actions. | Requires action records to be deterministic and redacted. | Accept. |

### Target Transaction Order

| Phase | Purpose | Required Before Next |
|-------|---------|----------------------|
| Resolve | Load registry, row, manifest, scope, and link plan. | No persistent mutation. |
| Plan | Build previous row, planned row, candidate rows, link diff, and manifest-set path. | Deterministic report fields exist. |
| Journal | Write durable journal with registry digest, previous row, planned row, and planned actions. | Journal exists before link or registry mutation. |
| Validate | Run pack validation and planned active manifest-set validation. | Active visibility cannot be exposed until this passes. |
| Apply | Apply owned link creates/removals and registry state changes in spec-defined order. | Non-owned conflicts block or force-tombstone only where allowed. |
| Verify | Re-read registry and owned link state. | Journal can be marked committed only after verification. |
| Retire | Remove or mark journal complete. | Recovery has no stale work left. |

### Merge Order

| Order | Branch | Reason |
|-------|--------|--------|
| 1 | `feat/20260525-181056-installed-pack-journal-recovery` | Provides transaction and recovery skeleton. |
| 2 | `feat/20260525-181106-installed-pack-manifest-set-prevalidation` | Inserts active-set validation into the transaction before visibility commit. |
| 3 | `feat/20260525-181200-installed-pack-update-reconciliation` | Adds update link diff behavior inside the journaled apply phase. |

### Review Questions

| Question | Pass Signal |
|----------|-------------|
| Can any write expose `active` candidates without pack and manifest-set validation? | No code path writes active registry state before validation. |
| Can recovery delete a path not proven installer-owned? | Cleanup requires journal ownership, registry link record, ownership map, payload, and `created-lstat` match. |
| Can update leave obsolete owned links visible? | Removed and changed link exports produce `link-remove` actions for owned links. |
| Can a non-owned conflict keep resolver visibility stale? | Disable/uninstall remove resolver visibility before cleanup conflicts where the spec allows. |
| Do default reports leak local paths? | JSON uses labels unless `--verbose` is set. |

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

## Design Plan

S0 - Baseline Re-Check

Input:
- `origin/main` after PR #63.
- Parallel commits `d1aac579ac7c007e2c3ebb5a767133d25b4376ee`, `0f59229465cce92664c90b93348fd125afec9dac`, and `d2322ed441abd80b09e27c9a3253c5a8d733f409`.
- Remote branches `origin/feat/20260525-181056-installed-pack-journal-recovery`, `origin/feat/20260525-181106-installed-pack-manifest-set-prevalidation`, and `origin/feat/20260525-181200-installed-pack-update-reconciliation`.
- `scripts/install-artifact-pack.mjs`.
- `tests/installed-pack-lifecycle.test.mjs`.

Output:
- Clean integration worktree.
- List of changed functions and tests from each branch.
- Baseline validation result from `origin/main`.
- Confirmation that every source implementation branch is pushed and clean.

Non-output:
- No source edits.
- No registry, harness target, or live config mutation.

Failure:
- Stop if any source branch is dirty, missing, or based on an unexpected commit.

Proof:
- `git status --short --branch`
- `git show --stat <commit>`
- `git -C <source-worktree> status --short --branch`
- `git ls-remote --heads origin <source-branch>`
- `node --test tests/installed-pack-lifecycle.test.mjs`

S1 - Import Journal Skeleton

Input:
- Journal/recovery commit `d1aac579ac7c007e2c3ebb5a767133d25b4376ee`.
- Existing lock, ownership, and recover helpers.

Output:
- Transaction helper functions own lock acquire/release, journal create/update/retire, and recover report decisions.
- Write verbs call a common transaction path before persistent mutation.

Non-output:
- No manifest-set validation behavior beyond preserving existing tests.
- No update link reconciliation changes beyond preserving existing behavior.

Failure:
- Reject import if journal cleanup can delete non-owned links or if stale lock behavior regresses.

Proof:
- Journal branch tests still pass after import.
- `recover --dry-run` fixtures report deterministic decisions.

S2 - Add Active Manifest-Set Gate

Input:
- Manifest-set prevalidation commit `0f59229465cce92664c90b93348fd125afec9dac`.
- Journaled planned row and candidate-index helpers from S1.

Output:
- `install`, `enable`, and active `update` validate planned active manifest sets before active visibility is committed.
- Failed active-set validation leaves registry rows and link state unchanged.
- Failure reports use `gate: active-manifest-set`.

Non-output:
- No update link diff logic beyond the minimum needed to validate planned rows.
- No copied export bodies in manifest-set views.

Failure:
- Journal records failed validation without exposing active candidates.

Proof:
- Manifest-set prevalidation tests pass.
- Default JSON failure output contains no absolute local paths.

S3 - Add Update Link Reconciliation

Input:
- Update reconciliation commit `d2322ed441abd80b09e27c9a3253c5a8d733f409`.
- Journaled apply phase from S1.
- Manifest-set gate from S2.

Output:
- `update` computes added, removed, changed, and unchanged link records.
- Added links are created only after validation.
- Removed or changed obsolete links are removed only when installer ownership is proven.
- Non-owned conflicts block update and leave previous registry/link state visible.

Non-output:
- No support for `mount.mode: copy`.
- No deletion or edit of source pack folders.

Failure:
- If any link conflict exists, report structured conflicts and keep previous row authoritative.

Proof:
- Update reconciliation tests pass.
- Link ownership regression tests pass.

S4 - Normalize Reports And Fixtures

Input:
- Combined action rows, conflict rows, recovery rows, and tests from S1-S3.

Output:
- JSON reports use one action vocabulary for validate, manifest-set, registry-write, link-create, link-remove, and recover.
- Fixtures cover stale journal, locked registry, partial install, partial update, non-owned symlink, obsolete owned link, and active-set failure.

Non-output:
- No broad fixture rewrite unrelated to installed-pack lifecycle.

Failure:
- Stop if report fields become inconsistent with `installed-pack-lifecycle-test-contract.md`.

Proof:
- `node --test tests/installed-pack-lifecycle.test.mjs`
- Fixture path scan finds no absolute local paths.

S5 - Objective Review And Patch

Input:
- Integrated branch diff.
- Current lifecycle spec and test contract.

Output:
- Three-perspective review covering safety/recovery, update reconciliation, and LLM-first/test contract.
- Blocking findings patched before PR.

Non-output:
- No PR merge before P0/P1 findings are resolved or explicitly moved to a follow-up spec.

Failure:
- If reviewers disagree on a safety invariant, preserve the stricter behavior and document the decision.

Proof:
- Review findings list.
- Follow-up patch commits or explicit residual-risk section.

S6 - Publish Integration

Input:
- Clean integrated branch with passing validation and review evidence.
- Recovery-hardening spec branch merged or explicitly included in the integration PR.

Output:
- Pushed integration branch.
- PR body lists validation, review evidence, and residual risks.
- PR body links the recovery-hardening spec and all three source implementation branches.

Non-output:
- No branch deletion during merge.

Failure:
- Stop if the recovery-hardening spec is not available from the PR base or PR branch.
- Stop if GitHub checks fail or PR state is not mergeable.

Proof:
- `git diff --check`
- `node --check scripts/install-artifact-pack.mjs`
- `node --check scripts/rewrite-installed-pack-fixture.mjs`
- `node --check tests/installed-pack-lifecycle.test.mjs`
- `node --test tests/installed-pack-lifecycle.test.mjs`
- `node scripts/validate-llm-first.mjs --check spec-lifecycle`
- `node scripts/validate-llm-first.mjs`
- GitHub PR checks pass.

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
