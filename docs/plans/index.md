---
status: accepted
---

# Plans

## Lifecycle Folders

| Folder | Status values | Use |
|--------|---------------|-----|
| `active/` | `active`, `implemented-validation-blocked`, `open` | accepted work still in progress or blocked on validation |
| `proposed/` | `proposed` | spec written and waiting for acceptance or implementation start |
| `drafts/` | `draft`, `draft-conflict` | unresolved or conflicting spec text |
| `parked/` | `parked`, `blocked` | paused work |
| `completed/` | `completed`, `done`, `implemented` | finished work retained for reference |
| `archive/` | `archived`, `superseded` | inactive historical specs |
| `reports/` | none | migration evidence and generated reports; not specs |

## Rules

1. Create new specs in `proposed/` unless the user asks to begin active implementation now.
2. Create active implementation specs in `active/`.
3. Do not create spec files directly under `docs/plans/`.
4. Use `agent/skills/ah-manage-spec/SKILL.md` for spec CRUD.
5. Use `agent/skills/ah-manage-milestone/SKILL.md` when a spec belongs to a milestone.
