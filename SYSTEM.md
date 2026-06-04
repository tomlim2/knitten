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

## Mechanical Finding Capture

Use `knitten:ah-report-finding` only for mechanical findings discovered while
using Knitten or payload plugins such as `knitten-all-skills`.

A mechanical finding is a reproducible or directly verifiable system mismatch:

- a documented path, script, config, skill, or command does not exist
- a skill points at a stale config or helper location
- source, materialized plugin copy, or Codex plugin cache drift apart
- a doctor, validator, or install command fails or contradicts another check
- plugin boundary rules and repository contents disagree

Do not use `ah-report-finding` for general improvement ideas, naming/style
preferences, speculative concerns, one-off confusion, or user-directed scope
changes. Mention those in the task summary instead.
