---
name: triad-preflight
description: Run a lightweight role-split preflight review before full triad review.
match-check: loose
allowed-tools: Read, Agent
---

# Triad Preflight

Use for: read-only, low-cost preflight review before a full triad review or
review/fix loop.

Use when a caller wants quick findings on scope, evidence, tests, docs, paths,
or naming before spending tokens on full `review` triad work.

This skill does not replace `review` or `review-fix-loop`. It does not edit
files, run validation, commit, push, post, deploy, delete, or mutate external
state.

## Step 0: Match Check

Confirm:

- the request is for a lightweight pre-triad review,
- a compact packet or readable target paths are supplied,
- the caller wants candidate issues before a later fix or full triad pass,
- no local or external mutation is expected from this skill.

Stop and ask the caller to repair the packet when the target, scope, changed
surface, or expected output format is too vague to ground findings.

Do not read detailed references until Step 0 passes.

## After Match

Read [`references/flow.md`](references/flow.md), then run the preflight review.
