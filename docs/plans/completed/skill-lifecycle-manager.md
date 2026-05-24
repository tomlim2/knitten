---
status: completed
created: 2026-05-24
updated: 2026-05-24
owner: agent-hub
milestone: agent-artifact-pack-system
---

# Skill Lifecycle Manager

## Purpose

Define one workflow owner for agent-hub skill create, inspect, review, update,
rename, archive, delete, compatibility, and validation operations.

## Problem

Skill lifecycle behavior exists in separate skills, but no skill-specific
lifecycle manager owns the full decision tree.

| Operation | Current owner | Gap |
|-----------|---------------|-----|
| Create | `agent/skills/ah-make-skill/SKILL.md` | Creation gate exists, but lifecycle route starts elsewhere. |
| Narrow edit | `agent/skills/ah-edit-skill/SKILL.md` | Edit vs update boundary exists only in the edit/update skills. |
| Broad update | `agent/skills/ah-update-skill/SKILL.md` | Policy refresh exists, but rename/archive compatibility is out of scope. |
| Delete | `agent/skills/ah-delete-skill/SKILL.md` | Deletion gate exists, but archive/deprecate is not a first-class alternative. |
| Audit | `agent/skills/ah-audit-skill/SKILL.md` | Read-only audit exists, but the next lifecycle action is manual. |
| Shared artifact routing | `agent/skills/ah-manage-artifact/SKILL.md` | Generic router covers skills plus rules, standards, commands, plans, and entries. |

Result: broad skill inventory edits can pick the wrong entry point, skip
compatibility checks, or duplicate lifecycle rules across multiple skill bodies.

## Goals

1. Add one skill-specific lifecycle router.
2. Keep existing specialized skill workflows as operation engines.
3. Define the decision tree for create, inspect, audit, edit, update, rename,
   archive/deprecate, delete, and compatibility mapping.
4. Make destructive and path-changing operations require reference scans and
   replacement decisions.
5. Connect lifecycle actions to artifact inventory fields and generated
   inventory refreshes.
6. Keep the router thin; put durable policy in references, standards, templates,
   or validators.

## Non-Goals

- Rewrite all existing skill lifecycle skills in one pass.
- Bulk rename or delete skills.
- Move domain skills into artifact packs.
- Decide the final artifact-pack manifest schema.
- Replace `ah-manage-artifact` for non-skill artifacts.
- Add harness-specific command aliases.

## Current State

| Artifact | Current role |
|----------|--------------|
| `agent/skills/ah-manage-artifact/SKILL.md` | Generic shared-artifact lifecycle router. |
| `agent/skills/ah-make-skill/SKILL.md` | Skill creation and creation-gate owner. |
| `agent/skills/ah-edit-skill/SKILL.md` | Narrow skill edit owner. |
| `agent/skills/ah-update-skill/SKILL.md` | Broad skill refresh owner. |
| `agent/skills/ah-delete-skill/SKILL.md` | Skill deletion owner. |
| `agent/skills/ah-audit-skill/SKILL.md` | Read-only skill audit owner. |
| `agent/config/artifact-inventory.json` | Generated inventory that records skill rows and extraction candidates. |
| `scripts/generate-artifact-inventory.mjs` | Generates inventory rows. |
| `scripts/validate-llm-first.mjs` | Validates skill mechanics, routing, inventory, and generated views. |

## Proposed Design

### Router Skill

Create `agent/skills/ah-manage-skill/SKILL.md`.

| User intent | Route |
|-------------|-------|
| create, make, add | `ah-make-skill` |
| inspect, show, find owner | read `LOOKUP.md`, `AGENT-HUB.md`, and target `SKILL.md` only as needed |
| audit, review skill | `ah-audit-skill` |
| small edit, wording, path fix, metadata fix | `ah-edit-skill` |
| refresh, modernize, policy drift, validator drift | `ah-update-skill` |
| rename, move | rename workflow in this spec |
| archive, deprecate | archive workflow in this spec |
| delete, remove | `ah-delete-skill` after archive/delete gate |

### Rename Workflow

Rename is path-changing and user-facing.

| Step | Required action |
|------|-----------------|
| 1 | Resolve old and new skill names. |
| 2 | Validate the new name with `agent/config/taxonomy.json` and naming policy. |
| 3 | Search references for old name and old path. |
| 4 | Classify references as generated, routing, lookup, command invocation, skill dependency, doc, or historical. |
| 5 | Decide compatibility: alias/shim, redirect note, reference rewrite, or blocked. |
| 6 | Move the directory only after replacement references are defined. |
| 7 | Update generated inventory after the move. |
| 8 | Run full validation. |

