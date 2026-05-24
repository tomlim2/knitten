---
status: completed
created: 2026-05-25
updated: 2026-05-25
owner: agent-hub
milestone: agent-artifact-pack-system
---

# Artifact Inventory Provenance Validation

## Purpose

Validate artifact inventory generation metadata so agents can tell whether
`agent/config/artifact-inventory.json` was generated from a clean or dirty repo
state.

## Problem

`agent/config/artifact-inventory.json` records `generated-at` and
`source-commit`, but `source-commit` alone does not tell agents whether the
generator included uncommitted or untracked files.

## Contract

| Field | Rule |
|-------|------|
| `generated-at` | UTC ISO date-time string emitted by `Date.toISOString()` when the generator writes the inventory. |
| `source-commit` | Git commit hash returned by `git rev-parse HEAD` before writing the inventory. |
| `source-dirty` | Whole-repo dirty boolean returned from `git status --porcelain --untracked-files=normal` before writing the inventory. |
| `source-dirty: false` | Inventory was generated from a clean worktree before the output write. |
| `source-dirty: true` | Inventory may include staged, unstaged, or untracked source paths from the generator run; exact input is not reproducible from `source-commit` alone. |

## Non-Goals

| Non-Goal | Reason |
|----------|--------|
| Do not require `source-commit` to equal current `HEAD`. | PR branches can be squashed, and generated files are often committed after generation. |
| Do not reject dirty generation. | Worktree-first branches generate inventory while spec or generator edits are still uncommitted. |
| Do not add a content hash. | Dirty inventories are explicit but not exactly reproducible from metadata alone. |

## Design Plan

| Step | Change | Output |
|------|--------|--------|
| 1 | Add `source-dirty` to generator output. | Inventory records dirty-state provenance. |
| 2 | Require provenance fields in schema. | Schema rejects missing generation metadata. |
| 3 | Add validator checks. | `artifact-inventory` fails on invalid `generated-at`, `source-commit`, or `source-dirty`. |
| 4 | Regenerate inventory. | Current inventory includes the new metadata field. |

## Validation

| Check | Command |
|-------|---------|
| Regenerate inventory | `node scripts/generate-artifact-inventory.mjs` |
| Artifact inventory | `node scripts/validate-llm-first.mjs --check artifact-inventory` |
| Spec lifecycle | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |
| Full validator | `node scripts/validate-llm-first.mjs` |

## Acceptance Criteria

- [x] `agent/config/artifact-inventory.schema.json` requires `generated-at`, `source-commit`, and `source-dirty`.
- [x] `scripts/generate-artifact-inventory.mjs` emits `source-dirty`.
- [x] `scripts/validate-llm-first.mjs --check artifact-inventory` validates all provenance fields.
- [x] Dirty generation is explicit instead of hidden behind `source-commit`.
