---
status: implemented
created: 2026-05-17
updated: 2026-05-17
owner: caol-ila
milestone: spec-lifecycle-system
---

# Caol Manage Spec

## Purpose

Create a general caol-ila skill for managing specs as durable work contracts.
The skill should not replace existing domain-specific spec skills. It should
capture inputs, route to the best existing spec workflow, manage `docs/plans/`
lifecycle state, and make spec review repeatable before implementation begins.

The working name is `caol-manage-spec`.

## Problem

caol-ila now uses specs as the normal pre-work contract, but the workflow is
spread across several specialized skills and informal chat patterns:

| Existing workflow | Strength | Gap for caol-ila |
|-------------------|----------|------------------|
| `agent/skills/dev-generate-spec/SKILL.md` | generates technical specs from code, files, directories, or branch diffs | writes to private specs and does not manage `docs/plans/` lifecycle |
| `agent/skills/shotloom-draft-spec/SKILL.md` | strong Shotloom task contract, briefing handoff, review loop, commit/push behavior | repo-specific and depends on Shotloom briefing/state |
| `agent/skills/shotloom-draft-task-plan/SKILL.md` | detailed create/update/conflict rules for Shotloom specs | compatibility implementation, not general-purpose |
| `agent/skills/review-audit-web-spec/SKILL.md` | useful spec review checklist for web/product docs | review-only, web-oriented, not lifecycle management |
| Chat pattern | flexible and fast | easy to lose inputs, decisions, exclusions, and review evidence |

The missing layer is a general spec intake, routing, and lifecycle manager.

## Goals

1. Create a reusable skill that supports spec create, update, review, archive,
   and delete flows.
2. Require an intake phase that records the user request, evidence sources,
   known decisions, open questions, and exclusions before drafting.
3. Reuse existing spec-related skills when they fit instead of duplicating
   their logic.
4. Keep caol-ila operational specs in `docs/plans/<slug>.md`.
5. Store optional intake/briefing artifacts under `docs/briefings/specs/`.
6. Make cold-start review possible from disk without relying on chat memory.
7. Keep destructive operations gated behind explicit user approval.
8. Preserve small-context routing: load only the skill references needed for the
   current route.

## Non-Goals

1. Do not replace `shotloom-draft-spec` for Shotloom implementation work.
2. Do not move existing `dev-generate-spec` private outputs in the first batch.
3. Do not create a universal PRD format for every domain.
4. Do not auto-commit generic specs unless the user explicitly asks for commit.
5. Do not migrate all existing `docs/plans/` files in the first implementation.
6. Do not delete specs by default; prefer archive or supersede state.

## Core Idea

`caol-manage-spec` is an orchestrator:

```text
user request
  -> intake
  -> route
  -> gather evidence
  -> draft/update/review/archive
  -> persist spec and optional intake artifact
  -> validate
```

It owns the management workflow. Domain-specific authoring stays with
domain-specific skills.

## Terminology

| Term | Meaning |
|------|---------|
| Spec | A durable pre-work or review contract stored as Markdown. |
| Intake | The captured input set used to make or update a spec. |
| Evidence | Files, commands, docs, skill references, links, or user decisions used by the spec. |
| Route | The chosen workflow for the spec, such as Shotloom, code-derived, web review, or caol policy. |
| Lifecycle | The frontmatter status and follow-up movement of a spec. |
| Direct spec | The main `docs/plans/<slug>.md` artifact. |
| Intake artifact | Optional `docs/briefings/specs/<slug>.md` record of inputs and routing decisions. |

## Skill Shape

Planned path:

```text
agent/skills/caol-manage-spec/
  SKILL.md
  references/
    SPEC-INTAKE.md
    SPEC-LIFECYCLE.md
    SPEC-TEMPLATES.md
    SPEC-ROUTING.md
```

`SKILL.md` should stay short and operational. Long templates and examples belong
in references so the discovery and compaction footprint stays small.

Planned frontmatter:

```yaml
---
description: Manage caol-ila specs across intake, create, update, review, archive, and delete flows; route to domain-specific spec skills when they fit.
argument-hint: "<create|update|review|archive|delete> [slug]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git:*), Bash(rg:*), Bash(test:*), Bash(node:*), Bash(mkdir:*)
domains: caol
repo-keys: caol-ila
languages: markdown,yaml,json
task-types: authoring,review
context-profile: caol-authoring
---
```

`caol-authoring` does not exist yet. The implementation batch must either add a
`caol-authoring` context profile or add a temporary routing metadata exemption
with a review date.

## Command Surface

The skill should accept these modes:

