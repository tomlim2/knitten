# Knitten Core

Knitten Core is a token-efficient routing layer for Codex Agent Hub workflows.

It routes work to the right skill at the lowest useful context cost: a short
activation gate decides whether a skill applies, detailed references load only
after a match, and safety gates stay visible before mutation-prone work.

`KC` is the short name for Knitten Core in local notes, commands, and task
shorthand.

Use this repository when you need to change shared Agent Hub behavior: how a
task is routed, where a generated spec or plan is saved, where temporary local
outputs are written, or which plugin is allowed to own a workflow.

Agent Hub (AH) is the workflow layer for Codex-assisted development tasks. It
covers the common steps around preparing work, drafting specs, implementing,
reviewing artifacts, and wrapping up.

Knitten Core keeps only the pieces that should work the same across projects.
It does not contain the full private skill library. Domain skills live in
payload plugins that are installed separately.

## Routing Position

Knitten is not trying to make every skill load more context up front. Its core
claim is the opposite: skills can grow without forcing every request to pay the
full context cost.

Routing principles:

- **Activation Gate**: decide whether a skill applies before reading detailed
  workflow material.
- **Activation Shell**: keep the active `SKILL.md` short: description, `Use
  for:`, Step 0, safety gates, and a pointer to references.
- **Reference On Match**: load skill-local references only after the request
  matches the skill.
- **Safety First**: keep mutation, push, deploy, delete, and external-state
  gates in the main skill file.
- **Routing Doctor**: validate that core routing registries stay reachable,
  generic, and separate from payload behavior.
- **Token-Aware Skill Audits**: identify skills that are too long, too
  ambiguous, or missing clear non-trigger rules.

Current milestone: see [`MILESTONE.md`](MILESTONE.md).

Repository roles:

| Repository | Role |
|------------|------|
| `knitten` | Knitten Core. Contains AH routing skills, output-path scripts, document templates, and boundary rules. |
| Payload plugins | Skill payloads. Contain concrete project, domain, or personal skills and skill-owned support files. |
| `knitten-archive` | Old combined repository kept for history after the core/payload split. |

Quick rule: if the change affects where work goes or how AH workflows are
structured, edit `knitten`. If the change affects what a specific skill does,
edit the payload plugin that owns that skill.

## Contents

| Path | Purpose |
|------|---------|
| `.codex-plugin/plugin.json` | Codex plugin manifest. |
| `MILESTONE.md` | Top-level routing milestone and roadmap. |
| `SYSTEM.md` | Routing and plugin boundary contract. |
| `agent/AGENTS.md` | Codex adapter entry document. |
| `skills/` | Generic Agent Hub routing and workflow skills. |
| `document-templates/` | Generic Agent Hub document templates. |
| `bin/knitten-resolve-output` | Payload-helper-facing path/output routing shim. |
| `scripts/doctor.mjs` | Check source and personal-marketplace installation state. |
| `scripts/materialize-local-plugin.mjs` | Register a local physical copy in the personal marketplace. |
| `scripts/resolve-output.mjs` | Route durable target docs and hub-owned AH local outputs. |
| `docs/specs/` | Design notes for the routing system and runtime. |
| `docs/guidelines/skill-authoring.md` | Skill authoring rules for token-aware activation shells. |
| `docs/guidelines/routing-integration.md` | Rules for connecting payload routers and leaf skills. |

## Validate

```bash
python3 <path-to-validate_plugin.py> .
node --check scripts/doctor.mjs
node --check scripts/resolve-output.mjs
```

## Local Codex Installation

Knitten Core is the core plugin. Payload plugins are installed separately in
the same local marketplace when their skills are needed:

```text
knitten@knitten-local
<payload-plugin>@knitten-local
```

Codex reads the local marketplace from this config:

```toml
[marketplaces.knitten-local]
source_type = "local"
source = "<home-directory>"

[plugins."knitten@knitten-local"]
enabled = true

[plugins."<payload-plugin>@knitten-local"]
enabled = true
```

The marketplace manifest lives at:

```text
<home-directory>/.agents/plugins/marketplace.json
```

Runtime plugin copies live under:

```text
<home-directory>/plugins/knitten
<home-directory>/plugins/<payload-plugin>
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

Install or refresh payload plugins from their own repositories using their own
plugin documentation.

Restart Codex after changing `~/.codex/config.toml` or refreshing plugin
installations. Existing sessions may keep the old skill list until a new
session starts.

## Path Rules

Active Knitten Core docs and helper scripts should avoid personal absolute
paths. Use placeholders such as `<home-directory>`, `<plugins-root>`, and
`<payload-plugin>`, or prefer explicit environment variables before `$HOME`
fallbacks in executable helpers.

Historical specs may keep old local paths as evidence. Domain payload plugins
may document private config paths when those paths are the actual external
contract.

## License

MIT License. See `LICENSE`.

## Boundary

Domain workflows, domain output registries, and artifact-pack lifecycle tools
belong in payload plugins unless they are intentionally promoted into this core.
Knitten Core owns generic AH routing, plugin boundaries, and the generic
path/output runtime.
