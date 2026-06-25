# KC Review Fix Loop Flow

This reference defines the loop body for `kc-review-fix-loop`.

## Inputs

Confirm or infer:

- target repo, branch, base ref, and changed surface,
- task key or issue id when available,
- review mode: `triad` by default, `single` for low-risk or explicit requests,
- validation commands or the nearest meaningful repository checks,
- checkpoint location or target workspace task-artifact resolver.

## Checkpoint Contract

Before each next loop, write a compact JSON checkpoint. On resume or after
compaction, read the newest checkpoint before continuing.

Prefer the target workspace's task artifact resolver when it exposes a
checkpoint artifact. For Shotloom, use `scripts/agent-task-artifact.mjs` when
that contract supports the needed artifact; otherwise write to the KC generic
checkpoint path:

```bash
<knitten-plugin-root>/bin/knitten-resolve-output \
  --skill=kc-review-fix-loop \
  --name=<loop-name> \
  --create
```

Use the `bin/knitten-resolve-output` shim for checkpoint paths. Do not call
`scripts/resolve-output.mjs` directly from a versioned Codex plugin cache; if
direct script execution is unavoidable, pass `--hub-root=<durable-knitten-root>`
or set `KNITTEN_HUB_ROOT` first.

Fill the selected path with the template at
`document-templates/agent-hub/review-fix-loop-checkpoint.json`.

The checkpoint must record:

- loop number and status: `continue`, `blocked`, or `complete`,
- review mode and target repo/branch/base/task key,
- fixed findings and remaining P1/P2 blockers,
- changed files and validation results,
- whether commit/push approval exists,
- next action and timestamp.

## Loop

1. Restore the latest checkpoint when continuing an existing loop.
2. Build a compact review packet: scope, changed files, relevant docs, base ref,
   validation evidence, and previous checkpoint summary.
3. Run `kc-review` in `triad` mode unless the user requested `single` or the
   scope is small and low-risk.
4. Merge findings. Treat P1/P2 as blockers; record P3/nits without letting them
   drive the loop.
5. If no P1/P2 blockers remain, run validation, write a `complete` checkpoint,
   and report the final state.
6. Fix accepted blockers with `kc-implement` behavior. Keep edits scoped to the
   finding evidence and required fix.
7. Run the nearest meaningful validation. Prefer fast targeted checks first,
   then broader checks when the surface is shared or user-facing.
8. Write a `continue` checkpoint with fixed findings, remaining blockers,
   changed files, validation results, and next action.
9. Repeat until the loop reaches a stop condition.

## Stop Conditions

Stop when:

- P1/P2 blockers are gone and validation passed,
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
