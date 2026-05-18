---
status: intake
created: 2026-05-18
updated: 2026-05-18
owner: agent-hub
spec: docs/plans/proposed/knitten-core-public-transition.md
---

# Spec Intake: knitten-core-public-transition

## User Request

Create a transition plan for making Knitten externally visible by creating a
clean `knitten-core` repository that keeps only public-safe core contents and
migrates optional artifacts into an external artifact repository.

## Goal

Define a public-readiness migration plan that separates Knitten core from
personal, company, repo-specific, and domain-specific artifacts before any
external exposure.

## Route

- selected route: `ah-manage-spec`
- candidate routes: milestone-only note; direct README rewrite; artifact-pack
  migration implementation
- delegated or referenced skills: `ah-manage-spec`, `ah-manage-milestone`

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| file | `docs/milestones/agent-artifact-pack-system.md` | Owns artifact pack and migration umbrella. |
| file | `docs/milestones/index.md` | Milestone index row must remain current. |
| file | `SYSTEM.md` | Defines Knitten shared-policy identity. |
| directory | `agent/skills/` | Major source of artifacts to classify. |
| directory | `agent/commands/` | Command artifacts to classify. |
| directory | `agent/rules/` | Core safety vs pack-specific rules. |
| directory | `agent/standards/` | Core standards vs domain-specific reference catalogs. |
| user | current chat | User preference: create `knitten-core` and keep only clean core contents. |

## Known Decisions

- Public-facing work should target a clean `knitten-core` repository.
- Current `knitten` should stay private as the integration workspace and source
  for migration manifests, private packs, and release preparation.
- After `knitten-core` works independently, current `knitten` should transition
  into a private artifact pack monorepo plus integration overlay.
- Knitten core should keep bootstrap, lifecycle, routing, validation, safety,
  and artifact-pack infrastructure.
- Optional skills, commands, rules, and standards should move to external
  artifact repositories or packs.
- Migration must be planned before files are physically moved.

## Open Questions

- Exact public repository name and remote owner are not finalized.
- Whether current `knitten` becomes `knitten-core` or a new repo is created and
  history-filtered remains open.

## Exclusions

- Do not move artifacts in this planning spec.
- Do not publish a repository or change remotes.
- Do not delete personal/company artifacts until classification and rollback are
  defined.

## Validation Expected

- `git diff --check`
- `node scripts/validate-llm-first.mjs`
