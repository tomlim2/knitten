---
status: implemented
created: 2026-05-19
updated: 2026-05-19
owner: agent-hub
milestone:
briefing: ../../briefings/specs/document-template-merge-readiness.md
---

# Document Template Merge Readiness

## Purpose

Define the hardening needed before the document-template centralization branch
can be merged.

## Problem

The branch moves reusable document bodies into `agent/document-templates/` and
adds a `document-templates` validator check. The direction is correct, but the
current implementation still has consumer-breaking defects that the validator
does not catch.

| Problem | Consequence |
|---------|-------------|
| nested fenced Markdown is invalid in the technical-spec template | agents copying the template get a broken document body |
| an Obsidian template uses an unregistered `tool/` tag axis | generated notes can violate the vault taxonomy contract |
| one consulting skill still references a legacy deployed template path | central ownership is incomplete and can drift immediately |
| template lifecycle has no explicit workflow owner | future agents can add, rename, or delete templates inconsistently |
| the GitHub PR mirror is only checked for a path comment | GitHub can read a stale runtime body while validation stays green |
| validator checks are mostly string-presence checks | the branch can merge with format defects hidden behind green checks |

## Goals

1. Make every centralized template render safely in its target consumer.
2. Update all direct consumers to read the canonical template or an explicit
   redirect stub.
3. Preserve required runtime mirrors and prove they match canonical bodies.
4. Strengthen `document-templates` validation so the known defects fail locally.
5. Keep legacy paths only as intentional shims with replacement links.
6. Define a document-template lifecycle workflow owner.
7. Leave enough evidence for a cold-start agent to review the branch without
   chat history.

## Non-Goals

1. Do not design the full external artifact-pack system in this branch.
2. Do not migrate unrelated skills, commands, rules, or standards.
3. Do not add a new Obsidian tag axis unless the taxonomy document is updated in
   the same change.
4. Do not remove legacy deployed template behavior without proving every
   consumer was moved.
5. Do not change PR workflow, release tagging, or worktree cleanup behavior.

## Current State

| Surface | Current state | Evidence |
|---------|---------------|----------|
| canonical folder | `agent/document-templates/` exists and has an inventory | `agent/document-templates/README.md` |
| policy standard | template ownership policy exists | `agent/standards/authoring/document-templates.md` |
| technical spec template | outer Markdown fence conflicts with inner fences | `agent/document-templates/agent-hub/technical-spec.md` |
| Obsidian cross-project template | includes `tool/{{TOOL}}` and can exceed five tags | `agent/document-templates/obsidian/cross-project-learning.md` |
| Obsidian taxonomy | no `tool/` tag axis exists | `agent/skills/obsidian-obsidian-markdown/references/TAG-TAXONOMY.md` |
| consulting skill | still points at `@~/.claude/templates/consulting/company.md` | `agent/skills/consulting-log-session/reference.md` |
| lifecycle owner | no dedicated document-template management skill exists | `find agent/skills -maxdepth 2 -name SKILL.md` |
| GitHub mirror | `.github/pull_request_template.md` exists as required runtime mirror | `.github/pull_request_template.md` |
| validator | current checks pass despite the review findings | `scripts/validate-llm-first.mjs` |

## Proposed Design

### Template Rendering Safety

Each template must be valid Markdown as a source document and as the generated
body it asks an agent to copy.

| Template type | Required check |
|---------------|----------------|
| `agent-hub/*.md` | generated-body examples use fences that cannot be closed by nested examples |
| `linear/*.md` | fenced body examples parse without prematurely closing |
| `github/*.md` | no frontmatter and stable PR sections |
| `obsidian/*.md` | frontmatter and first H1 follow the Obsidian contract |
| `consulting/*.md` and `project/*.md` | same note contract as Obsidian templates |
| `review/*.md` | review output has findings-first sections |

For templates that contain fenced examples inside another fenced body, use a
longer outer fence than any fence inside the body.

### Consumer And Shim Contract

Every consumer must be in one of these states:

| State | Meaning |
|-------|---------|
| canonical consumer | directly reads `agent/document-templates/**` |
| runtime mirror | must stay at a fixed platform path and is checked against canonical content |
| redirect stub | exists only to point old readers at the canonical owner |
| external deploy target | has an explicit sync or compatibility plan before the old path is removed |

Legacy references to `agent/templates/**` or `~/.claude/templates/**` are not
allowed unless they are documented as external deploy targets with a current
compatibility plan.