| Mode | Purpose | Default persistence |
|------|---------|---------------------|
| `create <slug>` | create a new spec from intake and evidence | direct spec + optional intake |
| `update <slug>` | modify an existing spec while preserving its decisions | direct spec |
| `review <slug-or-path>` | audit a spec for missing inputs, weak decisions, and unverifiable validation | review findings in chat; patch only if asked |
| `archive <slug>` | mark a spec archived, completed, superseded, or parked | direct spec status update |
| `delete <slug>` | remove a spec only after explicit user approval | destructive git diff |
| `route <slug-or-request>` | classify a request without writing | chat summary or intake draft |

If the user says "spec first", "make a plan doc", "draft the task spec", or
"write the spec", default to `create` unless an existing spec clearly matches.

If the user says "review", use review mode.

If the user says "cleanup specs", "done specs", "archive this", or "remove
this spec", use archive mode first. Use delete only when the user explicitly
asks to delete the file.

## Artifact Locations

| Artifact | Path | Required |
|----------|------|----------|
| Direct caol spec | `docs/plans/<slug>.md` | yes |
| Spec intake | `docs/briefings/specs/<slug>.md` | optional by default, required for high-risk specs |
| Shotloom briefing | `docs/briefings/shotloom/<slug>.md` | owned by Shotloom flow |
| Review report | `docs/plans/<slug>-review.md` or chat-only | optional, prefer chat unless asked to persist |
| Conflict draft | `docs/plans/<slug>.draft.md` | only when create/update cannot safely converge |
| Alternate draft | `docs/plans/<slug>.claude.md` or `.codex.md` | only when preserving competing bodies |
| Milestone | `docs/milestones/<slug>.md` | optional; required for multi-spec efforts |

High-risk specs are specs that touch shared policy, validators, path routing,
skill/rule/standard CRUD, deploy targets, Obsidian vault structure, or
multi-repo behavior.

Milestones group multiple specs into a larger outcome. They are tracked in
`docs/milestones/`; the current milestone for this spec is
`spec-lifecycle-system`.

Milestone CRUD belongs to [caol-manage-milestone.md](caol-manage-milestone.md).
This spec may set or read `milestone:` frontmatter, but umbrella progress and
spec attachment tables are managed by the milestone workflow.

## Intake Contract

Every create or major update starts by assembling an intake set. The intake may
be chat-only for small changes, but high-risk specs must persist an intake
artifact.

Template:

```markdown
---
status: intake
created: YYYY-MM-DD
updated: YYYY-MM-DD
owner: caol-ila
spec: docs/plans/<slug>.md
---

# Spec Intake: <slug>

## User Request

<verbatim or concise paraphrase of the request>

## Goal

<what the resulting spec must enable>

## Route

- selected route:
- candidate routes:
- delegated or referenced skills:

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| file |  |  |
| directory |  |  |
| skill |  |  |
| rule |  |  |
| standard |  |  |
| external |  |  |

## Known Decisions

-

## Open Questions

-

## Exclusions

-

## Validation Expected

-
```

The intake artifact records why the route and evidence set were chosen. It does
not need to duplicate the final spec body.

## Routing Matrix

| Request shape | Route | Reuse |
|---------------|-------|-------|
| Shotloom task implementation spec | Shotloom | use `shotloom-draft-spec`; do not reimplement Shotloom briefing rules |
| Existing code, directory, or branch diff needs technical spec | code-derived | use `dev-generate-spec` template and analysis order |
| Web/product/PRD spec needs audit | web spec review | use `review-audit-web-spec` checklist when applicable |
| caol-ila policy, architecture, path, validator, skill/rule/standard work | caol operational spec | use `caol-manage-spec` templates |
| Obsidian vault structure, note contracts, write policy | obsidian docs route | read Obsidian rules/skills only as needed |
| Unknown or mixed route | intake-only first | ask one short question or write a `.draft.md` if evidence conflicts |

Routing must be evidence-based:

1. Use the user's words.
2. Use cwd, repo remote, and named repo keys.
3. Use named files, extensions, frontmatter, and paths.
4. Use existing `context-routing.json` profiles.
5. Load only the selected route's references.

## Lifecycle States

The skill should normalize future specs toward a small lifecycle vocabulary
while preserving legacy states until a separate migration.

Preferred states:

| State | Meaning |
|-------|---------|
| `draft` | written but not ready to execute |
| `proposed` | ready for user review or cold-start review |
| `active` | accepted and currently being implemented |
| `implemented` | implementation done; validation may still be pending |
| `completed` | implementation and validation complete |
| `blocked` | cannot proceed without a decision or external dependency |
| `parked` | intentionally paused |
| `superseded` | replaced by another spec |
| `archived` | retained for history, not active work |

