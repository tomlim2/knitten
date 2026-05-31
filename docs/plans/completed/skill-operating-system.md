---
status: completed
created: 2026-05-31
updated: 2026-05-31
owner: agent-hub
milestone: knitten-refactor
---

# Skill Operating System

## Purpose

Define Knitten's parent architecture as an LLM skill-friendly operating system.

Knitten exists to let a cold-start LLM discover the right skill, execute the
skill with bounded context, leave the expected output, validate that output, and
hand off remaining work without relying on chat memory.

## Problem

Knitten already has skills, rules, standards, templates, path resolvers,
validators, milestones, specs, and local handoff conventions. The pieces work,
but the parent model is still implicit.

| Failure mode | Effect |
|--------------|--------|
| Skill discovery is separate from output ownership. | A skill can route correctly and still write the wrong file shape. |
| Path and template conventions live in different files. | Agents repeat or guess path/template pairs. |
| Temporary and durable outputs share vocabulary. | Local reports, specs, rules, and runtime logs are easier to confuse. |
| Validation is attached per artifact, not per operating flow. | A new skill can skip the check that proves its output contract. |
| Handoff format is not part of the parent model. | Another session receives prose, partial state, or stale branch context. |

## Goals

| Goal | Requirement |
|------|-------------|
| Parent model | Define the operating loop: discovery, execution, output, validation, handoff. |
| Skill-centered architecture | Treat skills as the action layer; treat documents, paths, templates, and validators as support contracts. |
| Output taxonomy | Classify outputs by `ownerSkill`, owner path, format, lifecycle, and validation surface. |
| Path boundary | Keep repo docs, `.agent-local`, private config, vault/staging, and runtime files distinct. |
| Lifecycle boundary | Separate temporary, durable, promoted, completed, archived, and deleted outputs. |
| Adoption boundary | Define which child specs own location, lifecycle, and skill migration. |
| Validator boundary | State which drift classes require validators before adoption. |

## Non-Goals

| Non-Goal | Reason |
|----------|--------|
| Rewrite every existing skill. | This spec defines the parent architecture; adoption is staged. |
| Replace all path resolvers with one resolver. | Existing path owners remain valid where they already own a surface. |
| Turn Knitten into a general app framework. | The target operator is an LLM running skills. |
| Generate artifact bodies automatically. | Skills still fill templates from task evidence. |
| Store runtime/cache artifacts in git. | Runtime state stays local unless promoted to a durable owner. |
| Define every output row now. | Output rows are added when a skill needs a path/template pair. |

## Current State

| Surface | Current owner | State |
|---------|---------------|-------|
| Shared policy | `SYSTEM.md`, `agent/rules/`, `agent/standards/` | LLM-first charter exists. |
| Skill layer | `agent/skills/*/SKILL.md` | Skills route and execute work. |
| Skill template assets | `agent/document-templates/agent-hub/skill.md`, `agent/document-templates/agent-hub/skill-html-like.md` | First skill templates exist. |
| Output contracts | `agent/config/outputs.json`, `agent/lib/resolve-output.mjs` | First registry and resolver exist. |
| Local handoff | `.agent-local/reports/`, `docs/reference/local-report-inbox.md` | JSON-only temporary handoff is defined. |
| Local artifact paths | `agent/config/local-artifact-paths.json`, `agent/lib/resolve-local-artifact-path.mjs` | Local path layer exists. |
| Document templates | `agent/document-templates/` | Template assets exist and have validator coverage. |
| Milestones/specs | `docs/milestones/`, `docs/plans/` | Durable planning layer exists. |
| Validation | `scripts/validate-llm-first.mjs` | Multi-surface validator exists. |

## Proposed Design

### Operating Loop

| Step | Question | Owner | Output |
|------|----------|-------|--------|
| 1. Discover | Which skill or workflow owns this request? | skill registry, route evidence, user request | selected skill or explicit no-skill path |
| 2. Execute | What inputs, stop conditions, and proof does the skill require? | selected skill | bounded task action |
| 3. Resolve output | What purpose, destination, format, template, and lifecycle apply? | output contract or path owner | concrete write target |
| 4. Validate | Which checks prove the output and touched surface are valid? | validator registry or skill validation block | pass/fail evidence |
| 5. Handoff | What state does the next LLM inherit? | durable owner or `.agent-local` JSON report | tracked artifact or local JSON packet |

### Layer Model

| Layer | Role | Canonical surfaces | Rule |
|-------|------|--------------------|------|
| Charter | Defines system identity and global defaults. | `SYSTEM.md` | Keep short; avoid implementation detail. |
| Rules | Enforce automatic or triggered behavior. | `agent/rules/` | Use for constraints, not examples. |
| Standards | Hold reference policy and decision tables. | `agent/standards/` | Use for reusable judgment. |
| Skills | Route, sequence, act, and validate. | `agent/skills/*/SKILL.md` | Keep thin; push long reference material out. |
| Templates | Provide output body shape. | `agent/document-templates/` | Do not encode destination ownership alone. |
| Output contracts | Bind output purpose to destination, format, template, `ownerSkill`, and validation surface. | `agent/config/outputs.json` | Add rows only for skill-consumed outputs. |
| Path resolvers | Resolve owned path families. | `agent/lib/*path*.mjs`, `ah-resolve-doc-path` | Keep owner boundaries explicit. |
| Validators | Catch drift and broken contracts. | `scripts/validate-llm-first.mjs`, focused scripts | Add before broad migration. |
| Durable docs | Store accepted specs, milestones, references, decisions, and guides. | `docs/`, `agent/` | Git-tracked and reviewable. |
| Local artifacts | Store temporary session state. | `.agent-local/` | Gitignored; JSON for LLM handoff. |

