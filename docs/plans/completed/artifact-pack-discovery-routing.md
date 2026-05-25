---
status: completed
created: 2026-05-25
updated: 2026-05-25
owner: agent-hub
milestone: agent-artifact-pack-system
parent: docs/plans/completed/artifact-pack-manifest-contract.md
completed: 2026-05-25
---

# Artifact Pack Discovery Routing

## Purpose

Define how core discovers installed artifact pack manifests and produces
route-safe resolver candidates without loading pack artifact bodies before route
evidence matches.

## Problem

Artifact pack manifests, validator gates, and resolver tests exist. Core has a
resolver contract that turns installed manifests into route candidates for
skills, rules, standards, commands, shims, and compatibility aliases.

The resolver contract blocks unrelated pack bodies, `exclude-when` violations,
non-deterministic duplicate candidates, and compatibility alias drift.

## Goals

| Goal | Acceptance |
|------|------------|
| Define resolver inputs. | Resolver consumes core artifacts, installed pack registry rows, manifest metadata, route evidence, and request context. |
| Define resolver output. | Resolver emits one result envelope plus normalized candidate rows with source, route score, visibility, scope, load state, and artifact pointer. |
| Preserve body-load guard. | `route-selected` artifacts expose metadata before selection and load body only after route evidence passes. |
| Define conflict handling. | Duplicate route signatures use `route.priority`; unresolved ties fail closed. |
| Define compatibility handling. | Alias, shim, redirect, and old-path mappings resolve to one canonical artifact id. |
| Define practical fixtures. | Natural request fixtures prove selected, excluded, ambiguous, and compatibility routes. |

## Non-Goals

| Non-Goal | Owner |
|----------|-------|
| Do not change manifest schema. | `artifact-pack-manifest-contract` |
| Do not change artifact-pack validator gates. | `artifact-pack-validation-gates` |
| Do not install, update, disable, or uninstall packs. | `installed-pack-lifecycle` |
| Do not migrate existing artifacts into packs. | `artifact-repo-migration-plan` |
| Do not build the public-safe example pack. | `example-artifact-pack` |

## Current State

| Surface | Fact | Evidence |
|---------|------|----------|
| Manifest contract | Manifest fields, route metadata, aliases, and gates are defined. | `docs/plans/completed/artifact-pack-manifest-contract.md` |
| Manifest schema | Schema validates root, export, mount, route, and alias shape. | `agent/config/artifact-pack.schema.json` |
| Validator gates | Artifact-pack validator checks pass for current fixtures. | `node scripts/validate-llm-first.mjs --check artifact-pack` |
| Installed lifecycle | Installed pack rows, installer candidate-index rows, registry writes, recovery, and validation-failed journals exist. | `scripts/install-artifact-pack.mjs`, `tests/installed-pack-lifecycle.test.mjs` |
| Context routing | Route axes and profiles are registry-backed. | `agent/config/context-routing.json` |
| Existing router model | Review, plan, and implementation routers use route evidence and fixture validation. | `docs/milestones/agent-work-routing-system.md`, `tests/routing-fixtures.json` |

## Contract Block

| Field | Definition |
|-------|------------|
| Input | User request, current harness id, cwd repo key, work mode, touched paths, named artifact, active core artifacts, active installed pack rows, and validated artifact pack manifests. |
| Output | Result envelope plus ordered resolver candidate rows; each row names source, artifact id, artifact type, visibility, scope, route evidence, load state, artifact path ref, and compatibility need. |
| Contract | Resolver inspects manifest metadata before selection, applies route evidence and exclusions, returns one primary candidate when evidence is sufficient, and does not load `route-selected` artifact bodies before selection. |
| Contract failure test | Fixture request with a tempting but excluded pack returns no excluded candidate and loads no artifact body. |
| Practical validation | Natural-language requests for Shotloom review, Obsidian note work, web review, and explicit skill names select expected candidates. |
| Regression check | Routing fixtures fail when emitted candidate count, primary candidate, resolver body load count, or exclusion behavior changes. |

## Proposed Design

### Resolver Inputs

