---
status: active
created: 2026-05-20
updated: 2026-05-24
owner: agent-hub
milestone: agent-artifact-pack-system
briefing: ../../briefings/specs/thin-skill-guide-boundary.md
---

# Thin Skill Guide Boundary

## Purpose

Define the boundary between thin executable skills and durable guide, standard,
reference, template, and validator artifacts.

Primary quality goal: reduce LLM misjudgment. A larger exposed skill set
increases route candidates, context reads, duplicate instructions, and selection
ambiguity. The main defect is wrong route selection, wrong instruction priority,
or stale guidance reuse. Keep skills as small execution adapters. Move durable
knowledge behind explicit references that load only after route selection.

## Problem

Knitten has many skills. Some skills contain execution steps only. Other skills
also contain judgment rubrics, examples, naming policy, format contracts, and
domain reference material.

This mix creates two defects:

1. LLM routing performance drops because too many large skill bodies compete for
   task selection.
2. Artifact-pack migration blocks because inventory classification cannot
   consistently decide whether a large skill is core workflow, domain knowledge,
   public-safe guide material, private pack material, or a candidate for
   deprecation.

LLM performance in this spec means decision quality first and speed second.
Reducing tokens matters only when it also reduces route selection errors,
context pollution, duplicate policy conflicts, and wrong workflow execution.

## Goals

1. Define what must remain in `agent/skills/*/SKILL.md`.
2. Define what must move to standards, guides, references, templates, or
   validators.
3. Define how to classify skill bodies during artifact inventory.
4. Define a repeatable extraction workflow for reducing large skills.
5. Preserve cold-start executability after extraction.
6. Leave core-vs-pack retention decisions to the later core boundary and
   artifact-pack classification specs.

## Non-Goals

1. Do not move or rewrite existing skills in this spec.
2. Do not add an artifact-pack manifest schema.
3. Do not decide every final pack destination.
4. Do not remove compatibility paths.
5. Do not replace existing route skills.
6. Do not decide whether extracted artifacts stay in core or move to an
   artifact pack.

## Current State

| Surface | Current state | Evidence |
|---------|---------------|----------|
| Artifact-pack milestone | active and requires inventory before moves | `docs/milestones/agent-artifact-pack-system.md` |
| Skill context loading | partially implemented; skills declare context manifests | `docs/plans/active/skill-oriented-context-loading.md` |
| Public core plan | proposed; owns future core-vs-pack retention decisions | `docs/plans/proposed/knitten-core-public-transition.md` |
| Routing system | completed; uses thin router skills for review, plan, implementation | `docs/milestones/agent-work-routing-system.md` |
| Template lifecycle | implemented; templates now have canonical bodies and lifecycle skill | `agent/skills/ah-manage-document-template/SKILL.md` |
| Current skill corpus | contains both workflow and guide material | `agent/skills/*/SKILL.md` |

## Proposed Design

### Layer Boundary

| Content | Target layer | Rule |
|---------|--------------|------|
| Invocation trigger, inputs, mode table | skill | Keep in `SKILL.md`. |
| Ordered execution workflow | skill | Keep concise, step-oriented, and testable. |
| Required reads | skill frontmatter or short table | Declare through `context-*` fields when possible. |
| Validation commands | skill | Keep exact commands in the workflow. |
| Long judgment rubric | standard or skill-local reference | Move out of `SKILL.md`; link through context manifest or skill-local reference. |
| Long examples | skill-local reference or template | Move out unless the example is needed to choose the mode. |
| Reusable document body | document template | Store under `agent/document-templates/`. |
| Naming or lifecycle policy | standard | Store under `agent/standards/`. |
| Domain reference catalog | artifact pack reference | Classify as `domain-reference`; keep placement `undecided` until pack migration starts. |
| Machine-checkable contract | validator check | Add to `scripts/validate-llm-first.mjs` or future pack validator after the inventory schema exists. |

