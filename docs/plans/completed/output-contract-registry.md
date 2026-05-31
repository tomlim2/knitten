---
status: completed
created: 2026-05-31
updated: 2026-05-31
owner: agent-hub
milestone: knitten-refactor
---

# Skill Operating System: Output Contract Registry

## Purpose

Define the first concrete operating contract for Knitten's LLM skill-friendly
operating system: one output registry that tells skills to write this output
purpose to this destination with this template.

An output is more than a body format:

```text
skill operating system = skill discovery + skill execution + output contracts + validation + handoff
output contract = purpose + path + format + lifecycle + ownerSkill + validator
```

This spec implements the output-contract slice first: `purpose + path + format +
template + shapeKind`.

The contract joins three facts that currently live apart:

| Fact | Current owner |
|---|---|
| Output destination | Knitten location layer: git-tracked repo docs, local artifacts, vault/staging paths, lifecycle rules |
| Output template | `agent/document-templates/` |
| Lifecycle and consumer expectation | skill prose, validator rules, or ad-hoc convention |

This is not only a document cleanup. The output registry is a skill-operating
primitive for LLM-run skills: the agent should resolve the output contract,
write the expected shape, and validate the result instead of rediscovering path
and template conventions from prose each time.

## Problem

Skills often need both a path and a template for the same output. Keeping those
facts separate makes agents hardcode one side:

| Failure mode | Example |
|---|---|
| Path known, template guessed | A skill writes to the right `.agent-local` path but improvises body shape. |
| Template known, path guessed | A spec skill reads `spec.md` but still repeats `docs/plans/proposed/<slug>.md`. |
| Section template ambiguity | Design Plan is a section inside a spec, not a separate durable file, but its template is still separate. |
| Validator gap | Existing checks validate template shape and local artifact paths separately, not the pair. |
| Lifecycle gap | Temporary, durable, promoted, completed, and discarded documents are handled by scattered skill prose. |

## Goals

| Goal | Requirement |
|---|---|
| Skill-operating output contract | A skill resolves one output id and receives path, template, format, and shape/section metadata. |
| Output lifecycle framing | Treat each output as part of a larger lifecycle: creation, promotion, completion, archive, or deletion. |
| No path/template hardcoding in skills | Skills call the resolver or cite the output id instead of repeating path plus template pairs. |
| Markdown and JSON support | The registry supports `.md` templates and `.json` templates. |
| Section outputs | The registry can represent a template applied to a section inside another document. |
| Existing resolver reuse | Reuse `resolve-local-artifact-path.mjs` for `.agent-local` outputs instead of duplicating local path logic. |
| Skill-centered template assets | Prepare two skill template assets: the official recommended Markdown shape and an HTML-like experimental shape. |
| Validator coverage | `validate-llm-first` checks registry structure, referenced templates, and path safety. |

## Non-Goals

| Non-Goal | Reason |
|---|---|
| Replace existing path owners | Tracked docs, `.agent-local`, and vault/staging paths keep their owner path layers. |
| Replace `local-artifact-paths.json` | `.agent-local` path templates remain owned by the local artifact registry. |
| Migrate every skill in one PR | This spec defines the contract first; skill adoption can be phased. |
| Generate output bodies automatically | The resolver returns contracts; skills still fill templates using task context. |
| Move templates | `agent/document-templates/` remains the canonical template home. |
| Force all skills into HTML-like syntax | The official recommended Markdown template remains the default; HTML-like syntax is prepared as an experiment. |
| Finish the whole lifecycle system | This spec implements the output-contract layer; lifecycle state machines can follow. |

## Current State

| Area | Current behavior |
|---|---|
| `.agent-local` handoff | `resolve-local-artifact-path.mjs` can return path plus template/shape hints for JSON handoff. |
| Agent-hub spec | `ah-manage-spec` says to write `docs/plans/proposed/<slug>.md` and read `agent/document-templates/agent-hub/spec.md`. |
| Design Plan | `ah-manage-spec` says to add a Design Plan from `agent/document-templates/agent-hub/design-plan.md` when needed. |
| Vault/staging docs | `ah-resolve-doc-path/resolve.sh` resolves Obsidian, staging, ops, and private destinations. |
| Template inventory | `agent/standards/authoring/document-templates.md` maps templates to broad consumers. |
| Template validation | `validate-llm-first` validates document templates and local artifact template hints. |
| Skill template convention | Existing skills use free-form `SKILL.md` prose with local conventions, but no starter pair for official and HTML-like structures. |

