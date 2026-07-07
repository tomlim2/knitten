# Context Artifact-First Harness

## Status

Accepted direction.

This is an architecture decision, not a measurement report. Token counts,
benchmark results, and current exposure numbers belong in separate specs or
result notes.

## Context

Knitten exists to keep Codex workflow context small, explicit, and recoverable
without becoming a larger agent runtime. The core already owns shared workflow
contracts, output paths, validation, and plugin boundaries. Domain plugins own
domain behavior and detailed workflow interpretation.

Long-running work and tool-heavy triage often produce more evidence than the
model needs to keep in the active conversation. Shell logs, GitHub/Linear
responses, PR inventories, review packets, and repeated status checks are useful
as evidence, but harmful when every raw result remains in the working context.

The harness needs a structural rule for this class of work: preserve evidence,
but keep the active context focused on the current decision.

## Decision

Knitten will treat active model context as a working set, not as durable task
memory.

High-volume tool results and external-system evidence should be stored as local
artifacts. The active conversation should carry only the compact summary, the
artifact path, the decision state, and the next action.

Knitten Core owns the generic artifact-and-summary contract. Domain plugins own
domain-specific collectors, labels, and interpretation.

## Principles

- Preserve raw evidence outside the active conversation when it may need to be
  rechecked.
- Put only decision-relevant summaries back into the active conversation.
- Prefer stable artifact paths over transcript memory for resume and handoff.
- Keep Knitten Core generic: it defines artifact shape and boundary rules, not
  Shotloom, Linear, GitHub, or other domain semantics.
- Let domain plugins implement compact collectors for repeated workflows.
- Keep mutation, publication, deletion, deployment, and external posting behind
  explicit user approval gates.
- Avoid broad retrieval infrastructure until simple artifact contracts and one
  workflow pilot prove insufficient.

## Registered Artifact Shape

For tool-heavy or long-running work, Knitten Core registers a run-local
artifact folder:

```text
.agent-local/workflow/runs/<run-id>/
  raw/
  summary.md
  handoff.json
  next.md
```

The shape is intentionally small:

| Path | Purpose |
|------|---------|
| `raw/` | Full tool outputs, downloaded records, command logs, or connector snapshots. |
| `summary.md` | Human-readable compact state and evidence summary. |
| `handoff.json` | Machine-readable state needed to resume the workflow. |
| `next.md` | Current next action, blocker, or decision request. |

Workflows may add domain-owned files under the run folder, but they should not
replace the generic summary, handoff, or next-action files.

The shape is registered through the `workflow/runs` local artifact entries and
the `workflow-run-*` output ids. Skills and workflow scripts should resolve
these paths through `KNITTEN_PATH_BIN artifact` or `KNITTEN_PATH_BIN output`
instead of hard-coding the physical path.

## Skill Behavior

Skills and domain workflows should use this pattern when a task is likely to
produce large or repeated tool output:

1. Gather raw evidence through the relevant tool or script.
2. Store raw evidence in the run artifact folder.
3. Summarize only the decision-relevant facts into `summary.md`.
4. Record resume state in `handoff.json`.
5. Record the immediate next action in `next.md`.
6. Return the compact summary and artifact paths to the user.

Small tool outputs may stay in the active conversation. The contract applies
when raw output would crowd out useful working context or would be expensive to
re-read from chat.

## Collector Boundary

Knitten Core may provide:

- artifact path resolution,
- common file shape templates,
- validation that generic artifact paths are safe and ignored,
- warning-level checks for obvious skill-shape drift,
- documentation for when to summarize instead of carrying raw output.

Domain plugins may provide:

- workflow-specific collectors,
- source-specific normalization,
- domain-specific summaries,
- domain-specific validation and readiness checks.

Domain collectors should return compact summaries and artifact paths. They
should avoid making Knitten Core know domain-specific issue labels, PR states,
deployment semantics, or product workflows.

The first Core pilot is `scripts/run-compact-collector-pilot.mjs`. Its
`knitten-health` preset captures the repeated local validation workflow as raw
command artifacts, then returns only compact summary, handoff, next-action, and
evidence paths. Domain plugins can reuse the same artifact contract while owning
their own source-specific collectors.

## Review And Subagent Boundary

Review and triad workflows should treat review packets as compact inputs, not as
unbounded bundles.

Role-specific subagents should receive the smallest packet that preserves their
review responsibility. Full raw evidence should be available by artifact path
when needed, but it should not be copied into every role prompt by default.

The parent workflow should keep merged findings, residual risks, and artifact
paths. It should not need to keep every role's full raw trace in active context.

## Non-Goals

- No vector database or retrieve-and-rerank system in this decision.
- No custom compaction engine.
- No model-specific prompt tuning framework.
- No rewrite of every existing skill.
- No broad domain-plugin migration without a separate accepted target list.
- No guarantee that every task uses fewer tokens.

## Consequences

Positive:

- Long-running work can survive compaction and session boundaries more reliably.
- Raw evidence remains reviewable without occupying active context.
- Domain plugins can improve repeated workflows without growing Knitten Core.
- Review and triage workflows can become more repeatable and less transcript
  dependent.

Trade-offs:

- Workflows need artifact hygiene and clear cleanup rules.
- Summaries can omit important details if the collector is careless.
- Local artifacts are operational evidence, not source-controlled product docs.
- Some workflows will still need full raw context when the evidence is small,
  ambiguous, or user-facing.

## Adoption Path

1. Update review/triad guidance to prefer compact packets and role-specific
   context.
2. Revisit domain-plugin exposure only after the pilot proves the pattern.

## Acceptance Criteria

- The artifact-first rule is documented without importing domain semantics into
  Knitten Core.
- At least one repeated workflow can store raw evidence locally and resume from
  compact summary plus handoff state.
- The active conversation for that pilot can report artifact paths instead of
  carrying every raw tool result forward.
- Existing Knitten Core validation still passes.
- No RAG, custom compaction engine, or broad plugin migration is introduced by
  this decision.
