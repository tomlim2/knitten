---
status: proposed
created: 2026-05-24
updated: 2026-05-24
owner: agent-hub
milestone: agent-artifact-pack-system
---

# Managed Path Registry Validation

## Purpose

Define one registry for shared agent-hub paths and one CI-enforced validator
that blocks stale hardcoded path literals.

## Problem

Shared-layer paths appear in entry documents, specs, scripts, validators, and
harness deploy targets. A stale Codex shim used `rules/index.md` while the
canonical repo path is `agent/rules/index.md`. The symlink deploy target made
both paths readable in some environments, but the repository source still needs
one canonical path vocabulary.

## Goals

| Goal | Acceptance |
|------|------------|
| Define managed path owners. | A registry owns canonical repo paths, deploy-target paths, and shorthand aliases. |
| Replace repeated literals. | Scripts and validators consume registry constants for shared paths. |
| Keep machine paths out. | User-specific absolute paths stay in private machine config, not this registry. |
| Enforce in CI. | `node scripts/validate-llm-first.mjs` fails on stale managed path literals in PRs. |

## Non-Goals

| Non-Goal | Reason |
|----------|--------|
| Do not replace every one-off local string. | Single-use local literals do not create cross-layer drift. |
| Do not store `/Users/...` paths. | Machine paths belong in private config resolvers. |
| Do not rewrite artifact inventory classification in this spec. | That spec owns inventory row shape and generator output. |

## Proposed Design

### Registry

| Field | Rule |
|-------|------|
| Path | `agent/config/managed-paths.json`. |
| Entries | Each entry has `id`, `canonical`, optional `aliases`, and optional `deploy-targets`. |
| Canonical value | Repo-relative path under the checkout. |
| Alias value | Shorthand allowed only when a deploy target symlink makes it valid. |
| Machine path | Not allowed. |

Initial entries:

| ID | Canonical | Alias |
|----|-----------|-------|
| `rules-index` | `agent/rules/index.md` | `rules/index.md` |
| `task-context-routing-rule` | `agent/rules/task-context-routing.md` | `rules/task-context-routing.md` |
| `skills-root` | `agent/skills/` | `skills/` |
| `standards-root` | `agent/standards/` | `standards/` |
| `commands-root` | `agent/commands/` | `commands/` |
| `artifact-inventory` | `agent/config/artifact-inventory.json` | none |
| `artifact-inventory-schema` | `agent/config/artifact-inventory.schema.json` | none |

### Validator

| Check | Rule |
|-------|------|
| Registry schema | Every entry has a unique `id` and existing `canonical` path. |
| Alias safety | Alias values must map to an existing deploy-target symlink mapping. |
| Stale literal scan | Active docs, entry documents, scripts, skills, rules, standards, and config cannot use retired literals. |
| Allowlist | Completed specs and historical briefings may mention retired literals only inside quoted history blocks or explicit incident records. |
| CI | Existing `Validate` workflow runs `node scripts/validate-llm-first.mjs` on every PR, so the new check blocks PRs without workflow changes. |

## Execution Plan

| Step | Action | Output |
|------|--------|--------|
| 1 | Add registry schema and seed registry. | `agent/config/managed-paths.json` and schema parse. |
| 2 | Add validator check. | `managed-paths` appears in `node scripts/validate-llm-first.mjs --list`. |
| 3 | Refactor repeated literals. | Shared scripts use registry constants or helper lookup. |
| 4 | Add drift fixtures. | Validator proves stale `rules/index.md` and bad aliases fail. |

## Validation

| Check | Command |
|-------|---------|
| Managed paths | `node scripts/validate-llm-first.mjs --check managed-paths` |
| Full validator | `node scripts/validate-llm-first.mjs` |
| CI coverage | `.github/workflows/validate.yml` runs the full validator on `pull_request`. |

## Risks

| Risk | Control |
|------|---------|
| Over-constantizing one-off strings adds noise. | Registry only owns cross-layer paths and deploy aliases. |
| Alias use hides canonical owner. | Canonical path remains required in repo-owned entry documents and active specs. |
| Historical docs fail for old examples. | Validator allowlist separates current policy from incident history. |

## Acceptance Criteria

- [ ] `agent/config/managed-paths.json` exists.
- [ ] `managed-paths` validator check exists.
- [ ] PR CI fails when an active artifact uses a retired managed path literal.
- [ ] Existing Codex entry documents name `agent/rules/index.md` as the load-order path.
- [ ] Scripts that share managed paths read a constant or registry value.

## Open Decisions

| Decision | Default |
|----------|---------|
| Registry format | JSON object with `schema-version` and `paths` array. |
| Helper location | Keep lookup helpers inside `scripts/validate-llm-first.mjs` until a second script needs them. |
| Historical doc policy | Allow completed specs to preserve quoted old shim examples only when marked as history. |
