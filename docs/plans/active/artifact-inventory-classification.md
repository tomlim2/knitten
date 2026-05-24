---
status: active
created: 2026-05-20
updated: 2026-05-24
owner: agent-hub
milestone: agent-artifact-pack-system
intake: docs/briefings/specs/artifact-inventory-classification.md
---

# Artifact Inventory Classification

## Purpose

Define the machine-readable inventory contract for current agent artifacts and
skill extraction candidates.

## Problem

The artifact-pack milestone requires a complete inventory before any artifact
move. Current generated inventories count capabilities, but they do not record
owner domain, privacy risk, pack destination, compatibility need, body shape, or
skill extraction items.

Without a machine-readable contract, later core-vs-pack decisions can use
different row shapes and produce incompatible migration batches.

## Goals

| Goal | Acceptance |
|------|------------|
| Define canonical storage. | Canonical inventory data path is `agent/config/artifact-inventory.json`. |
| Define schema. | Schema path is `agent/config/artifact-inventory.schema.json`. |
| Preserve row links. | `skill` rows and `extraction-item` rows use stable parent links. |
| Match thin-skill boundary. | Skill size, kind, split-readiness, extraction fields, and content kinds match `thin-skill-guide-boundary`. |
| Block premature migration. | Physical moves stay out of scope until generated inventory rows are reviewed. |

## Batch A Non-Goals

| Non-Goal For This Batch | Owner |
|-------------------------|-------|
| Do not generate complete inventory rows in this schema slice. | Generator implementation batch |
| Do not classify every artifact as core or pack. | `core-artifact-boundary` |
| Do not move skills, commands, rules, standards, docs, scripts, or config files. | `artifact-repo-migration-plan` |
| Do not enforce fail-only validator checks in the schema-contract PR. | Batch D after pilot rows |
| Do not define artifact pack manifest exports. | `artifact-pack-manifest-contract` |

## Current State

| Surface | Current Fact | Evidence |
|---------|--------------|----------|
| Milestone inventory | Requires machine-readable inventory before moves. | `docs/milestones/agent-artifact-pack-system.md` |
| Thin skill schema | Defines skill row and extraction item row fields. | `docs/plans/active/thin-skill-guide-boundary.md` |
| Artifact vocabulary | Defines artifact types and pack terms. | `docs/plans/completed/artifact-pack-vocabulary.md` |
| Existing capability views | README and AGENT-HUB generated blocks count capabilities only. | `scripts/validate-llm-first.mjs` |
| Config schema pattern | JSON schemas live under `agent/config/*.schema.json`. | `agent/config/repo-policy.schema.json` |
| Pilot classification review | Accepted 6 pilot rows and blocked 10 target-dependent rows. | `docs/plans/reports/artifact-inventory-classification/pilot-classification-review-2026-05-24.md` |

## Proposed Design

### Files

| Path | Role |
|------|------|
| `agent/config/artifact-inventory.schema.json` | JSON Schema for inventory documents. |
| `agent/config/artifact-inventory.json` | Reserved canonical inventory data path for generator output. |
| `docs/plans/active/artifact-inventory-classification.md` | Contract and implementation plan. |
| `docs/briefings/specs/artifact-inventory-classification.md` | Intake evidence. |

### Inventory Document

| Field | Rule |
|-------|------|
| `schema-version` | `1`. |
| `generated-at` | ISO date-time string when a generator emits rows. |
| `source-commit` | Git commit used for generated rows. |
| `rows` | Array of `artifact`, `skill`, or `extraction-item` rows. |

### Common Row Fields

| Field | Values |
|-------|--------|
| `row-id` | `artifact:<source-artifact-path>`, `skill:<source-artifact-path>`, or `extraction:<source-artifact-path>#<extraction-id>`. |
| `row-type` | `artifact`, `skill`, or `extraction-item`. |
| `source-artifact-path` | Repo-relative path. Absolute user paths are invalid. |
| `artifact-type` | Source artifact type. `artifact` rows exclude `skill`; `skill` and `extraction-item` rows use `skill`. |
| `owner-domain` | `core`, `repo`, `company`, `personal`, `domain`, `experiment`, or `unknown`. |
| `privacy-risk` | `public-safe`, `needs-scrub`, `private-only`, or `unknown`. |
| `dependencies` | Array of repo-relative artifact paths or ids. Empty array means none. |
| `proposed-destination` | `knitten-core`, `knitten-private-pack`, `domain-pack`, `deprecated`, `migrate-later`, or `undecided`. |
| `compatibility-need` | `alias`, `shim`, `redirect`, `old-path-mapping`, `none`, or `unknown`. |
| `classification-stage` | `undecided`, `core-candidate`, `pack-candidate`, `deprecated`, or `migrate-later`. |
| `review-state` | `pending`, `accepted`, `blocked`, or `moved`. |

