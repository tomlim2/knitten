---
status: implemented
created: 2026-05-17
updated: 2026-05-17
owner: agent-hub
---

# Obsidian Remaining 43 Review

## Purpose

Classify the 43 remaining `project-structure` offenders after the first project-docs migration batch.

Input report: `obsidian-fix-format --check project-structure`.

## Pattern Summary

| Pattern | Count | Decision |
|---------|-------|----------|
| `_cross-project` learning buckets | 7 | move out of `projects/`; use top-level `learnings/` or `learnings/projects/` |
| mission control docs | 3 | move to `ops/missions/<mission>/` |
| legacy dated devlog aggregates | 9 | split dated sections or move status board to `ops/`; do not auto-move as one day |
| learning index hubs | 4 | merge into role README or delete if empty |
| ambiguous CINEV domain notes | 5 | remove extra `type/...`; route to `topics/` or `learnings/` |
| job-search profile/research/spec corpus | 9 | route profiles/research to `topics/`, spec to `specs/`, status board to `ops/` |
| portfolio case-study records | 2 | move to `topics/portfolio-record.md` |
| project hub devlog | 1 | merge into project `README.md` |
| reference still in root | 1 | move to `topics/` |
| Shotloom root leftovers | 2 | split devlog to `days/`; delete empty learning index |

## Structure Additions

No new canonical role folder is required.

| Need | Existing role |
|------|---------------|
| profile/career documents | `topics/` |
| case-study records | `topics/` |
| mutable project status boards | `ops/missions/` |
| mission timelines/logs | `ops/missions/<mission>/` |
| cross-project lessons | top-level `learnings/` or `learnings/projects/` |

## Delete Candidates

| File | Action | Reason |
|------|--------|--------|
| `projects/shotloom/learnings-index.md` | delete | empty placeholder: only section headings, no content |
| `projects/krafton-hackathon/learnings-index.md` | merge links into `README.md`, then delete | link hub only; no durable body |
| `projects/bevy-vrm/learnings-index.md` | merge index links into `learnings/README.md`, then delete | large aggregate overlaps moved individual learning notes |
| `projects/mmd-player-anju/learnings-index.md` | merge index links into `learnings/README.md`, then delete | large aggregate overlaps moved individual learning notes |

Delete only after inbound links are repaired.

## Move Plan

### Cross-Project

| File | Proposed destination | Tag change |
|------|----------------------|------------|
| `projects/_cross-project/_glossary.md` | `learnings/projects/graphics-glossary.md` | keep `type/learning`; optionally change to `type/glossary` in later taxonomy pass |
| `projects/_cross-project/agent-hub.md` | `learnings/projects/agent-hub.md` | keep `type/learning` |
| `projects/_cross-project/general.md` | `learnings/learning-general-agent-ops.md` | keep `type/learning` |
| `projects/_cross-project/graphics.md` | `learnings/projects/graphics.md` | keep `type/learning` |
| `projects/_cross-project/slack.md` | `learnings/learning-slack-integration.md` | keep `type/learning` |
| `projects/_cross-project/unreal.md` | `learnings/projects/unreal.md` | keep `type/learning` |
| `projects/_cross-project/web3d.md` | `learnings/projects/web3d.md` | keep `type/learning` |

### Bevy VRM

| File | Proposed action |
|------|-----------------|
| `projects/bevy-vrm/briefing.md` | move to `projects/bevy-vrm/ops/missions/vrm2u-retarget-metahuman/briefing.md` |
| `projects/bevy-vrm/log.md` | move to `projects/bevy-vrm/ops/missions/vrm2u-retarget-metahuman/log.md` |
| `projects/bevy-vrm/timeline.md` | move to `projects/bevy-vrm/ops/missions/vrm2u-retarget-metahuman/timeline.md` |
| `projects/bevy-vrm/devlog.md` | split dated sections into `days/`; merge overview/TODO into `README.md` |
| `projects/bevy-vrm/experiments-log.md` | split experiment entries by date under `days/YYYY-MM-DD/<experiment>.md` or move as `topics/experiments-log.md` with `type/reference` |
| `projects/bevy-vrm/todo-scoring.md` | move to `plans/scoring-system.md`; change tag to `type/plan` |
| `projects/bevy-vrm/learnings-index.md` | merge to `learnings/README.md`, repair links, delete |
| `projects/bevy-vrm/idea-portfolio-retarget-ai-dev.md` | move to `topics/portfolio-retarget-ai-dev.md`; change tag to `type/note` only if taxonomy allows, else `type/reference` |
| `projects/bevy-vrm/shoulder-slerp-experiment.md` | move to `topics/shoulder-slerp-experiment.md`; change tag to `type/analysis` or keep `type/experiment` after validator support |

### CINEV Studio

