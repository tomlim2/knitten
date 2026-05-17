---
status: active
created: 2026-05-17
updated: 2026-05-17
owner: caol-ila
target-date:
---

# Spec Lifecycle System

## Purpose

Build a repo-native spec document lifecycle for caol-ila: intake, routing,
create, update, review, archive, delete, milestone grouping, and validator
support.

## Scope

This milestone covers the system that makes specs durable and easy for future
agents to continue from disk. It includes the `caol-manage-spec` skill, milestone
format, later `docs/plans/` lifecycle cleanup, and validator hardening.

## Specs

| Spec | Status | Role |
|------|--------|------|
| [caol-manage-spec.md](../plans/caol-manage-spec.md) | implemented | define the spec intake, routing, CRUD, review, and lifecycle manager |
| [caol-review-implementation.md](../plans/caol-review-implementation.md) | implemented | define the post-implementation spec/diff/validator review gate |
| [caol-manage-milestone.md](../plans/caol-manage-milestone.md) | proposed | define milestone CRUD, spec attachment, progress review, and archive/delete behavior |
| [caol-architecture-hardening.md](../plans/caol-architecture-hardening.md) | proposed | adjacent architecture hardening work that supplies validator and path-cleanup context |
| `docs-plans-lifecycle-migration.md` | todo | future migration for plan/spec folder lifecycle and renames |
| `spec-validator-hardening.md` | todo | future validator checks for milestones, spec links, and lifecycle drift |

## Progress

| Phase | State | Evidence |
|-------|-------|----------|
| Milestone format | in-progress | `docs/milestones/index.md` defines the Markdown contract |
| Spec manager design | done | `docs/plans/caol-manage-spec.md` defines the skill contract |
| Milestone manager design | in-progress | `docs/plans/caol-manage-milestone.md` defines CRUD and attachment rules |
| Skill implementation | done | `agent/skills/caol-manage-spec/SKILL.md` exists with reference files |
| Implementation review skill | done | `agent/skills/caol-review-implementation/SKILL.md` exists |
| Milestone skill implementation | todo | `agent/skills/caol-manage-milestone/SKILL.md` does not exist yet |
| Pilot | todo | first pilot should update `caol-architecture-hardening.md` through the new skill |
| Lifecycle migration | deferred | rename/move work is explicitly deferred until after the pilot |
| Validator hardening | todo | taxonomy registers milestone filenames; deeper link/status checks are future work |

## Acceptance Criteria

1. `docs/milestones/` has an accepted milestone contract.
2. `agent/skills/caol-manage-spec/SKILL.md` exists and routes to existing spec
   skills when appropriate.
3. `agent/skills/caol-review-implementation/SKILL.md` exists and can review a
   completed caol implementation against spec, diff, validators, generated
   views, routing, and deploy-target sync.
4. `agent/skills/caol-manage-milestone/SKILL.md` exists and can attach specs to
   milestone docs.
5. High-risk specs can persist intake under `docs/briefings/specs/`.
6. Specs can point to a milestone through frontmatter.
7. Milestone progress can be reviewed from Markdown without opening GitHub,
   GitLab, Linear, or another tracker.
8. `docs/plans/` rename/move work has a separate migration spec before it runs.
9. Validator support covers milestone file naming and later covers milestone
   link consistency.

## Open Decisions

| Decision | Default |
|----------|---------|
| Should milestones be mirrored to Linear or GitHub? | no; Markdown is primary, mirrors are optional |
| Should `docs/plans/` be physically split by lifecycle state? | decide after `caol-manage-spec` pilot |
| Should every spec require a milestone? | no; only large or multi-spec efforts |

## Blockers

| Blocker | Impact |
|---------|--------|
| Existing validator terminology failure in `obsidian-root-projects-daily-migration.md` | full validator remains red until fixed |

## External Mirrors

None. Keep this milestone repo-native for now.