### Skill Body Shape

Every maintained skill converges on this shape:

| Section | Required | Content |
|---------|----------|---------|
| frontmatter | yes | description, routing metadata, context manifest when needed |
| Purpose | yes | when to use the skill |
| Inputs or Modes | yes | accepted user intents and arguments |
| Workflow | yes | ordered execution steps |
| Validation | yes for write-capable skills | exact commands or checks |
| Report | yes | output fields to return to the user |
| Related | optional | canonical docs only |

Move other sections out unless they are short and required to execute the next
step.

### Misjudgment Reduction Contract

| Failure mode | Control |
|--------------|---------|
| wrong skill chosen | expose router and lifecycle skills before domain skills |
| too many candidate skills | hide pack and reference artifacts until route evidence matches |
| stale or duplicate guidance wins | keep one canonical owner for policy, rubric, template, or validator contracts |
| examples override workflow | move examples to references and load them only after mode selection |
| domain workflow leaks into unrelated work | require repo key, route domain, or user wording before loading domain-pack artifacts |
| skill body hides required policy | declare runtime-required extracted artifacts through frontmatter/context manifest |
| extracted docs create more ambiguity | classify every extracted item by `content-kind`, target home, runtime requirement, and validator need |

### Routing Exposure Budget

| Surface | Budget rule |
|---------|-------------|
| cold-start route choice | load entry policy, rule index, router skills, and compact manifests only |
| pre-route skill bodies | do not load domain, repo, example, template, or reference bodies before route evidence matches |
| router output | return one primary route and explicit secondary routes only when evidence supports them |
| domain pack exposure | expose pack manifest metadata first; load pack artifacts only after resolver match |
| skill references | load on demand unless `required-at-runtime` is `yes` |
| template bodies | load only when producing that document kind |
| validator contracts | load through validator command or fail-only check, not through broad skill prose |

### Decision Quality Metrics

Pilot extraction records before/after values for these metrics.

| Metric | Measurement | Pass gate |
|--------|-------------|-----------|
| `pre-route-candidate-count` | candidate skills or pack exports after compact metadata filtering | `<= 5` and one primary route |
| `pre-route-skill-body-count` | `SKILL.md` bodies read before a primary route is selected | `<= 1` router body |
| `loaded-context-bytes` | selected skill body plus required `context-*` references before workflow step 1 | `<= context-profile.maxBytes` |
| `must-not-load-violations` | excluded or unrelated domain bodies loaded before matching route evidence | `0` |
| `canonical-owner-conflicts` | multiple artifacts owning the same policy, rubric, template, or validator contract | `0` |
| `secondary-route-count` | routes returned besides the primary route | `<= 2`, each with explicit evidence |

Route improvement passes only when the pilot meets every pass gate. Token
reduction without these gates does not count as LLM decision-quality
improvement.

### Router Selection Priority

Apply the first matching tier. Do not read lower-tier skill bodies until the
active tier selects a primary route or the route evidence gate passes.

| Priority | Tier | Exposed before route selection |
|----------|------|--------------------------------|
| 1 | bootstrap | `SYSTEM.md`, entry document, auto rules, rule index, compact routing index |
| 2 | user-named artifact | exact skill, command, spec, PR, issue, file, or pack named by the user |
| 3 | task-type router | one of plan, review, implementation, git, authoring, ops, research, deploy |
| 4 | lifecycle router | spec, milestone, artifact, template, config, worktree, PR, or release lifecycle router |
| 5 | domain or repo router | router matching repo key plus route domain or task type |
| 6 | leaf skill | selected execution skill after evidence gate passes |

If two same-tier routers match, keep both as candidates only when each has
explicit route evidence. Otherwise ask a short clarification or read only the
compact routing index.

### Route Evidence Gate

Do not load a domain, repo, pack, reference, template, or leaf skill body until
one gate passes.

