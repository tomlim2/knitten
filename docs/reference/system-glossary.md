---
status: accepted
load: on-demand
standard: ../../agent/standards/policy/llm-first-docs.md
---

# System Glossary

Reserved system terms for `caol-ila`. Use this file when editing `SYSTEM.md`, entry documents, platform adapter docs, agent hub plans, manifests, or validators.

Do not introduce a synonym for a term in this table unless the glossary changes in the same commit.

| Term | Meaning | Use for | Do not use for |
|------|---------|---------|----------------|
| canonical policy | Shared policy every harness must follow | `SYSTEM.md` and policy that applies across harnesses | Machine-local state or generated output |
| shared layer | Shared rules, standards, skills, and commands below `agent/` | Reusable policy or procedure loaded by multiple harnesses | Harness-only mechanics |
| agent root | Canonical repository directory for shared agent artifacts | `agent/` and path-ownership docs | `~/.claude/` deploy target or root entry documents |
| entry document | Harness-specific cold-start file that reads `SYSTEM.md` first | `CLAUDE.md`, `AGENTS.md`, and future root entry files | Long policy copies |
| harness | Agent runtime that reads and executes repo instructions | Claude Code, Codex, or another agent runtime | A single file, command, or adapter |
| adapter | Translation from shared intent to harness mechanics | Tool syntax, imports, approval flow, slash-command behavior | New policy |
| platform mechanic | Runtime-specific behavior exposed by one harness | Claude `@` imports, Codex approval flow, tool names | Shared meaning |
| agent hub | Repo shape that routes multiple harnesses through one canonical policy system | caol-ila's multi-agent operating model | A marketing README or generic index |
| manifest | Machine-readable registry that connects hub parts | `agent/config/agent-hub.json` | Prose explanation |
| registry | Machine-readable JSON that owns managed values | Config enums, budgets, taxonomy, audit policy | Narrative docs |
| validator | Script that enforces contracts and catches drift | `scripts/validate-llm-first.mjs` checks | Human-only review |
| generated document | Markdown block or file derived from a registry or validator output | README inventory, validator check list, optional `AGENT-HUB.md` sections | Manually maintained prose |
| validated view | Human-readable view checked against a canonical registry | Tables copied from `agent-hub.json` and validator-checked | Unchecked duplicate data |
| deploy target | Runtime path read by a harness | `~/.claude/` paths and future harness install paths | Canonical repo ownership |
| runtime path policy | Rule for classifying a runtime path's ownership and git policy | Durable, private, cache, session, or generated runtime paths | The path contents themselves |
| canonical owner | File or registry that owns the editable value | Where an agent must edit first | Mirrors, shims, or generated views |
| managed artifact | File, folder, registry, generated document, or runtime path governed by the hub | Inventory and drift checks | Arbitrary repo content |
| task route | Metadata-backed decision that a task belongs to one or more route domains | Selecting task-specific context | Loading broad catalogs before classification |
| route domain | Technical or knowledge area used for context routing | `unreal`, `rust`, `web`, or `obsidian` routing | Registry `domain` prose in `agent-hub.json` |
| repo key | Repository identifier from `repo-paths.json` | Routing and machine-local path lookup | Human project names outside the registry |
| task type | Work mode such as `implementation`, `review`, `git`, `authoring`, or `research` | Separating user intent from route domain | Technology or repository identity |
| context profile | Named route bundle with domains, repo keys, task types, languages, frameworks, and max bytes | Loading the smallest matching task context | Canonical policy |
| route evidence | User words, repo path, file extension, named skill, command, or frontmatter that supports a task route | Routing before reading high-cost bodies | Guessing without checking compact indexes |
| exclusion | Route domain that must stay unloaded unless explicitly requested | Preventing sibling-domain context from loading | Security denial or permission policy |
