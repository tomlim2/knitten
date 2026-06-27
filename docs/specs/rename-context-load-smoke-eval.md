# Rename Context Load Smoke Eval

## Status

Accepted.

## Goal

Rename the active KC smoke eval from `routing-smoke` to `context-load-smoke`
so the eval matches the current Core + Adapter direction and measures gated
context loading rather than presenting routing as the product claim.

## Problem

The milestone now describes a context-load/token-efficiency direction, but the
active runner and fixture paths still use routing names:

- `scripts/run-context-load-smoke-eval.mjs`
- `evals/context-load-smoke/*.json`
- `.agent-local/ah/evals/context-load-smoke/latest.json`

That keeps active tooling framed around routing even though the useful evidence
is about match surfaces, reject behavior, reference precision, safety
gates, and estimated context savings.

## Boundary

In scope:

- Rename the canonical runner to `scripts/run-context-load-smoke-eval.mjs`.
- Rename canonical fixtures to `evals/context-load-smoke/*.json`.
- Rename the local report path to `.agent-local/ah/evals/context-load-smoke/latest.json`.
- Keep `scripts/run-context-load-smoke-eval.mjs` as a compatibility wrapper if small.
- Update active docs and result summaries to use context-load wording.
- Update repository shell validation to allow the new fixture path.

Out of scope:

- Change the deterministic classifier logic or thresholds.
- Rebuild the eval dataset.
- Delete historical routing smoke implementation specs in this pass.
- Change the output/path runtime registry names.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `scripts/run-context-load-smoke-eval.mjs` | Yes | Current deterministic eval runner. |
| `evals/context-load-smoke/cases.json` | Yes | Current request-case fixture. |
| `evals/context-load-smoke/activation-surfaces.json` | Yes | Current match surface fixture. |
| `docs/specs/context-load-smoke-eval.md` | Yes | Current eval plan. |
| `docs/specs/context-load-smoke-eval-result.md` | Yes | Current reviewed result summary. |
| `scripts/validate-repository-shell.mjs` | Yes | Allows committed eval fixture paths. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| `scripts/run-context-load-smoke-eval.mjs` | durable | Canonical deterministic context-load smoke eval runner. |
| `scripts/run-context-load-smoke-eval.mjs` | durable | Compatibility wrapper for older commands. |
| `evals/context-load-smoke/cases.json` | durable | Canonical request cases. |
| `evals/context-load-smoke/activation-surfaces.json` | durable | Canonical activation-surface fixture. |
| Updated docs/specs | durable | Active docs use context-load wording and paths. |

## Contract

- The new runner must produce the same pass/fail behavior as the old runner.
- The old runner command must still work as a wrapper.
- The report JSON can keep internal metric fields only where compatibility is
  useful, but user-facing labels should prefer match/context-load wording.
- Repository shell validation must allow `evals/context-load-smoke/*.json`.
- Historical docs may keep old names if clearly historical.

## Plan

1. Move canonical files:
   - Move the runner to `scripts/run-context-load-smoke-eval.mjs`.
   - Move fixtures to `evals/context-load-smoke/`.
   - Update constants and usage text.

2. Keep compatibility:
   - Add `scripts/run-context-load-smoke-eval.mjs` as a short wrapper.
   - Keep wrapper behavior for `--report` and `--print-json`.

3. Update docs:
   - Rename or reword active eval plan/result docs where practical.
   - Update MILESTONE links if they point at old canonical names.
   - Do not rewrite unrelated historical specs beyond necessary path pointers.

4. Update validation:
   - Allow `evals/context-load-smoke/*.json` in repository shell validation.
   - Run both new and compatibility runner commands.

5. Validate:
   - `node --check scripts/run-context-load-smoke-eval.mjs`
   - `node scripts/run-context-load-smoke-eval.mjs --report`
   - `node scripts/run-context-load-smoke-eval.mjs --print-json`
   - `node scripts/validate-repository-shell.mjs`
   - `node scripts/doctor.mjs`
   - plugin manifest validation
   - `git diff --check`

## Acceptance Criteria

- Canonical runner and fixtures use `context-load-smoke`.
- Compatibility runner still passes.
- The local report path uses `context-load-smoke`.
- Active docs no longer present the eval as proof of routing as a product
  direction.
- Validation passes.

## Open Questions

- None.

## Review Plan

- Spec review: verify the rename avoids broad historical rewrites.
- Implementation review: verify old and new commands produce passing reports
  and docs point to the canonical context-load names.
