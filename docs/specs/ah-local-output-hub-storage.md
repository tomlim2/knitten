# Shared Workflow Local Output Hub Storage

## Status

Implemented, with historical `AH` file naming retained for link stability.
Current active terminology is `shared workflow`, and current local output paths
use `.agent-local/workflow`. Do not introduce new `ah-*` skill names or
`.agent-local/ah` paths from this historical file name.

## Goal

Define the local-output hub behavior of Knitten shared workflow core.

Knitten owns shared workflow path/output resolution. Shared temporary files and
operational records should therefore resolve to the current Knitten plugin root's
local workflow storage, not scatter across every active or target workspace.

This spec supersedes the local-output ownership parts of
[AH Output Location Plugin Boundary](ah-output-location-plugin-boundary.md).
That earlier spec remains useful as migration context, but its
workspace-owned/target-owned local output rules are no longer the intended
future behavior.

## Problem

The current resolver treats the active workspace as the default local output
owner:

```text
<workspace>/.agent-local/workflow/...
```

Previous designs considered using `targetRoot` as the operational finding owner:

```text
<targetRoot>/.agent-local/workflow/operational-findings/YYYY-MM-DD/<slug>.json
```

That kept files near the repository being worked on, but it made the generic
shared workflow operational layer harder to inspect. Current policy stores all finding
records in the Knitten hub and keeps `targetRoot` as metadata only:

- shared workflow review plans, response plans, task JSON, and findings scatter across
  unrelated repositories.
- A domain plugin can look like it owns workflow storage even though Knitten owns
  shared workflow path/output resolution.
- Follow-up triage requires checking multiple `.agent-local/workflow` trees.
- The distinction between "where the record is stored" and "what the record is
  about" is not explicit enough.

## Boundary

In scope:

- shared workflow local outputs resolved by `scripts/resolve-output.mjs`.
- Operational finding storage for `report-finding`.
- Resolver metadata that records the active and target repositories even when
  storage is centralized.
- Doctor checks and docs that prove local outputs no longer scatter by default.
- Marking older location specs as superseded where they describe
  workspace-owned shared workflow local outputs.

Out of scope:

- Durable workspace documents such as specs and design plans.
- Domain-specific domain plugin caches, such as Shotloom PR watcher state.
- Writing shared workflow output files into domain plugin workspaces.
- Generic local-output content schemas beyond target metadata.
- Migrating every existing old local artifact.
- Adding a broad output contract system beyond generic path/output resolution.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `--workspace-root=<path>` | No | Repository where the user is actively working. Defaults to cwd. |
| `--target-root=<path>` | No | Repository, plugin, or domain surface that the output is about. Defaults to `workspaceRoot`; does not change finding storage owner. |
| `--kind=<kind>` | No | Generic output kind. |
| `--skill=<skill>` | No | Skill alias mapped to a generic output kind. |
| `--name=<name>` | Yes for file outputs | Stable slug source. |
| `--create` | No | Create selected parent directories. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Durable specs/design plans | durable | Continue to resolve under `targetRoot/docs/...`. |
| shared workflow local files | local | Resolve under the current Knitten plugin root's `.agent-local/workflow/...`. |
| Operational findings | local | Resolve under the current Knitten plugin root's `.agent-local/workflow/operational-findings/YYYY-MM-DD/...`. |
| Target metadata | local JSON metadata | Resolver output records what repository the file is about. |

## Contract

- Domain plugin copies and workspaces are never shared workflow output write targets.
- The current Knitten plugin root is the shared workflow local storage hub.
- `workspaceRoot` means where the user is working.
- `targetRoot` means what repository, plugin, or domain surface the output is
  about.
- `hubRoot` means the current Knitten plugin root that owns local workflow storage.
- Generic local outputs use `hubRoot/.agent-local/workflow/...`.
- `hubRoot/.agent-local/**` is gitignored and never committed.
- Durable `spec` and `design-plan` outputs continue to use `targetRoot/docs/...`.
- Domain-specific caches remain domain-local unless they are explicitly
  converted into shared workflow outputs.
- Resolver JSON must make storage owner and semantic target separate.

## Proposed Resolver Fields

| Field | Meaning |
|-------|---------|
| `pluginRoot` | Physical Knitten runtime root used by the command. May be installed or source. |
| `hubRoot` | Current Knitten plugin root used for writable local workflow storage. |
| `workspaceRoot` | Active workspace. |
| `targetRoot` | Repository or plugin the output is about. |
| `hubLocalRoot` | `hubRoot/.agent-local/workflow`. |
| `workspaceLocalRoot` | Optional metadata: `workspaceRoot/.agent-local/workflow`, not the default write target. |
| `targetLocalRoot` | Optional metadata: `targetRoot/.agent-local/workflow`, not the default write target. |
| `selectedOwnerRoot` | `hubRoot` for local outputs, `targetRoot` for durable docs. |
| `selectedTargetRoot` | `targetRoot` for semantic attribution. |
| `selectedPath` | Concrete output path. |
| `selectedDir` | Parent directory for `selectedPath`. |
| `selectedPersistence` | `durable` or `local`. |

