---
status: completed
created: 2026-05-31
updated: 2026-05-31
owner: agent-hub
milestone: output-contract-enforcement-system
---

# Output Contract Validator Enforcement

## Purpose

Make `scripts/validate-llm-first.mjs --check outputs` the enforcement point for
the minimal output contract model.

## Problem

`agent/config/outputs.json` now has a small forward shape: `madeBy`,
`writeTarget`, `args`, `template`, `format`, and optional `formatOptions`.
The validator already checks much of this shape, but the enforcement boundary is
not yet documented as a focused implementation slice. Without that boundary,
future work can reintroduce removed fields, add weak workflow producer names, or
mix adoption proof into the wrong task.

## Goals

| Goal | Requirement |
|------|-------------|
| Structure enforcement | Validator fails on invalid minimal output contract rows. |
| Removed field enforcement | Validator fails on `verifyWith`, `afterWrite`, `shapeKind`, `outputType`, `outputProfile`, and legacy top-level target fields. |
| Producer enforcement | Validator fails on missing skill `madeBy`; workflow `madeBy` remains pattern-checked. |
| Target enforcement | Validator fails on invalid `writeTarget.kind`, unsafe paths, bad local artifact tokens, bad doc path purpose, and broken document-section parents. |
| Template and arg enforcement | Validator fails on missing required templates, unsafe templates, undeclared placeholders, duplicate args, and unused args where applicable. |
| Boundary clarity | Adoption-state validation is specified as a narrow optional field decision, not broad skill migration. |

## Non-Goals

| Non-goal | Reason |
|----------|--------|
| Add explicit `verifyWith`. | Checks are inferred from row structure. |
| Add `afterWrite`. | Post-write handling is inferred from `writeTarget.kind` until a real exception exists. |
| Add a workflow registry. | Current workflow values are namespaced ids, not durable workflow artifacts. |
| Migrate skill consumers. | Consumer adoption is handled by `output-contract-consumer-adoption-pass.md`. |
| Add full resolver fixture suite. | Deep resolver success/failure fixtures remain in `output-contract-resolver-fixtures.md`. |

## Current State

| Surface | State |
|---------|-------|
| `agent/config/outputs.json` | Contains three minimal output rows. |
| `scripts/validate-llm-first.mjs` | Has `checkOutputs()` with structure, target, template, local artifact, parent-output, stale field, strict template root, and `--outputs-fixture` checks. |
| `agent/lib/resolve-output.mjs` | Resolves current rows and lists output ids. |
| `docs/plans/completed/output-contract-minimal-fields.md` | Defines removed fields and forward shape. |
| `docs/milestones/output-contract-enforcement-system.md` | Leaves enforcement validator, consumer adoption proof, and resolver fixtures as follow-up slices. |

## Implemented Design

### Enforcement Classes

| Class | Validator behavior | Scope |
|-------|--------------------|-------|
| Registry shape | `schemaVersion` is `1`; `entries` is non-empty; ids are kebab-case and unique. | Current slice. |
| Removed fields | Fail if row contains `verifyWith`, `afterWrite`, `shapeKind`, `outputType`, `outputProfile`, or legacy top-level target fields. | Current slice. |
| Producer | Fail if `madeBy` is missing, if a skill producer lacks `agent/skills/<name>/SKILL.md`, or if a workflow producer is not `workflow:<kebab-case-id>`. | Current slice. |
| Write target | Fail on unknown `writeTarget.kind` or missing kind-specific fields. | Current slice. |
| Safe path | Fail on absolute paths, `..`, non-normalized repo paths, or bad doc path purpose. | Current slice. |
| Template | Fail on missing required body templates or template paths outside `agent/document-templates/**`. | Current slice. |
| Args | Fail on duplicate arg names, invalid arg names, placeholders not declared in `args`, and unused args except document-section child args used by parent. | Current slice. |
| Parent output | Fail if `document-section` parent is missing, another section, or has incompatible args. | Current slice. |
| Adoption state | Not introduced in this slice. | Deferred to consumer adoption work. |

### Adoption-State Decision

No `adoptionState` field was added. Consumer adoption and any adoption-state
proof remain in `output-contract-consumer-adoption-pass.md`.

### Error Message Contract

Validator messages should tell the next agent which fix class applies:

| Case | Message shape |
|------|---------------|
| target field in old location | `must move <field> under writeTarget or remove it` |
| removed field | `must remove stale field <field>` |
| missing producer | `madeBy must be an existing skill name or workflow:<kebab-case-id>` |
| broken parent | `parentOutput does not exist` or `parentOutput must be a file output` |
| unsafe path | `writeTarget.path must be a safe repo-relative path` |

## Design Plan

S0 - Baseline re-check

Input:
- `agent/config/outputs.json`
- `scripts/validate-llm-first.mjs`
- `docs/plans/completed/output-contract-minimal-fields.md`

