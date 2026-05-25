---
status: completed
created: 2026-05-25
updated: 2026-05-25
owner: agent-hub
milestone: agent-artifact-pack-system
intake: docs/briefings/specs/artifact-pack-validation-gates.md
completed: 2026-05-25
---

# Artifact Pack Validation Gates

## Purpose

Define validation gates for artifact pack manifests so core rejects invalid
pack contracts before discovery, routing, install, migration, or release gates
consume them.

## Problem

`artifact-pack-manifest-contract` defines manifest fields and names seven
validator gates. It does not define the failing cases, check order, fixtures,
core capability registry, or route-conflict detection contract.

Without this spec, downstream implementation can accept unsafe manifests,
duplicate exports, stale paths, invalid route metadata, or unresolved
`core:<capability-id>` dependencies.

## Goals

| Goal | Acceptance |
|------|------------|
| Define gate behavior. | Every named manifest gate has inputs, failures, and proof. |
| Define check ordering. | Shape validation runs before semantic validation. |
| Define core capabilities. | `core:<capability-id>` dependencies validate against one registry. |
| Define route conflict checks. | Duplicate route-selected exports fail within a manifest set when no tie-break metadata exists. |
| Define fixture strategy. | Positive and negative manifest fixtures cover every gate. |
| Keep implementation scoped. | Spec does not implement resolver, installer, migration, scrub, or release checks. |

## Non-Goals

| Non-Goal | Owner |
|----------|-------|
| Do not implement pack discovery or route ranking. | `artifact-pack-discovery-routing` |
| Do not implement installed-pack lifecycle, mount, update, or uninstall. | `installed-pack-lifecycle` |
| Do not move artifacts into packs. | `artifact-repo-migration-plan` |
| Do not scan artifact body content for secrets or private data. | `public-safety-scrub-gates` |
| Do not define shim removal windows. | `artifact-compatibility-shims` |
| Do not create the public example pack. | `example-artifact-pack` |

## Current State

| Surface | Fact | Evidence |
|---------|------|----------|
| Vocabulary | Artifact-pack terms are defined and completed. | `docs/plans/completed/artifact-pack-vocabulary.md` |
| Manifest contract | Manifest filename, root fields, export fields, dependencies, route fields, visibility fields, compatibility aliases, and gate names are completed. | `docs/plans/completed/artifact-pack-manifest-contract.md` |
| Validator framework | `scripts/validate-llm-first.mjs` supports named checks through `--check`. | `scripts/validate-llm-first.mjs` |
| Context routing | Route profiles, domains, repo keys, task types, languages, frameworks, and work modes are registry-backed. | `agent/config/context-routing.json` |
| Inventory | Existing artifacts use artifact type, privacy risk, destination, and compatibility vocabulary. | `agent/config/artifact-inventory.json` |
| Milestone | Validation and release gates are required before pack release. | `docs/milestones/agent-artifact-pack-system.md` |

## Brainstorming

### Validation Axes

| Axis | Check Need | Gate |
|------|------------|------|
| JSON shape | Required fields, enum values, scalar formats, and object structure. | `manifest-shape` |
| Path safety | Pack-relative paths, entrypoint containment, mount target containment, and no absolute paths. | `manifest-paths` |
| Export graph | Unique ids, target ids, entrypoint rules, and artifact type consistency. | `manifest-exports` |
| Dependency graph | Typed refs, installed pack refs, exported artifact refs, and core capability refs. | `manifest-dependencies` |
| Route metadata | Registry-backed route values, minimum evidence, body-load guards, and conflict detection. | `manifest-routing` |
| Visibility | Public manifests expose only public-safe exports. | `manifest-visibility` |
| Compatibility | Alias shape, old path rules, shim refs, and removal criteria. | `manifest-compatibility` |

### Design Options

| Option | Description | Decision |
|--------|-------------|----------|
| One monolithic `artifact-pack` check | Validate schema and semantics in one validator check. | Reject; failures become hard to route to the owning gate. |
| Seven independent checks | Each gate is separately runnable with `--check`. | Accept for implementation names. |
| Parent `artifact-pack` check plus seven internal gates | Full validator runs one parent check and reports gate-prefixed failures. | Accept as reporting wrapper. |
| Validate installed packs only | Read manifests from the future install registry. | Reject for first implementation; install registry is not defined. |
| Validate explicit manifest fixtures and repo-local pack roots | Validator accepts fixture roots, manifest sets, current repo examples, and `--artifact-pack <path>` inputs. | Accept for first implementation. |

