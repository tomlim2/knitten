# Knitten

Knitten is the core Codex plugin for generic Agent Hub (AH) development
workflows.

It provides plugin identity, a small policy entry, a Codex adapter document,
generic Agent Hub workflow skills, a plugin-native output resolver, and local
materialization helpers for registering the plugin in the Codex personal
marketplace.

AH means Agent Hub: a generic workflow layer for preparing, implementing,
reviewing, managing PRs, and wrapping up agent-assisted work.

Repository roles:

| Repository | Role |
|------------|------|
| `knitten` | Public core plugin and generic runtime. |
| `knitten-all-skills` | Private payload plugin for full skill coverage. |
| `knitten-archive` | Historical archive of the former combined repository. |

## Contents

| Path | Purpose |
|------|---------|
| `.codex-plugin/plugin.json` | Codex plugin manifest. |
| `SYSTEM.md` | Minimal plugin boundary contract. |
| `agent/AGENTS.md` | Codex adapter entry document. |
| `skills/` | Generic Knitten and Agent Hub workflow skills. |
| `document-templates/` | Generic Agent Hub document templates. |
| `bin/knitten-resolve-output` | Payload-helper-facing output runtime shim. |
| `scripts/doctor.mjs` | Check source and personal-marketplace installation state. |
| `scripts/materialize-local-plugin.mjs` | Register a local physical copy in the personal marketplace. |
| `scripts/resolve-output.mjs` | Resolve durable workspace docs and hub-owned AH local outputs. |
| `docs/specs/` | Design notes for the plugin core and runtime. |

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
Knitten owns generic workflow skills and the generic output runtime.
