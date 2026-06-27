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
| Existing KAS boundary checks | Yes | Current KAS-local checks to replace with core-owned validation. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Knitten path service additions | durable | core-owned commands/APIs for output paths, local artifact paths, plugin roots, repository roots, and shared templates. |
| KAS consumer rewrite | durable | Active KAS skills call Knitten Core path services or use skill-local files only. |
| KAS support deletion | durable | `skills/kas-support/` is removed after all active consumers are migrated or deleted. |
| core-owned payload validator | durable | Knitten Core fails validation if KAS regrows generic runtime/helper/template/doc surfaces. |
| Migration evidence | local | Doctor, validator, and targeted smoke output from Knitten Core and KAS. |

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
- KAS active skill instructions and executable files must not contain legacy
  path forms for current behavior. This includes `skills/kas-support`,
  `agent/lib`, `agent/config`, `document-templates`, `agent/standards`,
  `../knitten`, `plugins/knitten`, `bin/knitten-resolve-output`, direct Knitten Core
  `scripts/resolve-*.mjs` calls, `KNITTEN_ROOT`, and historical harness paths
  such as `.claude` for current plugin operation.
- KAS may keep plugin packaging files required for Codex installation:
  `.codex-plugin/plugin.json`, `README.md`, and narrowly scoped packaging
  scripts. Those scripts must not own routing policy.
- KAS root `doctor` or `validate` scripts, if retained, are thin wrappers only.
  They call core-owned validation and may add packaging smoke checks, but they do
  not define boundary rules.
- Shared document templates belong to `knitten` unless a template is used by
  exactly one skill and lives under that skill.
- Historical planning docs about the Knitten Core/KAS boundary belong in
  `knitten/docs/specs` or outside the plugin payload, not in KAS.
- Private repository keys such as `shotloom` are data, not KAS runtime logic.
  Knitten Core owns the locator mechanism; private machine mappings stay in local config
  or environment variables.
- Historical KAS support docs are not preserved in KAS. Keep only docs that are
  current Knitten Core/KAS boundary contracts by moving them to `knitten/docs/specs`;
  delete the rest from the payload plugin after the inventory records their
  disposition.
- Legacy path mentions may remain only in clearly labeled historical evidence
  outside active skill instructions and executable files. They must not appear
  in examples that a user would copy for current work.
- Multi-skill Shotloom helper code lives under one owning coordinator skill:
  `skills/shotloom-references/`. Other Shotloom skills may call or import those
  helpers through skill-relative paths. Do not create a new generic support
  tree, and do not duplicate shared helpers across Shotloom skills unless a
  helper becomes specific to one direct owning skill.

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

Allowed root scripts are packaging and thin validation wrappers only. They must
not contain generic path policy, generic output policy, boundary policy, helper
registries, or private repo-key lookup. `scripts/validate-boundary.mjs`, if it
continues to exist, delegates to Knitten Core validation and contains no KAS-owned rule
table.

## Required Knitten Services

Knitten must provide one stable interface for payload skills:

```bash
<knitten-root>/bin/knitten-path <command> [args...]
```

The command name is fixed as `knitten-path`. Existing
`bin/knitten-resolve-output` remains only as a compatibility wrapper and must
not become the new payload-facing interface.

Payload skill snippets invoke it through `KNITTEN_PATH_BIN`:

```bash
knitten_path="${KNITTEN_PATH_BIN:?set KNITTEN_PATH_BIN to knitten/bin/knitten-path}"
"$knitten_path" <command> [args...]
```

KAS skills must not hardcode `<knitten-root>`, `../knitten`, installed plugin
paths, or Knitten Core internal script paths. Local shell setup, Codex plugin activation,
or the user environment owns setting `KNITTEN_PATH_BIN`.

