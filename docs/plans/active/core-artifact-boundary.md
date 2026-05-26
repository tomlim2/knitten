---
status: active
created: 2026-05-24
updated: 2026-05-24
owner: agent-hub
milestone: agent-artifact-pack-system
---

# Core Artifact Boundary

## Purpose

Define the rule that classifies each agent artifact as core, pack, deprecated,
migrate-later, or undecided before any artifact-pack migration moves files.

## Problem

The artifact inventory exists, but every row still has
`classification-stage: undecided` and `proposed-destination: undecided`.
Migration specs cannot decide what to move until the boundary rule exists.

Without one boundary rule, later specs can treat the same skill, rule,
standard, config, script, doc, fixture, generated view, or shim as both a core
artifact and a pack artifact.

## Goals

| Goal | Acceptance |
|------|------------|
| Define core criteria. | The spec lists deterministic keep-in-core rules. |
| Define pack criteria. | The spec lists deterministic move-to-pack rules. |
| Define staged outcomes. | Each inventory row can map to one classification stage and proposed destination. |
| Preserve bootstrap safety. | Artifacts required before pack loading stay in core. |
| Defer physical moves. | Migration files stay unchanged until migration specs consume reviewed rows. |
| Preserve compatibility. | Any old path or route that can be used by a harness gets shim criteria before deletion. |

## Non-Goals

| Non-Goal | Owner |
|----------|-------|
| Do not move files. | `artifact-repo-migration-plan` |
| Do not define artifact manifest schema. | `artifact-pack-manifest-contract` |
| Do not implement resolver behavior. | `artifact-pack-discovery-routing` |
| Do not publish `knitten-core`. | `core-release-validation` |
| Do not scrub public safety. | `public-safety-scrub-gates` |

## Current State

| Surface | Fact | Evidence |
|---------|------|----------|
| Vocabulary | `core artifact`, `pack artifact`, and `compatibility shim` are defined. | `docs/plans/completed/artifact-pack-vocabulary.md` |
| Inventory | 676 rows exist. | `agent/config/artifact-inventory.json` |
| Classification | 676 rows are `undecided`. | inventory count |
| Proposed destination | 676 rows are `undecided`. | inventory count |
| Thin skill rule | Skill bodies keep execution and move durable guidance to references, standards, templates, or validators. | `docs/plans/active/thin-skill-guide-boundary.md` |
| Public transition | `knitten-core` keeps core lifecycle, routing, validation, resolver, installer, and safety infrastructure. | `docs/plans/proposed/knitten-core-public-transition.md` |

## Boundary Rule

Apply privacy gates before destination assignment:

| If | Then |
|----|------|
| `privacy-risk: private-only` | Do not assign `knitten-core`; use `knitten-private-pack` unless a later scrub report changes the row. |
| `privacy-risk: needs-scrub` | Do not assign `knitten-core` until `public-safety-scrub-gates` accepts the row. |

Apply route-specific gates before core destination assignment:

| If | Then |
|----|------|
| A public-safe row has repo, company, or route-specific path evidence such as `shotloom`, `slack`, `cinev`, or `cci` | Use `pack-candidate` and `knitten-private-pack` unless a later public-example review accepts it. |

Apply the first matching rule. If two same-priority rules match, keep
`classification-stage: undecided` and add a review report before migration.

| Priority | If artifact is required for | Classification stage | Proposed destination |
|----------|-----------------------------|----------------------|----------------------|
| 1 | install, validate, route, repair, or maintain core before any pack loads | `core-candidate` | `knitten-core` |
| 2 | safety for git, PRs, worktrees, secrets, permissions, runtime path policy, or destructive operations | `core-candidate` | `knitten-core` |
| 3 | artifact vocabulary, inventory schema, managed path registry, manifest schema, resolver, installer, or pack validation | `core-candidate` | `knitten-core` |
| 4 | agent-hub lifecycle management for specs, milestones, artifacts, document templates, config, or skills | `core-candidate` | `knitten-core` |
| 5 | one repo, company, domain, personal workflow, or high-churn experiment after route selection | `pack-candidate` | `domain-pack` or `knitten-private-pack` |
| 7 | compatibility alias, redirect, old path mapping, or deprecation notice | `core-candidate` until resolver shims exist | `knitten-core` |
| 8 | generated view whose generator is core | `core-candidate` | `knitten-core` |
| 9 | generated view whose generator belongs to a pack | `pack-candidate` | same pack as generator |

