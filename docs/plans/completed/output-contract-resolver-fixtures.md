---
status: completed
created: 2026-05-31
updated: 2026-05-31
owner: agent-hub
milestone: output-contract-enforcement-system
---

# Output Contract Resolver Fixtures

## Purpose

Add durable resolver fixtures for `agent/lib/resolve-output.mjs` so output
contract runtime behavior is proven by `node --test`, not only by ad-hoc smoke
commands.

## Problem

The output contract registry and validator now define the minimal field model
and catch broken registry shape. The resolver still has only command-line smoke
checks. That leaves runtime behavior vulnerable to regressions in argument
validation, parent-output resolution, local artifact cleanup paths, and error
payloads.

## Goals

| Goal | Requirement |
|------|-------------|
| Success fixtures | Test the resolver success ids covered by this fixture set: local handoff, proposed spec file, Design Plan section, Shotloom planning, before-PR, PR, and deploy artifacts. |
| Failure fixtures | Test unknown id, missing arg, undeclared arg, invalid arg value, broken parent output, unsafe resolved path, missing template, and unsupported `writeTarget.kind`. |
| CLI contract | Assert CLI success emits `{ ok: true }` JSON and CLI failure emits `{ ok: false, error, detail }` JSON with non-zero exit. |
| Library contract | Assert exported `resolveOutput()` returns the fields consumers rely on. |
| Fixture isolation | Use temporary registry copies or temporary roots where mutation is needed; never commit broken registry rows. |

## Non-Goals

| Non-goal | Reason |
|----------|--------|
| Add new output ids. | This slice proves current runtime behavior. |
| Add consumer skill adoption checks. | Covered by `output-contract-consumer-adoption-pass.md`. |
| Rebuild validator enforcement. | Covered by `output-contract-validator-enforcement.md`. |
| Add explicit per-row validation fields. | Checks remain structure-based. |

## Current State

| Surface | State |
|---------|-------|
| `agent/lib/resolve-output.mjs` | Exports `resolveOutput()` and provides CLI JSON output. |
| `agent/config/outputs.json` | Contains the current output ids, including agent-hub and Shotloom local artifact outputs. |
| `scripts/validate-llm-first.mjs --check outputs` | Validates registry shape and supports `--outputs-fixture`. |
| `tests/output-contract-resolver.test.mjs` | Covers resolver success, CLI failures, temp-root failures, and CLI `--root`. |

## Implemented Design

### Test File

Added `tests/output-contract-resolver.test.mjs`.

The test file should import:

```js
import test from "node:test";
import assert from "node:assert/strict";
import { spawnSync } from "node:child_process";
import { cpSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { resolveOutput } from "../agent/lib/resolve-output.mjs";
```

Use repo root derived from `import.meta.url`, not the caller cwd.

### Success Matrix