### Failure Levels

| Level | Meaning | Validator Behavior |
|-------|---------|--------------------|
| error | Manifest cannot be consumed safely. | Fail the check. |
| warning | Manifest is valid but blocks public release or migration. | Record in future release gates, not this validator. |
| info | Diagnostic for resolver ranking. | Exclude from this validator. |

First implementation uses errors only.

## Proposed Design

### Check Names

| Check | Scope |
|-------|-------|
| `artifact-pack` | Parent check that loads manifests and runs all gates. |
| `artifact-pack:manifest-shape` | Schema and root/export object shape. |
| `artifact-pack:manifest-paths` | Path containment and absolute-path rejection. |
| `artifact-pack:manifest-exports` | Export id and export target consistency. |
| `artifact-pack:manifest-dependencies` | Dependency reference parsing and resolution. |
| `artifact-pack:manifest-routing` | Route registry validation and route conflict detection. |
| `artifact-pack:manifest-visibility` | Visibility and privacy-risk compatibility. |
| `artifact-pack:manifest-compatibility` | Alias, redirect, old-path mapping, shim, and removal criteria validation. |

### Inputs

| Input | Rule |
|-------|------|
| Manifest file | JSON file named `artifact-pack.json`. |
| Manifest set | Two or more `artifact-pack.json` files supplied by a fixture set or `--artifact-pack <path>` input. |
| Manifest schema | `agent/config/artifact-pack.schema.json`. |
| Core capability registry | `agent/config/artifact-pack-core-capabilities.json`. |
| Context routing registry | `agent/config/context-routing.json`. |
| Test fixtures | `tests/fixtures/artifact-packs/**/artifact-pack.json`. |
| Test fixture sets | `tests/fixtures/artifact-pack-sets/**/artifact-pack.json`. |
| Optional repo example | `examples/artifact-packs/**/artifact-pack.json` after `example-artifact-pack` exists. |
| Explicit validator input | `--artifact-pack <path>` accepts a pack root, an `artifact-pack.json` file, or a directory containing nested manifest files. |

Use a manifest set directory when validating `pack:<id>` dependencies before an
install registry exists; single-pack input only validates dependency syntax and
same-pack artifact refs.

### Core Capability Registry

Create `agent/config/artifact-pack-core-capabilities.json`.

| Field | Rule |
|-------|------|
| `schema-version` | Integer `1`. |
| `capabilities` | Non-empty array. |
| `capabilities[].id` | Lowercase slug, `^[a-z0-9]+(-[a-z0-9]+)*$`. |
| `capabilities[].owner` | Core artifact path or validator check name. |
| `capabilities[].description` | One sentence. |

Initial ids:

| Capability Id | Owner |
|---------------|-------|
| `manifest-schema` | `agent/config/artifact-pack.schema.json` |
| `artifact-pack-validation` | `scripts/validate-llm-first.mjs --check artifact-pack` |
| `context-routing` | `agent/config/context-routing.json` |
| `managed-paths` | `agent/config/managed-paths.json` |
| `artifact-inventory` | `agent/config/artifact-inventory.json` |

### Gate Contracts

| Gate | Fails When |
|------|------------|
| `manifest-shape` | JSON parse fails, schema file is missing, required field is missing, enum value is invalid, slug pattern fails, semver pattern fails, or `exports` is empty. |
| `manifest-paths` | Any manifest path is absolute, escapes the pack root, uses `..`, targets an unsupported layer, or declares a directory entrypoint outside its directory. |
| `manifest-exports` | `artifact-id` repeats, skill export lacks `SKILL.md`, `shape` conflicts with artifact type, target artifact id is missing, or mount target repeats without a compatibility row. |
| `manifest-dependencies` | Dependency ref does not match `pack:<id>`, `artifact:<pack-id>/<artifact-id>`, or `core:<capability-id>`; a same-manifest artifact ref is missing; an in-set pack or artifact ref is missing; or a core capability id is absent from the registry. |
| `manifest-routing` | Route-selected export has no positive route field, route values are absent from context routing, `min-evidence` is less than 1, `max-context-bytes` is not positive, or two exports in the same manifest set claim the same route signature without an explicit priority field. |
| `manifest-visibility` | `visibility: public` has any export whose `privacy-risk` is not `public-safe`; `visibility: company` has any export whose `privacy-risk` is `private-only` or `unknown`. |
| `manifest-compatibility` | Alias id repeats, target artifact id is missing, required old name/path/shim path is missing, compatibility need is invalid, path is unsafe, or `removal-criteria` is empty. |

