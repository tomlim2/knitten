---
status: completed
created: 2026-05-31
updated: 2026-06-01
owner: agent-hub
milestone: output-contract-enforcement-system
---

# Output Contract Consumer Adoption Pass

## Purpose

Prove the output contract system through one focused skill adoption pass.

The pass must update a high-repeat output-writing skill so it consumes
`agent/lib/resolve-output.mjs` output fields instead of reconstructing the same
path/template contract from prose.

## Problem

The registry, resolver, validator, and resolver fixtures now exist. The
remaining enforcement gap is consumer behavior: a skill can still name an
output id while also keeping direct path/template instructions that future
agents may edit independently.

| Failure mode | Effect |
|--------------|--------|
| Skill names an output id but still repeats direct path/template links. | The resolver stops being the single source for the output contract. |
| Skill does not state consumed resolver fields. | Review cannot tell whether the skill uses `path`, `template`, `format`, or `section`. |
| Adoption proof touches many skills. | Broad churn hides whether the contract works for one real consumer. |
| Adoption proof lacks command evidence. | A broken output row can pass prose review but fail at runtime. |

## Goals

| Goal | Requirement |
|------|-------------|
| First consumer proof | Patch exactly one high-repeat output-writing skill where existing output ids already fit. |
| Field consumption | The skill must state the resolver fields it consumes. |
| Legacy wording cleanup | Remove path/template reconstruction for the adopted output surface. |
| Resolver evidence | Include resolver commands proving the adopted output ids still return usable contracts. |
| Milestone closure path | Satisfy output-contract-enforcement-system AC4 and AC5 without broad migration. |

## Non-Goals

| Non-goal | Reason |
|----------|--------|
| Migrate every output-writing skill. | This pass proves the pattern first. |
| Add output ids. | Existing `agent-hub-spec-proposed` and `agent-hub-design-plan-section` cover the selected consumer. |
| Add registry fields. | `output-contract-minimal-fields.md` owns the forward field model. |
| Add validator-required adoption states. | This pass is consumer proof; validator escalation can follow only after the wording pattern is stable. |
| Rewrite completed historical specs that mention older field names. | Historical specs are not the active contract. |

## Current State

| Surface | State |
|---------|-------|
| `agent/config/outputs.json` | Contains `agent-hub-spec-proposed` and `agent-hub-design-plan-section` with `madeBy: ah-manage-spec`. |
| `agent/lib/resolve-output.mjs` | Returns `path`, `absolutePath`, `template`, `absoluteTemplatePath`, `format`, `writeTarget`, and section metadata. |
| `agent/skills/ah-manage-spec/SKILL.md` | Names adopted output ids, consumed resolver fields, and uses returned `path`, `template`, and `section` fields in create workflow prose. |
| `docs/milestones/output-contract-enforcement-system.md` | Marks consumer adoption proof done after this implementation. |

## Implemented Design

### Selected Consumer

| Item | Value |
|------|-------|
| Skill | `agent/skills/ah-manage-spec/SKILL.md` |
| Reason | It creates proposed specs and Design Plan sections, has existing output ids, and is a high-repeat spec authoring entry point. |
| Output ids | `agent-hub-spec-proposed`, `agent-hub-design-plan-section` |
| Adoption state after implementation | `adopted` for these two surfaces. |

### Required Skill Contract

Added a compact output-contract section to `ah-manage-spec` before create/update
workflow details.

| Output id | Command | Consumed fields |
|-----------|---------|-----------------|
| `agent-hub-spec-proposed` | `node agent/lib/resolve-output.mjs agent-hub-spec-proposed slug=<slug>` | `path`, `template`, `format` |
| `agent-hub-design-plan-section` | `node agent/lib/resolve-output.mjs agent-hub-design-plan-section slug=<slug>` | `path`, `template`, `format`, `section`, `parentOutput` |

Rules:

1. Use returned `path` as the destination.
2. Use returned `template` as the body or section shape.
3. Use returned `format` to confirm Markdown or Markdown-section handling.
4. For section outputs, use returned `section` and `parentOutput` instead of
   hardcoding the section relationship elsewhere.
5. Stop when the resolver returns `{ ok: false }` or the returned field needed
   by the workflow is missing.

### Legacy Wording Cleanup

Patched only the selected skill.

| Current wording type | Action |
|----------------------|--------|
| Direct `docs/plans/proposed/<slug>.md` destination prose | Replace with resolver `path` wording. |
| Direct `agent/document-templates/agent-hub/spec.md` workflow link | Replace with resolver `template` wording. |
| Direct Design Plan template link in workflow prose | Replace with resolver `template` and `section` wording. |
| Files table references to resolver/config | Keep; they explain dependencies, not output reconstruction. |

Do not remove lifecycle search paths. They are read/update routing rules, not
the output creation destination contract.

