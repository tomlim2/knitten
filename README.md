# Knitten Core

Knitten is a lightweight Codex workflow core for small shared skills and
domain plugins.

It solves a practical Codex problem: as a skill library grows, every exposed
skill name, description, and eagerly loaded instruction competes for prompt
budget. Knitten keeps shared workflow contracts, output paths, validation, and
ownership rules in one small core. Domain plugins keep project-specific context
behind match checks and deferred references.

Token efficiency here means avoiding unnecessary context and work. It does not
mean cutting validation, safety checks, or task-required implementation.

## Current Proof

These are source-level measurements from the current checkout. Re-run the
commands before changing public claims.

| Check | Current result | Re-run |
|-------|----------------|--------|
| Core discovery surface | 7 skills, about 111 list tokens | `node scripts/measure-skill-exposure.mjs .` |
| Core skill bodies | about 3282 `SKILL.md` tokens | `node scripts/measure-skill-exposure.mjs .` |
| Context-load smoke eval | 20/20 match accuracy, 63.0% average savings | `node scripts/run-context-load-smoke-eval.mjs` |

## Quickstart

```bash
node scripts/validate-repository-shell.mjs
node scripts/materialize-local-plugin.mjs
node scripts/doctor.mjs
node scripts/measure-skill-exposure.mjs .
node scripts/run-context-load-smoke-eval.mjs
```

Expected success signals:

- `repository shell ok`
- `materialize-local-plugin.mjs` writes or updates the local marketplace entry
- `node scripts/doctor.mjs` returns JSON with `"ok": true`
- `measure-skill-exposure.mjs` prints a `knitten` row with 7 skills
- `run-context-load-smoke-eval.mjs` returns `"ok": true`

If you have the Codex plugin validator available, also run:

```bash
python3 <path-to-validate_plugin.py> .
```

Expected success signal: `Plugin validation passed`.

## When To Use

Use Knitten when you want:

- a small Codex core for shared workflow skills,
- repeatable output paths for specs, reviews, reports, and local task records,
- a clear split between shared workflow behavior and domain-specific skills,
- short skill files that load detailed references only after a match,
- local validation for plugin health and core/domain-plugin boundaries.

## When Not To Use

Do not use Knitten as:

- a replacement for Codex skill discovery semantics,
- a generic guarantee that every task will use fewer tokens,
- a place to store project-specific workflows that belong in a domain plugin,
- a reason to skip validation, safety checks, or required implementation work.

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

Use this repository when you need to change shared Codex workflow behavior:
generic workflow skills, where generated specs or plans are saved, where
temporary local outputs are written, or which plugin owns a workflow.

Shared workflows are the common Codex-assisted steps around preparing work,
drafting specs, implementing, reviewing artifacts, and wrapping up.

Knitten Core keeps only the pieces that should work the same across projects.
It does not contain a full private skill library. Domain skills live in domain
plugins that are installed separately.

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
| `docs/guidelines/public-metadata.md` | Recommended public GitHub metadata and claim guardrails. |
| `examples/minimal-domain-plugin/` | Minimal copyable domain-plugin example. |

## Validate

```bash
python3 <path-to-validate_plugin.py> .
node scripts/validate-repository-shell.mjs
node scripts/materialize-local-plugin.mjs
node scripts/doctor.mjs
node scripts/measure-skill-exposure.mjs .
node scripts/run-context-load-smoke-eval.mjs
node scripts/validate-domain-plugin-boundary.mjs --domain-plugin examples/minimal-domain-plugin --warn-only
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
