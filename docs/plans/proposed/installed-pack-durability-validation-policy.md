---
status: proposed
created: 2026-05-25
updated: 2026-05-25
owner: agent-hub
milestone: agent-artifact-pack-system
parent: docs/plans/proposed/installed-pack-lifecycle.md
---

# Installed Pack Durability Validation Policy

## Purpose

Define the remaining durability and failed-validation journal policy for
installed artifact pack lifecycle writes.

## Problem

PR #64 adds journaled recovery, active manifest-set prevalidation, and update
link reconciliation. Two policy gaps remain:

| Gap | Current Behavior | Risk |
|-----|------------------|------|
| Fsync durability | Journals and registries use write-temp-and-rename without explicit file or directory fsync. | Host crash or power loss can lose a just-renamed journal or registry file. |
| Failed validation journal | Active manifest-set failures return a command report but do not persist a journal artifact. | Operators cannot inspect the failed planned row after the process exits. |

## Goals

| Goal | Acceptance |
|------|------------|
| Durable writes | Journal, registry, and ownership-map writes flush file contents and parent-directory metadata before the command reports success. |
| Validation-failed journal | Mutating write verbs persist a journal with `status: validation-failed` when active manifest-set validation fails after planning. |
| Recovery ignores validation failures | `recover` reports validation-failed journals as audit-only and does not mutate registry, ownership map, or links for them. |
| Safe pruning | A validation-failed journal blocks same-pack writes until `recover` marks or removes it. |
| Test coverage | Tests prove fsync helpers execute without regression and validation-failed journals survive failed validation without visibility changes. |

## Non-Goals

| Non-Goal | Owner |
|----------|-------|
| Do not implement stale-lock takeover. | Future lock policy spec. |
| Do not retain committed journals for audit. | Future audit retention spec. |
| Do not change active manifest-set conflict rules. | `installed-pack-lifecycle.md` |
| Do not add resolver loading from installed packs. | `artifact-pack-discovery-routing` |

## Current State

| Surface | State | Evidence |
|---------|-------|----------|
| Journal files | Created with temp write and rename. | `writeJournal` in `scripts/install-artifact-pack.mjs` |
| Registry files | Created with temp write and rename. | `writeRegistry` |
| Ownership map | Written directly to final path. | `writeOwnershipMap` |
| Active-set failures | Report `gate: active-manifest-set`; no persisted failed journal. | `commandInstall`, `commandStateChange`, `commandUpdate` |
| Recover | Handles rollback, finish, cleanup, locked, and digest-changed decisions. | `commandRecover` |

## Proposed Design

### Durable JSON Writes

| Function | Required Behavior |
|----------|-------------------|
| `writeJsonDurable(file, value)` | Write JSON to a temp sibling, fsync temp file, rename temp to final path, fsync parent directory. |
| `writeRegistry` | Use `writeJsonDurable`. |
| `writeJournal` | Use `writeJsonDurable`. |
| `writeOwnershipMap` | Use `writeJsonDurable`; no direct final-path write. |

Implementation rule:

| Step | Rule |
|------|------|
| Open temp file | Use `fs.open(tmp, "w")`. |
| Write | Write the full JSON payload plus trailing newline. |
| Flush file | Call `handle.sync()` before close. |
| Rename | Rename temp to final path. |
| Flush directory | Open parent directory read-only and call `sync()`; if unsupported, throw with `gate: durable-write`. |
| Cleanup | Remove temp file on failure when possible. |

### Validation-Failed Journal

| Field | Value |
|-------|-------|
| `status` | `validation-failed` |
| `failure-gate` | `active-manifest-set` |
| `failure-reason` | Redacted command failure reason. |
| `registry-digest-before` | Digest before planned mutation. |
| `registry-digest-planned` | Digest of planned registry row. |
| `previous-row` | Previous row or null. |
| `planned-row` | Planned row that failed active-set validation. |
| `planned-actions` | Report actions through failed validation. |

Write verbs that can expose active visibility must create the journal before
active manifest-set validation:

| Verb | Journal Before Validation |
|------|---------------------------|
| `install` | yes |
| `enable` | yes |
| `update` when planned state is `active` | yes |
| `disable` | no active-set validation |
| `uninstall` | no active-set validation |

On validation failure:

| Step | Behavior |
|------|----------|
| Record | Update the journal to `status: validation-failed`. |
| Report | Return existing command failure with `gate: active-manifest-set`. |
| Visibility | Do not write registry, ownership map, or links. |
| Next write | `assertNoActiveJournal` blocks same-pack writes until recovery handles the journal. |

### Recover Policy

