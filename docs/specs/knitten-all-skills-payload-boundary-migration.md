# Knitten All Skills Domain Boundary Migration

## Status

Implemented/historical. This document used the older `payload plugin` term while
defining the boundary now called `domain plugin` in `SYSTEM.md`.

## Goal

Migrate `knitten-all-skills` into a domain plugin that contains only domain
skills and skill-owned support files.

`knitten` owns generic path/output routing, shared AH templates, core
validators, and plugin boundary rules. `knitten-all-skills` owns private domain
skills and the files required to run those skills.

## Problem

`knitten-all-skills` is still shaped like a legacy all-in-one repository. It
contains skills, but it also contains generic AH infrastructure:

- path/output registries
- global helper scripts
- shared document templates
- public-core migration documents
- broad planning, milestone, and reference documents
- `.agent-local` scratch trees

That makes the plugin boundary unclear. A payload skill can accidentally depend
on KAS-local path policy instead of the Knitten runtime, and future skills can
continue adding reusable core artifacts to the wrong plugin.

## Boundary

In scope:

- Define the target KAS tree shape.
- Classify KAS root-level artifacts as keep, move, archive, or delete.
- Move generic path/output ownership to `knitten`.
- Keep skill-owned runtime files inside each owning skill.
- Add validation that prevents KAS from regrowing core/path/output surfaces.
- Update KAS manifest wording to describe a private skill payload plugin.

Out of scope:

- Rewrite every KAS skill in this migration.
- Remove domain skills from KAS.
- Move domain-specific skill implementations into `knitten`.
- Add domain-specific output kinds to `knitten`.
- Delete historical documents before they have a migration destination.
- Add a general repository locator to `knitten`.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `knitten` source checkout | Yes | Core plugin that owns routing and path/output behavior. |
| `knitten-all-skills` source checkout | Yes | Payload plugin to slim down. |
| KAS root inventory | Yes | Current top-level directories and files to classify. |
| KAS skill dependency scan | Yes | Skill references to root-level `agent/lib`, `agent/config`, `document-templates`, `docs`, and `.agent-local`. |
| Knitten output runtime | Yes | `bin/knitten-resolve-output` and `scripts/resolve-output.mjs`. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| KAS payload boundary inventory | durable | Classification of KAS root artifacts and migration action. |
| KAS migration PR | durable | File moves, deletions, manifest updates, and compatibility wrappers. |
| Knitten core follow-up PRs | durable | Any required core resolver/template/validator additions. |
| KAS payload boundary validator | durable | Check that KAS remains a skill payload plugin. |
| Validation evidence | local | Doctor, materialization, and targeted skill smoke results. |

## Contract

- `knitten` owns generic path/output routing.
- KAS must not own `agent/config/outputs.json`, generic output resolvers, or
  shared local artifact path registries.
- KAS must not own reusable AH document templates unless the template is
  explicitly skill-owned and stored under the owning skill.
- KAS may own files under `skills/<skill>/` when they are required for that
  skill's behavior.
- Skill-owned files include `SKILL.md`, `references/`, `assets/`, `web/`,
  `scripts/`, Python/Node helpers, and tests that are only meaningful for that
  skill.
- KAS skills that need a generic output path call the Knitten runtime through a
  small payload output shim or explicit documented command.
- KAS must not keep root-level durable docs except `README.md`.
- KAS plugin planning, migration specs, and boundary policy documents live in
  `knitten/docs/specs` because they define the core/payload contract.
- Historical KAS documents are moved to `knitten`, archived outside the payload
  plugin, or deleted only after their replacement location is recorded.
- `.agent-local/**` remains local scratch and must not be part of the durable
  payload plugin contract.
- Repository path lookup is not the same as path/output routing. A repository
  locator maps private repo keys such as `shotloom` or `mmd-anju` to machine
  paths; KAS may keep that only as skill-owned or local-private behavior.
  Knitten may own a generic repository locator contract later, but not a private
  repo-key registry in this migration.

## Target Tree

```text
knitten-all-skills/
  .codex-plugin/plugin.json
  README.md
  scripts/
    doctor.mjs
    materialize-local-plugin.mjs
    resolve-knitten-output
  skills/
    <skill-name>/
      SKILL.md
      references/
      assets/
      web/
      scripts/
      tests/
```

