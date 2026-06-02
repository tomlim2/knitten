# AH Local Output Hub Storage

## Status

Draft.

## Goal

Define Knitten as the storage hub for generic AH local outputs.

Knitten owns the generic output/path system. Generic AH temporary files and
operational records should therefore be written under the Knitten source
checkout's local AH storage, not scattered across every active or target
workspace.

This spec supersedes the local-output ownership parts of
[AH Output Location Plugin Boundary](ah-output-location-plugin-boundary.md).
That earlier spec remains useful as migration context, but its
workspace-owned/target-owned local output rules are no longer the intended
future behavior.

## Problem

The current resolver treats the active workspace as the default local output
owner:

```text
<workspace>/.agent-local/ah/...
```

Operational findings use `targetRoot` as their owner:

```text
<targetRoot>/.agent-local/ah/operational-findings/YYYY-MM-DD/<slug>.json
```

That keeps files near the repository being worked on, but it makes the generic
AH operational layer harder to inspect:

- AH review plans, response plans, task JSON, and findings scatter across
  unrelated repositories.
- A payload plugin can look like it owns AH storage even though Knitten owns the
  path/output system.
- Follow-up triage requires checking multiple `.agent-local/ah` trees.
- The distinction between "where the record is stored" and "what the record is
  about" is not explicit enough.

## Boundary

In scope:

- Generic AH local outputs resolved by `scripts/resolve-output.mjs`.
- Operational finding storage for `ah-report-finding`.
- Resolver metadata that records the active and target repositories even when
  storage is centralized.
- Doctor checks and docs that prove local outputs no longer scatter by default.
- Marking older location specs as superseded where they describe
  workspace-owned generic AH local outputs.

Out of scope:

- Durable workspace documents such as specs and design plans.
- Domain-specific payload plugin caches, such as Shotloom PR watcher state.
- Writing AH output files into installed plugin copies under `~/plugins/knitten`.
- Generic local-output content schemas beyond target metadata.
- Migrating every existing old local artifact.
- Adding a broad output contract system beyond generic path resolution.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `--workspace-root=<path>` | No | Repository where the user is actively working. Defaults to cwd. |
| `--target-root=<path>` | No | Repository, plugin, or domain surface that the output is about. Defaults to `workspaceRoot`. |
| `--kind=<kind>` | No | Generic output kind. |
| `--skill=<skill>` | No | Skill alias mapped to a generic output kind. |
| `--name=<name>` | Yes for file outputs | Stable slug source. |
| `--create` | No | Create selected parent directories. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Durable specs/design plans | durable | Continue to resolve under `targetRoot/docs/...`. |
| Generic AH local files | local | Resolve under the Knitten source checkout's `.agent-local/ah/...`. |
| Operational findings | local | Resolve under the Knitten source checkout's `.agent-local/ah/operational-findings/YYYY-MM-DD/...`. |
| Target metadata | local JSON metadata | Resolver output records what repository the file is about. |

## Contract

- Installed plugin copies are never AH output write targets.
- The Knitten source checkout is the AH local storage hub.
- `workspaceRoot` means where the user is working.
- `targetRoot` means what repository, plugin, or domain surface the output is
  about.
- `hubRoot` means the Knitten source checkout that owns local AH storage.
- Generic local outputs use `hubRoot/.agent-local/ah/...`.
- `hubRoot/.agent-local/**` is gitignored and never committed.
- Durable `spec` and `design-plan` outputs continue to use `targetRoot/docs/...`.
- Domain-specific payload caches remain domain-local unless they are explicitly
  converted into generic AH outputs.
- Resolver JSON must make storage owner and semantic target separate.

## Proposed Resolver Fields

| Field | Meaning |
|-------|---------|
| `pluginRoot` | Physical Knitten runtime root used by the command. May be installed or source. |
| `hubRoot` | Knitten source checkout used for writable local AH storage. |
| `workspaceRoot` | Active workspace. |
| `targetRoot` | Repository or plugin the output is about. |
| `hubLocalRoot` | `hubRoot/.agent-local/ah`. |
| `workspaceLocalRoot` | Optional metadata: `workspaceRoot/.agent-local/ah`, not the default write target. |
| `targetLocalRoot` | Optional metadata: `targetRoot/.agent-local/ah`, not the default write target. |
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

