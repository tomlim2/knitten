---
status: completed
created: 2026-05-31
updated: 2026-05-31
owner: agent-hub
milestone: knitten-refactor
---

# Skill Output Lifecycle

## Purpose

Define lifecycle states and transition gates for Knitten skill outputs.

This spec answers what happens after a skill writes an output: keep it local,
promote it, complete it, archive it, supersede it, or delete it.

## Problem

Knitten now has a parent operating model and a path-location architecture. The
remaining gap is lifecycle ownership.

| Failure mode | Effect |
|--------------|--------|
| Temporary files lack cleanup rules. | `.agent-local` grows and stale state misleads later sessions. |
| Local handoff and durable policy use similar words. | A JSON report can be mistaken for accepted knowledge. |
| Raw runtime output gets copied into durable docs. | Logs and tool dumps become noisy permanent context. |
| Durable artifacts lack archive/delete gates. | Specs, milestones, skills, and standards can be removed without evidence. |
| Media/export outputs lack promotion metadata. | Generated files can survive without owner, cleanup, or validation proof. |

## Goals

| Goal | Requirement |
|------|-------------|
| Lifecycle vocabulary | Define one state vocabulary for skill outputs. |
| Output class mapping | Assign lifecycle rules to repo docs, local handoff, runtime files, operational findings, media, and exports. |
| Promotion gates | State what evidence is required before local or runtime facts become durable. |
| Cleanup gates | State when temporary outputs are deleted or retained. |
| Archive/delete gates | Preserve destructive-action gates for durable artifacts. |
| Owner responsibility | Tie lifecycle action to `ownerSkill` or current task skill. |

## Non-Goals

| Non-Goal | Reason |
|----------|--------|
| Implement lifecycle fields in `outputs.json`. | Registry implementation belongs to a later adoption or validator spec. |
| Replace `SPEC-LIFECYCLE.md`. | That file remains the canonical lifecycle for specs. |
| Replace `MILESTONE-LIFECYCLE.md`. | That file remains the canonical lifecycle for milestones. |
| Define storage paths. | `skill-output-location-architecture.md` owns path family boundaries. |
| Migrate all skills. | `skill-output-contract-adoption.md` owns migration order. |
| Preserve raw runtime logs as durable records. | Durable docs store facts and decisions, not raw machine output. |

## Current State

| Surface | Existing lifecycle owner | Current rule |
|---------|--------------------------|--------------|
| Specs | `SPEC-LIFECYCLE.md` | `draft`, `proposed`, `active`, `implemented`, `completed`, `blocked`, `parked`, `superseded`, `archived`. |
| Milestones | `MILESTONE-LIFECYCLE.md` | `active`, `completed`, `blocked`, `parked`, `superseded`, `archived` plus completion gate. |
| Local handoff | `docs/reference/local-report-inbox.md` | JSON-only, local-only, promote durable content to tracked owner path. |
| Runtime files | `temporary-runtime-files.md` | One `workDir`, cleanup paths, no durable docs under runtime workDir. |
| Output contracts | `agent/config/outputs.json` | Path/template/format/shape exists for initial outputs, lifecycle field not implemented. |
| Location architecture | `skill-output-location-architecture.md` | Path families and resolver ownership defined. |

## Proposed Design

### Lifecycle States

