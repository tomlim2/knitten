---
status: active
created: 2026-05-26
updated: 2026-05-26
owner: agent-hub
milestone: agent-artifact-pack-system
---

# Command Retirement Plan

## Purpose

Define how legacy `agent/commands/*.md` files are absorbed into skills,
standards, templates, references, or deletion reports until the command layer is
removed.

Commands are migration sources. Skills, routers, templates, standards, and
artifact-pack manifests own durable workflow and policy.

## Problem

Knitten started this plan with 45 command files and now has 0. Many commands duplicated skill routes,
delegate to skills, or encode domain-specific workflows that should eventually
live behind artifact-pack routing.

This blocks the artifact-pack milestone because command rows remain
`migrate-later`, command adapter behavior is undecided, and the command layer
still appears to be an active artifact class.

## Goals

1. Classify every current command as absorbed into an owner artifact or
   deletion-candidate.
2. Define deletion gates for old command paths.
3. Forbid new command creation in shared agent-hub source.
4. Define adapter behavior while Claude slash-command compatibility is retired.
5. Unblock inventory rows currently marked `migrate-later` because of command
   ambiguity.
6. Remove `agent/commands/` after all command content is absorbed or deleted.

## Non-Goals

1. Do not preserve commands as a durable guide layer.
2. Do not move commands into artifact packs as commands.
3. Do not rewrite large domain workflows in one batch.
4. Do not remove Claude slash-command compatibility before reference scans pass.
5. Do not create new command wrappers.

## Current State

| Surface | Current state | Evidence |
|---------|---------------|----------|
| Command corpus | Started with 45 command files; 0 remain after deletion batches 0 and 1. | `agent/commands/`, `docs/plans/reports/command-retirement-plan/deletion-batch-0-2026-05-26.md`, `docs/plans/reports/command-retirement-plan/deletion-batch-1-2026-05-26.md` |
| Exact skill duplicates | No command has an exact same-name skill. | 2026-05-26 local inspection |
| Command rows | Command rows are held at `migrate-later`. | `docs/plans/reports/core-artifact-boundary/core-owned-classification-2026-05-24.md` |
| Creation gate | New shared commands are forbidden; requests route to skills, standards, templates, or references. | `agent/skills/ah-make-command/SKILL.md` |
| Lifecycle router | `ah-manage-artifact` can route command creation, but no command lifecycle owner exists. | `agent/skills/ah-manage-artifact/SKILL.md` |

## Retirement Model

Apply the first matching disposition.

| Priority | Condition | Disposition | Action |
|----------|-----------|-------------|--------|
| 1 | Command only imports or delegates to one skill. | `absorb-into-skill` | Move any missing instruction into the skill or skill-local reference, then delete the command. |
| 2 | Command duplicates a router skill or lifecycle skill. | `absorb-into-skill` | Update router wording if needed, then delete the command. |
| 3 | Command owns reusable workflow with no matching skill. | `absorb-into-skill` | Create or update a skill first, then delete the command. |
| 4 | Command owns policy, criteria, or naming rules. | `absorb-into-standard` | Move durable policy to a standard, then delete the command. |
| 5 | Command owns reusable output body. | `absorb-into-template` | Move the body to a document template, then delete the command. |
| 6 | Command owns examples or historical procedure only. | `absorb-into-reference` | Move only necessary detail to the owning skill reference, then delete the command. |
| 7 | Command has no active references and no unique workflow. | `deletion-candidate` | Delete after reference scan and adapter check pass. |

Allowed final states:

| Final state | Meaning |
|-------------|---------|
| `absorbed-into-skill` | Durable workflow now lives in `agent/skills/<skill>/SKILL.md` or its references. |
| `absorbed-into-standard` | Durable policy now lives in `agent/standards/`. |
| `absorbed-into-template` | Reusable output body now lives in `agent/document-templates/`. |
| `absorbed-into-reference` | Necessary example or historical detail now lives under the owning artifact's references. |
| `deleted` | Command file removed after compatibility gates pass. |

## Adapter Rules

