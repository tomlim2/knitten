---
status: historical
created: 2026-05-26
updated: 2026-05-26
owner: agent-hub
---

# Command Layer History

## Current Rule

Knitten has no shared command layer. Shared workflow and policy live in skills,
standards, templates, validators, and reports.

## Historical Summary

Knitten previously stored shared command wrappers under `agent/commands/`.
That layer was retired on May 26, 2026 so current routing can treat skills and
other durable artifacts as the only shared execution surface.

## Historical Evidence

| Topic | Evidence |
|-------|----------|
| Retirement spec | `docs/plans/reports/command-retirement-plan/` |
| Batch 0 deletions | `docs/plans/reports/command-retirement-plan/deletion-batch-0-2026-05-26.md` |
| Batch 1 deletions | `docs/plans/reports/command-retirement-plan/deletion-batch-1-2026-05-26.md` |
| Spec review | `docs/plans/reports/command-retirement-plan/spec-review-2026-05-26.md` |

## Usage Rule

If a document needs current policy, do not mention the command layer.

If a document needs historical explanation, link here instead of restating the
retirement details inline.
