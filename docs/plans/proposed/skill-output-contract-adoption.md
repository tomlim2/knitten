---
status: proposed
created: 2026-05-31
updated: 2026-05-31
owner: agent-hub
milestone: knitten-refactor
---

# Skill Output Contract Adoption

## Purpose

Define how Knitten skills adopt output contract ids.

This spec answers when a skill uses `agent/lib/resolve-output.mjs`, when it
uses a direct owner path, and when a new row belongs in `agent/config/outputs.json`.

## Problem

Knitten has an output registry, resolver, path architecture, and lifecycle
contract. The remaining adoption gap is skill behavior.

| Failure mode | Effect |
|--------------|--------|
| Skills keep path/template pairs in prose. | Agents can update the path and miss the template, or update the template and miss the path. |
| Every path becomes an output row. | The registry turns into a path dump instead of a skill-operating contract. |
| Broad migration touches stable skills. | Low-value churn creates review load without improving a current workflow. |
| Output ids hide path-owner rules. | Skills bypass lifecycle and resolver boundaries. |
| No adoption gate exists. | New output-writing skills can add hardcoded pairs without validator pressure. |

## Goals

| Goal | Requirement |
|------|-------------|
| Adoption rule | Define the exact condition that requires an output id. |
| Migration order | Apply output ids first to high-repeat, high-risk output writers. |
| Skill edit contract | State how a skill references output ids in `SKILL.md`. |
| Registry gate | Define when to add, reject, or defer an `outputs.json` row. |
| Validation gate | Name the checks that prove an adopted skill still writes the expected surface. |
| Non-churn rule | Prevent broad migration without an active output-writing change. |

## Non-Goals

| Non-Goal | Reason |
|----------|--------|
| Migrate every skill now. | Adoption is triggered by output-writing changes. |
| Add lifecycle fields to `outputs.json`. | `skill-output-lifecycle.md` keeps lifecycle outside the registry in this round. |
| Replace direct repo paths. | Direct paths remain correct for unique owner-managed artifacts. |
| Replace `ah-resolve-doc-path`. | Vault, staging, ops, and private docs keep their resolver owner. |
| Generate output bodies. | Skills still fill templates from task evidence. |
| Implement the validator strategy todo. | This spec defines gates; validator strategy remains a separate milestone item. |

## Current State

| Surface | State |
|---------|-------|
| `agent/config/outputs.json` | Contains `local-session-handoff`, `agent-hub-spec-proposed`, and `agent-hub-design-plan-section`. |
| `agent/lib/resolve-output.mjs` | Resolves output id to path, template, format, shapeKind, and section metadata. |
| `ah-manage-spec` | Uses `resolve-output` for proposed specs and Design Plan sections. |
| `local-session-handoff` | Exists as a generic JSON local handoff output contract. |
| Location architecture | Defines when output contracts, local artifact paths, doc paths, and direct repo paths apply. |
| Lifecycle spec | Defines temporary, promoted, durable, completed, archived, superseded, and deleted states. |
| Milestone | Lists this spec as the next todo after output lifecycle. |

## Proposed Design

### Adoption Decision Table

| Condition | Action |
|-----------|--------|
| Output id exists for the exact purpose. | Resolve it with `node agent/lib/resolve-output.mjs <output-id> ...`. |
| Skill repeats both a path pattern and body template. | Add or reuse an output id before editing the skill broadly. |
| Skill writes a JSON handoff for another LLM/session. | Use `local-session-handoff` or add a more specific JSON output id. |
| Skill writes a section inside an existing output. | Use `locationKind: document-section` with a parent output id. |
| Skill writes a unique durable repo artifact with no reusable template pair. | Use direct owner path plus owner validation. |
| Skill writes vault, staging, ops, or private docs. | Use `ah-resolve-doc-path`; add an output id only when the same purpose also needs a template/shape contract. |
| Skill writes runtime logs, pid files, command output, or cache. | Keep task-local runtime path; do not add an output id unless another LLM consumes a summarized JSON handoff. |
| Skill writes media/export files. | Use owner-specific path rule; add output id only after metadata/template shape repeats. |

### Adoption State

| State | Meaning | Required evidence |
|-------|---------|-------------------|
| `available` | Output id exists but no skill consumer is required to use it yet. | `outputs.json` row and resolver smoke pass. |
| `adopted` | A skill names the output id and consumes resolver fields. | `SKILL.md` wording plus resolver smoke. |
| `required` | New edits to the same output surface must use the output id. | Adopted skill wording and validation gate. |
| `deferred` | Output id is not added because direct path, path owner, or scope rule is stronger. | Review note cites the stronger owner rule. |

### Required Skill Wording

