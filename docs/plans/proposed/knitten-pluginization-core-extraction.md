---
status: proposed
created: 2026-06-01
updated: 2026-06-01
owner: agent-hub
milestone: agent-artifact-pack-system
---

# Knitten Pluginization Core Extraction

## Purpose

Define the staged plan for turning Knitten into a small core plus artifact
packs.

Use `artifact pack` in system contracts. Use `plugin` only as the user-facing
word for an installed or selectable pack.

## Problem

Knitten currently mixes core operating-system artifacts with domain, repo,
company, personal, media, review, and experimental workflows. Artifact-pack
vocabulary, manifests, validation, discovery routing, and example pack support
already exist, but the next extraction step still lacks one execution contract.

Without that contract, a migration can move skills while leaving behind their
rules, standards, templates, outputs, local artifact paths, scripts, references,
validators, and compatibility aliases.

| Failure mode | Effect |
|--------------|--------|
| Moving only `agent/skills/*`. | Skill dependencies break and route selection becomes misleading. |
| Treating plugins as folders only. | Outputs, local paths, templates, scripts, and validators stay coupled to core. |
| Extracting Shotloom first. | High-dependency repo workflow creates too many resolver and compatibility variables at once. |
| Rewriting core before inventory review. | Core can lose bootstrap, safety, or repair artifacts. |
| Direct file moves without shims. | Existing harness routes and skill names break. |
| Public core work mixed with private pack work. | Privacy scrub and release gates become unreviewable. |

## Goals

| Goal | Requirement |
|------|-------------|
| Core boundary | Define what must stay in core before any pack loads. |
| Pack unit | Treat a plugin as an artifact pack with manifest, exports, dependencies, and route metadata. |
| Dependency closure | Move or declare every referenced skill support file with the owning pack. |
| Registry strategy | Define how pack outputs, local artifacts, templates, and validators compose with core. |
| Extraction order | Start with dry-run inventory and a low-risk pilot, not Shotloom. |
| Compatibility | Preserve old skill names, paths, aliases, or routes until resolver proof exists. |
| Validation | Require mechanical gates before file moves and after each batch. |

## Non-Goals

| Non-Goal | Reason |
|----------|--------|
| Move files in this spec. | This spec defines gates and order only. |
| Publish `knitten-core`. | Public release gates are separate. |
| Rewrite manifest schema now. | Existing schema is accepted unless implementation proves a gap. |
| Convert Shotloom first. | Shotloom is a later high-dependency pack. |
| Replace output or local artifact registries with one mega registry. | Existing owners stay; composition is added around them. |
| Remove compatibility paths immediately. | Removal requires route and reference-scan proof. |

## Current State

| Surface | Current fact |
|---------|--------------|
| Vocabulary | `artifact pack`, `artifact manifest`, `artifact resolver`, `core artifact`, and `pack artifact` are defined. |
| Manifest schema | `agent/config/artifact-pack.schema.json` validates pack exports, mounts, route metadata, dependencies, and compatibility aliases. |
| Discovery routing | `scripts/resolve-artifact-route.mjs` and related tests define route-safe candidate selection. |
| Example pack | `examples/artifact-packs/example-skill-pack/` proves the pack contract. |
| Inventory | `agent/config/artifact-inventory.json` records current artifacts and reviewed decisions. |
| Core boundary | `docs/plans/active/core-artifact-boundary.md` defines deterministic core vs pack criteria. |
| Public transition | `docs/plans/proposed/knitten-core-public-transition.md` keeps current `knitten` private and plans `knitten-core`. |
| Output system | `agent/config/outputs.json` and `agent/config/local-artifact-paths.json` still live as central registries. |
| Open milestone placeholders | `knitten-private-pack-transition` and `artifact-repo-migration-plan` exist as proposed milestone placeholders. |

## Proposed Design

### Target Repository Roles

| Repository | Role | Rule |
|------------|------|------|
| `knitten-core` | Core operating system. | Owns bootstrap, resolver, validator, installer, lifecycle, safety, schemas, and public-safe examples. |
| `knitten` | Private integration workspace during transition. | Owns private workflows, migration inventory, local overlay, and pack incubation. |
| artifact pack repos | Optional plugin packs. | Own domain, repo, company, personal, media, review, or experimental artifacts through manifests. |

Do not make the current private `knitten` repo the public core directly. Promote
reviewed public-safe core slices into `knitten-core`.

### Core Contents