Output:
- Confirm current validator passes current registry.
- Confirm no forward-row field requires `verifyWith` or `afterWrite`.

Non-output:
- No source edits.

Failure:
- Stop and report baseline failure before changing validator behavior.

Proof:
- `node scripts/validate-llm-first.mjs --check outputs`
- `node agent/lib/resolve-output.mjs --list`

S1 - Enforcement gap patch

Input:
- Current `checkOutputs()` implementation.
- Enforcement Classes table.

Output:
- Validator checks every current-slice class.
- Error messages separate moved legacy fields from removed stale fields.

Non-output:
- No consumer skill migration.
- No workflow registry.
- No explicit `verifyWith` or `afterWrite` field.

Failure:
- If a check needs broader semantics than the minimal model, leave it for a
  follow-up spec and record the boundary in this spec.

Proof:
- `node --check scripts/validate-llm-first.mjs`
- `node scripts/validate-llm-first.mjs --check outputs`

S2 - Negative validation proof

Input:
- Current validator.
- Temporary mutated registry fixture or test harness.

Output:
- `--outputs-fixture` lets the outputs check validate a temporary registry copy.
- Representative broken rows fail without committing a broken registry.

Non-output:
- No committed broken registry.
- No broad resolver fixture suite.

Failure:
- If a fixture harness is too large for this slice, add one targeted script path
  to `output-contract-resolver-fixtures.md` and keep this slice limited to
  validator behavior.

Proof:
- Temporary `outputs.json` copy with stale fields, invalid template root, and
  broken `parentOutput` fails as expected.

S3 - Docs and milestone update

Input:
- This spec.
- Parent milestone.

Output:
- Milestone row marks enforcement validator as done.
- This spec moves to completed.

Non-output:
- Do not close consumer adoption or resolver fixture rows.

Failure:
- If validation remains partial, mark implementation as partial and keep
  milestone row active.

Proof:
- `node scripts/validate-llm-first.mjs`
- `git diff --check`

## Validation

```bash
node --check scripts/validate-llm-first.mjs
node scripts/validate-llm-first.mjs --check outputs
node agent/lib/resolve-output.mjs --list
node scripts/validate-llm-first.mjs
git diff --check
```

Focused negative proof:

```bash
tmp=$(mktemp -t outputs-fixture.XXXXXX.json)
node -e 'const fs=require("fs"); const p=process.argv[1]; const data=JSON.parse(fs.readFileSync("agent/config/outputs.json","utf8")); data.entries[0].verifyWith=["outputs"]; data.entries[0].outputType="document"; data.entries[0].shapeKind="file"; data.entries[1].template="docs/plans/completed/output-contract-minimal-fields.md"; data.entries[2].writeTarget.parentOutput="missing-parent"; fs.writeFileSync(p, JSON.stringify(data, null, 2));' "$tmp"
if node scripts/validate-llm-first.mjs --check outputs --outputs-fixture "$tmp"; then
  echo "expected output fixture validation to fail"
  rm -f "$tmp"
  exit 1
fi
rm -f "$tmp"
```

Expected result: the wrapped command exits zero only after the fixture validator
reports stale field, template root, and parent-output violations.

## Risks

| Risk | Mitigation |
|------|------------|
| Validator becomes an output design language. | Keep explicit checks tied to the minimal field model. |
| Adoption validation expands into broad skill migration. | Only define optional adoption state; keep consumer migration in the consumer adoption spec. |
| Workflow producer ids imply nonexistent artifacts. | Keep workflow producer validation pattern-only until a workflow registry exists. |
| Negative fixtures duplicate resolver fixture work. | Add only targeted validator proof here; leave resolver runtime matrix to the fixture spec. |

## Acceptance Criteria

| ID | Criteria |
|----|----------|
| AC1 | `checkOutputs()` fails on every removed field named by `output-contract-minimal-fields.md`. |
| AC2 | `checkOutputs()` fails on missing or invalid `madeBy`, with skill producers verified by file existence and workflow producers pattern-checked. |
| AC3 | `checkOutputs()` fails on invalid `writeTarget.kind`, missing kind-specific fields, unsafe repo paths, broken local artifact tokens, and bad doc path purpose. |
| AC4 | `checkOutputs()` fails on missing required templates, unsafe template paths, undeclared placeholders, duplicate args, and invalid parent-output links. |
| AC5 | No adoption-state logic was introduced by this slice. |
| AC6 | Validation commands pass on the current registry, and the negative fixture proof shows broken rows fail. |

## Open Decisions

| Decision | Default |
|----------|---------|
| Should this slice add `adoptionState` now? | No. |
| Should this slice add a general fixture harness? | No. Added only targeted `--outputs-fixture` proof; keep broad resolver fixtures separate. |
| Should workflow `madeBy` resolve to a durable artifact? | No. Pattern-check workflow ids until a workflow registry exists. |
