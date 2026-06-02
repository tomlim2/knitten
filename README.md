# Knitten

Knitten is the Agent Hub routing system for Codex plugins.

It routes workflow intent, output paths, and plugin boundaries. Its core is the
generic AH path/output runtime: durable documents stay with the target
workspace, local operational outputs go to the Knitten hub, and payload plugins
keep their domain-specific behavior.

AH means Agent Hub: a generic routing layer for preparing, implementing,
reviewing, managing PRs, wrapping up agent-assisted work, and deciding where the
resulting records belong.

Repository roles:

| Repository | Role |
|------------|------|
| `knitten` | Public Agent Hub routing system and path/output runtime. |
| `knitten-all-skills` | Private payload plugin for full skill coverage. |
| `knitten-archive` | Historical archive of the former combined repository. |

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

## Local Registration

```bash
node scripts/materialize-local-plugin.mjs
node scripts/doctor.mjs
bin/knitten-resolve-output
python3 <path-to-validate_plugin.py> ~/plugins/knitten
```

The materialized copy receives a local `+codex.<timestamp>` version suffix. The
source manifest stays stable.

## License

Apache License 2.0. See `LICENSE`.

## Boundary

Domain workflows, domain output registries, and artifact-pack lifecycle tools
belong in payload plugins unless they are intentionally promoted into this core.
Knitten owns generic AH routing, plugin boundaries, and the generic path/output
runtime.
