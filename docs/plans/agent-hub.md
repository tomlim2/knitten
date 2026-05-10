---
status: done
load: triggered
trigger: designing caol-ila as an agent hub
created: 2026-05-09
standard: agent/standards/policy/llm-first-docs.md
decision: docs/decisions/0001-platform-neutral-agent-system.md
---

# Agent Hub Plan

**status:** done. This plan turned `caol-ila` from a Claude-shaped deploy repo into an agent hub with canonical policy, platform adapters, capability inventory, and validator-backed drift control.

## Definition

An agent hub is a repo that answers these questions without chat history:

| Question | Hub answer |
|----------|------------|
| Which policy is canonical? | `SYSTEM.md` |
| Which entry document does this harness read first? | root entry document registry |
| Which capabilities exist? | generated command, skill, rule, and standard inventory |
| Which values are managed? | `agent/config/*.json` registries |
| Which artifacts are shared or platform-specific? | `platforms:` and `portability:` metadata |
| Which checks prevent drift? | `scripts/validate-llm-first.mjs` |

## Current Baseline

| Area | State |
|------|-------|
| Canonical policy | `SYSTEM.md` accepted by decision `0001` |
| Entry documents | `CLAUDE.md`, `AGENTS.md` |
| Shared runtime layers | `agent/rules`, `agent/standards`, `agent/skills`, `agent/commands` |
| Registries | `doc-budgets`, `frontmatter-schema`, `taxonomy`, `audit-policy`, `exceptions` |
| Generated inventory | README inventory and validator check list |
| Hub layer | `agent/config/agent-hub.json` connects harnesses, entry documents, deploy targets, capability inventories, and validators |

## Non-Goals

| Non-goal | Reason |
|----------|--------|
| Rename agent root in this plan | Deferred here; later completed by `docs/decisions/0003-agent-root-directory.md` |
| Duplicate rules per platform | duplicates create drift |
| Convert docs to full HTML | Markdown remains canonical; tags are boundary markers only |
| Treat decisions as executable policy | decision records explain rationale; policy executes from `SYSTEM.md` and shared layers |
| Store secrets or machine-local values in the hub manifest | runtime/private values stay in `~/.claude/private/` or gitignored config |

## Contracts

| Contract | Owner |
|----------|-------|
| Hub glossary | `docs/reference/system-glossary.md` |
| Harness entrypoint registry | `agent/config/agent-hub.json` after P1 |
| Entry document validated view | `SYSTEM.md` table, generated or validator-checked after P1.5 |
| Platform metadata | `agent/config/frontmatter-schema.json` |
| Capability taxonomy | `agent/config/taxonomy.json` |
| Hub manifest | new `agent/config/agent-hub.json` after P1 |
| Generated documents | `README.md`, `AGENT-HUB.md` |
| Enforcement | `scripts/validate-llm-first.mjs` |

## Execution Order

| Tier | Status | Work | Acceptance |
|------|--------|------|------------|
| P0 | done | Create this plan and LOOKUP entry | Plan is discoverable from LOOKUP |
| P0.5 | done | Inventory harness entrypoints, deploy targets, platform metadata, and runtime path policies | Migration gap table uses the required columns below |
| P0.75 | done | Define manifest ownership and schema before writing JSON | Schema table defines required keys, allowed values, validated view rules, and forbidden value classes |
| P1 | done | Add `agent/config/agent-hub.json` | Manifest matches P0.75 schema and has no duplicated unvalidated view |
| P1.5 | done | Add validator check for hub manifest | Missing entry documents, broken paths, and stale platform metadata fail validation |
| P2 | done | Decide whether `AGENT-HUB.md` exists | Decision record accepts root hub document |
| P2.5 | done | Add generated hub document inventory if `AGENT-HUB.md` exists | Generated block prevents command/skill/rule/standard drift |
| P3 | done | Add authoring flow for new harness adapters | New entry documents update manifest and validator fixtures in the same change |
| P4 | done | Revisit neutral directory migration | Rename remains blocked until runtime readers support the new deploy shape |

## P0.5 Sweep Scope

| Sweep target | Output |
|--------------|--------|
| Root entry documents | entry document table with harness, first-read rule, shared-policy marker |
| `agent/CLAUDE.md` deploy shim | deploy-shim role and sync behavior |
| `SYSTEM.md` canonical deployment table | deploy target ownership gaps |
| `agent/config/frontmatter-schema.json` | platform metadata coverage gaps |
| `README.md` generated inventory | capability groups and missing hub fields |
| `scripts/validate-llm-first.mjs` | check gaps for entry documents and generated documents |

Required gap table columns:

| Column | Meaning |
|--------|---------|
| `artifact` | file, folder, registry, generated document, or runtime path policy |
| `current canonical owner` | current canonical owner or deploy-only owner |
| `proposed canonical owner` | future owner after hub manifest lands |
| `deploy target` | runtime location, if any |
| `validator check` | existing or required check name |
| `gap` | missing metadata, duplicate owner, broken validated view, or untracked runtime policy |
| `decision needed` | yes/no plus the decision file if needed |