| Input | Source | Rule |
|-------|--------|------|
| Request text | User prompt | Extract explicit artifact names, route domains, repo names, task types, and exclusions. |
| Harness id | Current harness adapter | Apply installed registry `scope.harness-ids` before route ranking. |
| Repository context | CWD and repo registry | Map current directory to repo key before pack selection. |
| Work mode | Task context routing | Apply installed registry `scope.work-modes` before route ranking. |
| Touched paths | Mentioned or changed files | Map extensions and frontmatter to route languages, frameworks, task types, and domains. |
| Core artifacts | `agent/` shared layer | Core artifacts remain available without pack lookup. |
| Installed pack rows | Installed pack registry | Only active rows expose candidates. Disabled rows are ignored. |
| Pack manifests | `artifact-pack.json` | Use validated metadata only; invalid manifests do not produce candidates. |

### Result Envelope

| Field | Rule |
|-------|------|
| `result-kind` | `primary`, `ambiguous`, `excluded`, or `core-fallback`. |
| `primary-candidate-id` | Present only when `result-kind: primary`. |
| `secondary-candidate-ids` | At most two candidates with explicit evidence and no exclusion. |
| `emitted-candidate-count` | Candidate count after disabled-pack, scope, visibility, and exclusion filters. |
| `resolver-body-load-count` | Count of artifact bodies loaded during resolver execution; always `0`. |
| `excluded-artifact-refs` | Present when an explicit request names an artifact blocked by `exclude-when`, scope, or visibility. |
| `exclusion-reason` | Present when `result-kind: excluded`; names `exclude-when`, `scope`, or `visibility`. |
| `fallback-source` | `core` when `result-kind: core-fallback`. |
| `ambiguity-reason` | Present when `result-kind: ambiguous`; names tied candidate ids and tie field. |

### Candidate Row

| Field | Rule |
|-------|------|
| `candidate-id` | Stable string derived from source, pack id, artifact id, compatibility need, and compatibility alias id. |
| `source` | `core` or `pack`. |
| `pack-id` | Present for pack candidates. |
| `artifact-id` | Canonical exported artifact id. |
| `artifact-type` | Manifest or core artifact type. |
| `visibility` | Manifest visibility for pack candidates; `core` for core candidates. |
| `scope` | Installed registry scope used for pre-route filtering; empty object means no scope limit. |
| `load` | `manual`, `on-demand`, or `route-selected`. |
| `load-state` | `metadata-only` or `selected` only. |
| `route-evidence` | Matched evidence items with axis and value. |
| `route-score` | Count of matched positive evidence after exclusions. |
| `route-signature` | Normalized route conflict signature from `artifact-pack-validation-gates`. |
| `priority` | Optional route priority; lower value wins only among tied signatures. |
| `artifact-path-ref` | Core path or installed pack path; body loading is deferred for `route-selected`. |
| `compatibility-need` | `none`, `alias`, `shim`, `redirect`, or `old-path-mapping`. |
| `compatibility-alias-id` | Alias id when compatibility need is not `none`. |
| `matched-compatibility-input` | Matched old name or old path when compatibility need is not `none`. |

### Selection Rules

| Case | Result |
|------|--------|
| Installed row state is not `active`. | Candidate is not emitted. |
| Installed row scope does not match harness id, repo key, or work mode. | Candidate is not emitted unless the user explicitly named that artifact. |
| Candidate has an excluded route domain from `exclude-when`. | Candidate is removed before ranking. |
| Candidate visibility conflicts with installed-pack scope or request work mode. | Candidate is removed before ranking unless the user explicitly named that artifact. |
| `route-selected` candidate has matched evidence count below `min-evidence`. | Candidate stays metadata-only and is not selected. |
| User names an artifact id, skill, command, or compatibility alias exactly and no exclusion applies. | Exact-name evidence outranks route-score. |
| Two candidates share a route signature and both define distinct `priority`. | Lower integer priority wins. |
| Two candidates share a route signature and at least one candidate lacks `priority`. | Resolver returns `result-kind: ambiguous` and does not load bodies. |
| Two candidates share a route signature and have equal `priority`. | Resolver returns `result-kind: ambiguous` and does not load bodies. |
| Two candidates tie on exact-name evidence, route-score, and priority. | Resolver returns `result-kind: ambiguous` and does not load bodies. |
| No candidate has sufficient evidence. | Resolver returns `result-kind: core-fallback` with `fallback-source: core`. |

Ranking order:

| Order | Tie-break |
|-------|-----------|
| 1 | Exact artifact id, skill name, command name, or compatibility alias match. |
| 2 | Higher `route-score`. |
| 3 | Lower `priority` for candidates with the same `route-signature`. |
| 4 | Ambiguous result. |

