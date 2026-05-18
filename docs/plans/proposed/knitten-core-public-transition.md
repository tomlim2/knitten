---
status: proposed
created: 2026-05-18
updated: 2026-05-18
owner: agent-hub
milestone: agent-artifact-pack-system
intake: docs/briefings/specs/knitten-core-public-transition.md
---

# Knitten Core Public Transition

## Purpose

Plan the transition from the current all-in-one Knitten repository to a
public-facing `knitten-core` repository plus external artifact repositories.

## Problem

Knitten currently mixes public-worthy agent core infrastructure with personal,
company-specific, repo-specific, and domain-specific artifacts. That is useful
for local productivity, but too noisy and risky for external exposure.

Without a transition plan, making Knitten public could leak private context,
overwhelm readers with unrelated domains, or break routing by moving artifacts
without compatibility shims.

## Goals

- Define what remains in `knitten-core`.
- Define what moves to external artifact repositories or packs.
- Define a migration order that is reversible and reviewable.
- Define public-readiness gates for private data, company references, local
  paths, and repo-specific assumptions.
- Keep current local workflows working during migration.

## Non-Goals

- Do not move files in this spec.
- Do not publish or rename the remote repository.
- Do not decide all final artifact pack names.
- Do not remove active local workflows before compatibility is proven.

## Current State

| Surface | Current State |
|---------|---------------|
| Core docs | `SYSTEM.md`, entry documents, glossary, rules, specs, milestones, and validators live in this repo. |
| Artifacts | Skills, commands, rules, and standards include core, personal, company, repo-specific, and domain-specific material. |
| Artifact pack direction | `agent-artifact-pack-system` defines packs, manifests, discovery, install, and validation as the next architecture. |
| Work safety | Worktree-first and solo PR review flow are now repo-native. |

## Proposed Design

Create a public-facing repository named `knitten-core` that contains only the
agent operating core:

| Keep In `knitten-core` | Move Out |
|------------------------|----------|
| Repository charter, entry documents, glossary, and public README. | Personal logs, life workflows, tutoring, drink, and private vault helpers. |
| Spec, milestone, routing, validation, and generated-block infrastructure. | Company-specific CINEV, Shotloom, Slack, Linear, and deploy workflows. |
| Git, PR, worktree, permission, and config safety rules. | Domain packs for UE, VRM, PMX, design, video, Obsidian, art, and web audits unless needed as public examples. |
| Artifact vocabulary, manifest schema, resolver, installer, and validator. | Large domain reference catalogs and high-churn experiments. |
| Minimal bootstrap artifacts for maintaining core and artifact packs. | Local machine paths, personal repo aliases, and private integration settings. |

External artifact repositories may start as one private or public repo, then
split into domain packs as the manifest contract matures.

## Public-Readiness Gates

| Gate | Requirement |
|------|-------------|
| Private data scrub | No secrets, private paths, personal logs, student/client data, Slack tokens, or company-only operational details. |
| Company boundary | Company/repo-specific artifacts are moved to packs or removed from public core. |
| Naming clarity | Public names use `knitten-core`, `agent artifact`, `artifact pack`, and `artifact manifest` consistently. |
| Install clarity | A new reader can install and validate core without local private config. |
| Compatibility | Local private artifact packs can still be linked after core is separated. |
| Validation | Public-safe validator checks for absolute paths, private folders, retired names, and pack manifest integrity. |
| Release process | License, version, changelog, and release notes are present before external visibility. |
| Example pack | A public-safe example artifact pack proves the pack workflow without private context. |

## Migration Plan

