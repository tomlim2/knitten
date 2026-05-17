---
status: implemented
created: 2026-05-17
updated: 2026-05-17
owner: agent-hub
---

# Obsidian Contract Cleanup Batch

## Purpose

Reduce `obsidian-contract` offenders after project-root structure cleanup.

Input snapshot: `docs/plans/reports/obsidian-contract-cleanup/snapshot.md`.

## Current State

`obsidian-fix-format --check obsidian-contract` reports:

| Code | Count |
|------|-------|
| `h1.title.mismatch` | 92 |
| `tags.too-many` | 34 |
| `tags.project.count` | 22 |
| `h1.count` | 19 |
| `tags.type.count` | 17 |
| `links.external-in-devlog` | 9 |
| `frontmatter.title.missing` | 1 |

## Cleanup Principle

Use mechanical fixes only when the document already contains enough evidence.

| Issue | Safe action |
|-------|-------------|
| `h1.title.mismatch` | set frontmatter `title` to the single existing H1 |
| `frontmatter.title.missing` | set `title` to the single existing H1 |
| `tags.too-many` | reduce optional tags only when required slots stay valid and body evidence is weak |
| `tags.type.count` | choose one type only when folder path decides it |
| `tags.project.count` | choose one project only when folder path decides it |
| `h1.count` | demote secondary H1 headings to H2 only when the first H1 is the document title |
| `links.external-in-devlog` | move external URL references out of devlog only when target note exists; otherwise leave for manual pass |

## Folder-Derived Tag Rules

Apply folder-derived tags only when the corresponding slot is invalid:

| Slot | Apply when |
|------|------------|
| `type/...` | zero type tags or multiple type tags |
| `project/...` | zero project tags or multiple project tags |

Do not replace an existing single valid `type/...` or `project/...` tag.

| Path pattern | Type tag |
|--------------|----------|
| `projects/<project>/days/**` | `type/devlog` |
| `projects/<project>/learnings/**` | `type/learning` |
| `projects/<project>/topics/**` | `type/reference` unless existing single type is `type/analysis` |
| `projects/<project>/specs/**` | `type/spec` |
| `projects/<project>/plans/**` | `type/plan` |
| `projects/<project>/decisions/**` | `type/decision` |
| `projects/<project>/ops/**` | `type/reference` |
| `learnings/**` | `type/learning` |
| `daily-summaries/**` | `type/devlog` |

| Path pattern | Project tag |
|--------------|-------------|
| `projects/<project>/**` | `project/<project>` except known alias table below |
| `learnings/projects/<name>.md` | derive from `<name>` if it matches a project; else `project/agent-hub` |
| `learnings/learning-*.md` | keep existing single project; if missing use `project/agent-hub` |
| `daily-summaries/**` | keep existing single project; if missing use `project/agent-hub` |

Project alias table:

| Folder | Project tag |
|--------|-------------|
| `mmd-player-anju` | `project/mmd-anju` |
| `job-search-2026` | `project/job-search` |
| `cinev-studio` | `project/cinev` |

## Tag Reduction Rules

Required order:

1. Keep exactly one `type/...`.
2. Keep exactly one `project/...`.
3. Keep at most one `lang/...`.
4. Keep at most one `lib/...`.
5. Keep at most one `area/...`.
6. Keep `status/...` only when frontmatter or body states active status.

Remove lower-priority optional tags when tag count exceeds 5:

| Remove first | Reason |
|--------------|--------|
| duplicate type/project tags | violates slot contract |
| `fmt/...` | format is lower signal than folder/type |
| second `area/...` | one semantic area per note |
| second `lang/...` or `lib/...` | one code stack marker is enough for vault scan |

## Manual Deferrals

Do not edit automatically when:

| Case | Reason |
|------|--------|
| no H1 exists | author must choose title |
| first H1 is generic and later H1 looks like content title | unclear title |
| multiple project tags and path is not under `projects/<project>/` | no folder evidence |
| multiple type tags and folder path does not decide type | no folder evidence |
| external URL in devlog has no obvious reference-note destination | preserve information |

## Execution Batches

### Batch 1 — H1/Title

1. For files with exactly one H1 and missing/mismatched title, set frontmatter `title` to the H1.
2. Do not rewrite body content.

### Batch 2 — Folder-Derived Tags

1. Apply folder-derived type/project rules only to invalid slots.
2. Remove duplicate `type/...` and `project/...` tags.
3. Preserve optional tags unless count stays above 5.

### Batch 3 — Secondary H1 Demotion

1. For files with multiple H1s, keep the first H1.
2. Demote later `# ` headings to `## `.
3. Set frontmatter `title` to the kept H1 after demotion.
4. Do not demote if first H1 is missing or empty.

### Batch 4 — Optional Tag Trim

1. Apply tag reduction rules to files still above 5 tags.
2. Produce before/after tag report.
3. Leave files above 5 tags when all tags are required slots or body evidence is ambiguous.

## Reports

| Report | Fields |
|--------|--------|
| snapshot | `file`, `issues`, `title`, `h1s`, `tags` |
| action log | `file`, `action`, `before`, `after` |
| deferred | `file`, `reason`, `next_action` |

## Validation

Run after each batch:

```bash
bash agent/skills/obsidian-fix-format/fix.sh --check obsidian-contract
```

Before final report:

```bash
bash agent/skills/obsidian-fix-format/fix.sh --check project-structure
bash agent/skills/obsidian-fix-format/fix.sh --check missing-readme
bash -n agent/skills/obsidian-fix-format/fix.sh
git diff --check
```

## Completion Criteria

| Criterion | Required |
|-----------|----------|
| `project-structure` | clean |
| `missing-readme` | clean |
| `obsidian-contract` | count decreases |
| reports | action log and deferred list exist |
| content safety | no body prose is deleted |

## Execution Log

| Date | Action | Result |
|------|--------|--------|
| 2026-05-17 | Created spec | Pending cold-start review |
| 2026-05-17 | Cold-start patch | Limited folder-derived tags to invalid slots; required title sync after H1 demotion |
| 2026-05-17 | Batch cleanup | 156 files changed; 4 files deferred in first pass |
| 2026-05-17 | Second pass | 21 files corrected after frontmatter newline repair |
| 2026-05-17 | External devlog links | 20 markdown external links converted to plain repo/PR/path text |
| 2026-05-17 | Validation | `obsidian-contract` clean; `project-structure` clean; `missing-readme` clean |

Reports:

| Report | Path |
|--------|------|
| snapshot | `docs/plans/reports/obsidian-contract-cleanup/snapshot.md` |
| action log | `docs/plans/reports/obsidian-contract-cleanup/action-log.md` |
| deferred | `docs/plans/reports/obsidian-contract-cleanup/deferred.md` |
| second pass | `docs/plans/reports/obsidian-contract-cleanup/second-pass-action-log.md` |
| external devlog links | `docs/plans/reports/obsidian-contract-cleanup/external-devlog-link-repair.md` |