Exclusion precedence:

| Rule | Result |
|------|--------|
| `exclude-when` matches a route domain. | Candidate is removed before exact-name and score ranking. |
| User explicitly names an excluded pack or artifact. | Resolver returns `result-kind: excluded`, records `excluded-artifact-refs`, and does not load the body. |
| User explicitly asks to override exclusion. | No override exists in this spec; a later safety spec must define it before implementation changes this behavior. |

Route signature source:

| Source | Rule |
|--------|------|
| `docs/plans/completed/artifact-pack-validation-gates.md` | Use the `Route Conflict Signature` fields exactly: `context-profile`, `domains`, `repo-keys`, `task-types`, `languages`, `frameworks`, `work-modes`, and `exclude-when`. |

### Body-Load Guard

| Load value | Before selection | After selection |
|------------|------------------|-----------------|
| `manual` | Expose only when explicitly named. | Resolver returns metadata only; downstream workflow loads body after explicit selection. |
| `on-demand` | Expose as searchable metadata. | Resolver returns metadata only; downstream workflow loads body when it requests the artifact. |
| `route-selected` | Expose route metadata only. | Resolver returns selected metadata only; downstream workflow loads body for selected primary or approved secondary candidate. |

### Compatibility Resolution

| Compatibility need | Resolver behavior |
|--------------------|-------------------|
| `alias` | Old name maps to target artifact id and records `compatibility-need: alias`. |
| `shim` | Shim candidate points to shim path and target artifact id. |
| `redirect` | Old path resolves to target artifact id through redirect metadata. |
| `old-path-mapping` | Old path maps to target artifact id without requiring a file. |

Compatibility rows never create a second canonical owner. Candidate output names
the target artifact id, compatibility need, compatibility alias id, and matched
compatibility input.

### Implementation Surface

| Surface | Rule |
|---------|------|
| Resolver module | Add `scripts/resolve-artifact-route.mjs`; export pure resolver functions and keep installer logic in `scripts/install-artifact-pack.mjs`. |
| Installer candidate index | Consume `installed-packs[].candidate-index` and `installed-packs[].scope`; do not duplicate install/update/disable behavior. |
| Test entry point | `tests/artifact-pack-discovery-routing.test.mjs` is wired into `node scripts/validate-llm-first.mjs --check artifact-pack-discovery-routing`. |
| CLI/debug output | If a debug command is added, it returns the result envelope and candidate rows without loading artifact bodies. |

## Design Plan

S0 - Baseline re-check

Input:
- `docs/plans/completed/artifact-pack-manifest-contract.md`
- `docs/plans/completed/artifact-pack-validation-gates.md`
- `agent/config/artifact-pack.schema.json`
- `tests/fixtures/artifact-packs/`
- `tests/fixtures/artifact-pack-sets/`

Output:
- Confirmed manifest contract and validator gates pass before resolver design implementation starts.

Non-output:
- No resolver code, installed lifecycle code, schema edits, or fixture rewrites.

Failure:
- Stop and patch the manifest contract or validation-gate spec before resolver work.

Proof:
- `node scripts/validate-llm-first.mjs --check artifact-pack`
- `node scripts/validate-llm-first.mjs --check spec-lifecycle`

S1 - Resolver fixture contract

Input:
- Contract Block and Selection Rules from this spec.
- `tests/routing-fixtures.json`
- Existing artifact-pack fixtures.

Output:
- Proposed fixture cases for selected, excluded, ambiguous, exact-name, disabled-pack, and compatibility routes.

Non-output:
- No resolver implementation.

Failure:
- Missing natural-language fixture input blocks implementation.

Proof:
- Fixture matrix exists in this spec.

S2 - Resolver candidate model

Input:
- Candidate Row table.
- Manifest export route metadata.
- Installed pack active rows.

Output:
- Candidate row fields and result envelope fields map to manifest metadata, installed registry rows, core artifact metadata, or request evidence.

Non-output:
- No body parser, skill loader, command executor, or harness adapter.

Failure:
- Candidate model lacks a field needed to prove source, scope, result kind, load state, or compatibility need.

Proof:
- Each Candidate Row and Result Envelope field maps to a manifest, registry, or request evidence source.

S3 - Selection and guard implementation

