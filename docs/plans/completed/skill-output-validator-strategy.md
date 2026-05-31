---
status: completed
created: 2026-05-31
updated: 2026-05-31
owner: agent-hub
milestone: knitten-refactor
---

# Skill Output Validator Strategy

## Purpose

Define the validator strategy for Knitten skill outputs.

This spec maps output drift classes to existing validator checks, states when a
new check is required, and keeps validation tied to skill output contracts
instead of manual review memory.

## Problem

Knitten has output contracts, path boundaries, lifecycle states, and adoption
rules. The missing strategy is the validator layer that proves those contracts
stay true after later edits.

| Failure mode | Effect |
|--------------|--------|
| Output contract rows drift. | Skills resolve stale paths, missing templates, or invalid section outputs. |
| Template inventory drifts. | Skills reference body shapes that are missing, invalid, or duplicated. |
| Milestone/spec links drift. | A cold-start session cannot trust current work status. |
| Skill adoption wording drifts. | A skill names an output id but still reconstructs path/template details from prose. |
| Runtime and local handoff boundaries drift. | Temporary files can become tracked context or durable docs. |
| New validator checks are added ad hoc. | CI grows without a clear ownership or evidence rule. |

## Goals

| Goal | Requirement |
|------|-------------|
| Drift map | Map output drift classes to current validator checks. |
| Check trigger | Define when to add a new validator check. |
| Proof contract | Define which validation proof each output change must report. |
| Registry ownership | Keep `agent/config/agent-hub.json` as validator metadata, not a second implementation source. |
| CI boundary | State which checks run as default repository validation and which focused checks are used during authoring. |
| Review boundary | State which defects stay manual until they repeat enough for automation. |

## Non-Goals

| Non-Goal | Reason |
|----------|--------|
| Implement a new validator check in this PR. | Current checks cover the first output-contract surfaces. |
| Add lifecycle or owner fields to `outputs.json`. | Lifecycle and owner mapping remain in specs and skills for this round. |
| Replace focused scripts with one mega validator. | `validate-llm-first` coordinates checks; focused scripts remain allowed. |
| Validate every semantic claim in docs. | Manual review remains required for judgment and scope fit. |
| Migrate existing skills. | `skill-output-contract-adoption.md` owns adoption triggers. |

## Current State

| Surface | Current validator or proof |
|---------|----------------------------|
| Output registry rows | `node scripts/validate-llm-first.mjs --check outputs`. |
| Document templates | `node scripts/validate-llm-first.mjs --check document-templates`. |
| Spec, milestone, and intake links | `node scripts/validate-llm-first.mjs --check spec-lifecycle`. |
| Local artifact registry | `node scripts/validate-llm-first.mjs --check local-artifact-paths`. |
| Shared path aliases | `node scripts/validate-llm-first.mjs --check managed-paths`. |
| Runtime/cache tracking | `node scripts/validate-llm-first.mjs --check tracked-runtime-paths`. |
| User absolute paths | `node scripts/validate-llm-first.mjs --check tracked-user-paths`. |
| Skill mechanical shape | `node scripts/validate-llm-first.mjs --check skill-mechanics`. |
| Full repository gate | `node scripts/validate-llm-first.mjs`. |
| CI | `.github/workflows/validate.yml` runs repository validation. |
| Validator registry metadata | `agent/config/agent-hub.json` `validators` rows. |

## Proposed Design

### Validator Layers

| Layer | Owner | Use |
|-------|-------|-----|
| Full repository validation | `scripts/validate-llm-first.mjs` | PR and pre-merge proof for all Knitten core changes. |
| Focused check | `scripts/validate-llm-first.mjs --check <name>` | Authoring proof for one changed surface. |
| Resolver smoke | Owner resolver script | Proof that a named output id or path purpose resolves for sample args. |
| Reference scan | `rg` or focused helper | Proof that consumers, links, or legacy literals moved with the change. |
| Manual review | Owning skill or reviewer | Judgment for scope, semantics, lifecycle fit, and non-repeated defects. |

### Drift Class Map

