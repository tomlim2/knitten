---
status: proposed
created: 2026-05-17
updated: 2026-05-17
owner: caol-ila
---

# Obsidian Root Projects Daily Migration

## Purpose

Remove the Obsidian `agent/` content wrapper and migrate the vault to two user-facing root folders:

```text
projects/
daily/
```

System folders stay outside this contract:

| Folder | Status | Reason |
|--------|--------|--------|
| `.obsidian/` | keep | Obsidian runtime config |
| `.trash/` | keep | Obsidian trash |
| `.claude/` | review/delete separately | legacy runtime artifact, not note taxonomy |
| `attachments/` | keep or move in separate asset spec | binary assets need Obsidian setting review |

## Current Root Shape

Vault root: `/Users/younsoolim/Library/Mobile Documents/iCloud~md~obsidian/Documents/MyNotes`

| Root entry | Markdown files | Current role |
|------------|----------------|--------------|
| `agent/` | 454 | agent-authored docs wrapper |
| `notes/` | 227 | mixed personal/work/reference/journal |
| `tutoring/` | 7 | tutoring project docs |
| `drinks/` | 4 | personal hobby project docs |
| `references/` | 6 | mixed reference notes |
| `consulting/` | 1 | consulting project docs |
| `CLAUDE.md` | 1 | legacy entry/helper |
| `LOOKUP.md` | 1 | vault index |

Inside `agent/`:

| Folder | Markdown files | Target |
|--------|----------------|--------|
| `agent/projects/` | 405 | `projects/` |
| `agent/daily-summaries/` | 6 | `daily/` |
| `agent/learnings/` | 25 | `projects/<project>/learnings/` or `projects/caol-ila/learnings/` |
| `agent/research/` | 9 | `projects/<project>/topics/` |
| `agent/specs/` | 9 | `projects/<project>/specs/` or `projects/caol-ila/specs/` |

## Target Shape

```text
MyNotes/
  projects/
    <project>/
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
  daily/
    YYYY-MM-DD.md
```

Do not keep root note categories such as `notes/`, `research/`, `specs/`, `learnings/`, `drinks/`, `tutoring/`, or `consulting/` after migration.

## Meaning Of Project

`projects/` means any durable subject area, not only company software projects.

| Input | Target project |
|-------|----------------|
| work project | `projects/<work-project>/` |
| personal hobby | `projects/<hobby>/` |
| tutoring | `projects/tutoring/` |
| consulting | `projects/consulting/` |
| drinks | `projects/drinks/` |
| language learning | `projects/language-learning/` |
| career/job search | `projects/job-search-2026/` |
| personal evergreen notes | `projects/personal/` |
| AI/automation/backend/rendering topic buckets | `projects/<topic>/` or `projects/personal/topics/` by tag evidence |

`daily/` means date-owned notes whose primary retrieval key is the day.

## Routing Rules

### Agent Wrapper

| Source | Destination |
|--------|-------------|
| `agent/projects/<project>/...` | `projects/<project>/...` |
| `agent/daily-summaries/YYYY-MM-DD.md` | `daily/YYYY-MM-DD.md` |
| `agent/learnings/learning-<slug>.md` | `projects/caol-ila/learnings/<slug>.md` unless project tag says otherwise |
| `agent/learnings/projects/<name>.md` | `projects/<mapped-project>/learnings/<name>.md` |
| `agent/research/<slug>.md` | `projects/<project-from-tag>/topics/<slug>.md` |
| `agent/specs/<slug>.md` | `projects/<project-from-tag>/specs/<slug>.md` |
| `agent/specs/mmd-formats/<slug>.md` | `projects/mmd-player-anju/specs/<slug>.md` or `projects/mmd-formats/specs/<slug>.md` after project decision |

### Existing Root Folders

| Source | Destination |
|--------|-------------|
| `drinks/*.md` | `projects/drinks/topics/*.md` or `projects/drinks/learnings/*.md` by `type/...` |
| `tutoring/consultations/*.md` | `projects/tutoring/topics/consultations/*.md` |
| `tutoring/lessons/<student>/*.md` | `projects/tutoring/days/YYYY-MM-DD/<slug>.md` |
| `consulting/*.md` | `projects/consulting/topics/*.md` |
| `references/*.md` | `projects/<project-from-tag>/topics/*.md` |
| `references/language/*.md` | `projects/language-learning/topics/*.md` |
| `references/image-prompts/*.md` | `projects/image-prompts/topics/*.md` or `projects/personal/topics/image-prompts/*.md` |
| `notes/journal/**/YYYY-MM-DD.md` | `daily/YYYY-MM-DD.md` unless duplicate exists |
| `notes/<topic>/*.md` | `projects/<project-from-tag-or-folder>/topics/*.md` |
| `notes/work/*.md` | `projects/cinev-studio/topics/*.md` when `project/cinev`; else project tag decides |
| `notes/archive/*.md` | `projects/personal/topics/archive-<slug>.md` unless tag says otherwise |

