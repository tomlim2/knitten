---
status: accepted
created: 2026-05-25
updated: 2026-05-25
owner: agent-hub
spec: docs/plans/completed/example-skill-pack.md
---

# Example Skill Pack Intake

## Request

| Field | Value |
|-------|-------|
| User request | Start the next artifact-pack milestone item. |
| Selected work | `example-skill-pack` |
| Output requested | Brainstorming, spec, and design plan before implementation. |
| Worktree | `knitten-worktrees/20260525-223717-example-skill-pack` |
| Branch | `feat/20260525-223717-example-skill-pack` |

## Evidence

| Source | Fact |
|--------|------|
| `docs/milestones/agent-artifact-pack-system.md` | `example-skill-pack` is the remaining `very-high` priority item. |
| `docs/plans/completed/artifact-pack-manifest-contract.md` | Manifest schema, exports, mount modes, route fields, dependencies, and compatibility aliases are complete. |
| `docs/plans/completed/artifact-pack-validation-gates.md` | `examples/artifact-packs/**/artifact-pack.json` is an accepted validator input surface. |
| `docs/plans/completed/artifact-pack-discovery-routing.md` | Resolver consumes installed rows plus validated manifests and returns route-safe candidates without body loads. |
| `docs/plans/proposed/installed-pack-lifecycle.md` | Installer can validate and install local pack roots through explicit registry paths. |
| `scripts/validate-llm-first.mjs` | `--check artifact-pack --artifact-pack <path>` validates explicit pack roots. |
| `scripts/install-artifact-pack.mjs` | `inspect` and `install` accept `--artifact-pack <path>` and `--registry <path>`. |

## Route

| Field | Value |
|-------|-------|
| Planning mode | `personal-spec` |
| Owning skill | `ah-manage-spec` |
| Milestone | `agent-artifact-pack-system` |
| Spec path | `docs/plans/completed/example-skill-pack.md` |

## Constraints

| Constraint | Rule |
|------------|------|
| Public safety | Example skill pack content must be `public-safe` and contain no personal, company, secret, or machine-local path data. |
| Ownership | Example skill pack lives outside `agent/` so it proves pack ownership instead of core ownership. |
| Fixture boundary | Example skill pack is a durable example, not only a validator fixture. |
| Install safety | Practical tests use temporary registries and temporary harness targets. |
| Resolver safety | Resolver test must prove metadata-only candidate selection before artifact body loading. |

## Initial Decision

| Decision | Value |
|----------|-------|
| Example root | `examples/artifact-packs/example-skill-pack/` |
| Example focus | One public-safe web review skill plus one compatibility alias. |
| Mount mode | `virtual` first; link mount remains covered by installed-pack lifecycle fixtures. |
| Route coverage | Domain `web`, task type `review`, language `markdown`, work mode `personal`. |
| Validation owner | Existing artifact-pack validator plus a new example-skill-pack practical test. |
