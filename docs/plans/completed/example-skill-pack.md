---
status: completed
created: 2026-05-25
updated: 2026-05-25
owner: agent-hub
milestone: agent-artifact-pack-system
completed: 2026-05-25
intake: docs/briefings/specs/example-skill-pack.md
---

# Example Skill Pack

## Purpose

Create one public-safe artifact pack under `examples/artifact-packs/` that
proves manifest validation, installed-pack inspection, resolver routing, and
compatibility alias behavior across real files.

## Problem

Manifest validation, installed-pack lifecycle, and discovery routing now exist,
but they are proven through separate fixtures and unit tests.

Without a durable example skill pack, a cold-start agent cannot inspect one concrete
pack root and see the complete contract: manifest, exported skill, route
metadata, compatibility alias, validator command, installer command, resolver
input, and expected output.

## Goals

| Goal | Acceptance |
|------|------------|
| Add a real example skill pack. | `examples/artifact-packs/example-skill-pack/artifact-pack.json` validates through `artifact-pack`. |
| Include public-safe content. | Every export uses `privacy-risk: public-safe` and contains no private path, company name, token, or personal data. |
| Prove resolver routing. | A practical test installs or constructs an installed row and resolves the exported artifact as primary for a web review request. |
| Prove metadata-only behavior. | Resolver body load count remains `0` and candidate rows point to pack paths without reading skill body text. |
| Prove compatibility alias behavior. | An old skill name selects the canonical exported artifact with `compatibility-need: alias`. |
| Prove installed-pack inspection. | `install-artifact-pack inspect --artifact-pack <example> --registry <temp>` returns candidate count and no persistent source changes. |
| Keep implementation small. | No migration of current Knitten skills, rules, standards, commands, or docs into the example skill pack. |

## Non-Goals

| Non-Goal | Owner |
|----------|-------|
| Do not define general public-safety scrub gates. | `public-safety-scrub-gates` |
| Do not migrate existing Knitten artifacts into packs. | `artifact-repo-migration-plan` |
| Do not define old-path shim removal policy. | `artifact-compatibility-shims` |
| Do not change manifest schema or route fields. | `artifact-pack-manifest-contract` |
| Do not change installed-pack registry semantics. | `installed-pack-lifecycle` |
| Do not publish a separate package or repository. | `knitten-core-public-transition` |

## Current State

| Surface | Fact | Evidence |
|---------|------|----------|
| Manifest schema | Pack root manifest is `artifact-pack.json` and exports declare path, mount, load, route, dependencies, and privacy risk. | `agent/config/artifact-pack.schema.json` |
| Validator input | `examples/artifact-packs/**/artifact-pack.json` is scanned by artifact-pack validation. | `scripts/validate-llm-first.mjs` |
| Resolver | `resolveArtifactRoute()` accepts installed rows and validated manifests. | `scripts/resolve-artifact-route.mjs` |
| Installer | `inspect` and `install` accept explicit `--artifact-pack` and `--registry`. | `scripts/install-artifact-pack.mjs` |
| Existing fixtures | Test fixtures prove schema and lifecycle edges but are not durable user-facing examples. | `tests/fixtures/artifact-packs/`, `tests/fixtures/installed-pack-lifecycle/` |
| Milestone | `example-skill-pack` is the remaining `very-high` priority item. | `docs/milestones/agent-artifact-pack-system.md` |

## Brainstorming

### Candidate Pack Shapes

| Option | Description | Decision |
|--------|-------------|----------|
| `example-skill-pack` | One web review skill, route-selected metadata, compatibility alias from an old skill name. | Accept. |
| `public-markdown-authoring` | One Markdown authoring skill with on-demand load only. | Reject for first example; it does not prove route-selected behavior. |
| `multi-skill-demo` | Several skills, standards, and docs. | Reject for first example; it hides the contract under too much surface area. |
| `link-mount-demo` | Link mount to harness deploy target. | Defer; installed-pack lifecycle fixtures already cover link safety. |
| `private-pack-demo` | Private/local visibility pack. | Reject; the milestone needs a public-safe example. |

### User Test Patterns