### Output Taxonomy

| Output class | Format | Default owner path | ownerSkill | Lifecycle | Validator surface |
|--------------|--------|--------------------|------------|-----------|-------------------|
| Rule | Markdown | `agent/rules/` | `ah-make-rule` or `ah-manage-artifact` | durable | frontmatter, load mode, line budget |
| Standard | Markdown | `agent/standards/` | `ah-make-standard` or `ah-manage-artifact` | durable | frontmatter, path links, length budget |
| Skill | Markdown | `agent/skills/<name>/SKILL.md` | `ah-make-skill` or `ah-manage-skill` | durable | frontmatter, description, context, file inventory |
| Skill template asset | Markdown | `agent/document-templates/agent-hub/` | `ah-manage-document-template` | durable | template inventory and document-template checks |
| Spec | Markdown | `docs/plans/<lifecycle>/` | `ah-manage-spec` | durable or completed | spec lifecycle, frontmatter, milestone link |
| Milestone | Markdown | `docs/milestones/` | `ah-manage-milestone` | durable | milestone link/status checks |
| Reference | Markdown | `docs/reference/` or skill `references/` | owner skill or `ah-manage-artifact` | durable | path links and LLM-first checks |
| Decision | Markdown | `docs/decisions/` | `ah-manage-spec` or decision owner skill | durable | decision index and path links |
| Local handoff packet | JSON | `.agent-local/reports/` | current task skill | temporary | JSON schema/shape through output contract |
| Operational finding queue | JSON | `.agent-local/ah/operational-findings/` | `ah-report-finding` | temporary until promoted | specialized finding validator |
| Image/video/export | Binary or sidecar JSON | owner skill or local artifact path | media/export owner skill | temporary, durable, or exported | owner-specific checksum/path rules |
| Runtime log/cache | native machine format | runtime path | current task skill | temporary | not durable; inspect only when task requires |

### Path Boundary

| Path family | Git policy | Use | Resolver owner |
|-------------|------------|-----|----------------|
| `agent/` | tracked | canonical shared artifacts | direct repo path plus validators |
| `docs/` | tracked | specs, milestones, references, decisions | direct repo path plus validators |
| `.agent-local/` | gitignored | local-only reports, queues, runtime handoff | `resolve-local-artifact-path.mjs` and output contracts |
| `agent/private/agent-hub-config/` shared config | mixed | shared non-machine config where documented | specific config owner |
| `~/.claude/private/agent-hub-config/` machine config | untracked deploy/runtime | machine-local paths and hardware | private config rules |
| vault/staging paths | external/local | Obsidian and staging notes | `ah-resolve-doc-path` |
| runtime/cache paths | untracked | shell output, logs, pid files, temporary downloads | task-specific owner |

### Contract Rule

When a skill writes an output, it must use the narrowest available contract.

| If | Then |
|----|------|
| An output id exists in `agent/config/outputs.json` | Resolve it with `agent/lib/resolve-output.mjs`. |
| No output id exists and the path/template pair repeats | Add an output row before broad skill adoption. |
| No `ownerSkill` is known for a repeat output | Stop and assign the skill or workflow that owns create, validate, and cleanup. |
| The output is a local-only LLM handoff | Use JSON under `.agent-local/` and do not create git state. |
| The output is durable policy, standard, rule, skill, spec, milestone, reference, or decision | Write the tracked owner path in a worktree. |
| The output is binary media or export | Write through the owner skill and store metadata or cleanup path when needed. |

### Child Specs

| Child spec | Owns | Routing trigger |
|------------|------|---------------------|
| `skill-output-location-architecture.md` | Full path family map and resolver boundary. | Parent spec accepted. |
| `skill-output-lifecycle.md` | Lifecycle states and promotion/deletion rules for each output class. | Location architecture accepted. |
| `skill-output-contract-adoption.md` | Which skills adopt output ids and in what order. | Lifecycle spec accepted. |
| `output-contract-registry.md` | First output registry and resolver implementation. | Keep as implemented child slice. |

### Migration Order

