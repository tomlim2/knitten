---
status: active
created: 2026-05-31
updated: 2026-05-31
owner: agent-hub
target-date:
---

# Skill Output Contract System

## Purpose

Group the work that gives LLM-operated skills one contract for output purpose,
destination, template, format, lifecycle, ownerSkill, and validation.

## Scope

| In scope | Out of scope |
|---|---|
| Registry for skill output contracts. | Replacing existing path registries. |
| Resolver that returns destination, template, format, and section metadata. | Replacing `local-artifact-paths.json`. |
| Initial contracts for local handoff, proposed spec, and Design Plan section. | Migrating every output-writing skill at once. |
| Validator coverage for the registry. | Automatic template filling or body generation. |

## Specs

| Spec | Status | Role |
|------|--------|------|
| `output-contract-registry.md` | tracked by parent | Defines registry, resolver, initial outputs, validation, and adoption plan. |

## Progress

| Phase | State | Evidence |
|-------|-------|----------|
| Spec | done | `docs/plans/completed/output-contract-registry.md` |
| Registry implementation | done | `agent/config/outputs.json` |
| Resolver implementation | done | `agent/lib/resolve-output.mjs` |
| Validator integration | done | `scripts/validate-llm-first.mjs --check outputs` |
| First consumer adoption | done | `agent/skills/ah-manage-spec/SKILL.md` |
| Temporary file boundary review | done | `local-session-handoff` resolves under `.agent-local/reports`; repo docs resolve only through explicit `repo-template` output rows. |
| Follow-up skill adoption | todo | Add output rows only when a skill needs a path/template pair. |

## Acceptance Criteria

| ID | Criteria |
|---|---|
| AC1 | `outputs.json` exists and includes local handoff, proposed spec, and Design Plan section rows. |
| AC2 | Resolver returns destination plus template for file outputs. |
| AC3 | Resolver returns parent path plus section plus template for section outputs. |
| AC4 | Validator checks the output registry. |
| AC5 | `ah-manage-spec` names output ids for proposed specs and Design Plan sections. |

## Open Decisions

| Decision | Default |
|----------|---------|
| Should `doc-path` outputs read config directly or call the existing resolver? | Call `ah-resolve-doc-path` first. |
| Should all Obsidian templates get output rows now? | No. Add rows only when a skill needs the pair. |
| Should output rows include lifecycle status? | No. Lifecycle remains with owner skills and lifecycle docs. |

## Blockers

| Blocker | Impact |
|---------|--------|
| None. | Implementation can start after spec review. |

## External Mirrors

None.

## Parent

[knitten-refactor.md](knitten-refactor.md)
