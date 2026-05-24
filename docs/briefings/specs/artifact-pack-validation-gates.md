---
status: intake
created: 2026-05-25
updated: 2026-05-25
owner: agent-hub
spec: docs/plans/proposed/artifact-pack-validation-gates.md
---

# Spec Intake: artifact-pack-validation-gates

## User Request

Start with brainstorming, spec, and design plan for
`20260525-004634-artifact-pack-validation-gates`.

## Goal

Define validator gates for artifact pack manifests before schema,
resolver, installer, migration, or release work depends on pack validation.

## Route

| Field | Value |
|-------|-------|
| selected route | `ah-route-plan` to `ah-manage-spec create` |
| planning mode | `personal-spec` |
| target spec | `docs/plans/proposed/artifact-pack-validation-gates.md` |
| milestone | `docs/milestones/agent-artifact-pack-system.md` |
| delegated or referenced skills | `ah-manage-spec` |

## Evidence To Read

| Type | Path Or Source | Reason |
|------|----------------|--------|
| file | `SYSTEM.md` | Canonical shared policy and artifact-pack terms. |
| file | `docs/reference/system-glossary.md` | Reserved terminology for manifests, validators, and artifact packs. |
| rule | `agent/rules/index.md` | Auto and triggered rule routing. |
| rule | `agent/rules/behavior.md` | Plan/write gates and LLM-first constraints. |
| standard | `agent/standards/policy/llm-first-docs.md` | Document format and unimplemented-feature wording. |
| skill | `agent/skills/ah-route-plan/SKILL.md` | Planning route selection. |
| skill | `agent/skills/ah-manage-spec/SKILL.md` | Spec creation workflow and validation commands. |
| template | `agent/document-templates/agent-hub/spec.md` | Spec body structure. |
| template | `agent/document-templates/agent-hub/design-plan.md` | Implementation-order stage structure. |
| spec | `docs/plans/completed/artifact-pack-vocabulary.md` | Artifact-pack vocabulary dependency. |
| spec | `docs/plans/proposed/artifact-pack-manifest-contract.md` | Manifest fields and named validator gates. |
| spec | `docs/plans/completed/managed-path-registry-validation.md` | Existing validator pattern for registry-backed checks. |
| spec | `docs/plans/completed/artifact-inventory-provenance-validation.md` | Existing validator pattern for generated metadata checks. |
| script | `scripts/validate-llm-first.mjs` | Current validator entry points and check naming. |
| config | `agent/config/context-routing.json` | Route metadata registry for routing validation. |
| config | `agent/config/artifact-inventory.json` | Existing artifact inventory vocabulary and privacy fields. |

## Known Decisions

| Decision | Source |
|----------|--------|
| Manifest filename is `artifact-pack.json`. | `docs/plans/proposed/artifact-pack-manifest-contract.md` |
| Manifest schema path is `agent/config/artifact-pack.schema.json`. | `docs/plans/proposed/artifact-pack-manifest-contract.md` |
| Validator gates are named `manifest-shape`, `manifest-paths`, `manifest-exports`, `manifest-dependencies`, `manifest-routing`, `manifest-visibility`, and `manifest-compatibility`. | `docs/plans/proposed/artifact-pack-manifest-contract.md` |
| `core:<capability-id>` values need an owning registry. | `docs/plans/proposed/artifact-pack-manifest-contract.md` |
| Validation infrastructure stays in core. | `docs/milestones/agent-artifact-pack-system.md` |

## Open Questions

| Question | Default For Spec |
|----------|------------------|
| Where do valid `core:<capability-id>` values live? | `agent/config/artifact-pack-core-capabilities.json` |
| Does the first validator check installed pack roots? | No; validate explicit manifest file paths and fixture roots only. |
| Does public-safety scanning belong here? | Only manifest-level `visibility` and `privacy-risk`; deep content scrub belongs to `public-safety-scrub-gates`. |
| Does route conflict resolution belong here? | Detect conflicts here; resolver ranking belongs to `artifact-pack-discovery-routing`. |
| Does validation compare multiple manifests? | Yes for explicit manifest-set fixtures; installed pack discovery stays out of scope. |
| Is `route.priority` already in the manifest contract? | No; patch the manifest contract before schema implementation. |

## Exclusions

| Exclusion | Owner |
|-----------|-------|
| Resolver selection algorithm | `artifact-pack-discovery-routing` |
| Pack root install registry | `artifact-pack-install-link-flow` |
| Deep public/private content scrub | `public-safety-scrub-gates` |
| Compatibility shim deletion lifecycle | `artifact-compatibility-shims` |
| Example pack implementation | `example-artifact-pack` |

## Validation Expected

| Check | Command |
|-------|---------|
| Patch whitespace | `git diff --check` |
| Spec lifecycle | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |
| Full validator | `node scripts/validate-llm-first.mjs` |
| Scope guard | `git status --short --branch` |
