---
status: proposed
created: 2026-05-22
updated: 2026-05-22
owner: agent-hub
milestone:
---

# Shotloom Big Five Skill Model

## Purpose

Define an LLM-friendly workflow model for Shotloom skills: a small set of
primary work lanes, a closed taxonomy for non-lane helpers, and a rollout plan
that can be validated from disk instead of inferred from prose.

## Problem

Shotloom has a strong skill library, but the current mental model is open-ended.
Users and agents often need to remember exact leaf names instead of starting
from a stable workflow phase. The existing draft of the Big Five idea improves
the narrative shape, but still leaves gaps:

- it does not classify the full Shotloom skill inventory;
- it leaves some skills implied rather than explicitly bucketed;
- it treats `shotloom-start-task` as both planning and implementation without
  naming the handoff rule;
- it does not define validation that proves the taxonomy rollout actually
  landed.

## Goals

| Goal | Result |
|------|--------|
| Define the Big Five | Planning, Implementation, Review, Respond, and Wrapup become the canonical workflow lanes. |
| Close the taxonomy | Every `shotloom-*` skill is classified into a lane or an explicit non-lane bucket. |
| Reduce routing ambiguity | Vague user requests have one default entrypoint per lane. |
| Preserve existing behavior | This phase changes docs, classification, and routing guidance before any rename or behavior refactor. |
| Make rollout machine-checkable | Future implementation can be verified with file existence and classification checks, not just narrative review. |

## Non-Goals

| Non-Goal | Reason |
|----------|--------|
| Rename Shotloom skills in this phase | Naming should follow stable classification, not precede it. |
| Merge the skill library into five giant skills | Helpers and utilities remain specialized. |
| Change Shotloom repo gates, approval rules, or GitHub/Linear policy | Those rules remain owned by `agent/rules/shotloom.md` and skill-local workflow logic. |
| Replace existing hub route skills | `ah-route-plan`, `ah-route-implementation`, and `ah-route-review` keep their current ownership. |

## Taxonomy

The model uses three levels:

| Level | Meaning |
|-------|---------|
| `track` | Top-level family: `authoring` or `ops`. |
| `lane` | Workflow phase inside the `authoring` track: `planning`, `implementation`, `review`, `respond`, `wrapup`. `ops` skills do not use a lane value. |
| `role` | How the skill participates: `entrypoint`, `helper`, `utility`, `watcher`, or `reference`. |

Closed-set rules:

1. Every `shotloom-*` skill must have exactly one `track`.
2. Skills in `track = authoring` must have exactly one `lane`.
3. Skills in `track = ops` must not use a lane value.
4. Every `shotloom-*` skill must have exactly one `role`.
5. `entrypoint` means "default first skill for vague requests in that lane or track."
6. `helper` means "supporting skill normally invoked after the entrypoint."
7. `utility` means "task-specific tool not meant to define workflow order."
8. `watcher` means "observes or reports state changes instead of driving the
   main workflow."
9. `reference` means "compatibility or migration surface kept for continuity,
   not the preferred entrypoint."

## Default Routing

When the user is vague, the system should prefer these defaults:

| User intent | Track | Default skill | Notes |
|-------------|-------|---------------|-------|
| "start this task", "plan this", "what am I doing?" | `authoring` | `shotloom-start-task` | Planning entrypoint. |
| "implement this", "make the change" | `authoring` | `shotloom-start-task` first, then normal repo work | Implementation has no separate entry skill today; `shotloom-start-task` is the pre-write gate and handoff. |
| "review before PR" | `authoring` | `shotloom-review-before-pr` | Review entrypoint. |
| "handle PR comments" | `authoring` | `shotloom-respond-pr` | Respond entrypoint. |
| "finish this task", "clean up", "close it out" | `authoring` | `shotloom-wrapup-task` | Wrapup entrypoint. |
| "what's on my plate today?", "show status", "deploy this" | `ops` | route by intent: `shotloom-linear-today`, `shotloom-status`, `shotloom-deploy-web` | Ops requests are explicit track-level entrypoints, not part of the Big Five lanes. |

Implementation handoff rule:

After `shotloom-start-task` completes, implementation proceeds as normal Codex
repo work, with `shotloom-check-gates` and `shotloom-commit` as lane helpers.

## Full Skill Inventory