| Output id | Args | Required assertions |
|-----------|------|---------------------|
| `agent-hub-spec-proposed` | `slug=test-spec` | `ok`, `madeBy`, `writeTarget.kind`, `path`, `absolutePath`, `template`, `absoluteTemplatePath`, `format`. |
| `agent-hub-design-plan-section` | `slug=test-spec` | Parent path is reused, `section` is returned, `parentOutput` is returned, format is `markdown-section`. |
| `local-session-handoff` | `date=20260531`, `slug=test-handoff` | `.agent-local/reports/20260531-test-handoff.json`, `cleanupPath`, `absoluteCleanupPath`, `format`. |
| `shotloom-start-task-brief` | `stl=stl-123` | `.agent-local/shotloom/planning/stl-123/brief.json`, `cleanupPath`, `absoluteCleanupPath`, `template`, `formatOptions`. |
| `shotloom-planning-spec` | `stl=stl-431` | `.agent-local/shotloom/planning/stl-431/spec.json`, `cleanupPath`, `absoluteCleanupPath`, `template`, `formatOptions`. |
| `shotloom-planning-design-plan` | `stl=stl-431` | `.agent-local/shotloom/planning/stl-431/design-plan.json`, `cleanupPath`, `absoluteCleanupPath`, `template`, `formatOptions`. |
| `shotloom-planning-questions` | `stl=stl-431` | `.agent-local/shotloom/planning/stl-431/questions.json`, `cleanupPath`, `absoluteCleanupPath`, `template`, `formatOptions`. |
| `shotloom-planning-manifest` | `stl=stl-431` | `.agent-local/shotloom/planning/stl-431/manifest.json`, `cleanupPath`, `absoluteCleanupPath`, `template`, `formatOptions`. |
| `shotloom-before-pr-readiness` | `stl=stl-510`, `safeBranch=feat-shotloom-output` | `.agent-local/shotloom/before-pr/stl-510/feat-shotloom-output/readiness.json`, `cleanupPath`, `template`, `formatOptions`. |
| `shotloom-before-pr-code-blockers` | `stl=stl-510`, `safeBranch=feat-shotloom-output` | `.agent-local/shotloom/before-pr/stl-510/feat-shotloom-output/code-blockers.json`, `cleanupPath`, `template`, `formatOptions`. |
| `shotloom-before-pr-docs-blockers` | `stl=stl-510`, `safeBranch=feat-shotloom-output` | `.agent-local/shotloom/before-pr/stl-510/feat-shotloom-output/docs-blockers.json`, `cleanupPath`, `template`, `formatOptions`. |
| `shotloom-pr-cache` | `pr=77` | `.agent-local/shotloom/pr/77`, `cleanupPath`, directory format, no template. |
| `shotloom-pr-reply-plan` | `pr=77` | `.agent-local/shotloom/pr/77/reply-plan.json`, `cleanupPath`, `template`, `formatOptions`. |
| `shotloom-deploy-release-notes` | `key=v0.1.2-test` | `.agent-local/shotloom/deploy/v0.1.2-test/release-notes.md`, `cleanupPath`, Markdown template, format. |
| `shotloom-deploy-manifest` | `key=v0.1.2-test` | `.agent-local/shotloom/deploy/v0.1.2-test/manifest.json`, `cleanupPath`, `template`, `formatOptions`. |
| `shotloom-deploy-rollback` | `key=v0.1.2-test` | `.agent-local/shotloom/deploy/v0.1.2-test/rollback.json`, `cleanupPath`, `template`, `formatOptions`. |
| `--list` | none | Lists all current ids with `madeBy`, `writeTargetKind`, `args`, `format`, and `hasTemplate`. |

### Failure Matrix

| Case | How to trigger | Expected signal |
|------|----------------|-----------------|
| Unknown id | CLI with `missing-output` | exit non-zero; JSON `ok:false`, `error:"resolve-failed"`, detail includes unknown id. |
| Missing arg | CLI `agent-hub-spec-proposed` with no `slug` | exit non-zero; detail includes missing arg. |
| Undeclared arg | CLI `agent-hub-spec-proposed slug=test extra=x` | exit non-zero; detail includes undeclared arg. |
| Invalid arg value | CLI `agent-hub-spec-proposed slug=../bad` | exit non-zero; detail includes invalid path characters or pattern. |
| Broken parent output | temp root registry where section parent id is missing | library or CLI fails with missing parent detail. |
| Unsafe resolved path | temp root registry path renders to `../bad.md` | library or CLI fails with unsafe repo path detail. |
| Missing template | temp root registry template path points to missing template | resolver fails because declared template file does not exist. |
| Unsupported target kind | temp root registry row uses unknown `writeTarget.kind` | fails with unsupported kind detail. |

### Temporary Root Fixture

For failure rows that require registry mutation, create a minimal temp root that
includes only resolver-required files:

```text
SYSTEM.md
agent/config/agent-hub.json
agent/config/outputs.json
agent/config/local-artifact-paths.json
agent/document-templates/agent-hub/spec.md
agent/document-templates/agent-hub/design-plan.md
agent/document-templates/agent-hub/json-handoff-packet.json
```

Do not copy the whole repository. `resolveOutput({ root })` and CLI `--root`
already accept an alternate root, so a minimal temp root is enough and keeps the
tests fast.

### Resolver Template Existence

The validator now rejects invalid template paths. Resolver runtime should also
fail when an output row declares a template and the file is missing, because
consumers depend on `absoluteTemplatePath` being usable.

