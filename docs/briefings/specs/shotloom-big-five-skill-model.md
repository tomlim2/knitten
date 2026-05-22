---
status: intake
created: 2026-05-22
updated: 2026-05-22
owner: agent-hub
spec: docs/plans/proposed/shotloom-big-five-skill-model.md
---

# Spec Intake: shotloom-big-five-skill-model

## User Request

Define the Shotloom skill system as a clearer five-lane model first, then turn
that into a spec and design plan before renaming or restructuring the skills.

## Goal

Produce a durable plan for simplifying the Shotloom skill surface so users and
LLMs can route from a closed taxonomy instead of memorizing leaf names or
inventing categories on the fly.

## Route

- selected route: `ah-manage-spec` create
- candidate routes: `ah-route-plan`, direct chat-only outline
- delegated or referenced skills: `shotloom-start-task`, `shotloom-review-before-pr`,
  `shotloom-respond-pr`, `shotloom-wrapup-task`, `shotloom-make-pr`

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| file | `docs/plans/completed/plan-routing-system.md` | Reuse the existing route-owner pattern. |
| file | `docs/plans/completed/implementation-routing-system.md` | Align implementation entrypoint language with current routing model. |
| file | `docs/plans/completed/review-routing-system.md` | Align review entrypoint language with current routing model. |
| file | `agent/rules/shotloom.md` | Preserve repo-specific Shotloom operational rules. |
| file list | `agent/skills/shotloom-*/SKILL.md` | Inventory every Shotloom skill so the taxonomy is total, not partial. |
| skill | `agent/skills/shotloom-start-task/SKILL.md` | Current planning and implementation entrypoint. |
| skill | `agent/skills/shotloom-review-before-pr/SKILL.md` | Current review entrypoint. |
| skill | `agent/skills/shotloom-respond-pr/SKILL.md` | Current PR feedback response entrypoint. |
| skill | `agent/skills/shotloom-wrapup-task/SKILL.md` | Current end-of-task lifecycle entrypoint. |
| chat | Current conversation on 2026-05-22 | User chose classification before renaming and asked for a spec first. |

## Known Decisions

- Use a five-lane mental model: Planning, Implementation, Review, Respond, Wrapup.
- Add explicit non-lane taxonomy values for skills that are ops, watcher, utility, or reference surfaces.
- Do classification before renaming.
- Keep shared operational rules in `agent/rules/shotloom.md`.

## Open Questions

- Whether skill-local classification markers should live in frontmatter or a
  consistent body section.
- Whether the reviewer-side flows should remain under `review` or later split
  into a distinct bucket.

## Exclusions

- No immediate skill renames.
- No command alias removals.
- No behavior changes to Shotloom GitHub/Linear mutation gates in this spec.

## Validation Expected

- New spec exists under `docs/plans/proposed/`.
- Spec keeps clear goals, non-goals, closed taxonomy, full inventory, phases,
  and acceptance criteria.
- `git diff --check`
- `node scripts/validate-llm-first.mjs`