| Keep in core | Reason |
|--------------|--------|
| `SYSTEM.md`, entry document templates, glossary, and shared policy. | Required before pack discovery. |
| Artifact vocabulary, manifest schema, route resolver, installer, validators, and fixtures. | Required to load and validate packs. |
| Spec, milestone, artifact, skill, document-template, and config lifecycle skills. | Required to maintain core and packs. |
| Git, worktree, PR, permission, secret, path, and destructive-operation safety rules. | Required before optional workflows execute. |
| Output contract and local artifact protocol. | Required for pack outputs to compose safely. |
| Compatibility shim and migration tooling. | Required until old paths are retired. |

### Pack Contents

| Move to packs | Pack type |
|---------------|-----------|
| Shotloom skills, rules, templates, scripts, outputs, local artifact rows, and references. | private repo pack, later. |
| CINEV/CCI/Slack/Linear/company workflows. | private company pack. |
| Personal utilities, tutoring, drink, learning, and local vault helpers. | private personal pack. |
| Design, media, image, video, UE, VRM, PMX, and review catalogs. | domain packs. |
| Public-safe examples and demo skills. | public example pack. |
| High-churn experiments. | incubator pack or private pack. |

### Skill Pack Readiness

Skill classification is not part of the first pluginization migration. Run it
after the migration foundation exists: pack install, route resolution,
compatibility aliases, generated registry composition, and validation gates.

Before a skill moves into a pack in that later phase, prepare the skill
directory and its support artifacts so the pack manifest can describe the full
runnable unit.

| Readiness area | Requirement |
|----------------|-------------|
| Thin skill body | `SKILL.md` keeps executable workflow, inputs, stop conditions, outputs, and validation; long guidance moves to references, standards, templates, or validators. |
| Dependency closure | Every referenced rule, standard, script, template, config row, local artifact row, output id, fixture, and reference doc is listed as keep-in-core, move-with-pack, or compatibility dependency. |
| Output ownership | Skill-written outputs use core output contracts or pack-exported output contracts; no hand-built repeated path/template pair remains. |
| Local state ownership | Skill local state uses core local artifact paths or pack-exported local artifact paths with cleanup rules. |
| Route metadata | Manifest route metadata names repo keys, route domains, task types, languages, frameworks, work modes, exclusions, and min evidence when needed. |
| Compatibility alias | Existing skill name, old path, or route alias is preserved until route and reference scans are clean. |
| Privacy classification | Skill and support files have privacy risk and owner-domain classification before pack selection. |
| Validator proof | Pack validation, route resolver fixtures, and any skill-specific checks pass before old core path removal. |

Skill readiness output path:

```text
docs/plans/reports/knitten-pluginization-core-extraction/skill-pack-readiness-<skill-or-pack>-YYYY-MM-DD.md
```

The readiness report must list the skill id, current path, proposed pack,
support artifacts, unresolved dependencies, output ids, local artifact identities,
template paths, scripts, route metadata, compatibility aliases, privacy blockers,
and validation commands.

### Pack Unit

A plugin is not only a skill directory. It is an artifact pack with dependency
closure.

```text
artifact-pack/
  artifact-pack.json
  skills/
  rules/
  standards/
  document-templates/
  config/
    outputs.json
    local-artifact-paths.json
  lib/
  scripts/
  docs/
  tests/
```

The exact folder set is optional. The manifest declares exported artifacts and
dependencies; unused folders should not exist.

Pack-local output and local-artifact config files are exported as `config`
artifacts in `artifact-pack.json`. They are not new top-level manifest fields in
this spec.

### Mount And Ownership Boundary

Symlinks, hardlinks, APFS clones, copied runtime files, and harness-specific
install targets are mount mechanics only. They do not own canonical content.

| Surface | Canonical owner |
|---------|-----------------|
| Core artifact | `knitten-core` source tree after extraction. |
| Pack artifact | Artifact pack source tree plus `artifact-pack.json`. |
| Private local overlay | Current private `knitten` workspace until private pack conversion completes. |
| Harness runtime path | Installed or mounted view generated from core plus active packs. |

Do not delete existing symlink or hardlink assumptions until pack install,
route resolution, compatibility aliases, generated registry composition, and
validator checks prove the mounted view can replace them.

