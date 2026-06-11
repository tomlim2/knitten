---
name: kc-review
description: Run read-only single/triad reviews from a prepared packet.
activation-check: loose
allowed-tools: Read, Agent
---

# KC Review

Use when a caller has already prepared a compact review packet and wants a
read-only single-role or three-role review pass.

This is a review engine, not a workflow owner. It does not discover
repositories, run shell commands, edit files, commit, post comments, push,
merge, deploy, or mutate GitHub/Linear. Caller workflows own target discovery,
diff generation, guideline loading, output persistence, fixes, PR payloads, and
external mutation.

## Input

- Review target: already materialized diff/content, or a readable path to a
  prepared artifact.
- Review brief: purpose, changed behavior, touched surfaces, non-goals.
- Changed surface inventory: paths/artifacts, surfaces, primary consumers, and
  risks.
- Base review documents: readable paths, inline excerpts, or both.
- Optional caller finding schema.
- Optional role constraints.
- Optional mode: `single` or `triad`. Default is `triad`.

If no caller schema is supplied, use the default finding schema in
[`references/triad.md`](references/triad.md).

## Output

- Role selection.
- One role report in `single` mode or three role reports in `triad` mode.
- Merged findings.
- Residual risk notes.

The default output is printed for the caller to capture. This skill does not
write durable artifacts.

## Step 0: Activation Check

Confirm the request is a read-only AH role review, the review packet is present,
the requested mode is `single` or `triad`, and no caller expects this skill to
mutate files or external state.

Stop and ask the caller to repair the packet when:

- review target is missing,
- base review documents are missing,
- a named required document is neither readable nor included inline,
- the target or changed surface inventory is too vague to choose roles,
- the caller expects this skill to post, edit, commit, push, merge, deploy, or
  mutate external state.

If the caller needs a custom finding schema, it must be included; otherwise use
the default AH finding schema.

## Workflow

1. Read [`references/triad.md`](references/triad.md).
2. Confirm the review target is already materialized as inline content or a
   readable path. Do not run `git diff`, fetch PRs, inspect branches, or
   discover repositories.
3. Read only caller-provided readable paths and inline content. Do not broaden
   context on your own.
4. Select roles using the reference's Role Selection rules: one role for
   `single`, or exactly three roles for `triad`.
5. Print the role selection with a one-line reason for each role.
6. Run the selected read-only role reviews. Use `Agent` when available;
   otherwise run the same role reviews sequentially in the primary context and
   state that limitation in residual risk.
7. Give every role the same base review packet before applying its role lens.
8. Require every role prompt to include the read-only subagent contract from the
   reference.
9. Merge role reports using the reference's Merge Rules.
10. Print merged findings in the caller schema, or the default AH finding
    schema when no caller schema is supplied.

## Rules

- The Review Brief is a navigation index, not finding evidence.
- Findings must cite the target, diff/content, spec, or supplied review
  documents.
- Suppress weak, speculative, or unanchored findings.
- Preserve role disagreement as `needs-design-judgment` or the closest
  equivalent caller-schema field.
- Role subagents are read-only reviewers. They must not edit files, run
  mutation commands, post comments, push, merge, deploy, call GitHub/Linear
  mutation APIs, or change local/external state.

## Path Handling

Read only paths explicitly supplied in the review packet. If a path is missing
or unreadable, report the missing source and stop before role dispatch.