Root `scripts/` is allowed only for plugin packaging checks and payload-to-
Knitten runtime shims. It must not contain generic AH path policy or private
repo-key registries.

KAS must not keep a root `docs/` tree after this migration. Durable KAS planning
docs belong in `knitten/docs/specs`; skill documentation belongs under
`skills/<skill>/references/`.

## Artifact Classification

| KAS Surface | Target Owner | Action |
|-------------|--------------|--------|
| `skills/<skill>/SKILL.md` | KAS | Keep. |
| `skills/<skill>/references/**` | KAS | Keep when skill-specific; move generic references to Knitten. |
| `skills/<skill>/assets/**` | KAS | Keep when used only by that skill. |
| `skills/<skill>/web/**` | KAS | Keep when used only by that skill. |
| `skills/<skill>/*.py` or `*.mjs` | KAS | Keep when skill-owned runtime; replace generic path logic with Knitten calls. |
| `agent/config/outputs.json` | Knitten | Move/remove from KAS. |
| `agent/config/local-artifact-paths.json` | Knitten | Move/remove from KAS unless converted to a skill-owned map. |
| `agent/config/local-helper-paths.json` | Knitten | Move/remove from KAS. |
| `agent/lib/resolve-output.mjs` | Knitten | Remove from KAS; use `bin/knitten-resolve-output`. |
| `agent/lib/resolve-local-artifact-path.mjs` | Knitten | Remove from KAS or replace with skill-owned wrapper. |
| `agent/lib/resolve-repo-path.mjs` | KAS skill-owned or local-private | Do not move private repo keys into Knitten; convert consumers to skill-owned lookup or a future repository locator contract. |
| `agent/lib/shotloom-*.mjs` | KAS skill-owned or Shotloom pack | Move under owning Shotloom skill if still required. |
| `document-templates/**` | Knitten by default | Move shared templates to Knitten; keep only skill-owned templates under skills. |
| `docs/public-core/**` | Knitten | Move to Knitten or archive as migration history. |
| `docs/plans/**` | Knitten or archive | Move core/plugin plans to Knitten; do not keep KAS root planning docs. |
| `docs/milestones/**` | Knitten or archive | Move core/plugin milestones to Knitten; remove from KAS payload contract. |
| `docs/reference/**` | Case-by-case | Move generic reference to Knitten; move skill reference under owning skill. |
| `docs/kas/**` | Knitten | Do not create; KAS planning docs live in Knitten. |
| `.agent-local/**` | local only | Do not commit; ignore or clean. |

## Migration Sequence

### 1. Inventory

Files:

- `knitten-all-skills/.codex-plugin/plugin.json`
- `knitten-all-skills/README.md`
- `knitten-all-skills/agent/**`
- `knitten-all-skills/docs/**`
- `knitten-all-skills/document-templates/**`
- `knitten-all-skills/scripts/**`
- `knitten-all-skills/skills/**`

Changes:

- Generate a root artifact inventory with owner, action, and blocker columns.
- Scan KAS skills for references to root-level core surfaces.
- Mark each reference as skill-owned, Knitten-core, stale, or unresolved.

Risk:

- A root file can look generic but still be used by one active skill.

Proof:

- `find . -maxdepth 2 -type d | sort`
- `rg -n "agent/lib|agent/config|document-templates|docs/|\\.agent-local|resolve-output|outputs\\.json" skills agent docs document-templates scripts`

### 2. Add Payload Output Shim

Files:

- `knitten-all-skills/scripts/resolve-knitten-output`
- `knitten-all-skills/scripts/doctor.mjs`

Changes:

- Add or confirm a KAS-local shim that forwards unchanged arguments to
  `knitten/bin/knitten-resolve-output`.
- Keep Knitten runtime discovery in Knitten, not in individual skills.
- Update KAS doctor to check that the shim exists and can resolve a generic
  dry-run output.

Risk:

- Skills may call the installed Knitten path directly instead of the shim.

Proof:

- `scripts/resolve-knitten-output --kind=review-json --name=kas-smoke`
- `node scripts/doctor.mjs`

### 3. Add Payload Boundary Validator

Files:

- `knitten-all-skills/scripts/doctor.mjs`
- `knitten-all-skills/scripts/validate-boundary.mjs`

Changes:

