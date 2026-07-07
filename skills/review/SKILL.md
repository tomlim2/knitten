---
name: review
description: Run read-only single/triad reviews from a prepared packet.
match-check: loose
allowed-tools: Read, Agent
---

# Review

Use for: read-only single/triad reviews from a prepared packet.

Use when a caller has already prepared the review target, brief, changed
surface inventory, compact base context, and optional finding schema.

Prepared packet means target, scope, source citations, changed-surface context,
and enough compact context to choose role-specific review inputs are supplied.
Role review means read-only single/triad review, not target discovery or
workflow ownership.

This is a review engine, not a workflow owner. It does not discover targets,
run shell commands, write files, commit, post, push, merge, deploy, or mutate
GitHub/Linear.

## Step 0: Match Check

Confirm:

- the request is a read-only Knitten Core role review,
- the prepared packet is present and source-cited,
- mode is `single` or `triad`; use the requested mode, defaulting to `triad`,
- large raw evidence is summarized or available by artifact path unless full
  text is explicitly justified,
- no file or external mutation is expected.

Stop and ask the caller to repair the packet when:

- review target is missing,
- base review documents are missing,
- a named required document is neither readable nor included inline,
- the target or changed surface inventory is too vague to choose roles,
- the caller expects this skill to post, edit, commit, push, merge, deploy, or
  mutate external state.

Do not read detailed references until Step 0 passes.

## After Match

Read [`references/triad.md`](references/triad.md), then run the selected
read-only `single` or `triad` review. Read only caller-supplied inline content
and readable paths. Print findings for the caller to capture; do not write
durable artifacts.

Use the triad packet budget rules from the reference: every role gets the
compact shared packet, while large base documents or raw evidence are loaded
only when they are role-relevant or explicitly justified as full shared context.

Every review includes a scope-control pass: flag over-engineering, unnecessary
new dependencies, and missed reuse of existing helpers, native platform
features, or standard-library behavior when the supplied packet proves a
smaller correct path.