When a skill adopts an output id, its `SKILL.md` must name the id, resolver
command, required args, returned fields, and validation proof.

| Required item | Rule |
|---------------|------|
| Output id | Name the exact id from `agent/config/outputs.json`. |
| Resolver command | Include the command form with required `name=value` args. |
| Returned fields | State which returned fields the skill consumes: `path`, `template`, `format`, `shapeKind`, `section`, `cleanupPath`. |
| Template use | State that the returned template is the body shape unless the skill names a stricter template. |
| Validation | Name the validator or smoke command that proves the output still resolves. |
| Stop condition | Stop when the id is missing, args fail validation, template is missing, or path owner is unclear. |

Example:

```markdown
Resolve proposed specs with:

node agent/lib/resolve-output.mjs agent-hub-spec-proposed slug=<slug>

Use `path` as the destination and `template` as the body shape. Stop if the
resolver returns `ok: false`.
```

### Registry Row Gate

| Gate | Requirement |
|------|-------------|
| Purpose | The id names a reusable output purpose, not only a folder. |
| Owner | One `ownerSkill` or owner workflow can create, validate, and clean up the output. |
| Path owner | The row respects `skill-output-location-architecture.md`. |
| Lifecycle owner | The row has a lifecycle owner from `skill-output-lifecycle.md`, even when `outputs.json` has no lifecycle field. |
| Template or shape | The output has a body template, JSON shape, section shape, or metadata shape. |
| Validator | A validator or smoke command can catch a broken row or broken consumer. |
| Scope | The row supports an active skill change or repeated output surface. |

Reject a row when it only aliases a unique direct repo path, hides a private
absolute path, duplicates an existing path resolver, or has no owner skill.

### Migration Order

| Order | Surface | Trigger | Adoption action | Proof |
|-------|---------|---------|-----------------|-------|
| 1 | Spec writers | Skill creates proposed specs, Design Plan sections, or high-risk spec intake. | Use `agent-hub-spec-proposed` and `agent-hub-design-plan-section`; add an intake output id only if repeated intake automation needs it. | Resolver smoke plus spec lifecycle validator. |
| 2 | Local handoff writers | Skill leaves cross-session state. | Use `local-session-handoff` or a specific JSON output id. | Resolver smoke; git status shows no tracked handoff. |
| 3 | Document template writers | Skill creates reusable template assets. | Add output ids only for repeated template-destination pairs. | Document-template validator and consumer reference scan. |
| 4 | Rule, standard, and skill CRUD | Skill creates or changes shared operating artifacts. | Prefer direct owner path until path/template pair repeats; then add output id. | Owner validator plus `outputs` validator for any new row. |
| 5 | Reference, decision, and briefing writers | Skill repeatedly creates typed durable docs. | Add output id when destination, template, and owner are stable. | Link/path validation plus resolver smoke. |
| 6 | Media/export producers | Skill emits binary output plus metadata or sidecar. | Add output id after metadata shape and cleanup owner repeat. | Owner-specific metadata and cleanup proof. |
| 7 | Runtime/cache producers | Another LLM needs summarized state. | Keep raw runtime local; write JSON handoff through an output id. | Runtime path remains ignored; JSON handoff validates. |

### Existing Skill Treatment

| Skill state | Action |
|-------------|--------|
| Skill already names an output id and resolver command. | Keep it; update only when the output row changes. |
| Skill has a path/template pair and is being edited for that output. | Convert that pair to output id resolution in the same PR. |
| Skill has a path/template pair but is not in the current task scope. | Leave it unchanged; create a finding only if it blocks the current work. |
| Skill uses direct owner path without reusable template pair. | Leave direct path. |
| Skill writes local handoff prose. | Convert to JSON output contract when touched. |

### Review Checklist

| Check | Pass condition |
|-------|----------------|
| Contract fit | Output id is used only for reusable purpose plus destination/body contract. |
| Resolver use | Skill consumes resolver output instead of reconstructing path/template from prose. |
| Boundary fit | Output id does not replace `ah-resolve-doc-path`, local artifact registry, or direct owner path incorrectly. |
| Lifecycle fit | Temporary, durable, promoted, completed, archived, and deleted handling matches owner lifecycle. |
| Validation fit | Diff includes a resolver smoke or validator command for every new or changed output id. |
| Scope fit | Diff does not migrate unrelated skills. |

## Execution Plan

| Step | Action | Output |
|------|--------|--------|
| 1 | Create this adoption spec and intake. | `docs/plans/proposed/skill-output-contract-adoption.md` and intake briefing. |
| 2 | Update `docs/milestones/knitten-refactor.md`. | Spec row link and Skill contract adoption progress become `proposed`. |
| 3 | Review adoption rules against parent, registry, location, and lifecycle specs. | Review findings or no blocking findings. |
| 4 | Apply review fixes. | Focused wording/table updates. |
| 5 | Validate and publish through PR. | CI pass and merged PR. |

