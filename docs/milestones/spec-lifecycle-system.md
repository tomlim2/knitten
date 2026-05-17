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
| [caol-manage-spec.md](../plans/completed/caol-manage-spec.md) | implemented | define the spec intake, routing, CRUD, review, and lifecycle manager |
| [caol-review-implementation.md](../plans/completed/caol-review-implementation.md) | implemented | define the post-implementation spec/diff/validator review gate |
| [caol-manage-milestone.md](../plans/completed/caol-manage-milestone.md) | implemented | define milestone CRUD, spec attachment, progress review, and archive/delete behavior |
| [caol-architecture-hardening.md](../plans/active/caol-architecture-hardening.md) | active | adjacent architecture hardening work that supplies validator and path-cleanup context |
| [docs-plans-lifecycle-migration.md](../plans/active/docs-plans-lifecycle-migration.md) | active | define `docs/plans/` lifecycle folders, resolver updates, manifest generation, and move validation |
| [spec-validator-hardening.md](../plans/completed/spec-validator-hardening.md) | implemented | add validator checks for milestone links, spec back-links, status sync, duplicate slugs, and spec intake paths |

## Progress

| Phase | State | Evidence |
|-------|-------|----------|
| Milestone format | done | `docs/milestones/index.md` defines the Markdown contract |
| Spec manager design | done | `docs/plans/completed/caol-manage-spec.md` defines the skill contract |
| Milestone manager design | done | `docs/plans/completed/caol-manage-milestone.md` defines CRUD and attachment rules |
| Skill implementation | done | `agent/skills/caol-manage-spec/SKILL.md` exists with reference files |
| Implementation review skill | done | `agent/skills/caol-review-implementation/SKILL.md` exists |
| Milestone skill implementation | done | `agent/skills/caol-manage-milestone/SKILL.md` exists with reference files |
| Milestone attach pilot | done | `caol-manage-milestone.md` status and milestone row are updated through the new rules |
| Spec manager pilot | done | `caol-architecture-hardening.md` updated through `caol-manage-spec` with persisted intake |
| Lifecycle migration spec | done | `docs/plans/active/docs-plans-lifecycle-migration.md` exists before any physical move |
| Lifecycle migration manifest | done | `docs/plans/reports/docs-plans-lifecycle-migration/move-manifest.tsv` maps 90 rows |
| Lifecycle migration approved moves | partial | 64 approved rows moved into lifecycle folders; 26 legacy `open` specs remain at top-level for review |
| Validator hardening implementation | done | `spec-lifecycle` validates milestone links, spec back-links, status sync, duplicate slugs, and spec intake paths |

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
9. Validator support covers milestone file naming, milestone link consistency,
   spec back-links, duplicate spec slugs, and caol spec intake paths.

## Open Decisions

| Decision | Default |
|----------|---------|
| Should milestones be mirrored to Linear or GitHub? | no; Markdown is primary, mirrors are optional |
| Should `docs/plans/` be physically split by lifecycle state? | decide after `caol-manage-spec` pilot |
| Should every spec require a milestone? | no; only large or multi-spec efforts |

## Blockers

None.

## External Mirrors

None. Keep this milestone repo-native for now.