- Add KAS payload boundary validation in warn-only mode.
- Teach doctor to report boundary warnings.
- Classify each boundary result as `fail`, `warn`, or `allowed`.
- Keep broad text scans as inventory evidence, not as the final pass/fail
  contract.

Risk:

- A strict first pass can block migration before all legacy files are handled.

Proof:

- `node scripts/doctor.mjs`
- `node scripts/validate-boundary.mjs --warn-only`

### 4. Migrate Consumers

Files:

- `knitten-all-skills/skills/**`
- `knitten-all-skills/scripts/**`

Changes:

- Replace root-level path/template dependencies with Knitten runtime calls or
  skill-owned files.
- Move any genuinely skill-owned helpers under their owning skill.
- Replace direct `agent/lib/resolve-repo-path.mjs` calls with skill-owned repo
  lookup or a documented local-private path mechanism.

Risk:

- Behavior can change if a skill relied on implicit legacy defaults.

Proof:

- Targeted smoke checks for each changed skill.

### 5. Move Core Path/Output Surfaces

Files:

- `knitten-all-skills/agent/config/outputs.json`
- `knitten-all-skills/agent/config/local-artifact-paths.json`
- `knitten-all-skills/agent/config/local-helper-paths.json`
- `knitten-all-skills/agent/lib/resolve-output.mjs`
- `knitten-all-skills/agent/lib/resolve-local-artifact-path.mjs`
- `knitten-all-skills/agent/lib/resolve-helper-path.mjs`
- `knitten/scripts/resolve-output.mjs`
- `knitten/bin/knitten-resolve-output`

Changes:

- Remove KAS-owned generic resolver/config files after consumers are updated.
- Add any missing generic kind or metadata to Knitten only when it is
  payload-agnostic.
- Leave domain-specific outputs as KAS wrappers over generic Knitten kinds.
- Keep private repo-key lookup out of Knitten unless a separate repository
  locator spec is accepted.

Risk:

- A KAS skill can lose an implicit output path if the replacement mapping is not
  explicit.

Proof:

- All KAS skill references to removed generic surfaces are gone or replaced.
- `node <knitten-root>/scripts/doctor.mjs`

### 6. Move Shared Templates And Docs

Files:

- `knitten-all-skills/document-templates/**`
- `knitten-all-skills/docs/public-core/**`
- `knitten-all-skills/docs/plans/**`
- `knitten-all-skills/docs/milestones/**`
- `knitten/document-templates/**`
- `knitten/docs/specs/**`

Changes:

- Move shared AH templates to Knitten.
- Move core/plugin planning specs to Knitten.
- Move skill-specific references under `skills/<skill>/references/`.
- Move KAS plugin planning docs to `knitten/docs/specs`.
- Delete only stale duplicate docs after their replacement is recorded.

Risk:

- Historical context can be lost if deletion happens before a replacement link
  exists.

Proof:

- KAS `document-templates/` is absent or contains only documented exceptions.
- KAS root `docs/` is absent.

### 7. Update KAS Manifest And README

Files:

- `knitten-all-skills/.codex-plugin/plugin.json`
- `knitten-all-skills/README.md`

Changes:

- Change KAS description from "skills, standards, templates, examples, and
  working documents" to a private skill payload plugin.
- Document that path/output routing belongs to Knitten.
- Document allowed KAS root surfaces.
- Document that durable KAS planning docs live in `knitten/docs/specs`.

Risk:

- Manifest wording can drift again if validator does not enforce the boundary.

Proof:

- Manifest no longer advertises standards/templates/working documents as KAS
  scope.

### 8. Promote Boundary Validator To Hard Failure

Files:

- `knitten-all-skills/scripts/doctor.mjs`
- `knitten-all-skills/scripts/validate-boundary.mjs`

Changes:

- Fail on root-level generic path/output owners in KAS.
- Fail on `agent/config/outputs.json`.
- Fail on `agent/lib/resolve-output.mjs`.
- Fail on root `docs/`, except during explicitly marked migration branches.
- Fail on `document-templates/**` unless each exception has an owner note and
  lives under `skills/<skill>/`.
- Validate that skills use the KAS payload output shim or a skill-owned helper
  instead of hard-coded installed Knitten paths.

Risk:

