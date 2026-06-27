---
name: kc-review
description: Run read-only single/triad reviews from a prepared packet.
activation-check: loose
allowed-tools: Read, Agent
---

# KC Review

Use for: read-only single/triad reviews from a prepared packet.

Use when a caller has already prepared the review target, brief, changed
surface inventory, base documents, and optional finding schema.

This is a review engine, not a workflow owner. It does not discover targets,
run shell commands, write files, commit, post, push, merge, deploy, or mutate
GitHub/Linear.

## Step 0: Activation Check

Confirm:

- the request is a read-only AH role review,
- the prepared packet is present and source-cited,
- mode is `single` or `triad`; default `triad`,
- no file or external mutation is expected.

Stop and ask the caller to repair the packet when:

- review target is missing,
- base review documents are missing,
- a named required document is neither readable nor included inline,
- the target or changed surface inventory is too vague to choose roles,
- the caller expects this skill to post, edit, commit, push, merge, deploy, or
  mutate external state.

Do not read detailed references until Step 0 passes.

## After Activation

Read [`references/triad.md`](references/triad.md), then run the selected
read-only `single` or `triad` review. Read only caller-supplied inline content
and readable paths. Print findings for the caller to capture; do not write
durable artifacts.

Every review includes a scope-control pass: flag over-engineering, unnecessary
new dependencies, and missed reuse of existing helpers, native platform
features, or standard-library behavior when the supplied packet proves a
smaller correct path.
