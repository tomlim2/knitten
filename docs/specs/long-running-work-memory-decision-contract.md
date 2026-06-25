# Long-Running Work Memory And Decision Contract

## Status

Implemented.

Compatibility note: this contract still describes the generic KC memory model
and the KC-era Shotloom integration. Shotloom task artifacts are now amended by
[`shotloom-owned-task-memory.md`](shotloom-owned-task-memory.md): new primary
Shotloom task memory lives under the Shotloom checkout and is resolved by
Shotloom's `scripts/agent-task-artifact.mjs`; KC Shotloom registry entries are
compatibility-era surfaces during migration.

## Goal

Define a small KC-owned contract for long-running Codex work, then apply it to
Shotloom preparation and handoff flows without creating a larger dossier system.

The result should make task memory, user decision gates, prepared task goals,
and handoffs explicit enough that later Shotloom work can continue across
sessions without depending on chat history alone.

## Problem

Knitten already owns generic output routing and Shotloom already writes several
task artifacts, but the long-running work contract is implicit:

- KC says durable documents and local outputs route through different systems,
  but it does not yet name the broader memory rule: code belongs in repos and
  rolling task context belongs in registered local artifact paths.
- Shotloom prepare-task already appends a briefing entry, but the briefing
  template does not explicitly require a prepared task goal, definition of done,
  verification target, open loops, or resume handoff.
- Shotloom workflows contain many approval gates, but there is no short shared
  statement that separates "Codex prepares" from "user decides" for long-running
  loops.
- Steering behavior is handled by general Codex instructions, not by the
  Shotloom task process. A mid-run user correction should be treated as workflow
  steering and recorded when it changes scope.

The OpenAI Codex-maxxing white paper frames this as a reusable loop: durable
threads keep work alive, memory should be reviewable outside chat history,
verifiable task goals give Codex something to verify, and Codex can prepare next actions
while the user keeps judgment over approvals and irreversible actions.

Reference:
https://cdn.openai.com/pdf/8a9f00cf-d379-4e20-b06f-dd7ba5196a11/OAI_WhitePaper_Codex-maxxing26.pdf

## Boundary

In scope:

- KC-owned long-running work contract text.
- KC plugin boundary guidance for repo memory vs registered local artifact
  memory.
- KC-owned Shotloom prepare briefing template fields.
- KSL process policy applying the KC contract to Shotloom task loops.
- KSL prepare-task flow updates that require the new briefing and activity-log
  fields.
- Validation through existing KC and KSL doctor/validator commands.

Out of scope:

- New automation scheduling behavior.
- New connector workflows.
- New task dossier database or broad artifact taxonomy.
- Moving Shotloom domain-specific runtime caches into KC.
- Making KAS own generic long-running work policy.
- Enforcing every field through a new validator in the first pass.
- Rewriting historical task artifacts.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| OpenAI Codex-maxxing white paper | Yes | Source idea for durable loops, reviewable memory, verifiable task goals, and user decision gates. |
| Knitten core source checkout | Yes | Active KC workspace that owns generic policy, templates, and validators. |
| Knitten Shotloom source checkout | Yes | Active KSL workspace that applies the KC contract to Shotloom workflows. |
| `SYSTEM.md` | Yes | First KC policy read and shortest place to state the generic contract. |
| `docs/guidelines/plugin-boundary.md` | Yes | Canonical KC/payload ownership boundary. |
| `agent/config/local-artifact-paths.json` | Yes | Existing registered local artifact paths for Shotloom task memory. |
| `document-templates/agent-hub/shotloom-prepare-task-briefing.md` | Yes | KC-owned template for the user-facing Shotloom prepare briefing. |
| `knitten-sl/skills/shotloom-references/references/PROCESS_POLICY.md` | Yes | KSL shared operational policy for Shotloom review/task loops. |
| `knitten-sl/skills/shotloom-prepare-task/flow.md` | Yes | Flow that renders the briefing and appends task activity. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| KC system contract update | durable | Short statement of long-running work memory and decision boundaries. |
| KC boundary guideline update | durable | Clarifies that KC owns generic memory/output contract while payloads apply it. |
| KC prepare briefing template update | durable | Adds prepared task goal and handoff fields to the Shotloom briefing template. |
| KSL process policy update | durable | Adds Shotloom steering, prepared work/user decision, and handoff rules. |
| KSL prepare-task flow update | durable | Requires the new template fields and logs the handoff/open-loop summary. |
| Validation evidence | local / chat | Existing doctor and routing checks proving no plugin boundary regression. |

