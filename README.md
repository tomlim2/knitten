# Knitten Core

Knitten Core is a lightweight Codex plugin core for shared workflows.

It keeps common workflow steps, output paths, validation, and ownership rules
in one small core. Domain plugins keep project-specific skills and load
detailed context only after a clear match.
Token efficiency here means avoiding unnecessary context and work, not cutting
validation, safety checks, or task-required implementation.

`KC` is the short name for Knitten Core in local notes, commands, and task
shorthand.

Use this repository when you need to change shared Codex workflow behavior:
generic workflow skills, where generated specs or plans are saved, where
temporary local outputs are written, or which plugin owns a workflow.

Shared workflows are the common Codex-assisted steps around preparing work,
drafting specs, implementing, reviewing artifacts, and wrapping up.

Knitten Core keeps only the pieces that should work the same across projects.
It does not contain the full private skill library. Domain skills live in
domain plugins that are installed separately.

## Core And Domain Plugins

Knitten's core claim is deliberately small: keep the personal core stable, plug
in domain plugins only when needed, and load detailed workflow context after a
skill or domain plugin has clearly matched.

Core principles:

- **Small Core**: keep shared workflow behavior, output paths, validation, and
  ownership rules in `knitten`.
- **Domain Plugins**: keep project, company, and domain skills in separate
  plugins such as `knitten-sl`.
- **Match Check**: decide whether a skill or domain plugin applies before
  reading detailed workflow material.
- **Short Skill File**: keep the active `SKILL.md` short: description, `Use
  for:`, Step 0, safety checks, and a pointer to references.
- **Deferred Context**: load skill-local references only after the request
  matches the skill.
- **Safety First**: keep mutation, push, deploy, delete, and external-state
  checks in the main skill file.
- **Health Check**: validate that core paths stay reachable, generic, and
  separate from domain behavior.
- **Skill Size Checks**: identify skills that are too long, too ambiguous, or
  missing clear non-trigger rules.

Current milestone: see [`MILESTONE.md`](MILESTONE.md).

Repository roles:

| Repository | Role |
|------------|------|
| `knitten` | Knitten Core. Contains shared workflow skills, output-path scripts, document templates, and ownership rules. |
| Domain plugins | Project, company, or personal skills and skill-owned support files. |
| `knitten-archive` | Old combined repository kept for history after the core/domain-plugin split. |

Quick rule: if the change affects where work goes or how shared workflows are
structured, edit `knitten`. If the change affects what a specific skill does,
edit the domain plugin that owns that skill.

## Contents

| Path | Purpose |
|------|---------|
| `.codex-plugin/plugin.json` | Codex plugin manifest. |
| `MILESTONE.md` | Top-level core/domain-plugin milestone and roadmap. |
| `SYSTEM.md` | Core and plugin boundary contract. |
| `agent/AGENTS.md` | Codex entry document. |
| `skills/` | Shared workflow skills. |
| `document-templates/` | Shared workflow document templates. |
| `bin/knitten-resolve-output` | Domain-plugin-facing path/output shim. |
| `scripts/doctor.mjs` | Check source and personal-marketplace installation state. |
| `scripts/materialize-local-plugin.mjs` | Register a local physical copy in the personal marketplace. |
| `scripts/resolve-output.mjs` | Resolve durable target docs and core-owned local outputs. |
| `docs/specs/` | Design notes for the core, domain plugins, and runtime. |
| `docs/guidelines/skill-authoring.md` | Rules for short skill files and domain-owned flows. |

## Validate

```bash
python3 <path-to-validate_plugin.py> .
node --check scripts/doctor.mjs
node --check scripts/resolve-output.mjs
```

## Local Codex Installation

Knitten Core is the core plugin. Domain plugins are installed separately in
the same local marketplace when their skills are needed:

```text
knitten@knitten-local
<domain-plugin>@knitten-local
```

Codex reads the local marketplace from this config:

```toml
[marketplaces.knitten-local]
source_type = "local"
source = "<home-directory>"

[plugins."knitten@knitten-local"]
enabled = true

[plugins."<domain-plugin>@knitten-local"]
enabled = true
```

The marketplace manifest lives at:

```text
<home-directory>/.agents/plugins/marketplace.json
```

Runtime plugin copies live under:

```text
<home-directory>/plugins/knitten
<home-directory>/plugins/<domain-plugin>
```

Install or refresh the core plugin:

```bash
node scripts/materialize-local-plugin.mjs
node scripts/doctor.mjs
codex plugin add knitten@knitten-local
codex plugin list
```

The materialized copy receives a local `+codex.<timestamp>` version suffix. The
source manifest stays stable.

Install or refresh domain plugins from their own repositories using their own
plugin documentation.

Restart Codex after changing `~/.codex/config.toml` or refreshing plugin
installations. Existing sessions may keep the old skill list until a new
session starts.

## Path Rules

Active Knitten Core docs and helper scripts should avoid personal absolute
paths. Use placeholders such as `<home-directory>`, `<plugins-root>`, and
`<domain-plugin>`, or prefer explicit environment variables before `$HOME`
fallbacks in executable helpers.

Historical specs may keep old local paths as evidence. Domain plugins
may document private config paths when those paths are the actual external
contract.

## License

MIT License. See `LICENSE`.

## Boundary

Domain workflows, domain output registries, and artifact-pack lifecycle tools
belong in domain plugins unless they are intentionally promoted into this core.
Knitten Core owns shared workflow contracts, ownership rules, and the generic
path/output runtime.
