---
status: completed
created: 2026-05-18
updated: 2026-05-18
owner: agent-hub
milestone: agent-artifact-pack-system
intake: docs/briefings/specs/artifact-pack-vocabulary.md
completed: 2026-05-18
---

# Artifact Pack Vocabulary

## Purpose

Define the artifact-pack vocabulary used by the Agent Artifact Pack System
before boundary, inventory, manifest, resolver, install, validation, migration,
and public-core specs depend on it.

## Problem

The milestone uses `artifact`, `pack`, `manifest`, `resolver`, `core`,
`external`, `private`, and `domain` in several sections. Those terms currently
come from milestone prose, existing agent-hub glossary entries, and local
convention.

If later specs use different meanings, the migration can misclassify artifacts,
create incompatible manifest fields, or move core bootstrap files into packs.

## Goals

| Goal | Acceptance |
|------|------------|
| Define core terms. | The spec defines `agent artifact`, `artifact type`, `artifact pack`, `artifact manifest`, and `artifact resolver`. |
| Separate current state from proposed pack terms. | The spec names existing `agent/` shared layers and proposed pack exports separately. |
| Protect existing glossary terms. | The spec does not redefine `manifest`, `registry`, `shared layer`, `managed artifact`, `agent root`, or `deploy target`. |
| Provide downstream usage rules. | Each later milestone spec has a vocabulary dependency table. |
| Define naming constraints. | Slugs, display names, artifact ids, and pack ids have separate rules. |

## Non-Goals

| Non-Goal | Owner |
|----------|-------|
| Do not implement artifact pack discovery. | `artifact-pack-discovery-routing` |
| Do not define full manifest JSON schema. | `artifact-pack-manifest-contract` |
| Do not generate artifact inventory. | `artifact-inventory-classification` |
| Do not classify every current artifact. | `core-artifact-boundary` and `artifact-inventory-classification` |
| Do not move skills, commands, rules, standards, docs, scripts, or config files. | `artifact-repo-migration-plan` |
| Do not update public release gates. | `core-release-validation` and `public-safety-scrub-gates` |

## Current State

| Surface | Current Fact | Evidence |
|---------|--------------|----------|
| Shared layers | `agent/` owns shared rules, standards, skills, commands, config, and lib files. | `SYSTEM.md` shared layers table. |
| Existing glossary | `manifest` means a machine-readable registry that connects hub parts. | `docs/reference/system-glossary.md`. |
| Artifact glossary | Artifact-pack terms are reserved system terms in this PR. | `docs/reference/system-glossary.md`. |
| Existing manifest | `agent/config/agent-hub.json` is the current agent-hub manifest. | Validator checks in `scripts/validate-llm-first.mjs`. |
| Milestone terms | The milestone requires `agent artifact`, `artifact type`, `artifact pack`, `artifact manifest`, and `artifact resolver`. | `docs/milestones/agent-artifact-pack-system.md`. |
| Public transition | `knitten-core` keeps core lifecycle, routing, validation, resolver, installer, and safety infrastructure. | `docs/plans/proposed/knitten-core-public-transition.md`. |

## Vocabulary

| Term | Definition | Use For | Do Not Use For |
|------|------------|---------|----------------|
| `agent artifact` | A repo-owned file or directory that an agent can load, route to, execute, validate, install, or expose through a pack. | Skills, commands, rules, standards, configs, scripts, docs, fixtures, generated views, and compatibility shims. | Arbitrary source files that no agent workflow loads or manages. |
| `artifact type` | A stable category assigned to one agent artifact for inventory, validation, and routing. | `skill`, `command`, `rule`, `standard`, `config`, `script`, `doc`, `fixture`, `generated-view`, `shim`. | Owner domain, privacy risk, repo key, language, or work mode. |
| `artifact pack` | A manifest-declared collection of agent artifacts loaded by core through a resolver. | Optional domain, repo, company, personal, example, or private artifact collections. | The `agent/` root itself, a harness plugin, an npm package, or a random folder without a manifest. |
| `artifact manifest` | A machine-readable file inside an artifact pack that declares pack identity, exported artifacts, dependencies, compatibility aliases, and routing metadata. | Pack discovery, validation, install, update, route selection, and compatibility mapping. | The existing `agent/config/agent-hub.json` manifest unless a later schema spec explicitly connects them. |
| `artifact resolver` | Core logic that maps route evidence and installed pack manifests to concrete artifact paths. | Selecting a skill, rule, standard, command, or shim from core plus installed packs. | A human search step, a broad recursive file scan, or a harness-specific import mechanism. |
| `core artifact` | An agent artifact required to install, validate, route, repair, or maintain core and packs before any external pack is loaded. | Bootstrap skills, lifecycle rules, validators, pack vocabulary, manifest schema, resolver, installer, and safety rules. | Domain-specific or repo-specific workflows that only matter after selection. |
| `pack artifact` | An agent artifact exported by an artifact pack instead of stored directly in core. | Optional domain workflows, repo-specific workflows, company workflows, personal workflows, examples, and experiments. | Core bootstrap artifacts needed before pack loading works. |
| `compatibility shim` | A small artifact or mapping that preserves an old name, path, or route while the new pack location is adopted. | Aliases, redirects, deprecation notices, and old path mappings. | Permanent duplicate canonical owner. |
| `pack install` | The operation that registers an artifact pack so core can resolve it. | Link, clone, pin, enable, disable, update, and uninstall flows. | Copying pack contents into core as the default behavior. |

