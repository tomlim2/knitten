---
status: proposed
created: 2026-05-29
updated: 2026-05-29
owner: agent-hub
milestone:
---

# Local Artifact Path Registry

## Purpose

Move local artifact path ownership from JavaScript branching logic into a
versioned JSON registry. Keep the resolver as a small registry interpreter.

## Problem

`agent/lib/resolve-local-artifact-path.mjs` currently works, but it owns two
separate concerns:

| Concern | Current owner | Defect |
|---|---|---|
| Path policy | JS maps and `if` branches | Adding or renaming a path requires editing code. |
| Path execution | JS CLI and exported function | Execution logic is mixed with artifact taxonomy. |
| Helper location | Skill prose and shell snippets | Some callers still rely on specific skill or harness paths. |

This makes path additions feel like script changes instead of data changes. It
also lets skill-local path assumptions drift across local checkout and deployed
harness layouts.

## Goals

| Goal | Requirement |
|---|---|
| Data-owned local paths | Store local artifact templates in `agent/config/local-artifact-paths.json`. |
| Thin resolver | `resolve-local-artifact-path.mjs` loads the registry, validates args, renders templates, and creates parent dirs only with `--create`. |
| Stable CLI | Preserve current command shapes for existing callers. |
| Registry validation | Add JSON validation so broken templates fail before skills consume them. |
| No skill path coupling | Scripts and snippets resolve from the Knitten root, not from hardcoded skill install locations. |
| Explicit extensibility | New owners/artifact types are added by registry row plus validation, not by new resolver branches. |

## Non-Goals

| Non-Goal | Reason |
|---|---|
| Replace repo path resolution | `resolve-repo-path.mjs` remains the owner for repo locations. |
| Move all helper scripts behind a generic launcher | This spec removes local artifact path hardcoding first; helper-launch abstraction can be a later spec. |
| Change `.agent-local/**` layout | This spec preserves the path layout from `shotloom-local-artifact-path-unification.md`. |
| Migrate historical tracked docs | Historical cleanup is separate. |
| Support arbitrary user-defined templates from outside the repo | The registry is repo-owned and validator-controlled. |

## Current State

The current resolver embeds a `FILENAMES` object and dispatch functions:

```text
owner -> artifact type -> item -> filename
shotloomPath(args)
ahPath(args)
```

Skill snippets mostly pass `KNITTEN_ROOT` and call
`$knitten_root/agent/lib/resolve-local-artifact-path.mjs`, which is the desired
direction. The remaining issue is that resolver policy is still hardcoded in
code.

## Proposed Design

Add `agent/config/local-artifact-paths.json` as the canonical local artifact
path registry.

### Registry Shape

```json
{
  "schemaVersion": 1,
  "root": ".agent-local",
  "entries": [
    {
      "owner": "shotloom",
      "artifactType": "planning",
      "item": "brief",
      "kind": "file",
      "args": [
        { "name": "stl", "pattern": "^stl-[0-9]+$", "normalize": "lowercase" }
      ],
      "path": ".agent-local/shotloom/planning/{stl}/brief.json",
      "cleanupPath": ".agent-local/shotloom/planning/{stl}",
      "template": "agent/document-templates/agent-hub/json-handoff-packet.json",
      "schemaKind": "shotloom-start-task-brief"
    }
  ]
}
```

### Entry Contract

| Field | Required | Meaning |
|---|---:|---|
| `owner` | yes | Top-level workflow owner such as `shotloom` or `ah`. |
| `artifactType` | yes | Artifact family such as `planning`, `before-pr`, `pr`, `deploy`, or `operational-findings`. |
| `item` | yes | Resolvable item name such as `brief`, `reply-plan`, or `report`. |
| `kind` | yes | `file` or `directory`. Controls `--create` behavior. |
| `args` | yes | Ordered path parameters required before `item` or after `item`, depending on command shape. |
| `path` | yes | Repo-relative template. Must start with `.agent-local/`. |
| `cleanupPath` | yes | Repo-relative cleanup directory template. Must start with `.agent-local/`. |
| `description` | no | Human note for maintainers. |
| `template` | no | Repo-relative `.json` template the writer should start from. |
| `schemaKind` | no | Kebab-case JSON kind hint included in resolver output. |

