---
status: active
created: 2026-05-17
updated: 2026-05-17
owner: agent-hub
---

# Obsidian Note Contract Cleanup Batch Summary

## Result

Applied two auto-fix passes after the root folder migration.

| Stage | Files changed by script | Scope |
|-------|-------------------------|-------|
| Batch 1 | 423 | source/date/title backfill, `type:` key migration, inferred project/type tags, mechanical H1 insert/move |
| Batch 2 | 103 | flat tag normalization, duplicate type/project tag dedupe, taxonomy expansion |

Validator movement:

| Snapshot | Issues |
|----------|-------:|
| before cleanup | 747 |
| after Batch 1 | 363 |
| after Batch 2 | 85 |

## Clean Categories

These issue families are now clear:

```text
frontmatter.source.missing
frontmatter.date.missing
frontmatter.title.missing
frontmatter.type.present
frontmatter.source.invalid
tags.taxonomy.unknown
tags.shape.invalid
tags.type.count
tags.project.count
```

## Remaining

Remaining validator issues need content judgment:

| Issue | Count | Next action |
|-------|------:|-------------|
| `tags.too-many` | 48 | trim semantic tags per-note; keep type/project first |
| `h1.count` | 16 | inspect multi-H1 documents; demote section H1s where appropriate |
| `links.markdown-image` | 7 | convert local images to Obsidian embeds; report external images |
| `h1.position` | 6 | blocked by multi-H1/body structure cases |
| `tags.inline.body` | 5 | inspect accidental Obsidian inline tags |
| `frontmatter.unknown-key` | 2 | inspect `project`, `started` fields in character customization history |
| `frontmatter.missing` | 1 | inspect legacy entry before adding frontmatter |

## Passed Validators

```text
root-structure
project-structure
daily-structure
path-config-drift
git diff --check
```