Added this runtime check in `baseResult()`:

```js
if (entry.template) {
  const absoluteTemplatePath = path.join(root, entry.template);
  if (!existsSync(absoluteTemplatePath)) throw new Error(`${entry.id} template does not exist: ${entry.template}`);
  result.absoluteTemplatePath = absoluteTemplatePath;
}
```

## Design Plan

S0 - Baseline re-check

Input:
- `agent/lib/resolve-output.mjs`
- `agent/config/outputs.json`
- parent milestone and completed validator spec

Output:
- Confirm current resolver success commands pass.
- Confirm no test file already owns this fixture matrix.

Non-output:
- No source edits.

Failure:
- Stop and report baseline failure before writing tests.

Proof:
- `node agent/lib/resolve-output.mjs --list`
- existing three resolver smoke commands.

S1 - Success fixture tests

Input:
- Current output ids and resolver export.

Output:
- `tests/output-contract-resolver.test.mjs` covers the listed success ids and
  `--list`.

Non-output:
- No registry mutation.

Failure:
- If current resolver output is missing a field used by consumers, either fix
  resolver or record the missing field as an explicit implementation blocker.

Proof:
- `node --test tests/output-contract-resolver.test.mjs`

S2 - Failure fixture tests

Input:
- Failure Matrix.
- Minimal temporary root fixture helper.

Output:
- Tests cover CLI failure JSON and mutated-registry runtime failures.

Non-output:
- No committed broken fixture rows unless they live under `tests/fixtures/`.

Failure:
- If temp root setup becomes larger than the resolver behavior under test, keep
  only CLI failure fixtures in this slice and create a follow-up for temp-root
  infrastructure.

Proof:
- `node --test tests/output-contract-resolver.test.mjs`

S3 - Runtime template existence check

Input:
- `baseResult()` in `agent/lib/resolve-output.mjs`.

Output:
- Resolver fails when a declared template does not exist.

Non-output:
- No change to validator template policy.

Failure:
- If consumers rely on non-existent templates, stop and report that consumer
  before changing behavior.

Proof:
- Missing-template resolver test fails before the change and passes after.

S4 - Docs and milestone update

Input:
- This spec.
- Parent milestone.

Output:
- This spec moved to completed after implementation.
- Milestone marks resolver fixtures done.

Non-output:
- Do not close consumer adoption proof.

Failure:
- If only success fixtures land, keep this spec active and name remaining
  failure fixtures.

Proof:
- `node scripts/validate-llm-first.mjs`
- `git diff --check`

## Validation

```bash
node --check agent/lib/resolve-output.mjs
node --test tests/output-contract-resolver.test.mjs
node scripts/validate-llm-first.mjs
git diff --check
```

## Risks

| Risk | Mitigation |
|------|------------|
| Temp-root setup becomes noisy. | Prefer small helper functions and assert only resolver behavior. |
| Test duplicates validator checks. | Keep validator shape checks out; test resolver runtime outputs and errors. |
| CLI assertions become brittle. | Assert JSON shape and important detail substrings, not whole pretty-printed output. |
| Missing-template runtime check changes behavior. | This is intended; validator already treats declared template existence as required. |

## Acceptance Criteria

| ID | Criteria |
|----|----------|
| AC1 | `tests/output-contract-resolver.test.mjs` covers success for listed resolver output ids and `--list`. |
| AC2 | Tests cover unknown id, missing arg, undeclared arg, invalid arg value, broken parent output, unsafe resolved path, missing template, and unsupported `writeTarget.kind`. |
| AC3 | CLI failure tests assert non-zero exit and JSON `{ ok:false, error, detail }`. |
| AC4 | Resolver fails when a row declares a missing template. |
| AC5 | `node --test tests/output-contract-resolver.test.mjs` and full validator pass. |
| AC6 | Milestone marks resolver fixtures done without closing consumer adoption proof. |

## Open Decisions

| Decision | Default |
|----------|---------|
| Should broken fixtures be committed under `tests/fixtures/`? | No by default; generate temporary registry copies in test helpers. |
| Should `resolve-output.mjs` accept `--registry-fixture` like validator? | No. Prefer library tests with temp roots unless a CLI need appears. |
