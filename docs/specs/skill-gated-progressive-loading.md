# Skill Gated Progressive Loading

## Status

Draft.

## Goal

Define a milestone for making AH and payload skills more token-efficient by
turning each `SKILL.md` into a short activation gate and loading detailed
workflow references only after the request clearly matches the skill.

## Problem

Large skill bodies spend tokens before the model knows whether the skill is the
right tool for the request. This creates two failure modes:

- Misrouted requests pay the full cost of a long skill before being rejected.
- Correctly routed requests load detailed implementation, review, and validation
  instructions even when only the activation decision is needed.

Knitten already benefits from explicit routing and boundary rules. The next
efficiency improvement is to make skill activation itself cheaper and more
mechanically auditable.

This milestone intentionally starts with Claude-Skills-style progressive
disclosure rather than a full RAG or rerank system. Knitten already has
plugin-local skill files, references, and scripts; the first useful improvement
is to make those layers load in the right order. Retrieval can be added later
when the number of references makes manual conditional loading too noisy.

## Boundary

In scope:

- A generic `SKILL.md` shape for AH and payload skills.
- Activation checks, non-trigger rules, stop conditions, and progressive
  reference loading.
- Guidance for moving detailed procedures into skill-local references or
  scripts.
- Validation/audit criteria for identifying overlong or under-gated skills.
- A first pilot batch that exercises read-only, implementation, and
  mutation-adjacent skill surfaces.

Out of scope:

- Rewriting every skill in this milestone.
- Changing Codex plugin loading semantics.
- Removing safety instructions from mutation-capable skills.
- Moving domain-specific references into Knitten core.
- Replacing scripts with natural-language instructions.
- Building vector search, retrieve-and-rerank, or full RAG infrastructure in the
  first adoption round.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| Existing `SKILL.md` files | Yes | Skills to classify and eventually migrate. |
| User trigger examples | Yes | Positive and negative examples for activation. |
| Skill mutation surface | Yes | Whether the skill can edit files, push, deploy, delete, post, or mutate external state. |
| Existing references/scripts | No | Detailed workflow material that can be loaded after activation. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Milestone plan | durable | Ordered work for adopting gated progressive loading. |
| Skill shape guideline | durable | A reusable contract for short skill bodies. |
| Audit checklist | durable | Mechanical checks for activation clarity and reference loading. |
| Migrated pilot skills | durable | A small first batch proving the pattern. |

## Contract

- `SKILL.md` should primarily answer whether the skill applies.
- `SKILL.md` must include enough trigger, non-trigger, input, and stop-condition
  detail to reject mismatches without reading long references.
- If the request matches, `SKILL.md` may instruct the model to read a specific
  skill-local reference, such as `references/flow.md`, before execution.
- Mutation-capable skills must keep their activation check and safety gate in
  `SKILL.md`, not only in a deferred reference.
- Detailed procedures, review lenses, examples, output schemas, and validation
  matrices should move to references or scripts when they are not required for
  the initial activation decision.
- Scripts should own mechanically checkable validation whenever practical.
- Payload skill references remain payload-owned. Knitten core may define the
  generic pattern and audit criteria.
- RAG is a later-stage optimization. The first adoption round should use
  explicit reference-selection rules inside `SKILL.md`, not implicit retrieval.
- Reference-selection rules should be conditional and concrete: name which
  reference to read for which matched situation.

## Recommended Architecture

Adopt this order of investment:

| Phase | Focus | Why |
|-------|-------|-----|
| 1 | Gated progressive loading | Immediate token savings without new infrastructure. |
| 2 | Skill audit checklist | Finds long, ambiguous, or unsafe skills before broad migration. |
| 3 | Lightweight reference index | Helps when explicit reference selection becomes repetitive. |
| 4 | RAG or rerank | Only needed when skill/reference volume is too large for simple routing. |

The first two phases are the current milestone. Phases 3 and 4 are deferred
until repeated use shows that manual reference-selection rules are no longer
enough.

## Proposed Skill Shape

```markdown
---
name: <skill-name>
description: <short activation-oriented description>
---

# <Skill Name>

## Activation

Use this skill when:

- <positive trigger>

Do not use this skill when:

- <negative trigger or neighboring skill>

## Required Input

- <minimum input needed to continue>

## Step 0: Activation Check

1. Decide whether the request matches this skill.
2. If it does not match, stop and name the better route when obvious.
3. If required input is missing, ask only for the missing input.
4. If it matches, read `references/flow.md` before executing.

## Safety

- <mutation, external-state, or approval gate>
```

