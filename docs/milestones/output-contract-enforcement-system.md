---
status: active
created: 2026-05-31
updated: 2026-06-01
owner: agent-hub
target-date:
---

# Output Contract Enforcement System

## Purpose

Turn the existing output contract registry from a path/template resolver into an
enforced operating contract for `madeBy`, `writeTarget`, and skill adoption.

The completed `output-contract-system` milestone proves the first registry,
resolver, validator hook, and consumer. This milestone tracks the follow-up that
makes output contracts difficult to bypass during future skill work.

## Scope

| In scope | Out of scope |
|---|---|
| Add `madeBy` metadata and group target-specific fields under `writeTarget`. | Replacing existing path owners or creating one path mega-resolver. |
| Strengthen validator checks for output registry rows, parent outputs, templates, and `madeBy` references. | Generating output bodies automatically. |
| Prove adopted skills consume resolver fields instead of reconstructing path/template pairs from prose. | Migrating every historical skill in one pass. |
| Add focused resolver failure fixtures or tests. | Moving existing templates or existing post-write policy specs. |
| Clarify adoption states for available, adopted, required, and deferred outputs. | Treating every unique repo path as an output contract. |

## Specs

| Spec | Status | Role |
|------|--------|------|
| [output-contract-minimal-fields.md](../plans/completed/output-contract-minimal-fields.md) | completed | Define the minimal registry fields for the skill or workflow that creates the output and the write target shape. |
| [output-contract-validator-enforcement.md](../plans/completed/output-contract-validator-enforcement.md) | completed | Define validator checks that catch broken `madeBy` references, templates, parent outputs, unsafe paths, and stale fields. |
| [output-contract-consumer-adoption-pass.md](../plans/completed/output-contract-consumer-adoption-pass.md) | completed | Define the first focused skill adoption pass for high-repeat output writers without broad churn. |
| [output-contract-resolver-fixtures.md](../plans/completed/output-contract-resolver-fixtures.md) | completed | Define success and failure fixtures for resolver behavior. |

## Progress

| Phase | State | Evidence |
|-------|-------|----------|
| Baseline registry | done | `agent/config/outputs.json` contains initial output ids. |
| Baseline resolver | done | `agent/lib/resolve-output.mjs` resolves file, section, and local handoff outputs. |
| Baseline validator hook | done | `scripts/validate-llm-first.mjs --check outputs` validates the current registry shape. |
| First consumer | done | `agent/skills/ah-manage-spec/SKILL.md` names output ids and consumed resolver fields for proposed specs and Design Plan sections. |
| Minimal output fields | done | `docs/plans/completed/output-contract-minimal-fields.md`, `agent/config/outputs.json`, `agent/lib/resolve-output.mjs`, and `scripts/validate-llm-first.mjs --check outputs`. |
| Enforcement validator | done | `docs/plans/completed/output-contract-validator-enforcement.md`, `scripts/validate-llm-first.mjs --check outputs`, and `--outputs-fixture` negative proof. |
| Consumer adoption proof | done | `docs/plans/completed/output-contract-consumer-adoption-pass.md` and `agent/skills/ah-manage-spec/SKILL.md` prove the first focused adoption pass. |
| Resolver fixtures | done | `docs/plans/completed/output-contract-resolver-fixtures.md` and `node --test tests/output-contract-resolver.test.mjs`. |

## Acceptance Criteria

| ID | Criteria |
|---|---|
| AC1 | Each reusable output row names `madeBy`: the skill or workflow expected to create that output. |
| AC2 | Each output row groups target-specific fields under `writeTarget`. |
| AC3 | The output validator infers checks from `writeTarget`, `format`, `template`, and `madeBy`, then fails on missing templates, invalid `madeBy`, broken `parentOutput`, unsafe paths, or stale removed fields. Adoption-state validation is defined by `output-contract-validator-enforcement.md`. |
| AC4 | Adopted skills state which resolver fields they consume: `path`, `template`, `format`, `formatOptions`, `section`, or `cleanupPath`. |
| AC5 | At least one high-repeat output-writing skill is reviewed and patched to remove legacy path/template reconstruction where an output id exists. |
| AC6 | Resolver tests or fixtures cover success, unknown id, invalid args, broken parent output, missing template, and unsafe path cases. |

## Open Decisions

| Decision | Default |
|----------|---------|
| Should output contracts use `owner` terminology? | No. Use `madeBy` to name the producing skill or workflow and avoid ownership hierarchy. |
| Should `outputType`, `outputProfile`, `shapeKind`, `afterWrite`, or `verifyWith` be used as the forward model? | No. Keep the contract centered on `madeBy`, `writeTarget`, `args`, `template`, `format`, and optional `formatOptions`; infer validation and post-write handling from structure. |
| Should the forward model use `writeTarget.kind`? | Use `writeTarget.kind`; return compatibility `locationKind` only from the resolver while old callers exist. |
| Should after-write handling be a registry field or inferred from write target? | Infer it from `writeTarget.kind` until a real exception appears. |
| Should adoption proof be validator-enforced for every skill now? | Enforce only for rows marked `adopted` or `required`; leave broad migration out of scope. |
| Should historical direct path mentions fail validation? | No. Flag only touched/adopted surfaces or explicit required rows. |

## Blockers

| Blocker | Impact |
|---------|--------|
| None. | First specs can start from the current registry and validator. |

## External Mirrors

None.

## Parent

[knitten-refactor.md](knitten-refactor.md)
