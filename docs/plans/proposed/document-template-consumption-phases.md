---
status: proposed
created: 2026-05-24
updated: 2026-05-24
owner: agent-hub
milestone: agent-artifact-pack-system
---

# Document Template Consumption Phases

## Purpose

Define how Knitten document templates are split between internal-consumption
templates and vault-assetization templates before any physical folder migration.

## Problem

`agent/document-templates/` currently stores reusable body templates for several
different consumers:

- PR bodies, Linear issues, specs, milestones, reviews, and operational reports;
- implementation-order design plans;
- Obsidian devlogs, learnings, topic notes, consulting records, and project
  records.

These templates share a filesystem root but serve different phases. Applying one
review lens to every template causes drift:

- internal workflow templates need scriptability, status fields, and consumer
  compatibility;
- Obsidian asset templates need tags, links, frontmatter, retrieval value, and
  long-term readability.

## Goals

1. Classify every current document template into one consumption phase.
2. Keep current paths stable until a later migration spec chooses whether files
   should move.
3. Use different review criteria for internal-consumption and
   vault-assetization templates.
4. Prevent a single template from trying to serve both operational execution and
   long-term knowledge preservation.
5. Keep validator and consumer contracts compatible with the current folder
   layout.
6. Treat `agent/document-templates/agent-hub/design-plan.md` as an existing
   template before applying phase classification.

## Non-Goals

- Physically move template files in this spec.
- Redesign Obsidian vault folder structure.
- Redesign Linear, GitHub, or review output templates.
- Define the final artifact-pack location for templates.
- Add automation for promoting internal reports into Obsidian notes.

## Current State

| Family | Current path | Current consumer | Proposed phase |
|--------|--------------|------------------|----------------|
| Agent-hub docs | `agent/document-templates/agent-hub/` | spec, milestone, design plan, technical spec, operational finding workflows | internal-consumption |
| GitHub | `agent/document-templates/github/` | PR body creation and mirror | internal-consumption |
| Linear | `agent/document-templates/linear/` | Linear issue body creation | internal-consumption |
| Review | `agent/document-templates/review/` | review output formatting | internal-consumption |
| Obsidian | `agent/document-templates/obsidian/` | vault note creation | vault-assetization |
| Consulting | `agent/document-templates/consulting/` | consulting history records | vault-assetization |
| Project | `agent/document-templates/project/` | private project records | vault-assetization |

Support references such as Obsidian tag taxonomy, format contracts, and note
inspection checklists are not body templates, but stay in the template standard
inventory because vault-assetization review depends on them.

## Affected Skills

| Skill | Phase touched | Required change |
|-------|---------------|-----------------|
| `ah-manage-document-template` | both | Make phase classification the first create/update/review step; load Obsidian tag taxonomy only for vault-assetization templates. |
| `ah-manage-spec` | internal-consumption | State that `spec.md` creates an internal work contract; route later knowledge preservation to a separate vault-assetization note. |
| `ah-manage-milestone` | internal-consumption | State that `milestone.md` tracks work grouping and progress, not long-term vault knowledge. |
| `dev-generate-spec` | internal-consumption | State that `technical-spec.md` is an internal generated spec template even when saved outside `agent/document-templates/`. |
| `learn-log-day` | vault-assetization | State that Obsidian templates preserve devlogs, learnings, and topics; active work items stay in internal-consumption artifacts. |
| `consulting-log-session` | vault-assetization | State that `company-history.md` is a vault-assetization record template and must keep retrieval fields. |
| `dev-setup-project` | vault-assetization | Align created project docs folders with vault-assetization roles: `days/`, `learnings/`, and `topics/`. |
| `review-audit-*` skills | internal-consumption | Keep review output as internal-consumption; do not route review reports to Obsidian templates during the audit. |

Non-skill consumers:

| Consumer | Phase touched | Note |
|----------|---------------|------|
| Linear issue commands | internal-consumption | Existing command consumers remain until command retirement converts them. |
| GitHub PR body mirror | internal-consumption | `.github/pull_request_template.md` remains a runtime mirror of the GitHub template. |
| Future `ah-report-finding` | internal-consumption first, vault-assetization later | Capture reports start internal; later promotion can create separate vault notes. |

## Proposed Design

### Phase 1: Internal-consumption

Internal-consumption templates are used to run work.

| Criterion | Requirement |
|-----------|-------------|
| Primary reader | agent, script, external tracker, or workflow |
| Optimized for | scriptability, low operator burden, status/source fields, consumer format |
| Examples | PR body, Linear issue body, spec, milestone, design plan, review output, operational finding report |
| Review question | Can an agent or script fill this reliably and hand it to the consumer? |

Rules:

- Keep canonical state fields in frontmatter or one explicit owner.
- Keep generated-body examples easy to copy into the target consumer.
- Do not add long-term learning prose unless the workflow itself requires it.
- If content later becomes worth preserving as knowledge, create a separate
  vault-assetization note.

### Phase 2: Vault-assetization

Vault-assetization templates are used to preserve knowledge.

| Criterion | Requirement |
|-----------|-------------|
| Primary reader | future user or agent searching the Obsidian vault |
| Optimized for | retrieval, tags, wikilinks, frontmatter, durable reading value |
| Examples | devlog day, learning note, topic reference, consulting record, project record |
| Review question | Can this note be found and understood months later? |

Rules:

- Follow Obsidian frontmatter, tag taxonomy, and one-H1 requirements.
- Prefer durable context over operational command traces.
- Keep links and tags useful for later retrieval.
- Do not make vault templates carry live workflow state unless the note type is
  explicitly an inbox/capture note.

