---
status: implemented
created: 2026-05-17
updated: 2026-05-17
owner: caol-ila
milestone: spec-lifecycle-system
---

# Caol Manage Milestone

## Purpose

Create a general caol-ila skill for managing Markdown milestones as durable
umbrella records for multi-spec outcomes.

The working name is `caol-manage-milestone`.

## Problem

caol-ila now has a milestone folder and an initial milestone contract, but there
is no repeatable workflow for creating, updating, reviewing, archiving, or
deleting milestone documents. Without a workflow, milestones can drift away from
the specs they group.

Milestone management needs a different shape from spec management:

| Layer | Owns | Does not own |
|-------|------|--------------|
| Spec | executable work contract for one task or bounded change | broad progress across multiple specs |
| Milestone | umbrella progress, spec grouping, blockers, and acceptance criteria across related specs | detailed implementation instructions |

## Goals

1. Create a reusable skill for milestone create, update, review, archive, and
   delete flows.
2. Support attaching and detaching specs from milestones.
3. Keep milestone docs in `docs/milestones/<slug>.md`.
4. Keep specs as the executable contracts in `docs/plans/<slug>.md`.
5. Make milestone progress readable from Markdown without opening external
   trackers.
6. Keep external mirrors optional and clearly secondary.
7. Gate destructive delete operations behind explicit user approval.
8. Add validation hooks for file naming and later link consistency.

## Non-Goals

1. Do not replace `caol-manage-spec`.
2. Do not require every spec to belong to a milestone.
3. Do not create Linear, GitHub, or GitLab milestones automatically in the first
   implementation.
4. Do not infer completion from prose alone.
5. Do not move existing `docs/plans/` files as part of milestone CRUD.

## Skill Shape

Path:

```text
agent/skills/caol-manage-milestone/
  SKILL.md
  references/
    MILESTONE-LIFECYCLE.md
    MILESTONE-TEMPLATE.md
    MILESTONE-VALIDATION.md
```

`SKILL.md` should stay concise. Template detail, status rules, and validator
details belong in references.

Frontmatter:

```yaml
---
description: Manage caol-ila milestones across create, update, attach, detach, review, archive, and delete flows for docs/milestones.
argument-hint: "<create|update|attach|detach|review|archive|delete> [milestone] [spec]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(git:*), Bash(rg:*), Bash(test:*), Bash(node:*), Bash(mkdir:*)
domains: caol
repo-keys: caol-ila
languages: markdown,yaml,json
task-types: authoring,review
context-profile: caol-authoring
---
```

This uses the `caol` route domain and `caol-authoring` context profile.

## Command Surface

| Mode | Purpose | Writes |
|------|---------|--------|
| `create <milestone>` | create a milestone document from the template | `docs/milestones/<milestone>.md` |
| `update <milestone>` | update scope, progress, blockers, decisions, or mirrors | milestone doc |
| `attach <milestone> <spec>` | add a spec to the milestone and set spec frontmatter | milestone doc + spec doc |
| `detach <milestone> <spec>` | remove the link between milestone and spec | milestone doc + spec doc |
| `review <milestone>` | audit links, progress, blockers, and acceptance criteria | chat findings; patch only if asked |
| `archive <milestone>` | mark completed, parked, superseded, or archived | milestone doc |
| `delete <milestone>` | delete only after explicit user approval | destructive file deletion |

If the user says "make a milestone", "track this as a milestone", or "group
these specs", default to create or attach mode.

If the user says "review milestone", use review mode and lead with findings.

If the user says "done", "pause", "supersede", or "archive" for a milestone,
use archive mode rather than delete.

## Artifact Contract

| Artifact | Path | Required |
|----------|------|----------|
| Milestone | `docs/milestones/<slug>.md` | yes |
| Milestone index | `docs/milestones/index.md` | yes |
| Linked specs | `docs/plans/<slug>.md` | optional but recommended |
| External mirrors | URLs in `## External Mirrors` | optional |

Milestone filenames must match:

```text
^[a-z0-9]+(-[a-z0-9]+)*.md
```

Milestone frontmatter:

```yaml
---
status: active
created: YYYY-MM-DD
updated: YYYY-MM-DD
owner: caol-ila
target-date:
---
```

Optional frontmatter:

```yaml
external:
  linear:
  github:
  gitlab:
```

Do not put long spec lists in frontmatter. Keep them in the `## Specs` table so
agents can edit them with normal Markdown patches.

## Milestone Template

```markdown
---
status: active
created: YYYY-MM-DD
updated: YYYY-MM-DD
owner: caol-ila
target-date:
---

# <Milestone Title>

## Purpose

## Scope

## Specs

| Spec | Status | Role |
|------|--------|------|

## Progress

| Phase | State | Evidence |
|-------|-------|----------|

## Acceptance Criteria

## Open Decisions

## Blockers

## External Mirrors
```

## Lifecycle States

Preferred states:

| State | Meaning |
|-------|---------|
| `proposed` | candidate milestone, not accepted |
| `active` | accepted umbrella currently being worked |
| `completed` | all acceptance criteria are satisfied |
| `blocked` | waiting on a decision or external dependency |
| `parked` | intentionally paused |
| `superseded` | replaced by another milestone |
| `archived` | retained for history, not active work |

Completion requires evidence:

1. all required specs are completed or explicitly removed from scope;
2. acceptance criteria have evidence;
3. blockers are empty or intentionally closed;
4. open decisions are empty or moved to a follow-up milestone/spec.