| State | Applies to | Meaning | Exit gate |
|-------|------------|---------|-----------|
| `temporary` | local handoff, runtime files, queues, diagnostics | Local-only state used during or between sessions. | Delete after durable output exists, or promote facts through a tracked owner path. |
| `draft` | specs, proposed docs, generated body drafts | Written but not ready for execution or adoption. | Review and move to `proposed`, or delete through owner gate. |
| `proposed` | specs, milestones, architecture docs | Ready for review; not accepted as implementation-complete. | User/review acceptance, implementation, or archive decision. |
| `active` | specs, milestones, task workflows | Accepted and currently being executed. | Complete, block, park, supersede, or archive. |
| `promoted` | local facts moved into tracked docs | Transition state: temporary content now has a durable owner path. | Validate owner artifact, then clean source temporary artifact. |
| `durable` | rules, standards, skills, references, decisions, templates | Canonical tracked operating artifact. | Update, archive, supersede, or delete through owner gate. |
| `implemented` | specs | Implementation landed; validation or wrapup remains. | Complete or block with evidence. |
| `completed` | specs, milestones, output tasks | Required implementation and validation evidence exist. | Archive only if retained outside active work. |
| `blocked` | specs, milestones, handoff packets | Waiting on decision, dependency, or external state. | Resume, park, supersede, or archive. |
| `parked` | specs, milestones | Intentionally paused with no active execution. | Resume, supersede, archive. |
| `superseded` | durable artifacts and specs | Replaced by another artifact or contract. | Keep replacement link; archive only through owner policy. |
| `archived` | durable artifacts and specs | Retained for history; not active. | Restore through explicit user request or delete through destructive gate. |
| `deleted` | temporary artifacts and approved durable removals | Removed from working set; durable deletion evidence lives in commit, PR, replacement link, or owner record. | Only after cleanup/delete gate passes. |

### Output Class Lifecycle

| Output class | Create state | Promotion target | Completion rule | Cleanup/archive rule |
|--------------|--------------|------------------|-----------------|----------------------|
| Local handoff packet | `temporary` | Tracked spec, reference, rule, standard, skill, milestone, decision, or issue when the owner workflow uses one. | Handoff is done when next action is completed or promoted. | Delete after durable promotion or task wrapup. |
| Runtime workDir | `temporary` | Durable fact summary only; never raw workDir wholesale. | Runtime work is done when downstream output validates. | Delete paths listed in `cleanupPaths` after durable outputs are verified. |
| Operational finding queue | `temporary` | Owning rule, standard, skill, spec, milestone, reference, or tracked finding report. | Finding is done when promoted or intentionally discarded. | Remove queue item after promotion/discard evidence. |
| Spec | `draft` or `proposed` | Existing lifecycle folders under `docs/plans/`. | `completed` only after implementation and validation evidence. | Archive, supersede, or delete through `SPEC-LIFECYCLE.md`. |
| Milestone | `active` or `proposed` | `docs/milestones/`. | `completed` only when required specs and acceptance criteria have evidence. | Archive/delete through `MILESTONE-LIFECYCLE.md`. |
| Rule | `durable` | `agent/rules/`. | Complete when indexed, validated, and load semantics are correct. | Archive/supersede through rule owner; delete only with explicit approval. |
| Standard | `durable` | `agent/standards/`. | Complete when linked, validated, and not duplicated elsewhere. | Archive/supersede through standard owner; delete only with explicit approval. |
| Skill | `durable` | `agent/skills/<name>/SKILL.md`. | Complete when metadata, routing, outputs, and validation contract pass. | Archive/delete through skill lifecycle owner. |
| Document template | `durable` | `agent/document-templates/`. | Complete when template inventory and consumer references are valid. | Remove only after no consumers remain, or after compatibility plan and validator/reference scan pass. |
| Reference/decision | `durable` | `docs/reference/`, `docs/decisions/`, or skill `references/`. | Complete when linked from owner surface and current-state wording passes. | Archive/supersede with replacement link when replaced. |
| Media/export | `temporary`, `durable`, or `exported` | Owner-specific path plus metadata or sidecar. | Complete when owner validation and cleanup metadata exist. | Delete temporary files; keep durable/exported files only with owner and proof. |

### Transition Rules

