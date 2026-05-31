---
status: completed
created: 2026-05-31
updated: 2026-05-31
owner: agent-hub
milestone: knitten-refactor
---

# Skill Output Location Architecture

## Purpose

Define the output location architecture for Knitten skills.

This spec assigns each output path family to one resolver or owner. Skills use
the owner instead of reconstructing paths from memory or prose.

## Problem

Knitten has multiple valid path families. A skill can choose the wrong family
when the boundary is implicit.

| Failure mode | Effect |
|--------------|--------|
| Repo docs and vault notes share "document" language. | Durable tracked specs can be written to external notes, or vault notes can be committed. |
| `.agent-local` and tracked docs both hold agent-to-agent information. | Temporary handoff can become durable by accident. |
| Output contracts and path resolvers overlap. | A caller can bypass the template/shape contract or duplicate resolver logic. |
| Runtime files and handoff packets share local storage. | Logs and pid files can be mistaken for LLM-readable JSON state. |
| Machine-local config paths appear in durable docs. | Private absolute paths can leak into committed artifacts. |

## Goals

| Goal | Requirement |
|------|-------------|
| Path family map | Define every major output path family and its owner. |
| Resolver boundary | State when to use `resolve-output`, `resolve-local-artifact-path`, `ah-resolve-doc-path`, or direct repo paths. |
| Tracked/untracked boundary | Separate durable git-tracked artifacts from local-only artifacts. |
| Template boundary | State when a destination also requires a template/shape contract. |
| Handoff boundary | Keep LLM-to-LLM temporary handoff JSON-only and local-only. |
| Runtime boundary | Keep logs, pid files, caches, and command output out of durable docs unless promoted. |

## Non-Goals

| Non-Goal | Reason |
|----------|--------|
| Replace `ah-resolve-doc-path`. | It remains the owner for vault/staging/ops/private doc destinations and repo/tool lookups. |
| Replace `resolve-local-artifact-path.mjs`. | It remains the owner for `.agent-local` registry paths. |
| Add output rows for every path. | Output contracts are added only for repeated skill outputs that need path plus template or shape. |
| Define lifecycle transitions. | `skill-output-lifecycle.md` owns state transitions. |
| Migrate existing skills. | `skill-output-contract-adoption.md` owns migration order and gates. |
| Store binary assets in docs by default. | Media/export handling is owner-skill specific. |

## Current State

| Surface | Owner | Current behavior |
|---------|-------|------------------|
| Proposed specs | `agent/config/outputs.json` row `agent-hub-spec-proposed` | Resolves `docs/plans/proposed/{slug}.md` plus spec template. |
| Design Plan section | `agent/config/outputs.json` row `agent-hub-design-plan-section` | Resolves parent spec path plus section/template metadata. |
| Generic local handoff | `agent/config/outputs.json` row `local-session-handoff` | Resolves `.agent-local/reports/<date>-<slug>.json` plus JSON template. |
| Local artifacts | `agent/config/local-artifact-paths.json` | Owns `.agent-local/<owner>/<artifactType>/...` paths and cleanup paths. |
| Vault/staging/private docs | `ah-resolve-doc-path` | Resolves doc purposes through private config and fallback rules. |
| Repo/tool/structure lookup | `ah-resolve-doc-path/resolve.sh` | Reads private repo, tool, and vault-structure config. |
| Durable agent artifacts | `agent/` | Git-tracked canonical source for skills, rules, standards, config, templates, and lib. |
| Durable planning docs | `docs/` | Git-tracked specs, milestones, references, decisions, and briefings. |

## Proposed Design

### Path Family Matrix