### Argument Contract

Supported `args[]` fields:

| Field | Required | Meaning |
|---|---:|---|
| `name` | yes | Placeholder name used by `{name}` in templates. |
| `pattern` | yes | JavaScript regular expression string without flags. |
| `normalize` | no | `lowercase` only in this phase. |
| `position` | no | `before-item` by default. `after-item` supports shapes like `report <slug>`. |

The CLI token shape is:

```text
<owner> <artifactType> <before-item args...> <item> <after-item args...>
```

Examples:

| Command | Parsed entry | Parsed args |
|---|---|---|
| `shotloom planning stl-123 brief` | `shotloom/planning/brief` | `stl=stl-123` |
| `shotloom pr 404 reply-plan` | `shotloom/pr/reply-plan` | `pr=404` |
| `ah operational-findings 2026-05-29 report smoke-test` | `ah/operational-findings/report` | `date=2026-05-29`, `slug=smoke-test` |

The resolver finds the unique registry entry whose `owner`, `artifactType`,
and `item` match the token stream. The registry entry identity is
`owner/artifactType/item`; the same identity must appear at most once. The
resolver then validates the entry's declared before-item and after-item args
against the remaining tokens before rendering templates.

For `--create`, the resolver creates:

| `kind` | Create behavior |
|---|---|
| `file` | `dirname(absolutePath)` |
| `directory` | `absolutePath` |

The resolver rejects:

- missing args;
- extra args;
- duplicate registry entries for the same `owner/artifactType/item`;
- unknown `kind`;
- template placeholders not declared in `args[]`;
- declared args not used by `path` or `cleanupPath`;
- paths outside `.agent-local/**`;
- path traversal, slash-bearing segments, or empty rendered segments.

### Command Compatibility

Existing command shapes stay valid:

```bash
node agent/lib/resolve-local-artifact-path.mjs shotloom planning stl-123 brief
node agent/lib/resolve-local-artifact-path.mjs shotloom before-pr stl-123 feat-example readiness
node agent/lib/resolve-local-artifact-path.mjs shotloom pr 404 reply-plan
node agent/lib/resolve-local-artifact-path.mjs ah operational-findings 2026-05-29 report smoke-test
```

### Current Command Matrix

| Command shape | Entry identity | Args |
|---|---|---|
| `shotloom planning <stl> brief` | `shotloom/planning/brief` | `stl` |
| `shotloom planning <stl> spec` | `shotloom/planning/spec` | `stl` |
| `shotloom planning <stl> design-plan` | `shotloom/planning/design-plan` | `stl` |
| `shotloom planning <stl> questions` | `shotloom/planning/questions` | `stl` |
| `shotloom planning <stl> manifest` | `shotloom/planning/manifest` | `stl` |
| `shotloom before-pr <stl> <safeBranch> readiness` | `shotloom/before-pr/readiness` | `stl`, `safeBranch` |
| `shotloom before-pr <stl> <safeBranch> code-blockers` | `shotloom/before-pr/code-blockers` | `stl`, `safeBranch` |
| `shotloom before-pr <stl> <safeBranch> docs-blockers` | `shotloom/before-pr/docs-blockers` | `stl`, `safeBranch` |
| `shotloom pr <pr> watcher-pid` | `shotloom/pr/watcher-pid` | `pr` |
| `shotloom pr <pr> watcher-log` | `shotloom/pr/watcher-log` | `pr` |
| `shotloom pr <pr> react-log` | `shotloom/pr/react-log` | `pr` |
| `shotloom pr <pr> state` | `shotloom/pr/state` | `pr` |
| `shotloom pr <pr> last-event` | `shotloom/pr/last-event` | `pr` |
| `shotloom pr <pr> log` | `shotloom/pr/log` | `pr` |
| `shotloom pr <pr> reply-plan` | `shotloom/pr/reply-plan` | `pr` |
| `shotloom pr <pr> pause` | `shotloom/pr/pause` | `pr` |
| `shotloom pr <pr> lock` | `shotloom/pr/lock` | `pr` |
| `shotloom pr <pr> lock-dir` | `shotloom/pr/lock-dir` | `pr` |
| `shotloom deploy <key> release-notes` | `shotloom/deploy/release-notes` | `key` |
| `shotloom deploy <key> manifest` | `shotloom/deploy/manifest` | `key` |
| `shotloom deploy <key> rollback` | `shotloom/deploy/rollback` | `key` |
| `ah operational-findings <date> inbox` | `ah/operational-findings/inbox` | `date` |
| `ah operational-findings <date> report <slug>` | `ah/operational-findings/report` | `date`, `slug` |

