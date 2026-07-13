---
status: active
created: 2026-06-08
updated: 2026-07-10
owner: workflow
target-date:
---

# Knitten Milestone

## Purpose

Close the `v0.1.8` public baseline with current release metadata and measured
Core/domain-plugin evidence. This file contains only work with a concrete next
action, output, and verification. Completed work moves to
[`docs/milestones/completed.md`](docs/milestones/completed.md).

## Active Work

| Priority | Work | Next action | Done when |
|----------|------|-------------|-----------|
| P1 | Public release alignment | Align GitHub About description/topics with the lightweight Codex workflow core message and publish the `v0.1.8` GitHub Release. | `gh repo view tomlim2/knitten --json description,repositoryTopics,latestRelease` reports aligned wording and `latestRelease.tagName == "v0.1.8"`. |
| P1 | Released exposure proof alignment | Use the archived three-plugin measurement for Core `v0.1.8`, KSL `v0.1.5`, and KAS `v0.1.2` to update README proof text that still cites superseded values. | README and milestone claims match the archived release baseline and distinguish historical pilot measurements from the current 20-skill KAS set. |

Do not add an item here unless it has an accepted target, a concrete output,
and a verification command or observable completion condition.

## Specs

| Spec | Status | Role |
|------|--------|------|
| [`docs/specs/public-repository-readiness.md`](docs/specs/public-repository-readiness.md) | active | Public metadata and release closure. |
| [`docs/specs/domain-exposure-audit-plan.md`](docs/specs/domain-exposure-audit-plan.md) | reference | Measurement method and historical baseline. |

## Progress

| Phase | State | Evidence |
|-------|-------|----------|
| Public release alignment | pending | Git tag `v0.1.8` exists, while GitHub still reports `v0.1.7` as the latest Release and uses the older Agent Hub description. |
| Released exposure proof alignment | in progress | The released-tag measurement is archived; README still reports the older Core selected-body value. |

## Acceptance Criteria

- GitHub About description/topics use the lightweight personal Codex workflow
  core positioning without the superseded Agent Hub framing.
- The latest GitHub Release is `v0.1.8` and its wording matches the current
  README positioning.
- A durable measurement records released Core, KSL, and KAS refs together with
  list and selected-body exposure.
- Public proof text cites current evidence and labels historical measurements
  as historical instead of silently replacing their baseline.
- When both active items pass, set this milestone to `completed` and move its
  final evidence summary to the completed-work log.

## Blockers

| Blocker | Impact |
|---------|--------|
| External publication approval | GitHub About and Release writes require explicit user approval at execution time. |

## Completed Work

Completed phases, pilot results, historical measurements, non-goals, and source
specs are maintained in
[`docs/milestones/completed.md`](docs/milestones/completed.md).
