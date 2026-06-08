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

## Boundary

In scope:

- A generic `SKILL.md` shape for AH and payload skills.
- Activation checks, non-trigger rules, stop conditions, and progressive
  reference loading.
- Guidance for moving detailed procedures into skill-local references or
  scripts.
- Validation/audit criteria for identifying overlong or under-gated skills.

Out of scope:

- Rewriting every skill in this milestone.
- Changing Codex plugin loading semantics.
- Removing safety instructions from mutation-capable skills.
- Moving domain-specific references into Knitten core.
- Replacing scripts with natural-language instructions.

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

## Open Questions

- Which three skills should be the pilot batch?
- Should Knitten add a validator for required activation sections, or keep this
  as an audit guideline until the pattern stabilizes?
- What rough size threshold should trigger review of an overlong `SKILL.md`?

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

Risk:

- Over-standardizing too early may make simple skills more rigid than useful.

Proof:

- Cold review finds no blocker in the finalized milestone.

#### 2. Pick A Pilot Batch

Files:

- `skills/*/SKILL.md`

Changes:

- Choose a small set of skills with different risk levels:
  - one read-only review or planning skill
  - one implementation skill
  - one mutation-adjacent PR or external-state skill

Risk:

- Choosing only easy read-only skills may fail to test the safety contract.

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
