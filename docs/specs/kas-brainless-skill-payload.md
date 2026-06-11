# KAS Brainless Skill Payload

## Status

Draft.

## Goal

Make `knitten-all-skills` a brainless payload plugin: it stores private skill
content only, while `knitten` owns every generic path, routing, output,
repository-location, template, validation, and local-runtime concern.

## Problem

KAS still contains support infrastructure that makes it behave like a second
core plugin. The recent `skills/kas-support/` move removed root-level clutter,
but it did not finish the boundary: generic helper scripts, shared templates,
standards, and historical planning docs still live in KAS under a different
folder.

That leaves the wrong ownership model in place. Skills can still learn paths
from KAS-local helpers, KAS can still regrow routing behavior, and future
cleanup has to reason about two runtime owners instead of one.

## Boundary

In scope:

- Define the final KAS tree shape with no `kas-support`.
- Move or delete KAS support material that is not owned by a specific skill.
- Move all generic path/routing responsibilities to `knitten`.
- Convert active KAS skills to call Knitten-owned path services.
- Keep only skill-local files in KAS.
- Add validation that fails when KAS regrows generic runtime surfaces.

Out of scope:

- Moving private domain skills out of KAS.
- Making `knitten` depend on KAS.
- Keeping historical KAS planning docs inside KAS for archival convenience.
- Preserving compatibility with KAS-local generic helpers after the migration.
- Rewriting skill behavior unrelated to path/routing ownership.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `knitten` source checkout | Yes | Core plugin that will own path/routing services. |
| `knitten-all-skills` source checkout | Yes | Payload plugin to slim down. |
| Existing KAS references to `skills/kas-support` | Yes | Inventory of active consumers that must be moved, replaced, or deleted. |
| Existing Knitten path/output runtime | Yes | `bin/knitten-resolve-output`, `scripts/resolve-output.mjs`, and related docs/tests. |
| KAS boundary validator | Yes | Existing validator to tighten after migration. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Knitten path service additions | durable | KC-owned commands/APIs for output paths, local artifact paths, plugin roots, repository roots, and shared templates. |
| KAS consumer rewrite | durable | Active KAS skills call KC path services or use skill-local files only. |
| KAS support deletion | durable | `skills/kas-support/` is removed after all active consumers are migrated or deleted. |
| KAS strict boundary validator | durable | KAS fails validation if generic runtime/helper/template/doc surfaces return. |
| Migration evidence | local | Doctor, validator, and targeted smoke output from KC and KAS. |

## Contract

- `knitten` owns all generic path problems.
- KAS must not own generic output resolvers, local artifact resolvers, helper
  registries, repository locators, plugin-root discovery, shared templates, or
  shared standards.
- KAS must not contain `skills/kas-support/` in the final state.
- KAS active skills may only use:
  - their own `SKILL.md`
  - `references/`
  - `assets/`
  - `web/`
  - `scripts/`, Python, or Node helpers that are specific to that skill
- KAS skill-local helpers may not implement generic path resolution. They may
  call a Knitten-owned command and then use the returned path.
- KAS may keep plugin packaging files required for Codex installation:
  `.codex-plugin/plugin.json`, `README.md`, and narrowly scoped packaging
  scripts. Those scripts must not own routing policy.
- Shared document templates belong to `knitten` unless a template is used by
  exactly one skill and lives under that skill.
- Historical planning docs about the KC/KAS boundary belong in
  `knitten/docs/specs` or outside the plugin payload, not in KAS.
- Private repository keys such as `shotloom` are data, not KAS runtime logic.
  KC owns the locator mechanism; private machine mappings stay in local config
  or environment variables.

## Target Tree

```text
knitten-all-skills/
  .codex-plugin/plugin.json
  README.md
  scripts/
    doctor.mjs
    materialize-local-plugin.mjs
    validate-boundary.mjs
  skills/
    <skill-name>/
      SKILL.md
      references/
      assets/
      web/
      scripts/
      *.mjs
      *.py
      *.sh
```

