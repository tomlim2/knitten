---
status: active
created: 2026-05-17
updated: 2026-05-17
owner: caol-ila
target-date:
---

# Knitten Rename

## Purpose

Make `Knitten` the internal name for the caol-ila agent hub while preserving
runtime compatibility during the transition.

## Scope

This milestone covers identity, terminology, docs, registries, path aliases,
Obsidian project naming, commands, skills, validators, and migration safety for
the rename from `caol-ila` to `Knitten`.

The rename must be staged. `caol-ila` currently appears in repository paths,
machine config keys, command and skill names, Obsidian project folders, and
deployed harness instructions. A broad replacement would break path lookup and
skill invocation.

## Specs

| Spec | Status | Role |
|------|--------|------|
| [rename-caol-ila-to-knitten.md](../plans/proposed/rename-caol-ila-to-knitten.md) | proposed | define rename scope, compatibility rules, execution batches, and validation |

## Progress

| Phase | State | Evidence |
|-------|-------|----------|
| Name decision | accepted | user stated the internal name is now `knitten` |
| Legacy Discord bridge | retired | user confirmed any old `knitten` Discord bridge no longer needs preservation |
| Rename contract | in-progress | `docs/plans/proposed/rename-caol-ila-to-knitten.md` records the staged plan |
| Inventory | todo | classify every `caol-ila`, `caol`, and `caol-config` reference |
| Compatibility layer | todo | decide repo key, config key, command prefix, and path aliases |
| Implementation | todo | rename approved surfaces only after inventory review |
| Validator support | todo | add checks for unclassified legacy names and required aliases |

## Acceptance Criteria

1. `Knitten` is documented as the internal hub name.
2. Every remaining `caol-ila` reference is classified as legacy compatibility,
   historical record, machine path, or pending migration.
3. No machine-local path lookup breaks.
4. `caol-*` commands and skills remain callable until an explicit command-prefix
   migration spec is accepted.
5. Obsidian and docs references either use `Knitten` or carry a documented
   legacy reason.
6. Validators detect unclassified new `caol-ila` references after the migration.

## Open Decisions

| Decision | Default |
|----------|---------|
| Rename repository directory from `caol-ila` to `knitten`? | no, defer until alias/symlink plan exists |
| Rename repo key `caol-ila` to `knitten` in config? | no, add alias first |
| Rename `caol-*` command and skill prefixes? | no, treat as legacy command namespace until a separate prefix migration spec |
| Rename `caol-config` directory? | no, keep as compatibility path for now |
| Rename Obsidian `projects/caol-ila` to `projects/knitten`? | yes, but only through resolver-backed Obsidian migration |
| Preserve old `knitten` Discord bridge if found? | no, delete after confirming it is not referenced by active config |

## Blockers

| Blocker | Impact |
|---------|--------|
| Existing validator terminology failure in `obsidian-root-projects-daily-migration.md` | full validator remains red until fixed |

## External Mirrors

None. Keep this rename repo-native until compatibility is stable.
