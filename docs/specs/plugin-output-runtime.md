# Plugin Output Runtime

## Status

Implemented. Current local-output hub behavior is extended by
[AH Local Output Hub Storage](ah-local-output-hub-storage.md).

## Goal

Promote Knitten's path resolver into a small plugin-native output runtime.

The runtime should let Knitten and payload plugins resolve predictable output
destinations without copying output rules into every skill. It should be
generic enough for private payload plugins such as `knitten-all-skills`, but
small enough that `knitten` does not become a domain workflow bundle.

## Problem

Payload skills need stable places for generated documents and temporary files:

- specs
- design plans
- review JSON
- response plans
- finding reports
- task scratch files
- PR scratch files

Today, each skill can hard-code paths or carry local path assumptions. That
causes drift:

- plugin install paths can be confused with target workspace paths
- local scratch paths can spread across unrelated directories
- private payload plugins must duplicate the same resolver logic
- skills become harder to read because path policy appears inside each workflow

## Core Principle

`knitten` owns generic output destination resolution.

Payload plugins own domain meaning.

This means `knitten` may know what a `spec`, `design-plan`, `review-json`, or
`temp-json` output is. It should not know what a Shotloom PR cache, CINEV alert
artifact, tutoring note, or any other domain-specific output means.

## Terms

| Term | Meaning |
|------|---------|
| Plugin root | The physical installed or source checkout containing the runtime script. |
| Hub root | The Knitten source checkout that owns generic AH local storage. |
| Workspace root | The active repository or workspace where the user is working. |
| Target root | The repository, plugin, or domain surface the output is about. |
| Local output root | `.agent-local/ah` under the hub root. |
| Durable document | A user-facing document intended to remain in the workspace, usually under `docs/`. |
| Local artifact | A temporary or operational file under `.agent-local/ah`. |
| Output kind | A generic output category such as `spec` or `review-json`. |
| Skill alias | A mapping from a skill name to one generic output kind. |
| Output destination | The resolved file path and its parent directory. |

## Scope

This milestone defines output destination resolution.

It does not write, validate, or manage output content.

## Runtime Behavior

The runtime command prints JSON and exits nonzero on invalid input.

Primary command:

```bash
knitten-resolve-output --kind=<kind> --name=<name> --workspace-root=<path> --target-root=<path> --create
```

Implementation command:

```bash
node <knitten-plugin-root>/scripts/resolve-output.mjs --kind=<kind> --name=<name> --workspace-root=<path> --target-root=<path> --create
```

Knitten implementation, tests, and diagnostics may call either command.
Payload skills call their payload-local helper.

## Runtime Discovery

Payload plugins need one stable way to find the Knitten runtime and one stable
hub for generic AH local outputs.

The first implementation should ship two files:

| File | Purpose |
|------|---------|
| `scripts/resolve-output.mjs` | Node implementation used by Knitten tests and diagnostics. |
| `bin/knitten-resolve-output` | Shell command shim used by payload helpers. |

The command shim is the payload-helper-facing API. It resolves the Knitten
plugin root and then calls `scripts/resolve-output.mjs`.

`scripts/resolve-output.mjs` should not probe the marketplace. It resolves
outputs from its own plugin location, the requested workspace/target roots, and
the Knitten hub root. Runtime discovery belongs to the command shim.

Resolution order:

1. `KNITTEN_PLUGIN_ROOT` when the caller already knows the exact Knitten plugin
   root.
2. `KNITTEN_PLUGINS_ROOT` when the caller knows the directory containing plugin
   folders.
3. The checkout containing the executed `bin/knitten-resolve-output` shim.
4. The default Codex personal marketplace copy:
   `~/plugins/knitten`.

This discovery logic should live in one Knitten-provided helper command or
script. Payload skills should not reimplement marketplace path probing.

The first implementation should provide the wrapper command:

```bash
knitten-resolve-output --kind=review-json --name="$TASK_ID" --create
```

The command should resolve its own plugin root before calling the Node runtime.

`scripts/materialize-local-plugin.mjs` should copy `bin/knitten-resolve-output`
with the rest of the plugin. No global installation is required in this
milestone.

Payload plugins that cannot rely on `PATH` should provide one local helper that
calls the installed Knitten shim:

```bash
scripts/resolve-knitten-output \
  --kind=review-json \
  --name="$TASK_ID" \
  --create
```

The payload-local helper should forward caller arguments unchanged and own the
installed-plugin fallback:

```bash
"${KNITTEN_PLUGINS_ROOT:-$HOME/plugins}/knitten/bin/knitten-resolve-output" "$@"
```

Individual payload skills call the payload-local helper, not the installed
plugin path directly. Payload skills should not inline marketplace path probing
or set `KNITTEN_PLUGIN_ROOT`.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `--workspace-root=<path>` | No | Target workspace. Defaults to current working directory. |
| `--target-root=<path>` | No | Workspace that should own durable documents or operational findings. Defaults to `workspaceRoot`. |
| `--kind=<kind>` | No | Generic output kind to resolve. |
| `--skill=<skill>` | No | Skill alias to resolve to one output kind. Mutually exclusive with `--kind`. |
| `--name=<name>` | Yes when selecting a file | Human name or task id used to build a stable file name. |
| `--create` | No | Create the selected path's parent directory. |

When `--kind` or `--skill` selects a file output, `--name` is required. The
runtime should not silently write to `untitled.*`. Names that cannot produce a
usable slug should fail.

## Outputs

The command returns JSON with at least:

| Field | Meaning |
|-------|---------|
| `pluginRoot` | Physical Knitten plugin checkout containing the script. |
| `hubRoot` | Knitten source checkout that owns writable generic AH local storage. |
| `hubLocalRoot` | `.agent-local/ah` under `hubRoot`. |
| `workspaceRoot` | Resolved active workspace root. |
| `workspaceLocalRoot` | Metadata path under the active workspace root; not the default local write target. |
| `targetRoot` | Resolved target workspace root. |
| `targetLocalRoot` | Metadata path under the target workspace root; not the default local write target. |
| `docsRoot` | `docs` under the target workspace root. |
| `selectedKind` | Resolved output kind or null. |
| `selectedSkill` | Input skill alias or null. |
| `selectedName` | Input name or null. |
| `selectedPath` | Concrete output file path when a kind or skill is supplied. |
| `selectedDir` | Parent directory for `selectedPath`, or local output root when no path is selected. |
| `selectedOwnerRoot` | Root that owns the selected output. |
| `selectedTargetRoot` | Root the selected output is about. |
| `selectedPersistence` | `durable` for workspace documents, `local` for `.agent-local` artifacts. |
| `isPluginWorkspace` | Whether the workspace is the Knitten plugin checkout. |

## Initial Generic Kinds

| Kind | Path |
|------|------|
| `spec` | `<targetRoot>/docs/specs/<slug>.md` |
| `design-plan` | `<targetRoot>/docs/design-plans/<slug>.md` |
| `temp-json` | `<hubRoot>/.agent-local/ah/json/<slug>.json` |
| `review-json` | `<hubRoot>/.agent-local/ah/reviews/<slug>.json` |
| `response-json` | `<hubRoot>/.agent-local/ah/responses/<slug>.json` |
| `operational-finding-json` | `<hubRoot>/.agent-local/ah/operational-findings/<YYYY-MM-DD>/<slug>.json` |
| `report-md` | `<hubRoot>/.agent-local/ah/reports/<slug>.md` |
| `report-html` | `<hubRoot>/.agent-local/ah/reports/<slug>.html` |
| `pull-request-json` | `<hubRoot>/.agent-local/ah/pull-requests/<slug>.json` |
| `task-json` | `<hubRoot>/.agent-local/ah/tasks/<slug>.json` |

These kinds are file-shape oriented, not domain oriented.

## Skill Aliases

Knitten may define aliases for its own generic AH skills.

Payload plugins should prefer `--kind` for domain workflows unless the alias is
generic and belongs in Knitten.

Initial aliases:

| Skill | Kind |
|-------|------|
| `ah-draft-spec` | `spec` |
| `ah-add-design-plan` | `design-plan` |
| `ah-review-spec` | `review-json` |
| `ah-review-implementation` | `review-json` |
| `ah-review-pr` | `review-json` |
| `ah-respond-pr` | `response-json` |
| `ah-report-finding` | `operational-finding-json` |

## Payload Plugin Use

Payload plugin skills call one payload-local helper instead of copying path
policy or probing the Knitten installation.

Example:

```bash
scripts/resolve-knitten-output \
  --kind=review-json \
  --name="$TASK_ID" \
  --create
```

The helper forwards arguments unchanged to the Knitten shim. It does not change
the workspace root unless the caller explicitly passes `--workspace-root`.

## Domain Extension Rule

If a payload plugin needs a domain-specific output, it should either:

1. map it to a generic Knitten kind, or
2. keep a tiny domain-local wrapper that calls Knitten with generic kinds.

Do not add domain-specific kind names to Knitten unless the kind has become
generic across payload plugins.

Example:

- Good core kind: `pull-request-json`
- Good payload wrapper name: `shotloom-pr-start-json`
- Avoid core kind: `shotloom-pr-cache`

## Validation

Initial validation should prove:

- plugin validator passes for source and materialized copy
- `node --check scripts/resolve-output.mjs` passes
- default invocation returns JSON
- every initial kind returns the expected path
- `--create` creates only parent directories
- `--skill` and `--kind` together fail
- file-selecting invocations without `--name` fail
- file-selecting invocations with unusable names fail
- outputs include `selectedDir` and `selectedPersistence`
- slugging preserves useful non-ASCII names
- payload-style invocation from outside the plugin checkout resolves the target
  workspace, not the plugin install path

## Implementation Plan

1. Rename `scripts/resolve-paths.mjs` to `scripts/resolve-output.mjs`.
2. Add `selectedDir` to the JSON output.
3. Add `selectedPersistence` to the JSON output.
4. Add `knitten-resolve-output` so payload helpers do not need to duplicate
   runtime discovery.
5. Add output runtime checks to `scripts/doctor.mjs`.
6. Update README with the core/payload usage rule.
7. Update generic AH skills only where they still imply hard-coded output paths.
8. Add or document the `knitten-all-skills` helper name:
   `scripts/resolve-knitten-output`.
9. Materialize the plugin and validate the installed copy.
10. Use one payload-style command from a separate workspace to prove the plugin
   can serve `knitten-all-skills` without being copied into it.

## Acceptance Criteria

- `knitten` still loads as a minimal Codex plugin.
- The output runtime is generic and domain-neutral.
- `knitten-all-skills` can call the runtime without duplicating it.
- No Shotloom-specific output kind is added to `knitten`.
- Existing AH skills continue to resolve paths through the runtime instead of
  hard-coding local destinations.
- No active skill or README instruction refers to `scripts/resolve-paths.mjs`.
- Payload plugins that cannot rely on `PATH` use one local helper for Knitten
  output runtime calls.
- Payload skills do not repeat the installed plugin fallback path inline.
- Payload skills do not set or depend on `KNITTEN_PLUGIN_ROOT` directly.
- Payload-local helpers forward caller arguments without changing the workspace
  root unless `--workspace-root` is explicitly supplied.
- New report/task/pull-request JSON kinds resolve under the hub
  `.agent-local/ah`.
- Source and materialized plugin validation pass.
