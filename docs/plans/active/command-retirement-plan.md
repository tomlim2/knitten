---
status: active
created: 2026-05-26
updated: 2026-05-26
owner: agent-hub
milestone: agent-artifact-pack-system
---

# Command Retirement Plan

## Purpose

Define how legacy `agent/commands/*.md` files are converted to skills, aliases,
compatibility shims, pack-owned commands, or deletion candidates.

Commands are migration sources. Skills, routers, templates, standards, and
artifact-pack manifests own durable workflow and policy.

## Problem

Knitten still has 45 command files. Many commands duplicate skill routes,
delegate to skills, or encode domain-specific workflows that should eventually
live behind artifact-pack routing.

This blocks the artifact-pack milestone because command rows remain
`migrate-later`, command adapter behavior is undecided, and old slash-command
paths cannot be removed safely.

## Goals

1. Classify every current command as skill-owned, alias/shim, pack-owned,
   rewrite-needed, or deletion-candidate.
2. Define deletion gates for old command paths.
3. Define when a command wrapper is allowed to remain.
4. Define adapter behavior for Claude slash commands and Codex skill routing.
5. Unblock inventory rows currently marked `migrate-later` because of command
   ambiguity.

## Non-Goals

1. Do not delete command files in this spec.
2. Do not move commands into artifact packs yet.
3. Do not rewrite large domain workflows in one batch.
4. Do not remove Claude slash-command compatibility before reference scans pass.
5. Do not create new command wrappers unless a user-facing slash route is still
   required.

## Current State

| Surface | Current state | Evidence |
|---------|---------------|----------|
| Command corpus | 45 command files exist. | `agent/commands/*.md` |
| Exact skill duplicates | No command has an exact same-name skill. | 2026-05-26 local inspection |
| Command rows | Command rows are held at `migrate-later`. | `docs/plans/reports/core-artifact-boundary/core-owned-classification-2026-05-24.md` |
| Creation gate | New commands are rejected when an existing skill or router owns the route. | `agent/skills/ah-make-command/SKILL.md` |
| Lifecycle router | `ah-manage-artifact` can route command creation, but no command lifecycle owner exists. | `agent/skills/ah-manage-artifact/SKILL.md` |

## Retirement Model

Apply the first matching disposition.

| Priority | Condition | Disposition | Action |
|----------|-----------|-------------|--------|
| 1 | Command only imports or delegates to one skill. | `skill-owned-wrapper` | Keep temporarily as compatibility shim; route durable behavior to the skill. |
| 2 | Command duplicates a router skill or lifecycle skill. | `router-owned-alias` | Replace body with thin alias or delete after references move. |
| 3 | Command owns reusable workflow with no matching skill. | `rewrite-needed` | Create or update a skill first; keep command until the skill validates. |
| 4 | Command is repo, company, personal, or domain-specific. | `pack-owned-candidate` | Keep until artifact-pack manifest and compatibility shim exist. |
| 5 | Command only opens a local tool or runs a one-shot utility. | `shim-or-delete` | Keep only if user-facing invocation is still useful. |
| 6 | Command has no active references and no unique workflow. | `deletion-candidate` | Delete after reference scan and adapter check pass. |

Allowed final states:

| Final state | Meaning |
|-------------|---------|
| `skill-owned-wrapper` | Command remains as a thin compatibility wrapper around a skill. |
| `alias-shim` | Command gives a deprecation note and points to the new skill or route. |
| `pack-owned` | Command moves behind pack metadata or becomes a pack-local adapter. |
| `rewritten-as-skill` | Durable workflow now lives in `agent/skills/<skill>/SKILL.md`. |
| `deleted` | Command file removed after compatibility gates pass. |

## Adapter Rules

| Harness | Rule |
|---------|------|
| Claude slash command | Keep compatibility wrappers until slash users have a named replacement or the command has no active references. |
| Codex skill routing | Prefer skill routes and app/plugin tools; do not create command-only behavior for Codex. |
| Shared inventory | Treat commands as legacy artifacts until a row has final state evidence. |
| Artifact packs | Export pack-local commands only when the pack manifest names the adapter behavior. |

## Deletion Gate

Before deleting any command:

1. Search active references:

```bash
rg -n "<command-name>|agent/commands/<command-name>.md|/<command-name>" AGENT-HUB.md README.md LOOKUP.md SYSTEM.md agent docs scripts
```

2. Classify each hit:

| Hit class | Required action |
|-----------|-----------------|
| generated inventory or report | Regenerate or leave historical report unchanged. |
| command invocation | Replace with skill, alias, or pack route first. |
| lifecycle policy | Update the policy owner. |
| skill dependency | Update the dependent skill or block deletion. |
| historical doc | Leave unchanged unless it creates active routing ambiguity. |

