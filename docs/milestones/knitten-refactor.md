---
status: completed
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

Knitten stores more than documents. It makes LLM-operated
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
| [skill-operating-system.md](../plans/completed/skill-operating-system.md) | completed | Define the simplified top-level model for LLM skill discovery, execution, outputs, validation, and handoff. |
| [output-contract-registry.md](../plans/completed/output-contract-registry.md) | completed | First concrete output contract layer: purpose to destination plus template. |
| [skill-output-location-architecture.md](../plans/completed/skill-output-location-architecture.md) | completed | Define the full Knitten output/path architecture and naming boundaries. |
| [skill-output-lifecycle.md](../plans/completed/skill-output-lifecycle.md) | completed | Define lifecycle states for each output: create, temporary, durable, promoted, completed, archived, or deleted. |
| [skill-output-contract-adoption.md](../plans/completed/skill-output-contract-adoption.md) | completed | Define how skills reference output ids instead of hardcoded path/template pairs. |
| [skill-output-validator-strategy.md](../plans/completed/skill-output-validator-strategy.md) | completed | Define validator strategy for output contracts, paths, templates, lifecycle, and adoption drift. |
| [knitten-refactor-closure-review.md](../plans/completed/knitten-refactor-closure-review.md) | completed | Define the completion review that decides whether this milestone can close. |

## Progress

| Phase | State | Evidence |
|-------|-------|----------|
| Skill operating model | done | `docs/plans/completed/skill-operating-system.md` |
| Skill operating system spec | done | `docs/plans/completed/skill-operating-system.md` |
| Skill template assets | done | `agent/document-templates/agent-hub/skill.md` and `agent/document-templates/agent-hub/skill-html-like.md`. |
| Output inventory | done | `docs/plans/completed/skill-operating-system.md` output taxonomy. |
| Location inventory | done | `docs/plans/completed/skill-output-location-architecture.md` path family matrix. |
| Output contract layer | done | `docs/plans/completed/output-contract-registry.md`, `agent/config/outputs.json`, `agent/lib/resolve-output.mjs`, and `scripts/validate-llm-first.mjs --check outputs`. |
| Output lifecycle | done | `docs/plans/completed/skill-output-lifecycle.md` lifecycle states and gates. |
| Skill contract adoption | done | `docs/plans/completed/skill-output-contract-adoption.md` adoption order and gates. |
| Validator strategy | done | `docs/plans/completed/skill-output-validator-strategy.md` drift map, check triggers, and validation matrix. |
| Closure review | done | `docs/plans/completed/knitten-refactor-closure-review.md` completion evidence matrix and status rules. |
| Milestone review | done | Reviewed with [milestone-review.md](../guidelines/milestone-review.md); current routing verdict: ready after template assets were classified as assets, not a standalone spec. |
| Migration order | done | Migration Order section in `docs/plans/completed/skill-operating-system.md`. |

## Closure Review

| Check | Result | Evidence |
|-------|--------|----------|
| Direction | pass | Purpose frames Knitten as an LLM skill operating system. |
| Scope | pass | Scope excludes full skill migration, full taxonomy redesign, and one mega-resolver. |
| Naming | pass | Specs use skill operating system, output contract, lifecycle, validator, and handoff terms. |
| Traceability | pass | Each acceptance criterion maps to a completed spec or implemented artifact. |
| Executability | pass | Specs define output ids, templates, validators, lifecycle gates, and adoption order. |
| Expansion control | pass | Remaining work is routed to follow-up milestones instead of expanding this milestone. |

| Field | Value |
|-------|-------|
| Verdict | ready |
| Status recommendation | completed |
| Blocking follow-ups | none |
| Non-blocking next work | `output-contract-system` closure check; `agent-artifact-pack-system`; `artifact-inventory-reviewed-decision-application`. |

## Acceptance Evidence

| ID | Evidence |
|----|----------|
| AC1 | `docs/plans/completed/skill-operating-system.md` defines discovery, execution, outputs, validation, and handoff. |
| AC1a | `docs/plans/completed/output-contract-registry.md`, `agent/config/outputs.json`, and `agent/lib/resolve-output.mjs` bind purpose, path, format, lifecycle, owner skill, and validator. |
| AC1b | `docs/plans/completed/skill-output-lifecycle.md` and `docs/plans/completed/skill-output-location-architecture.md` cover documents, local JSON packets, images, videos, logs, runtime files, and exports. |
| AC1c | Purpose and `docs/plans/completed/skill-operating-system.md` frame the repository as an LLM skill-friendly operating system. |
| AC1d | `agent/document-templates/agent-hub/skill.md` and `agent/document-templates/agent-hub/skill-html-like.md` exist as skill template assets. |
| AC2 | `agent/config/outputs.json`, `agent/lib/resolve-output.mjs`, and `docs/plans/completed/skill-output-contract-adoption.md` define output-id based discovery. |
| AC3 | `local-session-handoff` output contract and `docs/reference/local-report-inbox.md` keep temporary handoff JSON local-only. |
| AC4 | `docs/plans/completed/skill-output-lifecycle.md` defines promotion paths into durable artifacts. |
| AC5 | `scripts/validate-llm-first.mjs` checks output contracts, document templates, and spec lifecycle bindings. |

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

None.

## Closed Decisions

| Decision | Resolution |
|----------|------------|
| One resolver covers every path | No. Path owners stay separate; output contracts bind destination plus template. |
| Every skill migrates immediately | No. Skills migrate when they write or change output documents. |
| Local JSON packets count as documents | Yes. They are temporary documents with local-only lifecycle rules. |

## Blockers

| Blocker | Impact |
|---------|--------|
| None. | Closure review found no blocking follow-up. |

## External Mirrors

None.
