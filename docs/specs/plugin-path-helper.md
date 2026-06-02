# Plugin Path Helper

## Status

Superseded by [Plugin Output Runtime](plugin-output-runtime.md) and
[AH Local Output Hub Storage](ah-local-output-hub-storage.md).
Do not use the paths in this document as current runtime behavior.

The names and paths below are historical only. In particular, `finding-json`
is not a current output kind.

## Goal

Add a small path helper for Knitten plugin skills.

The helper should distinguish plugin paths from target workspace paths without
introducing the full output contract system.

## Boundary

This milestone resolves path roots and a small set of default document/scratch
locations.

It does not define templates, validators, report schemas, or artifact lifecycle.

## Contract

`scripts/resolve-paths.mjs` outputs JSON.

Inputs:

- optional `--workspace-root=<path>`
- optional `--skill=<skill>`
- optional `--kind=<kind>`
- optional `--name=<name>`
- current working directory when `--workspace-root` is omitted

Outputs:

- `pluginRoot`: the physical Knitten plugin checkout containing this script
- `workspaceRoot`: the active target repository or workspace
- `workspaceLocalRoot`: `.agent-local/knitten` under the workspace root
- `docsRoot`: `docs` under the workspace root
- `specsRoot`: `docs/specs` under the workspace root
- `designPlansRoot`: `docs/design-plans` under the workspace root
- `tempJsonRoot`: `.agent-local/knitten/json` under the workspace root
- `selectedPath`: a concrete path when `--kind` or `--skill` is supplied
- `selectedSkill`: the skill name supplied by `--skill`
- `isPluginWorkspace`: whether the active workspace is the plugin checkout

Skill defaults:

- `ah-draft-spec`: `spec`
- `ah-add-design-plan`: `design-plan`
- `ah-review-pr`: `review-json`
- `ah-review-implementation`: `review-json`
- `ah-respond-pr`: `temp-json`
- `ah-report-finding`: `finding-json`

Kinds:

- `spec`: `docs/specs/<name>.md`
- `design-plan`: `docs/design-plans/<name>.md`
- `temp-json`: `.agent-local/knitten/json/<name>.json`
- `review-json`: `.agent-local/knitten/reviews/<name>.json`
- `finding-json`: `.agent-local/knitten/findings/<name>.json`

## Rules

- Resolve plugin resources relative to `pluginRoot`.
- Resolve user work relative to `workspaceRoot`.
- Put temporary local work under `workspaceLocalRoot` when a skill needs local
  scratch space.
- Put task specs under `docs/specs` when the workspace has no stronger local
  convention.
- Put temporary JSON under `.agent-local/knitten`.
- Use either `--skill` or `--kind`, not both. Prefer `--skill` inside skill
  instructions so each skill owns its document type.
- Do not use the plugin install path as a user output destination.
- Do not create directories unless `--create` is passed. `--create` creates only
  the selected path's parent directory, not the output file.

## Validation

- `node scripts/resolve-paths.mjs` returns JSON.
- `node scripts/resolve-paths.mjs --create` creates `.agent-local/knitten` in
  the selected workspace.
- `node scripts/resolve-paths.mjs --skill=ah-draft-spec --name=test-task`
  returns `docs/specs/test-task.md`.
- `node scripts/resolve-paths.mjs --kind=spec --name=test-task` returns
  `docs/specs/test-task.md`.
- `node scripts/resolve-paths.mjs --kind=temp-json --name=test-task --create`
  creates `.agent-local/knitten/json`.
- `node scripts/resolve-paths.mjs --workspace-root=<path>` respects the explicit
  workspace root.
- Plugin validation and doctor checks still pass.