| From | To | Required action |
|------|----|-----------------|
| `temporary` | `promoted` | Write durable fact to tracked owner path; cite source artifact; run owner validation. |
| `temporary` | `deleted` | Verify no remaining task depends on it; remove cleanup path. |
| `draft` | `proposed` | Complete required spec sections and validation plan. |
| `proposed` | `active` | User or owner workflow accepts execution. |
| `active` | `implemented` | Spec only: implementation lands but final validation/wrapup remains. |
| `implemented` | `completed` | Validation evidence exists and acceptance criteria are satisfied. |
| `active` | `blocked` | Record blocker, owner, and resume condition. |
| `active` | `parked` | Record pause reason and next review condition. |
| any tracked non-temporary state | `superseded` | Add replacement link and reason. |
| any tracked non-temporary state | `archived` | Confirm artifact is no longer active and retained for history. |
| any tracked non-temporary state | `deleted` | Pass destructive delete gate for the artifact owner; record evidence outside the removed file. |

### Promotion Gate

Promote local or runtime content only when the content is a durable fact.

| Source | Promote | Do not promote |
|--------|---------|----------------|
| `.agent-local/reports/*.json` | Decision, task state, next action, accepted finding, validation evidence. | Whole packet body when only a short summary is needed. |
| `.agent-local/runtime/<workDir>/` | Normalized result, evidence summary, generated artifact that belongs in tracked owner path. | Raw logs, pid files, transient command output. |
| `.agent-local/ah/operational-findings/` | Accepted rule, standard, skill, spec, reference, or issue update. | Duplicate finding, rejected idea, stale observation. |
| media/export workDir | Final artifact plus metadata when owner requires it. | Intermediate frames, scratch renders, temporary downloads. |

### Cleanup Gate

| Artifact | Cleanup action | Required proof |
|----------|----------------|----------------|
| Local handoff packet | Delete after promotion or completion. | Durable owner path or completed next action exists. |
| Runtime workDir | Delete `cleanupPaths`. | Final output is validated; no active task references the path. |
| Operational finding queue item | Remove or mark done. | Promoted owner path, explicit discard, or duplicate link exists. |
| Temporary media/export files | Delete scratch files. | Final artifact path and metadata exist, or task intentionally discards output. |
| Durable tracked artifact | Do not cleanup automatically. | Use archive, supersede, or delete gate. |

### Delete Gate

| Artifact class | Delete gate |
|----------------|-------------|
| Temporary local artifact | OwnerSkill confirms no dependent task; cleanup path is local and ignored. |
| Runtime workDir | `cleanupPaths` points under `.agent-local/runtime/`; final output validates. |
| Spec | Follow `SPEC-LIFECYCLE.md` delete gate. |
| Milestone | Follow `MILESTONE-LIFECYCLE.md` delete gate. |
| Rule, standard, skill, template, reference, decision | Require explicit user request, owner review, no active references, final diff limited to intended removal or compatibility update. |
| Media/export | Require owner rule, metadata check, and no durable consumer. |

### Owner Responsibility

| Owner | Lifecycle duties |
|-------|------------------|
| `ownerSkill` | Creates output, records state, validates output, handles cleanup or archive gate. |
| Current task skill | Owns temporary runtime files until handoff or wrapup. |
| `ah-manage-spec` | Owns spec state changes and spec delete/archive gates. |
| `ah-manage-milestone` | Owns milestone state changes and milestone delete/archive gates. |
| `ah-report-finding` | Owns finding queue capture until promoted or discarded. |
| Producing media/export skill | Owns generated files, sidecars, validation, and cleanup. |

## Execution Plan

| Step | Action | Output |
|------|--------|--------|
| 1 | Create this lifecycle spec and intake. | `docs/plans/completed/skill-output-lifecycle.md` and intake briefing. |
| 2 | Update `docs/milestones/knitten-refactor.md`. | Spec row link and Output lifecycle progress become `proposed`. |
| 3 | Review lifecycle coverage against parent and location specs. | Review findings or no blocking findings. |
| 4 | Apply review fixes. | Focused lifecycle wording or table updates. |
| 5 | Validate and publish through PR. | CI pass and merged PR. |