Knitten Core owns the bootstrap implementation. Materialized Knitten Core installs must provide a
stable executable at `plugins/knitten/bin/knitten-path`, and Knitten Core doctor must
check that path. Payload execution environments must set `KNITTEN_PATH_BIN` to
that executable before skill snippets run. KAS may keep a thin setup wrapper
only if it locates Knitten Core through plugin metadata or an already configured
environment variable, exports `KNITTEN_PATH_BIN`, and contains no path policy of
its own.

Minimum commands:

| Command | Purpose |
|---------|---------|
| `output` | Resolve generic output paths and create parent directories when requested. |
| `artifact` | Resolve registered local artifact paths. |
| `template` | Resolve core-owned shared templates by id. |
| `repo` | Resolve repository keys from env or local-private config. |
| `plugin-root` | Resolve known plugin roots such as `knitten` and `knitten-all-skills`. |

The command may wrap existing Knitten Core scripts internally, but the payload contract is
the single `knitten-path` surface. KAS skills should not call Knitten Core internal script
paths directly after this migration.

## Repository Locator Contract

`knitten-path repo <repo-key>` resolves arbitrary repo keys by mechanism only.
Knitten Core must not commit private domain key defaults.

Resolution order:

1. `KNITTEN_REPO_<KEY>_ROOT`
2. `KNITTEN_REPO_<KEY>_PATH`
3. A local-private JSON file at
   `${KNITTEN_LOCAL_CONFIG_DIR:-$HOME/.config/knitten}/repo-paths.json`

`<KEY>` is the requested repo key uppercased with non-alphanumeric characters
converted to `_`.

Local-private config shape:

```json
{
  "shotloom": "/absolute/path/to/shotloom",
  "other-key": { "path": "/absolute/path/to/repo" }
}
```

The resolver expands `~`, requires the resolved path to exist, and fails closed
with a clear error when no candidate exists. No KAS script may implement a
second repo-key lookup path.

## Migration Sequence

### 1. Freeze The Final Boundary

Files:

- `knitten/docs/specs/kas-brainless-skill-payload.md`
- `knitten/docs/guidelines/plugin-boundary.md`
- `knitten-all-skills/README.md`
- `knitten/scripts/validate-payload-boundary.mjs`
- `knitten-all-skills/scripts/validate-boundary.mjs`

Changes:

- Record that KAS final state has no `kas-support`.
- Update KAS README to say the payload stores skills only.
- Add core-owned validator checks that can run in warn mode during migration and
  hard-fail after `kas-support` is removed.
- Replace KAS validator logic with a thin wrapper around the Knitten Core validator or
  delete it if Knitten Core can validate KAS directly in doctor.

Risk:

- A strict boundary written before Knitten Core has replacement services can block useful
  intermediate work.

Proof:

- `knitten/scripts/validate-payload-boundary.mjs --payload <kas-root> --warn-only`
  reports every remaining non-skill support surface.

### 2. Add Knitten Path Command

Files:

- `knitten/bin/knitten-path`
- `knitten/scripts/resolve-output.mjs`
- `knitten/scripts/resolve-artifact.mjs`
- `knitten/scripts/resolve-template.mjs`
- `knitten/scripts/resolve-repo.mjs`
- `knitten/scripts/resolve-plugin-root.mjs`
- `knitten/scripts/setup-payload-env`
- `knitten/scripts/validate-payload-boundary.mjs`
- `knitten/scripts/doctor.mjs`

Changes:

- Add the core-owned command surface for all path questions.
- Keep existing `bin/knitten-resolve-output` as a compatibility wrapper around
  `knitten-path output`.
- Add repository lookup as a generic mechanism that reads environment variables
  and local-private config; do not commit private repo mappings.
- Add template lookup for shared Knitten Core templates.
- Add payload boundary validation as a core-owned script, with KAS as an input
  path rather than as a policy owner.
- Add or document core-owned payload environment setup that exports
  `KNITTEN_PATH_BIN` for materialized plugin sessions.

Risk:

- Combining too much behavior into one CLI can create vague errors.

Proof:

- `bin/knitten-path output --kind=review-json --name=smoke --create`
- `bin/knitten-path repo shotloom` with env/config set.
- `bin/knitten-path template review-code`
- `KNITTEN_PATH_BIN=<installed-knitten>/bin/knitten-path sh -c 'test -x "$KNITTEN_PATH_BIN"'`
- `scripts/validate-payload-boundary.mjs --payload <kas-root> --warn-only`
- `node scripts/doctor.mjs`

### 3. Move Shared Templates To Knitten

Files:

- `knitten/document-templates/**`
- `knitten/scripts/resolve-template.mjs`
- `knitten-all-skills/skills/kas-support/document-templates/**`
- Active KAS skills that reference shared templates.

Changes:

- Move shared templates from KAS to Knitten Core.
- Give each shared template a stable id.
- Rewrite KAS skills to ask Knitten Core for template paths by id.
- Move single-skill templates under the owning skill instead of Knitten Core.

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

- Move current boundary specs and reusable policy docs to Knitten Core.
- Move skill-specific docs into `skills/<skill>/references/`.
- Move only current Knitten Core/KAS boundary contracts to Knitten Core specs.
- Delete stale historical planning docs after the inventory records `deleted`
  as their disposition.
- Do not keep a KAS docs archive inside the payload.

Risk:

- Deleting historical docs can remove useful migration context if no
  replacement note exists.

Proof:

- KAS has no `skills/kas-support/docs`.
- KAS has no `skills/kas-support/agent/standards`.
- Active KAS skills contain no `skills/kas-support/docs` or
  `skills/kas-support/agent/standards` refs.
- The migration inventory records each removed support doc as `moved-to-core-spec`
  or `deleted`.

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

- Replace direct calls to KAS generic helpers with `KNITTEN_PATH_BIN`.
- Remove helper bin activation from KAS unless it is replaced by a core-owned
  activation command.
- Do not keep compatibility wrappers in KAS after consumers are migrated.
- Remove legacy path text from active skill instructions, examples, shell
  snippets, and executable helpers. Do not rewrite it to a new KAS-local
  support path; replace it with `KNITTEN_PATH_BIN` or delete the stale step.

Risk:

- Skills with shell snippets may silently keep old helper paths in examples.

Proof:

- `sh -c 'rg -n "kas-support|resolve-output|resolve-local-artifact-path|resolve-repo-path|resolve-helper-path|activate-local-bin" "$1"/skills --glob "SKILL.md" --glob "*.sh" --glob "*.mjs" --glob "*.py"; test $? -eq 1' sh <kas-root>`
  has no active-file hits.
- `sh -c 'rg -n "KNITTEN_PATH_BIN" "$1"/skills --glob "SKILL.md" --glob "*.sh" --glob "*.mjs" --glob "*.py" || true' sh <kas-root>`
  inventories active generic path calls that use the payload-facing command
  contract where such calls remain.
- `sh -c 'rg -n "KNITTEN_ROOT|\\.claude|agent/lib|agent/config|document-templates|agent/standards|\\.\\.\\/knitten|plugins/knitten|bin/knitten-resolve-output|scripts/resolve-[a-z-]+\\.mjs" "$1"/skills --glob "SKILL.md" --glob "*.sh" --glob "*.mjs" --glob "*.py"; test $? -eq 1' sh <kas-root>`
  passes for active skill instructions and executable files.
- KAS doctor passes.

### 6. Move Skill-Owned Helpers To Owning Skills

Files:

- `knitten-all-skills/skills/kas-support/agent/lib/shotloom-*.mjs`
- `knitten-all-skills/skills/kas-support/agent/lib/github-pr-*.mjs`
- Shotloom and PR-review skills that use those helpers.

Changes:

- Move Shotloom-only helpers under the owning Shotloom skill, or under a
  `skills/shotloom-references/` when multiple Shotloom skills need them.
- Move GitHub PR helpers under the skill that owns PR response/review behavior,
  or replace them with Knitten Core generic GitHub support only if they are domain-neutral.
