---
status: completed
created: 2026-05-25
updated: 2026-05-25
owner: agent-hub
milestone: agent-artifact-pack-system
completed: 2026-05-25
---

# Artifact Pack Manifest Contract

## Purpose

Define the artifact pack manifest schema that discovery, routing, install,
validation, migration, compatibility shims, and example packs consume.

## Problem

Knitten has artifact-pack vocabulary, inventory rows, core/pack boundary
criteria, a machine-readable manifest schema, artifact-pack validator gates,
and manifest fixtures.

Downstream specs consume this contract for pack identity, exported artifacts,
dependencies, routing metadata, compatibility aliases, and public-safety gates.

## Goals

| Goal | Acceptance |
|------|------------|
| Define manifest location and filename. | A pack has one canonical manifest file path. |
| Define pack identity fields. | Pack id, version, display name, visibility, and owner fields are explicit. |
| Define export rows. | Exported artifacts declare id, type, path, load metadata, route metadata, and dependencies. |
| Define compatibility aliases. | Old names and paths map to one canonical exported artifact id with removal criteria. |
| Define route metadata shape. | Resolver inputs can match domain, repo key, task type, language, framework, and work mode. |
| Define validation gates. | Later validators can check manifest shape, path existence, duplicate exports, and unsafe visibility. |
| Keep implementation out. | No resolver, installer, migration, or pack movement happens in this spec. |

## Non-Goals

| Non-Goal | Owner |
|----------|-------|
| Do not implement artifact discovery or resolver behavior. | `artifact-pack-discovery-routing` |
| Do not implement installed-pack lifecycle, mount, update, or uninstall commands. | `installed-pack-lifecycle` |
| Do not move current artifacts into packs. | `artifact-repo-migration-plan` |
| Do not define public-safety scrub rules in detail. | `public-safety-scrub-gates` |
| Do not define old-path shim removal workflow in detail. | `artifact-compatibility-shims` |
| Do not build an example pack. | `example-skill-pack` |

## Current State

| Surface | Fact | Evidence |
|---------|------|----------|
| Vocabulary | `artifact pack`, `artifact manifest`, `artifact resolver`, `artifact id`, and `pack id` are defined. | `docs/plans/completed/artifact-pack-vocabulary.md` |
| Inventory | Current artifacts have `artifact-type`, owner, privacy, proposed destination, and compatibility fields. | `agent/config/artifact-inventory.json` |
| Core boundary | Manifest schema, resolver, installer, and validation infrastructure stay in core. | `docs/milestones/agent-artifact-pack-system.md` |
| Public transition target | Proposed `knitten-core` keeps core lifecycle, routing, validation, resolver, installer, and safety infrastructure. | `docs/plans/proposed/knitten-core-public-transition.md` |
| Managed paths | Shared path drift is already checked through a registry and validator. | `agent/config/managed-paths.json` |
| Manifest schema | `artifact-pack.schema.json` implements the root, export, mount, route, dependency, and compatibility alias contract. | `agent/config/artifact-pack.schema.json` |
| Core capabilities | `core:<capability-id>` dependencies validate against a core capability registry. | `agent/config/artifact-pack-core-capabilities.json` |
| Validator gates | All artifact-pack manifest gates pass against current fixtures. | `node scripts/validate-llm-first.mjs --check artifact-pack` |
| Fixtures | Pass and fail fixtures cover manifest shape, paths, exports, dependencies, routing, visibility, and compatibility. | `tests/fixtures/artifact-packs/`, `tests/fixtures/artifact-pack-sets/` |

## Design

### Manifest File

| Field | Rule |
|-------|------|
| Filename | `artifact-pack.json`. |
| Location | Pack root only; discovery receives explicit pack roots and checks `<pack-root>/artifact-pack.json`. |
| Format | JSON. |
| Schema owner | `agent/config/artifact-pack.schema.json` in Knitten core. |
| Schema version | Manifest root field `schema-version: 1`. |

### Root Fields

