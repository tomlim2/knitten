# Shotloom Promotion Ledger

This ledger records rules for promoting Shotloom operational findings into the
layer that consumes them. Use it with `/shotloom-promote-findings`.

## Destination Rules

| Layer | Destination | Use when |
|---|---|---|
| Planning and task intake | `agent/skills/shotloom-start-task/PROMOTED_FINDINGS.md` | the lesson affects issue intake, worktree setup, branch policy, or handoff |
| Implementation | `agent/skills/shotloom-implement-code/PROMOTED_FINDINGS.md` | the lesson affects coding, editing, or validation while implementing |
| Code review | `agent/skills/shotloom-review-code/PROMOTED_FINDINGS.md` | the lesson belongs in Rust, TypeScript, frontend, or test-quality review |
| Docs and workflow review | `agent/skills/shotloom-review-docs/PROMOTED_FINDINGS.md` | the lesson belongs in docs, markup, workflow YAML, or prose-contract review |
| Obsidian | operational-finding completion policy | the reusable action is complete and only historical context remains |

## Promotion Shape

Each promoted entry names:

- Source report.
- Trigger in the consuming layer.
- Check the skill performs.
- Fix shape for future work.
- Status.

Prefer one concrete trigger and one concrete check over narrative summary.

Do not create a promoted-finding ledger for `shotloom-check-gates`. A mechanical
validator idea stays in the owning review ledger until an actual helper or gate
implements it.

## Promotion Loop

1. Capture the operational finding with `/ah-report-finding`.
2. Resolve or triage enough evidence to identify the consuming layer.
3. Add the smallest reusable entry to that layer's `PROMOTED_FINDINGS.md`.
4. Update the finding report `promotion-target`.
5. Move completed historical context to Obsidian through the existing completion
   policy when the repo no longer needs the full report.

## Active Promotion-Loop Findings

### Keep promotion ledgers separate from reference material

- Source: current Shotloom quality-loop design discussion, 2026-05-28.
- Trigger: a user asks where promoted findings go after capture.
- Check: create or update a layer-local `PROMOTED_FINDINGS.md`, not a generic
  reference file, when the content is an active reusable checklist.
- Fix Shape: make consuming skills read the promoted ledger explicitly during
  their workflow.
- Status: active
