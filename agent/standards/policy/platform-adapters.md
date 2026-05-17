---
status: accepted
platforms: all
portability: shared
---
# Platform Adapter Standard

Defines how shared agent-hub rules, standards, skills, and commands are consumed by multiple agent harnesses.

Reserved system terms live in `../../../docs/reference/system-glossary.md`.

## Core contract

| Term | Rule |
|------|------|
| Canonical policy | Shared policy every harness must follow |
| Shared layer | Canonical instruction under `agent/{rules,standards,skills,commands}` |
| Entry document | Harness adapter that loads `SYSTEM.md` first |
| Platform adapter | Harness-specific translation of shared intent into available tools and syntax |
| Platform mechanic | Tool name, import syntax, slash command, approval model, subagent API, or path loaded by one harness |

Canonical policy and shared layers win over adapters. If an adapter conflicts with them, fix the adapter.

## Frontmatter fields

Add these fields during portability migration:

| Field | Values | Meaning |
|-------|--------|---------|
| `platforms` | `all` | Intent applies to every harness that loads this repo |
| `platforms` | `claude` | Requires Claude Code mechanics |
| `platforms` | `codex` | Requires Codex mechanics |
| `platforms` | `claude,codex` | Applies to the named harnesses only |
| `portability` | `shared` | Plain instruction; no harness mechanic required |
| `portability` | `adapter` | Shared intent exists; execution needs per-harness translation |
| `portability` | `harness-specific` | Only the named platform executes this artifact |

## Classification rules

| If artifact contains | Set |
|----------------------|-----|
| Plain policy, review rubric, naming rule, or decision table | `platforms: all`, `portability: shared` |
| Claude `@` imports, `allowed-tools`, `$ARGUMENTS`, `Task`, or slash-command invocation | `platforms: claude`, `portability: harness-specific` |
| A procedure with useful intent but platform-specific tool names | `platforms: all`, `portability: adapter` |
| `AGENTS.md` behavior, Codex approval flow, or Codex-specific tool semantics | `platforms: codex`, `portability: harness-specific` |

## Adapter duties

| Harness | Entry document | Duty |
|---------|----------------|------|
| Claude Code | `CLAUDE.md` | Import shared layers, then apply Claude Code mechanics |
| Codex | `AGENTS.md` | Read shared layers, translate Claude Code mechanics only when intent applies |
| New harness | New root entry document | Register in `SYSTEM.md`, load `SYSTEM.md` first, keep shared policy out of the entry document |

## New harness workflow

When adding a harness adapter:

1. Create one root entry document.
2. Make its first shared-policy read point to `SYSTEM.md`.
3. Add the harness to `agent/config/agent-hub.json` `harnesses`.
4. Add the entry document row to `SYSTEM.md`.
5. Add only harness mechanics to the entry document.
6. Run `node scripts/validate-llm-first.mjs`.

The `agent-hub` validator checks that manifest harnesses point to existing entry documents and that `SYSTEM.md` lists them.

## Migration rule

Classify before moving. Do not move `agent/rules`, `agent/standards`, `agent/skills`, or `agent/commands` into a neutral folder until:

1. The artifact has `platforms:` and `portability:` metadata.
2. Every internal reference has a replacement path or compatibility shim.
3. `scripts/validate-llm-first.mjs` checks the new path.