| Pattern | Expected Behavior |
|---------|-------------------|
| Agent validates the example root. | Validator passes all artifact-pack gates. |
| Agent inspects the example root. | Installer reports a pending row, one candidate, and zero link actions for virtual mount. |
| Agent routes a web review request. | Resolver returns `result-kind: primary` for the pack skill. |
| Agent invokes old skill name. | Resolver returns the canonical artifact id and alias provenance. |
| Agent asks unrelated domain. | Resolver returns `core-fallback` or excludes the example skill pack without body loads. |

### Naming

| Name | Use |
|------|-----|
| `example-skill-pack` | Pack id and example root. |
| `demo-web-review` | Canonical exported skill id. |
| `old-demo-web-review` | Compatibility alias old name. |
| `examples/artifact-packs/` | Durable example-skill-pack root scanned by validators. |

## Proposed Design

### File Layout

| Path | Purpose |
|------|---------|
| `examples/artifact-packs/example-skill-pack/artifact-pack.json` | Pack manifest. |
| `examples/artifact-packs/example-skill-pack/skills/demo-web-review/SKILL.md` | Exported skill entrypoint. |
| `tests/example-skill-pack.test.mjs` | Practical end-to-end checks for validator, installer inspect, resolver, and alias behavior. |

### Manifest Contract

| Field | Value |
|-------|-------|
| `pack-id` | `example-skill-pack` |
| `visibility` | `public` |
| `owner-domain` | `domain` |
| Export `artifact-id` | `demo-web-review` |
| Export `artifact-type` | `skill` |
| Export `load` | `route-selected` |
| Export `mount.mode` | `virtual` |
| Export `privacy-risk` | `public-safe` |
| Export dependencies | `core:manifest-schema`, `core:artifact-pack-validation`, `core:context-routing` |
| Route domains | `web` |
| Route task types | `review` |
| Route languages | `markdown` |
| Route work modes | `personal` |
| Compatibility alias | `old-demo-web-review` maps old name `old-demo-web-review` to `demo-web-review`. |

### Skill Content Contract

| Section | Rule |
|---------|------|
| Frontmatter | Include `description`, `domains`, `task-types`, `context-profile`, and `portability` only if accepted by existing skill conventions. |
| Body | Describe a small, executable web review workflow. |
| Safety | No company names, user names, local paths, secrets, generated credentials, or private URLs. |
| Size | Keep below 120 lines. |
| Dependency | Do not require external tools or network. |

### Practical Test Contract

| Test | Assertion |
|------|-----------|
| Validator | `node scripts/validate-llm-first.mjs --check artifact-pack --artifact-pack examples/artifact-packs/example-skill-pack` exits `0`. |
| Installer inspect | `node scripts/install-artifact-pack.mjs inspect --artifact-pack <example> --registry <temp> --json` exits `0`, reports `candidate-count: 1`, and does not write the registry file. |
| Resolver primary | `resolveArtifactRoute()` with one active installed row and the example manifest selects `demo-web-review` for `please review this web markdown page`. |
| Resolver alias | `namedArtifact: ["old-demo-web-review"]` selects the canonical artifact id with `compatibility-need: alias`. |
| Body-load guard | Both resolver tests return `resolver-body-load-count: 0`. |

## Design Plan

S0 - Baseline re-check

Input:
- `docs/plans/completed/artifact-pack-manifest-contract.md`
- `docs/plans/completed/artifact-pack-discovery-routing.md`
- `docs/plans/proposed/installed-pack-lifecycle.md`
- `scripts/validate-llm-first.mjs`
- `scripts/install-artifact-pack.mjs`

Output:
- Confirmed example skill pack can reuse existing schema, validator, resolver, and installer inspect surfaces.

Non-output:
- No source edits outside docs.

Failure:
- Stop and patch the owning upstream spec before example implementation.

Proof:
- `rg -n "examples/artifact-packs|resolveArtifactRoute|commandInspect" scripts tests docs`

S1 - Example skill pack files

Input:
- Manifest contract from this spec.
- Public-safe skill content contract from this spec.

Output:
- `examples/artifact-packs/example-skill-pack/artifact-pack.json`
- `examples/artifact-packs/example-skill-pack/skills/demo-web-review/SKILL.md`