### Root Files

| Source | Destination |
|--------|-------------|
| `LOOKUP.md` | `projects/personal/topics/vault-lookup.md` or regenerate after migration |
| `CLAUDE.md` | delete if obsolete; else `projects/caol-ila/topics/legacy-claude-entry.md` |
| `.vault-catalog.json` | regenerate after migration or delete if stale |
| `contexts.json` | `projects/caol-ila/topics/legacy-contexts.json` only if still used; else delete |

## Config Changes

Do not let skills, validators, rules, or standards own literal vault paths after this migration. They may show short examples, but executable routing must read from config.

### Path Config Ownership

| Owner | Role |
|-------|------|
| `agent/private/caol-config/machine-paths.json` | machine-local absolute roots only |
| `agent/private/caol-config/doc-paths.json` | purpose-to-destination routing templates |
| `agent/private/caol-config/vault-structure.json` | vault folder constants, allowed project role folders, legacy-folder denylist |
| `agent/skills/caol-resolve-doc-path/resolve.sh` | only supported resolver for write destinations |
| `agent/skills/obsidian-fix-format/fix.sh` | validation consumer of `vault-structure.json`; no embedded project-root path literals |

Proposed `vault-structure.json`:

```json
{
  "version": 1,
  "rootFolders": {
    "projects": "projects",
    "daily": "daily",
    "attachments": "attachments"
  },
  "projectRoleFolders": [
    "days",
    "learnings",
    "topics",
    "specs",
    "plans",
    "decisions",
    "asks",
    "ops/missions",
    "ops/runs"
  ],
  "legacyVaultFolders": [
    "agent",
    "notes",
    "daily-summaries",
    "learnings",
    "research",
    "specs",
    "drinks",
    "tutoring",
    "consulting",
    "references"
  ],
  "systemFolders": [
    ".obsidian",
    ".trash",
    "attachments"
  ]
}
```

`doc-paths.json` owns destination path templates as config constants. Active code must not duplicate those templates. `vault-structure.json` owns folder vocabulary. The resolver must expose this structure to callers before vault moves start, so scripts do not re-embed `projects`, `daily`, role folders, or legacy denylist values.

| File | Change |
|------|--------|
| `agent/private/caol-config/machine-paths.json` | keep `obsidian` as vault root; remove runtime reliance on `obsidian-agent-root` and `obsidian-vault-claude` |
| `agent/private/caol-config/doc-paths.json` | remove `agent/` prefix from all Obsidian destinations; route purpose templates to `projects/`, `daily/`, or `projects/<project>/<role>` |
| `agent/private/caol-config/vault-structure.json` | add vault root/role/legacy folder constants |
| `agent/skills/caol-resolve-doc-path/resolve.sh` | keep resolving through `obsidian`; add `structure` mode for config consumers |
| `agent/skills/obsidian-fix-format/fix.sh` | read `vault-structure.json`; scan root-level `projects/` and `daily/` |
| `agent/skills/obsidian-obsidian-markdown/references/PROJECT-DOCS-STRUCTURE.md` | replace `agent/projects/<project>/` with `projects/<project>/` |
| `agent/rules/obsidian.md` | replace agent-root wording with vault-root `projects/` and `daily/` wording |
| `agent/rules/doc-write.md` | update day log path to `daily/YYYY-MM-DD.md` for global daily; project day logs stay under `projects/<project>/days/` |
| `agent/skills/learn-log-day/SKILL.md` | route through updated resolver; do not hardcode `agent/` |
| `agent/skills/dev-setup-project/SKILL.md` | create project under `projects/<project>/` |

### Hardcoded Path Cleanup Scope

Current active scan found these cleanup families:

| Family | Examples | Required action |
|--------|----------|-----------------|
| config templates | `doc-paths.json`, `machine-paths.json`, `machine-paths.template.json` | replace legacy vault wrapper keys and path templates |
| validators | `obsidian-fix-format/fix.sh` | derive root folders and role folders from `vault-structure.json` |
| Obsidian policy docs | `agent/rules/obsidian.md`, `agent/standards/policy/naming.md`, `llm-first-docs.md` | update examples and binding rules to root `projects/` and `daily/` |
| Obsidian markdown references | `PROJECT-DOCS-STRUCTURE.md`, `OBSIDIAN-FORMAT.md`, `VAULT-AUDIENCE.md`, inspection checklist | replace path contract wording |
| logging/archive skills | `learn-log-day`, `learn-archive-week`, `learn-log-vocab`, `caol-log-postmortem` | call resolver or read config instead of embedding vault folders |
| domain log skills | `tutoring-log-*`, `consulting-log-session`, `drink-log-entry` | route through project purposes such as `projects/tutoring`, `projects/consulting`, `projects/drinks` |
| dashboard/tools | `caol-hq` path helpers and widgets | prefer `obsidian` plus config; remove `obsidian-agent-root` UI assumptions |
| Shotloom/deploy references | `shotloom-*` skills that read `obsidian-vault-claude` | use resolver or `obsidian` root fallback |
| historical plans/reports | old `docs/plans/**` | leave as history unless they are active execution specs |

Add a config drift validator:

```bash
rg -n "agent/projects|agent/learnings|agent/research|agent/specs|daily-summaries|obsidian-agent-root|obsidian-vault-claude|obsidian:agent|staging:agent" \
  agent scripts AGENTS.md SYSTEM.md README.md AGENT-HUB.md \
  --glob '!agent/projects/**' \
  --glob '!agent/tasks/**' \
  --glob '!agent/cache/**' \
  --glob '!agent/file-history/**'
```

The validator allows:

| Allowed location | Reason |
|------------------|--------|
| `agent/private/caol-config/vault-structure.json` | owns legacy denylist values until migration completes |
| `docs/plans/**` historical plans | immutable migration history |
| `agent/history.jsonl` | runtime history |
| comments marked `legacy compatibility` | temporary bridge until all callers are patched |

The validator fails for active skills, rules, standards, scripts, and config after migration.

### Proposed `doc-paths.json` Routing

| Purpose | Destination |
|---------|-------------|
| `devlog` | `obsidian:projects/{project}/days` |
| `learning` | `obsidian:projects/{project}/learnings` |
| `topic` | `obsidian:projects/{project}/topics` |
| `research` | `obsidian:projects/caol-ila/topics` until project tag routing exists |
| `notes` | `obsidian:projects/personal/topics` |
| `consulting` | `obsidian:projects/consulting/topics` |
| `tutoring` | `obsidian:projects/tutoring` |
| `drinks` | `obsidian:projects/drinks` |
| `postmortem` | `obsidian:projects/records/topics` |
| `vocab` | `obsidian:projects/language-learning/topics` |
| `experiment` | `obsidian:projects/{project}/learnings` or `obsidian:projects/{project}/days` by caller type |
| `spec` | `obsidian:projects/caol-ila/specs` |
| `cross-learning` | `obsidian:projects/caol-ila/learnings` |
| `daily` | `obsidian:daily` |

## Migration Batches

### Batch 0 — Snapshot

Create reports before moving:

| Report | Content |
|--------|---------|
| root inventory | root entries, file counts, directory counts |
| move manifest | `old_path`, `new_path`, `reason`, `source_sha256` |
| conflict report | destination exists, basename collision, duplicate date |
| link inventory | wikilinks and markdown links pointing at moved paths |
| config reference report | repo files containing `agent/projects`, `agent/learnings`, `daily-summaries`, `obsidian-agent-root` |

### Batch 1 — Prepare Target Roots

1. Create `projects/` if missing.
2. Create `daily/` if missing.
3. Do not delete source folders.
4. Create `projects/README.md` only if a vault-level project index is useful.

### Batch 1.5 — Centralize Path Constants

1. Add `agent/private/caol-config/vault-structure.json`.
2. Patch `doc-paths.json` to root-level destinations.
3. Patch resolver and validators to consume config-owned paths.
4. Patch active skills/rules/standards that embed old vault folders.
5. Run config drift scan before moving any vault files.

### Batch 2 — Move `agent/projects`

1. Move each `agent/projects/<project>/` to `projects/<project>/`.
2. If destination project exists, merge by subfolder.
3. Do not overwrite files.
4. Write conflict report for every duplicate path.

### Batch 3 — Move `agent/daily-summaries`

1. Move to `daily/YYYY-MM-DD.md`.
2. If `daily/YYYY-MM-DD.md` exists, compare SHA-256.
3. If content differs, move to `daily/YYYY-MM-DD/<slug>.md` or report conflict.

### Batch 4 — Move `agent/learnings`, `agent/research`, `agent/specs`

