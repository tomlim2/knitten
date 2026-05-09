---
status: proposed
load: triggered
trigger: designing caol-ila as an agent hub
created: 2026-05-09
standard: claude/standards/policy/llm-first-docs.md
decision: docs/decisions/0001-platform-neutral-agent-system.md
---

# Agent Hub Plan

**status:** not implemented. This plan defines the next execution slices for turning `caol-ila` from a Claude-shaped deploy repo into an agent hub with canonical policy, platform adapters, capability inventory, and validator-backed drift control.

## Definition

An agent hub is a repo that answers these questions without chat history:

| Question | Hub answer |
|----------|------------|
| Which policy is canonical? | `SYSTEM.md` |
| Which entry document does this harness read first? | root entry document registry |
| Which capabilities exist? | generated command, skill, rule, and standard inventory |
| Which values are managed? | `claude/config/*.json` registries |
| Which artifacts are shared or platform-specific? | `platforms:` and `portability:` metadata |
| Which checks prevent drift? | `scripts/validate-llm-first.mjs` |

## Current Baseline

| Area | State |
|------|-------|
| Canonical policy | `SYSTEM.md` accepted by decision `0001` |
| Entry documents | `CLAUDE.md`, `AGENTS.md` |
| Shared runtime layers | `claude/rules`, `claude/standards`, `claude/skills`, `claude/commands` |
| Registries | `doc-budgets`, `frontmatter-schema`, `taxonomy`, `audit-policy`, `exceptions` |
| Generated inventory | README inventory and validator check list |
| Missing hub layer | no manifest that connects harnesses, entry docs, deploy targets, capability inventories, and validators |

## Non-Goals

| Non-goal | Reason |
|----------|--------|
| Rename `claude/` now | current harness reads that deploy shape |
| Duplicate rules per platform | duplicates create drift |
| Convert docs to full HTML | Markdown remains canonical; tags are boundary markers only |
| Treat decisions as executable policy | decision records explain rationale; policy executes from `SYSTEM.md` and shared layers |
| Store secrets or machine-local values in the hub manifest | runtime/private values stay in `~/.claude/private/` or gitignored config |

## Contracts

| Contract | Owner |
|----------|-------|
| Hub vocabulary | `SYSTEM.md` after acceptance |
| Harness entrypoint registry | `claude/config/agent-hub.json` after P1 |
| Harness entrypoint projection | `SYSTEM.md` table, generated or validator-checked after P1.5 |
| Platform metadata | `claude/config/frontmatter-schema.json` |
| Capability taxonomy | `claude/config/taxonomy.json` |
| Hub manifest | new `claude/config/agent-hub.json` after P1 |
| Generated surfaces | `README.md`, optional `HUB.md` after P2 decision |
| Enforcement | `scripts/validate-llm-first.mjs` |

## Execution Order

| Tier | Status | Work | Acceptance |
|------|--------|------|------------|
| P0 | done | Create this plan and LOOKUP entry | Plan is discoverable from LOOKUP |
| P0.5 | pending | Inventory harness entrypoints, deploy targets, platform metadata, and runtime path classes | Gap table uses the required columns below |
| P0.75 | pending | Define manifest ownership and schema before writing JSON | Schema table defines required keys, allowed values, projection rules, and forbidden value classes |
| P1 | pending | Add `claude/config/agent-hub.json` | Manifest matches P0.75 schema and has no duplicated unvalidated projection |
| P1.5 | pending | Add validator check for hub manifest | Missing entry docs, broken paths, and stale platform metadata fail validation |
| P2 | pending | Decide whether `HUB.md` exists | Decision record accepts or rejects a root hub document |
| P2.5 | pending | Add generated hub inventory if `HUB.md` exists | Generated block prevents command/skill/rule/standard drift |
| P3 | pending | Add authoring flow for new harness adapters | New entry docs update manifest and validator fixtures in the same change |
| P4 | pending | Revisit neutral directory migration | Rename only after runtime readers support the new deploy shape |

## P0.5 Sweep Scope

| Sweep target | Output |
|--------------|--------|
| Root entry docs | entry document table with harness, first-read rule, shared-policy marker |
| `claude/CLAUDE.md` deploy shim | deploy-shim role and sync behavior |
| `SYSTEM.md` durable source table | deploy target ownership gaps |
| `claude/config/frontmatter-schema.json` | platform metadata coverage gaps |
| `README.md` generated inventory | capability groups and missing hub fields |
| `scripts/validate-llm-first.mjs` | check gaps for entry documents and generated surfaces |

Required gap table columns:

| Column | Meaning |
|--------|---------|
| `artifact` | file, folder, registry, generated surface, or runtime path class |
| `current owner` | current canonical owner or deploy-only owner |
| `proposed owner` | future owner after hub manifest lands |
| `deploy target` | runtime location, if any |
| `validator check` | existing or required check name |
| `gap` | missing metadata, duplicate owner, broken projection, or untracked runtime class |
| `decision needed` | yes/no plus the decision file if needed |

## P0.75 Manifest Schema Draft

`agent-hub.json` must be a registry, not a prose inventory. It owns machine-readable routing and projection data; generated docs display that data.

| Key | Required | Content | Validator behavior |
|-----|----------|---------|--------------------|
| `harnesses` | yes | harness id, display name, entry document path, deploy target path, first-read marker | entry docs exist; first-read marker points to `SYSTEM.md`; no duplicate id |
| `sharedLayers` | yes | layer id, path, load mode, inventory source | paths exist; load modes match known values |
| `registries` | yes | config file path and owned domain | paths exist; every listed registry is JSON |
| `generatedSurfaces` | yes | file path, marker id, generator/check owner | marker exists; validator can compare generated body or explicitly mark manual |
| `runtimePathClasses` | yes | path class, owner, git policy, secret policy | runtime-only paths are classified without storing machine-local values |
| `validators` | yes | validator id and covered contracts | listed checks exist in `scripts/validate-llm-first.mjs --list` |

Forbidden in `agent-hub.json`:

| Forbidden value | Reason |
|-----------------|--------|
| Secret values | secrets stay in gitignored `.env` or private config |
| Machine-specific absolute paths | machine paths stay in `~/.claude/private/caol-config/` |
| Cache/session/history paths as managed artifacts | runtime data is not durable policy |
| Freeform prose fields that duplicate `SYSTEM.md` policy | prose policy remains in `SYSTEM.md` |

Projection rule:

| Projection | Rule |
|------------|------|
| `SYSTEM.md` entry document table | generated from or validator-checked against `agent-hub.json` |
| README capability inventory | generated block remains validator-owned |
| Optional `HUB.md` | if accepted, generated or thin wrapper over `agent-hub.json` and README inventory |

## First Implementation Slice

1. Run the P0.5 sweep.
2. Write the gap table under this plan.
3. Finalize P0.75 schema and projection rules.
4. Draft `agent-hub.json` without runtime behavior.
5. Add validator checks only after the manifest shape is stable.

## Naming

| Concept | Name |
|---------|------|
| Plan | `docs/plans/agent-hub.md` |
| Manifest | `claude/config/agent-hub.json` |
| Optional root doc | `HUB.md` |
| Validator check | `agent-hub` |

`HUB.md` stays optional until a decision record accepts it. If it exists, it must be generated or thin; `SYSTEM.md` remains canonical policy.