### Boundary Rule

Do not make one template serve both phases.

| If the artifact starts as | And later becomes | Then |
|---------------------------|-------------------|------|
| internal-consumption report | durable lesson | create/update a vault-assetization learning or topic note |
| internal-consumption issue/spec | reference material | link or summarize into a vault-assetization note |
| vault-assetization note | active work item | create a separate internal-consumption issue/spec/report |

The same source event can produce both kinds of documents, but each document has
one primary phase.

## Execution Plan

1. Confirm `agent/document-templates/agent-hub/design-plan.md` exists.
2. Add phase classification to `agent/document-templates/README.md`.
3. Add phase classification to
   `agent/standards/authoring/document-templates.md`.
4. Keep current folder paths unchanged.
5. Update future template reviews to begin by identifying the consumption phase.
6. Update affected skills so template use starts with phase classification.
7. Add validator coverage only if future drift shows agents confuse the two
   phases.
8. Revisit physical folder migration only after current consumers and validators
   can resolve old and new paths.

## Skill Adoption Plan

### S0 - Baseline Re-check

Input:
- `agent/document-templates/README.md`
- `agent/standards/authoring/document-templates.md`
- affected skill list in this spec

Output:
- Confirmed phase table and target skill set.

Non-output:
- No physical folder move.

Failure:
- Stop if a target skill already has unreviewed unrelated edits.

Proof:
- `git status --short --branch`
- `rg -n "document-templates|template|Obsidian|vault|review-template" agent/skills`

### S1 - Patch Template Lifecycle Skill

Input:
- `agent/skills/ah-manage-document-template/SKILL.md`
- `agent/document-templates/README.md`
- `agent/standards/authoring/document-templates.md`

Output:
- Template create/update/review starts by classifying
  `internal-consumption` or `vault-assetization`.

Non-output:
- No new template folder layout.

Failure:
- Stop if a template family has no phase in the inventory.

Proof:
- `rg -n "internal-consumption|vault-assetization|TAG-TAXONOMY" agent/skills/ah-manage-document-template/SKILL.md`

### S2 - Patch Internal-consumption Producers

Input:
- `agent/skills/ah-manage-spec/SKILL.md`
- `agent/skills/ah-manage-milestone/SKILL.md`
- `agent/skills/dev-generate-spec/SKILL.md`

Output:
- Spec, milestone, and generated technical spec flows identify their templates
  as internal-consumption artifacts.

Non-output:
- No change to spec or milestone lifecycle status semantics.

Failure:
- Stop if a producer also writes Obsidian vault notes in the same workflow.

Proof:
- `rg -n "internal-consumption|agent/document-templates/agent-hub" agent/skills/ah-manage-spec agent/skills/ah-manage-milestone agent/skills/dev-generate-spec`

### S3 - Patch Vault-assetization Producers

Input:
- `agent/skills/learn-log-day/SKILL.md`
- `agent/skills/consulting-log-session/SKILL.md`
- `agent/skills/dev-setup-project/SKILL.md`

Output:
- Vault note producers identify their templates as vault-assetization artifacts.

Non-output:
- No change to resolver destinations.
- No active work tracking inside vault templates.

Failure:
- Stop if a workflow tries to turn an active internal artifact into a vault note
  without a separate conversion step.

Proof:
- `rg -n "vault-assetization|agent/document-templates/(obsidian|consulting|project)" agent/skills/learn-log-day agent/skills/consulting-log-session agent/skills/dev-setup-project`

### S4 - Patch Review Producers

Input:
- `agent/skills/review-audit-*`
- `agent/document-templates/review/code-review.md`

Output:
- Review audit skills keep review output as internal-consumption and avoid
  vault-assetization templates.

Non-output:
- No broad review rubric rewrite.

Failure:
- Stop if a review skill writes durable learning notes directly.

Proof:
- `rg -n "internal-consumption|code-review.md|review-template" agent/skills/review-audit-*`

## Validation

Run:

```bash
node scripts/validate-llm-first.mjs --check document-templates
node scripts/validate-llm-first.mjs
git diff --check
```

Review checks:

- every current template family has exactly one phase;
- no current path changes are required;
- internal-consumption and vault-assetization review criteria are separate;
- `operational-finding-report` is classified as internal-consumption.
- `design-plan` is classified as internal-consumption.

## Risks

| Risk | Impact | Mitigation |
|------|--------|------------|
| Phase names become folder names too early | Path churn and consumer breakage | Treat phases as classification only in this spec. |
| Internal reports become too archival | Capture gets slower and less useful | Keep internal templates optimized for action and later triage. |
| Vault notes become too operational | Long-term retrieval gets noisy | Keep workflow state out unless the note is an inbox/capture note. |
| Validator lags behind policy | Drift can reappear | Add validator checks only after phase policy stabilizes. |

## Acceptance Criteria

1. Document template families are classified as `internal-consumption` or
   `vault-assetization`.
2. Current file paths remain stable.
3. The README explains the two phases and their review lenses.
4. The authoring standard inventory records each template phase.
5. Future reviews can apply phase-specific criteria before checking individual
   template content.
6. `design-plan` is internal-consumption, not a vault-assetization template.
7. `operational-finding-report` is internal-consumption, not an Obsidian
   assetization template.

## Open Decisions

1. Should phases eventually become physical folders such as `internal/` and
   `vault/`, or remain metadata only?
2. Should validators enforce phase-specific fields once more templates adopt the
   classification?
3. Which skill should own conversion from an internal-consumption report into a
   vault-assetization note?
