---
status: proposed
platforms: all
portability: shared
---
# Platform Adapter Standard

Defines how shared `caol-ila` rules, standards, skills, and commands are consumed by multiple agent harnesses.

## Core contract

| Term | Rule |
|------|------|
| Shared source | Canonical instruction under `SYSTEM.md` or `claude/{rules,standards,skills,commands}` |
| Entry document | Harness adapter that loads `SYSTEM.md` first |
| Platform adapter | Harness-specific translation of shared intent into available tools and syntax |
| Platform mechanic | Tool name, import syntax, slash command, approval model, subagent API, or path loaded by one harness |

Shared source wins over adapters. If an adapter conflicts with shared source, fix the adapter.

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
| Codex-only order queue, `AGENTS.md` behavior, or Codex CLI semantics | `platforms: codex`, `portability: harness-specific` |

## Adapter duties

| Harness | Entry document | Duty |
|---------|----------------|------|
| Claude Code | `CLAUDE.md` | Import shared layers, then apply Claude Code mechanics |
| Codex | `AGENTS.md` | Read shared layers, translate Claude-only mechanics only when intent applies |
| New harness | New root entry document | Register in `SYSTEM.md`, load `SYSTEM.md` first, keep shared policy out of the entry document |

## Migration rule

Classify before moving. Do not move `claude/rules`, `claude/standards`, `claude/skills`, or `claude/commands` into a neutral folder until:

1. The artifact has `platforms:` and `portability:` metadata.
2. Every internal reference has a replacement path or compatibility shim.
3. `scripts/validate-llm-first.mjs` checks the new path.
