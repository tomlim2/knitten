# Skill Risk Tier and Step 0 Policy

## Status

Draft.

## Goal

Define how Knitten skills decide whether they are safe to run before execution.
The policy should add safety checks when a skill is created, updated, reviewed,
or given new mutation capability without forcing a full metadata rewrite across
all existing skills.

## Problem

Knitten and payload plugins contain skills with very different risk profiles:
read-only review skills, local document editors, GitHub/Linear mutators, Slack
senders, deploy workflows, cleanup tools, and routers that can call risky leaf
skills.

Today there is no uniform rule for when a skill must stop and validate:

- whether the current request actually matches the skill,
- whether required inputs are present,
- whether the action mutates local or external state,
- whether user approval is required,
- whether the skill should be treated as low, medium, or high risk.

Adding strict preflight to every skill at once would be too expensive and noisy.
The policy needs a gradual path.

## Boundary

In scope:

- Define optional `risk-tier` metadata.
- Define default inference when metadata is absent.
- Define Step 0 behavior by risk tier.
- Define when skill creation/update/review workflows must ask or infer
  `risk-tier`.
- Define how routers inherit risk from delegated skills.
- Define validation and acceptance criteria for the first implementation pass.

Out of scope:

- Bulk-tagging every existing skill.
- Rewriting every skill body in one pass.
- Changing Codex platform-level tool permissions.
- Replacing existing repo-specific approval gates.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| Skill frontmatter | Yes | Existing metadata such as `allowed-tools`, `task-types`, `description`, and future `risk-tier`. |
| Skill body | Yes | Workflow steps and mutation behavior used for inference. |
| User request | Yes | Determines whether a skill should run and whether ambiguity requires a question. |
| Boundary policy | Yes | Core/payload ownership rules from `docs/guidelines/plugin-boundary.md`. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Risk policy document | durable | Canonical rule for Step 0 and risk-tier inference. |
| Skill authoring guidance update | durable | Skill creation/update workflows ask or infer risk at the right time. |
| Optional validator checks | durable | Mechanical checks for high-risk skills and obvious missing Step 0 patterns. |
| Targeted skill updates | durable | High-risk skill examples gain explicit `risk-tier` and Step 0 text. |

## Contract

- A skill may declare `risk-tier: low | medium | high`.
- Missing `risk-tier` is not permission to skip safety checks.
- If `risk-tier` is absent, the caller infers risk from the requested action,
  skill metadata, allowed tools, and workflow body.
- Any external mutation is treated as high-risk.
- Ambiguous inferred risk defaults to medium, unless external mutation is
  possible.
- Every skill conceptually has Step 0: Applicability / Safety Check.
- Step 0 strictness depends on risk tier.
- Skill creation workflows must ask or propose risk tier.
- Skill update workflows must re-check risk when behavior, tools, or mutation
  surface changes.
- Review/promoted-reference workflows must flag missing or stale risk tier when
  a skill can affect external state.
- Routers inherit the highest risk tier of the delegated action they are about
  to invoke.

## Risk Tiers

| Tier | Typical actions | Step 0 behavior |
|------|-----------------|-----------------|
| `low` | read-only review, summarize, analyze, draft, brainstorm | Self-check request fit and inputs. Continue with stated assumptions when ambiguity is low. |
| `medium` | local file edit, local script run, spec/doc generation, local artifact creation | Validate target path, required input, workspace, and reversibility. Ask when target/scope is unclear. |
| `high` | push, merge, deploy, delete, Slack send, PR reply, GitHub/Linear mutation, credential/config change, production/cluster change | Stop unless target, account, permission, dirty state, and explicit approval rules are satisfied. Ask user when any decision can affect external state. |

## Inference Rules

Classify as `high` when any of these are true:

- Sends Slack or other team notification.
- Pushes, merges, tags, creates releases, or mutates PR/review state.
- Changes Linear/GitHub issue state.
- Deploys, rolls back, updates manifests, or touches production/cluster state.
- Deletes files, branches, worktrees, artifacts, or remote resources.
- Changes credentials, tokens, local config, or tool registration.
- Calls external APIs with POST, PATCH, PUT, DELETE, or equivalent mutation.

Classify as `medium` when any of these are true and no high-risk trigger exists:

- Writes local files.
- Runs local scripts or validators that may create local artifacts.
- Generates specs, plans, documents, images, or reports.
- Modifies skill docs, templates, standards, or references.

Classify as `low` when all actions are read-only or draft-only:

- Inspect, review, summarize, brainstorm, compare, or explain.
- No file write.
- No external state mutation.

If still unclear, use `medium`.

## Step 0 Shape

Each explicit Step 0 should use the smallest useful form for its risk tier.

Low-risk shape:

```text
### Step 0: Applicability

Confirm the request matches this skill and required input is present. If an
assumption is needed, state it in the output.
```

Medium-risk shape:

```text
### Step 0: Applicability / Workspace Check

Confirm target workspace, target files, required input, and expected output.
If target or scope is unclear, ask before editing.
```

High-risk shape:

```text
### Step 0: Applicability / Safety Gate

Confirm target, account, authority, current branch/state, mutation surface, and
required user approval. If any item is unclear, stop and ask before mutation.
```

## Ask / Infer Triggers

Ask or infer `risk-tier` when:

- creating a skill,
- updating a skill with new behavior,
- adding mutation-capable tools or external APIs,
- changing `allowed-tools` or connector capabilities,
- reviewing a skill that can affect external state,
- promoting a mechanical issue into a skill-local gate,
- turning a skill into a router or orchestrator,
- changing deploy, Slack, PR response, issue state, cleanup, credential, config,
  or production behavior.

The question should be short:

```text
This skill can <mutation>. Should its risk-tier be high and Step 0 strict?
```

When the answer is obvious from policy, infer and state the reason instead of
asking.

## Router Rule

Routers and orchestrators do not get to stay low-risk just because they delegate
work.

Contract:

- Before calling a leaf skill, infer the delegated action's risk.
- Apply the highest relevant risk tier for that invocation.
- If the router can route to high-risk leaves, its Step 0 must identify when
  high-risk confirmation is required.

## Validation

- `node scripts/doctor.mjs`
- For payload changes, run the payload plugin's doctor or skill validator.
- `rg -n "risk-tier|Step 0: Applicability|Step 0: Applicability / Safety" skills docs`
- Manual review of high-risk skills touched in the implementation pass.

## Acceptance Criteria

- Policy exists in a durable Knitten document.
- Skill creation guidance asks or proposes `risk-tier`.
- Skill update/review guidance says to add or adjust `risk-tier` when behavior
  becomes risky.
- The policy does not require immediate tagging of every existing skill.
- Missing `risk-tier` explicitly falls back to inference.
- Any external mutation is explicitly high-risk.
- Router inheritance is documented.
- At least one high-risk example skill can be reviewed against the policy.

## Open Questions

- Should `risk-tier` live only in frontmatter, or may it also be documented in a
  reference file during migration?
- Should the validator warn on high-risk keywords without `risk-tier`, or only
  after the first targeted implementation pass?

## Design Plan

### Inputs

- This spec.
- `docs/guidelines/plugin-boundary.md`.
- Existing Knitten skill creation/update/review skills.
- High-risk examples from KAS: deploy, Slack send, PR response, Linear/GitHub
  mutation, cleanup/delete.

### Outputs

- Policy doc or guideline update.
- Skill creator/update/review instruction updates.
- Optional validator warning plan.
- Targeted high-risk skill examples, if implementation includes examples.

### Implementation Sequence

#### 1. Add Canonical Risk Policy

Files:

- `docs/guidelines/skill-risk-step-zero.md`
- `SYSTEM.md`

Changes:

- Move or summarize this spec's contract into a durable guideline.
- Add a short pointer from `SYSTEM.md`.

Risk:

- Too much policy text can make skill execution slower or noisier.

Proof:

- `node scripts/doctor.mjs`
- Manual check that the policy says missing metadata uses inference.

#### 2. Update Skill Authoring / Update Workflows

Files:

- `skills/ah-draft-spec/SKILL.md`
- `skills/ah-audit-skill/SKILL.md`
- `skills/ah-review-work/SKILL.md`
- `skills/ah-promote-reference/SKILL.md`

Changes:

- Add risk-tier ask/infer triggers.
- Require Step 0 review when creating or updating skills.
- Make promoted-reference CRUD consider whether the target skill needs a
  stricter Step 0.

Risk:

- These AH skills should not become too verbose for simple low-risk work.

Proof:

- Manual read of each changed skill.
- `node scripts/doctor.mjs`

#### 3. Add Optional Mechanical Warnings

Files:

- `scripts/doctor.mjs` or a new validator script.

Changes:

- Consider warn-only checks for obvious high-risk words or tools without
  `risk-tier`.
- Keep warnings targeted; do not fail the full repo at first.

Risk:

- Keyword checks can create false positives.

Proof:

- Run validator in warn-only mode.
- Inspect sample output.

#### 4. Target High-Risk Examples

Files:

- Selected payload skill files, if scoped into implementation.

Changes:

- Add explicit `risk-tier: high` and a Step 0 safety gate to a small number of
  high-risk skills.
- Do not bulk-edit all skills.

Risk:

- Touching payload skill docs can cross plugin boundary if done outside
  Knitten-managed workflow.

Proof:

- Payload skill validator.
- Payload boundary validator.

### Review Plan

- Contract: confirm missing `risk-tier` falls back to inference and external
  mutation is high-risk.
- Boundary: confirm Knitten owns policy; KAS only receives targeted
  Knitten-managed updates.
- Validation: doctor passes and no bulk skill tagging is required.
