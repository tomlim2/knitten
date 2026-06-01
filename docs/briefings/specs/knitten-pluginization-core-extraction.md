---
status: intake
created: 2026-06-01
updated: 2026-06-01
owner: agent-hub
spec: docs/plans/proposed/knitten-pluginization-core-extraction.md
---

# Spec Intake: knitten-pluginization-core-extraction

## User Request

Create a spec for pluginizing Knitten while extracting a smaller core.

## Goal

Define the staged architecture for turning the current private Knitten monorepo
into a core plus artifact packs without breaking current skill routing,
validators, output contracts, or local workflows.

## Route

- selected route: `ah-manage-spec create knitten-pluginization-core-extraction`
- candidate routes: `ah-manage-artifact`, `ah-manage-skill`
- delegated or referenced skills: `ah-manage-spec`

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| file | `SYSTEM.md` | Shared policy, durable source, deploy target, and shared layer rules. |
| file | `docs/reference/system-glossary.md` | Reserved artifact-pack terminology. |
| file | `docs/milestones/agent-artifact-pack-system.md` | Parent milestone and existing pack roadmap. |
| file | `docs/plans/completed/artifact-pack-vocabulary.md` | Accepted vocabulary for core, packs, manifests, and resolvers. |
| file | `docs/plans/completed/artifact-pack-discovery-routing.md` | Existing discovery/routing contract. |
| file | `docs/plans/completed/artifact-pack-manifest-contract.md` | Manifest contract owner. |
| file | `docs/plans/active/core-artifact-boundary.md` | Current core vs pack classification rule. |
| file | `docs/plans/proposed/knitten-core-public-transition.md` | Existing public core transition direction. |
| file | `agent/config/artifact-pack.schema.json` | Current manifest schema. |
| file | `docs/plans/completed/skill-operating-system.md` | Current output and skill operating model. |

## Known Decisions

- Do not perform a big-bang file move.
- Core keeps bootstrap, routing, validation, resolver, installer, lifecycle,
  safety, and compatibility infrastructure.
- Optional domain, repo, company, personal, and experimental workflows become
  artifact pack candidates.
- Shotloom is high-dependency and should not be the first extraction.
- Current Knitten stays private during transition.

## Open Questions

- Should the first real extraction be a tiny public-safe example pack or a
  private utility pack?
- Should generated merged registries be committed or generated in validation
  only?
- Should `plugin` remain user-facing wording while system docs use
  `artifact pack`?

## Exclusions

- No physical file movement in this spec.
- No remote repository creation.
- No public release decision.
- No manifest schema rewrite unless a later implementation spec proves a gap.

## Validation Expected

- `git diff --check`
- `node scripts/validate-llm-first.mjs`
- `node scripts/validate-llm-first.mjs --check spec-lifecycle`
- `node scripts/validate-llm-first.mjs --check artifact-pack`