| Skill | Track | Lane | Role | Notes |
|-------|-------|------|------|-------|
| `shotloom-start-task` | `authoring` | `planning` | `entrypoint` | Canonical task-start gate; also hands off into implementation. |
| `shotloom-draft-spec` | `authoring` | `planning` | `helper` | Writes the task spec after task start. |
| `shotloom-draft-task-plan` | `authoring` | `planning` | `reference` | Compatibility surface; prefer `shotloom-draft-spec`. |
| `shotloom-review-task-plan` | `authoring` | `planning` | `helper` | Reviews an existing task spec before implementation. |
| `shotloom-prepare-task` | `authoring` | `planning` | `helper` | Bundles task start + spec work into a stop-before-implementation flow. |
| `shotloom-draft-adr` | `authoring` | `planning` | `utility` | Durable design-record helper, not a default task start. |
| `shotloom-blocker-to-linear` | `authoring` | `planning` | `utility` | Progress/blocker communication helper during task execution. |
| `shotloom-check-gates` | `authoring` | `implementation` | `helper` | Runs the canonical local gate bundle. |
| `shotloom-commit` | `authoring` | `implementation` | `helper` | Commit helper after implementation changes. |
| `shotloom-analyze-rig` | `authoring` | `implementation` | `utility` | Narrow analysis scripts for retarget-pipeline debugging. |
| `shotloom-open-web` | `authoring` | `implementation` | `utility` | Local editor/dev-server launcher. |
| `shotloom-review-before-pr` | `authoring` | `review` | `entrypoint` | Canonical author-side pre-PR review. |
| `shotloom-review-code` | `authoring` | `review` | `helper` | Code-review specialist pass. |
| `shotloom-review-docs` | `authoring` | `review` | `helper` | Docs-review specialist pass. |
| `shotloom-review-pr` | `authoring` | `review` | `utility` | Reviewer-side PR review flow, not author-side readiness check. |
| `shotloom-respond-pr` | `authoring` | `respond` | `entrypoint` | Manual author-side PR feedback response flow. |
| `shotloom-auto-pr` | `authoring` | `respond` | `helper` | Background auto-responder for PR activity. |
| `shotloom-verify-review` | `authoring` | `respond` | `helper` | Verifies a submitted review landed and watches for follow-up. |
| `shotloom-watch-pr` | `authoring` | `respond` | `watcher` | Passive PR polling and notification. |
| `shotloom-wrapup-task` | `authoring` | `wrapup` | `entrypoint` | End-of-task lifecycle closeout. |
| `shotloom-make-pr` | `authoring` | `wrapup` | `helper` | PR drafting/opening helper after review is clean. |
| `shotloom-linear-move` | `authoring` | `wrapup` | `helper` | Linear state transition helper used by task lifecycle skills. |
| `shotloom-promote-review-patterns` | `authoring` | `wrapup` | `utility` | Post-task promotion of review learnings into reusable patterns. |
| `shotloom-linear-today` | `ops` | | `entrypoint` | Daily queue view for picking work. |
| `shotloom-linear-stale` | `ops` | | `utility` | Stale-ticket audit and hygiene tool. |
| `shotloom-status` | `ops` | | `utility` | Snapshot of active worktrees, PRs, and Linear work. |
| `shotloom-make-preflight` | `ops` | | `utility` | Session bootstrap for forking into actual task work. |
| `shotloom-deploy-web` | `ops` | | `utility` | Deploy and rollout workflow, separate from authoring lanes. |
| `shotloom-send-deploy-status` | `ops` | | `helper` | Communication helper for deploy status. |

## Proposed Design

Canonical authoring lane entrypoints:

| Lane | Entry skill | Why |
|------|-------------|-----|
| `planning` | `shotloom-start-task` | It is already the repo's pre-write task gate and evidence gatherer. |
| `implementation` | no separate skill; start from `shotloom-start-task` handoff | Current workflow does not have a dedicated implementation entry surface. |
| `review` | `shotloom-review-before-pr` | It already owns pre-PR readiness review. |
| `respond` | `shotloom-respond-pr` | It already owns manual author-side review response. |
| `wrapup` | `shotloom-wrapup-task` | It already owns task closure and cleanup. |

Canonical taxonomy artifact:

- Add `agent/standards/shotloom/workflow-taxonomy.md` as the durable reference
  for the Big Five lanes, ops track, default routing, and full inventory.