1. Use frontmatter `project/...` tag to choose project.
2. Use frontmatter `type/...` and current folder to choose role folder.
3. Preserve files with ambiguous or missing project tags in conflict report.

### Batch 5 — Move Non-Agent Root Folders

Move these after `agent/` is empty:

| Source | Primary target |
|--------|----------------|
| `drinks/` | `projects/drinks/` |
| `tutoring/` | `projects/tutoring/` |
| `consulting/` | `projects/consulting/` |
| `references/` | project-specific `topics/` |
| `notes/` | project-specific `topics/`, `learnings/`, or `daily/` |

### Batch 6 — Link Repair

1. Use move manifest only.
2. Update exact path wikilinks.
3. Update unique basename wikilinks only when source and target project match or basename is globally unique.
4. Update Obsidian URIs.
5. Do not infer moves from current filesystem state.

### Batch 7 — Config And Validator Patch

1. Verify `Batch 1.5` changes still match the final move manifest.
2. Patch any remaining skill/rule references found after moves.
3. Patch validators for final root shape if migration revealed additional cases.
4. Run validators.

### Batch 8 — Delete Empty Legacy Folders

Delete only when all conditions pass:

| Folder | Delete when |
|--------|-------------|
| `agent/` | empty after move and config no longer points to it |
| `daily-summaries/` | empty |
| `learnings/` | empty |
| `research/` | empty |
| `specs/` | empty |
| `notes/` | empty |
| `drinks/` | empty |
| `tutoring/` | empty |
| `consulting/` | empty |

## Safety Rules

| Risk | Rule |
|------|------|
| iCloud sync | write manifest first; move in batches; verify counts after each batch |
| duplicate destination | never overwrite; report conflict |
| broken wikilinks | repair from manifest; run link inventory after repair |
| stale generated catalog | regenerate `.vault-catalog.json` or delete if owner is unknown |
| config drift | patch config in repo and deployed `~/.claude/private/caol-config/` together |
| attachment breakage | do not move `attachments/` in this spec |
| hidden Obsidian state | do not edit `.obsidian/` in this spec |

## Validators

Run after each batch:

```bash
bash agent/skills/obsidian-fix-format/fix.sh --check project-structure
bash agent/skills/obsidian-fix-format/fix.sh --check missing-readme
bash agent/skills/obsidian-fix-format/fix.sh --check obsidian-contract
```

Add or update validators:

| Validator | Required behavior |
|-----------|-------------------|
| `root-structure` | reports root note folders outside `projects/`, `daily/`, system folders |
| `project-structure` | scans `{vault}/projects/*` |
| `daily-structure` | reports non-date files under `daily/` |
| `path-config-drift` | reports active files that embed old vault paths or retired machine keys |

Before commit:

```bash
bash -n agent/skills/obsidian-fix-format/fix.sh
git diff --check
```

## Completion Criteria

| Criterion | Required |
|-----------|----------|
| root folders | only `projects/`, `daily/`, and system/support folders remain |
| `agent/` | absent or empty and not referenced by config |
| doc resolver | new writes land under root `projects/` or `daily/` |
| path constants | active code reads `doc-paths.json` or `vault-structure.json` instead of embedding old vault folders |
| validators | `root-structure`, `project-structure`, `daily-structure`, `missing-readme`, `obsidian-contract` pass |
| reports | manifest, conflicts, link repair, config patch report exist |
| git | caol-ila config/spec/validator changes committed after vault migration validates |

## Open Decisions

| Decision | Options | Recommended |
|----------|---------|-------------|
| `attachments/` | keep root support folder vs move under `projects/_assets/` | keep root support folder |
| `daily` vs project day logs | global `daily/` only vs both global and project `days/` | keep both: global daily for whole-day summaries, project days for project-bound logs |
| `CLAUDE.md` root note | delete vs archive under `projects/caol-ila/topics/` | inspect before deciding |
| `.vault-catalog.json` | regenerate vs delete | regenerate only if owner script exists; else delete stale catalog after backup |
| `contexts.json` | migrate vs delete | inspect owner; migrate to `projects/caol-ila/topics/` only if used |

## Execution Log

| Date | Action | Result |
|------|--------|--------|
| 2026-05-17 | Created spec | Pending cold-start review |
| 2026-05-17 | Added path config/constants batch | `vault-structure.json`, resolver `structure` mode, root/daily/path drift validators, and active reference cleanup implemented before vault moves |
| 2026-05-17 | Applied vault root migration | Root now contains `.obsidian/`, `.trash/`, `attachments/`, `daily/`, `projects/`; structure validators pass; note-level `obsidian-contract` cleanup remains |