Rename is blocked when a non-generated active reference has no replacement.

### Archive / Deprecate Workflow

Archive keeps the old skill directory tracked until compatibility is resolved.

| Condition | Action |
|-----------|--------|
| Replacement exists and references can move now | update references, then archive or delete by explicit request |
| Replacement exists but references cannot move now | keep a compatibility shim or deprecation notice |
| No replacement exists | mark as deprecated only when users no longer need the route |
| User asks delete without replacement | run `ah-delete-skill`; stop if blockers remain |

The archive state must be visible from one of:

- target `SKILL.md` frontmatter;
- a compatibility shim;
- inventory classification;
- milestone or spec follow-up.

### Inventory Contract

Lifecycle actions update inventory inputs or generated inventory when they
change any of these fields:

| Field | Trigger |
|-------|---------|
| `artifact-path` | rename, move, delete, create |
| `classification-stage` | archive, deprecate, migration decision |
| `proposed-destination` | core/pack boundary decision |
| `compatibility-need` | rename, path migration, alias/shim decision |
| `review-state` | audit outcome or lifecycle blocker |
| `extraction-count` | skill body split or reference extraction |

Generated inventory remains generated. Do not hand-edit
`agent/config/artifact-inventory.json` except through the generator.

### Thin Router Boundary

`ah-manage-skill` is an orchestrator.

| Content | Owner |
|---------|-------|
| operation routing table | `ah-manage-skill/SKILL.md` |
| creation gate | `ah-make-skill/SKILL.md` |
| narrow edit details | `ah-edit-skill/SKILL.md` |
| broad update details | `ah-update-skill/SKILL.md` |
| deletion details | `ah-delete-skill/SKILL.md` |
| audit checklist | `ah-audit-skill` references |
| naming policy | `agent/standards/policy/naming.md` |
| routing metadata values | `agent/config/context-routing.json` |
| artifact-pack classification | `agent/config/artifact-inventory.json` plus inventory spec |

## Execution Plan

| Step | Action | Proof |
|------|--------|-------|
| S1 | Add `ah-manage-skill` as a thin lifecycle router. | Skill exists and routes to existing operation skills. |
| S2 | Add skill lifecycle reference material only if `SKILL.md` exceeds the length budget. | `length-caps` validator passes. |
| S3 | Update `ah-manage-artifact` to route skill lifecycle work to `ah-manage-skill`. | Generic router has one skill-specific row. |
| S4 | Add lifecycle wording to existing skill operation docs only where their boundary is unclear. | No duplicated full decision tree across operation skills. |
| S5 | Refresh generated inventory. | `artifact-inventory` and `inventory-counts` pass. |
| S6 | Run full validation. | `node scripts/validate-llm-first.mjs` passes. |

## Validation

Run:

```bash
node scripts/validate-llm-first.mjs
git diff --check
```

Manual smoke:

| Scenario | Expected route |
|----------|----------------|
| "create skill X" | `ah-manage-skill` routes to `ah-make-skill`. |
| "audit skill X" | `ah-manage-skill` routes to `ah-audit-skill`. |
| "rename skill X to Y" | `ah-manage-skill` runs rename gate before any move. |
| "delete skill X" | `ah-manage-skill` routes to `ah-delete-skill` only after reference scan scope is clear. |

## Risks

| Risk | Mitigation |
|------|------------|
| Router duplicates operation skills | Keep operation details in existing owner skills. |
| Rename workflow becomes too large | Move rename details to a skill-local reference if needed. |
| Archive/deprecate state becomes invisible | Require one visible state marker and inventory alignment. |
| Inventory drift after lifecycle action | Refresh generated inventory in every create, rename, delete, or classification-changing action. |

## Acceptance Criteria

- [x] `agent/skills/ah-manage-skill/SKILL.md` exists.
- [x] `ah-manage-artifact` routes skill lifecycle work to `ah-manage-skill`.
- [x] Create, inspect, audit, edit, update, rename, archive/deprecate, and delete have explicit routes.
- [x] Rename and delete workflows require reference scans before path changes.
- [x] Archive/deprecate has a visible state contract.
- [x] Inventory refresh triggers are documented.
- [x] Full validator passes.

## Open Decisions

| Decision | Default |
|----------|---------|
| Compatibility shim format | Use the smallest shim or reference rewrite that preserves current user invocation. |
| Archive marker location | Prefer target `SKILL.md` frontmatter when the directory remains; otherwise use inventory classification and compatibility shim. |
| Rename automation | Manual workflow first; script only after two successful manual renames expose repeated steps. |