## Proposed Design

Add `agent/config/outputs.json`.

This registry is the first concrete piece of the broader skill operating
system. It does not encode every lifecycle transition yet, but every row should
be written as a future lifecycle unit: one output purpose, one location
contract, one template contract, one validator surface, and one owner skill or
workflow.

Each output row defines:

| Field | Required | Meaning |
|---|---|---|
| `id` | yes | Kebab-case output purpose id. |
| `description` | yes | Short purpose. |
| `locationKind` | yes | `repo-template`, `local-artifact`, `doc-path`, or `document-section`. |
| `args` | yes | Named arguments and validation patterns. |
| `template` | yes | Repo-relative `.md` or `.json` document template. |
| `format` | yes | `markdown`, `json`, or `markdown-section`. |
| `shapeKind` | yes | Kebab-case machine hint for the body shape. |
| `path` | when `locationKind: repo-template` | Repo-relative path template. |
| `localArtifactTokens` | when `local-artifact` | Path tokens passed to `resolve-local-artifact-path.mjs`. |
| `docPurpose` | when `locationKind: doc-path` | Purpose passed to `ah-resolve-doc-path`. |
| `parentOutput` | when `document-section` | Output id whose file contains the section. |
| `section` | when `document-section` | H2 section heading owned by the template. |

### Initial Output Rows

| Output id | Destination | Template | Format |
|---|---|---|---|
| `local-session-handoff` | `.agent-local/reports/<YYYYMMDD>-<slug>.json` | `agent/document-templates/agent-hub/json-handoff-packet.json` | `json` |
| `agent-hub-spec-proposed` | `docs/plans/proposed/<slug>.md` | `agent/document-templates/agent-hub/spec.md` | `markdown` |
| `agent-hub-design-plan-section` | `## Design Plan` inside `agent-hub-spec-proposed` | `agent/document-templates/agent-hub/design-plan.md` | `markdown-section` |

Example:

```json
{
  "id": "agent-hub-spec-proposed",
  "description": "Agent-hub proposed spec document",
  "locationKind": "repo-template",
  "args": [
    {
      "name": "slug",
      "pattern": "^[a-z0-9]+(-[a-z0-9]+)*$"
    }
  ],
  "path": "docs/plans/proposed/{slug}.md",
  "template": "agent/document-templates/agent-hub/spec.md",
  "format": "markdown",
  "shapeKind": "agent-hub-spec"
}
```

## Skill Template Assets

Because Knitten is skill-centered, the first implementation should prepare two
skill template assets alongside the output registry work.

| Asset | Path | Status | Purpose |
|---|---|---|---|
| Official recommended skill template | `agent/document-templates/agent-hub/skill.md` | default | Canonical Markdown shape for production skills. |
| HTML-like skill template | `agent/document-templates/agent-hub/skill-html-like.md` | experimental | Tag-structured Markdown for LLM parsing, validation, and future rendering experiments. |

The official recommended template asset stays close to current `SKILL.md` practice:
short purpose, trigger conditions, inputs, workflow, outputs, validation, and
handoff notes.

The HTML-like template asset remains Markdown, but uses constrained structural blocks
that are easier for LLMs and validators to target:

```md
<skill>
  <purpose>...</purpose>
  <triggers>...</triggers>
  <inputs>...</inputs>
  <workflow>...</workflow>
  <outputs>...</outputs>
  <validation>...</validation>
  <handoff>...</handoff>
</skill>
```

The HTML-like variant is not the default authoring style yet. It exists as an
asset so the refactor can compare a familiar Markdown skill shape against a more
parseable skill component shape without forcing all existing skills to migrate.

## Resolver Contract

Add `agent/lib/resolve-output.mjs`.

`locationKind` selects the owner of path resolution:

| `locationKind` | Owner | Use |
|---|---|---|
| `repo-template` | output registry row | Git-tracked repo docs such as `docs/plans/proposed/{slug}.md`, `docs/milestones/{slug}.md`, `docs/reference/{slug}.md`, or `agent/rules/{slug}.md`. |
| `doc-path` | `ah-resolve-doc-path/resolve.sh` | Vault, staging, ops, and private document destinations. |
| `local-artifact` | `resolve-local-artifact-path.mjs` | Local handoff, runtime, and report files under `.agent-local`. |
| `document-section` | parent output row | A section inside another output file. |