- Update imports and shell snippets.

Risk:

- A helper used by several skills can become duplicated or hidden in the wrong
  skill.

Proof:

- `sh -c 'rg -n "skills/kas-support/agent/lib" "$1"/skills --glob "SKILL.md" --glob "*.sh" --glob "*.mjs" --glob "*.py"; test $? -eq 1' sh <kas-root>`
  returns no active references.
- Shotloom skill smoke tests pass.

### 7. Delete `skills/kas-support`

Files:

- `knitten-all-skills/skills/kas-support/**`
- `knitten-all-skills/scripts/validate-boundary.mjs`
- `knitten-all-skills/scripts/doctor.mjs`
- `knitten/scripts/validate-payload-boundary.mjs`

Changes:

- Delete `skills/kas-support`.
- Promote Knitten Core validator checks from warn to fail for:
  - `skills/kas-support`
  - generic resolver/helper filenames
  - shared template directories
  - broad docs/standards directories
- Delete the KAS validator wrapper or keep it as a one-command call into Knitten Core.
- Keep only plugin packaging and thin check scripts at root.

Risk:

- Hidden runtime references can remain in non-SKILL scripts.

Proof:

- `test ! -e skills/kas-support`
- `knitten/scripts/validate-payload-boundary.mjs --payload <kas-root>`
- `node scripts/doctor.mjs`

### 8. Materialize And Smoke Both Plugins

Files:

- `knitten/scripts/materialize-local-plugin.mjs`
- `knitten-all-skills/scripts/materialize-local-plugin.mjs`
- Installed plugin copies under the local marketplace.

Changes:

- Refresh local plugin copies.
- Confirm new sessions can see Knitten Core and KAS.
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
- `node <knitten-root>/scripts/validate-payload-boundary.mjs --payload <kas-root>`
- `test ! -e <kas-root>/skills/kas-support`
- `rg -n "KNITTEN_PATH_BIN" <kas-root>/skills --glob "SKILL.md" --glob "*.sh" --glob "*.mjs" --glob "*.py" || true`
- `sh -c 'rg -n "KNITTEN_ROOT|\\.claude|skills/kas-support|agent/lib|agent/config|document-templates|agent/standards|\\.\\.\\/knitten|plugins/knitten|scripts/resolve-[a-z-]+\\.mjs|bin/knitten-resolve-output|\\bknitten-path\\b" "$1"/skills --glob "SKILL.md" --glob "*.sh" --glob "*.mjs" --glob "*.py"; test $? -eq 1' sh <kas-root>`
- `rg -n "Legacy evidence:" <kas-root>/skills --glob 'references/**' || true`
- `sh -c 'out=$(rg -n "KNITTEN_ROOT|\\.claude|skills/kas-support|agent/lib|agent/config|document-templates|agent/standards|\\.\\.\\/knitten|plugins/knitten|scripts/resolve-[a-z-]+\\.mjs|bin/knitten-resolve-output|\\bknitten-path\\b" "$1"/skills --glob "references/**"); rc=$?; test "$rc" -eq 1 && exit 0; test "$rc" -ne 0 && exit "$rc"; printf "%s\n" "$out" | awk "!/Legacy evidence:/ { print; bad=1 } END { exit bad ? 1 : 0 }"' sh <kas-root>`
- `KNITTEN_PATH_BIN=<installed-knitten>/bin/knitten-path sh -c 'test -x "$KNITTEN_PATH_BIN"'`

The `KNITTEN_PATH_BIN` `rg` inventories allowed payload-facing calls where
active generic path calls remain. The Knitten Core payload validator must enforce that
any active generic path call uses `KNITTEN_PATH_BIN` rather than a direct Knitten Core or
KAS path. The deny-list `rg` for active files must return no hits. Active files
are `SKILL.md`, `*.sh`, `*.mjs`, and `*.py`. Historical mentions are allowed
only under `skills/**/references/**` when the same line is explicitly labeled
with `Legacy evidence:`.