Legacy states such as `open`, `done`, and `implemented-validation-blocked`
should not be mass-changed by this skill in the first batch. When updating a
legacy spec, the skill may normalize the state only if that is part of the
requested edit or necessary for the lifecycle action.

## Direct Spec Template

General caol operational specs should use this structure:

```markdown
---
status: proposed
created: YYYY-MM-DD
updated: YYYY-MM-DD
owner: caol-ila
---

# <Title>

## Purpose

## Problem

## Goals

## Non-Goals

## Current State

## Proposed Design

## Execution Plan

## Validation

## Risks

## Open Decisions

## Acceptance Criteria
```

Sections may be omitted for small specs, but high-risk specs must include all
sections.

## Create Mode

Create mode should:

1. Resolve the slug.
2. Check whether `docs/plans/<slug>.md` already exists.
3. Gather intake.
4. Route to a domain-specific flow when it clearly fits.
5. Search existing specs for related work.
6. Read only the necessary rules, standards, skills, and source files.
7. Draft the direct spec.
8. Review the draft for missing evidence, impossible validation, unclear
   decisions, and destructive operations.
9. Persist the direct spec and optional intake artifact.
10. Run validation.

Slug rules:

```text
^[a-z0-9]+(-[a-z0-9]+)*$
```

If no slug is provided, derive one from the request. If there is a collision,
read the existing spec and switch to update mode only when the user intent
matches that existing spec.

## Update Mode

Update mode should:

1. Read the existing spec first.
2. Preserve prior decisions unless the user explicitly changes them.
3. Append or update a decision record when scope changes.
4. Keep validation steps current with the new scope.
5. Update `updated: YYYY-MM-DD`.
6. Avoid rewriting the entire document when a focused patch is enough.

Stop and ask when:

1. the requested update conflicts with existing non-goals;
2. the spec has competing uncommitted edits;
3. the update would silently delete acceptance criteria;
4. the route points to a domain-specific skill with stricter rules.

## Review Mode

Review mode should lead with findings, not a summary. It checks:

| Area | Questions |
|------|-----------|
| Intake | Are inputs and evidence sources identifiable? |
| Route | Did the spec use the right domain workflow? |
| Scope | Are goals, non-goals, and exclusions clear? |
| Decisions | Are open decisions separated from accepted ones? |
| Validation | Can every validation command or manual check actually run? |
| Safety | Are destructive operations gated? |
| Lifecycle | Is status correct and future action obvious? |
| Cold start | Could a new agent continue from the file alone? |

For web/product specs, delegate checklist logic to `review-audit-web-spec` when
the route matches. For Shotloom specs, use the Shotloom review flow.

## Archive And Delete Modes

Archive mode should prefer metadata changes:

| User intent | Default action |
|-------------|----------------|
| done | set `status: completed` |
| no longer relevant | set `status: archived` |
| replaced by another spec | set `status: superseded` and link replacement |
| paused | set `status: parked` |

Delete mode is destructive. It requires:

1. explicit user request to delete;
2. exact file path confirmation in the response before editing;
3. `git status --short` review;
4. no uncommitted user edits in the target file unless the user explicitly
   confirms deletion;
5. final diff showing deletion only for the intended file.

## Evidence Policy

Specs should distinguish facts, decisions, and plans:

| Type | Requirement |
|------|-------------|
| Fact | cite a file, command result, existing doc, issue, or user statement |
| Decision | record who/what decided it and when, even if the source is the current chat |
| Plan | express as future work and include validation |
| Assumption | label clearly and keep it in Open Decisions or Risks |

Do not present guessed repo state as fact. If evidence is missing and the
decision matters, write a draft/conflict note or ask one short question.

## Existing Skill Reuse

`caol-manage-spec` should reference existing skills as follows:

| Skill | Load when | Use for |
|-------|-----------|---------|
| `dev-generate-spec` | user asks for spec from code/files/diff | code analysis order and technical spec template |
| `shotloom-draft-spec` | repo or request is clearly Shotloom implementation work | full Shotloom create/review/commit contract |
| `shotloom-draft-task-plan` | Shotloom compatibility flow needs implementation detail | conflict, update, and output rules |
| `review-audit-web-spec` | spec is web/product/PRD oriented | review checklist |
| `caol-make-skill` | implementing or changing spec-management skill | skill naming, frontmatter, routing metadata |
| `caol-resolve-doc-path` | spec must resolve repo or Obsidian paths | path lookup instead of hardcoded paths |

The orchestrator should not bulk-load all these skills at startup. It should
load the selected route's skill body only after routing.

## Planned Skill Coordination

`caol-manage-milestone` is a planned sibling skill, specified in
[caol-manage-milestone.md](caol-manage-milestone.md).