Allowed root scripts are packaging and validation only. They must not contain
generic path policy, generic output policy, helper registries, or private
repo-key lookup.

## Required Knitten Services

Knitten must provide one stable interface for payload skills:

```bash
<knitten-root>/bin/knitten-path <command> [args...]
```

Minimum commands:

| Command | Purpose |
|---------|---------|
| `output` | Resolve generic output paths and create parent directories when requested. |
| `artifact` | Resolve registered local artifact paths. |
| `template` | Resolve KC-owned shared templates by id. |
| `repo` | Resolve repository keys from env or local-private config. |
| `plugin-root` | Resolve known plugin roots such as `knitten` and `knitten-all-skills`. |

The command may wrap existing KC scripts internally, but the payload contract is
the single `knitten-path` surface. KAS skills should not call KC internal script
paths directly after this migration.

## Migration Sequence

### 1. Freeze The Final Boundary

Files:

- `knitten/docs/specs/kas-brainless-skill-payload.md`
- `knitten/docs/guidelines/plugin-boundary.md`
- `knitten-all-skills/README.md`
- `knitten-all-skills/scripts/validate-boundary.mjs`

Changes:

- Record that KAS final state has no `kas-support`.
- Update KAS README to say the payload stores skills only.
- Add validator checks that can run in warn mode during migration and hard-fail
  after `kas-support` is removed.

Risk:

- A strict boundary written before KC has replacement services can block useful
  intermediate work.

Proof:

- `node scripts/validate-boundary.mjs --warn-only` in KAS reports every
  remaining non-skill support surface.

### 2. Add Knitten Path Command

Files:

- `knitten/bin/knitten-path`
- `knitten/scripts/resolve-output.mjs`
- `knitten/scripts/resolve-artifact.mjs`
- `knitten/scripts/resolve-template.mjs`
- `knitten/scripts/resolve-repo.mjs`
- `knitten/scripts/resolve-plugin-root.mjs`
- `knitten/scripts/doctor.mjs`

Changes:

- Add the KC-owned command surface for all path questions.
- Keep existing `bin/knitten-resolve-output` as a compatibility wrapper around
  `knitten-path output`.
- Add repository lookup as a generic mechanism that reads environment variables
  and local-private config; do not commit private repo mappings.
- Add template lookup for shared KC templates.

Risk:

- Combining too much behavior into one CLI can create vague errors.

Proof:

- `bin/knitten-path output --kind=review-json --name=smoke --create`
- `bin/knitten-path repo shotloom` with env/config set.
- `bin/knitten-path template review-code`
- `node scripts/doctor.mjs`

### 3. Move Shared Templates To Knitten

Files:

- `knitten/document-templates/**`
- `knitten/scripts/resolve-template.mjs`
- `knitten-all-skills/skills/kas-support/document-templates/**`
- Active KAS skills that reference shared templates.

Changes:

- Move shared templates from KAS to KC.
- Give each shared template a stable id.
- Rewrite KAS skills to ask KC for template paths by id.
- Move single-skill templates under the owning skill instead of KC.

Risk:

- Some templates may look shared but contain domain-specific assumptions.

Proof:

- KAS has no `skills/kas-support/document-templates`.
- Active KAS skills contain no `skills/kas-support/document-templates` refs.
- Template resolver smoke checks pass.

### 4. Move Or Delete Shared Standards And Docs

Files:

- `knitten/docs/specs/**`
- `knitten/docs/guidelines/**`
- `knitten-all-skills/skills/kas-support/docs/**`
- `knitten-all-skills/skills/kas-support/agent/standards/**`
- KAS skill references that point at shared standards.

Changes:

- Move current boundary specs and reusable policy docs to KC.
- Move skill-specific docs into `skills/<skill>/references/`.
- Delete stale historical planning docs after their replacement or archival
  destination is recorded.
- Do not keep a KAS docs archive inside the payload.

Risk:

- Deleting historical docs can remove useful migration context if no
  replacement note exists.

Proof:

- KAS has no `skills/kas-support/docs`.
- KAS has no `skills/kas-support/agent/standards`.
- Active KAS skills contain no `skills/kas-support/docs` or
  `skills/kas-support/agent/standards` refs.

### 5. Replace KAS Generic Helpers

Files:

- `knitten-all-skills/skills/kas-support/agent/lib/resolve-output.mjs`
- `knitten-all-skills/skills/kas-support/agent/lib/resolve-local-artifact-path.mjs`
- `knitten-all-skills/skills/kas-support/agent/lib/resolve-repo-path.mjs`
- `knitten-all-skills/skills/kas-support/agent/lib/resolve-helper-path.mjs`
- `knitten-all-skills/skills/kas-support/agent/lib/prepare-local-bin.mjs`
- `knitten-all-skills/skills/kas-support/agent/lib/activate-local-bin.sh`
- Active KAS skills and scripts that call those files.

Changes:

- Replace direct calls to KAS generic helpers with `knitten-path`.
- Remove helper bin activation from KAS unless it is replaced by a KC-owned
  activation command.
- Do not keep compatibility wrappers in KAS after consumers are migrated.

Risk:

- Skills with shell snippets may silently keep old helper paths in examples.

Proof:

- `rg -n "kas-support|resolve-output|resolve-local-artifact-path|resolve-repo-path|resolve-helper-path|activate-local-bin" knitten-all-skills/skills`
  has no active-step hits except legacy references explicitly labeled as
  historical.
- KAS doctor passes.

### 6. Move Skill-Owned Helpers To Owning Skills

Files:

- `knitten-all-skills/skills/kas-support/agent/lib/shotloom-*.mjs`
- `knitten-all-skills/skills/kas-support/agent/lib/github-pr-*.mjs`
- Shotloom and PR-review skills that use those helpers.

Changes:

- Move Shotloom-only helpers under the owning Shotloom skill, or under a
  clearly named Shotloom shared skill if multiple Shotloom skills need them.
- Move GitHub PR helpers under the skill that owns PR response/review behavior,
  or replace them with KC generic GitHub support only if they are domain-neutral.
- Update imports and shell snippets.

Risk:

- A helper used by several skills can become duplicated or hidden in the wrong
  skill.

Proof:

- `rg -n "skills/kas-support/agent/lib" knitten-all-skills/skills` returns no
  active references.
- Shotloom skill smoke tests pass.

### 7. Delete `skills/kas-support`

Files:

- `knitten-all-skills/skills/kas-support/**`
- `knitten-all-skills/scripts/validate-boundary.mjs`
- `knitten-all-skills/scripts/doctor.mjs`

Changes:

- Delete `skills/kas-support`.
- Promote validator checks from warn to fail for:
  - `skills/kas-support`
  - generic resolver/helper filenames
  - shared template directories
  - broad docs/standards directories
- Keep only plugin packaging and validation scripts at root.

Risk:

- Hidden runtime references can remain in non-SKILL scripts.

Proof:

- `test ! -e skills/kas-support`
- `node scripts/validate-boundary.mjs`
- `node scripts/doctor.mjs`

### 8. Materialize And Smoke Both Plugins

Files:

- `knitten/scripts/materialize-local-plugin.mjs`
- `knitten-all-skills/scripts/materialize-local-plugin.mjs`
- Installed plugin copies under the local marketplace.

Changes:

- Refresh local plugin copies.
- Confirm new sessions can see KC and KAS.
- Run targeted smoke checks for skills touched by migration.

Risk:

- Source checks can pass while installed copies still contain old paths.

Proof:

- `node <knitten-root>/scripts/doctor.mjs`
- `node <kas-root>/scripts/doctor.mjs`
- `codex plugin list`
- Targeted Shotloom and review-skill smoke commands.

## Validation