## Destination Matrix

| Evidence | Proposed destination |
|----------|----------------------|
| `owner-domain: core`, bootstrap role, and public-safe risk | `knitten-core` |
| public-safe row with repo, company, or route-specific path evidence | `knitten-private-pack` |
| `owner-domain: repo` | `knitten-private-pack` unless public transition accepts it as example material |
| `owner-domain: company` | `knitten-private-pack` or private company pack |
| `owner-domain: personal` | `knitten-private-pack` |
| `owner-domain: domain` | `domain-pack` |
| `privacy-risk: needs-scrub` | not `knitten-core` until scrub report passes |
| `privacy-risk: private-only` | `knitten-private-pack` |
| `review-state: blocked` | keep current path and `migrate-later` |
| target path or owner is unknown | `undecided` |

## Artifact-Type Rules

| Artifact type | Core when | Pack when |
|---------------|-----------|-----------|
| `skill` | bootstrap, router, lifecycle, installer, validator, resolver, or safety workflow | repo, company, personal, optional domain, or experiment workflow |
| `rule` | auto rule, routing rule, safety rule, git/PR/worktree rule, path policy | domain-only or repo-only behavior after route selection |
| `standard` | policy, schema, lifecycle, routing, authoring, validator, or public release criteria | domain-specific format, rubric, example set, or repo-specific policy |
| `config` | schema, manifest, taxonomy, route profile, managed path registry, or validator input | pack-local config with no bootstrap dependency |
| `script` | validator, generator, installer, worktree tool, resolver, or migration guard | pack-local helper used only after pack selection |
| `doc` | agent-hub lifecycle spec, milestone, ADR, glossary, public core doc, or compatibility doc | domain guide, repo guide, personal note, company workflow, or example catalog |
| `fixture` | validator or resolver regression fixture | pack-local validator fixture |
| `generated-view` | generated from a core registry | generated from a pack registry |
| `shim` | required for compatibility before resolver migration | pack-local alias after resolver migration |

## Review Output

Boundary review produces a report under:

```text
docs/plans/reports/core-artifact-boundary/<slug>-classification-YYYY-MM-DD.md
```

Each reviewed batch records:

| Field | Rule |
|-------|------|
| source query | Exact command or filter used to select rows. |
| rows reviewed | Count and row ids or a generated artifact path. |
| decision table | Row id, current owner, classification stage, destination, compatibility need, blocker. |
| conflicts | Any row matching two same-priority boundary rules. |
| proof commands | Inventory validation and any targeted query. |

## Design Plan

S0 - Baseline re-check

Input:
- `agent/config/artifact-inventory.json`
- `docs/plans/completed/artifact-pack-vocabulary.md`
- `docs/plans/active/artifact-inventory-classification.md`
- `docs/plans/active/thin-skill-guide-boundary.md`
- `docs/milestones/agent-artifact-pack-system.md`

Output:
- Current row counts for row type, owner domain, classification stage,
  proposed destination, and review state.
- Confirmed absence or presence of an existing `core-artifact-boundary` spec.

Non-output:
- No inventory generator edits.
- No physical artifact moves.
- No classification field changes.

Failure:
- Stop if an existing boundary spec already owns the rule.

Proof:
- `rg -n "core-artifact-boundary" docs/milestones docs/plans`
- inventory count command in Validation.

