---
name: implement
description: Implement accepted specs or review findings.
match-check: normal
---

# Implement

Use for: implementing accepted specs or review findings in the active workspace.

Use when the user asks to implement an accepted spec, apply a user-approved
plan, or fix accepted review findings.

## Step 0: Match Check

- Continue only when the user asks to implement an accepted spec, apply a
  user-approved plan, or fix accepted review findings.
- Treat a spec, plan, or finding as accepted only when the user approved it in
  this task context or provided it as the implementation target.
- Confirm the accepted contract, target workspace, target files or modules, and
  validation expectations before editing.
- If validation expectations are missing, infer the nearest meaningful
  validation and state that assumption before editing.
- Stop and ask for a repaired contract when the request lacks an accepted spec,
  actionable finding, or clear implementation target.
- This skill is local-only. Never commit, push, merge, deploy, delete, or mutate
  external systems from this workflow. Hand an explicitly requested later
  action to an owning `strict` skill, which must re-check target, account,
  authority, current state, mutation surface, and approval.
- Do not edit files, run mutating commands, or follow later steps until this
  check passes.

Do not read detailed references until Step 0 passes.

## After Match

Read [`references/flow.md`](references/flow.md), then implement and validate the
accepted local change.
