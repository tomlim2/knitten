---
status: implemented
created: 2026-05-16
updated: 2026-05-16
owner: agent-hub
---

# Rename Obsidian Claude Path

## Purpose

Move Obsidian agent-authored documents away from the legacy `claude` vault folder name.

Keep Claude-specific names only for the Claude Code runtime path `~/.claude`, Claude Code entry documents, and adapter mechanics.

## Problem

The Obsidian vault still stores agent-authored notes under:

```text
{obsidian-root}/claude/
```

Machine config also exposes that path as:

```text
obsidian-vault-claude
```

That name makes the vault look Claude-owned even though agent-hub now acts as an agent hub for Codex, Claude Code, and future harnesses.

## Target State

| Surface | Target |
|---------|--------|
| Vault folder | `{obsidian-root}/agent/` |
| Primary machine key | `obsidian-agent-root` |
| Legacy key | `obsidian-vault-claude` remains as fallback only |
| Generated / archived notes | Preserve content; update paths only |
| Runtime path `~/.claude` | Unchanged |

## Scope

| In scope | Examples |
|----------|----------|
| machine path config | `agent/private/agent-hub-config/machine-paths.json`, templates |
| config CRUD surface | `ah-manage-config` show/setup/add/remove docs |
| doc routing scripts | `learn-archive-week`, `tutoring-log-lesson`, doc-path resolver users |
| Obsidian rules | location wording and auto-commit path table |
| actual vault folder migration | move `MyNotes/claude` to `MyNotes/agent` when safe |
| validation docs | update this plan with execution notes |

## Non-Goals

| Non-goal | Reason |
|----------|--------|
| Rename `~/.claude` | Claude Code deploy target; not an Obsidian vault path |
| Rename `CLAUDE.md` | Entry document filename |
| Rewrite historical vault note bodies | This task targets path ownership, not note prose |
| Rename skill names containing `claude` | User-facing API compatibility needs separate decision |

## Compatibility Policy

Readers must resolve the vault path in this order:

1. `machine-paths.json["obsidian-agent-root"]`
2. fallback: `machine-paths.json["obsidian-vault-claude"]`
3. abort with clear error if neither exists

Writers should use `obsidian-agent-root` after migration.

Do not delete the legacy key in the first implementation. Keep it as an alias for one release cycle or until all call sites stop referencing it.

## Implementation Plan

### S0 — Preflight

1. Check worktree status.
2. Confirm current keys:
   - `obsidian`
   - `obsidian-vault-claude`
   - `obsidian-staging`
3. Confirm actual vault folders:
   - `{obsidian-root}/claude`
   - `{obsidian-root}/agent`
4. If both target and source exist, compare contents before moving.

### S1 — Config Keys

1. Add `obsidian-agent-root` to `machine-paths.template.json`.
2. Add `obsidian-agent-root` to local machine config.
3. Set it to `{obsidian-root}/agent`.
4. Keep `obsidian-vault-claude` as an alias to `obsidian-agent-root` until all legacy call sites are gone.

### S1.5 — Config CRUD Surface

1. Update `ah-manage-config show` examples to display `obsidian-agent-root`.
2. Update setup key list so new machines ask for `obsidian-agent-root`.
3. Mark `obsidian-vault-claude` as legacy fallback, not the primary Obsidian docs key.
4. Leave add/remove mechanics unchanged; they already accept arbitrary machine keys.

### S2 — Script Resolution

Patch scripts to prefer `obsidian-agent-root`:

| File | Change |
|------|--------|
| `learn-archive-week/archive.py` | resolve primary key, fallback legacy |
| `learn-archive-week/tag_consolidate.py` | scan from agent root or parent as needed |
| `learn-archive-week/fill_tags_from_name.py` | remove legacy parent workaround |
| `tutoring-log-lesson/utils.py` | prefer new key |
| `learn-archive-week/SKILL.md` | update docs and permission note |
| `agent/rules/obsidian.md` | use `agent-authored docs`, not legacy folder wording |

### S3 — Vault Folder Migration

1. If `{obsidian-root}/agent` does not exist:
   - move `{obsidian-root}/claude` to `{obsidian-root}/agent`
2. If both exist:
   - dry-run compare file lists
   - move only non-conflicting paths
   - report conflicts for manual decision
3. Leave `{obsidian-root}/claude` absent or empty after migration.

### S4 — Residual Search

Run:

```bash
rg -n "obsidian-vault-claude|/claude|claude/" \
  agent docs scripts \
  --glob '!agent/projects/**' \
  --glob '!agent/file-history/**' \
  --glob '!agent/cache/**' \
  --glob '!agent/plugins/**'
```

Allowed residuals:

| Class | Allowed |
|-------|---------|
| fallback key support | yes |
| historical docs | yes |
| Claude Code runtime path `~/.claude` | yes |
| active Obsidian storage path | no |

### S5 — Validation

Run:

```bash
node scripts/validate-llm-first.mjs
python3 agent/skills/learn-archive-week/archive.py --dry-run
python3 agent/skills/learn-archive-week/tag_consolidate.py
python3 agent/skills/learn-archive-week/fill_tags_from_name.py
```

Expected:

| Check | Expected |
|-------|----------|
| validator | pass |
| archive dry-run | resolves target under `{obsidian-root}/agent` |
| tag scripts | scan expected vault files |
| staging | no unintended file movement |

## Risks

| Risk | Mitigation |
|------|------------|
| Existing `agent/` vault folder already contains unrelated notes | compare before moving |
| Scripts scan parent vault and double-process folders | make scan root explicit |
| Legacy call sites still write to `claude/` | fallback read-only, update writer call sites first |
| iCloud sync races during move | move once, verify counts, avoid parallel writes |

## Completion Criteria

- New writes land under `{obsidian-root}/agent`.
- `obsidian-agent-root` is the primary key.
- `obsidian-vault-claude` is fallback only.
- Active docs no longer describe Obsidian agent docs as Claude-owned.
- Validation passes.
- Execution notes record moved file counts and residual allowed hits.

## Execution Notes

2026-05-16 execution completed:

| Item | Result |
|------|--------|
| Source folder | `{obsidian-root}/claude` removed by rename |
| Target folder | `{obsidian-root}/agent` created |
| Files under target | 410 |
| Primary key | `obsidian-agent-root={obsidian-root}/agent` |
| Legacy key | `obsidian-vault-claude={obsidian-root}/agent` alias |
| Archive dry-run | 0 entries, 0 errors |
| Tag consolidate | scanned 649 files, changed 0 |
| Fill tags from name | scanned 649 files, changed 0 |

Residual `obsidian-vault-claude` references are fallback compatibility only.

Residual `{obsidian-root}/claude` references remain only inside this plan's problem statement and migration instructions.