| Link policy | Rule |
|-------------|------|
| Allowed during transition | Links may mount core or pack artifacts into a harness runtime path. |
| Forbidden as ownership | Do not treat a link target under `~/.claude`, `~/.codex`, or another runtime path as the canonical owner. |
| Removal gate | Remove old links only after resolver and validator proof confirms no active workflow reads the old path directly. |
| Drift gate | If a linked runtime file differs from its canonical core or pack source, stop and repair before migration. |

### Manifest Requirements

Use the existing artifact-pack manifest schema first.

| Manifest surface | Required for extraction |
|------------------|-------------------------|
| `pack-id` | Stable pack id. |
| `visibility` | `public`, `private`, `company`, or `local`. |
| `owner-domain` | `core`, `repo`, `company`, `personal`, `domain`, or `experiment`. |
| `exports[]` | Every skill, rule, standard, config, script, doc, fixture, generated view, or shim exported by the pack. |
| `exports[].route` | Route metadata for route-selected artifacts. |
| `dependencies` | Core capabilities, other packs, or required artifacts. |
| `compatibility-aliases` | Old names, paths, shims, redirects, or removal criteria. |

Do not add a new manifest field until a pilot pack cannot express a required
dependency or route using the current schema.

### Registry Composition

Pack registries compose with core registries through generated merged views.

| Registry | Core source | Pack source | Generated view |
|----------|-------------|-------------|----------------|
| Output contracts | `agent/config/outputs.json` | installed pack `config/outputs.json` export | generated merged outputs registry |
| Local artifact paths | `agent/config/local-artifact-paths.json` | installed pack `config/local-artifact-paths.json` export | generated merged local artifact registry |
| Artifact route candidates | core artifact metadata | installed pack manifests | resolver candidate rows |
| Templates | `agent/document-templates/` | pack `document-templates/` exports | manifest-resolved template path |
| Validators | core validator checks | pack validator fixtures or scripts | core validator invokes declared pack checks only after pack selection or install validation |

The first implementation should not make resolvers read arbitrary pack folders
directly. It should generate or resolve through installed-pack metadata so
duplicates and route conflicts fail closed.

Merged registries are derived artifacts. Core and pack registries remain the
editable sources of truth.

| Generated view rule | Requirement |
|---------------------|-------------|
| Canonical source | Core registry plus installed pack manifest exports. |
| Edit policy | Never hand-edit a merged registry. |
| Initial storage | Implementation spec must choose `.agent-local` for local-only generation or a tracked `generated-view` artifact with validator ownership. |
| Duplicate handling | Duplicate output ids, local artifact identities, route signatures, and template targets fail closed before resolver use. |
| Provenance | Generated view records source pack ids, manifest versions, and source commits when available. |

### Extraction Order

| Phase | Work | Exit gate |
|-------|------|-----------|
| P0 Freeze target | Accept this spec and update milestone. | Spec lifecycle validator passes. |
| P1 Migration foundation | Implement or verify pack install, route resolution, compatibility alias handling, generated registry composition, and validation gates. | Pack infrastructure works without moving production skills. |
| P2 Inventory dry run | Query current inventory by owner domain, privacy risk, dependencies, and proposed destination, without final skill classification. | Candidate surfaces and dependency risks are visible; no files moved. |
| P3 Manifest dry run | Create pack manifest drafts for candidate non-production or example packs without moving source files. | Manifest validator passes against draft fixtures. |
| P4 Registry merge design | Define generated merged registry strategy for outputs and local artifacts. | Resolver smoke fixtures prove no duplicate ids. |
| P5 Low-risk pilot | Extract one small public-safe example or non-critical utility pack. | Existing route names still work through compatibility aliases. |
| P6 Skill classification | After foundation and pilot pass, classify skills and prepare skill readiness reports. | Every candidate skill has keep-in-core, move-to-pack, migrate-later, deprecated, or blocked status. |
| P7 Core slimming | Move only artifacts proven pack-owned after skill classification and pilot success. | Core validator passes without pack bodies. |
| P8 Shotloom pack | Extract Shotloom after registry merge, compatibility shims, pack lifecycle, and skill classification are stable. | Shotloom workflows run from pack manifests. |
| P9 Public core promotion | Promote public-safe core into `knitten-core`. | Public-safety, license, CI, README, and release gates pass. |

### First Pilot Rule

Do not choose Shotloom as the first real extraction.

