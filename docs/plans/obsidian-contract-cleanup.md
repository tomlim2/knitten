---
status: draft
created: 2026-05-16
updated: 2026-05-16
owner: caol-ila
---

# Obsidian Contract Cleanup

## Purpose

Unify Obsidian vault rules around one canonical contract and migrate existing notes progressively.

This plan follows the `MyNotes/claude` to `MyNotes/agent` path migration and fixes the remaining workflow drift in Obsidian rules, standards, and note cleanup flows.

## Decisions

| Decision | Value |
|----------|-------|
| Canonical owner | `OBSIDIAN-FORMAT.md` owns frontmatter, H1, source enum, and structure |
| Review owner | `NOTE-INSPECTION-CHECKLIST.md` owns inspection procedure only |
| Tag owner | `TAG-TAXONOMY.md` owns tag axes and tag inventory |
| Audience owner | `VAULT-AUDIENCE.md` owns folder style and mutability |
| Required frontmatter | `title`, `tags`, `date`, `source` |
| Type encoding | `type/...` tag; no top-level `type:` field |
| Required tags | exactly one `type/...`, exactly one `project/...` |
| Default source | `agent` |
| Source enum | `agent`, `manual`, `notion-export`, `codex`, `claude-code` |
| Migration mode | touch-on-edit for old notes; targeted batches for known structural bugs |
| README requirement | new project roots and durable folders only |

## Problem

Current active Obsidian docs disagree:

| Surface | Current drift |
|---------|---------------|
| `rules/obsidian.md` | requires `title`, `tags`, `date`, `source` |
| `OBSIDIAN-FORMAT.md` | still documents `source: claude` |
| `NOTE-INSPECTION-CHECKLIST.md` | incorrectly requires top-level `type` |
| `VAULT-AUDIENCE.md` | requires README for every subfolder, too broad for current vault |

The vault also contains legacy notes that predate the current taxonomy. They should not all be rewritten in one large pass.

## Scope

| In scope | Action |
|----------|--------|
| `agent/rules/obsidian.md` | keep as compact cold-start checklist |
| `OBSIDIAN-FORMAT.md` | make canonical frontmatter and source enum explicit |
| `NOTE-INSPECTION-CHECKLIST.md` | remove top-level `type` requirement; reference `type/...` tag |
| `VAULT-AUDIENCE.md` | narrow README requirement |
| `obsidian-fix-format` | identify mechanical checks worth automating |
| existing vault notes | report and fix targeted batches only |

## Non-Goals

| Non-goal | Reason |
|----------|--------|
| Big-bang taxonomy rewrite | high churn and high judgment cost |
| Rewrite personal prose for style only | structured-narrative folders allow human recall |
| Rename every old file immediately | link churn; prefer touch-on-edit unless structure is broken |
| Remove historical `claude-code` source values | factual source remains valid for older notes |

## Target Contract

### Frontmatter

```yaml
---
title: "Document title"
tags:
  - type/reference
  - project/caol-ila
date: YYYY-MM-DD
source: agent
---
```

| Field | Rule |
|-------|------|
| `title` | required, double-quoted when generated |
| `tags` | required; includes exactly one `type/...` and one `project/...` |
| `date` | required; creation or original authoring date |
| `source` | required; enum value |

Allowed `source` values:

| Value | Use when |
|-------|----------|
| `agent` | default for agent-authored notes when harness identity is not important |
| `manual` | user-authored or manually imported notes |
| `notion-export` | imported from Notion |
| `codex` | Codex-specific note or output where harness matters |
| `claude-code` | Claude Code-specific note or output where harness matters |

### README Requirement

README required for:

| Folder type | Required? |
|-------------|-----------|
| new project root under `agent/projects/<project>/` | yes |
| durable folders: `specs/`, `plans/`, `topics/`, `decisions/`, `ops/missions/` | yes |
| repeated entry folders: `days/`, `learnings/` | no, parent README covers them |
| ephemeral folders: `ops/runs/` | no, unless promoted to durable |

## Implementation Plan

### S1 — Canonical Docs

1. Patch `OBSIDIAN-FORMAT.md`:
   - source enum uses `agent`, not `claude`
   - explicitly says no top-level `type`
   - references `TAG-TAXONOMY.md` for tag axes
2. Patch `NOTE-INSPECTION-CHECKLIST.md`:
   - frontmatter check is `title`, `tags`, `date`, `source`
   - tag check owns `type/...` and `project/...`
3. Patch `VAULT-AUDIENCE.md`:
   - narrow README requirement to new project roots and durable folders
4. Patch `rules/obsidian.md`:
   - keep only compact cold-start contract and links to owners

### S2 — Audit Report Script

Create or update a report-only audit flow:

| Bucket | Examples |
|--------|----------|
| auto-fixable | missing `source`, stale `source: claude`, no H1, nested `agent/agent` |
| needs decision | tag quality, duplicate concept, audience mismatch |
| legacy accepted | old notes with historical source or link style |
| ignore/generated | `.bak`, exports, attachments |

The report must not write unless explicitly invoked with an apply flag.

### S3 — Mechanical Fix Batch

Fix only low-risk structural issues:

| Issue | Action |
|-------|--------|
| `agent/agent/learnings/*` | move to `agent/learnings/*` |
| missing `source` where author is obvious | add `source: agent` or `source: manual` |
| `source: claude` on new agent-authored notes | change to `source: agent` |
| missing H1 with matching title | insert H1 after frontmatter |

### S4 — Progressive Migration

For older notes:

1. Apply new taxonomy when a note is edited.
2. Do not bulk rewrite narrative content.
3. Batch by folder when the user asks for cleanup.
4. Keep a short report of skipped notes and why.

## Validation

Run after doc changes:

```bash
node scripts/validate-llm-first.mjs
```

Run after vault cleanup batches:

```bash
python3 agent/skills/learn-archive-week/tag_consolidate.py
python3 agent/skills/learn-archive-week/fill_tags_from_name.py
```

Add a report-only vault audit command before large migrations.

## Completion Criteria

- Active Obsidian docs agree on the frontmatter contract.
- `source: claude` is no longer recommended for generic agent-authored notes.
- `NOTE-INSPECTION-CHECKLIST.md` no longer requires top-level `type`.
- README requirement is enforceable on new durable folders.
- Known nested `agent/agent` structure is removed.
- Validator passes.
