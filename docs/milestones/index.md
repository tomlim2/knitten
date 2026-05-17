---
status: accepted
created: 2026-05-17
updated: 2026-05-17
owner: caol-ila
---

# Milestone Index

## Purpose

Milestones are durable umbrella records for multi-spec outcomes. A milestone
groups related specs, tracks progress, and records the completion conditions for
a larger system change.

Milestones are not implementation specs. Keep implementation contracts in
`docs/plans/`. Keep broad grouping and progress in `docs/milestones/`.

## Industry Notes

This format follows the common shape used by issue trackers while keeping the
repo Markdown as the canonical owner for agent work:

| Source | Useful idea for caol-ila |
|--------|--------------------------|
| [GitHub milestones](https://docs.github.com/en/issues/using-labels-and-milestones-to-track-work/creating-and-editing-milestones-for-issues-and-pull-requests) | milestones group issues and pull requests in a repository; descriptions render Markdown |
| [Linear project milestones](https://linear.app/docs/project-milestones) | milestones divide a project lifecycle into stages and show progress from assigned issues |
| [GitLab milestones](https://docs.gitlab.com/user/project/milestones/) | milestones group related work toward a goal, can have dates, and can exist at project or group scope |

## LLM-First Contract

1. A milestone must be readable without opening an external tracker.
2. Specs remain the executable work contracts.
3. External tools such as GitHub, GitLab, or Linear may mirror the milestone,
   but they do not own the repo contract.
4. A milestone links to every included spec.
5. Progress must be expressed as explicit states, not prose vibes.
6. Open decisions and blockers must be visible in the milestone body.
7. Delete no milestone by default; archive or supersede it.

## CRUD Contract

Milestone CRUD is specified in
[caol-manage-milestone.md](../plans/completed/caol-manage-milestone.md).

| Operation | Default behavior |
|-----------|------------------|
| create | create `docs/milestones/<slug>.md` from the template |
| update | patch scope, progress, blockers, decisions, or mirrors |
| attach | add a spec row and set the spec's `milestone:` frontmatter |
| detach | remove a spec relationship without deleting the spec |
| review | audit links, progress, acceptance criteria, and blockers |
| archive | change status and preserve the file |
| delete | require explicit user approval; never delete linked specs |

## Folder Contract

```text
docs/milestones/
  index.md
  <milestone-slug>.md
```

Milestone filenames must be kebab-case Markdown files:

```text
^[a-z0-9]+(-[a-z0-9]+)*.md
```

## Current Milestones

| Milestone | Status | Role |
|-----------|--------|------|
| [spec-lifecycle-system.md](spec-lifecycle-system.md) | active | spec, milestone, and lifecycle-management system |
| [knitten-rename.md](knitten-rename.md) | active | rename internal identity from `caol-ila` to `Knitten` |

## Template

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

## Status Values

Prefer:

| Status | Meaning |
|--------|---------|
| `proposed` | candidate milestone, not accepted |
| `active` | accepted umbrella currently being worked |
| `completed` | all acceptance criteria are satisfied |
| `parked` | intentionally paused |
| `blocked` | waiting on an external dependency or decision |
| `superseded` | replaced by another milestone |
| `archived` | retained for history, not active work |

## Related Specs

| Spec | Role |
|------|------|
| [caol-manage-spec.md](../plans/completed/caol-manage-spec.md) | individual spec lifecycle |
| [caol-manage-milestone.md](../plans/completed/caol-manage-milestone.md) | milestone lifecycle and spec attachment |
