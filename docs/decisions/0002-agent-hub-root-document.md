---
status: accepted
date: 2026-05-10
---

# Agent Hub Root Document

## Decision

Create `AGENT-HUB.md` as a thin root hub document.

| Rule | Effect |
|------|--------|
| Thin only | The document links to canonical policy and manifest owners |
| Generated inventory | Hub lists are generated from `agent/config/agent-hub.json` |
| No policy prose | `SYSTEM.md` remains canonical policy |
| Validator-owned | Generated hub inventory is checked by `scripts/validate-llm-first.mjs` |

## Context

`caol-ila` now has `agent/config/agent-hub.json`. Agents need a cold-start-readable hub overview without treating the manifest JSON as prose policy.

`README.md` answers "what exists in the repo". `LOOKUP.md` answers "where is X". `AGENT-HUB.md` answers "how do harnesses, registries, generated documents, runtime paths, and validators connect".

## Accepted Rule

| Topic | Owner |
|-------|-------|
| Canonical policy | `SYSTEM.md` |
| Hub routing data | `agent/config/agent-hub.json` |
| Hub root overview | `AGENT-HUB.md` |
| Generated hub inventory | `scripts/validate-llm-first.mjs` |

## Consequences

- `AGENT-HUB.md` must stay thin.
- Any duplicated hub list must be generated or validator-checked.
- If `AGENT-HUB.md` becomes explanatory policy, move that policy to `SYSTEM.md` or a shared layer.