| Journal Status | Recovery Decision | Mutation |
|----------------|-------------------|----------|
| `validation-failed` | `validation-failed` | None. Mark journal `recovered` and remove it unless `--dry-run`. |
| `planned` | Existing rollback decision. | Existing behavior. |
| `applying` | Existing rollback or finish decision. | Existing behavior. |
| `committed` | Existing cleanup decision. | Existing behavior. |

Default reports must include the validation-failed journal in
`recovery.actions` with no absolute path leaks.

## Design Plan

S0 - Baseline Re-Check

Input:
- `origin/main` after PR #64.
- `scripts/install-artifact-pack.mjs`.
- `tests/installed-pack-lifecycle.test.mjs`.

Output:
- Clean worktree.
- Baseline lifecycle tests pass.

Non-output:
- No source edits.

Failure:
- Stop if main does not include PR #64 or lifecycle tests fail before edits.

Proof:
- `git status --short --branch`
- `node --test tests/installed-pack-lifecycle.test.mjs`

S1 - Durable JSON Helper

Input:
- `writeRegistry`, `writeJournal`, and `writeOwnershipMap`.

Output:
- Shared durable JSON writer with file fsync, atomic rename, and parent directory fsync.
- Registry, journal, and ownership-map writes use the helper.

Non-output:
- No report schema change.
- No journal status change.

Failure:
- Throw `gate: durable-write` if fsync or rename fails.

Proof:
- Lifecycle tests pass.
- A targeted test writes registry, journal, and ownership map through existing verbs.

S2 - Validation-Failed Journals

Input:
- Active manifest-set validation paths in install, enable, and active update.
- Existing transaction journal fields.

Output:
- Failed active-set validation writes a `validation-failed` journal with planned row and failure metadata.
- No registry, link, or ownership mutation occurs on validation failure.

Non-output:
- No failed journals for dry-run.
- No failed journals for non-active update, disable, or uninstall.

Failure:
- If writing the validation-failed journal fails, return `gate: durable-write`.

Proof:
- Tests assert failed install/update/enable leave registry unchanged and create a validation-failed journal.

S3 - Recover Audit Cleanup

Input:
- `commandRecover` journal decision loop.

Output:
- `recover --dry-run` reports `decision: validation-failed` for validation-failed journals.
- Mutating `recover` marks then removes validation-failed journals without touching links or registry rows.

Non-output:
- No automatic retry of active manifest-set validation.
- No source pack read during recovery.

Failure:
- If a validation-failed journal has invalid shape, report existing journal parse failure.

Proof:
- Tests assert validation-failed journal cleanup is no-op for registry and links.

S4 - Review And Commit

Input:
- Implementation diff and test results.

Output:
- Review findings fixed or recorded.
- Branch is clean.

Non-output:
- No PR merge.
- No worktree cleanup.

Failure:
- Stop if P1 durability, recovery, or validation policy finding remains.

Proof:
- `node --test tests/installed-pack-lifecycle.test.mjs`
- `node scripts/validate-llm-first.mjs --check spec-lifecycle`
- `node scripts/validate-llm-first.mjs`
- `git diff --check`

## Validation

Run:

```bash
node --check scripts/install-artifact-pack.mjs
node --check tests/installed-pack-lifecycle.test.mjs
node --test tests/installed-pack-lifecycle.test.mjs
node scripts/validate-llm-first.mjs --check spec-lifecycle
node scripts/validate-llm-first.mjs
git diff --check
```

## Risks

| Risk | Mitigation |
|------|------------|
| Directory fsync unsupported on a platform. | Fail with `gate: durable-write`; do not silently claim durability. |
| Validation-failed journals block normal retry. | `recover` removes audit-only validation-failed journals. |
| Failure reason leaks local paths. | Store redacted `failure-reason`; keep verbose paths only in command output when requested. |
| Journal write happens for dry-run. | S2 forbids dry-run journal writes. |

## Acceptance Criteria

| Criterion | Proof |
|-----------|-------|
| Registry, journal, and ownership-map writes use durable writer. | Code review and lifecycle tests. |
| Active-set validation failure persists a `validation-failed` journal for mutating install, enable, and active update. | Unit tests. |
| Recovery clears validation-failed journals without registry or link mutation. | Unit tests. |
| Existing recovery behavior still passes. | Lifecycle test suite. |
| Default JSON remains path-redacted. | Existing redaction test plus failed-validation journal assertion. |

## Open Decisions

| Decision | State |
|----------|-------|
| Retain validation-failed journals after `recover` for audit history. | No; remove after recover for now. |
| Add fsync to lockfile creation. | No; lockfile is process coordination, not durable state. |
