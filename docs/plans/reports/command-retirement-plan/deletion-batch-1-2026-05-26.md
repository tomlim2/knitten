---
status: accepted
created: 2026-05-26
owner: agent-hub
spec: ../../active/command-retirement-plan.md
---

# Command Retirement Deletion Batch 1

## Summary

| Field | Value |
|-------|-------|
| Commands before | 40 |
| Commands deleted | 40 |
| Commands after | 0 |
| Scope | Remove every remaining shared command file under `agent/commands/` |

## Decision

The shared command layer is no longer a durable artifact class. Remaining
command content is treated as retired source material, and future operational
behavior must live in skills, standards, templates, references, or external
harness adapters.

## Deleted Set

All remaining command files present before the batch:

- `ah-check-status`
- `ah-check-updates`
- `ah-consult-codebase`
- `ah-open-dashboard`
- `ah-research-light`
- `ah-research-rules`
- `ah-research-web`
- `ah-review-claude-md`
- `ah-review-skills`
- `ah-switch-context`
- `ah-sync-vendors`
- `ah-update-docs`
- `ah-work-ultra`
- `cci-art-create-branch`
- `cci-art-prepare-merge`
- `cci-art-remove-branch`
- `cci-art-send-merge-notice`
- `cci-art-send-merge-result`
- `cci-linear-create-issue`
- `cci-make-mr`
- `cci-open-creator-character`
- `cci-open-creator-launcher`
- `cci-open-creator-shipper`
- `cci-open-project`
- `cci-open-zo-downloader`
- `cci-register-character`
- `cci-review-cpp`
- `cci-summarize-commit`
- `dev-fix-bug`
- `dev-open-pmx2vrm`
- `dev-sync-design`
- `git-make-message`
- `learn-add-log`
- `shotloom-linear-create-issue`
- `tutoring-mark-paid`
- `tutoring-open-invoice`
- `ue-make-skill`
- `ue-restore-deleted`
- `ue-write-cpp`
- `writing-apply-voice`

## Follow-up Adjustments

| Surface | Adjustment |
|---------|------------|
| `agent/config/exceptions.json` | Cleared `commandLengthGrandfathered` because no command files remain. |
| `README.md` | Updated generated inventory to `Commands (0)`. |
| `agent/config/artifact-inventory.json` | Regenerated without command rows. |
| command retirement specs | Updated current state from 40 commands to 0 commands. |

## Validation

| Check | Result |
|-------|--------|
| Command count | 0 |
| Inventory regeneration | `agent/config/artifact-inventory.json` regenerated to 752 rows |
| Full validator | passes |