## Contract

- KC owns the generic long-running work contract.
- Payload plugins may apply the contract to domain workflows, but must not own a
  separate generic memory/output policy.
- Repositories hold code, specs, and committed durable docs.
- Registered local artifact paths hold rolling task context: decisions, open
  loops, verification state, review notes, briefings, and resume handoffs.
- Reusable task context must not exist only in chat history.
- Generic task artifacts are written through KC-owned output contracts, the
  local artifact path registry, or payload shims that delegate to KC.
- Shotloom task artifacts are the accepted target-workspace exception: after
  migration they use the Shotloom repo task-memory resolver as primary storage,
  while KC output/local-artifact entries remain compatibility-era only.
- Codex may prepare summaries, evidence, patches, PR bodies, reply plans, and
  next-step recommendations.
- User approval is required before publishing, posting externally, deploying,
  rolling back, destructive cleanup, or irreversible external-state changes
  unless the active skill documents a narrower explicit exemption.
- A direct current-turn user instruction for an exact action counts as approval
  for that action only. Do not ask again for the same exact commit, push,
  plugin refresh, or cleanup after verifying that the scoped command still
  matches the requested action.
- A prepared task briefing should include a prepared task goal:
  - expected behavior
  - definition of done
  - verification target
  - review criteria
  - constraints
  - what must not change
- A long-running task handoff should include:
  - current state
  - last verified command/result
  - next decision
  - open loops
  - artifact paths
  - resume context
- Steering instructions from the user override the current plan when they
  conflict. Compatible steering is merged into the current workflow scope and
  reflected in the next briefing or handoff.

## Validation

- `node scripts/doctor.mjs` from KC.
- `node scripts/validate-payload-boundary.mjs --payload <knitten-sl-root>` from
  KC.
- `node scripts/test-shotloom-skills.mjs` from KSL.
- `node scripts/validate-routing.mjs` from KSL.
- `node scripts/validate-boundary.mjs` from KSL.
- `node scripts/doctor.mjs` from KSL after materialization.
- `rg -n "Long-Running Work|Prepared task goal|Handoff|Prepared Work|Steering" ...`
  against touched files.
- `git diff --check`.

## Acceptance Criteria

- KC states the generic long-running work contract without importing Shotloom
  execution details into core policy.
- KC boundary guidance explains that payloads apply, but do not own, generic
  memory/output policy.
- The Shotloom prepare briefing template contains prepared task goal and handoff
  sections.
- `shotloom-prepare-task` tells the agent to fill those sections from prepared
  artifacts only and to log the resulting handoff/open-loop summary.
- KSL process policy contains one shared rule for steering, one for prepared
  work/user decision, and one for handoff.
- No new broad dossier system, automation, connector dependency, or validator is
  introduced in the first pass.
- Existing KC and KSL validators pass.
- KC and KSL materialized plugin copies and Codex plugin caches can be refreshed
  without source/copy drift.
- Shotloom-specific storage language in this spec is compatibility-era and is
  superseded for new task artifacts by `shotloom-owned-task-memory.md`.

## Open Questions

None for the first implementation.

Deferred decisions:

- KAS may get a short README pointer only if a future KAS workflow needs to
  reference this contract directly. It should not own or restate the generic
  policy in this first pass.
