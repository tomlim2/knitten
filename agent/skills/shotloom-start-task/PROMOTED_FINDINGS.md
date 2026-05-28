# Promoted Findings: Start-Task Layer

This ledger contains operational findings promoted into Shotloom task intake,
branch setup, planning, and handoff checks. Read it during
`/shotloom-start-task` before writing the final briefing and JSON envelope.

## Active Entries

### Emit a concrete next handoff command

- Source: `docs/briefings/operational-findings/reports/20260528-start-task-should-suggest-the-next-handoff-command.md`
- Trigger: start-task finishes with a briefing path and `next` value.
- Check: verify the final output tells the user the exact next command or prompt
  to use in another session.
- Fix Shape: include a compact handoff string that names the issue key, briefing
  path, worktree, and intended next skill.
- Status: active

### Apply Shotloom branch policy before worktree creation

- Source: `docs/briefings/operational-findings/reports/20260527-define-shotloom-branch-prefix-policy-in-task-workflow.md`
- Trigger: start-task derives a branch name for a Shotloom Linear issue.
- Check: verify the branch policy is Shotloom-specific and does not fall back to
  the generic Codex branch prefix.
- Fix Shape: derive the branch from the Linear title using the Shotloom pattern,
  warn on mismatch before PR creation, and avoid `codex/` for Shotloom task
  branches unless the user explicitly requests it.
- Status: active

### Defer broad tests during small-edit iteration

- Source: `docs/briefings/operational-findings/reports/20260527-avoid-broad-test-runs-during-active-small-edit-iteration.md`
- Trigger: a task is in active small-edit UI, copy, or style iteration.
- Check: verify the plan uses targeted validation during iteration and reserves
  broad gates for commit, review-before-pr, make-pr, or explicit user request.
- Fix Shape: write the briefing or handoff with targeted checks first, then name
  the broader gate point.
- Status: active