| Phase | Work | Acceptance |
|-------|------|------------|
| P0 Inventory | Generate inventory for skills, commands, rules, standards, configs, docs, and scripts. | Every tracked artifact has owner, artifact type, domain, privacy risk, dependency notes, and proposed destination. |
| P1 Boundary | Apply `core`, `external-pack`, `private-only`, `deprecated`, or `migrate-later` classification. | Classification is reviewed before any move. |
| P2 Public Core Skeleton | Create `knitten-core` skeleton README, install docs, validator docs, and minimal examples. | A reader understands the repo without private context. |
| P3 Artifact Repo Setup | Create external artifact repo or repos with initial manifest, README, validation, and worktree policy. | Artifact repo can be linked locally without copying into core. |
| P4 Example Pack | Create a public-safe example artifact pack. | Manifest, install, resolver, routing, and validation are proven without private context. |
| P5 Pilot Migration | Move one low-risk optional artifact pack first. | Compatibility links or router aliases keep old workflows working. |
| P6 Core Scrub | Remove or rewrite private/company/local references from core. | Public-safe validator passes and manual review finds no blockers. |
| P7 Release Gates | Add CI, versioning, license, changelog, and public release checks. | Public release cannot proceed without gate evidence. |
| P8 Batch Migration | Move remaining artifact packs in small PRs. | Each batch has validation, rollback mapping, and updated manifests. |
| P9 Public Release Prep | Final README, examples, license, changelog, and migration notes. | `knitten-core` is ready to expose externally. |
| P10 Cleanup | Remove temporary compatibility links after pack routing is stable. | No active references point to removed paths. |

## Repo Strategy Options

| Option | Pros | Risks |
|--------|------|-------|
| New `knitten-core` repo with no-history initial public import | Clean public surface and easiest scrub story. | Loses detailed old history unless mirrored privately. |
| Rename current repo to `knitten-core` after migration | Keeps history and tags. | Requires stronger history scrub and careful remote migration. |
| Keep current repo private and publish generated public mirror | Safest privacy boundary. | More tooling and sync complexity. |

Default: create a new `knitten-core` repository as a no-history initial public
import from a reviewed clean tree, and keep the current Knitten repository
private until scrub confidence is high.

## Current `knitten` Repository Role

The current `knitten` repository should not become the public repository
directly during the first transition. It should become the private integration
workspace that owns local operations, artifact incubation, private packs, and
release preparation for `knitten-core`.

| Repository | Visibility | Role |
|------------|------------|------|
| `knitten` | private | Integration workspace, full private history, local machine config, private artifact pack staging, migration manifests, and release preparation. |
| `knitten-core` | public candidate | Clean core framework with public-safe bootstrap, lifecycle, routing, validation, safety, and artifact-pack infrastructure. |
| artifact pack repo or repos | private first, public per pack later | Optional skills, commands, rules, standards, and domain-specific references. |

This means `knitten` remains valuable after public extraction. It is not a
throwaway repo. It becomes the place where private workflows can keep evolving
while selected public-safe core changes are promoted into `knitten-core`.

## Repository Promotion Model

| Flow | Rule |
|------|------|
| `knitten` to `knitten-core` | Promote only public-safe core changes after scrub, validation, and review. |
| `knitten` to artifact pack repo | Move optional artifacts after classification and compatibility planning. |
| artifact pack repo to `knitten` | Link or pin packs locally through manifests; do not copy pack contents back into core. |
| `knitten-core` to `knitten` | Pull public core updates back into the private integration workspace to avoid drift. |

`knitten-core` should be treated as the release surface. `knitten` should be
treated as the private development and integration surface.

At the end of the transition, `knitten` should be treated as a private artifact
pack monorepo plus integration overlay rather than a core repository.

## `knitten` Retained Contents

| Keep In Private `knitten` | Reason |
|---------------------------|--------|
| Full migration inventory and classification reports. | They may mention private paths, companies, or personal workflow context. |
| Private artifact pack staging. | Packs can be scrubbed and released independently later. |
| Machine-local config templates and private path mapping notes. | They are useful locally but not public-safe. |
| Compatibility shims during migration. | They protect current local workflows while public core stabilizes. |
| Release scripts that assemble or verify `knitten-core`. | They may need private source paths and pack mappings. |

## `knitten-core` Initial Contents

