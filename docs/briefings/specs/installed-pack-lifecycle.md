---
status: intake
created: 2026-05-25
updated: 2026-05-25
owner: agent-hub
spec: docs/plans/proposed/installed-pack-lifecycle.md
---

# Spec Intake: installed-pack-lifecycle

## User Request

Create the worktree overview, brainstorming, spec, and design plan for the
installed pack lifecycle.

## Goal

Define a safe local pack install flow that registers artifact packs, links or
exposes pack exports to active harnesses, supports update and uninstall, and
avoids hardcoded user paths.

## Route

- selected route: agent-hub spec creation through `ah-manage-spec`
- candidate routes: milestone spec, deploy-target spec, validator spec
- delegated or referenced skills: `ah-route-plan`, `ah-manage-spec`

## Worktree Overview

| Field | Value |
|-------|-------|
| Worktree | Dedicated task worktree for this branch. |
| Branch | `codex/20260525-093255-installed-pack-lifecycle` |
| Base | `main` at `6538434` |
| Lifecycle target | `docs/plans/proposed/installed-pack-lifecycle.md` |
| Scope | Planning and design only; no installer implementation in this worktree. |

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| file | `SYSTEM.md` | Defines durable source and deploy target terminology. |
| file | `docs/reference/system-glossary.md` | Defines artifact-pack, pack install, deploy target, and resolver terms. |
| file | `docs/milestones/agent-artifact-pack-system.md` | Owns the milestone row and install/link acceptance criteria. |
| file | `docs/plans/completed/artifact-pack-vocabulary.md` | Defines `pack install` and downstream dependencies. |
| file | `docs/plans/completed/artifact-pack-manifest-contract.md` | Defines manifest mount modes, fields, and dependency refs. |
| file | `docs/plans/completed/artifact-pack-validation-gates.md` | Defines validator behavior before installer work consumes manifests. |
| file | `agent/config/agent-hub.json` | Lists harness deploy targets, shared layers, registries, and link methods. |
| file | `scripts/link-harnesses.mjs` | Current harness link behavior and symlink handling. |
| skill | `agent/skills/ah-manage-spec/SKILL.md` | Spec lifecycle and validation workflow. |

## Known Decisions

- Keep new specs under `docs/plans/proposed/` unless implementation starts.
- Persist this intake because the spec touches deploy targets, validators,
  harness adapters, and machine-local paths.
- Treat `deploy target` as a harness runtime path, not server deployment.
- Treat `pack install` as registration plus link or virtual exposure, not
  copying pack contents into core by default.
- The design must block source-target aliasing where a deploy target resolves
  inside the canonical `agent/` source tree.
- Registry state must not resolve inside a tracked checkout, canonical
  `agent/` source tree, or harness deploy target alias unless a later explicit
  machine-local config policy proves the path is gitignored and non-shared.
- First implementation should be all-or-nothing for activation: a pack becomes
  resolver-visible only after validation and required mount planning succeed.
- Active manifest-set validation should use temporary real pack-id directories
  with copied manifest files and symlinked declared export paths, so existing
  validator path and entrypoint checks still work.
- Link ownership requires registry records plus machine-local ownership metadata
  and a durable transaction journal before link writes.
- Practical tests must use `AGENT_HUB_PACK_REGISTRY` or `--registry` to avoid
  writing into the live machine-local registry.
- Installed-pack CRUD is in scope for registry rows and installer-owned mounts;
  source pack repositories are never deleted or edited by CRUD operations.
- Read operations may create temporary validation directories only when planning
  or validating; read-only means no persistent registry, harness target, source
  pack, or deploy target mutation.
- Registry overrides and defaults must reject paths inside the source pack root.
- First implementation uses tombstone/archive rows for uninstall audit and
  recovery; purge is out of scope.

## Open Questions

- Which harness-neutral private config location should replace the current
  Claude adapter example when one is available?
- Should git clone support land in the first implementation, or should first
  install accept local folders only and leave clone/pin for a later stage?
- Which command or skill will own installer UX: a new bootstrap skill, a script,
  or both?

## Exclusions

- No resolver ranking implementation.
- No migration of existing artifacts into packs.
- No public-safety scrub gate implementation.
- No changes to current harness symlink behavior in this planning worktree.

## Validation Expected

- `git diff --check`
- `node scripts/validate-llm-first.mjs --check spec-lifecycle`
- `node scripts/validate-llm-first.mjs`
