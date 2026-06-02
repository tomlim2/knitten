# Knitten System

## Contract

| Rule | Meaning |
|------|---------|
| Plugin source | The checkout is loaded by Codex through `.codex-plugin/plugin.json`. |
| Routing core | This repository contains plugin identity, entry guidance, validation, local registration, and generic AH routing. |
| Path/output routing | Durable documents route to the target workspace; generic local AH outputs route to the Knitten hub. |
| Self-contained source | Operation does not require a second harness-specific source tree. |
| Payload boundary | Skills, standards, domain workflows, and working documents live in separate payload plugins. |

## Load

Codex reads plugin metadata from `.codex-plugin/plugin.json`.

## Runtime Assumptions

Do not require another harness runtime, private local paths, domain service
credentials, or legacy source checkouts for this plugin to load.
