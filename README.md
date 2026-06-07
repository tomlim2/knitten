# Knitten Core

Knitten Core is the core Codex plugin and operating layer for Agent Hub
workflows.

Use this repository when you need to change shared Agent Hub behavior: how a
task is routed, where a generated spec or plan is saved, where temporary local
outputs are written, or which plugin is allowed to own a workflow.

Agent Hub (AH) is the workflow layer for Codex-assisted development tasks. It
covers the common steps around preparing work, drafting specs, implementing,
reviewing, creating PRs, responding to reviews, and wrapping up.

Knitten Core keeps only the pieces that should work the same across projects.
It does not contain the full private skill library. Domain skills live in
payload plugins that are installed separately.

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
| `SYSTEM.md` | Routing and plugin boundary contract. |
| `agent/AGENTS.md` | Codex adapter entry document. |
| `skills/` | Generic Agent Hub routing and workflow skills. |
| `document-templates/` | Generic Agent Hub document templates. |
| `bin/knitten-resolve-output` | Payload-helper-facing path/output routing shim. |
| `scripts/doctor.mjs` | Check source and personal-marketplace installation state. |
| `scripts/materialize-local-plugin.mjs` | Register a local physical copy in the personal marketplace. |
| `scripts/resolve-output.mjs` | Route durable target docs and hub-owned AH local outputs. |
| `docs/specs/` | Design notes for the routing system and runtime. |

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
source = "/Users/deemooooooooo"

[plugins."knitten@knitten-local"]
enabled = true

[plugins."<payload-plugin>@knitten-local"]
enabled = true
```

The marketplace manifest lives at:

```text
/Users/deemooooooooo/.agents/plugins/marketplace.json
```

Runtime plugin copies live under:

```text
/Users/deemooooooooo/plugins/knitten
/Users/deemooooooooo/plugins/<payload-plugin>
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

## License

MIT License. See `LICENSE`.

## Boundary

Domain workflows, domain output registries, and artifact-pack lifecycle tools
belong in payload plugins unless they are intentionally promoted into this core.
Knitten Core owns generic AH routing, plugin boundaries, and the generic
path/output runtime.