### Obsidian Contract Enforcement

Template validation must check more than one `type/` and one `project/` tag.
It must also validate:

1. every tag axis exists in `TAG-TAXONOMY.md`;
2. each note template has at most five emitted tags after placeholder lines are
   counted;
3. templates do not instruct agents to use non-existent tag axes;
4. `title`, `tags`, `date`, and `source` frontmatter fields remain present;
5. the first body heading is exactly one H1.

If a template truly needs a new tag axis, the taxonomy update and validator
fixture must be part of the same change.

### GitHub Runtime Mirror Enforcement

The canonical PR body is `agent/document-templates/github/pull-request.md`.
The runtime mirror is `.github/pull_request_template.md`.

Validation must compare the two after normalizing mirror-only comments. A
canonical path comment is useful, but it is not sufficient.

### Validator Failure Fixtures

The `document-templates` check should fail for the defects found in review:

1. broken nested fences in generated-body examples;
2. unregistered Obsidian tag axis;
3. more than five Obsidian tags;
4. stale GitHub mirror body;
5. missing canonical consumer or unresolved legacy template reference.

Use helper functions inside `scripts/validate-llm-first.mjs`; do not add a
second validator script for this branch.

### Document Template Lifecycle Owner

Template centralization needs an explicit workflow owner, not only a folder and
standard. The owner should be a dedicated `ah-manage-document-template` skill
unless the implementation records a stronger reason to make it a mode under
`ah-manage-artifact`.

The lifecycle workflow must cover:

| Mode | Required behavior |
|------|-------------------|
| `create <consumer>/<slug>` | choose the canonical folder, create the template, update inventory, add required validator coverage |
| `update <path>` | read the consumer contract first, patch the template, update mirrors or consumers |
| `review <path>` | findings-first review against consumer format, taxonomy, mirrors, stale paths, and validator coverage |
| `redirect <old-path> <new-path>` | leave a `status: superseded` stub with `superseded-by:` and scan for live consumers |
| `delete <path>` | require explicit user request, prove no live consumers, remove inventory rows, and run validation |

The lifecycle owner must route to existing domain rules instead of duplicating
them:

| Template family | Required reference |
|-----------------|--------------------|
| Obsidian, consulting, project | Obsidian format and tag taxonomy references |
| GitHub | GitHub runtime mirror contract |
| Linear | Linear issue body consumer contract |
| agent-hub | spec, milestone, and generated technical spec contracts |
| review | findings-first review output contract |

The existing `agent/standards/authoring/document-templates.md` remains the
policy reference. The lifecycle skill is the executable workflow that tells
agents what to read, edit, validate, and refuse.

## Execution Plan

### Batch A: Fix Known Template Defects

Status: implemented on 2026-05-19.

1. Fix `agent/document-templates/agent-hub/technical-spec.md` by using a longer
   outer fence around generated Markdown bodies.
2. Fix `agent/document-templates/obsidian/cross-project-learning.md` by
   removing `tool/{{TOOL}}` or mapping it to an existing taxonomy axis.
3. Keep the cross-project learning template under the five-tag limit.
4. Re-run the focused `document-templates` validator.

### Batch B: Repair Consumers And Compatibility Paths

Status: implemented on 2026-05-19.

1. Update `agent/skills/consulting-log-session/reference.md` to reference
   `agent/document-templates/consulting/company-history.md`, or document an
   explicit deploy-target compatibility shim.
2. Scan for `agent/templates/`, `~/.claude/templates/`, and old template file
   names.
3. Keep redirect stubs only where a live consumer still needs the old path.
4. Document every remaining runtime mirror in `agent/document-templates/README.md`.

### Batch C: Harden Validator

Status: implemented on 2026-05-19.

1. Add Markdown fence-balance checks for generated-body template examples.
2. Add Obsidian taxonomy-axis and tag-count checks.
3. Add GitHub PR mirror body comparison after normalizing mirror-only comments.
4. Add stale consumer scan for legacy template paths unless they are listed as
   approved runtime mirrors or deploy targets.
5. Refresh generated validator documentation.

### Batch D: Add Template Lifecycle Workflow

Status: implemented on 2026-05-19.

1. Add `agent/skills/ah-manage-document-template/SKILL.md`, or explicitly
   extend `ah-manage-artifact` with a document-template mode.