| Gate | Required evidence |
|------|-------------------|
| direct user naming | user names the skill, command, pack, PR, issue, file, or route domain |
| repo task match | repo key matches current cwd and task type matches user intent |
| domain task match | route domain plus task type plus file extension, language, framework, or domain term match |
| router decision | higher-priority router returns one primary route with at least two evidence fields |
| runtime requirement | selected skill declares the artifact as `required-at-runtime: yes` through frontmatter/context manifest |

Blocking rules:

| Condition | Action |
|-----------|--------|
| `exclude-when` matches active route evidence | do not load the artifact |
| only one weak evidence field matches | ask or inspect compact routing index |
| more than five candidates remain | ask or narrow by repo key, task type, or changed files |
| secondary route lacks evidence | drop the secondary route |

### Skill Creation Gate

Before adding a new skill, classify the proposed content:

| Proposed content | Create |
|------------------|--------|
| task trigger plus ordered tool workflow | skill |
| cross-skill decision criteria | standard |
| reusable output body | document template |
| long example set | reference |
| exact allowed values or path contract | standard plus validator |
| route-only delegation to existing skills | router skill only when no existing router can own the route |
| domain-specific workflow | pack candidate skill unless the workflow is needed before pack loading |

If the proposed skill duplicates an existing router, lifecycle skill, or
standard, update the canonical owner instead of adding a new skill.

Authoring integration:

| Owner | Required update |
|-------|-----------------|
| `ah-make-skill` | apply this gate before creating a skill; redirect non-workflow content to standard, template, reference, or validator work |
| `ah-make-standard` | receive cross-skill decision criteria and long policy extracted from skills |
| `ah-manage-document-template` | receive reusable output bodies extracted from skills |
| `scripts/validate-llm-first.mjs` | fail new high-cost skills without routing metadata, context manifest, or exemption after rollout |

### Extraction Targets

| If the skill section answers | Move to |
|------------------------------|---------|
| "How do I decide between cases?" | `agent/standards/<domain>/<topic>.md` |
| "What generated body is emitted?" | `agent/document-templates/**` |
| "What are many examples?" | reference route owner |
| "What exact path/name/status is allowed?" | standard plus validator |
| "How do I call tools in order?" | keep in skill |
| "What external repo policy applies?" | repo-local doc or reference route owner |

### Reference Route Ownership

Before writing a `reference` extraction target, assign one owning consumer.

| Reference scope | Owner | Target path |
|-----------------|-------|-------------|
| one existing skill consumes it after route selection | owning skill | `agent/skills/<skill>/references/<slug>.md` |
| command authoring or skill authoring examples | owning authoring skill | `agent/skills/<authoring-skill>/references/<slug>.md` |
| cross-skill decision criteria or policy | standard owner | not a reference; route to `agent/standards/<domain>/` |
| reusable generated body | template owner | not a reference; route to `agent/document-templates/` |
| domain-pack detail with no current core owner | artifact-pack manifest | inventory row with `target-path: undecided` until the manifest contract selects a path |

Runtime load rule:

| Condition | Action |
|-----------|--------|
| required before workflow step 1 | declare the reference in `context-references` |
| only needed after mode or route selection | link it in the body; do not declare it in pre-route context |
| no single owner exists | block the extraction and add an inventory blocker row |

### Inventory Model

Artifact inventory separates the skill row from extraction item rows.
The skill row classifies the current skill body. Extraction item rows classify
each piece of content that can leave the skill.

Common row fields:

| Field | Values |
|-------|--------|
| `row-id` | stable unique id |
| `row-type` | `artifact`, `skill`, or `extraction-item` |
| `source-artifact-path` | current tracked path |
| `artifact-type` | `skill`, `command`, `rule`, `standard`, `config`, `script`, `doc`, `fixture`, `generated-view`, or `shim` |
| `owner-domain` | core, repo, company, personal, domain, experiment, or unknown |
| `privacy-risk` | `public-safe`, `needs-scrub`, `private-only`, or `unknown` |
| `dependencies` | referenced artifacts, scripts, config files, or `none` |
| `proposed-destination` | `knitten-core`, `knitten-private-pack`, `domain-pack`, `deprecated`, `migrate-later`, or `undecided` |
| `compatibility-need` | alias, shim, redirect, old-path-mapping, none, or unknown |
| `review-state` | pending, accepted, blocked, or moved |

Skill row fields:

| Field | Values |
|-------|--------|
| `skill-size` | `tiny`, `small`, `medium`, `large`, `huge` |
| `skill-kind` | `workflow-only`, `workflow-with-notes`, `guide-heavy`, `reference-heavy`, `mixed-heavy`, `unknown` |
| `core-skill-role` | `bootstrap`, `router`, `lifecycle`, `domain`, `repo-specific`, `none` |
| `extraction-count` | integer count of extraction item rows for this skill |
| `split-readiness` | `none`, `low`, `ready`, `blocked` |

Extraction item row fields:

| Field | Values |
|-------|--------|
| `parent-row-id` | `row-id` of the source skill row |
| `extraction-id` | stable id unique within the parent skill |
| `source-section` | exact heading or line anchor in the source skill |
| `content-kind` | `judgment`, `example`, `output-body`, `naming-policy`, `lifecycle-policy`, `domain-reference`, `machine-checkable-contract` |
| `extracted-artifact-type` | exact `artifact-type` enum value from the common fields |
| `artifact-subkind` | `guide`, `reference`, `document-template`, `validator-check`, `rubric`, `example`, or `none` |
| `target-path` | planned path or `undecided` |
| `required-at-runtime` | `yes`, `no`, `unknown` |
| `validation-needed` | `yes`, `no`, `unknown` |

Row identity rules:

| Rule | Requirement |
|------|-------------|
| artifact row id | use `artifact:<source-artifact-path>` |
| skill row id | use `skill:<source-artifact-path>` |
| extraction row id | use `extraction:<source-artifact-path>#<extraction-id>` |
| parent link | every extraction item row must point to an existing skill row through `parent-row-id` |
| extraction count | skill `extraction-count` must equal linked extraction item rows |
| base fields | extraction item rows fill the common row fields independently; do not infer privacy, owner, destination, or dependencies from the parent skill |

Skill-size classification:

| Value | Deterministic rule |
|-------|--------------------|
| `tiny` | 80 lines or fewer. |
| `small` | 81-160 lines. |
| `medium` | 161-260 lines. |
| `large` | 261-400 lines. |
| `huge` | More than 400 lines. |

Skill-kind classification:

| Value | Deterministic rule |
|-------|--------------------|
| `workflow-only` | Execution workflow only, with no extraction candidates. |
| `workflow-with-notes` | Workflow plus one or two small notes or reference candidates. |
| `guide-heavy` | Three or more extraction candidates, including judgment, policy, or rubric material. |
| `reference-heavy` | Three or more extraction candidates, mostly examples or domain reference material. |
| `mixed-heavy` | Three or more extraction candidates with no dominant guide/reference character. |
| `unknown` | Required fields are missing or the skill cannot be classified after one complete file read. |

Split-readiness classification:

| Value | Deterministic rule |
|-------|--------------------|
| `none` | No extraction candidates. |
| `low` | One extraction candidate with a known target. |
| `ready` | Two or more extraction candidates with known targets. |
| `blocked` | At least one extraction candidate has no target home yet. |

Extraction target matrix:

| `content-kind` | `extracted-artifact-type` | `artifact-subkind` | Default home |
|----------------|---------------------------|--------------------|--------------|
| `judgment` | `standard` | `rubric` | `agent/standards/<domain>/` |
| `example` | `doc` | `example` | reference route owner |
| `output-body` | `doc` | `document-template` | `agent/document-templates/` |
| `naming-policy` | `standard` | `none` | `agent/standards/<domain>/` |
| `lifecycle-policy` | `standard` | `guide` | `agent/standards/<domain>/` |
| `domain-reference` | `doc` | `reference` | reference route owner or `undecided` until the pack boundary decides |
| `machine-checkable-contract` | `script` | `validator-check` | `scripts/validate-llm-first.mjs` or future pack validator |

Runtime load rule:

| `required-at-runtime` | Load behavior |
|-----------------------|---------------|
| `yes` | Keep the content in the skill, or declare the extracted target through frontmatter/context manifest. |
| `no` | Link as on-demand reference. Do not load before route selection. |
| `unknown` | Block extraction until the pilot review decides `yes` or `no`. |

Machine-readable inventory rule:

The canonical inventory must be machine-readable before fail-only validation
starts. Markdown inventory tables are validated views, not canonical storage.
The `artifact-inventory-classification` spec owns the exact file path and
format, using JSON, JSONL, TSV, or a registry-backed generated view.

### Guide Artifact Decision

This spec does not decide whether `guide` is a first-class artifact type.

Until the artifact-pack manifest contract decides otherwise, `guide` is an
`artifact-subkind`, not an `extracted-artifact-type`, path root, or migration
destination.

| Need | Home |
|------|------|
| shared policy or criteria | `agent/standards/` |
| skill-specific detail | `agent/skills/<skill>/references/` |
| domain-pack detail | future artifact pack references |
| generated body | `agent/document-templates/` |

The future core boundary and artifact-pack manifest specs decide:

1. whether `guide` becomes a first-class artifact type;
2. whether a specific extracted artifact stays in core;
3. whether a specific extracted artifact moves to a public or private pack.

### Validator Direction

Use discovery commands before pilot extraction. Add fail-only validator checks
after the inventory schema exists and at least one pilot extraction proves the
schema.

Potential checks:

| Check | Behavior |
|-------|----------|
| inventory schema | fail invalid enum values, duplicate row ids, missing parent links, and extraction-count mismatches |
| context manifest | fail undeclared standard/rule references in pilot skills |
| template ownership | fail `output-body` rows without `artifact-subkind: document-template` and a valid `target-path` |
| extraction coverage | fail `guide-heavy`, `reference-heavy`, or `mixed-heavy` skills with no extraction item rows |
| route quality metrics | fail pilot reports that exceed decision-quality pass gates |
| authoring gate | fail new high-cost skills without routing metadata, context manifest, or explicit exemption |

### Extraction Rollout Rule

Use this rule after a pilot classification row is accepted and before editing a
source skill.

| Step | Rule |
|------|------|
| 1. Select row | Pick one extraction item row with `review-state: accepted` and a parent skill row with `split-readiness: low` or `ready`. |
| 2. Verify target owner | Reuse `target-path` only when the target already contains equivalent content or the same change patches the target before shrinking `SKILL.md`. |
| 3. Preserve execution | Keep trigger, inputs, mode selection, ordered workflow, validation commands, and report format in `SKILL.md`. |
| 4. Replace duplicate prose | Replace duplicated judgment, rubric, example, or format prose with a direct target reference and heading. |
| 5. Declare runtime reads | If `required-at-runtime: yes`, add the target to frontmatter `context-*` or to the skill's required-read table. |
| 6. Keep on-demand reads out | If `required-at-runtime: no`, link the target only where the workflow needs it after mode or route selection. |
| 7. Resolve validation need | If `validation-needed: unknown`, record manual proof in the report or review the row before extraction. |
| 8. Regenerate inventory | Run `node scripts/generate-artifact-inventory.mjs` after the skill or target changes. |
| 9. Validate drift | Run `node scripts/validate-llm-first.mjs --check artifact-inventory` and full validation. |
| 10. Record proof | Add a report under `docs/plans/reports/artifact-inventory-classification/` with before/after metrics, target-owner proof, validation-need proof, and validation commands. |

