---
status: completed
created: 2026-05-31
updated: 2026-05-31
owner: agent-hub
milestone: output-contract-enforcement-system
---

# Output Contract Minimal Fields

## Purpose

Define the minimal forward shape for `agent/config/outputs.json`: `madeBy`,
`writeTarget`, `args`, `template`, `format`, and optional `formatOptions`.

## Problem

The previous output registry mixed path ownership, output shape, validation
selection, and post-write handling in one row. That made agents choose extra
fields instead of letting the validator infer checks from the output structure.

## Goals

| Goal | Requirement |
|------|-------------|
| Production source | Add `madeBy` to each reusable output row. |
| Write target grouping | Move target-specific fields under `writeTarget`. |
| Structure-based validation | Let `validate-llm-first --check outputs` infer checks from row shape. |
| Media-ready format detail | Allow optional `formatOptions` without requiring it for Markdown or JSON rows. |
| Field cleanup | Remove `verifyWith`, `afterWrite`, `shapeKind`, `outputType`, and `outputProfile` from the forward model. |

## Non-Goals

| Non-goal | Reason |
|----------|--------|
| Add explicit validator check ids to each row. | The validator can infer required checks from `writeTarget`, `format`, `template`, and `madeBy`. |
| Add explicit after-write policy to each row. | Current handling is implied by `writeTarget.kind`; add a field only when a real exception appears. |
| Migrate historical completed specs. | Completed specs preserve earlier design history. |
| Add broad image or video outputs now. | This slice only keeps the registry shape ready for them through `format` and optional `formatOptions`. |

## Current State

| Surface | State |
|---------|-------|
| `agent/config/outputs.json` | Uses `madeBy`, `writeTarget`, `args`, `template`, and `format`. |
| `agent/lib/resolve-output.mjs` | Lists available output ids and returns resolved paths plus `madeBy`, `writeTarget`, `template`, `format`, and compatibility `locationKind`. |
| `scripts/validate-llm-first.mjs --check outputs` | Infers checks from registry structure and rejects removed fields. |

## Forward Shape

| Field | Rule |
|-------|------|
| `id` | Existing kebab-case output id. |
| `description` | Existing short purpose. |
| `madeBy` | Existing skill name or `workflow:<kebab-case-id>`. Skill names must resolve to `agent/skills/<name>/SKILL.md`; workflow ids are pattern-checked until a workflow registry exists. |
| `writeTarget.kind` | `repo-template`, `document-section`, `local-artifact`, or `doc-path`. |
| `writeTarget.path` | Required for `repo-template`. |
| `writeTarget.parentOutput` and `writeTarget.section` | Required for `document-section`. |
| `writeTarget.localArtifactTokens` | Required for `local-artifact`. |
| `writeTarget.docPurpose` | Required for `doc-path`. |
| `args` | Declares placeholders used by the write target or parent output. |
| `format` | Existing format plus future-safe media/export values. |
| `formatOptions` | Optional object for dimensions, fps, codec, color space, page size, or aspect ratio. |
| `template` | Required only when the output has a Markdown or JSON body template. |

## Removed Fields

| Field | Replacement |
|-------|-------------|
| `verifyWith` | Validator infers checks from row structure. |
| `afterWrite` | Handling is inferred from `writeTarget.kind` until an exception exists. |
| `shapeKind` | `format`, optional `formatOptions`, and `template`. |
| `outputType` | Do not add; use `format` and optional `formatOptions`. |
| `outputProfile` | Do not add; use explicit fields. |
| Top-level target fields | Move under `writeTarget`. |

## Initial Row Mapping

| Output id | `madeBy` | `writeTarget.kind` | `format` |
|-----------|----------|--------------------|----------|
| `local-session-handoff` | `workflow:agent-hub-session-handoff` | `local-artifact` | `json` |
| `agent-hub-spec-proposed` | `ah-manage-spec` | `repo-template` | `markdown` |
| `agent-hub-design-plan-section` | `ah-manage-spec` | `document-section` | `markdown-section` |

## Execution Plan

| Step | Action | Output |
|------|--------|--------|
| 1 | Migrate `outputs.json` rows to `madeBy` and `writeTarget`. | Registry rows use the minimal forward model. |
| 2 | Update `resolve-output.mjs` to list outputs, read `writeTarget`, and return minimal contract fields. | Resolver smoke commands return resolved path data plus `madeBy`, `writeTarget`, `template`, and `format`. |
| 3 | Update `validate-llm-first` output checks. | Validator rejects missing `madeBy`, invalid `writeTarget`, stale removed fields, bad `formatOptions`, broken parent outputs, and missing templates. |
| 4 | Validate. | `outputs` check, resolver smoke commands, syntax checks, and full validation pass. |

## Validation

```bash
node --check agent/lib/resolve-output.mjs
node --check scripts/validate-llm-first.mjs
node scripts/validate-llm-first.mjs --check outputs
node agent/lib/resolve-output.mjs --list
node agent/lib/resolve-output.mjs agent-hub-spec-proposed slug=test-spec
node agent/lib/resolve-output.mjs agent-hub-design-plan-section slug=test-spec
node agent/lib/resolve-output.mjs local-session-handoff date=20260531 slug=test-handoff
node scripts/validate-llm-first.mjs
git diff --check
```

## Risks

| Risk | Mitigation |
|------|------------|
| Workflow `madeBy` ids are typo-prone. | Pattern-check now; add a workflow registry only when workflows become durable artifacts. |
| Historical specs still mention `locationKind`, `shapeKind`, `verifyWith`, or `afterWrite`. | Treat completed specs as historical records; use this completed spec as the forward contract. |
| Media options grow too early. | Keep `formatOptions` optional and validate only object shape in this slice. |

## Acceptance Criteria

| ID | Criteria |
|----|----------|
| AC1 | `outputs.json` rows no longer use top-level `locationKind`, top-level path target fields, `shapeKind`, `verifyWith`, or `afterWrite`. |
| AC2 | Resolver lists available output ids and returns `madeBy`, `writeTarget`, `template`, `format`, and optional `formatOptions`. |
| AC3 | Output validator rejects missing `madeBy`, bad `writeTarget`, stale removed fields, bad `formatOptions`, missing templates, and broken parent outputs. |
| AC4 | Existing resolver smoke commands still return the same resolved paths. |
| AC5 | Full repository validation passes. |

## Open Decisions

| Decision | Default |
|----------|---------|
| Should `writeTarget.kind` keep compatibility with old `locationKind` in resolver output? | Return compatibility `locationKind` for now; new callers should read `writeTarget.kind`. |
| Should output contracts add explicit verification fields later? | No current need. Add only for a real output whose validation cannot be inferred from structure. |