| Drift class | Primary check | Add-on proof |
|-------------|---------------|--------------|
| Output row shape, duplicate id, missing template, unsafe path, invalid parent output | `outputs` | Resolver smoke for each changed output id. |
| Template parse, frontmatter, consumer group, legacy template path | `document-templates` | Consumer reference scan when a template moves or is renamed. |
| Spec frontmatter, milestone backlink, milestone row status, spec intake target | `spec-lifecycle` | `rg` evidence for new spec slug and progress row. |
| `.agent-local` registry path, cleanup path, template hint, schemaKind | `local-artifact-paths` | Resolver smoke for changed local artifact route. |
| Shared path canonical/alias drift | `managed-paths` | Reference scan for retired literals. |
| Runtime/cache path accidentally tracked | `tracked-runtime-paths` | `git status --short` and cleanup path review. |
| Private or user absolute path leakage | `tracked-user-paths` | Manual scan when docs mention external paths. |
| Skill command, metadata, or mechanical shape drift | `skill-mechanics` | Output adoption review checklist when output ids are touched. |
| Generated inventory or validator check list drift | `generated-blocks` | Regenerate or patch the generated block owner. |
| Markdown link breakage | `markdown-links` | Direct link read when link target is a lifecycle move. |

### New Check Trigger

Add a new validator check only when all gates pass.

| Gate | Requirement |
|------|-------------|
| Repeated drift | The same defect class appears in at least two reviews, or one defect can silently break many consumers. |
| Mechanical predicate | The defect can be detected from files, JSON, frontmatter, path rules, links, or command output. |
| Canonical owner | One file or registry owns the truth the check enforces. |
| Fast path | The focused check can run without private machine state, network access, or long external jobs. |
| Fixture or smoke | The check has a passing positive case and a way to fail on a representative broken case. |
| Registry metadata | `agent/config/agent-hub.json` lists the check when it becomes a durable validator. |

Do not add a check for one-off wording, product judgment, reviewer preference,
or a rule with no mechanical predicate.

### Output Change Validation Matrix

| Change type | Required validation |
|-------------|---------------------|
| Add or edit `agent/config/outputs.json` row | `outputs`, resolver smoke for changed id, full validator. |
| Add or edit document template | `document-templates`, consumer reference scan, full validator. |
| Add or edit proposed spec | `spec-lifecycle`, slug `rg` evidence, full validator. |
| Add or edit milestone link/progress | `spec-lifecycle`, milestone `rg` evidence, full validator. |
| Add or edit local artifact path contract | `local-artifact-paths`, local resolver smoke, full validator. |
| Adopt output id in a skill | `skill-mechanics`, `outputs`, resolver smoke, adoption review checklist, full validator. |
| Change runtime/cache boundary | `tracked-runtime-paths`, `git status --short`, full validator. |
| Move or rename shared path literal | `managed-paths`, reference scan, full validator. |

### Validator Registry Rule

| If | Then |
|----|------|
| Check is durable and run by `validate-llm-first`. | Add or update `agent/config/agent-hub.json` `validators` metadata. |
| Check is a temporary smoke command in a spec or PR. | Do not add it to `agent-hub.json`. |
| Check delegates to a focused script. | Register the wrapper check or the durable focused script, not both. |
| Check needs private machine paths. | Keep it out of default CI; document it as a local diagnostic. |

### Review Boundary

| Finding type | Action |
|--------------|--------|
| Mechanical drift covered by an existing check. | Fix the file and run the focused check. |
| Mechanical drift not covered and repeated. | Add a validator implementation spec or check in a separate PR. |
| Judgment or scope mismatch. | Keep manual review; do not encode as validator. |
| Defect in validator wording or registry metadata. | Patch `agent/config/agent-hub.json` or generated check docs with validation proof. |
| Slow or flaky check proposal. | Reject from default CI; keep as manual diagnostic until it has a fast deterministic form. |

## Execution Plan

| Step | Action | Output |
|------|--------|--------|
| 1 | Create this validator strategy spec and intake. | `docs/plans/completed/skill-output-validator-strategy.md` and intake briefing. |
| 2 | Update `docs/milestones/knitten-refactor.md`. | Specs table links the spec; Validator strategy progress becomes `proposed`. |
| 3 | Review strategy against current checks and prior child specs. | Review findings or no blocking findings. |
| 4 | Apply review fixes. | Focused wording/table updates. |
| 5 | Validate and publish through PR. | CI pass and merged PR. |

## Design Plan

S0 - Baseline re-check