In this spec, `doc-path` means destinations owned by the existing
`ah-resolve-doc-path` skill. Git-tracked repo docs use `repo-template` so the
output registry can bind a template directly to a repo path without replacing
that skill.

Usage:

```bash
node agent/lib/resolve-output.mjs local-session-handoff date=20260531 slug=main-status
node agent/lib/resolve-output.mjs agent-hub-spec-proposed slug=output-contract-registry
node agent/lib/resolve-output.mjs agent-hub-design-plan-section slug=output-contract-registry
```

For file outputs, return:

```json
{
  "ok": true,
  "id": "agent-hub-spec-proposed",
  "path": "docs/plans/completed/output-contract-registry.md",
  "absolutePath": "<knitten-root>/docs/plans/completed/output-contract-registry.md",
  "template": "agent/document-templates/agent-hub/spec.md",
  "absoluteTemplatePath": "<knitten-root>/agent/document-templates/agent-hub/spec.md",
  "format": "markdown",
  "shapeKind": "agent-hub-spec"
}
```

For section outputs, return the parent document path plus section metadata:

```json
{
  "ok": true,
  "id": "agent-hub-design-plan-section",
  "path": "docs/plans/completed/output-contract-registry.md",
  "section": "## Design Plan",
  "template": "agent/document-templates/agent-hub/design-plan.md",
  "format": "markdown-section",
  "shapeKind": "agent-hub-design-plan"
}
```

## Skill Adoption

| Skill | Required change |
|---|---|
| `ah-manage-spec` | Resolve `agent-hub-spec-proposed` before creating new proposed specs. |
| `ah-manage-spec` | Resolve `agent-hub-design-plan-section` before adding a Design Plan section. |
| Local report writers | Resolve `local-session-handoff` for generic `.agent-local/reports/*.json` handoffs. |
| Future output writers | Add output rows before introducing a new hardcoded path/template pair. |

## Lifecycle Position

This spec does not complete the full skill operating system, but it
establishes the key unit that later lifecycle rules can attach to.

| Lifecycle concern | This spec |
|---|---|
| Create | Defines destination plus template for the first write. |
| Temporary vs durable | Distinguishes local JSON handoff from git-tracked repo docs. |
| Promote | Leaves promotion rules to owner skills and future lifecycle specs. |
| Complete/archive/delete | Leaves state transitions to owner lifecycle docs. |
| Validate | Adds registry-level validation as the first enforcement point. |

## Design Plan

S0 - Baseline re-check

Input:
- Current PR branch.
- Parent milestone reviewed with `docs/guidelines/milestone-review.md`.
- `agent/document-templates/agent-hub/spec.md`.
- `agent/document-templates/agent-hub/design-plan.md`.
- `agent/config/local-artifact-paths.json`.
- `agent/lib/resolve-local-artifact-path.mjs`.

Output:
- Confirmed current path/template split and existing resolver behavior.
- Confirmed parent milestone direction before implementation.
- Confirmed no implementation changes are carried before this spec is accepted.

Non-output:
- New resolver files.
- Registry files.
- Skill rewrites.

Failure:
- Stop and report if the working tree has unrelated dirty files.

Proof:
- `git status --short --branch`.
- `rg -n "output|resolve-output|agent-hub-spec-proposed" agent docs scripts`.

S1 - Add output registry

Input:
- This spec.
- Existing local artifact registry shape.
- Existing template inventory shape.

Output:
- `agent/config/outputs.json`.
- Initial rows for `local-session-handoff`, `agent-hub-spec-proposed`, and `agent-hub-design-plan-section`.

Non-output:
- No skill call-site migration yet.
- No body generation.

Failure:
- Reject unsafe path templates, missing templates, duplicate ids, or undeclared placeholders.

Proof:
- JSON parse of `agent/config/outputs.json`.
- `node scripts/validate-llm-first.mjs --check outputs`.

S2 - Add resolver

Input:
- `agent/config/outputs.json`.
- `agent/lib/resolve-local-artifact-path.mjs`.