### Review Proof

Implementation review must check:

| Check | Pass condition |
|-------|----------------|
| Consumer field clarity | The skill names exactly which resolver fields it consumes. |
| No duplicate path/template contract | Create workflow no longer instructs agents to pair a direct destination path with a direct template path. |
| Output id fit | No new output id is added for this pass. |
| Resolver proof | Both adopted output ids resolve successfully. |
| Scope fit | No unrelated skill migration appears in the diff. |

## Execution Plan

| Step | Action | Output |
|------|--------|--------|
| 1 | Create this spec and intake. | `docs/plans/completed/output-contract-consumer-adoption-pass.md` and `docs/briefings/specs/output-contract-consumer-adoption-pass.md`. |
| 2 | Attach the spec to the milestone. | Milestone spec row links this completed spec. |
| 3 | Review the spec. | Findings addressed. |
| 4 | Implement selected consumer adoption. | Focused patch to `agent/skills/ah-manage-spec/SKILL.md`. |
| 5 | Review implementation and fix findings. | Review evidence for AC4 and AC5. |
| 6 | Complete lifecycle. | Spec moved to completed and milestone consumer adoption proof marked done. |

## Design Plan

S0 - Baseline evidence

Input:
- `agent/config/outputs.json`
- `agent/lib/resolve-output.mjs`
- `agent/skills/ah-manage-spec/SKILL.md`
- parent milestone

Output:
- Confirm selected output ids resolve.
- Confirm selected skill is the only implementation target.

Non-output:
- No skill edits.
- No registry edits.

Proof:
```bash
node agent/lib/resolve-output.mjs agent-hub-spec-proposed slug=output-contract-consumer-adoption-pass
node agent/lib/resolve-output.mjs agent-hub-design-plan-section slug=output-contract-consumer-adoption-pass
```

S1 - Skill output-contract wording

Input:
- Resolver outputs from S0.
- `ah-manage-spec` create workflow.

Output:
- Add output-contract section naming ids, commands, and consumed fields.
- Replace direct output destination/template wording in create workflow with resolver field wording.

Non-output:
- No changes to update/review/archive/delete semantics unless a sentence directly duplicates the adopted output contract.
- No new output rows.

Failure:
- Stop if the resolver cannot return a required field.

Proof:
```bash
rg -n "agent-hub-spec-proposed|agent-hub-design-plan-section|docs/plans/proposed|agent/document-templates/agent-hub/(spec|design-plan)\\.md" agent/skills/ah-manage-spec/SKILL.md
```

S2 - Validation and review

Input:
- Final skill diff.

Output:
- Validation and implementation review evidence.

Non-output:
- No broad skill migration.

Proof:
```bash
node scripts/validate-llm-first.mjs --check outputs
node scripts/validate-llm-first.mjs --check spec-lifecycle
node scripts/validate-llm-first.mjs
git diff --check
```

S3 - Completion update

Input:
- Passing implementation and review evidence.

Output:
- Move this spec to `docs/plans/completed/`.
- Update intake `spec:` path.
- Mark milestone consumer adoption proof done.

Non-output:
- Do not mark the whole milestone completed unless all acceptance criteria are explicitly satisfied.

Proof:
```bash
node scripts/validate-llm-first.mjs --check spec-lifecycle
git diff --check
```

## Validation

```bash
node agent/lib/resolve-output.mjs agent-hub-spec-proposed slug=output-contract-consumer-adoption-pass
node agent/lib/resolve-output.mjs agent-hub-design-plan-section slug=output-contract-consumer-adoption-pass
node scripts/validate-llm-first.mjs --check outputs
node scripts/validate-llm-first.mjs --check spec-lifecycle
node scripts/validate-llm-first.mjs
git diff --check
```

## Risks

| Risk | Mitigation |
|------|------------|
| The skill becomes more verbose. | Add one compact contract table and delete duplicate prose. |
| Direct lifecycle search paths are accidentally removed. | Treat lifecycle search paths as read/update routing, not output creation. |
| Adoption proof is too narrow. | Narrow is intentional; AC5 requires at least one high-repeat skill. |
| Existing completed specs use older field names. | Keep historical specs untouched; this spec follows the current minimal field model. |

## Acceptance Criteria

| ID | Criteria |
|----|----------|
| AC1 | Spec identifies `ah-manage-spec` as the selected consumer and explains why. |
| AC2 | Implementation patch states consumed resolver fields for `agent-hub-spec-proposed` and `agent-hub-design-plan-section`. |
| AC3 | Implementation patch removes direct path/template reconstruction for the adopted output creation surface. |
| AC4 | Resolver commands for both adopted output ids pass. |
| AC5 | Full repository validation and spec lifecycle validation pass. |
| AC6 | Milestone marks consumer adoption proof done only after implementation and review pass. |

## Open Decisions

None.
