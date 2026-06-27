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

## Step 0: Match Check

Confirm:

- the request needs repeated review, fix, validation, and checkpointing,
- the target workspace is writable and identifiable,
- review mode is `single` or `triad`, defaulting to `triad`,
- mutation is limited to local files unless the user explicitly approved an
  exact external action.

Stop and ask for the smallest missing item when the target, review packet, or
writable workspace cannot be inferred safely.

Do not read detailed references until Step 0 passes.

## Boundary

- Coordinate `review` and `implement`; do not replace either one.
- Keep `review` read-only. Use it only for review passes.
- Use `implement` behavior for accepted fixes.
- Do not commit, push, create PRs, post comments, deploy, delete, or mutate
  external state unless the user explicitly asks for that exact action.
- Treat `/goal` as an optional progress guard only. The loop's source of truth
  is the checkpoint JSON.

## After Match

Read [`references/flow.md`](references/flow.md), then run the checkpointed
review/fix loop.
