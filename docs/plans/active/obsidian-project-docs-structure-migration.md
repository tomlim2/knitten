---
status: active
created: 2026-05-17
updated: 2026-05-17
owner: caol-ila
---

# Obsidian Project Docs Structure Migration

## Purpose

Migrate existing Obsidian project notes under `{obsidian-agent-root}/projects/<project>/` to the general role-folder contract.

Canonical structure owner: `agent/skills/obsidian-obsidian-markdown/references/PROJECT-DOCS-STRUCTURE.md`.

## Path Contract

| Path token | Meaning |
|------------|---------|
| `{repo}` | configured `caol-ila` repo path |
| `{obsidian-root}` | value of `obsidian` in `~/.claude/private/caol-config/machine-paths.json` |
| project note root | `{obsidian-root}/projects/<project>/` |
| structure spec | `{repo}/agent/skills/obsidian-obsidian-markdown/references/PROJECT-DOCS-STRUCTURE.md` |
| validator | `{repo}/agent/skills/obsidian-fix-format/fix.sh` |

Resolve `{obsidian-agent-root}` before moving files:

```bash
jq -r '."obsidian-agent-root"' ~/.claude/private/caol-config/machine-paths.json
```

Abort if the resolved value is empty, `null`, or outside an Obsidian vault.

## Current State

`obsidian-fix-format --check project-structure` reports:

| Code | Count | Meaning |
|------|-------|---------|
| `project.root-role-mismatch` | 102 | root `.md` file has a `type/...` tag that belongs in a role folder |
| `project.root-legacy-hub` | 14 | root `.md` file is neither `README.md` nor a clear role-owned note |

`obsidian-fix-format --check obsidian-contract` reports:

| Metric | Count |
|--------|-------|
| files scanned | 441 |
| offenders | 210 |

## Target Contract

Project folders use this shape:

```text
{obsidian-agent-root}/projects/<project>/
  README.md
  days/
  learnings/
  topics/
  specs/
  plans/
  decisions/
  asks/
  ops/
    missions/
    runs/
```

Create only folders with real content.

## Routing Table

| Root file signal | Destination |
|------------------|-------------|
| `type/devlog` | `days/` |
| `type/learning` | `learnings/` |
| `type/spec` | `specs/` |
| `type/plan` | `plans/` |
| `type/decision` | `decisions/` |
| `type/analysis` | `topics/` |
| `type/reference` | `topics/` |
| `type/glossary` | `topics/` |
| `type/topic` | `topics/` |

## In Scope

| Surface | Action |
|---------|--------|
| project root `.md` files | move to role folders when `type/...` decides destination |
| root `README.md` | create or update folder map |
| role-folder `README.md` | create only for durable folders required by `PROJECT-DOCS-STRUCTURE.md` |
| wikilinks inside moved notes | update when basename/path changes break links |
| Obsidian URI references | update when exact moved path is known |
| validator reports | keep `project-structure` report-only during migration |

## Out of Scope

| Surface | Reason |
|---------|--------|
| prose rewrites | this migration changes location and structure only |
| tag taxonomy cleanup unrelated to role folders | handled by `obsidian-contract` cleanup |
| daily note H1/title normalization | handled by a separate day-note cleanup pass |
| historical `source: claude-code` values | factual source values stay unless a note lies |
| non-`{obsidian-agent-root}/projects/` docs | user requested project docs first; other doc structures come later |
| `{obsidian-agent-root}/projects/_cross-project/` | separate migration; current doc-write policy routes cross-project learnings to `{obsidian-agent-root}/learnings/` |

## Special Cases

| Case | Action |
|------|--------|
| `_cross-project` root files | exclude from Batch 1-4; create a separate migration spec if cleanup is requested |
| root `type/devlog` without a usable date | do not move; add to skipped report with reason `devlog-date-missing` |
| existing destination file | do not overwrite; add to skipped report with reason `destination-conflict` |
| root file with multiple `type/...` tags | do not move; add to skipped report with reason `ambiguous-type` |

## Migration Batches

### Batch 0 — Snapshot

Run:

```bash
bash agent/skills/obsidian-fix-format/fix.sh --check project-structure
bash agent/skills/obsidian-fix-format/fix.sh --check obsidian-contract
```

Record counts in this file before moving notes.

### Batch 1 — Mechanical Role Moves

Move only files where all conditions are true:

| Condition | Required |
|-----------|----------|
| file is directly under `{obsidian-agent-root}/projects/<project>/` | yes |
| project is not `_cross-project` | yes |
| file is not `README.md` | yes |
| frontmatter has exactly one `type/...` route in the routing table | yes |
| destination filename has no conflict | yes |
| body does not act as a project root hub | yes |

Before moving, create a move manifest:

```text
old_path<TAB>new_path<TAB>type_tag<TAB>reason
```

Save the manifest outside the vault or under an approved repo plan artifact before applying moves. Use the manifest for link repair.

Destination naming:

| Source pattern | Destination pattern |
|----------------|---------------------|
| root `type/devlog` with date in title or filename | `days/YYYY-MM-DD.md` when date is unique |
| root `type/devlog` without usable date | skipped report only; reason `devlog-date-missing` |
| root `learning-*` or `type/learning` | `learnings/<slug>.md` |
| root `type/spec` | `specs/<slug>.md` |
| root `next-session-*` or `type/plan` | `plans/<slug>.md` |
| root `type/analysis`, `type/reference`, `type/glossary`, `type/topic` | `topics/<slug>.md` |