| Include | Exclude |
|---------|---------|
| `SYSTEM.md`, public `AGENTS.md`, public `CLAUDE.md`, glossary, and README. | Private entry document overrides and local machine assumptions. |
| `agent/rules/` entries needed for git, PR, worktree, permissions, and core authoring. | Repo-specific, company-specific, or personal workflow rules. |
| `agent/skills/` bootstrap skills for spec, milestone, artifact pack, validation, and routing maintenance. | Domain packs such as Shotloom, UE, Obsidian, tutoring, drink, media, or company deploy skills. |
| `agent/standards/` policy and naming standards needed to maintain core. | Large domain reference catalogs. |
| `scripts/validate-llm-first.mjs` and public-safe validators. | Validators that require private machine files unless guarded as optional. |
| Minimal examples and fixtures. | Real private project data. |

## Transition States

| State | Meaning | Exit Criteria |
|-------|---------|---------------|
| `private-monorepo` | Current state: core and artifacts live together privately. | Public transition spec accepted. |
| `split-planning` | Inventory and boundary decisions are being made. | Every artifact has a proposed destination. |
| `dual-track` | `knitten` stays private while `knitten-core` is assembled and artifact packs are piloted. | Public-safe validation passes on `knitten-core`. |
| `public-core` | `knitten-core` is externally visible; `knitten` remains private integration workspace. | Public README, install, validation, license, and examples are complete. |
| `pack-stabilized` | Artifact pack repos are linked by manifest instead of copied into core. | Pack resolver and pack validators are stable. |

## Private Pack Conversion Timing

Current `knitten` becomes a private artifact pack only after all of these are
true:

1. `knitten-core` installs and validates without reading private `knitten`
   paths.
2. Core bootstrap workflows exist in `knitten-core`.
3. `knitten` has an artifact pack manifest for its private artifacts and local
   overlays.
4. Local harnesses can load `knitten-core` plus the `knitten` private pack.
5. Current private workflows are reproduced through manifests or compatibility
   shims.
6. Public-safe scrub gates pass for `knitten-core`.

Before these gates pass, `knitten` stays a private integration workspace. After
they pass, `knitten` becomes the private pack and incubator; `knitten-core`
becomes the public core and release surface.

## Execution Order

1. Write `artifact-pack-vocabulary`.
2. Write `core-artifact-boundary`.
3. Write `knitten-core-public-transition` implementation checklist from this
   plan.
4. Generate artifact inventory.
5. Review classification objectively.
6. Create artifact repo migration plan.
7. Create `knitten-core` skeleton.
8. Pilot one external artifact pack.
9. Run public-readiness scrub.
10. Prepare public release PR.

## Validation

- `git diff --check`
- `node scripts/validate-llm-first.mjs`
- Future implementation must add a public-readiness validator or report that
  checks:
  - absolute user paths;
  - private folders;
  - company-only names;
  - secrets or token-looking values;
  - broken artifact pack manifests;
  - broken markdown links after migration.

## Risks

| Risk | Control |
|------|---------|
| Private or company information leaks into public core. | Treat scrub as a release gate, not a cleanup task. |
| Core becomes too small to be useful. | Keep bootstrap lifecycle, routing, validation, and artifact-pack management in core. |
| Moved artifacts break local workflows. | Use compatibility links or router aliases until pack routing is proven. |
| Migration becomes too large to review. | Move in small reversible batches. |
| Public names drift from internal names. | Standardize on `knitten-core`, `agent artifact`, and `artifact pack`. |

## Acceptance Criteria

- [ ] A core/external classification inventory exists.
- [ ] `knitten-core` contents are defined before repository creation or rename.
- [ ] External artifact repository strategy is selected.
- [ ] Public-readiness gates are documented and testable.
- [ ] Migration order includes rollback and compatibility behavior.
- [ ] Local private workflows can continue through artifact packs.
- [ ] Final public release requires validator and manual review evidence.

## Open Decisions

| Decision | Default |
|----------|---------|
| Public repo strategy | Create a new clean `knitten-core` repo. |
| External artifact repo count | Start with one artifact repo, split later if needed. |
| History strategy | Preserve full history privately; publish clean reviewed history externally. |
| First migration target | Choose a low-risk optional pack after inventory. |
