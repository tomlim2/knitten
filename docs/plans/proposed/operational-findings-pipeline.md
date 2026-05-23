---
status: proposed
created: 2026-05-23
updated: 2026-05-23
owner: agent-hub
milestone: agent-artifact-pack-system
---

# Operational Findings Pipeline

## Purpose

Define one Knitten-wide operating pipeline for capturing, triaging, promoting,
and retiring operational findings discovered while using Knitten.

## Problem

Knitten already records some lessons in multiple places, but the lifecycle is
fragmented:

- `shotloom-respond-pr` handles review comments but should stay focused on fix
  and reply flow.
- `shotloom-wrapup-task` records retrospective notes and review-pattern
  candidates, but only for one Shotloom task-ending path.
- `shotloom-promote-review-patterns` promotes a narrow review-only inbox.
- The user can notice Knitten problems directly during normal use, but there is
  no first-class shared intake path for those reports.

Result: valuable findings can remain in day logs, PR memory, or one-off chat
context instead of becoming durable rules, standards, skill edits, specs, or
backlog items.

## Goals

1. Create one durable intake path for Knitten-wide operational findings.
2. Keep `respond-pr` and similar execution skills unaware of the larger
   lifecycle.
3. Make `wrapup-task` capture findings into a dedicated Knitten findings
   worktree and push them immediately.
4. Support both agent-captured findings and direct user-submitted reports.
5. Establish a periodic promotion loop that converts reusable findings into
   rules, standards, skill edits, specs, validators, or milestone work.
6. Keep the canonical artifact LLM-first, easy to append, easy to triage, and
   safe to inspect from a cold start.

## Non-Goals

- Replace per-task retrospective logging in Obsidian devlogs.
- Force every finding into a permanent rule or standard.
- Require `respond-pr` to classify lifecycle state or write to Knitten.
- Fully automate promotion decisions without human or explicit agent review.
- Design the final public artifact-pack location for this pipeline outside
  current Knitten ownership.

## Current State

| Area | Current owner | Gap |
|------|---------------|-----|
| Review fix + reply | `agent/skills/shotloom-respond-pr/SKILL.md` | Should remain narrow; no shared findings lifecycle. |
| Task retrospective | `agent/skills/shotloom-wrapup-task/SKILL.md` | Captures lessons, but flow is Shotloom-specific and not yet generalized to all Knitten operational findings. |
| Review-pattern inbox | `docs/briefings/shotloom/review-finding-patterns-inbox.md` | Narrow scope: PR review findings only. |
| Review-pattern promotion | `agent/skills/shotloom-promote-review-patterns/SKILL.md` | Manual and useful, but aimed at one catalog lane. |
| Direct user report | chat only | No durable shared intake contract. |

## Proposed Design

### 1. One dedicated findings worktree

Maintain one Knitten worktree dedicated to findings intake and promotion.

| Field | Value |
|-------|-------|
| Branch | `codex/operational-findings` |
| Preferred worktree | `<knitten-root>/.worktrees/operational-findings` |
| Canonical intake index | `docs/briefings/operational-findings-inbox.md` |
| Report template | `agent/document-templates/agent-hub/operational-finding-report.md` |

Rules:

- Do not create date-specific worktrees.
- The worktree is a shared queue, not a per-PR or per-day artifact.
- Findings worktree policy is commit-first: any accepted report write must end
  in a commit and push from the findings branch.
- If the preferred worktree is unavailable or unsafe to prepare, capture should
  report `skipped` and avoid blocking the primary task wrapup.

### 2. Capture lane

Findings enter the pipeline from two sources:

| Source | Entry mode |
|--------|------------|
| `wrapup-task` | automatic append after a real task finishes |
| direct user report | manual append through a dedicated findings-report path |

Minimum capture contract:

- create or update one report-context file from the report template;
- add or update one thin row in the intake index;
- commit only the intake/index/report update from the dedicated findings branch;
- push immediately so the queue survives across machines and sessions.

`respond-pr` stays unaware of this lifecycle. It may surface material that later
becomes a finding, but capture happens after the task ends or when the user
explicitly reports an issue.

### 3. Intake index and report shape

The intake index stays thin. Actual capture content lives in report files.

Index rows must record:

| Field | Meaning |
|-------|---------|
| `Date` | capture date |
| `Report` | report file path or slug |
| `Source` | `wrapup-task`, `user-report`, `ci`, `rule`, or similar |
| `Area` | skill, rule, standard, validator, docs, config, workflow, or routing |
| `Context` | report-context label |
| `Summary` | one-line rough description |
| `Status` | `inbox`, `promoted`, `merged`, `parked`, `discarded` |

Report files use the template and are the place for:

- rough findings;
- grouped observations from the same PR / skill-use / workflow context;
- partial evidence;
- follow-up guesses;
- later clarification during triage.

Capture does not require fully clarified issue statements. The purpose is to
preserve a useful report that can be strengthened later.