- Hard-fail validation can block unrelated KAS changes if the allowlist is too
  broad or too vague.

Proof:

- Validator supports `--warn-only` only during migration.
- Validator runs as a hard failure after the cleanup milestone.

### 9. Smoke Critical Skills

Files:

- `knitten-all-skills/skills/tutoring-log-lesson/**`
- `knitten-all-skills/skills/shotloom-*/**`
- Any skill changed by path/template migration.

Changes:

- Run targeted smoke checks for skills that had root-level dependencies.
- Confirm skill-owned helpers still work.
- Confirm outputs resolve through Knitten.

Risk:

- A skill can pass static boundary validation while runtime behavior changes.

Proof:

- `node scripts/doctor.mjs`
- Targeted skill smoke commands recorded in the migration PR.

## Boundary Validation Policy

| Check | Result | Rule |
|-------|--------|------|
| Root `agent/config/outputs.json` in KAS | fail | Generic output registry belongs to Knitten. |
| Root `agent/lib/resolve-output.mjs` in KAS | fail | Generic output resolver belongs to Knitten. |
| Root `agent/lib/resolve-local-artifact-path.mjs` in KAS | fail | Generic local artifact resolver belongs to Knitten. |
| Root `agent/config/local-artifact-paths.json` in KAS | fail | Generic local artifact registry belongs to Knitten. |
| Root `agent/config/local-helper-paths.json` in KAS | fail | Generic helper registry belongs outside the payload plugin. |
| Root `document-templates/**` in KAS | fail | Shared templates belong to Knitten; skill templates live under `skills/<skill>/`. |
| Root `docs/**` in KAS | fail | KAS durable planning docs live in Knitten; skill docs live under `skills/<skill>/references/`. |
| `.agent-local/**` committed in KAS | fail | Local scratch is not durable plugin payload. |
| `agent/lib/resolve-repo-path.mjs` in KAS | warn during migration, fail after consumers move | Repo-key lookup is private/domain-local, not generic path/output routing. |
| `rg` hits inside `skills/<skill>/references/**` | allowed when descriptive | Documentation may mention old paths if it clearly says they are legacy or replaced. |
| `rg` hits inside active skill steps | fail unless allowlisted | Active steps must use the KAS payload output shim or skill-owned helper. |
| `skills/<skill>/assets/**`, `web/**`, `scripts/**`, tests | allowed | These are skill-owned payload files when used only by that skill. |

## Validation

- `git -C /Users/younsoolim/Desktop/www/knitten-all-skills status --short`
- `find /Users/younsoolim/Desktop/www/knitten-all-skills -maxdepth 2 -type d | sort`
- `rg -n "agent/lib|agent/config|document-templates|docs/|\\.agent-local|resolve-output|outputs\\.json" /Users/younsoolim/Desktop/www/knitten-all-skills`
- `node <knitten-root>/scripts/doctor.mjs`
- `node <knitten-all-skills-root>/scripts/doctor.mjs`
- `scripts/resolve-knitten-output --kind=review-json --name=kas-boundary-smoke`
- Plugin validation passes for source and materialized copies of both plugins.

The `rg` command is an inventory check. It is not a pass/fail check by itself.
Pass/fail status comes from the KAS payload boundary validator using the
Boundary Validation Policy table.

## PR Phases

| Phase | Repository | Purpose | Must land before |
|-------|------------|---------|------------------|
| A | `knitten` | Ensure generic path/output runtime, docs, and core templates can support KAS without copying core files. | Any KAS removal of generic resolver/config files. |
| B | `knitten-all-skills` | Add payload output shim and warn-only payload boundary validator. | KAS consumer rewrites. |
| C | `knitten-all-skills` | Rewrite active consumers to use Knitten runtime or skill-owned helpers. | KAS root cleanup. |
| D | `knitten` and `knitten-all-skills` | Move shared templates/docs to Knitten, move skill docs under skills, archive historical leftovers. | Hard-fail validation. |
| E | `knitten-all-skills` | Remove root-level legacy surfaces and promote boundary validator to hard failure. | Future KAS feature work. |

Each phase should leave both plugin doctors passing. If a phase needs a
temporary compatibility path, it must name the path, owner, and removal phase.

## Acceptance Criteria