## Acceptance Criteria

- KAS has no `skills/kas-support`.
- KAS has no generic path/output/helper runtime.
- KAS has no shared template directory.
- KAS has no broad docs or standards directory.
- KAS active skills resolve every generic path through Knitten Core.
- KAS active skill instructions and executable files contain no legacy path
  forms for current behavior.
- Knitten Core exposes a stable path service for output, artifact, template, repo, and
  plugin-root questions.
- The Knitten Core path command name is `knitten-path`.
- Materialized plugin sessions provide executable `KNITTEN_PATH_BIN` before KAS
  skill snippets run.
- Private repo mappings are local config/env data, not committed KAS logic.
- Knitten Core payload validator fails if `kas-support` or generic path helpers return.
- KAS validation wrappers contain no boundary rule table; they delegate to Knitten Core
  or are removed.
- Knitten Core and KAS doctors pass in source and materialized plugin copies.

## Open Questions

- None.

## Design Plan

### Inputs

- This spec.
- `docs/specs/knitten-all-skills-payload-boundary-migration.md`.
- Current KAS `skills/kas-support` inventory.
- Current Knitten Core path/output runtime.

### Outputs

- Knitten Core path service implementation.
- KAS consumer rewrites.
- Deleted KAS support tree.
- core-owned payload boundary validator.
- Validation evidence for source and installed plugin copies.

### Implementation Sequence

#### 1. Audit Current `kas-support` Consumers

Files:

- `knitten-all-skills/skills/**`
- `knitten-all-skills/scripts/**`

Changes:

- Produce an inventory of every `kas-support` reference.
- Classify each as Knitten Core path service, Knitten Core template, skill-owned helper,
  skill-owned reference, stale doc, or delete.

Risk:

- Bulk text replacement can break references that should instead be deleted.

Proof:

- Inventory table or local report with owner/action for every active hit.

#### 2. Build Knitten Core Replacement Surface

Files:

- `knitten/bin/knitten-path`
- `knitten/scripts/*.mjs`
- `knitten/scripts/doctor.mjs`
- core-owned payload environment setup.

Changes:

- Add missing Knitten Core path service commands.
- Keep existing output behavior compatible.
- Add tests or doctor checks for every command consumed by KAS.
- Add bootstrap that makes `KNITTEN_PATH_BIN` available in materialized payload
  skill sessions.

Risk:

- Knitten Core can accidentally absorb private domain policy instead of only mechanism.

Proof:

- Knitten Core doctor, command smoke tests, and `KNITTEN_PATH_BIN` bootstrap smoke pass.

#### 3. Rewrite Active KAS Skills

Files:

- KAS skills listed by the audit.

Changes:

- Replace `kas-support` generic helper calls with `KNITTEN_PATH_BIN`.
- Move skill-owned helpers under their owning skill.
- Delete stale support docs instead of updating them.
- Remove all legacy path forms from active skill instructions and executable
  files.

Risk:

- Active skill snippets can remain stale in references or shell scripts.

Proof:

- KAS skill smoke tests and `rg` checks pass.

#### 4. Delete Support Tree And Tighten Validator

Files:

- `knitten-all-skills/skills/kas-support/**`
- `knitten-all-skills/scripts/validate-boundary.mjs`
- `knitten-all-skills/scripts/doctor.mjs`
- `knitten/scripts/validate-payload-boundary.mjs`

Changes:

- Delete `skills/kas-support`.
- Fail core-owned validation if broad support surfaces return.
- Remove KAS-local boundary policy logic.

Risk:

- Installed plugin copy can still contain deleted files until materialized.

Proof:

- Source and materialized KAS doctors pass.

### Review Plan

- Contract: KAS stores skill payload only; Knitten Core answers generic path questions.
- Boundary: no `kas-support`, no KAS generic resolver/helper/template/doc
  ownership.
- Validation: both plugin doctors, Knitten Core payload boundary validator, targeted
  skill smoke checks, and source/materialized copy checks.