S1 - Boundary spec

Input:
- Vocabulary terms from `artifact-pack-vocabulary`.
- Inventory row fields from `artifact-inventory-classification`.
- Skill reduction rules from `thin-skill-guide-boundary`.

Output:
- Active `docs/plans/active/core-artifact-boundary.md` spec.
- Milestone link to the active spec.
- Deterministic boundary, destination, and artifact-type rules.

Non-output:
- No reviewed batch report.
- No generator update.
- No validator update.

Failure:
- Keep rows `undecided` when a rule conflict exists.

Proof:
- `node scripts/validate-llm-first.mjs --check spec-lifecycle`
- `node scripts/validate-llm-first.mjs`
- `git diff --check`

S2 - First reviewed batch

Input:
- Active boundary spec.
- Core-owned rows from `agent/config/artifact-inventory.json`.

Output:
- Report under `docs/plans/reports/core-artifact-boundary/`.
- Reviewed `core-candidate` decisions for the first batch.

Non-output:
- No generator field emission until the report is accepted.
- No pack movement.

Failure:
- Mark conflicting rows `undecided` in the report.

Proof:
- Source query listed in the report.
- `node scripts/validate-llm-first.mjs --check artifact-inventory`

S3 - Generator classification emission

Input:
- Accepted reviewed batch report.
- Boundary rule.
- Current inventory generator.

Output:
- Generator emits reviewed `classification-stage` and
  `proposed-destination` values for accepted rows only.

Non-output:
- No broad automatic classification for unreviewed rows.

Failure:
- Keep unreviewed rows `undecided`.

Proof:
- `node scripts/generate-artifact-inventory.mjs`
- `node scripts/validate-llm-first.mjs --check artifact-inventory`

S4 - Validator enforcement

Input:
- Generated reviewed classifications.
- Boundary destination matrix.

Output:
- Fail-only validator checks for impossible classification and destination
  pairs.

Non-output:
- No enforcement for rows still `undecided`.

Failure:
- Report exact row ids and leave generator output unchanged.

Proof:
- Mutation test with one impossible stage/destination pair.
- `node scripts/validate-llm-first.mjs`

## Validation

| Check | Command |
|-------|---------|
| Spec lifecycle | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |
| Artifact inventory | `node scripts/validate-llm-first.mjs --check artifact-inventory` |
| Full validator | `node scripts/validate-llm-first.mjs` |
| Patch whitespace | `git diff --check` |
| Current undecided count | `node -e "const i=require('./agent/config/artifact-inventory.json'); console.log(i.rows.filter(r=>r['classification-stage']==='undecided').length)"` |

## Risks

| Risk | Control |
|------|---------|
| Core grows too large. | Core requires pre-pack bootstrap, safety, lifecycle, validation, or resolver evidence. |
| Domain artifacts move too early. | Physical moves stay in migration specs after reviewed classification batches. |
| Company or personal material enters public core. | `privacy-risk: needs-scrub` and `private-only` block `knitten-core` until scrub gates pass. |
| Commands disappear before adapters exist. | Command rows use `migrate-later` or shim criteria until command retirement lands. |
| Generated inventory becomes trusted without review. | Generator updates wait until reviewed batch reports exist. |

## Acceptance Criteria

- [x] The milestone links this active spec.
- [x] Boundary rules classify core artifacts, pack artifacts, deprecated artifacts, shims, and migrate-later rows.
- [x] The spec defers physical moves to migration specs.
- [x] The spec names the report path for reviewed classification batches.
- [x] The spec defines when inventory generator updates are allowed.
- [x] First core-owned reviewed batch report exists.
- [x] Local validation passes.

## Open Decisions

| Decision | Default |
|----------|---------|
| First reviewed batch | Core-owned rows before domain rows. |
| Generator update timing | After at least one reviewed classification report. |
| Public-safe example material | Decide in `example-skill-pack` and public-safety specs. |