| File | Proposed destination | Tag change |
|------|----------------------|------------|
| `projects/cinev-studio/character-system-interview.md` | `topics/character-system-interview.md` | remove extra `project/job-search`; keep or normalize `type/note` |
| `projects/cinev-studio/learnings.md` | `learnings/cinev-studio.md` | remove `type/review` |
| `projects/cinev-studio/pmx2vrm.md` | `topics/pmx2vrm.md` | use `type/reference`; remove `type/learning`, `type/review` |
| `projects/cinev-studio/ta-154-capacity-reduction.md` | `learnings/ta-154-capacity-reduction.md` | remove `type/review` |
| `projects/cinev-studio/vrm-duplicate-texture-name.md` | `learnings/vrm-duplicate-texture-name.md` | remove `type/review` |
| `projects/cinev-studio/vrm4u.md` | `topics/vrm4u.md` | use `type/reference`; remove `type/learning`, `type/review` |

### Job Search

| File | Proposed destination | Reason |
|------|----------------------|--------|
| `projects/job-search-2026/Technical_Artist_Portfolio_3Year.md` | `topics/technical-artist-portfolio-3year.md` | profile/case-study reference |
| `projects/job-search-2026/application-status.md` | `ops/missions/job-search/application-status.md` | mutable status board |
| `projects/job-search-2026/career-history.md` | `topics/career-history.md` | profile reference |
| `projects/job-search-2026/career-insights-cross-analysis.md` | `topics/career-insights-cross-analysis.md` | analysis |
| `projects/job-search-2026/cinev-role-summary.md` | `topics/cinev-role-summary.md` | profile reference |
| `projects/job-search-2026/cinnamon-company-research.md` | `topics/cinnamon-company-research.md` | research reference |
| `projects/job-search-2026/flfi-role-summary.md` | `topics/flfi-role-summary.md` | profile reference |
| `projects/job-search-2026/korean-ta-market-research.md` | `topics/korean-ta-market-research.md` | research reference |
| `projects/job-search-2026/portfolio-interview-2026-03-09.md` | `topics/portfolio-interview-2026-03-09.md` | interview note |
| `projects/job-search-2026/ta-portfolio-website-spec.md` | `specs/ta-portfolio-website-spec.md` | durable spec |
| `projects/job-search-2026/varo-role-summary.md` | `topics/varo-role-summary.md` | profile reference |

### Other Projects

| File | Proposed action |
|------|-----------------|
| `projects/krafton-hackathon/devlog.md` | split Day 1 section to `days/2026-03-28.md`; move lessons to `learnings/`; remove extra `type/learning` |
| `projects/krafton-hackathon/learnings-index.md` | merge links into `learnings/README.md` or project `README.md`, then delete |
| `projects/matcap-painter/record.md` | move to `topics/portfolio-record.md`; change tag to `type/reference` |
| `projects/megamelange/record.md` | move to `topics/portfolio-record.md`; change tag to `type/reference` |
| `projects/mmd-player-anju/devlog.md` | split dated sections into `days/YYYY-MM-DD.md` files |
| `projects/mmd-player-anju/learnings-index.md` | merge links into `learnings/README.md`, then delete |
| `projects/mmd-player-anju/model-families.md` | move to `topics/model-families.md` |
| `projects/project-weekend/devlog.md` | merge hub content into `README.md`; split dated progress only if present |
| `projects/shotloom/devlog.md` | split Day sections into `days/YYYY-MM-DD.md`; remove extra `type/reference` |
| `projects/shotloom/learnings-index.md` | delete after confirming no inbound links; empty placeholder |

## Execution Order

1. Delete/merge empty link hubs after inbound-link scan.
2. Move mission control docs to `ops/missions/`.
3. Normalize ambiguous multiple-type notes.
4. Move job-search profile/research/spec corpus.
5. Split large devlog aggregates into dated notes.
6. Move `_cross-project` after deciding whether top-level `learnings/projects/` remains canonical.

## Execution Log

| Date | Action | Result |
|------|--------|--------|
| 2026-05-17 | Second-pass moves | 42 files moved out of project roots |
| 2026-05-17 | Placeholder deletion | `projects/shotloom/learnings-index.md` deleted |
| 2026-05-17 | Link repair | 42 files updated; 73 manifest-based link rewrites |
| 2026-05-17 | README repair | 5 missing durable-folder README files created |
| 2026-05-17 | Validation | `project-structure` clean; `missing-readme` clean |

Reports:

| Report | Path |
|--------|------|
| actions | `docs/plans/reports/obsidian-project-docs-structure-migration/remaining-43-actions.tsv` |
| link repair | `docs/plans/reports/obsidian-project-docs-structure-migration/remaining-43-link-repair.md` |

## Open Decisions

| Decision | Options | Recommended |
|----------|---------|-------------|
| cross-project destination | top-level `learnings/` vs `learnings/projects/` | use existing `learnings/projects/` for project/domain buckets |
| `type/profile` handling | keep in `topics/` vs add `profiles/` role | keep in `topics/` |
| `type/experiment` handling | keep in `topics/` vs add `experiments/` role | keep in `topics/` |
| large legacy devlogs | split now vs archive as one file under `topics/` | split only high-value current projects; archive stale ones as `topics/legacy-devlog.md` |