Output:
- `agent/lib/resolve-output.mjs`.
- Resolver JSON output includes destination, template, format, shapeKind, and section metadata when applicable.

Non-output:
- No output body writing.
- No template filling.

Failure:
- Return `ok: false` JSON and non-zero exit for unknown output id, invalid arg, missing template, or unsafe path.

Proof:
- `node --check agent/lib/resolve-output.mjs`.
- Smoke commands for all three initial output ids.

S3 - Validator integration

Input:
- New registry.
- Existing `validate-llm-first` local artifact and template checks.

Output:
- An `outputs` validator check.
- Checks for ids, location kind, args, referenced templates, format, shapeKind, placeholder declarations, and parent output existence.

Non-output:
- No broad schema framework dependency.

Failure:
- Validator fails on broken row shape or missing referenced template.

Proof:
- `node scripts/validate-llm-first.mjs --check outputs`.
- `node scripts/validate-llm-first.mjs`.

S4 - Add skill template assets

Input:
- Existing skill files.
- Existing authoring standards.
- This spec's skill operating system framing.

Output:
- `agent/document-templates/agent-hub/skill.md`.
- `agent/document-templates/agent-hub/skill-html-like.md`.
- Template inventory entry for both skill templates.

Non-output:
- No migration of existing skills.
- No decision that HTML-like syntax becomes the default.

Failure:
- Stop if either template implies hidden required tooling or contradicts the current skill loading model.

Proof:
- `rg -n "skill-html-like|agent-hub/skill.md" agent docs`.
- `node scripts/validate-llm-first.mjs --check document-templates`.

S5 - First consumer documentation

Input:
- `ah-manage-spec`.
- Template README and authoring standard.

Output:
- `ah-manage-spec` names the output ids for proposed specs and Design Plan sections.
- Template/path docs explain that output contracts bind destination plus template.

Non-output:
- No full migration of all output-writing skills.

Failure:
- Stop if docs imply the resolver writes content automatically.

Proof:
- `rg -n "agent-hub-spec-proposed|agent-hub-design-plan-section|resolve-output" agent docs`.

## Validation

Run before implementation PR:

```bash
node --check agent/lib/resolve-output.mjs
node agent/lib/resolve-output.mjs local-session-handoff date=20260531 slug=main-status
node agent/lib/resolve-output.mjs agent-hub-spec-proposed slug=output-contract-registry
node agent/lib/resolve-output.mjs agent-hub-design-plan-section slug=output-contract-registry
node scripts/validate-llm-first.mjs --check outputs
node scripts/validate-llm-first.mjs --check document-templates
node scripts/validate-llm-first.mjs
git diff --check
```

## Risks

| Risk | Mitigation |
|---|---|
| Registry duplicates existing path registries | Keep `outputs.json` as a binding layer, not a replacement for path owners. |
| Section output is mistaken for a file output | Use `format: markdown-section`, `parentOutput`, and `section`. |
| Skills ignore resolver | Update output contracts in consuming skills as they are touched. |
| HTML-like template asset becomes premature policy | Mark it experimental and keep the official recommended Markdown template as default. |
| Registry grows too broad | Add rows only when a reusable path/template pair exists. |

## Acceptance Criteria

| ID | Criteria |
|---|---|
| AC1 | `outputs.json` contains rows for local handoff, proposed spec, and Design Plan section. |
| AC2 | `resolve-output.mjs` returns path plus template for file outputs. |
| AC3 | `resolve-output.mjs` returns parent path plus section plus template for section outputs. |
| AC4 | `validate-llm-first` validates the output registry. |
| AC5 | `ah-manage-spec` refers to output ids instead of separately hardcoding proposed spec path and templates. |
| AC6 | The first implementation prepares both `skill.md` and `skill-html-like.md` template assets without migrating existing skills. |

## Open Decisions

| Decision | Default |
|---|---|
| Should repo docs go through `doc-path` too? | No. Use `repo-template` for git-tracked repo docs and reserve `doc-path` for the existing `ah-resolve-doc-path` owner. |
| Should all Obsidian templates get output rows now? | No. Add only when a skill needs path plus template binding. |
| Should output rows include lifecycle status? | Not initially. Lifecycle remains in owner skills and lifecycle docs. |
| Should the HTML-like skill template become the default? | No. Keep it experimental until a small usability comparison proves it helps. |