### Generic AH Local Outputs

Generic local outputs move to the hub:

| Kind | Path |
|------|------|
| `temp-json` | `<hubRoot>/.agent-local/ah/json/<slug>.json` |
| `review-json` | `<hubRoot>/.agent-local/ah/reviews/<slug>.json` |
| `response-json` | `<hubRoot>/.agent-local/ah/responses/<slug>.json` |
| `report-md` | `<hubRoot>/.agent-local/ah/reports/<slug>.md` |
| `report-html` | `<hubRoot>/.agent-local/ah/reports/<slug>.html` |
| `pull-request-json` | `<hubRoot>/.agent-local/ah/pull-requests/<slug>.json` |
| `task-json` | `<hubRoot>/.agent-local/ah/tasks/<slug>.json` |

### Operational Findings

Operational findings also live in the hub:

```text
<hubRoot>/.agent-local/ah/operational-findings/YYYY-MM-DD/<slug>.json
```

The finding content should include target metadata when useful:

```json
{
  "targetRoot": "/path/to/knitten-all-skills",
  "targetSkill": "shotloom-wrapup-task"
}
```

## Hub Root Resolution

The resolver must not write into an installed plugin copy.

Resolution order:

1. `--hub-root=<path>` when explicitly provided.
2. `KNITTEN_HUB_ROOT` when set.
3. Materialized-copy metadata written by `scripts/materialize-local-plugin.mjs`,
   containing the source checkout path used for installation.
4. If `pluginRoot` is itself a source checkout, use `pluginRoot`.
5. Fail with a clear error if no hub root can be resolved.

The resolver must validate the selected hub root before using it. A valid hub
root has Knitten source files and is not an installed plugin copy. The practical
source-checkout signal is the presence of Git metadata plus Knitten plugin
files.

Materialized metadata is generated install-time data, not an AH output. It may
live inside the installed plugin copy, but it points AH output writes back to the
source checkout. The installed copy itself remains read-only during normal
output resolution.

## Skill Alias Behavior

| Skill | Kind | Owner |
|-------|------|-------|
| `ah-draft-spec` | `spec` | `targetRoot` |
| `ah-add-design-plan` | `design-plan` | `targetRoot` |
| `ah-review-spec` | `review-json` | `hubRoot` |
| `ah-review-implementation` | `review-json` | `hubRoot` |
| `ah-review-pr` | `review-json` | `hubRoot` |
| `ah-respond-pr` | `response-json` | `hubRoot` |
| `ah-report-finding` | `operational-finding-json` | `hubRoot` |

## Migration

No bulk migration is required.

Existing scattered local artifacts may remain where they are until deleted or
manually promoted. New resolver calls should write generic local outputs to the
hub.

For the existing Shotloom wrapup finding:

```text
knitten-all-skills/.agent-local/ah/operational-findings/2026-06-02/shotloom-wrapup-task-pr-433-usability-gaps.json
```

the next implementation may move or copy it into:

```text
knitten/.agent-local/ah/operational-findings/2026-06-02/shotloom-wrapup-task-pr-433-usability-gaps.json
```

and keep `targetRoot` metadata pointing at `knitten-all-skills`.

## Validation

- `node scripts/resolve-output.mjs --kind=review-json --name=test --hub-root=<knitten-source>`
  returns `<knitten-source>/.agent-local/ah/reviews/test.json`.
- `node scripts/resolve-output.mjs --skill=ah-report-finding --name=test --target-root=<knitten-all-skills> --hub-root=<knitten-source>`
  returns `<knitten-source>/.agent-local/ah/operational-findings/<today>/test.json`
  and includes `selectedTargetRoot=<knitten-all-skills>`.
- `node scripts/resolve-output.mjs --skill=ah-draft-spec --name=test --target-root=<target> --hub-root=<knitten-source>`
  still returns `<target>/docs/specs/test.md`.
