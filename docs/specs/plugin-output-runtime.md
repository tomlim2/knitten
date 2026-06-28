# Plugin Path/Output Runtime

## Status

Implemented. Current local-output hub behavior is extended by
[Shared Workflow Local Output Hub Storage](ah-local-output-hub-storage.md).

## Goal

Promote Knitten's path resolver into a small plugin-native path/output runtime.

The runtime should let Knitten and domain plugins resolve predictable output
destinations without copying path rules into every skill. It should be generic
enough for private domain plugins such as `knitten-all-skills`, but small enough
that `knitten` does not become a domain workflow bundle.

## Problem

Domain skills need stable places for generated documents and temporary files:

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
- private domain plugins must duplicate the same path logic
- skills become harder to read because path policy appears inside each workflow

## Core Principle

`knitten` owns shared workflow path/output resolution.

Domain plugins own domain meaning.

This means `knitten` may know what a `spec`, `design-plan`, `review-json`, or
`temp-json` output is. It should not know what a Shotloom PR cache, CINEV alert
artifact, tutoring note, or any other domain-specific output means.

## Terms

| Term | Meaning |
|------|---------|
| Plugin root | The physical installed or source checkout containing the runtime script. |
| Hub root | The current Knitten plugin root that owns shared local workflow storage. |
| Workspace root | The active repository or workspace where the user is working. |
| Target root | The repository, plugin, or domain surface the output is about. |
| Local output root | `.agent-local/workflow` under the hub root. |
| Durable document | A user-facing document intended to remain in the workspace, usually under `docs/`. |
| Local artifact | A temporary or operational file under `.agent-local/workflow`. |
| Output kind | A generic output category such as `spec` or `review-json`. |
| Skill alias | A mapping from a skill name to one generic output kind. |
| Output destination | The resolved file path and its parent directory. |

## Scope

This milestone defines output destination routing.

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
Domain skills call their domain-local helper.

## Runtime Discovery

Domain plugins need one stable way to find the Knitten runtime and one stable
hub for shared workflow local outputs.

The first implementation should ship two files:

| File | Purpose |
|------|---------|
| `scripts/resolve-output.mjs` | Node implementation used by Knitten tests and diagnostics. |
| `bin/knitten-resolve-output` | Shell command shim used by domain helpers. |

The command shim is the domain-helper-facing API. It resolves the Knitten
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
script. Domain skills should not reimplement marketplace path probing.

The first implementation should provide the wrapper command:

```bash
knitten-resolve-output --kind=review-json --name="$TASK_ID" --create
```

The command should resolve its own plugin root before calling the Node runtime.

`scripts/materialize-local-plugin.mjs` should copy `bin/knitten-resolve-output`
with the rest of the plugin. No global installation is required in this
milestone.

Domain plugins that cannot rely on `PATH` should provide one local helper that
calls the installed Knitten shim:

```bash
scripts/resolve-knitten-output \
  --kind=review-json \
  --name="$TASK_ID" \
  --create
```

The domain-local helper should forward caller arguments unchanged and own the
installed-plugin fallback:

```bash
"${KNITTEN_PLUGINS_ROOT:-$HOME/plugins}/knitten/bin/knitten-resolve-output" "$@"
```

Individual domain skills call the domain-local helper, not the installed
plugin path directly. Domain skills should not inline marketplace path probing
or set `KNITTEN_PLUGIN_ROOT`.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `--workspace-root=<path>` | No | Target workspace. Defaults to current working directory. |
| `--target-root=<path>` | No | Workspace that should own durable documents, or metadata describing what an operational finding is about. Defaults to `workspaceRoot`. |
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
| `hubRoot` | Current Knitten plugin root that owns writable shared local workflow storage. |
| `hubLocalRoot` | `.agent-local/workflow` under `hubRoot`. |
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
| `temp-json` | `<hubRoot>/.agent-local/workflow/json/<slug>.json` |
| `review-json` | `<hubRoot>/.agent-local/workflow/reviews/<slug>.json` |
| `response-json` | `<hubRoot>/.agent-local/workflow/responses/<slug>.json` |
| `operational-finding-json` | `<hubRoot>/.agent-local/workflow/operational-findings/<YYYY-MM-DD>/<slug>.json` |
| `report-md` | `<hubRoot>/.agent-local/workflow/reports/<slug>.md` |
| `report-html` | `<hubRoot>/.agent-local/workflow/reports/<slug>.html` |
| `pull-request-json` | `<hubRoot>/.agent-local/workflow/pull-requests/<slug>.json` |
| `task-json` | `<hubRoot>/.agent-local/workflow/tasks/<slug>.json` |

These kinds are file-shape oriented, not domain oriented.

## Skill Aliases

Knitten may define aliases for its own shared workflow skills.

Domain plugins should prefer `--kind` for domain workflows unless the alias is
generic and belongs in Knitten.

Historical initial aliases:

| Skill | Kind |
|-------|------|
| `draft-spec` | `spec` |
| `ah-add-design-plan` | `design-plan` |
| `ah-review-spec` | `review-json` |
| `ah-review-implementation` | `review-json` |
| `ah-review-pr` | `review-json` |
| `ah-respond-pr` | `response-json` |
| `report-finding` | `operational-finding-json` |

## Domain Plugin Use

Domain plugin skills call one domain-local helper instead of copying path
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

If a domain plugin needs a domain-specific output, it should either:

1. map it to a generic Knitten kind, or
2. keep a tiny domain-local wrapper that calls Knitten with generic kinds.

Do not add domain-specific kind names to Knitten unless the kind has become
generic across domain plugins.

Example:

- Good core kind: `pull-request-json`
- Good domain wrapper name: `shotloom-pr-start-json`
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
- domain-plugin-style invocation from outside the plugin checkout resolves the target
  workspace, not the plugin install path

## Implementation Plan

1. Rename `scripts/resolve-paths.mjs` to `scripts/resolve-output.mjs`.
2. Add `selectedDir` to the JSON output.
3. Add `selectedPersistence` to the JSON output.
4. Add `knitten-resolve-output` so domain helpers do not need to duplicate
   runtime discovery.
5. Add path/output checks to `scripts/doctor.mjs`.
6. Update README with the core/domain-plugin usage rule.
7. Update shared workflow skills only where they still imply hard-coded output paths.
8. Add or document the `knitten-all-skills` helper name:
   `scripts/resolve-knitten-output`.
9. Materialize the plugin and validate the installed copy.
10. Use one domain-plugin-style command from a separate workspace to prove the plugin
   can serve `knitten-all-skills` without being copied into it.

## Acceptance Criteria

- `knitten` still loads as a minimal Codex plugin.
- The path/output runtime is generic and domain-neutral.
- `knitten-all-skills` can call the runtime without duplicating it.
- No Shotloom-specific output kind is added to `knitten`.
- Existing shared workflow skills continue to resolve paths through the runtime instead of
  hard-coding local destinations.
- No active skill or README instruction refers to `scripts/resolve-paths.mjs`.
- Domain plugins that cannot rely on `PATH` use one local helper for Knitten
  path/output calls.
- Domain skills do not repeat the installed plugin fallback path inline.
- Domain skills do not set or depend on `KNITTEN_PLUGIN_ROOT` directly.
- Domain-local helpers forward caller arguments without changing the workspace
  root unless `--workspace-root` is explicitly supplied.
- New report/task/pull-request JSON kinds resolve under the hub
  `.agent-local/workflow`.
- Source and materialized plugin validation pass.
