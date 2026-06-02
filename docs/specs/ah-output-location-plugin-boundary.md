# AH Output Location Plugin Boundary

## Status

Historical.

The local-output ownership rules in this spec are superseded by
[AH Local Output Hub Storage](ah-local-output-hub-storage.md). This document is
kept as migration context for the earlier `.agent-local/knitten` to
`.agent-local/ah` transition.

## Goal

Define where AH workflow outputs go now that Knitten is a Codex plugin.

Knitten is a plugin and runtime provider. It must not become the default
storage repository for every AH workflow artifact. AH outputs belong to the
active or target workspace unless the output is explicitly about the Knitten
plugin itself.

## Problem

Before this change, the output resolver used `.agent-local/knitten` as the
default local artifact namespace:

```text
.agent-local/knitten/json
.agent-local/knitten/reviews
.agent-local/knitten/findings
.agent-local/knitten/reports
.agent-local/knitten/pull-requests
.agent-local/knitten/tasks
```

That made sense while Knitten was still acting like a repository-local system.
It is now misleading because:

- `knitten` is the plugin identity, not the work domain.
- AH workflow artifacts are produced while working in many repositories.
- Plugin source and installed plugin copies should remain runtime assets, not
  scratch storage.
- Findings discovered in a domain workflow may target a payload plugin, a
  skill, or another repository, not Knitten itself.

## Principle

| Surface | Role | Write rule |
|---------|------|------------|
| Knitten plugin root | Runtime code, skills, shims, docs. | Read/write only when the task edits Knitten itself. |
| Installed plugin copy | Generated local plugin bundle. | Read-only during normal workflow use. |
| Active workspace | Repository where the user is working. | Default durable and local output target. |
| Target workspace | Repository or plugin that owns the issue being reported. | Preferred target for operational findings. |
| `.agent-local/ah` | AH local scratch namespace under a workspace. | Default local artifact root. |

## Scope

This spec updates output location policy and resolver paths.

It does not define content schemas beyond minimal path and metadata
requirements. It does not promote local artifacts into durable docs.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `--workspace-root=<path>` | No | Active workspace. Defaults to current working directory. |
| `--target-root=<path>` | No | Workspace that should own the output when different from the active workspace. |
| `--kind=<kind>` | No | Generic output kind. |
| `--skill=<skill>` | No | Skill alias mapped to a generic output kind. |
| `--name=<name>` | Yes for file outputs | Stable slug source. |
| `--create` | No | Create selected parent directories. |

`--target-root` is primarily for operational findings. If omitted, it defaults
to `--workspace-root`.

## Output Roots

### Durable Documents

Durable documents remain under the selected workspace's documented convention.
When no stronger convention exists, the resolver fallback is:

| Kind | Path |
|------|------|
| `spec` | `docs/specs/<slug>.md` |
| `design-plan` | `docs/design-plans/<slug>.md` |

These are durable because they are meant to be reviewed, committed, and reused
inside the workspace that owns the work.

### Local AH Artifacts

Local artifacts move from `.agent-local/knitten` to `.agent-local/ah`:

| Kind | Path |
|------|------|
| `temp-json` | `.agent-local/ah/json/<slug>.json` |
| `review-json` | `.agent-local/ah/reviews/<slug>.json` |
| `response-json` | `.agent-local/ah/responses/<slug>.json` |
| `report-md` | `.agent-local/ah/reports/<slug>.md` |
| `report-html` | `.agent-local/ah/reports/<slug>.html` |
| `pull-request-json` | `.agent-local/ah/pull-requests/<slug>.json` |
| `task-json` | `.agent-local/ah/tasks/<slug>.json` |

### Operational Findings

Operational findings get a dedicated local root:

```text
.agent-local/ah/operational-findings/<YYYY-MM-DD>/<slug>.json
```

They should be written under `targetRoot`, not automatically under the Knitten
plugin workspace. If the finding is about a payload skill, `targetRoot` should
be that payload plugin source repository.

Example:

```text
/Users/younsoolim/Desktop/www/knitten-all-skills/.agent-local/ah/operational-findings/2026-06-02/shotloom-wrapup-task-pr-433-usability-gaps.json
```