- `git -C <knitten-root> diff --check`
- `git -C <kas-root> diff --check`
- `node <knitten-root>/scripts/doctor.mjs`
- `node <kas-root>/scripts/doctor.mjs`
- `node <kas-root>/scripts/validate-boundary.mjs`
- `test ! -e <kas-root>/skills/kas-support`
- `rg -n "skills/kas-support|agent/lib/resolve|document-templates|agent/standards|activate-local-bin" <kas-root>/skills`
- `rg -n "knitten-path" <kas-root>/skills`

The first `rg` is expected to return no active runtime references. Historical
mentions are allowed only when explicitly labeled as legacy evidence under a
skill reference file.

## Acceptance Criteria

- KAS has no `skills/kas-support`.
- KAS has no generic path/output/helper runtime.
- KAS has no shared template directory.
- KAS has no broad docs or standards directory.
- KAS active skills resolve every generic path through KC.
- KC exposes a stable path service for output, artifact, template, repo, and
  plugin-root questions.
- Private repo mappings are local config/env data, not committed KAS logic.
- KAS validator fails if `kas-support` or generic path helpers return.
- KC and KAS doctors pass in source and materialized plugin copies.

## Open Questions

- Should the KC path command be named `knitten-path`, or should existing
  `knitten-resolve-output` grow subcommands?
- Should multi-skill Shotloom helper code live under one Shotloom coordinator
  skill, or be split per owning skill?
- Which historical KAS docs are worth moving to KC specs instead of deleting?

## Design Plan

### Inputs

- This spec.
- `docs/specs/knitten-all-skills-payload-boundary-migration.md`.
- Current KAS `skills/kas-support` inventory.
- Current KC path/output runtime.

### Outputs

- KC path service implementation.
- KAS consumer rewrites.
- Deleted KAS support tree.
- Strict KAS boundary validator.
- Validation evidence for source and installed plugin copies.

### Implementation Sequence

#### 1. Audit Current `kas-support` Consumers

Files:

- `knitten-all-skills/skills/**`
- `knitten-all-skills/scripts/**`

Changes:

- Produce an inventory of every `kas-support` reference.
- Classify each as KC path service, KC template, skill-owned helper,
  skill-owned reference, stale doc, or delete.

Risk:

- Bulk text replacement can break references that should instead be deleted.

Proof:

- Inventory table or local report with owner/action for every active hit.

#### 2. Build KC Replacement Surface

Files:

- `knitten/bin/knitten-path`
- `knitten/scripts/*.mjs`
- `knitten/scripts/doctor.mjs`

Changes:

- Add missing KC path service commands.
- Keep existing output behavior compatible.
- Add tests or doctor checks for every command consumed by KAS.

Risk:

- KC can accidentally absorb private domain policy instead of only mechanism.

Proof:

- KC doctor and command smoke tests pass.

#### 3. Rewrite Active KAS Skills

Files:

- KAS skills listed by the audit.

Changes:

- Replace `kas-support` generic helper calls with `knitten-path`.
- Move skill-owned helpers under their owning skill.
- Delete stale support docs instead of updating them.

Risk:

- Active skill snippets can remain stale in references or shell scripts.

Proof:

- KAS skill smoke tests and `rg` checks pass.

#### 4. Delete Support Tree And Tighten Validator

Files:

- `knitten-all-skills/skills/kas-support/**`
- `knitten-all-skills/scripts/validate-boundary.mjs`
- `knitten-all-skills/scripts/doctor.mjs`

Changes:

- Delete `skills/kas-support`.
- Fail validation if broad support surfaces return.

Risk:

- Installed plugin copy can still contain deleted files until materialized.

Proof:

- Source and materialized KAS doctors pass.

### Review Plan

- Contract: KAS stores skill payload only; KC answers generic path questions.
- Boundary: no `kas-support`, no KAS generic resolver/helper/template/doc
  ownership.
- Validation: both plugin doctors, KAS strict boundary validator, targeted
  skill smoke checks, and source/materialized copy checks.
