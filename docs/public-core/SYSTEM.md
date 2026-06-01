# SYSTEM.md

Knitten is a Codex plugin core.

## Contract

| Rule | Meaning |
|------|---------|
| Plugin source | The checkout is loaded by Codex through `.codex-plugin/plugin.json`. |
| No harness deploy dependency | Operation does not require a separate runtime mirror folder. |
| Pack boundary | Optional skills, standards, templates, and working documents live in plugin or artifact-pack payload repositories. |
| Core boundary | This repo keeps the minimal policy, registry, and resolver skeleton needed before optional payloads load. |

## Load

Codex reads plugin metadata from `.codex-plugin/plugin.json`. Skills are loaded
from plugin-declared `skills/` directories when present.

## Legacy

The legacy integration source is `knitten-all`. Do not add new runtime setup
instructions here that require `knitten-all`.
