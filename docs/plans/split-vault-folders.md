---
status: active
load: triggered
trigger: splitting Obsidian vault folders by mutation policy
created: 2026-05-01
parent: docs/plans/llm-first-cleanup.md
---

# Vault policy split — execution plan

Split mixed-mutation-policy folders in the Obsidian vault. Separated from `llm-first-cleanup.md` because vault content is human-read per charter exception, not LLM-first scope.

---

## Problem

- `specs/` mixes forward design (mutable) with frozen ADRs (immutable).
- `ops/` mixes durable mission records with ephemeral runtime logs.

One folder, two mutation policies → readers cannot tell what is safe to edit.

---

## Action

Per project under Obsidian vault `claude/projects/<project>/`:

1. New folder `decisions/` (or `adr/`) for frozen ADRs. Template: Status / Date / Context / Decision / Consequences.
2. Move existing ADR-shaped files from `specs/` into `decisions/`.
3. Inside `ops/`, split into `ops/missions/` (durable) and `ops/runs/` (ephemeral, gitignore-able).
4. Update `rules/shotloom.md` "Subfolders" table to reflect the split.

---

## Acceptance

- Each folder has exactly one mutation policy.
- `rules/shotloom.md` Subfolders table lists `decisions/`, `ops/missions/`, `ops/runs/`.
- No file remains in `specs/` that matches the ADR shape.