## Output Kinds

### Durable Documents

Durable documents stay with the repository that owns the work:

| Kind | Path |
|------|------|
| `spec` | `<targetRoot>/docs/specs/<slug>.md` |
| `design-plan` | `<targetRoot>/docs/design-plans/<slug>.md` |

### Shared Workflow Local Outputs

Generic local outputs move to the hub:

| Kind | Path |
|------|------|
| `temp-json` | `<hubRoot>/.agent-local/workflow/json/<slug>.json` |
| `review-json` | `<hubRoot>/.agent-local/workflow/reviews/<slug>.json` |
| `response-json` | `<hubRoot>/.agent-local/workflow/responses/<slug>.json` |
| `report-md` | `<hubRoot>/.agent-local/workflow/reports/<slug>.md` |
| `report-html` | `<hubRoot>/.agent-local/workflow/reports/<slug>.html` |
| `pull-request-json` | `<hubRoot>/.agent-local/workflow/pull-requests/<slug>.json` |
| `task-json` | `<hubRoot>/.agent-local/workflow/tasks/<slug>.json` |

### Operational Findings

Operational findings also live in the hub:

```text
<hubRoot>/.agent-local/workflow/operational-findings/YYYY-MM-DD/<slug>.json
```

The finding content should include target metadata when useful:

```json
{
  "targetRoot": "/path/to/knitten-all-skills",
  "targetSkill": "shotloom-wrapup-task"
}
```

## Hub Root Resolution

Resolution order:

1. `--hub-root=<path>` when explicitly provided.
2. `KNITTEN_HUB_ROOT` when set.
3. The current Knitten `pluginRoot`.
4. Fail with a clear error if no hub root can be resolved.

The resolver must validate the selected hub root before using it. A valid hub
root has a Knitten plugin manifest. It does not need Git metadata.

## Historical Skill Alias Behavior

These aliases document the migration-era `ah-*` skill names. New shared
workflow skills should use current Knitten skill names and resolver entries.

| Skill | Kind | Owner |
|-------|------|-------|
| `draft-spec` | `spec` | `targetRoot` |
| `ah-add-design-plan` | `design-plan` | `targetRoot` |
| `ah-review-spec` | `review-json` | `hubRoot` |
| `ah-review-implementation` | `review-json` | `hubRoot` |
| `ah-review-pr` | `review-json` | `hubRoot` |
| `ah-respond-pr` | `response-json` | `hubRoot` |
| `report-finding` | `operational-finding-json` | `hubRoot` |

## Migration

No bulk migration is required.

Existing scattered local artifacts may remain where they are until deleted or
manually promoted. New resolver calls should write generic local outputs to the
hub.

For the existing Shotloom wrapup finding, the old domain-owned path was:

```text
knitten-all-skills/.agent-local/workflow/operational-findings/2026-06-02/shotloom-wrapup-task-pr-433-usability-gaps.json
```

the next implementation may move or copy it into:

```text
knitten/.agent-local/workflow/operational-findings/2026-06-02/shotloom-wrapup-task-pr-433-usability-gaps.json
```

and keep `targetRoot` metadata pointing at `knitten-all-skills`.

## Validation

- `node scripts/resolve-output.mjs --kind=review-json --name=test --hub-root=<knitten-root>`
  returns `<knitten-root>/.agent-local/workflow/reviews/test.json`.
- `node scripts/resolve-output.mjs --skill=report-finding --name=test --target-root=<knitten-all-skills> --hub-root=<knitten-root>`
  returns `<knitten-root>/.agent-local/workflow/operational-findings/<today>/test.json`
  and includes `selectedTargetRoot=<knitten-all-skills>`.
- `node scripts/resolve-output.mjs --skill=draft-spec --name=test --target-root=<target> --hub-root=<knitten-root>`
  still returns `<target>/docs/specs/test.md`.
- Running from the installed plugin copy resolves `hubRoot` to the installed
  Knitten plugin root.
- Running from a domain plugin shim does not emit the Knitten source checkout
  path unless the caller explicitly passes it as `--hub-root` or
  `KNITTEN_HUB_ROOT`.
- `node scripts/doctor.mjs` proves source and materialized-copy behavior.
- `.gitignore` excludes `.agent-local/`.
- Plugin validation passes for source and materialized copy.
- `git diff --check` passes.

## Acceptance Criteria

- shared workflow local output paths are centralized under the current Knitten plugin
  root.
- Hub-local files under `.agent-local/**` are ignored by git.
- Durable docs still resolve to the target workspace.
- Domain plugin copies remain free of shared workflow output ownership.
- Materialized Knitten copies do not need source-root metadata for shared workflow output
  resolution.
- Resolver JSON clearly separates `selectedOwnerRoot` from
  `selectedTargetRoot`.
- Operational findings can be triaged from one Knitten-local inbox while still
  recording the plugin, skill, repo, PR, or issue they concern.
- Existing Shotloom domain caches are not accidentally moved into Knitten.

## Decisions

- Use `KNITTEN_HUB_ROOT` as the public override environment variable. The
  default storage hub is the current Knitten plugin root.