| Planned skill | Coordinate when | Use for |
|---------------|-----------------|---------|
| `caol-manage-milestone` | a spec must attach to or update a milestone | milestone document lifecycle and link integrity |

## Context And Routing Requirements

The implementation should add one of these:

1. a `caol` route domain plus `caol-authoring` profile in
   `agent/config/context-routing.json`; or
2. a metadata exemption for `caol-manage-spec` explaining why the profile should
   wait.

Candidate profile:

```json
{
  "id": "caol-authoring",
  "domains": ["caol"],
  "repoKeys": ["caol-ila"],
  "languages": ["markdown", "yaml", "json"],
  "taskTypes": ["authoring", "review"],
  "maxBytes": 25000
}
```

The same batch must add `caol` to `axes.domains` and keep that list sorted.

## Validation

Base validation for every implementation batch:

```bash
node scripts/validate-llm-first.mjs
git diff --check
git status --short --branch
```

Skill implementation validation:

```bash
test -f agent/skills/caol-manage-spec/SKILL.md
node scripts/validate-llm-first.mjs --check taxonomy
node scripts/validate-llm-first.mjs --check context-routing
```

Spec artifact validation:

```bash
test -f docs/plans/<slug>.md
rg -n "^status:|^created:|^updated:|^owner:" docs/plans/<slug>.md
```

Intake validation for high-risk specs:

```bash
test -f docs/briefings/specs/<slug>.md
rg -n "^## User Request|^## Route|^## Evidence To Read|^## Validation Expected" docs/briefings/specs/<slug>.md
```

If the validator is already red because of unrelated pre-existing violations,
the skill must report the exact blocker and still run `git diff --check`.

## Acceptance Criteria

The implementation is complete when:

1. `agent/skills/caol-manage-spec/SKILL.md` exists and stays under the skill
   body size target from `caol-make-skill`.
2. Long templates live in `references/`.
3. The skill can create a caol operational spec with intake.
4. The skill can update an existing `docs/plans/<slug>.md` without rewriting
   unrelated sections.
5. The skill can review a spec and lead with findings.
6. The skill can archive a spec without deleting it.
7. Delete mode is explicitly gated.
8. Existing Shotloom and code-derived spec skills are routed to instead of
   duplicated.
9. `node scripts/validate-llm-first.mjs` passes or reports only unrelated
   pre-existing blockers.
10. The final docs explain when to use `caol-manage-spec` versus existing
    domain-specific spec skills.

## Implementation Plan

### Batch A: Spec Contract

1. Land this spec.
2. Review this spec as if implementation already happened.
3. Patch missing post-implementation invariants before creating the skill.

### Batch B: Skill Skeleton

1. Create `agent/skills/caol-manage-spec/SKILL.md`.
2. Add references for intake, lifecycle, templates, and routing.
3. Keep `SKILL.md` concise and link to references.
4. Add routing metadata or exemption.
5. Run validators.

Status: implemented in `agent/skills/caol-manage-spec/`.

### Batch C: Pilot The Skill

1. Use the new skill to update `docs/plans/caol-architecture-hardening.md`.
2. Persist an intake artifact under `docs/briefings/specs/`.
3. Review whether the workflow avoided unnecessary context loading.

### Batch D: Lifecycle Cleanup

1. Draft a separate plan lifecycle migration if still needed.
2. Decide whether `docs/plans/` stays flat or moves to active/completed/archive
   folders.
3. Add validator support only after the filesystem structure is settled.

## Deferred TODOs

| TODO | Timing | Reason |
|------|--------|--------|
| Rename or move existing `docs/plans/` files into a lifecycle structure | after `caol-manage-spec` is implemented and piloted | keep this spec implementation focused; use the new skill as the migration controller |

## Risks

| Risk | Mitigation |
|------|------------|
| Skill becomes too broad | Keep orchestration in `SKILL.md`; put domain logic in route-specific skills |
| Intake adds too much overhead | Persist intake only for high-risk specs or when user asks |
| Existing spec skills drift | Reference them by path and load only on matching routes |
| Status migration causes churn | Normalize only touched specs at first |
| Review mode becomes generic prose | Require findings-first output with file/line references when possible |
| Delete mode removes user work | Require explicit deletion request and git status review |

## Open Decisions

| Decision | Default for implementation |
|----------|----------------------------|
| Should high-risk intake always persist? | yes |
| Should normal small specs persist intake? | no, chat-only intake is enough |
| Should generic specs auto-commit? | no |
| Should `caol-authoring` profile be added now? | yes, unless validator design prefers an exemption |
| Should plan lifecycle folders be changed now? | no, separate migration |
