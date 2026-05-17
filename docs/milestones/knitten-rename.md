---
status: active
created: 2026-05-17
updated: 2026-05-17
owner: agent-hub
target-date:
---

# agent-hub Rename

## Purpose

Make `agent-hub` the internal name for the agent hub while preserving
runtime compatibility during the transition.

## Scope

This milestone covers identity, terminology, docs, registries, path aliases,
Obsidian project naming, commands, skills, validators, and migration safety for
the rename from the legacy `caol-ila` compatibility identity to `agent-hub`.

The rename must be staged. Legacy `caol-ila` currently appears in repository paths,
machine config keys, command and skill names, Obsidian project folders, and
deployed harness instructions. A broad replacement would break path lookup and
skill invocation.

## Specs

| Spec | Status | Role |
|------|--------|------|
| [rename-caol-ila-to-knitten.md](../plans/active/rename-caol-ila-to-knitten.md) | active | define rename scope, compatibility rules, execution batches, and validation |

## Progress

| Phase | State | Evidence |
|-------|-------|----------|
| Name decision | accepted | user stated the internal name is now `agent-hub` |
| Legacy Discord bridge | retired | user confirmed any old `agent-hub` Discord bridge no longer needs preservation |
| Rename contract | done | `docs/plans/active/rename-caol-ila-to-knitten.md` records the staged plan |
| Inventory | done | `docs/plans/reports/rename-caol-ila-to-knitten/inventory-2026-05-17.md` classifies active-source references |
| Human-facing identity | done | README, SYSTEM, AGENT-HUB, and setup harness introduce agent-hub with `caol-ila` compatibility |
| Compatibility layer | partial | `agent-hub` repo-key alias added; command prefix, config directory, and path aliases remain separate decisions |
| Implementation | todo | rename approved surfaces only after inventory review |
| Validator support | partial | routing validator now requires the `agent-hub` repo alias while `caol-ila` remains |

## Acceptance Criteria

1. `agent-hub` is documented as the internal hub name.
2. Every remaining `caol-ila` reference is classified as legacy compatibility,
   historical record, machine path, or pending migration.
3. No machine-local path lookup breaks.
4. `caol-*` commands and skills remain callable until an explicit command-prefix
   migration spec is accepted.
5. Obsidian and docs references either use `agent-hub` or carry a documented
   legacy reason.
6. Validators detect unclassified new `caol-ila` references after the migration.

## Open Decisions

| Decision | Default |
|----------|---------|
| Rename repository directory from `caol-ila` to `agent-hub`? | no, defer until alias/symlink plan exists |
| Retire repo key `caol-ila` in config? | no, keep as legacy alias until all consumers prefer `agent-hub` |
| Rename `caol-*` command and skill prefixes? | no, treat as legacy command namespace until a separate prefix migration spec |
| Rename `caol-config` directory? | no, keep as compatibility path for now |
| Rename Obsidian `projects/caol-ila` to `projects/agent-hub`? | yes, but only through resolver-backed Obsidian migration |
| Preserve old `agent-hub` Discord bridge if found? | no, delete after confirming it is not referenced by active config |

## Blockers

| Blocker | Impact |
|---------|--------|
| None | N/A |

## External Mirrors

None. Keep this rename repo-native until compatibility is stable.
