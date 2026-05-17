---
status: implemented
created: 2026-05-17
updated: 2026-05-17
owner: agent-hub
milestone: spec-lifecycle-system
---

# Caol Review Implementation

## Purpose

Create a general agent-hub skill for reviewing completed implementations against
their spec, diff, validators, generated indexes, routing metadata, and
deploy-target sync before commit or handoff.

The skill name is `ah-review-implementation`.

## Problem

Existing review skills cover narrow domains:

| Existing skill | Owns | Gap |
|----------------|------|-----|
| `review-audit-docs` | docs and comment defects in a diff | does not compare the implementation to a spec or validator evidence |
| `ah-audit-skill` | one skill body against LLM-first and workflow logic | does not inspect a multi-file implementation |
| `shotloom-review-before-pr` | Shotloom PR review | repo-specific and not applicable to agent-hub hub changes |
| `review-audit-web` / `review-audit-ux` | web code and UI | web-specific, not a caol system gate |

The missing layer is a post-implementation gate for agent-hub work: after files
change, an agent needs a repeatable way to prove the diff matches the spec and
the repo contracts still hold.

## Goals

1. Add a read-only review skill for agent-hub implementations.
2. Resolve a spec from an explicit slug/path or changed `docs/plans/` file.
3. Compare the implementation diff against spec goals, non-goals, validation,
   risks, and acceptance criteria.
4. Run repo validators and record exact pass/fail evidence.
5. Check routing, generated blocks, inventory, and deploy-target sync when those
   surfaces changed.
6. Delegate to existing domain review skills only when their scope fits.
7. Lead output with verified findings and separate residual risk from summary.
8. Keep fixes outside the review pass unless the user explicitly asks for a
   follow-up patch.

## Non-Goals

1. Do not replace `ah-manage-spec`.
2. Do not replace `ah-audit-skill` for a depth-first single-skill audit.
3. Do not replace Shotloom PR review or domain-specific pre-PR gates.
4. Do not auto-commit, push, or mutate external services.
5. Do not persist review reports by default.

## Skill Shape

Path:

```text
agent/skills/ah-review-implementation/
  SKILL.md
```

Frontmatter:

```yaml
---
description: Review completed agent-hub implementations against the owning spec, diff, validators, generated indexes, routing metadata, and deploy-target sync before commit or handoff.
argument-hint: "[spec-slug-or-path] [--staged|--working|--base <rev>]"
allowed-tools: Read, Glob, Grep, Bash(git:*), Bash(rg:*), Bash(node:*), Bash(test:*), Bash(wc:*), Bash(diff:*)
domains: agent-hub
repo-keys: agent-hub
languages: markdown,yaml,json
task-types: review
context-profile: ah-authoring
---
```

## Review Contract

| Area | Required check |
|------|----------------|
| Spec | spec path resolved or absence reported |
| Diff | changed files listed with scope source |
| Scope | changed files match goals and non-goals |
| Acceptance | each acceptance criterion is done, blocked, or not applicable |
| Validation | required commands ran or exact blocker reported |
| Routing | changed route metadata has a fixture or explicit exemption |
| Generated views | `README.md` and `AGENT-HUB.md` blocks match registries |
| Deploy target | edited shared-layer subtree matches `~/.claude` target when applicable |
| Docs | new docs describe current state only |
| Safety | no push, external mutation, or destructive operation occurred |

## Workflow

1. Resolve the scope: explicit spec, one changed spec, or diff-only review.
2. Read the spec and changed files needed to evaluate the contract.
3. Run focused validators before full validators when registries changed.
4. Review the diff against the spec and repo policies.
5. Verify every finding against the live tree before reporting.
6. Report findings first, then validation evidence and residual risk.
7. Stop read-only. Patch only in a separate fix step requested by the user.

## Validation

```bash
test -f agent/skills/ah-review-implementation/SKILL.md
wc -l agent/skills/ah-review-implementation/SKILL.md
node scripts/validate-llm-first.mjs --check context-routing
node scripts/validate-llm-first.mjs
git diff --check
```

## Acceptance Criteria

1. `agent/skills/ah-review-implementation/SKILL.md` exists.
2. The skill is read-only by default.
3. The skill can review an implementation with or without an explicit spec.
4. The skill checks spec parity, validation evidence, generated indexes,
   routing metadata, deploy-target sync, docs accuracy, and safety.
5. `agent/config/context-routing.json` lists the skill as a `ah-authoring`
   pilot file.
6. `tests/routing-fixtures.json` contains a caol implementation review fixture.
7. Generated inventory blocks are refreshed.
8. Full validator passes.

## Open Decisions

| Decision | Default |
|----------|---------|
| Persist review reports by default? | no; chat report unless user asks |
| Auto-fix findings inside the review skill? | no; review stays read-only |
| Require every implementation to name a spec? | no; report diff-only mode when no spec resolves |