| Harness | Rule |
|---------|------|
| Claude slash command | Retire shared slash commands; temporary compatibility belongs outside `agent/commands/` or in pack-local adapters. |
| Codex skill routing | Prefer skill routes and app/plugin tools; do not create command-only behavior for Codex. |
| Shared inventory | Treat commands as legacy artifacts until a row has final state evidence. |
| Artifact packs | Export skills, references, templates, and standards; pack-local command adapters are optional compatibility, not shared core artifacts. |

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
| A | `cci-art-create-branch`, `cci-art-prepare-merge`, `cci-art-remove-branch`, `cci-art-send-merge-notice`, `cci-art-send-merge-result` | `absorb-into-skill` | `cci-manage-art-branch`, `cci-art-send-notice` |
| B | `ah-review-skills`, `ah-update-docs`, `ah-check-updates`, `ah-sync-vendors` | `absorb-into-skill` | `ah-manage-artifact`, `ah-manage-skill`, vendor sync owner |
| C | `ah-consult-codebase`, `ah-research-light`, `ah-research-rules`, `ah-research-web`, `ah-work-ultra` | `absorb-into-skill` | planning, research, and implementation routers |
| D | `cci-*` local tool, Linear, Slack, MR, review, and summary commands | `absorb-into-skill` or `absorb-into-reference` | future CINEV/private pack artifacts |
| E | `dev-*`, `git-make-message`, `learn-add-log`, `writing-apply-voice` | `absorb-into-skill` | existing `dev-*`, `git-*`, `learn-*`, and `writing-*` skills |
| F | `shotloom-linear-create-issue` | `absorb-into-template` or `absorb-into-skill` | Shotloom pack or Linear issue-authoring skill |
| G | `tutoring-mark-paid`, `tutoring-open-invoice` | `absorb-into-skill` or `absorb-into-template` | tutoring/private pack artifacts |
| H | `ue-make-skill`, `ue-restore-deleted`, `ue-write-cpp` | `absorb-into-skill` | Unreal skill family |

## Deletion Batches

| Batch | Commands deleted | Evidence |
|-------|------------------|----------|
| 0 | `ah-explore-codebase`, `ah-generate-sitemap`, `cci-format-comment`, `cci-open-creator-vroid`, `cci-slack-send-message` | `docs/plans/reports/command-retirement-plan/deletion-batch-0-2026-05-26.md` |
| 1 | remaining 40 shared command files under `agent/commands/` | `docs/plans/reports/command-retirement-plan/deletion-batch-1-2026-05-26.md` |

## Execution Plan

| Batch | Action | Output |
|-------|--------|--------|
| S0 | Record the 45-command baseline and current owner candidates. | This spec and generated inventory update. |
| S1 | Implement [command-disposition-inventory-schema.md](command-disposition-inventory-schema.md). | Command rows can leave generic `migrate-later` only after reviewed disposition fields exist. |
| S2 | Review Batch A wrappers and absorb missing instructions into owning skills or references. | Batch A commands deleted. |
| S3 | Review Batch B and C `ah-*` commands. | Core command content is absorbed into skills, standards, templates, or deleted. |
| S4 | Classify domain batches D through H by absorbing owner. | Pack migration specs get non-command artifacts as inputs. |
| S5 | Remove `agent/commands/` after every command is absorbed or deleted. | Command count reaches 0 and validators pass. |

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
- [x] The spec records the 45-command baseline and current 0-command state.
- [x] The spec records an initial batch classification queue.
- [x] New shared command creation is forbidden.
- [ ] Inventory rows can represent reviewed command dispositions.
- [ ] Batch A wrappers are reviewed, absorbed into owner artifacts, and deleted.
- [ ] Core `ah-*` commands are reviewed before domain command batches.
- [ ] Domain command batches have pack-owner decisions.
- [x] At least one deletion candidate is removed after the deletion gate passes.
- [x] `agent/commands/` is removed or left empty with no shared command files.

## Open Decisions

| Decision | Default |
|----------|---------|
| Inventory field shape | Add reviewed command disposition fields only after S1 defines schema impact. |
| Claude slash compatibility window | Keep alias shims until reference scans show no active slash-command dependency. |
| CINEV command destination | Treat as private pack candidates until public-safety and company-context gates decide otherwise. |
| Command creation future | Forbid shared command creation; keep `ah-make-command` only as a migration router until command retirement completes. |