## Attach Mode

Attach mode should:

1. Read the milestone document.
2. Read the spec document.
3. Add or update `milestone: <milestone>` in spec frontmatter.
4. Add or update the spec row in the milestone `## Specs` table.
5. Use the spec frontmatter status as the milestone row status unless the user
   explicitly asks for a different display status.
6. Update milestone and spec `updated: YYYY-MM-DD`.
7. Run validation.

Stop and ask when:

1. the spec already belongs to another active milestone;
2. the spec file is missing;
3. the milestone file is missing and the user did not ask to create it;
4. the target spec has uncommitted user edits that would be overwritten.

## Detach Mode

Detach mode should:

1. Read both files.
2. Remove the spec row from the milestone `## Specs` table.
3. Remove `milestone:` from spec frontmatter only when no replacement milestone
   is given.
4. If a replacement milestone is given, move the spec with attach semantics.
5. Update `updated: YYYY-MM-DD`.

Detach is not delete. It only changes the relationship between the documents.

## Review Mode

Review mode checks:

| Area | Questions |
|------|-----------|
| Link integrity | Do linked spec files exist? |
| Back-links | Does each linked spec frontmatter point back to this milestone? |
| Status consistency | Are milestone rows consistent with spec frontmatter states? |
| Progress | Does every progress row cite evidence? |
| Acceptance | Can completion be checked from disk? |
| Decisions | Are open decisions actionable and assigned to a next step? |
| Blockers | Are blockers still real? |
| External mirrors | Are mirrors optional and clearly secondary? |

Review output must lead with findings. It may include a short summary after
findings.

## Archive And Delete Modes

Archive mode changes frontmatter and preserves the file:

| User intent | Default state |
|-------------|---------------|
| done | `completed` |
| no longer active | `archived` |
| replaced | `superseded` |
| paused | `parked` |
| waiting | `blocked` |

Delete mode is destructive and requires:

1. explicit user request to delete;
2. exact milestone file path confirmation before editing;
3. `git status --short` review;
4. no uncommitted user edits in the file unless the user explicitly confirms;
5. final diff showing deletion only for the intended milestone.

Deleting a milestone must not delete linked specs.

## Relationship To Spec Management

`caol-manage-spec` and `caol-manage-milestone` should cooperate:

| Scenario | Owning skill |
|----------|--------------|
| Create or update one spec | `caol-manage-spec` |
| Group specs under a milestone | `caol-manage-milestone` |
| Add `milestone:` while creating a spec | `caol-manage-spec`, then call milestone attach rules |
| Review one spec | `caol-manage-spec` |
| Review umbrella progress | `caol-manage-milestone` |
| Migrate `docs/plans/` lifecycle folders | separate spec, probably coordinated by both |

The milestone skill must not duplicate the spec intake and routing logic. It
should read spec metadata and links, then manage umbrella progress.

## Validation

Base validation:

```bash
node scripts/validate-llm-first.mjs
git diff --check
git status --short --branch
```

Milestone file validation:

```bash
test -f docs/milestones/<slug>.md
rg -n "^status:|^created:|^updated:|^owner:" docs/milestones/<slug>.md
```

Attach validation:

```bash
rg -n "^milestone: <slug>$" docs/plans/<spec>.md
rg -n "../plans/<spec>.md|docs/plans/<spec>.md" docs/milestones/<slug>.md
```

Future validator checks:

1. every `docs/plans/*.md` `milestone:` value maps to a file in
   `docs/milestones/`;
2. every milestone `## Specs` row links to an existing spec or is marked `todo`;
3. linked spec status and milestone row status either match or document the
   reason for mismatch;
4. completed milestones have no unresolved blockers.

## Acceptance Criteria

The implementation is complete when:

1. `agent/skills/caol-manage-milestone/SKILL.md` exists.
2. The skill can create a milestone from the template.
3. The skill can attach a spec by updating both documents.
4. The skill can detach a spec without deleting it.
5. The skill can review a milestone and lead with findings.
6. The skill can archive a milestone without deleting it.
7. Delete mode is explicitly gated.
8. Taxonomy validates `docs/milestones/` filenames.
9. The `Spec Lifecycle System` milestone is updated through the new rules.

## Implementation Plan

### Batch A: Milestone CRUD Spec

1. Land this spec.
2. Review it against the existing milestone index and `caol-manage-spec`.
3. Patch missing invariants before implementing the skill.

### Batch B: Skill Skeleton

Status: implemented in `agent/skills/caol-manage-milestone/`.

### Batch C: Pilot

Status: implemented for the current milestone row and spec frontmatter.

## Risks

| Risk | Mitigation |
|------|------------|
| Milestones duplicate specs | Keep implementation detail in specs and umbrella progress in milestones |
| Status drift | Review mode checks spec frontmatter against milestone rows |
| External tracker confusion | Markdown remains primary; mirrors are optional links |
| Deleting a milestone loses context | Archive by default; delete requires explicit approval |
| Validator becomes too strict too early | Start with filename checks, add link checks after pilot |

## Open Decisions

| Decision | Default for implementation |
|----------|----------------------------|
| Should every large spec require a milestone? | no; require only multi-spec efforts |
| Should milestone rows auto-sort? | no; preserve deliberate phase/order |
| Should external mirrors be created automatically? | no |
| Should attach mode auto-create missing milestones? | ask unless user explicitly requested create-and-attach |
