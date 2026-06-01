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
  path, worktree, and intended next skill. If the skill output is JSON-only,
  include the string in a JSON field such as `handoffCommand`.
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

### Sweep durable Shotloom planning sources

- Source: current planning-quality discussion, 2026-05-28.
- Trigger: start-task gathers planning context for a Shotloom development issue.
- Check: verify related Shotloom ADRs, guidelines, architecture docs, IPC docs,
  CI/CD workflow docs, workflow YAML, and repo convention docs were considered
  when the issue scope mentions or implies them.
- Fix Shape: run a planning-source sweep, read only matching durable docs, and
  record found/not-found source categories plus open questions in the briefing.
- Status: active