3. Verify the replacement route:

```bash
node scripts/validate-llm-first.mjs --check artifact-inventory
node scripts/validate-llm-first.mjs
git diff --check
```

4. Delete only commands whose active references have replacements.

## Initial Batch Classification

This table is a starting queue, not deletion approval.

| Batch | Commands | Initial disposition | Owner |
|-------|----------|---------------------|-------|
| A | `cci-art-create-branch`, `cci-art-prepare-merge`, `cci-art-remove-branch`, `cci-art-send-merge-notice`, `cci-art-send-merge-result` | `skill-owned-wrapper` | `cci-manage-art-branch`, `cci-art-send-notice` |
| B | `ah-review-skills`, `ah-update-docs`, `ah-generate-sitemap`, `ah-check-updates`, `ah-sync-vendors` | `rewrite-needed` or `router-owned-alias` | `ah-manage-artifact`, `ah-manage-skill`, vendor sync owner |
| C | `ah-consult-codebase`, `ah-explore-codebase`, `ah-research-light`, `ah-research-rules`, `ah-research-web`, `ah-work-ultra` | `rewrite-needed` | planning, research, and implementation routers |
| D | `cci-*` local tool, Linear, Slack, MR, review, and summary commands | `pack-owned-candidate` | future CINEV/private pack |
| E | `dev-*`, `git-make-message`, `learn-add-log`, `writing-apply-voice` | `rewrite-needed` or `skill-owned-wrapper` | existing `dev-*`, `git-*`, `learn-*`, and `writing-*` skills |
| F | `shotloom-linear-create-issue` | `pack-owned-candidate` | Shotloom pack or Linear issue-authoring skill |
| G | `tutoring-mark-paid`, `tutoring-open-invoice` | `pack-owned-candidate` | tutoring/private pack |
| H | `ue-make-skill`, `ue-restore-deleted`, `ue-write-cpp` | `pack-owned-candidate` | Unreal pack or UE skill family |

## Execution Plan

| Batch | Action | Output |
|-------|--------|--------|
| S0 | Record the 45-command baseline and current owner candidates. | This spec and generated inventory update. |
| S1 | Add final-state fields or reviewed command disposition rows to artifact inventory. | Command rows can leave generic `migrate-later`. |
| S2 | Review Batch A wrappers and convert any pure delegating command to an alias shim. | Thin wrappers name their owning skill. |
| S3 | Review Batch B and C `ah-*` commands. | Core command wrappers become skill routes, aliases, or deletion candidates. |
| S4 | Classify domain batches D through H by future pack owner. | Pack migration specs get command inputs. |
| S5 | Delete only commands whose deletion gate passes. | Validation and reference scan prove no active breakage. |

## Validation

| Check | Command |
|-------|---------|
| Command count | `find agent/commands -maxdepth 1 -type f -name '*.md' \| wc -l` |
| Same-name skills | compare `agent/commands/*.md` stems to `agent/skills/*/SKILL.md` directories |
| References | `rg -n "<command-name>|agent/commands/<command-name>.md|/<command-name>" AGENT-HUB.md README.md LOOKUP.md SYSTEM.md agent docs scripts` |
| Artifact inventory | `node scripts/validate-llm-first.mjs --check artifact-inventory` |
| Full validator | `node scripts/validate-llm-first.mjs` |
| Patch whitespace | `git diff --check` |

## Acceptance Criteria

- [x] The milestone links this active spec.
- [x] The spec defines allowed command retirement final states.
- [x] The spec defines deletion gates.
- [x] The spec records the 45-command baseline.
- [x] The spec records an initial batch classification queue.
- [ ] Inventory rows can represent reviewed command dispositions.
- [ ] Batch A wrappers are reviewed and converted to aliases or retained with
  owner evidence.
- [ ] Core `ah-*` commands are reviewed before domain command batches.
- [ ] Domain command batches have pack-owner decisions.
- [ ] At least one deletion candidate is removed after the deletion gate passes.

## Open Decisions

| Decision | Default |
|----------|---------|
| Inventory field shape | Add reviewed command disposition fields only after S1 defines schema impact. |
| Claude slash compatibility window | Keep alias shims until reference scans show no active slash-command dependency. |
| CINEV command destination | Treat as private pack candidates until public-safety and company-context gates decide otherwise. |
| Command creation future | Keep `ah-make-command` as a compatibility authoring skill until command creation is either forbidden or pack-local. |