### Route Conflict Signature

Route conflict detection builds a normalized signature from:

| Field | Rule |
|-------|------|
| `context-profile` | Sort as a scalar value. |
| `domains` | Sort values. |
| `repo-keys` | Sort values. |
| `task-types` | Sort values. |
| `languages` | Sort values. |
| `frameworks` | Sort values. |
| `work-modes` | Sort values. |
| `exclude-when` | Sort values. |

If two `route-selected` exports in the same manifest set have the same
signature, the validator fails unless both exports declare distinct
`route.priority` integers. Lower integer priority wins. Priority validation
belongs to this gate; priority interpretation belongs to the resolver spec.

`route.priority` is defined by `artifact-pack-manifest-contract`. If the
manifest contract does not include `route.priority`, S0 must stop before
implementation work starts.

### Fixture Matrix

| Fixture | Expected Result | Gate |
|---------|-----------------|------|
| `valid-minimal-public` | pass | all |
| `invalid-json` | fail | `manifest-shape` |
| `missing-required-root-field` | fail | `manifest-shape` |
| `non-array-compatibility-aliases` | fail | `manifest-shape` |
| `non-string-platform` | fail | `manifest-shape` |
| `absolute-export-path` | fail | `manifest-paths` |
| `entrypoint-escapes-directory` | fail | `manifest-paths` |
| `file-shape-directory-path` | fail | `manifest-paths` |
| `duplicate-artifact-id` | fail | `manifest-exports` |
| `missing-compat-target` | fail | `manifest-exports` |
| `invalid-dependency-ref` | fail | `manifest-dependencies` |
| `unknown-core-capability` | fail | `manifest-dependencies` |
| `missing-in-set-pack-dependency` | fail | `manifest-dependencies` |
| `unknown-route-domain` | fail | `manifest-routing` |
| `route-selected-without-evidence` | fail | `manifest-routing` |
| `duplicate-route-signature-in-set` | fail | `manifest-routing` |
| `public-private-export` | fail | `manifest-visibility` |
| `company-unknown-export` | fail | `manifest-visibility` |
| `empty-removal-criteria` | fail | `manifest-compatibility` |

## Design Plan

S0 - Baseline re-check

Input:
- `docs/plans/completed/artifact-pack-manifest-contract.md`
- `docs/milestones/agent-artifact-pack-system.md`
- `scripts/validate-llm-first.mjs`

Output:
- Confirmed gate names, manifest fields, milestone dependency, and validator check style.

Non-output:
- No schema, registry, fixture, validator, resolver, installer, or artifact move.

Failure:
- Stop and record the conflicting upstream field or missing validator entry point.

Proof:
- `rg -n "manifest-shape|artifact-pack|--check" docs/plans/completed/artifact-pack-manifest-contract.md scripts/validate-llm-first.mjs`

S1 - Validator check skeleton

Input:
- Existing validator command parsing.
- Check names from this spec.

Output:
- `scripts/validate-llm-first.mjs --list` includes the parent check and seven gate checks.
- Gate checks return zero violations when no manifest fixtures or explicit manifest inputs exist.

Non-output:
- No schema, registry, fixture, resolver, installer, or pack root registry.

Failure:
- Stop if the validator cannot select `artifact-pack` or `artifact-pack:<gate>` independently.

Proof:
- `node scripts/validate-llm-first.mjs --list`
- `node scripts/validate-llm-first.mjs --check artifact-pack:manifest-shape`

S2 - Schema and registry files

Input:
- Manifest field contract from `artifact-pack-manifest-contract`.
- Core capability registry contract from this spec.

Output:
- `agent/config/artifact-pack.schema.json`
- `agent/config/artifact-pack-core-capabilities.json`

Non-output:
- No resolver, installer, or pack root registry.

Failure:
- Stop if manifest fields conflict with the upstream manifest contract.

Proof:
- JSON parse check for both files.
- `node scripts/validate-llm-first.mjs --check artifact-pack:manifest-shape`

S3 - Fixture pack set

Input:
- Fixture matrix in this spec.
- Schema and core capability registry from S2.

