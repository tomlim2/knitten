---
status: proposed
created: 2026-05-31
updated: 2026-05-31
owner: agent-hub
applies-to:
  - docs/milestones/*.md
---

# Milestone Review Guideline

## Purpose

Use this guideline when reviewing a Knitten milestone.

A milestone is not only a todo list. It is a routing document for future LLM
sessions. A good milestone lets a cold-start agent understand the operating
direction, included specs, current progress, and stop conditions without
guessing from chat history.

## Review Order

| Order | Lens | Question |
|---|---|---|
| 1 | Direction | Does the milestone express the system direction clearly enough for a cold-start LLM? |
| 2 | Scope | Are in-scope and out-of-scope boundaries explicit? |
| 3 | Naming | Are system terms consistent with the current architecture? |
| 4 | Traceability | Do specs, progress rows, and acceptance criteria point to the same work? |
| 5 | Executability | Can the next implementation or spec PR be chosen from this milestone? |
| 6 | Expansion control | Does the milestone avoid swallowing unrelated future work? |

## Findings

Prioritize findings that would misroute future work.

| Priority | Use when |
|---|---|
| P1 | The milestone points future agents at the wrong system direction, wrong owner, or wrong next work. |
| P2 | Scope, naming, spec rows, progress rows, or acceptance criteria are inconsistent enough to cause drift. |
| P3 | Wording can be clearer, but the milestone still routes work correctly. |

## Checklist

| Check | Pass condition |
|---|---|
| Direction | The milestone states the system frame in one compact sentence or formula. |
| Scope | In-scope and out-of-scope rows prevent the first PR from becoming a full-system rewrite. |
| Spec list | Every linked or named spec has a role that explains why it belongs in the milestone. |
| Progress | Each progress row has a concrete evidence target, not only a vague phase name. |
| Acceptance criteria | AC rows test the milestone outcome, not the implementation details of one PR. |
| Naming | Terms match the repo's current naming layer, such as skill operating system, output contract, location, lifecycle, validator, and handoff. |
| Dependencies | The milestone names any required upstream spec, guideline, resolver, or validator. |
| Stop condition | It is clear when the milestone can be considered complete, parked, or split. |

## Knitten Skill Operating System Lens

For Knitten refactor milestones, review against this frame:

```text
skill operating system = skill discovery + skill execution + output contracts + validation + handoff
output contract = purpose + path + format + lifecycle + ownerSkill + validator
```

The milestone should not collapse this frame into only document cleanup, path
cleanup, or template cleanup. Those may be subprojects, but the top-level reason
is that LLM-operated skills need reliable discovery, execution, outputs,
validation, and handoff.

## Required Output

Use this compact review block:

```text
Milestone review:
- Direction: pass | Pn: <finding>
- Scope: pass | Pn: <finding>
- Naming: pass | Pn: <finding>
- Traceability: pass | Pn: <finding>
- Executability: pass | Pn: <finding>
- Expansion control: pass | Pn: <finding>

Verdict: ready | revise-before-spec | split | park
```

## Review Timing

Run milestone review before spec review when the milestone is new, renamed, or
used as the parent of multiple specs.

Run it again before implementation starts if the milestone has changed since the
spec was accepted.
