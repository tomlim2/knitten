---
status: intake
created: 2026-05-31
updated: 2026-05-31
owner: agent-hub
spec: docs/plans/proposed/skill-output-location-architecture.md
---

# Spec Intake: skill-output-location-architecture

## User Request

Continue the Knitten refactor after the parent Skill Operating System spec by
creating the output location architecture child spec.

## Goal

Define where skill outputs live and which resolver owns each path family.

## Route

| Field | Value |
|-------|-------|
| selected route | `ah-manage-spec create skill-output-location-architecture` |
| candidate routes | `ah-manage-milestone update knitten-refactor`; output-contract follow-up |
| referenced skills | `ah-manage-spec`, `ah-manage-milestone`, `ah-resolve-doc-path` |

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| spec | `docs/plans/proposed/skill-operating-system.md` | Parent model and child spec trigger. |
| milestone | `docs/milestones/knitten-refactor.md` | Parent progress and acceptance criteria. |
| config | `agent/config/outputs.json` | Output id to destination/template registry. |
| config | `agent/config/local-artifact-paths.json` | `.agent-local` owner/artifact/item path registry. |
| skill | `agent/skills/ah-resolve-doc-path/SKILL.md` | Vault/staging/private doc resolver contract. |
| script | `agent/skills/ah-resolve-doc-path/resolve.sh` | Existing doc/repo/tool/structure resolution behavior. |
| reference | `docs/reference/local-report-inbox.md` | JSON-only local report boundary. |

## Known Decisions

| Decision | Source |
|----------|--------|
| Do not replace every path resolver with one resolver. | `docs/plans/proposed/skill-operating-system.md`. |
| Use output contracts for repeated skill path/template pairs. | `docs/plans/proposed/skill-operating-system.md` and `agent/config/outputs.json`. |
| Use `.agent-local` for temporary local-only handoff and runtime artifacts. | `docs/reference/local-report-inbox.md`. |
| Use `ah-resolve-doc-path` for vault, staging, ops, private, repo, tool, and structure lookups. | `agent/skills/ah-resolve-doc-path/SKILL.md`. |

## Open Questions

| Question | Default |
|----------|---------|
| Should repo docs route through `ah-resolve-doc-path`? | No. Repo docs use repo-relative paths or output contracts. |
| Should runtime logs get output contract rows? | No, unless a skill needs a repeatable handoff or cleanup contract. |

## Exclusions

| Exclusion | Reason |
|-----------|--------|
| No resolver implementation change. | This is an architecture spec. |
| No migration of all skill path literals. | Adoption belongs to `skill-output-contract-adoption.md`. |
| No lifecycle state machine. | Lifecycle belongs to `skill-output-lifecycle.md`. |

## Validation Expected

| Check | Command |
|-------|---------|
| Diff hygiene | `git diff --check` |
| LLM-first validator | `node scripts/validate-llm-first.mjs` |
| Spec lifecycle | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |
