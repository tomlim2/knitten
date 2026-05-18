---
status: active
created: 2026-05-18
updated: 2026-05-18
owner: agent-hub
target-date:
---

# Agent Artifact Pack System

## Purpose

Split Knitten's agent artifact ecosystem into a small core plus external
artifact packs that can be discovered, validated, linked, and routed without
copying everything into the core repository.

## Scope

| Area | In Scope |
|------|----------|
| Core boundary | Define which rules, validators, routes, and lifecycle tools stay in Knitten core. |
| Artifact vocabulary | Define `agent artifact`, `artifact type`, `artifact pack`, `artifact manifest`, and `artifact resolver`. |
| Core/external split | Define which artifacts remain in Knitten core and which move to an external artifact repository. |
| Inventory and classification | Produce a complete artifact inventory before any move. |
| Pack manifest | Define how an external artifact pack declares skills, rules, standards, commands, dependencies, and repo scope. |
| Migration plan | Move eligible skills, commands, rules, and standards into artifact packs without breaking current routing. |
| Knitten role transition | Define when current `knitten` stops acting as core and becomes a private artifact pack plus integration overlay. |
| Discovery and routing | Resolve pack-provided artifacts from repo, task type, domain, and work mode. |
| Install and link flow | Link local artifact pack folders or repos into the active harness without hardcoded user paths. |
| Compatibility | Keep old paths, aliases, or deprecation mappings until pack routing is proven. |
| Validation and release gates | Check manifest shape, naming, duplicate exports, missing paths, routing conflicts, public-safety, and release readiness. |

## Specs

| Spec | Status | Role |
|------|--------|------|
| [artifact-pack-vocabulary.md](../plans/completed/artifact-pack-vocabulary.md) | completed | Define shared terms for artifacts, packs, manifests, and resolvers. |
| `artifact-inventory-classification` | proposed | Generate and review the full inventory of skills, commands, rules, standards, configs, docs, and scripts. |
| `core-artifact-boundary` | proposed | Define stay-in-core vs move-to-pack criteria for skills, commands, rules, and standards. |
| [knitten-core-public-transition.md](../plans/proposed/knitten-core-public-transition.md) | proposed | Plan the public-facing `knitten-core` repo and external artifact migration. |
| `knitten-private-pack-transition` | proposed | Define the timing and gates for current `knitten` becoming a private artifact pack and integration overlay. |
| `artifact-repo-migration-plan` | proposed | Plan the new artifact repository, migration order, compatibility shims, and rollback path. |
| `artifact-pack-manifest-contract` | proposed | Define the manifest schema, exported artifact model, and compatibility fields. |
| `artifact-pack-discovery-routing` | proposed | Define how core discovers artifact packs and lets routers select them. |
| `artifact-pack-install-link-flow` | proposed | Define safe local install, symlink/link, update, and uninstall behavior. |
| `artifact-compatibility-shims` | proposed | Define old path mappings, aliases, deprecation windows, and removal criteria. |
| `artifact-pack-validation-gates` | proposed | Define validator checks for manifest integrity and route conflicts. |
| `public-safety-scrub-gates` | proposed | Define public-safe checks for secrets, private paths, personal data, and company-only context. |
| `core-release-validation` | proposed | Define CI, PR, release, versioning, changelog, and public-readiness gates for `knitten-core`. |
| `example-artifact-pack` | proposed | Provide a public-safe sample pack that proves manifest, resolver, install, and validation behavior. |

## Progress

| Phase | State | Evidence |
|-------|-------|----------|
| Milestone record | done | `docs/milestones/agent-artifact-pack-system.md` exists. |
| Vocabulary | done | `docs/plans/completed/artifact-pack-vocabulary.md` defines shared artifact-pack terms. |
| Inventory and classification | not started | Must produce the canonical artifact inventory before any move. |
| Core/external boundary | not started | Depends on inventory and classification criteria. |
| Public core transition | proposed | `docs/plans/proposed/knitten-core-public-transition.md` defines the public-readiness migration plan. |
| Private pack transition | proposed | Current `knitten` becomes a private artifact pack only after `knitten-core` works independently. |
| Artifact repo migration | not started | Depends on the boundary and manifest contract. |
| Manifest contract | not started | Depends on accepted vocabulary and boundary terms. |
| Discovery and routing | not started | Depends on the manifest contract. |
| Install and link flow | not started | Depends on the manifest contract and current harness link behavior. |
| Compatibility shims | not started | Depends on inventory, boundary decisions, and old path mapping. |
| Validation gates | not started | Depends on finalized manifest fields and public-safety policy. |
| Example pack | not started | Depends on manifest contract and resolver behavior. |

## Acceptance Criteria

1. Knitten has a documented core/artifact-pack boundary.
2. External artifact packs can declare their exported artifacts through one manifest.
3. Every existing skill, command, rule, and standard is classified as core,
   external pack, deprecated, or migrate-later.
4. A new artifact repository migration plan defines order, compatibility shims,
   validation, rollback, and cleanup.
5. Pack artifacts can be routed without duplicating them into Knitten core.
6. Validators catch missing pack paths, duplicate names, and routing conflicts.
7. Install, update, and uninstall flows are explicit and reversible.
8. Public `knitten-core` release is blocked by public-safety and release gates.
9. A public-safe example artifact pack proves the pack contract end to end.
10. Compatibility shims have documented removal criteria before any old path is
    deleted.

## Inventory Contract

The first migration artifact is an inventory table. No physical artifact move
starts before this inventory is generated and reviewed.

| Field | Meaning |
|-------|---------|
| Artifact path | Current tracked path. |
| Artifact type | `skill`, `command`, `rule`, `standard`, `config`, `script`, `doc`, `fixture`, `generated-view`, or `shim`. |
| Owner domain | Core, repo, company, personal, domain, or experiment owner. |
| Privacy risk | `public-safe`, `needs-scrub`, `private-only`, or `unknown`. |
| Dependencies | Other artifacts, scripts, config files, or harness assumptions. |
| Proposed destination | `knitten-core`, `knitten-private-pack`, domain pack, deprecated, or migrate-later. |
| Compatibility need | Alias, shim, redirect, old path mapping, or none. |
| Review state | pending, accepted, blocked, or moved. |

## Boundary Criteria

| Keep In Core | Move To Artifact Pack |
|--------------|-----------------------|
| Repository charter, entry documents, lifecycle rules, and validators. | Domain-specific skills and commands. |
| Routing layers needed before plugin discovery works. | Repo-specific or company-specific workflows. |
| Artifact vocabulary, manifest schema, resolver, and installer. | Design, media, UE, Shotloom, Obsidian, tutoring, drink, and other optional domains. |
| Safety rules for git, PR, worktrees, permissions, and config. | Large reference catalogs that are only useful when that pack is selected. |
| Minimal bootstrap skills for spec, milestone, and artifact-pack management. | Experimental or high-churn artifacts. |

Artifacts that are required to install, validate, route, or repair artifact
packs stay in core. Artifacts that only become relevant after a domain or repo
is selected move out.

## Compatibility And Deprecation

| Compatibility Surface | Rule |
|-----------------------|------|
| Old paths | Preserve through aliases, shims, or manifest redirects until no active references remain. |
| Router names | Keep stable public names; route to moved pack artifacts through resolver metadata. |
| Skills and commands | Provide clear deprecation messages before removal. |
| Rules and standards | Keep redirects or replacement links when old docs move. |
| Removal | Delete old compatibility paths only after validator and reference scan both pass. |
| Rollback | Every batch records source commit, destination commit, manifest version, and old path mapping. |

## Knitten Role Transition

The current `knitten` repository changes role over time. It starts as the
private monorepo, becomes a private integration workspace during extraction, and
eventually becomes a private artifact pack plus integration overlay.

| Stage | `knitten` Role | `knitten-core` Role | Exit Gate |
|-------|----------------|---------------------|-----------|
| 1. Private monorepo | Owns core, artifacts, private config, and local workflows. | Does not exist or is only a plan. | Public transition plan accepted. |
| 2. Split planning | Owns inventory, classification, and migration decisions. | Candidate skeleton under design. | Every artifact has a proposed destination. |
| 3. Dual-track extraction | Private integration workspace and source for promoted core changes. | Public candidate assembled from scrubbed core contents. | `knitten-core` validates without depending on private `knitten`. |
| 4. Private pack conversion | Private artifact pack monorepo plus local integration overlay. | Public core framework and release surface. | Private workflows run as `knitten-core` plus `knitten` pack manifests. |
| 5. Pack-stabilized operation | Private pack and incubator for unreleased artifacts. | Stable public core that can consume packs through manifests. | Compatibility links are removed and resolver paths are stable. |

`knitten` should not be treated as public core after Stage 4. From that point,
new core work is promoted into `knitten-core`; new private/domain work stays in
`knitten` or moves to a domain artifact pack.

## Private Pack Conversion Gates

| Gate | Requirement |
|------|-------------|
| Independent core | `knitten-core` installs, routes, and validates without reading private `knitten` paths. |
| Bootstrap coverage | Spec, milestone, artifact-pack, routing, validation, git, PR, and worktree workflows exist in core. |
| Pack manifest | `knitten` has a manifest declaring private artifacts and overlay rules. |
| Resolver compatibility | Local harness can load `knitten-core` plus the `knitten` private pack. |
| Workflow parity | Current private workflows can be reproduced through pack manifests or explicit compatibility shims. |
| Public-safe boundary | Public core has passed scrub gates and does not require private repo content. |
| Cleanup readiness | Old copied paths have aliases or migration notes, then are removed only after no active references remain. |

## Direction After Conversion

| Work Type | Destination |
|-----------|-------------|
| Core lifecycle, routing, validation, resolver, installer, and safety improvements | `knitten-core` first, then pull into private `knitten`. |
| Private workflow, personal automation, company-specific operation, local path config | `knitten` private pack. |
| Domain pack with reusable public value | Separate artifact pack repo after scrub. |
| Domain pack with private/company context | Private artifact pack repo or private area in `knitten`. |
| Experimental artifacts | `knitten` incubator until promoted, deprecated, or moved to a pack. |

## Migration Plan Shape

| Phase | Goal |
|-------|------|
| Inventory | Produce a complete list of current skills, commands, rules, and standards with owner, domain, risk, and dependencies. |
| Classification | Mark each artifact as `core`, `external-pack`, `deprecated`, or `migrate-later`. |
| Repository setup | Create the artifact repository and its initial manifest, README, validator config, and worktree policy. |
| Pilot pack | Move one low-risk pack first and keep compatibility links or router aliases. |
| Router update | Teach Knitten core to discover the artifact repo and resolve pack artifacts. |
| Batch migration | Move domain packs in small PRs, validating after every batch. |
| Cleanup | Remove compatibility links only after routing and validation prove no active references remain. |
| Rollback | Keep each migration batch reversible by preserving source commit, manifest version, and old path mapping. |
| Documentation | Record final core inventory, pack inventory, and install/update/uninstall commands. |

## Public Release Gates

| Gate | Required Evidence |
|------|-------------------|
| Public safety | Scrub report for secrets, private paths, personal data, company-only context, and private config. |
| Core validation | `knitten-core` validator passes without private `knitten` paths or private machine config. |
| Pack validation | Artifact manifests resolve and report missing, duplicate, or conflicting exports. |
| CI | PR checks run public-safe validators and markdown/link checks. |
| Versioning | Core version, changelog, and release notes are prepared. |
| License | Public license decision is recorded before external visibility. |
| README | Install, validate, create pack, and link pack workflows are documented. |
| Example pack | Public-safe sample pack proves install, resolver, routing, and validation. |

## Open Decisions

| Decision | Default |
|----------|---------|
| First spec | Start with `artifact-pack-vocabulary`, then `core-artifact-boundary`. |
| Pack storage | Support local folders and git worktrees first; remote registries later. |
| Artifact types | Skills, commands, rules, and standards. |
| Harness support | Preserve Codex/Claude adapters instead of binding the architecture to one harness. |
| Migration style | Small reversible batches; no big-bang move. |
| `knitten` final role | Private artifact pack monorepo plus integration overlay. |
| License | Undecided; required before public release. |
| Core versioning | Use semantic versioning after `knitten-core` is public. |
| Public import history | Prefer no-history initial public import from a reviewed tree. |
| Release notes | Required for every public `knitten-core` release. |

## Blockers

| Blocker | Impact |
|---------|--------|
| Artifact vocabulary is not accepted. | Manifest and resolver specs can drift. |
| Inventory is missing. | File moves would be guesswork. |
| Public-safety scrub gates are not defined. | `knitten-core` cannot be safely exposed. |
| License and versioning decisions are open. | Public release cannot complete. |

## External Mirrors

None. Keep the architecture repo-native until the manifest contract is accepted.
