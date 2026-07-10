---
name: review-fix-loop
description: Run review/fix loops until blockers clear.
match-check: normal
---

# Review Fix Loop

Use for: orchestrating blocker-driven review/fix loops across repositories.

Use when the user asks to keep reviewing and fixing, loop until blockers
disappear, resume after compaction, or run single/triad review plus
implementation repeatedly.

This is a Knitten Core skill/protocol, not a shell command or PATH executable.

Review packet means target, scope, source citations, changed-surface context,
and findings format are supplied. Checkpoint JSON records review attempts,
accepted fixes, validations, and remaining blockers.

## Step 0: Match Check

Confirm:

- the request needs repeated review, fix, validation, and checkpointing,
- the target workspace is writable and identifiable from the current workspace
  or an explicit path,
- review mode is `single` or `triad`; use the requested mode, defaulting to
  `triad`,
- mutation is limited to local files,
- the checkpoint owner and absolute location are resolved through the target
  workspace task-artifact contract or the Knitten Core fallback before the
  first write; stop when ownership cannot be determined safely.

Stop and ask for the smallest missing item when the target, review packet, or
writable workspace cannot be inferred safely.

Do not read detailed references until Step 0 passes.

## Boundary

- Coordinate `review` and `implement`; do not replace either one.
- Keep `review` read-only. Use it only for review passes.
- Use `implement` behavior for accepted fixes.
- Never commit, push, create PRs, post comments, deploy, delete, or mutate
  external state in this normal-gated loop. Hand any requested external action
  to its owning strict workflow for a fresh gate.
- Treat `/goal` as an optional progress guard only. The loop's source of truth
  is the checkpoint JSON.

## After Match

Read [`references/flow.md`](references/flow.md), then run the checkpointed
review/fix loop.
