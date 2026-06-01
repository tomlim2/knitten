# Knitten

Knitten is a minimal Codex plugin shell.

It provides plugin identity, a small policy entry, a Codex adapter document, and
a local materialization helper for registering the plugin in the Codex personal
marketplace.

## Contents

| Path | Purpose |
|------|---------|
| `.codex-plugin/plugin.json` | Codex plugin manifest. |
| `SYSTEM.md` | Minimal plugin boundary contract. |
| `agent/AGENTS.md` | Codex adapter entry document. |
| `skills/knitten-status/` | Minimal plugin health/status skill. |
| `scripts/doctor.mjs` | Check source and personal-marketplace installation state. |
| `scripts/materialize-local-plugin.mjs` | Register a local physical copy in the personal marketplace. |
| `scripts/resolve-paths.mjs` | Resolve plugin and active workspace path roots. |
| `docs/specs/` | Design notes for the minimal plugin shell. |

## Validate

```bash
python3 <path-to-validate_plugin.py> .
node --check scripts/doctor.mjs
```

## Local Registration

```bash
node scripts/materialize-local-plugin.mjs
node scripts/doctor.mjs
node scripts/resolve-paths.mjs
python3 <path-to-validate_plugin.py> ~/.agents/plugins/plugins/knitten
```

The materialized copy receives a local `+codex.<timestamp>` version suffix. The
source manifest stays stable.

## License

Apache License 2.0. See `LICENSE`.

## Boundary

Skills, standards, domain workflows, output systems, and artifact-pack lifecycle
tools belong in payload plugins unless they are intentionally promoted into this
minimal core later.