Input:
- Selection Rules.
- Body-Load Guard.
- Compatibility Resolution.
- Implementation Surface.

Output:
- Resolver can return `primary`, `ambiguous`, `excluded`, or `core-fallback` result envelope.

Non-output:
- No pack installation, artifact migration, or public example pack.

Failure:
- Any excluded route or ambiguous tie loads a body.

Proof:
- Routing fixtures assert emitted candidate count, primary id, load-state, and resolver body load count.

S4 - Practical LLM-use test

Input:
- Natural requests for Shotloom review, Obsidian note work, web review, and exact skill names.

Output:
- Resolver chooses expected pack or core route without resolver body loads.

Non-output:
- No user-facing copy change outside test reports.

Failure:
- Wrong primary candidate, extra resolver body load, or unresolved compatibility alias.

Proof:
- Practical test report records input prompt, expected candidate, actual candidate, and resolver body load count.

## Fixture Matrix

| Fixture | Input | Expected |
|---------|-------|----------|
| `select-shotloom-review` | User asks for Shotloom Rust PR review in Shotloom repo. | One primary Shotloom review candidate; resolver body load count remains zero. |
| `exclude-sibling-domain` | User asks for web review with UE terms in unrelated text. | Web candidate remains; UE pack is excluded. |
| `exact-skill-name` | User names a pack-exported skill. | Matching candidate selected by exact-name evidence. |
| `disabled-pack` | Installed row is disabled. | No candidate emitted from that pack. |
| `scope-mismatch` | Installed row scope does not match repo key or work mode. | No candidate emitted from that pack. |
| `ambiguous-priority` | Two candidates tie without priority. | Ambiguous result; resolver body load count remains zero. |
| `compatibility-alias` | User invokes old command or skill name. | Candidate points to target artifact id and records compatibility need, compatibility alias id, and matched input. |
| `explicit-excluded-artifact` | User explicitly names an artifact blocked by `exclude-when`. | Result kind is `excluded`; resolver body load count remains zero. |
| `manual-load-named` | User explicitly names a manual-load artifact. | Candidate appears metadata-only; resolver body load count remains zero. |
| `on-demand-metadata` | User searches a matching on-demand artifact. | Candidate appears metadata-only; resolver body load count remains zero. |
| `below-min-evidence` | Route-selected export has insufficient evidence. | Candidate remains metadata-only and is not selected. |

## Validation

| Check | Command |
|-------|---------|
| Manifest gates | `node scripts/validate-llm-first.mjs --check artifact-pack` |
| Context routing | `node scripts/validate-llm-first.mjs --check context-routing` |
| Spec lifecycle | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |
| Full validator | `node scripts/validate-llm-first.mjs` |
| Patch whitespace | `git diff --check` |

## Risks

| Risk | Control |
|------|---------|
| Resolver loads too much context. | Candidate rows separate metadata from body and expose `load-state`. |
| Duplicate candidates hide ambiguity. | Ties without priority return ambiguous and do not load bodies. |
| Compatibility creates duplicate owners. | Candidate rows always name canonical `artifact-id` plus `compatibility-need`. |
| Disabled packs still influence route choice. | Disabled installed rows emit no candidates. |
| Natural prompts miss route evidence. | Practical LLM-use fixtures cover realistic user wording. |

## Implementation Acceptance Criteria

- [x] Resolver consumes the request, harness id, cwd repo key, work mode, touched paths, named artifact, core artifacts, active installed pack rows, and validated manifests.
- [x] Resolver returns the result envelope defined in this spec.
- [x] Candidate rows include every field defined in this spec.
- [x] Body-load guard preserves `manual`, `on-demand`, and `route-selected` behavior.
- [x] Selection applies active-state, scope, exclusions, visibility, priorities, exact names, ambiguity, and fallback.
- [x] Compatibility rows resolve to canonical artifact ids.
- [x] Fixtures cover selected, excluded, ambiguous, disabled, scoped-out, exact-name, compatibility, manual, and on-demand routes.
- [x] Implementation plan excludes install, migration, and example-pack work.

## Open Decisions

| Decision | Default |
|----------|---------|
| Candidate score formula | Count matched positive evidence; priority only breaks tied route signatures. |
| Secondary candidates | Expose at most two secondary candidates when they have explicit evidence and no exclusion. |
| Body-load count instrumentation | Add a test-only counter in resolver implementation. |
