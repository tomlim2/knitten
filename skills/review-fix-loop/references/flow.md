# Review Fix Loop Flow

This reference defines the loop body for `review-fix-loop`.

After Step 0 passes, read
[`../../review/references/code-review-principles.md`](../../review/references/code-review-principles.md)
and apply its Approval Standard, Finding Priority And Loop Eligibility, Review
Navigation And Coverage, and Description Handoff sections. This flow owns only
checkpointing, implementation handoff, validation, and loop stop conditions.

## Inputs

Confirm or infer:

- target repo, branch, base ref, and changed surface,
- concise what/why context, coverage inventory, and role coverage from the
  latest full review,
- a documentation-impact inventory covering changed documentation and any
  related docs, comments, API references, contracts, specs, tests, or fixtures
  that the changed behavior may make stale,
- task key or issue id when available,
- review mode: `triad` by default, `single` for low-risk or explicit requests,
- review packet budget expectations for base documents and raw evidence:
  `shared`, `role-specific`, `artifact-only`, or `full-shared`,
- validation commands or the nearest meaningful repository checks,
- checkpoint location or target workspace task-artifact resolver.

## Checkpoint Contract

Before each next loop, write a compact JSON checkpoint. On resume or after
compaction, read the newest checkpoint before continuing.

Prefer the target workspace's task artifact resolver when it exposes a
checkpoint artifact. When that contract does not support the needed artifact,
write to the Knitten Core generic checkpoint path:

```bash
<knitten-plugin-root>/bin/knitten-resolve-output \
  --skill=review-fix-loop \
  --name=<loop-name> \
  --create
```

Use the `bin/knitten-resolve-output` shim for checkpoint paths. Do not call
`scripts/resolve-output.mjs` directly from a versioned Codex plugin cache; if
direct script execution is unavoidable, pass `--hub-root=<durable-knitten-root>`
or set `KNITTEN_HUB_ROOT` first.

Fill the selected path with the template at
`document-templates/workflow/review-fix-loop-checkpoint.json`.

The checkpoint must record:

- loop number and status: `continue`, `blocked`, or `complete`,
- review mode and target repo/branch/base/task key,
- fixed findings, remaining P0/P1/P2 blockers, and every grounded P3
  non-blocking finding from the latest full review,
- documentation coverage, including required and checked artifacts, skipped
  artifacts, and a reason when documentation is not applicable,
- merged coverage, unresolved design judgment count, readiness, and description
  refresh handoff,
- changed files and validation results,
- compact review packet budget summary and raw artifact paths used as evidence,
- whether commit/push approval exists,
- next action and timestamp.

Checkpoint schema version 2 stores each `remainingBlockers` item with canonical
`priority` and `blocker=true`. When resuming a schema-version-1 checkpoint,
preserve common target, history, changed-file, packet-budget, validation, and
approval fields. Normalize checkpoint-local `remainingBlockers.severity` to
`priority` and infer `blocker=true` only for entries already in that collection
and only when severity is P0, P1, or P2. Any other severity stops migration and
requires the fresh review without carrying that entry forward. Carry forward
durable target/history/context fields, but recompute `status`, `summary`, loop
number, coverage, design judgment, readiness, both handoffs, `nextAction`, and
`updatedAt`. Ignore the legacy `nextAction`; do not invent defaults for missing
v2 state. Run a fresh full review to reconstruct those fields, then write schema
version 2 before further implementation or validation. Do not use this
compatibility rule for arbitrary caller findings.

For that migration write, increment the legacy `loopNumber` exactly once. Set
`status=blocked` only when the reconstructed state has a non-null
`blockedHandoff`; otherwise set `status=continue` until validation passes.
Regenerate summary as `Fresh review: <N> blocker(s), coverage
<complete|incomplete>, nextAction=<literal>.`, using singular `blocker` for one.
Set `updatedAt` to the version-2 write time. The executable example in
`evals/review-checkpoints/schema-v1-migration.json` fixes these derivations.

Current schema-version-2 writes also store `nonBlockingFindings` and
`documentationCoverage`. Each non-blocking finding uses `priority=P3` and
`blocker=false`; preserve it for reporting but never use it in readiness or
automatic fix-loop selection. Documentation coverage has this shape:

```json
{
  "required": ["<path or artifact id>"],
  "checked": ["<path or artifact id>"],
  "skipped": ["<path or artifact id>"],
  "notApplicableReason": null,
  "complete": true
}
```