2. Include modes for create, update, review, redirect, and delete.
3. Point the workflow at `agent/standards/authoring/document-templates.md` and
   the relevant consumer references.
4. Require validator updates when a new template family or consumer contract is
   added.
5. Add the skill or mode to the appropriate inventory/index if the repository
   keeps one for managed skills.

### Batch E: Final Review Gate

Status: implemented on 2026-05-19.

1. Run focused validation.
2. Run full validation.
3. Run whitespace diff check.
4. Run targeted reference scans.
5. Review the final diff against this spec before opening or updating the PR.

## Implementation Summary

| Artifact | Result |
|----------|--------|
| `agent/document-templates/agent-hub/technical-spec.md` | uses a four-backtick outer fence so nested examples remain intact |
| `agent/document-templates/obsidian/cross-project-learning.md` | removed the unsupported `tool/` tag axis and kept the template within the tag limit |
| `agent/skills/consulting-log-session/reference.md` | points to the canonical consulting document template |
| `scripts/validate-llm-first.mjs` | validates Markdown fences, Obsidian tag axes, tag count, GitHub mirror drift, and live legacy template paths |
| `agent/skills/ah-manage-document-template/SKILL.md` | owns create, update, review, redirect, and delete lifecycle workflows for document templates |
| `agent/skills/ah-manage-artifact/SKILL.md` | routes document-template lifecycle management to the new skill |
| `README.md` | refreshed skill inventory count after adding the lifecycle skill |

## Validation

Required commands:

```bash
node scripts/validate-llm-first.mjs --check document-templates
node scripts/validate-llm-first.mjs
git diff --check
rg -n "agent/templates|~/.claude/templates|templates/devlog|templates/note|templates/project|templates/consulting" agent docs .github scripts
rg -n "tool/" agent/document-templates agent/skills/obsidian-obsidian-markdown/references/TAG-TAXONOMY.md
rg -n "ah-manage-document-template|document-template mode|document templates" agent/skills agent/standards docs/plans
```

The two `rg` scans may return documented compatibility entries, but every match
must be intentional and explained in the final review.

## Risks

| Risk | Mitigation |
|------|------------|
| validator becomes over-specific to current templates | validate structural contracts, not exact full text except required runtime mirrors |
| deployed harness templates still depend on old paths | keep documented shims or update consumers before removing paths |
| lifecycle skill duplicates artifact manager behavior | keep document-template-specific consumer validation in the template skill and route broader artifact-pack work elsewhere |
| taxonomy check rejects placeholders too aggressively | validate tag axes and emitted tag count, not placeholder values |
| mirror comparison flags intentional GitHub-only comments | normalize only approved mirror-only comment lines before comparison |

## Acceptance Criteria

1. `technical-spec.md` renders with all intended nested fenced examples intact.
2. No Obsidian, consulting, or project template uses a tag axis missing from
   `TAG-TAXONOMY.md`.
3. No Obsidian, consulting, or project template emits more than five tags.
4. `consulting-log-session` no longer depends on an undocumented legacy template
   path.
5. `.github/pull_request_template.md` is validated against
   `agent/document-templates/github/pull-request.md`.
6. The `document-templates` validator fails for the defect classes identified
   in this spec.
7. Generated validator documentation is refreshed after adding or changing the
   check.
8. Targeted stale-path scans are reviewed and every remaining match is either a
   redirect stub, a runtime mirror, or an explicit deploy target.
9. Document-template lifecycle management has an executable owner, either
   `ah-manage-document-template` or a clearly named document-template mode in
   `ah-manage-artifact`.
10. The lifecycle owner covers create, update, review, redirect, and delete.
11. The lifecycle owner requires inventory, consumer, mirror, stale-path, and
   validator updates when applicable.
12. `node scripts/validate-llm-first.mjs --check document-templates` passes.
13. `node scripts/validate-llm-first.mjs` passes.
14. `git diff --check` passes.

## Open Decisions

| Decision | Default |
|----------|---------|
| Should `~/.claude/templates/**` stay as a deploy target? | Treat it as legacy unless a current consumer requires it. |
| Should `agent/templates/**` redirect stubs be kept? | Keep only if reference scans find live consumers. |
| Should a new Obsidian `tool/` tag axis be introduced? | No; use existing taxonomy axes unless separately accepted. |
| Should template lifecycle management be its own skill? | Yes, default to `ah-manage-document-template` for clearer routing. |
