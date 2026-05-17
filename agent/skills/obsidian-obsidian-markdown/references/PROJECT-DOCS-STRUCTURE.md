---
status: accepted
domains: obsidian
repo-keys: agent-hub
languages: markdown,yaml
task-types: authoring,review,implementation
context-profile: obsidian-vault
exclude-when: rust,web,unreal
---

# Project Docs Structure

Project folders under the configured project root use role folders. Root is an index, not a dumping ground.

---

## Canonical Shape

```text
projects/<project>/
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

---

## Root Policy

Allowed root files:

| File | Purpose |
|------|---------|
| `README.md` | Project map, scope, audience, folder routing |
| legacy hub | Temporary migration bridge only; must point to the role folders |

Disallowed root files:

| Root file type | Destination |
|----------------|-------------|
| `type/devlog` | `days/` |
| `type/learning` | `learnings/` |
| `type/spec` | `specs/` |
| `type/plan` | `plans/` |
| `type/decision` | `decisions/` |
| `type/analysis` | `topics/` |
| `type/reference` | `topics/` |
| `type/glossary` | `topics/` |
| `type/topic` | `topics/` |

Root files that predate this standard are legacy. Do not create new root content except `README.md`.

---

## Role Folders

| Folder | Owns | Naming |
|--------|------|--------|
| `days/` | dated work records | `YYYY-MM-DD.md` or `YYYY-MM-DD/<slug>.md` |
| `learnings/` | reusable lessons extracted from work | `<slug>.md` |
| `topics/` | reference, analysis, glossary, durable context | `<slug>.md` |
| `specs/` | contracts, product specs, technical specs | `<slug>.md` |
| `plans/` | execution handoff and next-session plans | `<slug>.md` |
| `decisions/` | durable why-decisions | `<slug>.md` |
| `asks/` | prompts, review briefs, subagent dispatch docs | `<slug>.md` |
| `ops/missions/` | cross-session operation records | `<mission>/<slug>.md` or `<slug>.md` |
| `ops/runs/` | ephemeral execution logs | timestamped or run-scoped slug |

---

## CRUD

| Action | Rule | Output |
|--------|------|--------|
| Create project | create root `README.md` first | `projects/<project>/README.md` |
| Create day log | write to `days/YYYY-MM-DD.md` | one canonical day file |
| Create same-day artifact | use `days/YYYY-MM-DD/<slug>.md` only when separate artifact is required | split day folder |
| Create learning | write concept-first note under `learnings/` | `<slug>.md` |
| Create topic | write analysis/reference under `topics/` | `<slug>.md` |
| Create spec | write durable contract under `specs/` | `<slug>.md` |
| Create plan | write execution handoff under `plans/` | `<slug>.md` |
| Create decision | write durable why-record under `decisions/` | `<slug>.md` |
| Create ask | write dispatch/review brief under `asks/` | `<slug>.md` |
| Create ops run | write ephemeral run output under `ops/runs/` | run-scoped slug |
| Create mission record | write durable operation record under `ops/missions/` | mission-scoped slug |
| Read project | start at root `README.md`, then folder README | no root scan first |
| Update purpose | move file to matching role folder and update `type/...` tag | folder/type match |
| Delete file | merge durable content first, then remove obsolete file | no orphan lesson/spec |

---

## Promotion

| From | To | Trigger |
|------|----|---------|
| `days/` | `learnings/` | reusable lesson extracted |
| `days/` | `topics/` | investigation becomes reference |
| `plans/` | `specs/` | task plan becomes durable contract |
| `ops/runs/` | `ops/missions/` | run must survive next session |
| root legacy hub | role folder | file has a clear `type/...` |

---

## README Requirement

Required:

| Folder | Required |
|--------|----------|
| project root | yes |
| `topics/`, `specs/`, `plans/`, `decisions/`, `asks/` | yes when folder exists |
| `ops/missions/` | yes when folder exists |

Not required:

| Folder | Reason |
|--------|--------|
| `days/` | repeated entry folder; parent README covers it |
| `learnings/` | repeated lesson folder; parent README covers it |
| `ops/runs/` | ephemeral run folder |
| dated split folders under `days/YYYY-MM-DD/` | inherited from `days/` |

---

## Validator Contract

`obsidian-fix-format --check project-structure` reports:

| Code | Meaning |
|------|---------|
| `project.root-role-mismatch` | root file has a `type/...` that belongs in a role folder |
| `project.root-legacy-hub` | root legacy hub remains and should point to role folders |
| `project.backup-file` | backup/temp file exists inside the vault |