For applicable documentation, `complete=true` requires every required item to
be checked, no skipped item, and `notApplicableReason=null`. When no
documentation is applicable, `required`, `checked`, and `skipped` are empty and
a non-empty `notApplicableReason` is required. A schema-version-2 checkpoint
that predates these fields may be read for target and history context, but run
a fresh full review to reconstruct both fields before the next implementation
or completion write. Do not infer that no P3 or documentation issue exists.

`blockedHandoff` is separate from the description-refresh `handoff`. It is null
unless a non-local failure stops the loop, when it has this exact shape:

```json
{
  "owner": "<workflow, operator, or system that can act>",
  "requiredAction": "<specific external or privileged correction>",
  "reason": "<grounded reason the local loop cannot act>"
}
```

`status=blocked` requires a non-null `blockedHandoff`, at least one remaining
blocker, `ready=false`, and `nextAction=fix`. Every non-blocked checkpoint keeps
`blockedHandoff=null`.

## Loop

1. Restore the latest checkpoint when continuing an existing loop.
2. Build a compact review packet: scope, changed files, shared compact docs,
   role-specific docs, artifact-only raw evidence summaries and paths, any
   justified full-shared docs, base ref, validation evidence, previous
   checkpoint summary, and the documentation-impact inventory. Search nearby
   source comments, API docs, contracts, specs, tests, and fixtures when the
   changed behavior could make them stale even if those files were not edited.
3. Run `review` in `triad` mode unless the user requested `single` or the
   scope is small and low-risk. In triad mode, assign at least one role an
   explicit documentation-and-maintainability lens. In single mode, the one
   role owns that lens.
4. Merge every grounded P0-P3 finding. Require caller schemas to be fully
   normalized to P0-P3 plus `blocker` before generic loop entry. Select only
   P0-P2 findings with `blocker=true`; store every P3 Optional/Nit/FYI item in
   `nonBlockingFindings` with `blocker=false`, including an empty array when no
   P3 is found.
5. Reconcile documentation coverage. A role may claim its assigned changed
   surface as checked only after assessing documentation impact. Treat stale or
   missing documentation required for correct use, contracts, or maintenance
   as a P2 blocker. Treat wording, local clarity, and optional polish as P3.
   Record a reason when documentation is not applicable; never infer
   non-applicability from an empty inventory.
6. Reconcile coverage and readiness using the canonical calculation. If design
   judgment remains, stop with `nextAction=ask`. If coverage is incomplete and
   blockers are clear, repair the packet or run another read-only review pass
   with `nextAction=review`.
7. Only when `ready=true`, run validation. Write a `complete` checkpoint only
   when readiness is true and validation passes.
8. When validation fails, normalize each actionable failure as a P2 finding
   with `blocker=true`, command/output evidence, the expected validation rule,
   impact, and the smallest corrective outcome. Write `status=continue`,
   `ready=false`, and `nextAction=fix` before implementation. When no local
   corrective action exists, preserve the normalized blocker, write
   `status=blocked` and `nextAction=fix`, fill `blockedHandoff` with its owner,
   required action, and reason, and stop instead of looping without a target.
9. Fix accepted blockers with `implement` behavior. Keep edits scoped to the
   finding evidence and required fix.
10. Run the nearest meaningful validation, including repository documentation
   checks when documentation or documented behavior is affected. Prefer fast
   targeted checks first, then broader checks when the surface is shared or
   user-facing.
11. Write a `continue` checkpoint with fixed findings, remaining blockers,
   non-blocking P3 findings, documentation coverage, merged coverage, design
   judgment, handoff, changed files, validation results, and next action.
12. Repeat until the loop reaches a stop condition.

Do not copy every readable base document, raw trace, connector response, or
validation log into every role prompt by default. Keep large evidence as
artifact paths plus compact summaries unless exact text is needed to ground a
specific finding or the packet justifies it as `full-shared`.

## Stop Conditions

Stop when:

- readiness is true and validation passed,
- a user decision is required,
- the next required action would commit, push, post, deploy, delete, or mutate
  external state without explicit approval,
- the checkpoint cannot be recovered and the target cannot be reconstructed
  safely from repository state.

## Output

Report briefly:

- current loop number and status,
- fixed findings,
- remaining blockers,
- non-blocking P3 findings, including an explicit `none` when empty,
- documentation artifacts checked or the non-applicability reason,
- validation commands and results,
- checkpoint path,
- next action.