## P0.5 Entry Document Inventory

| Entry document | Harness | First shared-policy read | Deploy target | Current validator |
|----------------|---------|--------------------------|---------------|-------------------|
| `CLAUDE.md` | Claude Code | `@SYSTEM.md` | Root file; imported by `~/.claude/CLAUDE.md` deploy shim | `entry-documents`, `import-targets` |
| `AGENTS.md` | Codex | [`SYSTEM.md`](../../SYSTEM.md) | Root file read when Codex starts in this repo | `entry-documents`, `markdown-links` |
| `agent/CLAUDE.md` | Claude Code deploy shim | `@../CLAUDE.md` | `~/.claude/CLAUDE.md` through symlink | `import-targets` |

## P0.5 Migration Gap Table

| Artifact | Current canonical owner | Proposed canonical owner | Deploy target | Validator check | Gap | Decision needed |
|----------|-------------------------|--------------------------|---------------|-----------------|-----|-----------------|
| Root entry documents | `SYSTEM.md` entry table and validator constants | `agent-hub.json` `harnesses` | `CLAUDE.md`, `AGENTS.md` | `entry-documents` | Harness list is duplicated in prose and validator code; adding a harness requires manual edits in multiple places | no |
| `agent/CLAUDE.md` deploy shim | `agent/CLAUDE.md` | `agent-hub.json` `harnesses[].deployTarget` | `~/.claude/CLAUDE.md` | `import-targets` | Import target is checked, but shim role and sync relationship are not registry-owned | no |
| Shared layers | `SYSTEM.md`, README inventory, `taxonomy.json` | `agent-hub.json` `sharedLayers` | `~/.claude/{rules,standards,skills,commands}` | `inventory-counts`, `generated-blocks`, `taxonomy` | Capability counts are validated, but load mode, inventory source, and deploy target are not one contract | no |
| Existing registries | `agent/config/README.md`, individual JSON files | `agent-hub.json` `registries` | `~/.claude/config/*.json` | `registry-integrity` | Registry shape is validated file-by-file; hub readers are not connected to registry domains | no |
| Platform metadata coverage | `frontmatter-schema.json` pilot file list | `agent-hub.json` plus `frontmatter-schema.json` | shared layers | `platform-metadata` | Coverage is pilot-only; only the listed files require `platforms:` and `portability:` today | no |
| README inventory | `README.md` generated block | `agent-hub.json` `generatedDocuments` | root README | `generated-blocks`, `inventory-counts` | Inventory covers commands, skills, standards, and rules; it does not expose harnesses, deploy targets, registries, or metadata coverage | no |
| Validator check list | `agent/standards/policy/principles.md` generated block | `agent-hub.json` `generatedDocuments` | none | `generated-blocks` | Generated documents are hardcoded in validator code instead of declared in a manifest | no |
| Runtime path policy table | `SYSTEM.md` prose table and `.gitignore` | `agent-hub.json` `runtimePathPolicies` | `~/.claude/*` | none | Runtime path ownership is readable, but not machine-readable or checked against git policy | no |
| `agent/settings.json` | tracked global settings file | `agent-hub.json` `runtimePathPolicies` plus settings policy | `~/.claude/settings.json` | none | Tracked settings can contain machine-specific absolute paths; no validator forbids them | yes: decide portable global settings contract |
| `agent/hooks/` | tracked hook scripts referenced by settings | `agent-hub.json` `runtimePathPolicies` | `~/.claude/hooks/` | none | Hook script existence is not checked against settings hook references | no |
| `agent/private/caol-config/doc-paths.json` | `.gitignore` exception and `SYSTEM.md` table | `agent-hub.json` `registries` | `~/.claude/private/caol-config/doc-paths.json` | none | Shared non-machine config lives under `private/`, so manifest must classify it as a committed registry | no |
| Machine-local caol config | `.gitignore` and `SYSTEM.md` table | `agent-hub.json` `runtimePathPolicies` | `~/.claude/private/caol-config/{hardware,machine-paths,repo-paths}.json` | none | Ignored files exist in the deploy tree; manifest must classify paths without storing values | no |
| `agent/config/slack.json` | tracked non-secret service config | `agent-hub.json` `registries` | `~/.claude/config/slack.json` | none | Service config is tracked, but not listed in a hub manifest yet | no |
| Permission templates | `agent/config/permissions/README.md` | `agent-hub.json` `runtimePathPolicies` or `registries` | project `.claude/settings*.json` files | none | Template target paths and `{USERNAME}` replacement are not validator-checked | no |

## P0.75 Manifest Schema Draft

`agent-hub.json` must be a registry, not a prose inventory. It owns machine-readable routing and validated-view data; generated docs display that data.

Ownership decisions:

