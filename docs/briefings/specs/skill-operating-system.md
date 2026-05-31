---
status: intake
created: 2026-05-31
updated: 2026-05-31
owner: agent-hub
spec: docs/plans/proposed/skill-operating-system.md
---

# Spec Intake: skill-operating-system

## User Request

Create the parent architecture spec for the Knitten refactor.

## Goal

Define Knitten as an LLM skill-friendly operating system before adding more
location, lifecycle, and adoption specs.

## Route

| Field | Value |
|-------|-------|
| selected route | `ah-manage-spec create skill-operating-system` |
| candidate routes | `ah-manage-milestone update knitten-refactor`; output-contract follow-up |
| referenced skills | `ah-manage-spec`, `ah-manage-milestone` |

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| file | `SYSTEM.md` | Repository charter: LLM-first agent hub. |
| standard | `agent/standards/policy/llm-first-docs.md` | Writing constraints for agent-facing docs. |
| milestone | `docs/milestones/knitten-refactor.md` | Parent scope and acceptance criteria. |
| spec | `docs/plans/proposed/output-contract-registry.md` | First implemented child contract. |
| reference | `docs/reference/local-report-inbox.md` | Temporary JSON handoff boundary. |
| resolver | `agent/lib/resolve-output.mjs` | Output id to destination/template contract. |

## Known Decisions

| Decision | Source |
|----------|--------|
| Knitten is an LLM skill-friendly operating system, not only a document cleanup project. | User chat and `docs/milestones/knitten-refactor.md`. |
| Skills stay central; documents, templates, paths, validators, and handoff artifacts support skill operation. | User chat and `docs/milestones/knitten-refactor.md`. |
| LLM-to-LLM temporary handoff documents are JSON. | `docs/reference/local-report-inbox.md`. |
| Output contracts bind purpose, destination, template, format, and validation surface. | `docs/plans/proposed/output-contract-registry.md`. |

## Open Questions

| Question | Default |
|----------|---------|
| Should one resolver own every path? | No. Keep owner resolvers separate; bind them through output contracts. |
| Should every existing skill migrate now? | No. Migrate when a skill already changes its output behavior. |

## Exclusions

| Exclusion | Reason |
|-----------|--------|
| No code implementation in this spec PR. | Parent architecture precedes child implementation. |
| No rewrite of every skill. | Adoption belongs to a child spec. |
| No replacement of existing path registries. | Path ownership remains layered. |

## Validation Expected

| Check | Command |
|-------|---------|
| Markdown and policy validation | `node scripts/validate-llm-first.mjs` |
| Diff hygiene | `git diff --check` |
| Worktree state | `git status --short --branch` |
