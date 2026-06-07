# Knitten

Knitten is the core Codex plugin for Agent Hub workflows.

Use this repository when you need to change shared Agent Hub behavior: how a
task is routed, where a generated spec or plan is saved, where temporary local
outputs are written, or which plugin is allowed to own a workflow.

Agent Hub (AH) is the workflow layer for Codex-assisted development tasks. It
covers the common steps around preparing work, drafting specs, implementing,
reviewing, creating PRs, responding to reviews, and wrapping up.

Knitten keeps only the pieces that should work the same across projects. It
does not contain the full private skill library. Domain skills live in payload
plugins, especially Knitten All Skills (KSA).

Repository roles:

| Repository | Role |
|------------|------|
| `knitten` | Shared core. Contains AH routing skills, output-path scripts, document templates, and boundary rules. |
| `knitten-all-skills` (KSA) | Private skill payload. Contains concrete skills such as Shotloom, frontend, Obsidian, Unreal, VRM, review, writing, and learning-log helpers. |
| `knitten-archive` | Old combined repository kept for history after the core/payload split. |

Quick rule: if the change affects where work goes or how AH workflows are
structured, edit `knitten`. If the change affects what a specific skill does,
edit KSA.

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

Knitten is the core plugin. `knitten-all-skills` is the DLC-style payload
plugin. In normal local use, both should appear in the same `knitten-local`
marketplace:

```text
knitten@knitten-local
knitten-all-skills@knitten-local
```

Codex reads the local marketplace from this config:

```toml
[marketplaces.knitten-local]
source_type = "local"
source = "/Users/deemooooooooo"

[plugins."knitten@knitten-local"]
enabled = true

[plugins."knitten-all-skills@knitten-local"]
enabled = true
```

The marketplace manifest lives at:

```text
/Users/deemooooooooo/.agents/plugins/marketplace.json
```

Runtime plugin copies live under:

```text
/Users/deemooooooooo/plugins/knitten
/Users/deemooooooooo/plugins/knitten-all-skills
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

Then install or refresh the payload plugin from the sibling
`knitten-all-skills` repository:

```bash
cd /Users/deemooooooooo/Desktop/www/plugins/knitten-all-skills
node scripts/materialize-local-plugin.mjs
node scripts/doctor.mjs
codex plugin add knitten-all-skills@knitten-local
codex plugin list
```

Restart Codex after changing `~/.codex/config.toml` or refreshing plugin
installations. Existing sessions may keep the old skill list until a new
session starts.

## License

MIT License. See `LICENSE`.

## Boundary

Domain workflows, domain output registries, and artifact-pack lifecycle tools
belong in payload plugins unless they are intentionally promoted into this core.
Knitten owns generic AH routing, plugin boundaries, and the generic path/output
runtime.