- Running from the installed plugin copy resolves `hubRoot` from materialized
  metadata when available.
- Running from the installed plugin copy without `--hub-root`,
  `KNITTEN_HUB_ROOT`, or materialized source metadata fails instead of creating
  local files under `~/plugins/knitten`.
- `node scripts/doctor.mjs` proves source and materialized-copy behavior.
- `.gitignore` excludes `.agent-local/`.
- Plugin validation passes for source and materialized copy.
- `git diff --check` passes.

## Acceptance Criteria

- Generic AH local output paths are centralized under the Knitten source
  checkout.
- Hub-local files under `.agent-local/**` are ignored by git.
- Durable docs still resolve to the target workspace.
- Installed plugin copies remain read-only runtime bundles for AH output
  resolution.
- Installed plugin copies can carry generated source-root metadata, but runtime
  output writes still go to the source checkout.
- Resolver JSON clearly separates `selectedOwnerRoot` from
  `selectedTargetRoot`.
- Operational findings can be triaged from one Knitten-local inbox while still
  recording the plugin, skill, repo, PR, or issue they concern.
- Existing Shotloom domain caches are not accidentally moved into Knitten.

## Decisions

- Use `KNITTEN_HUB_ROOT` as the public environment variable. The storage hub is
  intentionally the Knitten source checkout, not a generic external AH service.
- Materialized plugin copies should include generated source-root metadata so
  installed runtime calls can still find the hub.
- Do not automatically delete old scattered `.agent-local/ah` trees. Leave them
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
- Generated materialized-copy metadata containing the source checkout path.
- `.gitignore` contract confirmed or updated for `.agent-local/`.

### Implementation Sequence

#### 1. Add Hub Root Resolution

Files:

- `scripts/resolve-output.mjs`

Changes:

- Parse `--hub-root=<path>`.
- Read `KNITTEN_HUB_ROOT`.
- Read materialized-copy source-root metadata.
- Use source `pluginRoot` as fallback only when it has Git metadata.
- Return `hubRoot` and `hubLocalRoot`.

Risk:

- Stale materialized metadata could point at a moved source checkout.

Proof:

- Resolver returns hub fields.
- Installed-copy resolver uses materialized metadata when available.
- Installed-copy resolver fails clearly when hub root is unavailable.

#### 2. Write Materialized Hub Metadata

Files:

- `scripts/materialize-local-plugin.mjs`
- `scripts/doctor.mjs`

Changes:

- During materialization, write generated metadata in the copied plugin that
  records the source checkout path.
- Exclude that metadata from source-only expectations if it is generated only in
  the copy.
- Doctor validates copied resolver calls use the source checkout as `hubRoot`.

Risk:

- The metadata path becomes stale if the source checkout is moved.

Proof:

- `node scripts/materialize-local-plugin.mjs`
- `node scripts/doctor.mjs`
- `node /Users/younsoolim/plugins/knitten/scripts/doctor.mjs`

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
- AH skill docs that mention local scratch ownership.

Changes:

- Explain that Knitten is the AH local output hub.
- Explain that `targetRoot` is semantic attribution, not storage ownership.
- Keep installed plugin copies read-only.
- Mark older location docs as superseded instead of leaving competing current
  rules.

Risk:

- Updating old docs too broadly can turn this path decision into a full docs
  cleanup. Keep edits to current/superseded status and active path claims.

Proof:

- Search has no active docs claiming generic AH local outputs default to every
  active workspace.

#### 5. Confirm Gitignore Contract

Files:

- `.gitignore`

Changes:

- Confirm `.agent-local/` is ignored.
- Add the ignore rule if it is missing.

Risk:

- Without this, hub-local AH files can accidentally enter commits.

Proof:

- `git check-ignore .agent-local/ah/reviews/example.json`
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

- Contract: local AH outputs are hub-owned; durable docs are target-owned.
- Boundary: no write path points at installed plugin copies.
- Usability: resolver JSON gives enough metadata to know both where the file is
  stored and what it is about.
- Migration: old scattered local files do not block new behavior.