| Path family | Git policy | Owner | Resolver or access rule | Use |
|-------------|------------|-------|-------------------------|-----|
| `agent/skills/` | tracked | skill lifecycle skills | direct repo path plus validators | Durable skill bodies and skill references. |
| `agent/rules/` | tracked | rule lifecycle skills | direct repo path plus validators | Durable behavior constraints. |
| `agent/standards/` | tracked | standard lifecycle skills | direct repo path plus validators | Durable reusable judgment and decision tables. |
| `agent/document-templates/` | tracked | `ah-manage-document-template` | direct repo path plus template validators | Reusable body templates and template assets. |
| `agent/config/` | tracked | config owner skill or validator owner | direct repo path plus schema validator | Shared registries and manifests. |
| `agent/lib/` | tracked | library owner skill | direct repo path plus syntax/tests | Shared resolver/helper scripts. |
| `docs/plans/` | tracked | `ah-manage-spec` | output contract for new proposed specs; lifecycle path for existing specs | Specs and implementation contracts. |
| `docs/milestones/` | tracked | `ah-manage-milestone` | direct repo path plus milestone validation | Umbrella progress and grouping. |
| `docs/reference/` | tracked | owning skill or `ah-manage-artifact` | direct repo path plus link validation | Durable reference docs. |
| `docs/briefings/specs/` | tracked | `ah-manage-spec` | direct repo path from intake rule | High-risk spec intake evidence. |
| `.agent-local/reports/` | ignored | output contract and local artifact layer | `resolve-output local-session-handoff` | JSON-only cross-session handoff. |
| `.agent-local/<owner>/...` | ignored | local artifact registry | `resolve-local-artifact-path.mjs` | Workflow-specific local state, diagnostics, queues, and cleanup roots. |
| `.agent-local/runtime/` | ignored | current task skill | task-specific path; JSON preferred only for handoff | Logs, command output, pid files, and cache. |
| `agent/private/agent-hub-config/` shared config | mixed | config owner | documented config owner only | Shared non-machine private config where explicitly tracked; machine-local path files stay untracked. |
| `~/.claude/private/agent-hub-config/` machine config | untracked | machine-local private config | `ah-resolve-doc-path` or private config reader | Repo paths, machine paths, hardware, and per-machine doc roots. |
| Vault/staging paths | external/local | `ah-resolve-doc-path` | `resolve.sh doc <purpose> [project]` | User-facing notes and staging documents. |
| Exports/media | owner-specific | producing skill | owner-specific path plus metadata | Images, videos, PDFs, generated bundles, or sidecar JSON. |

### Resolver Selection

| Need | Use | Stop condition |
|------|-----|----------------|
| Skill needs path plus template/format/shape. | `node agent/lib/resolve-output.mjs <output-id> ...` | Stop if no output id exists and the pair repeats. |
| Skill needs a registered `.agent-local` workflow artifact. | `node agent/lib/resolve-local-artifact-path.mjs <owner> <artifactType> <entry-specific tokens>`; run `--help` for item order. | Stop if owner/artifact/item is not registered. |
| Skill needs vault, staging, ops, private doc, repo, tool, or structure path. | `agent/skills/ah-resolve-doc-path/resolve.sh` through the skill contract. | Stop if private config is missing or purpose/key is unknown. |
| Skill writes a durable repo artifact with a unique path and no reusable template pair. | Direct repo-relative path under the owning folder. | Stop if owner folder or lifecycle rule is unclear. |
| Skill writes runtime logs or cache. | Task-specific ignored path. | Stop if another LLM must consume it; create JSON handoff instead. |
| Skill emits media/export output. | Producing skill's documented path rule. | Stop if no cleanup, metadata, or ownership rule exists. |

Examples:

```bash
node agent/lib/resolve-local-artifact-path.mjs ah reports 20260531 handoff main-status
node agent/lib/resolve-local-artifact-path.mjs shotloom planning stl-431 brief
```

### Output Contract Boundary

Output contracts do not replace path owners. They bind a path owner to an
output purpose when a skill needs a repeatable destination plus body contract.

| Output contract field | Location architecture meaning |
|-----------------------|-------------------------------|
| `locationKind: repo-template` | The output registry owns the repo-relative path template. |
| `locationKind: local-artifact` | The output registry delegates path resolution to local artifact paths. |
| `locationKind: doc-path` | The output registry delegates path resolution to `ah-resolve-doc-path`. |
| `locationKind: document-section` | The output registry delegates file path to a parent output and owns section/template metadata. |
| `template` | The caller must use the returned template unless a stricter skill template applies. |
| `shapeKind` | The caller and validator use this as the machine-readable body family. |

### Direct Repo Path Boundary

Use direct repo-relative paths only when the path is already owned by a durable
folder contract.

| Direct path allowed | Required owner |
|---------------------|----------------|
| `agent/skills/<name>/SKILL.md` | skill lifecycle skill |
| `agent/rules/<name>.md` | rule lifecycle skill |
| `agent/standards/<domain>/<name>.md` | standard lifecycle skill |
| `docs/milestones/<slug>.md` | `ah-manage-milestone` |
| existing lifecycle spec path | `ah-manage-spec` after resolving lifecycle state |
| `docs/reference/<slug>.md` | owning skill or artifact lifecycle skill |

Do not build repo paths by concatenating private machine roots.

### Local Artifact Boundary

Use `.agent-local` only for local-only state.

| If | Then |
|----|------|
| Another session needs to continue from a short status packet. | Write JSON through `local-session-handoff`. |
| A workflow needs structured local state, queue, or diagnostics. | Register or use `local-artifact-paths.json`. |
| The content is durable policy, standard, skill, spec, milestone, reference, or decision. | Write the tracked owner path instead. |
| The content is raw log, pid, or command output. | Keep native format under runtime/cache path. |
| The content is used in a PR, issue, or durable decision. | Promote the durable fact to a tracked owner path. |

### Private And External Boundary