| Field | Required | Rule |
|-------|----------|------|
| `schema-version` | yes | Integer `1`. |
| `pack-id` | yes | Lowercase slug, `^[a-z0-9]+(-[a-z0-9]+)*$`. |
| `display-name` | yes | Human label; not a resolver key. |
| `version` | yes | Semver core string, `^\d+\.\d+\.\d+$`. |
| `visibility` | yes | `public`, `private`, `company`, or `local`. |
| `owner-domain` | yes | `core`, `repo`, `company`, `personal`, `domain`, or `experiment`. |
| `description` | yes | One sentence; no resolver semantics. |
| `exports` | yes | Non-empty array of exported artifact rows. |
| `dependencies` | no | Array of typed dependency references. |
| `compatibility-aliases` | no | Array of old name/path mappings. |

### Export Fields

| Field | Required | Rule |
|-------|----------|------|
| `artifact-id` | yes | Pack-local id, unique within the pack. |
| `artifact-type` | yes | Inventory artifact type: `skill`, `command`, `rule`, `standard`, `config`, `script`, `doc`, `fixture`, `generated-view`, or `shim`. |
| `path` | yes | Repo-relative path inside the pack; absolute paths are invalid. |
| `shape` | yes | `file` or `directory`. |
| `mount` | yes | Install target object. |
| `entrypoint` | no | Repo-relative file inside `path` when `shape: directory`. |
| `load` | yes | `on-demand`, `manual`, or `route-selected`. |
| `route` | no | Route metadata object used by resolver candidates. |
| `dependencies` | no | Array of typed dependency references. |
| `privacy-risk` | yes | `public-safe`, `needs-scrub`, `private-only`, or `unknown`. |
| `platforms` | no | Harness names or `all`; adapter-specific behavior remains outside shared policy. |

### Mount Fields

| Field | Required | Rule |
|-------|----------|------|
| `layer` | yes | `skills`, `commands`, `rules`, `standards`, `config`, `scripts`, `docs`, `fixtures`, `generated-views`, or `shims`. |
| `target` | yes | Repo-relative install target under the selected layer; absolute paths are invalid. |
| `mode` | yes | `link`, `copy`, or `virtual`. |

Installer rules:

| If | Then |
|----|------|
| `shape: directory` | `entrypoint` is required and must stay under `path`. |
| `artifact-type: skill` | `shape` is `directory` and `entrypoint` ends with `/SKILL.md`. |
| `mode: link` | Installer links the export path to `mount.target`. |
| `mode: virtual` | Resolver exposes the artifact without writing to the shared layer. |

### Dependency Reference Grammar

Use typed strings only:

| Reference | Meaning |
|-----------|---------|
| `pack:<pack-id>` | Requires another installed pack. |
| `artifact:<pack-id>/<artifact-id>` | Requires an exported artifact from a pack. |
| `core:<capability-id>` | Requires a core capability named by `artifact-pack-validation-gates`. |

Dependency rules:

| Rule | Requirement |
|------|-------------|
| Pack id | Must match `^[a-z0-9]+(-[a-z0-9]+)*$`. |
| Artifact id | Must match `^[a-z0-9]+(-[a-z0-9]+)*$`. |
| Core capability id | Must match `^[a-z0-9]+(-[a-z0-9]+)*$` and be listed by the validator spec. |

### Route Fields

Route fields are optional only when `load` is `on-demand` or `manual`.
`route-selected` exports require at least one positive route field.

| Field | Values |
|-------|--------|
| `context-profile` | Existing context profile id from `agent/config/context-routing.json`. |
| `domains` | Route domain slugs from `agent/config/context-routing.json`. |
| `repo-keys` | Repo keys from machine config or public registry. |
| `task-types` | `authoring`, `implementation`, `review`, `git`, `ops`, `deploy`, or `research`. |
| `languages` | Lowercase language slugs accepted by context routing. |
| `frameworks` | Lowercase framework slugs accepted by context routing. |
| `work-modes` | `personal`, `company`, or `experiment`. |
| `exclude-when` | Route domain slugs that block preloading. |
| `min-evidence` | Integer `1` or greater; resolver must see at least this many matching route evidence items. |
| `max-context-bytes` | Integer byte cap for pre-body context loaded from this export. |
| `priority` | Optional integer tie-breaker for duplicate route signatures in a manifest set; lower value wins. |