Rollout stops when any condition matches:

| Condition | Action |
|-----------|--------|
| target owner is ambiguous | mark the row `blocked`; do not create a new reference path |
| target file exists but lacks equivalent content | patch the target in the same change or stop before shrinking `SKILL.md` |
| runtime requirement is `unknown` | review the row first; do not extract |
| validation need is `unknown` and no manual proof exists | review the row first; do not extract |
| extraction removes executable workflow | revert the extraction and keep the skill body intact |
| target belongs to a future pack decision | keep `target-path: undecided` until `core-artifact-boundary` or the manifest specs decide it |

Validator rollout stays fail-only and narrow:

| Check | Status |
|-------|--------|
| schema, enum, parent link, extraction-count, path safety | enforced |
| `source-section` existence | enforced |
| high-cost skill extraction coverage | deferred until at least one non-Shotloom pilot extraction lands |
| route quality metric gates | deferred until reports use one stable metric table |
| core-vs-pack destination enforcement | deferred to `core-artifact-boundary` and artifact-pack manifest specs |

## Execution Plan

### Batch A: Accept Boundary Spec

1. Done: Review this spec against `agent-artifact-pack-system`.
2. Done: Record that guide/core/pack retention decisions are deferred to the future
   core boundary and artifact-pack manifest specs.
3. Done: Attach this spec to the milestone.

### Batch B: Authoring Gate Wiring

1. Done: Update `ah-make-skill` to run the skill creation gate before writing a new
   skill.
2. Done: Add a command-creation ban and route duplicates into existing skill owners
   or routers.
3. Done: Update `ah-make-standard` and `ah-manage-document-template` handoff wording
   so extracted criteria and reusable bodies have canonical homes.
4. Deferred: Add validator checks only after the pilot extraction proves the gate.

### Batch C: Inventory Schema Update

1. Done: Add the skill row and extraction item row fields from this spec to the
   artifact inventory contract in `artifact-inventory-classification`.
2. Done: Define the machine-readable inventory source and schema paths in
   `artifact-inventory-classification`.
3. Done: Add the initial inventory generator and generated JSON output through
   `artifact-inventory-classification`.
4. Done: Validate pilot skill classifications without reading chat history.
   Evidence: `docs/plans/reports/artifact-inventory-classification/pilot-classification-review-2026-05-24.md`.

### Batch D: Pilot Classification

Done: initial generated inventory covers 5 representative skills:
`ah-manage-spec`, `ah-route-plan`, `shotloom-review-before-pr`,
`obsidian-obsidian-markdown`, and `hatch-pet`.

1. Done: Select 5 skills from different families:
   - one `ah-*` lifecycle skill;
   - one router skill;
   - one Shotloom review skill;
   - one Obsidian skill;
   - one domain-heavy skill.
2. Done: Classify each skill row by `skill-size`, `skill-kind`,
   `core-skill-role`, `extraction-count`, and `split-readiness`.
3. Done: Add extraction item rows for source sections that can leave the pilot
   skills.
4. Done: Review blockers where no existing target home fits.
   Evidence: blocked pilot rows in `agent/config/artifact-inventory.json`.

### Batch E: Pilot Extraction

1. Done: Pick one low-risk `workflow-with-notes`, `guide-heavy`, or
   `reference-heavy` skill with `split-readiness: ready`.
   Evidence: `shotloom-review-before-pr`.
2. Done: Move durable guidance to the selected target home.
   Evidence: `docs/plans/reports/artifact-inventory-classification/pilot-extraction-shotloom-review-before-pr-2026-05-24.md`.
3. Done: Record before/after decision-quality metrics.
   Evidence: pilot extraction report.
4. Done: Keep the skill executable through frontmatter, required reads, workflow, and
   validation.