- A future validator may require prepared task goal fields in task briefing templates
  after repeated usage proves the shape. The first pass remains review-guided.

## Design Plan

### Inputs

- This spec.
- Current KC policy and boundary docs.
- Current KC Shotloom prepare briefing template.
- Current KSL shared process policy and prepare-task flow.
- Existing KC/KSL validation scripts.
- The active KC and KSL source checkouts; do not edit installed plugin cache
  copies directly.

### Outputs

- Updated KC docs/templates.
- Updated KSL shared policy/flow docs.
- Validation evidence in the final handoff.
- Optional follow-up decision for KAS pointer or validator enforcement.

### Implementation Sequence

#### 1. Add KC Core Contract

Files:

- `SYSTEM.md`
- `docs/guidelines/plugin-boundary.md`

Changes:

- Add a short `Long-Running Work` section to `SYSTEM.md`.
- Add detailed boundary language to `plugin-boundary.md`:
  - KC owns generic memory/output/decision contract.
  - Payloads apply it through domain workflows.
  - Repos and task artifacts have different responsibilities.

Risk:

- KC policy could become too domain-specific if Shotloom examples dominate.

Proof:

- Review the diff and confirm no Shotloom-only procedure is introduced into
  `SYSTEM.md`.
- `node scripts/doctor.mjs`.

#### 2. Update KC Prepare Briefing Template

Files:

- `document-templates/agent-hub/shotloom-prepare-task-briefing.md`

Changes:

- Add `Prepared task goal` fields.
- Add `Handoff` fields.
- Update fill rules so the final Korean briefing must be based only on reviewed
  spec, planning manifest, Ready briefing, and review-gate notes.

Risk:

- Briefings could become too verbose if every field is rendered as a long
  section.

Proof:

- Template still says the user-facing briefing should be compact.
- `git diff --check`.

#### 3. Apply Contract In KSL Shared Policy

Files:

- `knitten-sl/skills/shotloom-references/references/PROCESS_POLICY.md`

Changes:

- Add `Steering` section.
- Add `Prepared Work / User Decision` section.
- Add `Long-Running Handoff` section.
- Keep existing skill-specific approval exemptions intact.

Risk:

- The new approval wording could conflict with existing explicit exemptions,
  especially `shotloom-pr-monitor auto`.

Proof:

- Confirm wording says exemptions must be documented by the active skill.
- `node scripts/validate-routing.mjs`.

#### 4. Update KSL Prepare Flow

Files:

- `knitten-sl/skills/shotloom-prepare-task/flow.md`

Changes:

- Require the template's prepared task goal and handoff fields in Step 3.
- Expand the activity-log append entry to include:
  - prepared task goal summary
  - last verified
  - next decision
  - open loops
  - artifact paths
  - resume context
- Keep the physical storage path hidden behind the output contract.

Risk:

- Agents might invent done criteria or verification if the prepared artifacts
  are thin.

Proof:

- Flow explicitly says not to invent facts and to label unknowns.
- `node scripts/test-shotloom-skills.mjs`.

#### 5. Validate, Materialize, And Refresh

Files:

- KC and KSL source checkouts.
- Local materialized plugin copies.

Changes:

- Run KC validation.
- Run KSL validation.
- Materialize KC and KSL if their source changed.
- Refresh Codex plugin cache for each changed plugin.

Risk:

- Materialized copy drift if only one side is refreshed.

Proof:

- KC `doctor` passes.
- KSL `doctor` passes with copied-source parity.
- `codex plugin list` shows refreshed KC and KSL versions when both changed.

### Review Plan

- Contract: Verify KC owns the generic policy and KSL only applies it.
- Boundary: Verify no payload-owned generic output/path registry is added.
- Validation: Verify existing KC/KSL validators pass.
- Scope: Verify no new automation, broad dossier system, or connector
  dependency is introduced.