Move verification:

| Check | Required |
|-------|----------|
| destination exists | yes |
| source no longer exists | yes |
| destination SHA-256 matches source pre-move SHA-256 | yes |
| manifest contains the move | yes |

### Batch 2 — Legacy Hubs

For each `project.root-legacy-hub`:

| File role | Action |
|-----------|--------|
| root index | merge into `README.md`, then delete original |
| durable reference | move to `topics/` and add `type/reference` if missing |
| execution plan | move to `plans/` and add `type/plan` if missing |
| unclear mixed content | leave in root and add `status: needs-review` only after user approval |

Merge verification for root indexes:

| Check | Required |
|-------|----------|
| original heading list captured in report | yes |
| project `README.md` contains equivalent links or sections | yes |
| old file path appears in move/delete report | yes |
| original file deleted only after README update is verified | yes |
| ambiguous body content preserved in report instead of deleted | yes |

### Batch 3 — README Repair

For each touched project:

1. Ensure `README.md` exists.
2. Add folder map with only existing role folders.
3. Link active durable folders.
4. Do not add generated inventory tables unless the project already uses them.

Required README sections:

| Section | Content |
|---------|---------|
| `# <Project>` | project name |
| `## Scope` | one-line scope if known; else `TBD` |
| `## Folder Map` | role folder table |
| `## Active Entry Points` | links to current spec, plan, or latest day note when obvious |

### Batch 4 — Link Repair

Run exact-path link repair only from the Batch 1 move manifest:

| Link type | Action |
|-----------|--------|
| wikilink to moved basename | update only when manifest proves the old target is unique |
| markdown relative link | update if source and target are both inside vault |
| Obsidian URI | update if path is exact |
| ambiguous basename | leave unchanged and report |

Do not infer moves from current filesystem state. Use only `old_path -> new_path` pairs in the manifest.

## Safety Rules

| Rule | Action |
|------|--------|
| name conflict | do not overwrite; create conflict report |
| mixed-purpose file | do not split without user approval |
| duplicate concept | keep both files and report |
| deleted source file | only delete after destination exists and content matches |
| merged source file | only delete after merge verification passes |
| broad rewrite request | stop and create a new spec |

## Validation

After each batch:

```bash
bash agent/skills/obsidian-fix-format/fix.sh --check project-structure
bash agent/skills/obsidian-fix-format/fix.sh --check obsidian-contract
```

Before commit:

```bash
bash -n agent/skills/obsidian-fix-format/fix.sh
git diff --check
```

Expected batch result:

| Check | Expected |
|-------|----------|
| `project-structure` count | decreases after each move batch |
| `project.root-role-mismatch` | reaches 0 for migrated projects |
| `project.root-legacy-hub` | reaches 0 only when hubs are merged or reclassified |
| `obsidian-contract` | no new `links.private-pr-url` or inline accidental tag hits |

## Completion Criteria

| Criterion | Required |
|-----------|----------|
| root project files | only `README.md` and approved temporary legacy hubs remain |
| role folders | contain files matching their `type/...` tags |
| README files | exist for touched project roots and durable role folders |
| validator | `project-structure` reports 0 for migrated project set |
| report | skipped files list includes reason and next action |

## Required Reports

| Report | Required fields |
|--------|-----------------|
| move manifest | `old_path`, `new_path`, `type_tag`, `reason`, `source_sha256` |
| skipped files | `path`, `reason`, `next_action` |
| legacy hub decisions | `path`, `classification`, `action`, `verification` |
| link repair | `source_file`, `old_target`, `new_target`, `status` |

## Execution Log

| Date | Action | Result |
|------|--------|--------|
| 2026-05-17 | Created spec | Used for batch execution |
| 2026-05-17 | Batch 0 snapshot | `project-structure` 116 offenders; `obsidian-contract` 210 offenders |
| 2026-05-17 | Batch 1 manifest | 73 safe moves; 22 skipped files; 21 legacy hub decisions |
| 2026-05-17 | Batch 1 moves | 73 moved; SHA-256 verified |
| 2026-05-17 | Batch 3 README repair | 6 project README folder maps appended; 9 durable role README files created |
| 2026-05-17 | Batch 4 link repair | 21 files updated; 51 manifest-based link rewrites |
| 2026-05-17 | Post-batch validation | `project-structure` 43 offenders; `obsidian-contract` 210 offenders |
| 2026-05-17 | Remaining 43 second pass | 42 moved; 1 placeholder deleted; `project-structure` clean; `missing-readme` clean |

Reports:

| Report | Path |
|--------|------|
| move manifest | `docs/plans/reports/obsidian-project-docs-structure-migration/move-manifest.tsv` |
| skipped files | `docs/plans/reports/obsidian-project-docs-structure-migration/skipped-files.md` |
| legacy hub decisions | `docs/plans/reports/obsidian-project-docs-structure-migration/legacy-hub-decisions.md` |
| move verification | `docs/plans/reports/obsidian-project-docs-structure-migration/move-verification.md` |
| README repair | `docs/plans/reports/obsidian-project-docs-structure-migration/readme-repair.md` |
| link repair | `docs/plans/reports/obsidian-project-docs-structure-migration/link-repair.md` |
| remaining 43 actions | `docs/plans/reports/obsidian-project-docs-structure-migration/remaining-43-actions.tsv` |
| remaining 43 link repair | `docs/plans/reports/obsidian-project-docs-structure-migration/remaining-43-link-repair.md` |