| Candidate | Use when |
|-----------|----------|
| Public-safe example pack | To test manifest, install, route, validation, and docs without privacy risk. |
| Small private utility pack | To test private pack install and local overlay without public release pressure. |
| Design/media pack | Only after dependency closure confirms no private paths or large validator coupling. |
| Shotloom pack | Only after registry composition and compatibility shims are implemented. |

### Compatibility Policy

| Surface | Required compatibility |
|---------|------------------------|
| Skill name | Alias old skill id to pack artifact id. |
| Old path | Shim or redirect until reference scan is clean. |
| Output id | Preserve id unless pack prefixing is explicitly accepted. |
| Local artifact path | Preserve cleanup behavior and old path compatibility when existing local state matters. |
| Rule/standard path | Replacement link or manifest alias before deletion. |
| Router behavior | Route to pack artifact without loading unrelated pack bodies. |

### Stop Conditions

| Stop when | Reason |
|-----------|--------|
| Candidate pack has unresolved private data risk. | Public or shared extraction cannot proceed. |
| Any skill dependency is outside the candidate pack and not declared. | Pack would not be reproducible. |
| Duplicate output id, local artifact path, or route signature appears. | Resolver could select wrong artifact. |
| Core loses pack install, validate, route, or repair ability. | Core boundary is violated. |
| Compatibility alias lacks removal criteria. | Old paths can become permanent drift. |

## Execution Plan

| Step | Action | Output |
|------|--------|--------|
| 1 | Accept this spec and milestone link. | Proposed execution contract exists. |
| 2 | Implement or verify plugin migration foundation. | Pack install, route resolution, compatibility aliases, generated registry composition, and validation gates are usable. |
| 3 | Generate pluginization inventory report without final skill classification. | Candidate packs and dependency risks are visible. |
| 4 | Pick first non-critical pilot. | One low-risk pack candidate selected. |
| 5 | Write manifest dry-run spec or report. | Pack manifest draft validates without file moves. |
| 6 | Write registry merge implementation spec if foundation gaps remain. | Output/local artifact composition is specified before extraction. |
| 7 | Implement pilot extraction. | Small reversible PR with compatibility aliases and validation. |
| 8 | After pilot, run skill classification and readiness reports. | Candidate skills are classified and prepared for later movement. |
| 9 | Review pilot and classification metrics. | Decide whether to proceed to larger private/domain packs. |

Step 2 output path:

```text
docs/plans/reports/knitten-pluginization-core-extraction/pluginization-inventory-YYYY-MM-DD.md
```

The report must list candidate pack, row ids, owner domain, privacy risk,
dependencies, support files, output ids, local artifact identities, templates,
scripts, compatibility needs, and blocker status.

Do not assign final skill movement decisions in this report. Final skill
classification starts only after the migration foundation and pilot extraction
pass.

## Design Plan

S0 - Baseline re-check

Input:
- `docs/milestones/agent-artifact-pack-system.md`
- `docs/plans/completed/artifact-pack-vocabulary.md`
- `docs/plans/completed/artifact-pack-manifest-contract.md`
- `docs/plans/completed/artifact-pack-discovery-routing.md`
- `docs/plans/active/core-artifact-boundary.md`
- `docs/plans/proposed/knitten-core-public-transition.md`
- `agent/config/artifact-pack.schema.json`
- `agent/config/artifact-inventory.json`

Output:
- Confirmed existing pack infrastructure and unresolved extraction gap.

Non-output:
- No file movement.

Failure:
- Stop if manifest schema or discovery routing validators fail before design
  starts.

Proof:
- `node scripts/validate-llm-first.mjs --check artifact-pack`
- `node scripts/validate-llm-first.mjs --check artifact-pack-discovery-routing`

S1 - Core and pack boundary

Input:
- Baseline evidence.
- `core-artifact-boundary` rules.

Output:
- Core Contents, Pack Contents, Pack Unit, and Stop Conditions sections.

Non-output:
- No final classification edits.

Failure:
- Stop if a proposed pack artifact is required before pack discovery.

Proof:
- `node -e 'const fs=require("fs"); const rows=JSON.parse(fs.readFileSync("agent/config/artifact-inventory.json","utf8")).rows; const counts={}; for (const r of rows) { const k=[r["classification-stage"],r["proposed-destination"],r["owner-domain"],r["privacy-risk"]].join("|"); counts[k]=(counts[k]||0)+1; } console.log(JSON.stringify(counts,null,2));'`

S2 - Registry composition

Input:
- Existing output and local artifact registries.
- Pack manifest exports.

Output:
- Generated merged registry strategy.