- Keep skill-local workflow detail in each `SKILL.md`; the standard owns the
  cross-skill map.

Design rules:

1. The taxonomy must be total: every `shotloom-*` skill appears in the inventory.
2. The taxonomy must be closed: track, lane, and role values come from the
   named sets above only.
3. Each authoring lane gets at most one default entrypoint.
4. The `ops` track may define multiple intent-specific entrypoints.
5. Skills may keep their current names until the overlap audit proves a rename
   is useful.
6. Shared GitHub/Linear/Shotloom operational truth belongs in
   `agent/rules/shotloom.md`; lane-specific workflow rules stay in the owning
   skill.

## Execution Plan

| Phase | Action | Output |
|-------|--------|--------|
| 1. Taxonomy standard | Add `agent/standards/shotloom/workflow-taxonomy.md` with tracks, lanes, roles, default routing, and full inventory. | One canonical owner document for the model. |
| 2. Skill annotation | Update each relevant Shotloom `SKILL.md` to state `track`, `lane` when applicable, and `role` in a consistent body section or frontmatter. | The inventory can be checked against the skills themselves. |
| 3. Routing polish | Update generic guidance so vague requests point to lane entrypoints first and mention helpers second. | Lower ambiguity during cold start. |
| 4. Overlap audit | Identify confusing names, duplicated helpers, and weak compatibility shims. | Evidence-backed rename or alias list. |
| 5. Rename follow-up | Rename only approved targets; preserve compatibility wrappers where needed. | Cleaner visible surface with lower breakage risk. |

## Validation

Future rollout must prove the model landed:

```bash
test -f agent/standards/shotloom/workflow-taxonomy.md
rg -n "^## Track$|^## Lane$|^## Role$|^## Inventory$" agent/standards/shotloom/workflow-taxonomy.md
rg -n "track:|Track:" agent/skills/shotloom-*/SKILL.md
rg -n "lane:|Lane:" agent/skills/shotloom-*/SKILL.md
rg -n "role:|Role:" agent/skills/shotloom-*/SKILL.md
test "$(rg --files agent/skills | rg '/shotloom-[^/]+/SKILL\\.md$' | wc -l | tr -d ' ')" = "$(rg -c '^\\| `shotloom-' agent/standards/shotloom/workflow-taxonomy.md | tr -d ' ')"
git diff --check
node scripts/validate-llm-first.mjs
```

Interpretation rules:

- The count check is a floor, not the only review criterion; names and buckets
  must also match.
- `ops` skills should show `track` and `role`, but may omit `lane`.
- If skill-local annotation uses body sections instead of frontmatter, the
  validation command may change, but machine-readable markers remain required.

## Risks

| Risk | Control |
|------|---------|
| The model becomes another abstract doc nobody consults | Put the taxonomy in a durable standard and route vague requests through the declared entrypoints. |
| `shotloom-start-task` still feels overloaded | State the implementation handoff rule explicitly instead of pretending a separate implementation entrypoint exists. |
| Ops and watcher skills dilute the Big Five | Keep them in the taxonomy, but outside the primary authoring lanes through the `ops` track and `watcher` role. |
| Early renaming creates churn | Keep rename work in a later phase after overlap evidence exists. |

## Acceptance Criteria

| Criterion | Check |
|-----------|-------|
| The taxonomy is closed and total. | Every `shotloom-*` skill is classified into exactly one track and role, and authoring skills also have exactly one lane. |
| Default routing is explicit. | The spec defines one default entrypoint per primary authoring lane, intent-specific ops entrypoints, and the implementation handoff rule. |
| Non-authoring work is named instead of improvised. | The `ops` track plus `utility`, `watcher`, and `reference` roles are explicitly defined and used. |
| The canonical artifact path is fixed. | The spec names `agent/standards/shotloom/workflow-taxonomy.md` as the durable map. |
| Rollout can be verified from disk. | Validation checks for the artifact, skill annotations, and inventory coverage. |

## Open Decisions

| Decision | Default |
|----------|---------|
| Skill-local annotation format | Start with a consistent body section; move to frontmatter only if validators or routers need stricter parsing. |
| Whether reviewer-side flows should later split from `review` into a separate lane | Keep them under `review` for now, because they are not the main source of user ambiguity. |