## Design Plan

S0 - Baseline re-check

Input:
- `docs/milestones/knitten-refactor.md`
- `docs/plans/proposed/skill-operating-system.md`
- `docs/plans/proposed/output-contract-registry.md`
- `docs/plans/proposed/skill-output-location-architecture.md`
- `docs/plans/proposed/skill-output-lifecycle.md`
- `agent/config/outputs.json`
- `agent/lib/resolve-output.mjs`

Output:
- Confirmed adoption scope and current output ids.

Non-output:
- No skill rewrites.
- No registry schema changes.

Failure:
- Stop if any prerequisite spec or resolver is missing.

Proof:
- Read commands and resolver smoke command.

S1 - Adoption contract

Input:
- Baseline evidence.

Output:
- Adoption Decision Table, Adoption State, Required Skill Wording, Registry Row Gate, Migration Order, Existing Skill Treatment, and Review Checklist.

Non-output:
- No broad migration.
- No lifecycle field implementation.

Failure:
- Stop if a rule conflicts with path owner or lifecycle owner.

Proof:
- Manual review plus LLM-first validation.

S2 - Milestone alignment

Input:
- New spec path and `docs/milestones/knitten-refactor.md`.

Output:
- Milestone links the spec and marks Skill contract adoption as `proposed`.

Non-output:
- No acceptance criteria deletion.

Failure:
- Stop if spec frontmatter milestone does not match the milestone file.

Proof:
- `rg -n "skill-output-contract-adoption|Skill contract adoption" docs/milestones/knitten-refactor.md docs/plans/proposed/skill-output-contract-adoption.md`

S3 - Review, fix, validate, publish

Input:
- Final diff and review findings.

Output:
- Review findings addressed, validation passes, PR merged.

Non-output:
- No additional implementation changes.

Failure:
- Fix validation defects before PR; stop on CI failure.

Proof:
- `git diff --check`
- `node scripts/validate-llm-first.mjs`
- `node scripts/validate-llm-first.mjs --check spec-lifecycle`
- `node agent/lib/resolve-output.mjs agent-hub-spec-proposed slug=skill-output-contract-adoption`
- PR CI result.

## Validation

| Check | Command |
|-------|---------|
| Diff hygiene | `git diff --check` |
| LLM-first validator | `node scripts/validate-llm-first.mjs` |
| Spec lifecycle | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |
| Resolver smoke | `node agent/lib/resolve-output.mjs agent-hub-spec-proposed slug=skill-output-contract-adoption` |
| Spec route evidence | `rg -n "skill-output-contract-adoption|Skill contract adoption" docs/milestones/knitten-refactor.md docs/plans/proposed/skill-output-contract-adoption.md docs/briefings/specs/skill-output-contract-adoption.md` |

## Risks

| Risk | Mitigation |
|------|------------|
| Adoption spec causes broad migration churn. | Require active output-writing trigger before converting existing skills. |
| Output registry becomes a folder alias list. | Require reusable purpose plus body/shape contract. |
| Skills bypass path owners. | Keep resolver boundary table and stop conditions in the skill wording contract. |
| Local handoff becomes tracked docs. | Keep JSON handoff under `.agent-local` and prove git status remains clean. |
| Validator strategy is mistaken as done. | Keep validator strategy as a separate milestone item. |

## Acceptance Criteria

| ID | Criteria |
|----|----------|
| AC1 | Spec defines when a skill must use an output id. |
| AC2 | Spec defines when to add, reject, or defer an output registry row. |
| AC3 | Spec defines required `SKILL.md` wording for adopted output ids. |
| AC4 | Spec defines staged migration order without broad skill churn. |
| AC5 | Spec preserves direct owner paths, `ah-resolve-doc-path`, and local artifact registry boundaries. |
| AC6 | Spec defines review and validation checks for adoption changes. |
| AC7 | Parent milestone links this spec and updates Skill contract adoption progress. |

## Open Decisions

| Decision | Default |
|----------|---------|
| Should skill CRUD get output ids now? | No. Use direct owner paths until path/template pairs repeat. |
| Should spec intake get its own output id now? | No. Add only when intake writing becomes scripted or repeated enough to validate. |
| Should output rows carry `ownerSkill` fields now? | No. Keep ownerSkill in spec/skill wording until validator strategy adds schema support. |
| Should existing skills be migrated in a batch? | No. Convert only when the skill's output surface is already in scope. |