5. Done: Run validators and review cold-start readability.
   Evidence: `node scripts/validate-llm-first.mjs`.

### Batch F: Rollout Rule

1. Done: Convert the pilot result into an extraction rule for inventory
   classification.
   Evidence: `Extraction Rollout Rule`.
2. Done: Hand core-vs-pack placement decisions to `core-artifact-boundary` and the
   future artifact-pack manifest specs.
   Evidence: validator rollout table.
3. Done: Keep fail-only validator enforcement narrow until the rule is proven.
   Evidence: broad extraction coverage and route quality gates stay deferred.

## Validation

Required for this spec:

```bash
node scripts/validate-llm-first.mjs --check spec-lifecycle
node scripts/validate-llm-first.mjs
git diff --check
```

Inventory discovery commands for future implementation:

```bash
rg -n "## .*Examples|## .*Guidelines|## .*Rubric|## .*Reference" agent/skills/*/SKILL.md
rg -n "context-standards|context-references|context-rules" agent/skills/*/SKILL.md
node scripts/validate-llm-first.mjs --check context-routing
```

Decision-quality baseline commands:

```bash
find agent/skills -name SKILL.md | wc -l
find agent/skills -name SKILL.md -print0 | xargs -0 wc -l | sort -nr | head -20
rg -l "^context-(rules|standards|repo-docs|references|profile):" agent/skills/*/SKILL.md | wc -l
rg -l "^domains:|^repo-keys:|^task-types:|^work-modes:" agent/skills/*/SKILL.md | wc -l
```

## Risks

| Risk | Mitigation |
|------|------------|
| skills become too thin to execute | keep workflow, validation, and required reads in the skill |
| standards become dumping grounds | standards own criteria and policy; long examples go to references or templates |
| guide naming drifts before manifest design | keep `guide` as an artifact subkind until manifest contract accepts it |
| extraction breaks active workflows | migrate one skill at a time with compatibility links and validation |
| core-vs-pack decision happens too early | defer retention decisions to core boundary and artifact-pack specs |
| too many extracted references increase load | load extracted references only through route-specific frontmatter/context manifests or on-demand links |
| skill reduction optimizes token count but keeps wrong choices | measure route exposure and require one canonical owner for policy, examples, templates, and validators |

## Acceptance Criteria

1. The skill/body boundary is documented before artifact inventory work starts.
2. Inventory classification has separate skill rows and extraction item rows.
3. Extraction item rows have stable ids, parent skill links, accepted artifact
   type, artifact subkind, target path, runtime requirement, and validation
   need.
4. `guide` is treated as an artifact subkind until the manifest contract decides
   otherwise.
5. Core-vs-pack retention is explicitly deferred to `core-artifact-boundary`
   and artifact-pack manifest work.
6. Pilot classification covers at least five representative skills before broad
   migration.
7. No skill is reduced unless its execution workflow remains cold-start
   complete.
8. Pilot extraction records decision-quality metrics before and after the
   extraction.
9. Validator enforcement is fail-only and delayed until inventory schema plus
   one pilot extraction prove the pattern.
10. The spec defines controls for wrong route selection, duplicate guidance,
   accidental domain-context loading, and example-led workflow drift.
11. Router priority and route evidence gates block domain, repo, pack,
    reference, template, and leaf skill bodies before matching evidence exists.
12. Skill creation gate wiring is assigned to `ah-make-skill`,
    `ah-make-standard`, `ah-manage-document-template`, and
    `scripts/validate-llm-first.mjs`.

## Open Decisions

| Decision | Default |
|----------|---------|
| Is `guide` a first-class artifact type? | Defer to artifact-pack manifest design. |
| First pilot skill | Choose after inventory shows a low-risk ready skill. |
| Skill size budget | Use existing high-cost routing thresholds until extraction data exists. |
| Core or pack placement | Defer to `core-artifact-boundary` and pack classification. |