## Naming Rules

| Name | Rule | Example |
|------|------|---------|
| Artifact pack id | Lowercase slug, `^[a-z0-9]+(-[a-z0-9]+)*$`. | `shotloom-pack` |
| Artifact id | Pack-local id with type prefix when useful. | `skill:shotloom-start-task` |
| Artifact type | One value from the accepted artifact type table. | `skill` |
| Display name | Human-facing label; never used as resolver key. | `Shotloom Task Starter` |
| Compatibility alias | Old id or path mapped to one canonical artifact id. | `ah-route-review` to `skill:ah-route-review` |

## Artifact Type Table

| Type | Current Source Examples | Pack Export Rules |
|------|-------------------------|-------------------|
| `skill` | `agent/skills/*/SKILL.md` | Export the skill directory root and required support files. |
| `command` | `agent/commands/*.md` | Export the command file and referenced skill or route metadata. |
| `rule` | `agent/rules/*.md` | Export the rule file with load metadata. |
| `standard` | `agent/standards/**/*.md` | Export the standard file and direct references needed to apply it. |
| `config` | `agent/config/*.json` | Export only public-safe or pack-local config. |
| `script` | `scripts/*.mjs`, skill scripts | Export scripts only when the pack manifest declares runtime requirements. |
| `doc` | `docs/**/*.md` | Export docs only when an artifact needs them for execution or review. |
| `fixture` | `tests/**/*.json` | Export fixtures used by pack validators or resolver tests. |
| `generated-view` | Validator-generated Markdown tables or inventories | Export only when the generator source is also declared. |
| `shim` | Alias files, redirects, route compatibility maps | Export with removal criteria and canonical target id. |

## Downstream Spec Dependencies

| Downstream Spec | Depends On |
|-----------------|------------|
| `artifact-inventory-classification` | `agent artifact`, `artifact type`, `core artifact`, `pack artifact`, `compatibility shim`. |
| `core-artifact-boundary` | `core artifact`, `pack artifact`, `artifact type`. |
| `artifact-pack-manifest-contract` | `artifact pack`, `artifact manifest`, artifact id, pack id, compatibility alias. |
| `artifact-pack-discovery-routing` | `artifact resolver`, route evidence, pack install, artifact id. |
| `artifact-pack-install-link-flow` | `pack install`, artifact pack id, artifact manifest. |
| `artifact-compatibility-shims` | `compatibility shim`, canonical target id, removal criteria. |
| `artifact-pack-validation-gates` | Every vocabulary term in this spec. |
| `public-safety-scrub-gates` | `artifact type`, `pack artifact`, `core artifact`, pack visibility. |
| `example-artifact-pack` | `artifact pack`, `artifact manifest`, `artifact resolver`, `pack install`. |

## Execution Plan

| Step | Action | Output |
|------|--------|--------|
| 1 | Review this vocabulary against the milestone and current glossary. | Accepted or patched vocabulary spec. |
| 2 | Update `docs/reference/system-glossary.md` for artifact-pack reserved terms. | Glossary rows exist in this PR. |
| 3 | Use these terms in `artifact-inventory-classification`. | Inventory columns match the vocabulary. |
| 4 | Use these terms in `core-artifact-boundary`. | Boundary decisions refer to `core artifact` and `pack artifact`. |
| 5 | Use these terms in `artifact-pack-manifest-contract`. | Manifest schema fields do not redefine vocabulary. |

## Validation

| Check | Command Or Inspection |
|-------|-----------------------|
| Markdown and lifecycle validation | `node scripts/validate-llm-first.mjs` |
| Patch whitespace | `git diff --check` |
| Term consistency | `rg -n "agent artifact|artifact type|artifact pack|artifact manifest|artifact resolver" docs/milestones docs/plans docs/briefings docs/reference` |
| Scope guard | `git diff --name-only` contains only spec, intake, milestone, and glossary docs for this PR. |

## Risks

| Risk | Control |
|------|---------|
| Vocabulary conflicts with existing system glossary. | Keep glossary rows and this completed spec aligned in the same PR. |
| `artifact manifest` conflicts with the existing `manifest` term. | Define it as a pack-local manifest and keep `agent/config/agent-hub.json` unchanged. |
| Artifact type list grows without review. | Add new types through this spec or the manifest-contract spec before validator support. |
| Pack terms imply resolver implementation already exists. | Define vocabulary and glossary terms only; keep resolver implementation out of this spec. |

## Acceptance Criteria

- [x] The vocabulary terms are patched after objective review.
- [x] `docs/reference/system-glossary.md` contains the artifact-pack reserved terms.
- [x] `artifact-inventory-classification` has a dependency row for the artifact type table.
- [x] `artifact-pack-manifest-contract` has a dependency row for `artifact manifest`.
- [x] Scope excludes file moves, discovery implementation, manifest schema, inventory generation, and public release gates.

## Open Decisions

| Decision | Default |
|----------|---------|
| Glossary update timing | Done in this PR. |
| Manifest filename | Decide in `artifact-pack-manifest-contract`. |
| First example pack id | Decide in `example-artifact-pack`. |
| Pack versioning field | Decide in `artifact-pack-manifest-contract`. |
