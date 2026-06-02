# Plugin-Native Routing Core Reboot

## Status

Draft.

## Goal

Rebuild Knitten as the smallest useful Codex plugin for Agent Hub routing.

The first milestone is not the full routing system. It is a minimal plugin that
Codex can discover from the personal marketplace, validate, and load without
legacy harness deploy paths.

## Problem

The current core was produced by extraction. Even after cleanup, extraction
keeps pulling in historical concepts:

- legacy deploy and mirror assumptions
- domain-specific Shotloom artifacts
- private or user-local configuration assumptions
- broad registries that imply missing runtime surfaces
- historical docs that read like active policy

This makes `knitten` harder to reason about as a standalone Codex plugin.

## Desired Shape

`knitten` is the Agent Hub routing system. The initial reboot owns only the
minimum files needed for Codex plugin identity, entry guidance, validation, and
local marketplace registration.

`knitten-all-skills` is a payload plugin. It owns skills, standards, examples,
domain workflows, and working documents.

`knitten-all` is a legacy reference/archive. It should not be required at
runtime.

## Must Keep

| Surface | Reason |
|---------|--------|
| `.codex-plugin/plugin.json` | Codex plugin identity and metadata. |
| `README.md` | Human entry point for install, validate, and update. |
| `LICENSE` | Public repository licensing. |
| `SYSTEM.md` | Minimal plugin boundary contract. |
| `agent/AGENTS.md` | Codex adapter entry document. |
| `.github/workflows/validate.yml` | CI proof that the plugin manifest remains valid. |
| `scripts/materialize-local-plugin.mjs` | Registers a local physical copy in the Codex personal marketplace. |

## Defer

These are useful later, but they are not part of the first minimal plugin
registration milestone:

- output contract schema
- path/output resolver
- `.agent-local` path convention
- artifact-pack schema
- generic document templates
- doctor/readiness script

## Remove From Core

| Surface | Reason |
|---------|--------|
| `agent/skills/` | Skills belong in payload plugins. |
| Shotloom artifacts | Domain workflow, not core. |
| Domain service config | Slack, Linear, CINEV, and repo-specific config are payload/private concerns. |
| Legacy deploy wording | New plugin core should not explain old mirror setup as active behavior. |
| Historical plans and reports | Archive/reference material, not runtime core. |
| Private config paths | Not portable plugin behavior. |
| Harness-specific paths | Codex plugin should not depend on another harness's runtime layout. |
| Output/path registries | Defer until minimal plugin registration is proven. |
| Artifact-pack registries | Defer until plugin registration is stable. |

## Forbidden Runtime Assumptions

- `~/.claude`
- symlink or mirror deployment
- absolute user-specific repository paths
- `knitten-all` checkout availability
- Shotloom or CINEV availability
- Linear, Slack, or GitHub credentials

## Proposed Minimal Tree

```text
.codex-plugin/plugin.json
.github/workflows/validate.yml
.gitignore
LICENSE
README.md
SYSTEM.md
agent/AGENTS.md
scripts/materialize-local-plugin.mjs
docs/specs/plugin-native-core-reboot.md
```

## Implementation Plan

1. Reduce `knitten` to the proposed minimal tree.
2. Rewrite README and SYSTEM from the plugin-shell boundary, not from
   extracted `knitten-all` text.
3. Delete extracted registries, resolvers, templates, and public-core overlay
   files from `knitten`.
4. Add a small standalone local materialization script that:
   - copies this checkout into `~/plugins/knitten`
   - writes or updates `~/.agents/plugins/marketplace.json`
   - uses `./plugins/knitten` as the marketplace source path
   - applies a local `+codex.<timestamp>` cachebuster only to the copied
     manifest
5. Validate with the Codex plugin validator.
6. Run the materialization script and validate the copied plugin.

## Acceptance Criteria

- `python3 validate_plugin.py .` passes.
- `node scripts/materialize-local-plugin.mjs --dry-run` passes.
- `node scripts/materialize-local-plugin.mjs` writes the personal marketplace
  entry and physical plugin copy.
- `python3 validate_plugin.py ~/plugins/knitten` passes.
- Searching the core tree for forbidden runtime assumptions returns no active
  runtime references.
- The core tree contains no Shotloom-specific files.
- The core tree does not require `knitten-all` at runtime.
- The README explains the plugin in terms of Codex install/update/use, not
  legacy extraction.

## Review Notes

### Product Lens

The core should be understandable in one screen: install it, validate it, and
use it as the base operating layer. Anything domain-specific should be absent.

### Maintenance Lens

Rebuilding is safer than continued extraction because the default action becomes
"do not add it" instead of "export it and then remove legacy leaks."

### Migration Lens

This does not delete the old knowledge. `knitten-all` remains the reference.
The change is that reference material no longer becomes runtime surface by
default.