| Decision | Rule |
|----------|------|
| Manifest owner | `agent/config/agent-hub.json` owns routing, path, classification, and validation metadata |
| Policy owner | `SYSTEM.md` remains the canonical policy owner; manifest must not duplicate policy prose |
| Shared layer owner | `agent-hub.json` lists shared layer paths and load modes; each layer still owns its content |
| Registry owner | Purpose-specific JSON files own their domains; `agent-hub.json` only points to them |
| Private-path registry owner | `agent/private/caol-config/doc-paths.json` is a committed registry because it contains shared non-machine routing |
| Service config owner | Committed non-secret service configs such as `agent/config/slack.json` are registries; tokens stay in `.env` |
| Runtime owner | Runtime-only paths are classified by `runtimePathPolicies`, not stored as managed artifacts |

| Key | Required | Content | Validator behavior |
|-----|----------|---------|--------------------|
| `harnesses` | yes | `id`, `displayName`, `entryDocument`, `deployTarget`, `firstRead`, `adapter` | entry documents exist; first-read marker points to `SYSTEM.md`; no duplicate id |
| `sharedLayers` | yes | `id`, `path`, `kind`, `loadMode`, `inventorySource`, `deployTarget` | paths exist; kind and load mode match allowed values |
| `registries` | yes | `id`, `path`, `domain`, `format`, `deployTarget`, `secretPolicy` | paths exist; JSON parses; secret policy allows commit |
| `generatedDocuments` | yes | `id`, `path`, `marker`, `source`, `mode`, `validator` | marker exists; validator can compare generated body or explicitly mark manual |
| `runtimePathPolicies` | yes | `id`, `pathPattern`, `owner`, `gitPolicy`, `secretPolicy`, `durability` | path class is classified without storing machine-local values |
| `validators` | yes | `id`, `script`, `listedCheck`, `covers` | listed checks exist in `scripts/validate-llm-first.mjs --list` |

Allowed values:

| Field | Values |
|-------|--------|
| `sharedLayers[].kind` | `rules`, `standards`, `skills`, `commands`, `lib`, `config` |
| `sharedLayers[].loadMode` | `entry`, `auto`, `triggered`, `on-demand`, `invoked`, `library`, `config` |
| `registries[].format` | `json` |
| `registries[].secretPolicy` | `no-secrets`, `template-only`, `private-values` |
| `generatedDocuments[].mode` | `generated-block`, `validated-manual`, `thin-wrapper` |
| `runtimePathPolicies[].owner` | `caol-ila`, `runtime`, `machine-local`, `project-local` |
| `runtimePathPolicies[].gitPolicy` | `tracked`, `ignored`, `template-tracked`, `mixed` |
| `runtimePathPolicies[].secretPolicy` | `no-secrets`, `may-contain-secrets`, `must-not-commit` |
| `runtimePathPolicies[].durability` | `durable`, `runtime`, `cache`, `session`, `backup`, `private` |

Forbidden in `agent-hub.json`:

| Forbidden value | Reason |
|-----------------|--------|
| Secret values | secrets stay in gitignored `.env` or private config |
| Machine-specific absolute paths | machine paths stay in `~/.claude/private/caol-config/` |
| Cache/session/history paths as managed artifacts | runtime data is not durable policy |
| Freeform prose fields that duplicate `SYSTEM.md` policy | prose policy remains in `SYSTEM.md` |

Forbidden field classes:

| Class | Examples |
|-------|----------|
| Local absolute paths | `/Users/<name>/...`, drive-specific project paths |
| Secret-like values | tokens, keys, cookies, credentials |
| Runtime snapshots | history, sessions, telemetry, paste cache, backups |
| Long prose policy | paragraphs that restate `SYSTEM.md`, standards, or rules |
| Generated body copies | full README inventories or validator output bodies |

Validated view rules:

| Validated view | Rule |
|----------------|------|
| `SYSTEM.md` entry document table | generated from or validator-checked against `agent-hub.json` |
| README capability inventory | generated block remains validator-owned |
| `AGENT-HUB.md` | generated or thin wrapper over `agent-hub.json` and README inventory |

## First Implementation Slice

1. Done: Run the P0.5 sweep.
2. Done: Write the gap table under this plan.
3. Done: Finalize P0.75 schema and validated view rules.
4. Done: Draft `agent-hub.json` without runtime behavior.
5. Done: Add validator checks after the manifest shape is stable.

## Naming

| Concept | Name |
|---------|------|
| Plan | `docs/plans/agent-hub.md` |
| Manifest | `agent/config/agent-hub.json` |
| Root hub doc | `AGENT-HUB.md` |
| Validator check | `agent-hub` |

`AGENT-HUB.md` is accepted by decision `0002`. It must stay generated or thin; `SYSTEM.md` remains canonical policy.

## P4 Neutral Directory Revisit

| Question | Answer |
|----------|--------|
| Rename agent root now? | done by `docs/decisions/0003-agent-root-directory.md` |
| Runtime constraint | Claude Code still reads `~/.claude/` as the deploy target |
| Current neutrality mechanism | `agent/` canonical repo source, `SYSTEM.md`, entry documents, `agent-hub.json`, platform metadata, and adapter boundaries |
| Compatibility shim | `~/.claude` points at `caol-ila/agent` |

Decision `0001` remains in force for platform-neutral policy. Decision `0003` supersedes the old directory-rename block.