Non-output:
- No resolver rewrite in this spec.

Failure:
- Stop if duplicate ids or route signatures have no fail-closed rule.

Proof:
- Future implementation must add duplicate-id fixtures for outputs, local
  artifacts, route signatures, and template target collisions.

S3 - Extraction sequence

Input:
- Pack candidate report from S1.
- Registry composition from S2.

Output:
- Phased extraction order and first pilot rule.

Non-output:
- No Shotloom extraction.

Failure:
- Stop if first pilot requires private-data scrub or broad compatibility shims.

Proof:
- Pilot candidate has small dependency closure and manifest dry-run can pass.

S4 - Validation

Input:
- Final spec and milestone diff.

Output:
- Spec lifecycle and artifact-pack validators pass.

Non-output:
- No commit or PR unless separately requested.

Failure:
- Fix lifecycle, link, or validator defects before implementation.

Proof:
- `git diff --check`
- `node scripts/validate-llm-first.mjs`
- `node scripts/validate-llm-first.mjs --check spec-lifecycle`
- `node scripts/validate-llm-first.mjs --check artifact-pack`

## Validation

| Check | Command |
|-------|---------|
| Diff hygiene | `git diff --check` |
| Full LLM-first validation | `node scripts/validate-llm-first.mjs` |
| Spec lifecycle | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |
| Artifact pack manifest gates | `node scripts/validate-llm-first.mjs --check artifact-pack` |
| Discovery routing gates | `node scripts/validate-llm-first.mjs --check artifact-pack-discovery-routing` |
| Inventory availability | `test -f agent/config/artifact-inventory.json` |
| Artifact inventory validator | `node scripts/validate-llm-first.mjs --check artifact-inventory` |

## Risks

| Risk | Mitigation |
|------|------------|
| Plugin wording drifts from system terminology. | Use `artifact pack` in specs and `plugin` only as user-facing alias. |
| Pack extraction becomes big-bang migration. | Require inventory, dependency closure, manifest dry run, pilot, and compatibility before moves. |
| Central registries become pack bottlenecks. | Use generated merged views and duplicate-id fail-closed checks. |
| Core becomes too thin. | Keep install, validate, route, repair, lifecycle, and safety artifacts in core. |
| Core remains too large. | Move route-selected domain and repo workflows after pilot proof. |
| Private data leaks into public core. | Keep current `knitten` private until public-safety gates pass. |

## Acceptance Criteria

| ID | Criterion |
|----|-----------|
| AC1 | Spec defines `plugin` as user-facing wording for manifest-backed artifact packs. |
| AC2 | Spec defines target roles for `knitten-core`, current `knitten`, and artifact pack repos. |
| AC3 | Spec lists core contents and pack contents with extraction rules. |
| AC4 | Spec defines dependency closure beyond `agent/skills/*`. |
| AC5 | Spec defines registry composition for outputs and local artifact paths. |
| AC6 | Spec blocks Shotloom as first extraction and requires a low-risk pilot. |
| AC7 | Spec defines compatibility policy for names, paths, outputs, local artifacts, rules, standards, and router behavior. |
| AC8 | Spec defines stop conditions and validation commands before implementation. |
| AC9 | Spec defines the pluginization inventory report path and required report fields. |
| AC10 | Spec states merged registries are derived artifacts and not editable sources of truth. |
| AC11 | Spec defers final skill classification until after plugin migration foundation and pilot extraction pass. |
| AC12 | Spec defines later skill pack readiness requirements and readiness report fields before moving skills into packs. |

## Accepted Defaults

| Decision | Default |
|----------|---------|
| User-facing word | Use `plugin`; system files use `artifact pack`. |
| First pilot | Choose after inventory dry run; default to public-safe example or small private utility pack. |
| Registry merge artifact | Generate merged views; do not hand-edit merged output. |
| Skill classification timing | After plugin migration foundation and pilot extraction, not before. |
| Shotloom timing | Later, after pilot and registry composition. |
| Public repository creation | Separate release task after public-safety and license gates. |

## Related Placeholder Specs

| Placeholder | Relationship |
|-------------|--------------|
| `knitten-private-pack-transition` | This spec defines the first executable transition contract; a later focused spec may still define final private-pack cutover gates. |
| `artifact-repo-migration-plan` | This spec defines the pre-move sequence; a later focused spec must own concrete repository creation, batch moves, rollback mapping, and cleanup. |