## Design Plan

S0 - Baseline re-check

Input:
- `docs/plans/completed/skill-operating-system.md`
- `docs/plans/completed/skill-output-location-architecture.md`
- `docs/reference/local-report-inbox.md`
- `agent/standards/policy/temporary-runtime-files.md`
- `SPEC-LIFECYCLE.md`
- `MILESTONE-LIFECYCLE.md`

Output:
- Confirmed state vocabulary and existing lifecycle owners.

Non-output:
- No validator, schema, or resolver change.

Failure:
- Stop if lifecycle references conflict.

Proof:
- Read commands and spec lifecycle validator.

S1 - Lifecycle matrix

Input:
- Baseline evidence.

Output:
- Lifecycle States, Output Class Lifecycle, Transition Rules, Promotion Gate, Cleanup Gate, Delete Gate, and Owner Responsibility.

Non-output:
- No storage path redesign.
- No skill migration plan.

Failure:
- Stop if an output class lacks state, owner, or gate.

Proof:
- Manual review plus LLM-first validation.

S2 - Milestone alignment

Input:
- New spec path and `docs/milestones/knitten-refactor.md`.

Output:
- Milestone links the spec and marks Output lifecycle as `proposed`.

Non-output:
- No acceptance criteria deletion.

Failure:
- Stop if spec frontmatter milestone does not match the milestone file.

Proof:
- `rg -n "skill-output-lifecycle|Output lifecycle" docs/milestones/knitten-refactor.md docs/plans/completed/skill-output-lifecycle.md`

S3 - Review, fix, validate, publish

Input:
- Final diff and review findings.

Output:
- Review findings addressed, validation passes, PR merged.

Non-output:
- No broad migration or implementation changes.

Failure:
- Fix validation defects before PR; stop on CI failure.

Proof:
- `git diff --check`
- `node scripts/validate-llm-first.mjs`
- `node scripts/validate-llm-first.mjs --check spec-lifecycle`
- PR CI result.

## Validation

| Check | Command |
|-------|---------|
| Diff hygiene | `git diff --check` |
| LLM-first validator | `node scripts/validate-llm-first.mjs` |
| Spec lifecycle | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |
| Spec route evidence | `rg -n "skill-output-lifecycle|Output lifecycle" docs/milestones/knitten-refactor.md docs/plans/completed/skill-output-lifecycle.md docs/briefings/specs/skill-output-lifecycle.md` |

## Risks

| Risk | Mitigation |
|------|------------|
| Lifecycle spec duplicates existing spec/milestone lifecycle references. | Reference those files as canonical for their surfaces. |
| Temporary and durable states become ambiguous. | Keep `temporary`, `promoted`, and `durable` distinct. |
| Cleanup rules delete durable facts. | Require promotion or validation evidence before cleanup. |
| Raw runtime files become durable docs. | Promote summaries and facts only. |

## Acceptance Criteria

| ID | Criteria |
|----|----------|
| AC1 | Spec defines lifecycle states for Knitten skill outputs. |
| AC2 | Spec maps each output class from the parent taxonomy to lifecycle rules. |
| AC3 | Spec defines promotion, cleanup, archive, and delete gates. |
| AC4 | Spec preserves existing spec and milestone lifecycle ownership. |
| AC5 | Spec keeps LLM handoff JSON-only and runtime files local-only. |
| AC6 | Spec assigns lifecycle responsibility to `ownerSkill` or current task skill. |
| AC7 | Parent milestone links this spec and updates Output lifecycle progress. |

## Open Decisions

| Decision | Default |
|----------|---------|
| Should `outputs.json` gain lifecycle fields now? | No. Add after adoption/validator design. |
| Should local handoff packets be auto-deleted by a script? | No. Require owner cleanup until repeated misses justify automation. |
| Should media/export outputs use one global lifecycle registry? | No. Keep owner-specific until repeated metadata shapes emerge. |
