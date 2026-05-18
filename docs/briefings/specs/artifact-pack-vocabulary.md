---
status: intake
created: 2026-05-18
updated: 2026-05-18
owner: agent-hub
spec: docs/plans/completed/artifact-pack-vocabulary.md
---

# Spec Intake: artifact-pack-vocabulary

## User Request

Assign one work item from the active milestone and create its spec document.

## Goal

Define the shared vocabulary for agent artifacts and artifact packs before
manifest, boundary, inventory, migration, resolver, and validation specs use the
same terms.

## Route

| Field | Value |
|-------|-------|
| Selected route | `ah-manage-spec` create |
| Milestone route | `ah-manage-milestone` attach/update |
| Milestone | `agent-artifact-pack-system` |
| Selected work item | `artifact-pack-vocabulary` |

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| file | `docs/milestones/agent-artifact-pack-system.md` | Names `artifact-pack-vocabulary` as the first spec and defines required vocabulary. |
| file | `docs/plans/proposed/knitten-core-public-transition.md` | Uses `knitten-core`, artifact pack, manifest, resolver, and migration direction. |
| file | `docs/briefings/specs/knitten-core-public-transition.md` | Records user decisions about public core and private pack transition. |
| file | `docs/reference/system-glossary.md` | Owns existing reserved system terms and the current meaning of `manifest`. |
| skill | `agent/skills/ah-manage-spec/SKILL.md` | Owns spec create workflow and intake persistence rule. |
| skill | `agent/skills/ah-manage-milestone/SKILL.md` | Owns milestone spec attachment and progress updates. |
| standard | `agent/standards/policy/llm-first-docs.md` | Owns LLM-first doc structure and proposed-status language rule. |
| user | current chat | User requested one milestone work item to become a spec. |

## Known Decisions

| Decision | Source |
|----------|--------|
| Start with `artifact-pack-vocabulary`. | `docs/milestones/agent-artifact-pack-system.md` open decisions. |
| Use `agent artifact`, `artifact type`, `artifact pack`, `artifact manifest`, and `artifact resolver` as required terms. | Milestone scope table. |
| Keep vocabulary in a spec before changing validators, manifests, or file locations. | Milestone blockers and migration plan shape. |
| Preserve current `manifest` system glossary meaning until a later glossary or manifest spec changes it. | `docs/reference/system-glossary.md`. |

## Open Questions

| Question | Default For This Spec |
|----------|-----------------------|
| Should the vocabulary update `docs/reference/system-glossary.md` now? | Yes. The implementation adds reserved glossary rows in the same PR. |
| Should manifest schema fields be finalized here? | No. This spec names vocabulary and delegates schema to `artifact-pack-manifest-contract`. |
| Should artifact inventory start here? | No. This spec defines inventory terms; `artifact-inventory-classification` produces inventory. |

## Exclusions

| Exclusion | Reason |
|-----------|--------|
| No file moves | Vocabulary is a prerequisite, not migration. |
| No validator changes | Validator checks depend on accepted terms and manifest contract. |
| No manifest schema | Schema belongs to `artifact-pack-manifest-contract`. |
| No public repo creation | Public transition is owned by `knitten-core-public-transition`. |

## Validation Expected

| Command | Purpose |
|---------|---------|
| `git diff --check` | Detect whitespace and patch defects. |
| `node scripts/validate-llm-first.mjs` | Validate spec lifecycle, milestone links, and LLM-first contracts. |
| `git status --short --branch` | Report touched files. |