Input:
- `docs/milestones/knitten-refactor.md`
- `docs/plans/completed/skill-operating-system.md`
- `docs/plans/completed/output-contract-registry.md`
- `docs/plans/completed/skill-output-location-architecture.md`
- `docs/plans/completed/skill-output-lifecycle.md`
- `docs/plans/completed/skill-output-contract-adoption.md`
- `scripts/validate-llm-first.mjs`
- `agent/config/agent-hub.json`

Output:
- Confirmed current checks, validator registry metadata, and remaining milestone todo.

Non-output:
- No validator code edits.
- No registry schema changes.

Failure:
- Stop if the current check list or validator registry cannot be read.

Proof:
- `node scripts/validate-llm-first.mjs --list`

S1 - Strategy map

Input:
- Baseline evidence.

Output:
- Validator Layers, Drift Class Map, New Check Trigger, Output Change Validation Matrix, Validator Registry Rule, and Review Boundary.

Non-output:
- No new durable check.
- No broad skill adoption.

Failure:
- Stop if a drift class has no validator, proof, or manual review owner.

Proof:
- Manual review plus focused validator checks.

S2 - Milestone alignment

Input:
- New spec path and `docs/milestones/knitten-refactor.md`.

Output:
- Milestone links the spec and marks Validator strategy as `proposed`.

Non-output:
- No acceptance criteria deletion.

Failure:
- Stop if spec frontmatter milestone does not match the milestone file.

Proof:
- `rg -n "skill-output-validator-strategy|Validator strategy" docs/milestones/knitten-refactor.md docs/plans/completed/skill-output-validator-strategy.md`

S3 - Review, fix, validate, publish

Input:
- Final diff and review findings.

Output:
- Review findings addressed, validation passes, PR merged.

Non-output:
- No implementation beyond spec and milestone docs.

Failure:
- Fix validation defects before PR; stop on CI failure.

Proof:
- `git diff --check`
- `node scripts/validate-llm-first.mjs`
- `node scripts/validate-llm-first.mjs --check spec-lifecycle`
- `node scripts/validate-llm-first.mjs --check outputs`
- `node scripts/validate-llm-first.mjs --check document-templates`
- PR CI result.

## Validation

| Check | Command |
|-------|---------|
| Diff hygiene | `git diff --check` |
| Check list | `node scripts/validate-llm-first.mjs --list` |
| LLM-first validator | `node scripts/validate-llm-first.mjs` |
| Spec lifecycle | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |
| Output registry | `node scripts/validate-llm-first.mjs --check outputs` |
| Document templates | `node scripts/validate-llm-first.mjs --check document-templates` |
| Spec route evidence | `rg -n "skill-output-validator-strategy|Validator strategy" docs/milestones/knitten-refactor.md docs/plans/completed/skill-output-validator-strategy.md docs/briefings/specs/skill-output-validator-strategy.md` |

## Risks

| Risk | Mitigation |
|------|------------|
| Strategy reads like implementation is complete. | Current State names only existing checks; Non-Goals exclude new validator code. |
| Validator grows into one mega gate. | Keep focused checks and owner-specific scripts as first-class layers. |
| Manual review gets replaced by weak automation. | New Check Trigger requires a mechanical predicate; Review Boundary keeps judgment manual. |
| CI becomes slow or private-state dependent. | Fast path gate rejects network, private machine state, and long external jobs. |
| Validator registry duplicates implementation. | Registry stores metadata; check code remains in scripts or focused validators. |

## Acceptance Criteria

| ID | Criteria |
|----|----------|
| AC1 | Spec maps output drift classes to current validator checks. |
| AC2 | Spec defines when a new validator check is required. |
| AC3 | Spec defines required validation proof for output, template, spec, milestone, local artifact, skill adoption, runtime, and shared path changes. |
| AC4 | Spec preserves manual review for judgment and scope defects. |
| AC5 | Spec keeps `agent/config/agent-hub.json` as validator metadata, not a second implementation source. |
| AC6 | Spec states CI and focused-check usage. |
| AC7 | Parent milestone links this spec and updates Validator strategy progress. |

## Open Decisions

| Decision | Default |
|----------|---------|
| Add lifecycle fields to `outputs.json` for validator use? | No. Keep lifecycle in specs and skill wording until adoption proves the field is needed. |
| Add an output-adoption validator now? | No. Define it in a later implementation spec after one more adopted skill surface exists. |
| Add media/export validator rows now? | No. Keep owner-specific proof until repeated metadata shapes emerge. |
