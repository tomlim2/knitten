---
status: active
created: 2026-05-31
updated: 2026-05-31
owner: agent-hub
target-date:
---

# Knitten Skill Operating System Refactor

## Purpose

Refactor Knitten as an LLM skill-friendly operating system. The main operating
axis is:

```text
skill operating system = skill discovery + skill execution + output contracts + validation + handoff
output contract = purpose + path + format + lifecycle + ownerSkill + validator
```

Knitten's goal is not just to store documents. It should make LLM-operated
skills easier to discover, execute, hand off, validate, and refactor. Skills
choose actions. Operating contracts make those actions discoverable,
repeatable, reviewable, and handoff-friendly. Output contracts are one operating
contract type: they define what to leave behind, where it lives, which
format/template it uses, how long it lasts, who owns it, and what validates it.

## Scope

| In scope | Out of scope |
|---|---|
| Define Knitten as an LLM skill operating system with discoverable skill layers, contracts, outputs, validation, and handoff. | Turn Knitten into a general application framework. |
| Prepare the first two skill template assets: official recommended Markdown and experimental HTML-like Markdown. | Migrate every existing skill template immediately. |
| Clarify output roles: rules, standards, skills, templates, specs, milestones, references, local JSON packets, images, videos, logs, and exports. | Rewrite all existing artifacts in one pass. |
| Clarify path layers for git-tracked repo docs, `.agent-local`, vault/staging, private, and runtime files. | Replace every path resolver with one mega-resolver. |
| Introduce output contracts that bind destination plus template. | Auto-fill or generate all output bodies. |
| Make skill operation more LLM-friendly through explicit inputs, outputs, contracts, and validation. | Replace agent judgment with rigid automation. |
| Keep skills thin: route, decide, write by output id, validate. | Convert every skill in the first implementation PR. |
| Add validators where contracts can drift. | Full taxonomy redesign. |

## Specs

| Spec | Status | Role |
|------|--------|------|
| [skill-operating-system.md](../plans/proposed/skill-operating-system.md) | proposed | Define the simplified top-level model for LLM skill discovery, execution, outputs, validation, and handoff. |
| [output-contract-registry.md](../plans/proposed/output-contract-registry.md) | proposed | First concrete output contract layer: purpose to destination plus template. |
| [skill-output-location-architecture.md](../plans/proposed/skill-output-location-architecture.md) | proposed | Define the full Knitten output/path architecture and naming boundaries. |
| [skill-output-lifecycle.md](../plans/proposed/skill-output-lifecycle.md) | proposed | Define lifecycle states for each output: create, temporary, durable, promoted, completed, archived, or deleted. |
| [skill-output-contract-adoption.md](../plans/proposed/skill-output-contract-adoption.md) | proposed | Define how skills reference output ids instead of hardcoded path/template pairs. |
| [skill-output-validator-strategy.md](../plans/proposed/skill-output-validator-strategy.md) | proposed | Define validator strategy for output contracts, paths, templates, lifecycle, and adoption drift. |
| [knitten-refactor-closure-review.md](../plans/proposed/knitten-refactor-closure-review.md) | proposed | Define the completion review that decides whether this milestone can close. |

## Progress

| Phase | State | Evidence |
|-------|-------|----------|
| Skill operating model | proposed | `docs/plans/proposed/skill-operating-system.md` |
| Skill operating system spec | proposed | `docs/plans/proposed/skill-operating-system.md` |
| Skill template assets | done | `agent/document-templates/agent-hub/skill.md` and `agent/document-templates/agent-hub/skill-html-like.md`. |
| Output inventory | proposed | `docs/plans/proposed/skill-operating-system.md` output taxonomy. |
| Location inventory | proposed | `docs/plans/proposed/skill-output-location-architecture.md` path family matrix. |
| Output contract layer | done | `docs/plans/proposed/output-contract-registry.md`, `agent/config/outputs.json`, `agent/lib/resolve-output.mjs`, and `scripts/validate-llm-first.mjs --check outputs`. |
| Output lifecycle | proposed | `docs/plans/proposed/skill-output-lifecycle.md` lifecycle states and gates. |
| Skill contract adoption | proposed | `docs/plans/proposed/skill-output-contract-adoption.md` adoption order and gates. |
| Validator strategy | proposed | `docs/plans/proposed/skill-output-validator-strategy.md` drift map, check triggers, and validation matrix. |
| Closure review | proposed | `docs/plans/proposed/knitten-refactor-closure-review.md` completion evidence matrix and status rules. |
| Milestone review | done | Reviewed with [milestone-review.md](../guidelines/milestone-review.md); current routing verdict: ready after template assets were classified as assets, not a standalone spec. |
| Migration order | proposed | Migration Order section in `docs/plans/proposed/skill-operating-system.md`. |

## Acceptance Criteria

| ID | Criteria |
|---|---|
| AC1 | Knitten has one documented architecture for an LLM skill operating system. |
| AC1a | Outputs are defined as purpose, path, template, lifecycle, validator, and ownerSkill. |
| AC1b | Output types cover markdown/json documents, images, videos, logs, runtime files, and exports without forcing them into one document-only model. |
| AC1c | The architecture is explicitly framed as an LLM skill-friendly operating system, not only an artifact cleanup project. |
| AC1d | The first spec prepares both an official recommended skill template asset and an experimental HTML-like skill template asset. |
| AC2 | Every new output-writing skill can discover where to write and which template or format to use without hardcoding both. |
| AC3 | Temporary LLM handoff remains JSON and local-only. |
| AC4 | Durable operational knowledge has an explicit promotion path into rules, standards, skills, templates, specs, milestones, or references. |
| AC5 | Validators catch broken path/template bindings before skills consume them. |

## Open Decisions

| Decision | Default |
|----------|---------|
| Should one resolver cover every path? | No. Keep path owners separate; add output contracts as a binding layer. |
| Should every skill be migrated immediately? | No. Migrate as each skill writes or changes documents. |
| Should local JSON packets be considered documents? | Yes, but temporary documents with different format and lifecycle rules. |

## Blockers

| Blocker | Impact |
|---------|--------|
| None. | Start with specs and small output-contract implementation. |

## External Mirrors

None.