| Path source | Allowed committed content |
|-------------|---------------------------|
| `~/.claude/private/agent-hub-config/repo-paths.json` | Logical repo key only, not private absolute path. |
| `~/.claude/private/agent-hub-config/machine-paths.json` | Tool/root key only, not private absolute path. |
| `agent/private/agent-hub-config/doc-paths.json` | Purpose key and root namespace only when this shared config is tracked. |
| `agent/private/agent-hub-config/{hardware,machine-paths,repo-paths}.json` | Do not commit; use logical keys in durable docs. |
| Vault/staging path | Purpose key and project key only, not resolved absolute path. |
| Runtime/cache path | Relative cleanup path or logical artifact id only. |

## Execution Plan

| Step | Action | Output |
|------|--------|--------|
| 1 | Create this location architecture spec and intake. | `docs/plans/completed/skill-output-location-architecture.md` and intake briefing. |
| 2 | Update `docs/milestones/knitten-refactor.md`. | Spec row link and location inventory progress become `proposed`. |
| 3 | Validate current docs. | Diff hygiene, LLM-first validator, and spec lifecycle pass. |
| 4 | If accepted, create `skill-output-lifecycle.md`. | Lifecycle state machine spec. |

## Design Plan

S0 - Baseline re-check

Input:
- `docs/plans/completed/skill-operating-system.md`
- `agent/config/outputs.json`
- `agent/config/local-artifact-paths.json`
- `agent/skills/ah-resolve-doc-path/SKILL.md`

Output:
- Confirmed parent model and current resolver/path-owner surfaces.

Non-output:
- No resolver code changes.

Failure:
- Stop if any evidence file is missing.

Proof:
- Read commands and `node agent/lib/resolve-output.mjs agent-hub-spec-proposed slug=skill-output-location-architecture`.

S1 - Location matrix

Input:
- Baseline evidence.

Output:
- Path Family Matrix, Resolver Selection, Output Contract Boundary, Direct Repo Path Boundary, Local Artifact Boundary, and Private/External Boundary.

Non-output:
- No lifecycle transition rules beyond path ownership.

Failure:
- Stop if a path family has no owner or resolver rule.

Proof:
- Manual readback plus LLM-first validation.

S2 - Milestone alignment

Input:
- New spec path and `docs/milestones/knitten-refactor.md`.

Output:
- Milestone links the spec and marks Location inventory as `proposed`.

Non-output:
- No change to acceptance criteria.

Failure:
- Stop if spec frontmatter milestone does not match the milestone file.

Proof:
- `rg -n "skill-output-location-architecture|Location inventory" docs/milestones/knitten-refactor.md docs/plans/completed/skill-output-location-architecture.md`

S3 - Validation

Input:
- Final diff.

Output:
- Validation passes.

Non-output:
- No push unless explicitly requested.

Failure:
- Fix validation defects before commit.

Proof:
- `git diff --check`
- `node scripts/validate-llm-first.mjs`
- `node scripts/validate-llm-first.mjs --check spec-lifecycle`

## Validation

| Check | Command |
|-------|---------|
| Diff hygiene | `git diff --check` |
| LLM-first validator | `node scripts/validate-llm-first.mjs` |
| Spec lifecycle | `node scripts/validate-llm-first.mjs --check spec-lifecycle` |
| Spec route evidence | `rg -n "skill-output-location-architecture|Location inventory" docs/milestones/knitten-refactor.md docs/plans/completed/skill-output-location-architecture.md docs/briefings/specs/skill-output-location-architecture.md` |

## Risks

| Risk | Mitigation |
|------|------------|
| The spec reintroduces one mega resolver. | Keep resolver selection per path family. |
| The spec duplicates lifecycle rules. | Put state transitions in `skill-output-lifecycle.md`. |
| The spec blesses private absolute paths in durable docs. | Require logical keys and forbid committed resolved private paths. |
| Runtime logs become LLM handoff by accident. | Require JSON handoff for LLM-to-LLM state and native format for raw runtime files. |

## Acceptance Criteria

| ID | Criteria |
|----|----------|
| AC1 | Spec defines every major Knitten output path family. |
| AC2 | Spec assigns each path family to an owner and resolver/access rule. |
| AC3 | Spec distinguishes tracked repo artifacts, `.agent-local`, private config, vault/staging, runtime/cache, and media/export outputs. |
| AC4 | Spec states when to use `resolve-output`, `resolve-local-artifact-path`, `ah-resolve-doc-path`, or direct repo paths. |
| AC5 | Spec preserves the parent decision to avoid one mega resolver. |
| AC6 | Spec marks local handoff as JSON-only and local-only. |
| AC7 | Parent milestone links this spec and updates Location inventory progress. |

## Open Decisions

| Decision | Default |
|----------|---------|
| Should output contract rows include `ownerSkill` immediately? | No. Add through an implementation spec after validator design. |
| Should media/export outputs share a single folder? | No. Keep owner-specific until common metadata requirements repeat. |
| Should runtime/cache paths get a registry? | Only after repeated cleanup or handoff failures. |