## Validation

- `rg -n "Step 0: Activation Check|Activation|Do not use this skill" skills -S`
- Skill audit verifies that mutation-capable skills keep safety gates in
  `SKILL.md`.
- Pilot migrated skills are reviewed with `ah-audit-skill`.
- Existing plugin validators still pass after any pilot migration.

## Acceptance Criteria

- A reusable gated skill shape is documented.
- The first pilot batch is identified before broad migration.
- Pilot skills have shorter `SKILL.md` bodies with explicit trigger and
  non-trigger rules.
- Pilot skills load detailed references only after activation.
- No mutation-capable skill loses its Step 0 safety gate.
- No payload-owned reference is moved into Knitten core.
- No RAG or vector-search infrastructure is introduced in the first adoption
  round.
- A follow-up decision point is documented for whether audit should become
  validator-enforced after the pilot.

## Open Questions

- Should Knitten add a validator for required activation sections after the
  pilot, or keep this as an audit guideline until the pattern stabilizes?
- What rough size threshold should trigger review of an overlong `SKILL.md`?

## Proposed Pilot Batch

| Skill | Surface | Reason |
|-------|---------|--------|
| `ah-review-work` | read-only review umbrella | Tests fast routing between spec, implementation, PR, and skill review. |
| `kc-implement` | implementation umbrella | Tests deferring detailed flow while keeping scoped-edit rules visible. |
| `ah-create-pr` | mutation-adjacent PR leaf | Tests that explicit user-request and push/PR safety gates stay in `SKILL.md`. |

These pilots cover the main risk classes without requiring payload-plugin
migration in the first round.

## Design Plan

### Inputs

- This milestone draft.
- Existing AH skills under `skills/`.
- `docs/specs/skill-activation-check-policy.md`.
- Representative payload skills from installed payload plugins when a pilot is
  chosen.

### Outputs

- A finalized milestone spec.
- Optional guideline updates.
- Pilot skill migrations in a later implementation round.

### Implementation Sequence

#### 1. Finalize The Contract

Files:

- `docs/specs/skill-gated-progressive-loading.md`
- `docs/specs/skill-activation-check-policy.md`

Changes:

- Resolve open questions.
- Decide whether this pattern is advisory or validator-enforced.
- Align terminology with the existing activation-check policy.
- Keep RAG and rerank out of the first adoption round.

Risk:

- Over-standardizing too early may make simple skills more rigid than useful.

Proof:

- Cold review finds no blocker in the finalized milestone.

#### 2. Pick A Pilot Batch

Files:

- `skills/ah-review-work/SKILL.md`
- `skills/kc-implement/SKILL.md`
- `skills/ah-create-pr/SKILL.md`

Changes:

- Confirm or revise the proposed pilot batch.
- For each pilot, write trigger/non-trigger examples and expected reference
  files.

Risk:

- Choosing pilots that are too broad may make the first migration hard to
  review.

Proof:

- Pilot list includes activation rationale and expected reference files.

#### 3. Migrate Pilot Skills

Files:

- `skills/<skill>/SKILL.md`
- `skills/<skill>/references/flow.md` when needed
- skill-local scripts when validation can be mechanical

Changes:

- Reduce each pilot `SKILL.md` to activation, required input, Step 0, and safety.
- Move detailed flow into a skill-local reference.
- Keep mutation safety gates in the main skill file.
- Make reference loading explicit, for example:
  - `references/spec-review-flow.md` for spec/design review
  - `references/implementation-flow.md` for implementation
  - `references/pr-create-flow.md` for PR creation

Risk:

- If references are too hidden, the model may proceed without reading them.

Proof:

- Each pilot skill explicitly says which reference to read after activation.
- `ah-audit-skill` review passes for every pilot.

#### 4. Add Audit Or Validator Support

Files:

- `scripts/doctor.mjs` or a future skill audit helper, only if enforcement is
  accepted.

Changes:

- Prefer audit guidance first.
- Add validation only for mechanically checkable required sections if the pilot
  proves stable.

Risk:

- A validator could reject valid minimal skills if section names are too strict.

Proof:

- Validator, if added, catches missing activation gates without scanning
  historical docs or banning words.

### Review Plan

- Contract: verify `SKILL.md` remains sufficient for fast activation and safe
  rejection.
- Token efficiency: verify detailed flow is deferred until after activation.
- Safety: verify mutation gates remain in the main skill file.
- Boundary: verify payload-owned detail stays in payload plugins.
