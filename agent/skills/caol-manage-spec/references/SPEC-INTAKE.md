---
status: accepted
---

# Spec Intake

## Purpose

Capture the inputs used to make or update a high-risk caol/Knitten spec before
the direct spec is written.

## When To Persist

Persist an intake artifact under `docs/briefings/specs/<slug>.md` when the spec
touches any of these:

| Surface | Examples |
|---------|----------|
| shared policy | `SYSTEM.md`, entry docs, rules |
| validators | `scripts/validate-llm-first.mjs`, generated blocks |
| routing | `context-routing.json`, repo keys, profiles |
| artifact CRUD | skills, rules, standards, commands, milestones |
| deploy targets | `~/.claude`, `~/.codex`, harness adapters |
| Obsidian | vault structure, note contract, write policy |
| multi-repo | repo aliasing, path config, cross-repo migrations |

Small, low-risk specs may use chat-only intake.

## Template

```markdown
---
status: intake
created: YYYY-MM-DD
updated: YYYY-MM-DD
owner: caol-ila
spec: docs/plans/<lifecycle>/<slug>.md
---

# Spec Intake: <slug>

## User Request

<verbatim or concise paraphrase>

## Goal

<what this spec must enable>

## Route

- selected route:
- candidate routes:
- delegated or referenced skills:

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| file |  |  |
| directory |  |  |
| skill |  |  |
| rule |  |  |
| standard |  |  |
| external |  |  |

## Known Decisions

-

## Open Questions

-

## Exclusions

-

## Validation Expected

-
```

## Rules

1. Intake records inputs; it does not duplicate the final spec body.
2. Facts need evidence: file, command result, existing doc, issue, or user
   statement.
3. Decisions can cite the current chat as source when the user decided it.
4. If evidence conflicts, write `.draft.md` or ask one short question.
5. Do not invent paths. Resolve repo and vault paths through config or resolver
   skills.
6. Set `spec:` to the actual lifecycle spec path under `docs/plans/`.