- Materialized plugin copies should not include generated source-root metadata
  for hub resolution.
- Do not automatically delete old scattered `.agent-local/workflow` trees. Leave them
  as historical scratch unless a separate cleanup task is requested.

## Design Plan

### Inputs

- Existing resolver: `scripts/resolve-output.mjs`
- Existing doctor: `scripts/doctor.mjs`
- Current location spec:
  `docs/specs/ah-output-location-plugin-boundary.md`
- Runtime spec:
  `docs/specs/plugin-output-runtime.md`
- Installed plugin materialization:
  `scripts/materialize-local-plugin.mjs`
- Existing `.gitignore`

### Outputs

- New resolver field: `hubRoot`.
- New resolver field: `hubLocalRoot`.
- New resolver field: `selectedTargetRoot`.
- Updated local output paths for generic local kinds.
- Updated doctor checks for hub-owned local outputs.
- Updated docs explaining the change from workspace-local to hub-local storage.
- Materialization preserves existing hub-local `.agent-local/` data.
- `.gitignore` contract confirmed or updated for `.agent-local/`.

### Implementation Sequence

#### 1. Add Hub Root Resolution

Files:

- `scripts/resolve-output.mjs`

Changes:

- Parse `--hub-root=<path>`.
- Read `KNITTEN_HUB_ROOT`.
- Use the current Knitten `pluginRoot` as fallback when it has a Knitten
  manifest.
- Return `hubRoot` and `hubLocalRoot`.

Risk:

- Explicit `KNITTEN_HUB_ROOT` could point at a moved plugin root.

Proof:

- Resolver returns hub fields.
- Installed-copy resolver uses the installed Knitten plugin root by default.
- Resolver fails clearly when no valid Knitten plugin root is available.

#### 2. Preserve Hub Local Data During Materialization

Files:

- `scripts/materialize-local-plugin.mjs`
- `scripts/doctor.mjs`

Changes:

- During materialization, copy the plugin without generated source-root
  metadata.
- Preserve `targetDir/.agent-local` so local hub records survive plugin refresh.
- Doctor validates copied resolver calls use the copied Knitten plugin root as
  `hubRoot`.

Risk:

- Explicit `KNITTEN_HUB_ROOT` can become stale if the selected plugin root is
  moved.

Proof:

- `node scripts/materialize-local-plugin.mjs`
- `node scripts/doctor.mjs`
- `node /Users/younsoolim/plugins/knitten/scripts/doctor.mjs`
- A file created under `/Users/younsoolim/plugins/knitten/.agent-local/workflow/`
  still exists after materialization.

#### 3. Move Generic Local Kinds To Hub

Files:

- `scripts/resolve-output.mjs`
- `scripts/doctor.mjs`

Changes:

- Keep `spec` and `design-plan` under `targetRoot`.
- Move local kinds to `hubLocalRoot`.
- Add `selectedTargetRoot`.
- Set `selectedOwnerRoot=hubRoot` for local outputs.

Risk:

- Callers that expected workspace-local review JSON must read resolver output
  instead of assuming relative paths.

Proof:

- Doctor checks exact paths for every kind.
- Existing skill alias calls still return valid JSON.

#### 4. Update Docs And Skill Guidance

Files:

- `docs/specs/plugin-output-runtime.md`
- `docs/specs/ah-output-location-plugin-boundary.md`
- `docs/specs/plugin-path-helper.md`
- shared workflow skill docs that mention local scratch ownership.

Changes:

- Explain that Knitten resolves shared workflow local outputs to the hub.
- Explain that `targetRoot` is semantic attribution, not storage ownership.
- Explain that domain plugin copies do not own shared workflow local outputs.
- Explain that Knitten materialization preserves `.agent-local`.
- Mark older location docs as superseded instead of leaving competing current
  rules.

Risk:

- Updating old docs too broadly can turn this path decision into a full docs
  cleanup. Keep edits to current/superseded status and active path claims.

Proof:

- Search has no active docs claiming shared workflow local outputs default to every
  active workspace.

#### 5. Confirm Gitignore Contract

Files:

- `.gitignore`

Changes:

- Confirm `.agent-local/` is ignored.
- Add the ignore rule if it is missing.

Risk:

- Without this, hub-local workflow files can accidentally enter commits.

Proof:

- `git check-ignore .agent-local/workflow/reviews/example.json`
- `git status --short` does not show generated hub-local files.

#### 6. Migrate Active Finding If Needed

Files:

- Local `.agent-local` only.

Changes:

- Move or copy the active Shotloom wrapup finding into Knitten hub storage.
- Preserve target metadata.
- Do not commit local `.agent-local` files.

Risk:

- Duplicate local scratch files may exist temporarily.

Proof:

- Finding exists under Knitten hub.
- Original target is still visible in JSON.

### Review Plan

- Contract: local workflow outputs are hub-owned; durable docs are target-owned.
- Boundary: no write path points at installed plugin copies.
- Usability: resolver JSON gives enough metadata to know both where the file is
  stored and what it is about.
- Migration: old scattered local files do not block new behavior.