Route evidence sources:

| Source | Example |
|--------|---------|
| User words | Explicit repo, domain, task type, or skill name in the request. |
| CWD repo key | Current working directory maps to a registered repo key. |
| File extension | Changed or mentioned files match route languages. |
| Named skill | User names a skill exported by this pack. |
| Command name | User invokes a command or compatibility alias exported by this pack. |
| Frontmatter | Touched docs declare route metadata. |

Preload guard:

| If | Then |
|----|------|
| `load: route-selected` | Resolver can inspect manifest metadata before route selection, but must not load artifact body until route evidence matches. |
| `route.context-profile` exists | Validator checks the id against `agent/config/context-routing.json`. |
| Any route axis exists | Validator checks values against `agent/config/context-routing.json` or the repo-key registry. |
| `route.max-context-bytes` exists | Resolver must cap pre-body context below that value. |
| `route.priority` exists | Validator checks it is an integer and only uses it as a route-conflict tie-breaker. |

### Visibility Rules

| If | Then |
|----|------|
| `visibility: public` | Every export must have `privacy-risk: public-safe`. |
| `visibility: company` | Exports can use `public-safe` or `needs-scrub`; public release stays blocked. |
| `visibility: private` or `local` | Exports can use any `privacy-risk`, but install must stay local/private. |

### Compatibility Alias Fields

| Field | Required | Rule |
|-------|----------|------|
| `alias-id` | yes | Stable alias id. |
| `target-artifact-id` | yes | Existing exported `artifact-id`. |
| `compatibility-need` | yes | `alias`, `shim`, `redirect`, or `old-path-mapping`. |
| `old-name` | conditional | Required for `alias`. |
| `old-path` | conditional | Required for `redirect` or `old-path-mapping`; repo-relative path only. |
| `shim-path` | conditional | Required for `shim`; repo-relative path only. |
| `deprecation-date` | no | ISO date when the alias starts warning. |
| `removal-criteria` | yes | Concrete condition before deleting the alias. |

Compatibility rules:

| If | Then |
|----|------|
| `compatibility-need: redirect` | `old-path` points to the old redirect source. |
| `compatibility-need: old-path-mapping` | `old-path` maps to `target-artifact-id` without creating a file. |
| `compatibility-need: shim` | `shim-path` identifies the shim artifact that preserves behavior. |
| Any compatibility row exists | `removal-criteria` names a reference scan, release, or migration condition. |

### Validator Gates

| Gate | Rule |
|------|------|
| `manifest-shape` | Root fields, export fields, mount fields, dependency refs, route fields, and compatibility rows match schema. |
| `manifest-paths` | Manifest path, export paths, entrypoints, mount targets, old paths, and shim paths are repo-relative and inside the pack or allowed shared layer. |
| `manifest-exports` | `artifact-id` values are unique; `target-artifact-id` values exist. |
| `manifest-dependencies` | Dependency refs parse and required packs, exports, or core capabilities exist. |
| `manifest-routing` | Route values match `agent/config/context-routing.json`; `route-selected` exports have positive evidence and body-load guards. |
| `manifest-visibility` | `visibility: public` rejects non-`public-safe` exports. |
| `manifest-compatibility` | Alias rows match compatibility vocabulary and include machine-checkable removal criteria. |

## Design Plan

S0 - Baseline re-check

Input:
- `docs/plans/completed/artifact-pack-vocabulary.md`
- `docs/plans/active/artifact-inventory-classification.md`
- `docs/milestones/agent-artifact-pack-system.md`

Output:
- Confirmed manifest terms, inventory fields, and milestone dependencies.

Non-output:
- No schema, validator, resolver, installer, or artifact move.