### Skill Row Fields

| Field | Values |
|-------|--------|
| `skill-size` | `tiny`, `small`, `medium`, `large`, or `huge`. |
| `skill-kind` | `workflow-only`, `workflow-with-notes`, `guide-heavy`, `reference-heavy`, `mixed-heavy`, or `unknown`. |
| `core-skill-role` | `bootstrap`, `router`, `lifecycle`, `domain`, `repo-specific`, or `none`. |
| `extraction-count` | Integer count of linked extraction item rows. |
| `split-readiness` | `none`, `low`, `ready`, or `blocked`. |

### Extraction Item Row Fields

| Field | Values |
|-------|--------|
| `parent-row-id` | Existing `skill:<source-artifact-path>` row id. |
| `extraction-id` | Stable slug unique within the parent skill. |
| `source-section` | Exact heading or line anchor in the source skill. |
| `content-kind` | `judgment`, `example`, `output-body`, `naming-policy`, `lifecycle-policy`, `domain-reference`, or `machine-checkable-contract`. |
| `extracted-artifact-type` | One accepted artifact type. |
| `artifact-subkind` | `guide`, `reference`, `document-template`, `validator-check`, `rubric`, `example`, or `none`. |
| `target-path` | Planned repo-relative path or `undecided`. |
| `required-at-runtime` | `yes`, `no`, or `unknown`. |
| `validation-needed` | `yes`, `no`, or `unknown`. |

### Row Link Rules

| Rule | Requirement |
|------|-------------|
| Unique row ids | No two rows share `row-id`. |
| Skill extraction count | A skill row `extraction-count` equals its linked extraction rows. |
| Parent existence | Every extraction item row has a matching skill row. |
| Base field independence | Extraction rows set privacy, owner, destination, and dependencies explicitly. |
| Path safety | Paths are repo-relative; absolute user or machine paths are invalid. |

## Execution Plan

| Batch | Action | Output |
|-------|--------|--------|
| A | Add schema contract. | `agent/config/artifact-inventory.schema.json` parses and matches this spec. |
| B | Add generator script. | `agent/config/artifact-inventory.json` is generated from repo files. |
| C | Add pilot classification rows. | At least five representative skills have skill rows and extraction item rows. |
| D | Add fail-only validator checks. | Validator catches invalid enum values, duplicate ids, missing parents, and extraction-count mismatches. |
| E | Review generated inventory. | Rows are accepted or blocked before migration specs use them. |

## Validation

| Check | Command Or Inspection |
|-------|-----------------------|
| Schema parses | `node -e "JSON.parse(require('fs').readFileSync('agent/config/artifact-inventory.schema.json','utf8'))"` |
| Source section drift | `node scripts/validate-llm-first.mjs --check artifact-inventory` |
| Spec lifecycle | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |
| Full validator | `node scripts/validate-llm-first.mjs` |
| Patch whitespace | `git diff --check` |
| Scope guard | `git diff --name-only` contains schema, spec, intake, milestone, and boundary docs only. |

## Risks

| Risk | Control |
|------|---------|
| Schema implies inventory rows already exist. | Do not create `agent/config/artifact-inventory.json` until the generator batch emits it. |
| Row fields diverge from thin-skill boundary. | Keep this spec and `thin-skill-guide-boundary` in the same milestone and update both when fields change. |
| Dependencies become prose. | Encode dependencies as arrays; render empty arrays as `none` in Markdown views. |
| Migration starts from unreviewed rows. | Keep `review-state: pending` until inventory review accepts each row. |

## Acceptance Criteria

- [x] `agent/config/artifact-inventory.schema.json` exists and parses as JSON.
- [x] The schema includes common, skill, and extraction item row contracts.
- [x] Common row fields include `classification-stage`.
- [x] `dependencies` has a machine-readable array encoding.
- [x] The milestone links this active spec.
- [x] `thin-skill-guide-boundary` points to this spec as the inventory schema owner.
- [x] Generator creates `agent/config/artifact-inventory.json`.
- [x] Pilot classification covers at least five representative skills.
- [x] Validator checks enforce row ids, parent links, enum values, and extraction counts.
- [x] Pilot review records accepted and blocked rows without using chat history.
- [x] Validator checks extraction `source-section` values against source skill files.

## Open Decisions

| Decision | Default |
|----------|---------|
| Generator script path | Use `scripts/generate-artifact-inventory.mjs`. |
| Markdown view path | Decide after JSON generator output exists. |
| First pilot skills | Use the five-family set from `thin-skill-guide-boundary`. |
| Validator check name | Use `artifact-inventory` after generator output exists. |
