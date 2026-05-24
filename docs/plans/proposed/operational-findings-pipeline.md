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
| Branch | `operational-findings` |
| Preferred worktree | `<knitten-root>/.worktrees/operational-findings` |
| Canonical intake index | `docs/briefings/operational-findings-inbox.md` |
| Report directory | `docs/briefings/operational-findings/reports/` |
| Report template | `agent/document-templates/agent-hub/operational-finding-report.md` |
| Fast-track manual | `docs/briefings/operational-findings/fast-track-manual.md` |

Rules:

- Do not create date-specific worktrees.
- The worktree is a shared queue, not a per-PR or per-day artifact.
- The branch is long-lived operating state. Do not delete it as a stale task
  branch.
- Findings worktree policy is commit-first: any accepted report write must end
  in a commit and push from the findings branch.
- Report files live under `docs/briefings/operational-findings/reports/` and
  use agent-generated slugs unless the user provides a usable title.
- If the preferred worktree is unavailable or unsafe to prepare, capture should
  report `skipped` and avoid blocking the primary task wrapup.

Failure handling:

| Condition | Action |
|-----------|--------|
| worktree is dirty before capture | skip capture; report the dirty files and leave them untouched |
| branch is not `operational-findings` | skip capture; report the actual branch |
| remote is ahead and worktree is clean | run `pull --ff-only`, then retry once |
| push is rejected after commit | fetch, attempt `pull --ff-only` if clean, then retry once |
| merge conflict or non-ff pull | stop; report manual repair needed |
| files outside the intake index/report paths changed | stop; do not commit |
| network failure prevents push | leave the commit in the findings worktree and report the exact push failure |

Script feedback:

- on success, report only the created/updated report path and pushed commit;
- on failure, analyze the failed condition and report the next safe action.

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
| `Initial Source` | first report channel, such as `user-report`, `wrapup-task`, `ci`, `rule`, or similar |
| `Area` | skill, rule, standard, validator, docs, config, workflow, routing, ux, other, or unknown |
| `Context` | report-context label |
| `Summary` | one-line rough description |
| `Status` | `captured`, `triaged`, `promoted`, `merged`, `parked`, `discarded` |

Report files use the template and are the place for:

- rough findings;
- grouped observations from the same PR / skill-use / workflow context;
- partial evidence;
- follow-up guesses;
- later clarification during triage.

Capture does not require fully clarified issue statements. The purpose is to
preserve a useful report that can be strengthened later.

Initial capture vs later classification:

- preserve what the first report said, even when later triage discovers the real
  target is different;
- `Initial Source` records where the report came from, not the final root cause;
- `Area` and `promotion-target` may start as `unknown` or a rough guess;
- later triage may reclassify the report from A to B, but should keep the
  original observation visible in the report body.

Report status:

- frontmatter `status` is canonical for scripts, indexes, and promotion;
- body `## Status` is a human-readable reflection of the same state;
- if the two diverge, tooling and agents must trust frontmatter first and repair
  the body during the next edit.

File naming:

- agent-generated slug by default;
- if the user provides a usable title, reuse or adapt it;
- one file = one report context, not one atomic finding.

Status vocabulary:

| Status | Meaning |
|--------|---------|
| `captured` | saved for later clarification; default capture state |
| `triaged` | reviewed and routed, but not yet fully resolved |
| `promoted` | converted into a durable artifact change or accepted follow-up |
| `merged` | folded into another report or existing artifact |
| `parked` | kept for more evidence |
| `discarded` | closed as too specific, stale, or not worth codifying |

### 4. Triage and promotion lane

Promotion remains periodic and explicit.

Triggers:

- weekly review;
- user asks to process findings;
- agent has time to consolidate;
- the inbox reaches enough density to justify a pass.

Fast-track exception:

- if the user explicitly says the finding needs urgent handling, skip the normal
  batch preference and route it through
  `docs/briefings/operational-findings/fast-track-manual.md`.

Triage decisions:

| Decision | Meaning |
|----------|---------|
| `promote` | convert into a durable artifact change |
| `merge` | fold into an existing finding or existing permanent artifact |
| `park` | keep for more evidence |
| `discard` | too specific, stale, or not worth codifying |

Promotion routing guide:

| Finding shape after triage | Likely target |
|----------------------------|---------------|
| missing or confusing repeatable workflow step | skill |
| missing behavior constraint | rule |
| durable judgment, policy, or template convention | standard |
| mechanically checkable drift | validator |
| multi-step implementation or migration | spec |
| broad future work or cross-cutting backlog | milestone |
| unclear, early, or one-off signal | parked |

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

Canonical ownership:

1. `docs/briefings/operational-findings-inbox.md` is the canonical Knitten-wide
   findings index.
2. Shotloom review findings are a typed source/lane within that canonical
   pipeline.
3. `docs/briefings/shotloom/review-finding-patterns-inbox.md` is compatibility
   storage until the Shotloom review-pattern lane is migrated or explicitly kept
   as a specialized downstream artifact.
4. New general operational findings should not write first to the Shotloom-only
   inbox.

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
3. Create `docs/briefings/operational-findings/reports/` and
   `docs/briefings/operational-findings/fast-track-manual.md`.
4. Add `agent/document-templates/agent-hub/operational-finding-report.md` and
   keep report creation aligned to that template.
5. Update `shotloom-wrapup-task` so it can append findings to the dedicated
   worktree and push safely.
6. Add one manual reporting path for user-submitted findings under the name
   `ah-report-finding`.
7. Update the existing Shotloom review-pattern lane to respect the canonical
   operational findings index.
8. Define or update the promotion workflow so periodic consolidation can target
   skills, rules, standards, specs, validators, and milestone items.
9. Add validation or grep checks that protect the intake doc shape and prevent
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
- index and report status values use the same vocabulary;
- fast-track requests have a documented manual path;
- promotion workflow can classify entries into promote / merge / park / discard.

## Risks

| Risk | Why it matters | Mitigation |
|------|----------------|------------|
| Inbox becomes a dumping ground | Too much low-signal capture reduces promotion value | Keep compact record shape and explicit discard path. |
| Capture blocks task wrapup | Worktree/setup issues should not block main cleanup | Allow safe skip with explicit report. |
| Scope stays too Shotloom-specific | The pipeline should serve broader Knitten usage | Use operational vocabulary from the start. |
| Promotion gets postponed forever | Queue grows without durable improvements | Add periodic review expectation and milestone visibility. |
| Duplicate sources diverge | Separate review-only and general inboxes can drift | Canonical index is Knitten-wide; Shotloom inbox is compatibility storage until migration. |

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
11. Report directory and fast-track manual paths are explicitly assigned.
12. Index and report status values use one shared lifecycle vocabulary.

## Open Decisions

1. Periodic consolidation stays manual-only for now. If automation is added
   later, which trigger should justify it?
2. Does the broader findings intake belong under the current milestone, or
   should it get a dedicated milestone once implementation starts?
3. Should the Shotloom review-pattern compatibility inbox eventually be deleted,
   kept as downstream promoted-pattern evidence, or migrated fully into the
   canonical Knitten-wide report directory?
