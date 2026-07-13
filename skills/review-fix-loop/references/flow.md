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
- fixed findings and remaining P0/P1/P2 blockers,
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
   justified full-shared docs, base ref, validation evidence, and previous
   checkpoint summary.
3. Run `review` in `triad` mode unless the user requested `single` or the
   scope is small and low-risk.
4. Merge findings. Require caller schemas to be fully normalized to P0-P3 plus
   `blocker` before generic loop entry. Select only P0-P2 findings with
   `blocker=true`; record P3 Optional/Nit/FYI items without letting them drive
   the loop.
5. Reconcile coverage and readiness using the canonical calculation. If design
   judgment remains, stop with `nextAction=ask`. If coverage is incomplete and
   blockers are clear, repair the packet or run another read-only review pass
   with `nextAction=review`.
6. Only when `ready=true`, run validation. Write a `complete` checkpoint only
   when readiness is true and validation passes.
7. When validation fails, normalize each actionable failure as a P2 finding
   with `blocker=true`, command/output evidence, the expected validation rule,
   impact, and the smallest corrective outcome. Write `status=continue`,
   `ready=false`, and `nextAction=fix` before implementation. When no local
   corrective action exists, preserve the normalized blocker, write
   `status=blocked` and `nextAction=fix`, fill `blockedHandoff` with its owner,
   required action, and reason, and stop instead of looping without a target.
8. Fix accepted blockers with `implement` behavior. Keep edits scoped to the
   finding evidence and required fix.
9. Run the nearest meaningful validation. Prefer fast targeted checks first,
   then broader checks when the surface is shared or user-facing.
10. Write a `continue` checkpoint with fixed findings, remaining blockers,
   coverage, design judgment, handoff, changed files, validation results, and
   next action.
11. Repeat until the loop reaches a stop condition.

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
- validation commands and results,
- checkpoint path,
- next action.
