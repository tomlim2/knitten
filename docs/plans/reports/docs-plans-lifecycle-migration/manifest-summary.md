---
status: report
created: 2026-05-17
updated: 2026-05-17
owner: caol-ila
spec: ../../docs-plans-lifecycle-migration.md
---

# Docs Plans Lifecycle Migration Manifest Summary

## Purpose

This report records the generated Batch B move manifest for [docs-plans-lifecycle-migration.md](../../docs-plans-lifecycle-migration.md). It maps tracked flat specs and report artifacts to lifecycle destinations. No files have been moved in this batch.

## Files

| File | Purpose |
|------|---------|
| [move-manifest.tsv](move-manifest.tsv) | source-to-target move manifest |
| [manifest-summary.md](manifest-summary.md) | human review summary |

## Inventory Counts

| Kind | Count |
|------|------:|
| top-level tracked specs | 53 |
| tracked report artifacts | 37 |
| total manifest rows | 90 |

## Status Counts

| Status | Count |
|------|------:|
| `active` | 5 |
| `done` | 7 |
| `draft` | 1 |
| `draft-conflict` | 1 |
| `implemented` | 8 |
| `implemented-validation-blocked` | 1 |
| `open` | 26 |
| `parked` | 1 |
| `proposed` | 3 |

## Target Bucket Counts

| Bucket | Count |
|------|------:|
| `active` | 32 |
| `completed` | 15 |
| `drafts` | 2 |
| `parked` | 1 |
| `proposed` | 3 |
| `reports` | 37 |

## Report Directory Mapping

| Report source slug | Files |
|------|------:|
| `obsidian-contract-cleanup` | 5 |
| `obsidian-note-contract-cleanup` | 18 |
| `obsidian-project-docs-structure-migration` | 9 |
| `obsidian-root-projects-daily-migration` | 5 |

## Needs Review Before Move

These specs have legacy `open` status. The candidate target bucket is `active`, but Batch C should review them before running `git mv`.

- `docs/plans/adr-0030-clarify-extension-boundary.md`
- `docs/plans/agent-symlink-followup.md`
- `docs/plans/bridge-add-background-prop-batch-spawn.md`
- `docs/plans/bridge-clear-background-props.md`
- `docs/plans/ci-add-containerfile-smoke.md`
- `docs/plans/docs-add-toast-modal-guidelines.md`
- `docs/plans/editor-add-debug-sidebar-nav.md`
- `docs/plans/editor-add-debug-surface-layout.md`
- `docs/plans/engine-reuse-debug-cube-assets.md`
- `docs/plans/gltf-add-axis-correction-calculator.md`
- `docs/plans/gltf-add-axis-primary-child-picker.md`
- `docs/plans/gltf-apply-vrm-axis-bake-rest-pose.md`
- `docs/plans/gltf-normalize-extended-collider.md`
- `docs/plans/gltf-rebake-axis-bind-matrices.md`
- `docs/plans/gltf-repair-vrm1-thumb-slots.md`
- `docs/plans/gltf-wire-axis-bake-normalize-vrm.md`
- `docs/plans/import-add-prop-gltf.md`
- `docs/plans/link-codex-context.md`
- `docs/plans/placeholder-material-checker-sampler.md`
- `docs/plans/retarget-cleanup-rig-branches.md`
- `docs/plans/retarget-recalibrate-default-pose.md`
- `docs/plans/shotloom-debug-router-pr-split.md`
- `docs/plans/shotloom-plan-skills-risk-map.md`
- `docs/plans/stage-add-map-document-parser.md`
- `docs/plans/stage-define-map-document-bundle-layout.md`
- `docs/plans/workspace-unify-thiserror-deps.md`

## Next Gate

Batch C may move only rows whose `needs-review` value is `false` or has been explicitly approved. The move must use `git mv`, then repair links and run the full validator.