| Order | Surface | Trigger | Required proof |
|-------|---------|---------|----------------|
| 1 | New or edited spec-writing skills | Skill creates or changes a spec, Design Plan, or spec briefing. | Output id resolves path and template; spec lifecycle validator passes. |
| 2 | Local handoff writers | Skill leaves cross-session state. | JSON packet resolves under `.agent-local/`; git status shows no tracked handoff. |
| 3 | Document template writers | Skill creates or changes a reusable template. | Template inventory and document-template validator pass. |
| 4 | Rule, standard, and skill CRUD | Skill creates or changes shared operating artifacts. | `ownerSkill` is explicit; length, frontmatter, and index checks pass. |
| 5 | Media/export-producing skills | Skill emits binary media, sidecar metadata, or export files. | Owner-specific path, metadata, cleanup, and validation rules exist. |
| 6 | Runtime/cache producers | Skill writes logs, pid files, command output, or cache. | Artifact stays untracked and cleanup path is documented when handoff needs it. |

## Execution Plan

| Step | Action | Output |
|------|--------|--------|
| 1 | Create this parent architecture spec. | `docs/plans/completed/skill-operating-system.md` |
| 2 | Update `docs/milestones/knitten-refactor.md` to link this spec and mark the model phase proposed. | milestone progress reflects parent spec. |
| 3 | Review the spec against `llm-first-docs.md`. | no speculative current-state claims. |
| 4 | If the parent spec is accepted, create `skill-output-location-architecture.md`. | path family and resolver boundary spec. |
| 5 | If the location spec is accepted, create `skill-output-lifecycle.md`. | lifecycle state table per output class. |
| 6 | If the lifecycle spec is accepted, create `skill-output-contract-adoption.md`. | skill migration order and validation gates. |

## Design Plan

S0 - Baseline re-check

Input:
- `docs/milestones/knitten-refactor.md`
- `docs/plans/completed/output-contract-registry.md`
- `docs/reference/local-report-inbox.md`

Output:
- Confirmed parent scope, first implemented child slice, and local JSON handoff boundary.

Non-output:
- Source edits outside spec, intake, and milestone link updates.

Failure:
- Stop if the parent milestone or output contract spec is missing.

Proof:
- `test -f` or read commands for each evidence file.

S1 - Parent architecture spec

Input:
- User request and baseline evidence.

Output:
- `docs/plans/completed/skill-operating-system.md` defines operating loop, layer model, output taxonomy, path boundary, and child specs.

Non-output:
- No code implementation.
- No broad skill migration.

Failure:
- Stop if the spec conflicts with existing output contract or local report policy.

Proof:
- Manual readback and LLM-first validation.

S2 - Milestone alignment

Input:
- New spec path.
- `docs/milestones/knitten-refactor.md`.

Output:
- Milestone spec row links to the new spec.
- Progress row names the new spec as evidence.

Non-output:
- No acceptance criteria deletion.

Failure:
- Stop if milestone status and spec frontmatter conflict.

Proof:
- `rg -n "skill-operating-system" docs/milestones/knitten-refactor.md docs/plans/completed/skill-operating-system.md`

S3 - Validation

Input:
- Final diff.

Output:
- Diff and LLM-first validation pass.

Non-output:
- No push unless explicitly requested.

Failure:
- Fix validation defects before commit.

Proof:
- `git diff --check`
- `node scripts/validate-llm-first.mjs`
- `git status --short --branch`

## Validation

| Check | Command |
|-------|---------|
| Diff hygiene | `git diff --check` |
| LLM-first validator | `node scripts/validate-llm-first.mjs` |
| Spec route evidence | `rg -n "skill-operating-system" docs/milestones/knitten-refactor.md docs/plans/completed/skill-operating-system.md docs/briefings/specs/skill-operating-system.md` |

## Risks

| Risk | Mitigation |
|------|------------|
| Architecture spec becomes abstract prose. | Use tables and contract rules; keep implementation in child specs. |
| Parent spec duplicates output-contract implementation. | Reference `output-contract-registry.md` as child slice and keep this file at operating-model level. |
| One-resolver design collapses path ownership. | Keep resolver owners separate and bind through output contracts only when useful. |
| Media/export outputs get forced into document-only rules. | Treat binary/export artifacts as output classes with owner-specific metadata and validation. |

## Acceptance Criteria

| ID | Criteria |
|----|----------|
| AC1 | Spec defines Knitten as an LLM skill-friendly operating system. |
| AC2 | Spec defines the operating loop from skill discovery through handoff. |
| AC3 | Spec separates skills, templates, output contracts, path resolvers, validators, durable docs, and local artifacts. |
| AC4 | Spec classifies markdown, JSON, binary media, logs, runtime files, and exports without forcing one document model. |
| AC5 | Spec states when to use an output id, a path resolver, `.agent-local`, or a tracked owner path. |
| AC6 | Spec names child specs for location architecture, lifecycle, and adoption. |
| AC7 | Parent milestone links this spec and points progress evidence at it. |
| AC8 | Spec states the migration order for skill output contract adoption. |

## Open Decisions

| Decision | Default |
|----------|---------|
| Should HTML-like skill syntax become the default skill format? | No. Keep it experimental until a validator and migration spec exist. |
| Should binary media/export outputs get output contract rows? | Only when a skill needs a repeatable destination/template or metadata pair. |
| Should local runtime logs become JSON-only? | No. Use native runtime format; require JSON only for LLM-to-LLM handoff packets. |
