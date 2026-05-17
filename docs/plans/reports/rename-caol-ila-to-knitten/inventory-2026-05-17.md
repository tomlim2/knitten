---
status: accepted
created: 2026-05-17
owner: caol-ila
spec: ../../active/rename-caol-ila-to-knitten.md
---

# Knitten Rename Inventory 2026-05-17

## Scope

Scanned tracked active source under:

```text
SYSTEM.md
AGENTS.md
CLAUDE.md
AGENT-HUB.md
README.md
agent/
docs/
scripts/
tools/
```

Excluded:

```text
agent/projects/
agent/file-history/
agent/plugins/
docs/plans/reports/
node_modules/
dist/
.astro/
```

## Counts

| Class | Hits | Files | Action |
|-------|-----:|------:|--------|
| `command-api` | 389 | 107 | preserve until command/skill prefix migration |
| `config-path` | 150 | 86 | preserve until `caol-config` alias exists |
| `historical` | 299 | 31 | leave unless active behavior depends on it |
| `identity` | 4 | 1 | scan pattern in active rename spec; keep until validator hardening |
| `new-identity` | 120 | 23 | keep |
| `slug-id` | 281 | 106 | alias before rename |
| `tool-name` | 24 | 11 | decide in dashboard naming batch |

## Discord Bridge Check

| Check | Result |
|-------|--------|
| active source `knitten` + `discord` search | no active bridge references found |
| only hit | rename spec decision text |
| action | no compatibility preservation needed |

## Batch A Result

| Item | Result |
|------|--------|
| `Knitten` glossary term | exists |
| milestone | `docs/milestones/knitten-rename.md` exists |
| spec | moved to `docs/plans/active/rename-caol-ila-to-knitten.md` |
| inventory | this report |
| runtime path rename | not performed |