- KAS manifest describes a private skill payload plugin.
- KAS root tree no longer contains generic AH path/output ownership files.
- KAS root tree no longer contains shared document templates by default.
- KAS root tree no longer contains durable `docs/**`; KAS planning docs live in
  Knitten and skill docs live under `skills/<skill>/references/`.
- Skill-owned runtime files remain under their owning skill.
- KAS skills resolve generic output paths through Knitten.
- KAS doctor or payload boundary validator catches reintroduction of generic
  `outputs.json`, generic output resolvers, and broad shared template ownership.
- Knitten doctor continues to pass.
- Materialized plugin copies still validate.

## Open Questions

- Should Shotloom-specific KAS helpers eventually move to a separate Shotloom
  payload plugin?
- Should historical KAS docs be archived in Obsidian, moved to Knitten, or kept
  in a separate migration-history repository?
- Should repository lookup become a separate Knitten repository locator spec
  later, or remain entirely skill-owned/local-private?

## Design Plan

### Inputs

- Current `knitten` source checkout.
- Current `knitten-all-skills` source checkout.
- Existing Knitten output runtime specs.
- KAS root inventory and skill dependency scan.

### Outputs

- This migration spec.
- Follow-up KAS cleanup changes.
- Follow-up Knitten core changes if missing generic runtime support is found.
- Validation evidence from both plugin doctors.

### Implementation Sequence

#### 1. Commit The Migration Contract

Files:

- `docs/specs/knitten-all-skills-payload-boundary-migration.md`

Changes:

- Add the target boundary, classification table, migration sequence, and
  acceptance criteria.

Risk:

- None; this is a planning document.

Proof:

- `git diff --check`

#### 2. Run Inventory And Mark Consumers

Files:

- `knitten-all-skills/.agent-local/ah/reports/<date>-kas-boundary-inventory.md`
  or equivalent local report.

Changes:

- Produce the current KAS root inventory.
- Mark every root-level core artifact with owner/action.
- List skills that depend on core/path/template surfaces.

Risk:

- Inventory can become stale if KAS changes during migration.

Proof:

- Inventory includes command output timestamps and git commit ids.

#### 3. Add Payload Output Shim And Validator

Files:

- `knitten-all-skills/scripts/resolve-knitten-output`
- `knitten-all-skills/scripts/validate-boundary.mjs`
- `knitten-all-skills/scripts/doctor.mjs`

Changes:

- Add the payload-to-Knitten output shim.
- Add boundary validation in warn-only mode.
- Teach doctor to report boundary warnings.

Risk:

- Validator can produce noisy warnings before migration cleanup.

Proof:

- `node scripts/doctor.mjs`
- `node scripts/validate-boundary.mjs --warn-only`

#### 4. Migrate Consumers

Files:

- `knitten-all-skills/skills/**`
- `knitten-all-skills/scripts/**`

Changes:

- Replace root-level path/template dependencies with Knitten runtime calls or
  skill-owned files.
- Move any genuinely skill-owned helpers under their owning skill.
- Replace active repo-key resolver calls with skill-owned lookup or explicit
  local-private configuration.

Risk:

- Behavior can change if a skill relied on implicit legacy defaults.

Proof:

- Targeted smoke checks for each changed skill.

#### 5. Remove Or Move Root-Level Legacy Surfaces

Files:

- `knitten-all-skills/agent/**`
- `knitten-all-skills/document-templates/**`
- `knitten-all-skills/docs/**`
- `knitten/**`

Changes:

- Move core artifacts to Knitten.
- Move skill artifacts under owning skills.
- Archive or delete stale duplicates after replacement is recorded.
- Switch payload boundary validator from warn-only to hard failure for core
  surfaces.

Risk:

- Removing too much at once makes failures hard to attribute.

Proof:

- KAS payload boundary validator passes.
- Knitten doctor passes.
- KAS doctor passes.
- Plugin source and materialized copies validate.

### Review Plan

- Contract: Verify that KAS no longer owns generic path/output systems.
- Boundary: Verify that Knitten does not import domain-specific skill behavior.
- Naming: Verify that the spec uses existing Knitten system terms:
  `payload plugin`, `payload output shim`, `path/output runtime`,
  `payload boundary validator`, `skill-owned`, and `local-private`.
- Validation: Verify doctor, payload boundary validator, materialization, and
  targeted skill smoke evidence are present.