## Resolver JSON

The resolver should return at least:

| Field | Meaning |
|-------|---------|
| `pluginRoot` | Physical Knitten plugin checkout containing the runtime. |
| `workspaceRoot` | Active workspace root. |
| `targetRoot` | Output owner root. Defaults to `workspaceRoot`. |
| `workspaceLocalRoot` | `.agent-local/ah` under `workspaceRoot`. |
| `targetLocalRoot` | `.agent-local/ah` under `targetRoot`. |
| `docsRoot` | `docs` under `targetRoot` for durable outputs. |
| `selectedKind` | Resolved kind. |
| `selectedPath` | Concrete selected file path. |
| `selectedDir` | Parent directory for `selectedPath`. |
| `selectedPersistence` | `durable` or `local`. |
| `selectedOwnerRoot` | Root used for the selected output. |
| `isPluginWorkspace` | Whether `workspaceRoot` is the Knitten plugin root. |

For durable outputs, `selectedOwnerRoot` is `targetRoot`.
For local non-finding outputs, `selectedOwnerRoot` is `workspaceRoot`.
For operational findings, `selectedOwnerRoot` is `targetRoot`.

## Skill Alias Updates

| Skill | Kind |
|-------|------|
| `ah-draft-spec` | `spec` |
| `ah-add-design-plan` | `design-plan` |
| `ah-review-spec` | `review-json` |
| `ah-review-implementation` | `review-json` |
| `ah-review-pr` | `review-json` |
| `ah-respond-pr` | `response-json` |
| `ah-report-finding` | `operational-finding-json` |

## Skill Text Updates

Update AH skill docs so they say:

- Plugin resources are read-only unless the task edits the plugin.
- Active workspace owns normal local scratch.
- Target workspace owns operational findings.
- Installed plugin copies are never write targets.
- Use `--target-root` when the issue belongs to a different repository than the
  current working directory.

## Migration

No bulk migration is required.

For currently existing local artifacts:

- `.agent-local/knitten/**` may remain as old scratch until deleted.
- New resolver calls use `.agent-local/ah/**`.
- If a current finding should survive, move it manually to the target
  workspace's `.agent-local/ah/operational-findings/<date>/`.

The PR 433 wrapup finding should move from:

```text
knitten/.agent-local/knitten/findings/shotloom-wrapup-task-pr-433-usability-gaps.json
```

to:

```text
knitten-all-skills/.agent-local/ah/operational-findings/2026-06-02/shotloom-wrapup-task-pr-433-usability-gaps.json
```

because the finding targets `shotloom-wrapup-task` in the payload plugin.

## Validation

- `node scripts/resolve-output.mjs --skill=ah-report-finding --name=test --create`
  returns `.agent-local/ah/operational-findings/<today>/test.json`.
- `node scripts/resolve-output.mjs --skill=ah-review-pr --name=pr-1-review --create`
  returns `.agent-local/ah/reviews/pr-1-review.json`.
- `node scripts/resolve-output.mjs --skill=ah-respond-pr --name=pr-1-response --create`
  returns `.agent-local/ah/responses/pr-1-response.json`.
- `node scripts/resolve-output.mjs --skill=ah-draft-spec --name=test`
  returns `docs/specs/test.md`.
- `--target-root=<path>` changes operational finding owner root without changing
  `pluginRoot`.
- `node scripts/doctor.mjs` passes.
- Plugin validation passes for source and materialized copy.

## Acceptance Criteria

- New local AH artifacts no longer default to `.agent-local/knitten`.
- `ah-report-finding` has a target-root-aware operational findings path.
- Existing AH skill docs no longer imply Knitten is the storage owner for all
  workflow outputs.
- Installed plugin copies remain generated runtime bundles, not output
  destinations.

## Design Plan

### Inputs

- Current resolver: `scripts/resolve-output.mjs`
- Current doctor checks: `scripts/doctor.mjs`
- AH skill docs under `skills/`
- Runtime specs under `docs/specs/`
- Existing local finding:
  `knitten/.agent-local/knitten/findings/shotloom-wrapup-task-pr-433-usability-gaps.json`

### Outputs

