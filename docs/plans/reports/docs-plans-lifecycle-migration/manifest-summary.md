---
status: report
created: 2026-05-17
updated: 2026-05-17
owner: agent-hub
spec: ../../completed/docs-plans-lifecycle-migration.md
---

# Docs Plans Lifecycle Migration Manifest Summary

## Purpose

This report records the generated Batch B move manifest for [docs-plans-lifecycle-migration.md](../../completed/docs-plans-lifecycle-migration.md). It maps tracked flat specs and report artifacts to lifecycle destinations. Batch C moved only rows whose `needs-review` value was `false`.

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

## Batch C Execution

| Result | Count |
|------|------:|
| approved rows moved | 64 |
| spec files moved | 27 |
| report artifacts moved | 37 |
| legacy `open` specs held | 26 |
| redirect stubs created | 0 |

The `source` column in [move-manifest.tsv](move-manifest.tsv) remains the
pre-migration path for auditability. Post-move references were repaired in
milestones, briefings, skill related links, standards, lookup docs, and moved
spec sibling links. Report-producing scripts now write under
`docs/plans/reports/<spec-slug>/`.

## Report Directory Mapping

| Report source slug | Files |
|------|------:|
| `obsidian-contract-cleanup` | 5 |
| `obsidian-note-contract-cleanup` | 18 |
| `obsidian-project-docs-structure-migration` | 9 |
| `obsidian-root-projects-daily-migration` | 5 |

## Legacy Open Review

The 26 legacy `open` specs were reviewed on 2026-05-17 after Batch C. See
[open-plans-review-summary.md](open-plans-review-summary.md) for the
classification evidence.

| Result | Count |
|------|------:|
| moved to `completed/` | 25 |
| moved to `active/` | 1 |
| deleted | 0 |

The `source` column in [move-manifest.tsv](move-manifest.tsv) remains the
pre-migration path for auditability. The final `docs/plans/` root has no
top-level Markdown specs.

## Next Gate

Future lifecycle work should operate through the resolver paths and avoid
creating new flat `docs/plans/<slug>.md` specs.