Non-output:
- No edits to `agent/` shared layers.
- No copied current Knitten skill bodies.
- No machine-local paths.

Failure:
- Reject the pack if any manifest field needs schema changes.

Proof:
- `node scripts/validate-llm-first.mjs --check artifact-pack --artifact-pack examples/artifact-packs/example-skill-pack`

S2 - Practical example tests

Input:
- Example skill pack root from S1.
- `scripts/install-artifact-pack.mjs`
- `scripts/resolve-artifact-route.mjs`

Output:
- `tests/example-skill-pack.test.mjs` validates artifact-pack check, installer inspect, resolver primary route, resolver alias route, and body-load guard.

Non-output:
- No persistent registry writes outside a temporary directory.
- No harness deploy-target writes.
- No artifact body loading in resolver assertions.

Failure:
- Test fails with a specific missing contract rather than weakening assertions.

Proof:
- `node --test tests/example-skill-pack.test.mjs`

S3 - Validator integration

Input:
- Passing practical test from S2.
- `scripts/validate-llm-first.mjs`
- `agent/standards/policy/principles.md`

Output:
- A named validator check covers the example skill pack practical test if a dedicated check is needed.
- Generated validator check count is updated if a new check is added.

Non-output:
- No broad validator refactor.
- No duplicate artifact-pack gate.

Failure:
- If the full validator already scans the example manifest and the practical test is only needed as a unit test, do not add a redundant named check.

Proof:
- `node scripts/validate-llm-first.mjs`

S4 - Milestone and lifecycle update

Input:
- Completed implementation and validation evidence.
- `docs/milestones/agent-artifact-pack-system.md`
- `docs/plans/completed/example-skill-pack.md`

Output:
- Spec status moves to `completed`.
- Milestone progress marks example skill pack done.
- Priority queue marks `example-skill-pack` done.

Non-output:
- No status changes for unrelated proposed specs.

Failure:
- Keep spec proposed if S1-S3 are incomplete.

Proof:
- `node scripts/validate-llm-first.mjs --check spec-lifecycle`

## Validation

Before implementation:

```bash
git diff --check
node scripts/validate-llm-first.mjs --check spec-lifecycle
node scripts/validate-llm-first.mjs
```

After implementation:

```bash
node scripts/validate-llm-first.mjs --check artifact-pack --artifact-pack examples/artifact-packs/example-skill-pack
node --test tests/example-skill-pack.test.mjs
node scripts/validate-llm-first.mjs
git diff --check
```

## Risks

| Risk | Mitigation |
|------|------------|
| Example duplicates fixture behavior only. | Test installer inspect and resolver output against the durable example path, not only fixture paths. |
| Example becomes a hidden migration of current Knitten skills. | Write a new minimal public-safe skill and block copied private or repo-specific content. |
| Validator scans example manifest but not practical behavior. | Add `tests/example-skill-pack.test.mjs` for installer and resolver behavior. |
| Install test writes to real harness paths. | Use `inspect` and temp registry only; no production harness config. |
| Alias test selects canonical candidate instead of alias candidate. | Assert `primary-candidate-id` equals the alias candidate id and `compatibility-need: alias`. |

## Acceptance Criteria

1. `examples/artifact-packs/example-skill-pack/artifact-pack.json` exists and passes artifact-pack validation.
2. Example skill content is public-safe, self-contained, and below 120 lines.
3. Practical test validates explicit example-skill-pack root, not only fixture roots.
4. Installer inspect test uses a temporary registry and does not create persistent registry or harness files.
5. Resolver primary test selects `example-skill-pack/demo-web-review` for a web review request.
6. Resolver alias test selects canonical artifact id through `old-demo-web-review` alias provenance.
7. Resolver tests assert `resolver-body-load-count: 0`.
8. Full `node scripts/validate-llm-first.mjs` passes.
9. Milestone progress marks example skill pack done only after implementation and validation pass.

## Open Decisions

| Decision | Default |
|----------|---------|
| Add a dedicated validator check name for the example practical test? | Add only if full validation must run the practical test automatically. |
| Include link mount in the example skill pack? | No; keep first example virtual and use lifecycle fixtures for link behavior. |
| Include standards or docs exports in the example skill pack? | No; keep first example to one skill plus alias. |