The resolver locates the registry from the validated Knitten root:

```text
<knitten-root>/agent/config/local-artifact-paths.json
```

Do not read the registry from the skill install directory.

### Output Contract

Success output remains:

```json
{
  "ok": true,
  "owner": "shotloom",
  "artifactType": "pr",
  "item": "reply-plan",
  "root": "<knitten-root>",
  "path": ".agent-local/shotloom/pr/404/reply-plan.json",
  "absolutePath": "<knitten-root>/.agent-local/shotloom/pr/404/reply-plan.json",
  "cleanupPath": ".agent-local/shotloom/pr/404",
  "absoluteCleanupPath": "<knitten-root>/.agent-local/shotloom/pr/404"
}
```

Error output remains JSON with nonzero exit:

```json
{
  "ok": false,
  "error": "resolve-failed",
  "detail": "unknown local artifact entry: shotloom pr missing-item"
}
```

### Root And Helper Location

Caller scripts must use one of these inputs:

| Input | Use |
|---|---|
| `--root <knitten-root>` | Preferred for skills running from another repo, such as Shotloom worktrees. |
| `KNITTEN_ROOT` | Preferred environment handoff in skill snippets. |
| current git root | Allowed only when the current checkout is Knitten. |

Callers must not derive helper paths from:

- `$HOME/.claude/skills/<skill-name>`;
- `agent/skills/<skill-name>/../../lib` unless the script itself is skill-local and deployed with the matching `lib`;
- Shotloom repo-relative paths.

## Execution Plan

## Design Plan

S0 - Baseline Re-Check

Input:
- Current branch diff and `agent/lib/resolve-local-artifact-path.mjs`.

Output:
- Confirmed list of current supported commands and current validation status.

Non-output:
- No source edits.

Failure:
- Stop and report if current validation is red for reasons unrelated to this branch.

Proof:
- `node scripts/validate-llm-first.mjs`
- `git diff --check`

S1 - Add Registry

Input:
- Current resolver command matrix.

Output:
- `agent/config/local-artifact-paths.json` containing all currently supported entries.
- A command matrix in the spec or implementation notes showing how each current
  command maps to `owner/artifactType/item` and named args.

Non-output:
- No skill behavior changes.

Failure:
- Reject any entry that cannot represent the existing command shape.
- Reject designs that require special-case parser branches per owner.
- Reject overloaded entries with the same `owner/artifactType/item`.

Proof:
- JSON parse check.
- Manual comparison against current resolver usage list.

S2 - Convert Resolver To Registry Interpreter

Input:
- `agent/config/local-artifact-paths.json`.
- Existing resolver tests/smoke commands.

Output:
- `resolve-local-artifact-path.mjs` no longer contains owner-specific path maps or owner-specific path functions.
- Current CLI commands produce the same `path` and `cleanupPath` values.

Non-output:
- No change to `.agent-local/**` layout.

Failure:
- Stop if a current caller command cannot be represented without adding command-specific code.

Proof:
- Existing resolver smoke commands.
- New duplicate/unknown/missing-arg negative checks.

S3 - Add Registry Validation

Input:
- Registry schema contract.

Output:
- `validate-llm-first` checks registry structure and template safety, or a focused validator script called by the main validator.

Non-output:
- No runtime path creation during validation.

Failure:
- Validation fails on invalid owner/type/item duplicates, undeclared placeholders, unused args, or paths outside `.agent-local/**`.

Proof:
- `node scripts/validate-llm-first.mjs`

S4 - Remove Skill Path Coupling

Input:
- Skill snippets and shell/python helpers that invoke local artifact resolver or PR helper scripts.

Output:
- Callers use `KNITTEN_ROOT`/`--root` and `$knitten_root/agent/lib/...`.
- No caller relies on `$HOME/.claude/skills/<skill-name>` to find local artifact policy.

Non-output:
- No generic helper launcher unless a caller cannot be made root-relative.

Failure:
- Leave a narrow compatibility fallback only when deployed harness behavior requires it, and document why.

Proof:
- `rg` check for hardcoded skill install path patterns in changed surfaces.

S5 - Documentation And Compatibility Update

Input:
- Existing path-unification spec and changed files.

Output:
- Update `shotloom-local-artifact-path-unification.md` to point at registry ownership.
- Update skill docs only where command snippets change.

Non-output:
- No broad wording rewrite.

Failure:
- Stop if docs imply two competing path owners.

Proof:
- `rg` check for old resolver-policy wording.

## Validation

Run:

```bash
node --check agent/lib/resolve-local-artifact-path.mjs
node -e 'JSON.parse(require("node:fs").readFileSync("agent/config/local-artifact-paths.json", "utf8"))'
node agent/lib/resolve-local-artifact-path.mjs shotloom planning stl-123 brief
node agent/lib/resolve-local-artifact-path.mjs shotloom planning stl-123 manifest
node agent/lib/resolve-local-artifact-path.mjs shotloom before-pr stl-123 feat-example readiness
node agent/lib/resolve-local-artifact-path.mjs shotloom pr 404 reply-plan
node agent/lib/resolve-local-artifact-path.mjs shotloom deploy 2026-05-29 manifest
node agent/lib/resolve-local-artifact-path.mjs ah operational-findings 2026-05-29 inbox
node agent/lib/resolve-local-artifact-path.mjs ah operational-findings 2026-05-29 report smoke-test
set +e
node agent/lib/resolve-local-artifact-path.mjs shotloom pr 404 missing-item
test "$?" -ne 0
set -e
! rg -n 'const FILENAMES|function shotloomPath|function ahPath' agent/lib/resolve-local-artifact-path.mjs
! rg -n 'resolve-local-artifact-path\\.mjs.*\\$HOME/\\.claude/skills|\\$HOME/\\.claude/skills.*resolve-local-artifact-path\\.mjs|resolve-local-artifact-path\\.mjs.*agent/skills/.*/\\.\\./\\.\\./lib' \
  agent/skills/shotloom-* scripts agent/lib
node scripts/validate-llm-first.mjs
git diff --check
```

Expected:

| Check | Expected |
|---|---|
| Positive resolver commands | Same `path` and `cleanupPath` as current implementation. |
| Negative resolver command | Nonzero exit with JSON error. |
| Hardcoded resolver policy grep | No owner-specific path maps/functions remain in resolver. |
| Skill path coupling grep | No changed caller depends on skill install location for local artifact policy. |
| LLM validator | Pass. |
| Diff check | Pass. |

## Risks

| Risk | Mitigation |
|---|---|
| JSON registry becomes too expressive | Support only exact entry matching and simple placeholder rendering in this phase. |
| Command compatibility breaks callers | Preserve command shapes and run smoke commands before skill edits. |
| Validation duplicates resolver logic | Keep validation structural; runtime rendering remains in resolver. |
| Registry rows become hard to scan | Keep one row per concrete item rather than nested polymorphic maps. |
| Helper-path cleanup expands scope | Do only local artifact resolver callers here; defer generic helper launcher. |

## Acceptance Criteria

- `agent/config/local-artifact-paths.json` owns every local artifact path currently supported by `resolve-local-artifact-path.mjs`.
- `resolve-local-artifact-path.mjs` contains no owner-specific hardcoded path tables or owner-specific dispatch functions.
- Existing resolver CLI commands keep their output paths.
- Registry validation fails unsafe or inconsistent templates.
- Skill/script snippets use Knitten-root-relative helper paths for local artifact resolution.
- Full repository validation passes.

## Open Decisions

| Decision | Default |
|---|---|
| Should helper script locations become a generic registry too? | No in this spec; defer unless root-relative calls remain brittle. |
| Should registry support aliases for old item names? | No; keep exact item names until a real compatibility need appears. |
| Should user-installed local registries extend this file? | No; repo-owned registry only. |