- Updated resolver paths and JSON fields.
- Updated doctor checks.
- Updated AH skill path guidance.
- Updated docs that still described old plugin copy or `.agent-local/knitten`
  locations as current behavior.
- Moved PR 433 finding record to the target workspace:
  `knitten-all-skills/.agent-local/ah/operational-findings/2026-06-02/shotloom-wrapup-task-pr-433-usability-gaps.json`.
- Source and materialized plugin validation evidence.

### Implementation Sequence

#### 1. Update Resolver Contract

Files:

- `scripts/resolve-output.mjs`
- `bin/knitten-resolve-output` only if the shim text or behavior needs updates.

Changes:

- Add `--target-root=<path>`.
- Rename local root behavior from `.agent-local/knitten` to `.agent-local/ah`.
- Return `targetRoot`, `targetLocalRoot`, and `selectedOwnerRoot`.
- Add `response-json`.
- Replace `finding-json` for `ah-report-finding` with
  `operational-finding-json`.
- Resolve operational findings under
  `.agent-local/ah/operational-findings/<YYYY-MM-DD>/<slug>.json`.
- Keep durable `spec` and `design-plan` under `targetRoot/docs/...`.

Risk:

- Existing callers that expect `finding-json` should fail and move to
  `operational-finding-json`.

#### 2. Update Doctor

File:

- `scripts/doctor.mjs`

Changes:

- Update expected local paths to `.agent-local/ah`.
- Add checks for `response-json`.
- Add checks for `operational-finding-json`.
- Add a `--target-root` check that proves operational findings are owned by the
  target root while `pluginRoot` stays unchanged.
- Update copied shim check to use the new local path.

#### 3. Update AH Skill Docs

Files:

- `skills/ah-report-finding/SKILL.md`
- `skills/ah-respond-pr/SKILL.md`
- `skills/ah-review-pr/SKILL.md`
- `skills/ah-review-implementation/SKILL.md`
- `skills/ah-manage-milestone/SKILL.md`
- any other `skills/ah-*` file that mentions resolver behavior.

Changes:

- Say local scratch is `.agent-local/ah` in the active workspace.
- Say operational findings belong to the target workspace.
- Add `--target-root` guidance to `ah-report-finding`.
- Keep plugin install copies read-only.

#### 4. Update Runtime Docs

Files:

- `README.md`
- `docs/specs/plugin-output-runtime.md`
- `docs/specs/plugin-path-helper.md`
- `docs/specs/doctor-status-skill.md`
- `docs/specs/plugin-native-core-reboot.md`
- `docs/specs/ah-payload-plugin-minimal-adoption.md`

Changes:

- Replace current behavior references to the old personal plugin copy path with
  `~/plugins/knitten`.
- Mark `plugin-path-helper.md` as historical/superseded and avoid presenting
  `.agent-local/knitten` as current behavior.
- Update `plugin-output-runtime.md` to point at the new boundary spec or patch
  it to the new paths.

#### 5. Move Current Finding

Move:

```text
knitten/.agent-local/knitten/findings/shotloom-wrapup-task-pr-433-usability-gaps.json
```

to:

```text
knitten-all-skills/.agent-local/ah/operational-findings/2026-06-02/shotloom-wrapup-task-pr-433-usability-gaps.json
```

Do not commit `.agent-local` files unless a separate durable finding promotion
step is requested.

#### 6. Materialize And Validate

Run:

```bash
python3 /Users/younsoolim/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py .
node --check scripts/resolve-output.mjs
node scripts/doctor.mjs
node scripts/materialize-local-plugin.mjs
python3 /Users/younsoolim/.codex/skills/.system/plugin-creator/scripts/validate_plugin.py /Users/younsoolim/plugins/knitten
node /Users/younsoolim/plugins/knitten/scripts/doctor.mjs
git diff --check
```

Also run the matching `knitten-all-skills` doctor after moving the local finding
record if that repository is touched.

### Review Plan

Review from three angles:

- Plugin boundary: no user artifact is written into an installed plugin copy.
- AH semantics: output paths describe AH workflow artifacts, not Knitten-owned
  plugin artifacts.
- Backward compatibility: old scratch may remain, but new resolver calls do not
  produce `.agent-local/knitten` paths.