Output:
- `tests/fixtures/artifact-packs/**/artifact-pack.json` includes one positive fixture and one negative fixture per gate.
- `tests/fixtures/artifact-pack-sets/**/artifact-pack.json` includes dependency and route-conflict set fixtures.

Non-output:
- No external pack clone.
- No generated fixture output committed outside `tests/fixtures/artifact-packs/` or `tests/fixtures/artifact-pack-sets/`.

Failure:
- Stop if a negative fixture fails under the wrong gate.

Proof:
- `node scripts/validate-llm-first.mjs --check artifact-pack`

S4 - Semantic gates

Input:
- Parsed manifest objects.
- Parsed manifest sets.
- Core capability registry.
- Context routing registry.

Output:
- Seven gate functions validate shape, paths, exports, dependencies, routing, visibility, and compatibility.

Non-output:
- No public content scrub.
- No artifact body loading.
- No install registry lookup.
- No resolver scoring.

Failure:
- Stop if any gate needs resolver or installer state not defined in this spec.
- Stop if a manifest parse error hides the file path or gate name.

Proof:
- `node scripts/validate-llm-first.mjs --check artifact-pack:manifest-routing`
- `node scripts/validate-llm-first.mjs --check artifact-pack:manifest-dependencies`
- `node scripts/validate-llm-first.mjs --check artifact-pack`

S5 - Documentation and milestone update

Input:
- Passing validator implementation.
- This proposed spec.

Output:
- Spec status moves from `proposed` to `implemented` or `completed` according to validation state.
- Milestone progress marks validation gates as implemented or completed.

Non-output:
- No downstream spec status changes unless their implementation exists.

Failure:
- Leave status as `proposed` and report the failing gate.

Proof:
- `node scripts/validate-llm-first.mjs --check spec-lifecycle`
- `git diff --check`
- `git status --short --branch`

## Validation

| Check | Command |
|-------|---------|
| Spec lifecycle | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |
| Full validator | `node scripts/validate-llm-first.mjs` |
| Patch whitespace | `git diff --check` |
| Search proof | `rg -n "artifact-pack-validation-gates|artifact-pack:manifest" docs/plans docs/briefings docs/milestones` |
| Scope guard | `git status --short --branch` contains only spec, intake, and milestone docs for this planning pass. |

## Risks

| Risk | Control |
|------|---------|
| Validator depends on install registry too early. | First implementation validates explicit fixtures and repo-local example manifests only. |
| Cross-pack conflicts are missed. | Manifest-set fixtures validate dependency and route conflicts before install registry exists. |
| Public safety is under-scoped. | This spec validates manifest-level visibility only; `public-safety-scrub-gates` owns deep scrub. |
| Route conflict check duplicates resolver behavior. | Validator only detects equal signatures and priority presence; resolver owns ranking. |
| Core capability registry becomes stale. | Registry owner paths and check names must pass existence checks. |
| Negative fixtures pass for the wrong reason. | Each negative fixture states the expected gate and expected message substring. |

## Acceptance Criteria

- [x] `artifact-pack` parent validator check is defined.
- [x] Seven gate-specific checks are defined and separately runnable.
- [x] `artifact-pack-manifest-contract` defines `route.priority`.
- [x] `agent/config/artifact-pack.schema.json` exists.
- [x] `agent/config/artifact-pack-core-capabilities.json` exists.
- [x] `core:<capability-id>` dependencies validate against the core capability registry.
- [x] In-set `pack:<id>` and `artifact:<pack-id>/<artifact-id>` dependencies validate when fixture sets provide both manifests.
- [x] Route conflict signatures fail without distinct route priorities.
- [x] Company visibility rejects `private-only` and `unknown` exports.
- [x] Fixture manifests cover every gate with at least one passing fixture and one failing fixture.
- [x] Full validator includes artifact-pack validation.
- [x] No resolver, installer, migration, public scrub, or release gate is implemented by this spec.

## Open Decisions

| Decision | Default |
|----------|---------|
| Gate check naming in `--check` | Use `artifact-pack:<gate>` for individual gates and `artifact-pack` for the parent. |
| Core capability registry path | `agent/config/artifact-pack-core-capabilities.json`. |
| Fixture root | `tests/fixtures/artifact-packs/` for single manifests and `tests/fixtures/artifact-pack-sets/` for manifest sets. |
| Route priority field | `route.priority` integer; lower value wins in resolver-owned interpretation. |