Failure:
- Stop and record missing upstream contract.

Proof:
- `rg -n "artifact-pack-manifest-contract|artifact manifest|artifact resolver" docs/plans docs/milestones docs/reference`

S1 - Contract spec

Input:
- Baseline evidence from S0.

Output:
- `docs/plans/completed/artifact-pack-manifest-contract.md` defines root fields, export fields, route fields, aliases, validation gates, risks, and open decisions.

Non-output:
- No resolver, installer, migration, or pack movement.

Failure:
- Leave unresolved fields in Open Decisions.

Proof:
- `node scripts/validate-llm-first.mjs --check spec-lifecycle`

S2 - Milestone link

Input:
- Completed manifest contract spec.
- `docs/milestones/agent-artifact-pack-system.md`

Output:
- Milestone specs table links the completed manifest contract spec.
- Milestone progress marks schema and validator gates done.

Non-output:
- No downstream spec status changes.

Failure:
- Keep milestone string entry unchanged and report the link conflict.

Proof:
- `rg -n "artifact-pack-manifest-contract" docs/milestones/agent-artifact-pack-system.md docs/plans/completed/artifact-pack-manifest-contract.md`

S3 - Review and validation

Input:
- Spec and milestone diff.

Output:
- LLM-first validator passes.
- Review findings are patched or recorded as open decisions.

Non-output:
- No PR, push, or merge.

Failure:
- Report failing command and leave branch uncommitted.

Proof:
- `git diff --check`
- `node scripts/validate-llm-first.mjs --check spec-lifecycle`
- `node scripts/validate-llm-first.mjs`
- `git status --short`

## Validation

| Check | Command |
|-------|---------|
| Manifest validator | `node scripts/validate-llm-first.mjs --check artifact-pack` |
| Manifest gates | `node scripts/validate-llm-first.mjs --check artifact-pack:manifest-shape` and sibling gate checks |
| Spec lifecycle | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |
| Full validator | `node scripts/validate-llm-first.mjs` |
| Patch whitespace | `git diff --check` |
| Scope guard | `git status --short` contains the completed manifest spec, discovery-routing spec, milestone link update, and stale-reference fixes only. |
| Contract smoke | Inspect this spec for `pack:`, `artifact:`, `core:`, `manifest-routing`, `mount`, and `visibility: public` rules. |

## Risks

| Risk | Control |
|------|---------|
| Manifest schema duplicates inventory schema. | Manifest export fields reuse inventory vocabulary and keep pack-specific fields separate. |
| Route metadata becomes too broad. | `route-selected` exports require positive route evidence and body-load guards. |
| Compatibility aliases become permanent. | Every alias requires `removal-criteria`. |
| Visibility overclaims public safety. | `visibility` and `privacy-risk` are separate fields; public release still depends on `public-safety-scrub-gates`. |
| Installers hardcode layer behavior. | Exports declare mount layer, target, mode, shape, and entrypoint. |

## Acceptance Criteria

- [x] Manifest filename and location are decided.
- [x] Root manifest fields are defined.
- [x] Export fields are defined.
- [x] Route metadata fields are defined.
- [x] Compatibility alias fields are defined.
- [x] Dependency reference grammar is defined.
- [x] Install mount fields are defined.
- [x] Route-selected preload guards are defined.
- [x] Validator gates are implemented and runnable.
- [x] Milestone links this completed spec.
- [x] No resolver, installer, migration, or physical artifact move is included.

## Accepted Defaults

| Decision | Default |
|----------|---------|
| Manifest filename | `artifact-pack.json`. |
| Pack version field | Required semver core `version`, `^\d+\.\d+\.\d+$`. |
| Schema path | `agent/config/artifact-pack.schema.json`. |
| First implementation step | Done: JSON schema and validator checks exist. |

## Open Decisions

| Decision | Default |
|----------|---------|
| Core capability registry | Done in `agent/config/artifact-pack-core-capabilities.json`. |
| Pack root registry | Define installed pack root discovery in `installed-pack-lifecycle`. |