File naming:

- agent-generated slug by default;
- if the user provides a usable title, reuse or adapt it;
- one file = one report context, not one atomic finding.

### 4. Triage and promotion lane

Promotion remains periodic and explicit.

Triggers:

- weekly review;
- user asks to process findings;
- agent has time to consolidate;
- the inbox reaches enough density to justify a pass.

Fast-track exception:

- if the user explicitly says the finding needs urgent handling, skip the normal
  batch preference and route it through an urgent handling manual.

Triage decisions:

| Decision | Meaning |
|----------|---------|
| `promote` | convert into a durable artifact change |
| `merge` | fold into an existing finding or existing permanent artifact |
| `park` | keep for more evidence |
| `discard` | too specific, stale, or not worth codifying |

Promotion targets:

- skill edits;
- new or updated rules;
- new or updated standards;
- validators;
- specs;
- milestone rows / backlog items;
- documentation clarifications.

### 5. Relationship to existing review-pattern lane

The current Shotloom review-pattern path is a useful seed, but it becomes one
specialized sub-lane inside the broader Knitten-wide operational findings
pipeline.

Migration direction:

1. preserve current review-pattern behavior while the broader intake doc lands;
2. decide whether review-pattern inbox entries remain separate or become a typed
   slice of the broader findings inbox;
3. keep promotion tooling compatible during transition.

### 6. Ownership split

| Concern | Owner |
|---------|-------|
| fix + reply to PR review | `respond-pr` |
| per-task retrospective log | `wrapup-task` + `learn-log-day` |
| operational findings intake append | wrapup capture path or dedicated report path |
| periodic consolidation | promotion workflow |
| long-lived policy / skill / validator change | target artifact owner |

## Execution Plan

1. Create `docs/briefings/operational-findings-inbox.md` with the accepted
   thin index shape.
2. Define the dedicated findings branch/worktree contract.
3. Add `agent/document-templates/agent-hub/operational-finding-report.md` and
   keep report creation aligned to that template.
4. Update `shotloom-wrapup-task` so it can append findings to the dedicated
   worktree and push safely.
5. Add one manual reporting path for user-submitted findings under the name
   `ah-report-finding`.
6. Decide whether the existing Shotloom review-pattern inbox is:
   - kept separate;
   - mirrored;
   - or migrated into the broader inbox.
7. Define or update the promotion workflow so periodic consolidation can target
   skills, rules, standards, specs, validators, and milestone items.
8. Add validation or grep checks that protect the intake doc shape and prevent
   accidental private-link drift where needed.

## Validation

During spec work:

```bash
git diff --check
node scripts/validate-llm-first.mjs
git status --short --branch
```

When implementation lands, validate at least:

- dedicated findings worktree can be prepared from a clean main checkout;
- `wrapup-task` can write one report-context file plus one index update without
  touching unrelated files;
- intake commit/push only mutates the findings branch/worktree;
- manual user-report flow can add one entry without requiring PR context;
- promotion workflow can classify entries into promote / merge / park / discard.

## Risks

| Risk | Why it matters | Mitigation |
|------|----------------|------------|
| Inbox becomes a dumping ground | Too much low-signal capture reduces promotion value | Keep compact record shape and explicit discard path. |
| Capture blocks task wrapup | Worktree/setup issues should not block main cleanup | Allow safe skip with explicit report. |
| Scope stays too Shotloom-specific | The pipeline should serve broader Knitten usage | Use operational vocabulary from the start. |
| Promotion gets postponed forever | Queue grows without durable improvements | Add periodic review expectation and milestone visibility. |
| Duplicate sources diverge | Separate review-only and general inboxes can drift | Decide transition path early and document canonical owner. |

## Acceptance Criteria

1. Knitten has one proposed contract for operational findings intake,
   consolidation, and promotion.
2. The contract keeps one dedicated findings worktree instead of date-specific
   worktrees.
3. Findings use one thin intake index plus report-context files created from a
   shared template.
4. `wrapup-task` is designated as a capture point, not the promotion engine.
5. Direct user reports are first-class intake sources.
6. Findings can promote into skill, rule, standard, validator, spec, docs, or
   milestone work.
7. Agent-generated file naming is the default, with optional user-provided
   title reuse.
8. The intake artifact records status so entries can move through a lifecycle.
9. The spec defines whether capture may skip safely without blocking primary
   cleanup work.
10. Existing Shotloom review-pattern handling has a documented relationship to
   the broader pipeline.

## Open Decisions

1. Should `docs/briefings/shotloom/review-finding-patterns-inbox.md` stay as a
   separate specialized inbox or merge into `operational-findings-inbox.md`?
2. Periodic consolidation stays manual-only for now. If automation is added
   later, which trigger should justify it?
3. Does the broader findings intake belong under the current milestone, or
   should it get a dedicated milestone once implementation starts?
