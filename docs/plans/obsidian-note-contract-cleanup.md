---
status: active
created: 2026-05-17
updated: 2026-05-17
owner: caol-ila
---

# Obsidian Note Contract Cleanup

## Purpose

Clean note-level contract issues after the vault root migration to `projects/` and `daily/`.

Folder structure is already valid. This plan handles frontmatter, tags, H1, source, and Obsidian markdown issues reported by `obsidian-contract`.

## Current Validator Snapshot

Command:

```bash
bash agent/skills/obsidian-fix-format/fix.sh --check obsidian-contract
```

Snapshot:

| Metric | Count |
|--------|-------|
| scanned files | 747 |
| total issues | 747 |
| `frontmatter.source.missing` | 132 |
| `frontmatter.date.missing` | 82 |
| `frontmatter.unknown-key` | 67 |
| `frontmatter.type.present` | 65 |
| `tags.too-many` | 62 |
| `tags.shape.invalid` | 56 |
| `h1.count` | 47 |
| `tags.taxonomy.unknown` | 44 |
| `frontmatter.title.missing` | 40 |
| `h1.position` | 40 |
| `h1.title.mismatch` | 37 |
| `tags.project.count` | 32 |
| `tags.type.count` | 19 |
| `frontmatter.source.invalid` | 11 |
| `links.markdown-image` | 7 |
| `tags.inline.body` | 5 |
| `frontmatter.missing` | 1 |

## Cleanup Classes

### Auto-Fix Safe

These can be handled without asking the user because the target value is mechanically derivable and reversible through git/iCloud history:

| Issue | Rule |
|-------|------|
| `frontmatter.source.missing` | set `source: codex` for generated README files; set `source: manual` for migrated notes unless existing text identifies another source |
| `frontmatter.source.invalid` | normalize known legacy values: `claude`, `claude-code`, `Claude Code` → `codex` only for generated/agent-authored migration docs; otherwise `manual` |
| `frontmatter.date.missing` | derive from path date if present; else file birth/mtime date; fallback to migration date `2026-05-17` |
| `frontmatter.title.missing` | first H1; else filename titleized |
| `frontmatter.type.present` | move `type: foo` into `tags: - type/foo`, then remove `type` key |
| `frontmatter.unknown-key` | preserve known useful fields in frontmatter; remove orphan lines only after report |
| `h1.position` | move or insert one H1 immediately after frontmatter when title is known |
| missing H1 | insert `# {title}` immediately after frontmatter |
| markdown image links | convert local markdown image links to Obsidian embeds when target is local |
| private PR links | already covered by validator; replace with durable `PR NNN` prose if found |

### Needs Conservative Heuristic

These can be auto-fixed only when confidence is high:

| Issue | High-confidence rule |
|-------|----------------------|
| `tags.project.count = 0` | infer from path `projects/<project>/...` |
| `tags.type.count = 0` | infer from folder: `days → type/devlog`, `learnings → type/learning`, `specs → type/spec`, `plans → type/plan`, `decisions → type/decision`, `topics → type/reference` |
| simple `tags.shape.invalid` | map flat tags to axes when obvious: `reference → type/reference`, `learning → type/learning`, project folder name → `project/<folder>` |
| duplicate type tags | keep the tag that matches folder role; move the other semantic as `area/` only if taxonomy has it |
| `h1.title.mismatch` | prefer frontmatter title for generated README; otherwise report unless exact case/spacing-only mismatch |

### Needs Decision

These should be reported and not silently changed in the first auto-fix batch:

| Issue | Reason |
|-------|--------|
| broad project tag additions | `project/ai`, `project/backend`, `project/rendering`, etc. may be real projects or category buckets |
| `tags.too-many` | requires semantic priority, not just mechanical trimming |
| unknown taxonomy values | decide whether to add taxonomy rows or retag notes |
| multi-H1 documents | may need structural editing, not just deletion |
| `frontmatter.missing` | requires preserving existing body carefully |
| non-local markdown images | may be source links, not embeds |
| inline body tags | may be intentional learnings markers or accidental prose |

## Implementation Batches

### Batch 0 — Reports

Create reports under:

```text
docs/plans/obsidian-note-contract-cleanup-reports/<timestamp>/
```

Reports:

| Report | Content |
|--------|---------|
| `issues.json` | exact validator issues parsed by file |
| `auto-fix-preview.json` | planned mechanical changes |
| `decision-needed.json` | project tag, taxonomy, multi-H1, and ambiguous fixes |

### Batch 1 — Safe Frontmatter Backfill

Patch only:

- missing `source`
- invalid legacy `source`
- missing `date`
- missing `title`
- `type:` key migration into `tags`
- missing `project/<folder>` from path
- missing `type/<role>` from folder

Do not trim tags in this batch.

### Batch 2 — H1 Mechanical Fixes

Patch only:

- no H1 and known title
- H1 not immediately after frontmatter when exactly one H1 exists
- case/spacing-only H1/title mismatch

Report multi-H1 documents.

### Batch 3 — Taxonomy Alignment

Generate taxonomy proposal:

- project tags present in file paths but absent from `TAG-TAXONOMY.md`
- flat tags that need axis mapping
- tags that are probably duplicates

Ask only if the proposal contains category/project taxonomy decisions. If all unknown tags are direct project folder names, add project rows.

### Batch 4 — Markdown Link And Inline Tag Cleanup

Patch private PR links and local image markdown links.

Report:

- external image links
- ambiguous `#tag` body prose

### Batch 5 — Notion Archive Promotion

Promote imported Notion worklogs from an archive-shaped folder into Obsidian-native project topics.

Scope:

- Source: `projects/cinev-studio/topics/cinev/notion-archive/`
- Destination:
  - archive index → `projects/cinev-studio/topics/cinev/legacy-worklog.md`
  - imported notes/assets → `projects/cinev-studio/topics/cinev/legacy-worklog/`

Rules:

| Concern | Rule |
|---------|------|
| Origin | Preserve `source: notion-export`; do not encode origin in the folder name |
| Type | Convert imported topic notes from `type/devlog` to `type/reference` because they now live under `topics/` |
| Tags | Keep exactly one `type/`, one `project/`, and at most 3 semantic tags |
| Assets | Move sibling asset folders with their notes so existing wikilink embeds keep resolving |
| Deletion | Remove only empty archive folders; do not delete imported note content |
| Report | Write a migration manifest with moved paths and tag changes |

## Validators

Run after each batch:

```bash
bash agent/skills/obsidian-fix-format/fix.sh --check obsidian-contract
bash agent/skills/obsidian-fix-format/fix.sh --check root-structure
bash agent/skills/obsidian-fix-format/fix.sh --check project-structure
bash agent/skills/obsidian-fix-format/fix.sh --check daily-structure
bash agent/skills/obsidian-fix-format/fix.sh --check path-config-drift
git diff --check
```

## Completion Criteria

| Criterion | Required |
|-----------|----------|
| structure validators | clean |
| `frontmatter.source.missing` | 0 |
| `frontmatter.date.missing` | 0 |
| `frontmatter.title.missing` | 0 |
| `frontmatter.type.present` | 0 |
| `tags.project.count` | 0 unless explicitly waived |
| `tags.type.count` | 0 unless explicitly waived |
| `links.private-pr-url` | 0 |
| decision report | contains all remaining ambiguous taxonomy/H1/tag cases |

## Execution Log

| Date | Action | Result |
|------|--------|--------|
| 2026-05-17 | Created spec | Cold-start reviewed; safe auto-fix scope approved |
| 2026-05-17 | Applied Batch 1 | Issues reduced from 747 to 363; source/date/title/type-key families cleared |
| 2026-05-17 | Applied Batch 2 | Issues reduced from 363 to 85; taxonomy unknown, shape invalid, type/project count families cleared |
| 2026-05-17 | Planned Batch 5 | Notion archive promotion scoped to CINEV legacy worklog notes |
| 2026-05-17 | Applied Batch 5 | Removed `notion-archive/`; promoted CINEV imported worklogs to `legacy-worklog` topic reference notes |
| 2026-05-17 | Applied final contract cleanup | `obsidian-contract`, root, project, daily, path drift, and diff checks clean |
