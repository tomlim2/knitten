# Skill Activation Check Policy

## Status

Draft.

## Goal

Define how Knitten skills decide whether they should activate for the current
request. The policy should add activation checks when a skill is created,
updated, reviewed, or given new mutation capability without forcing a full
metadata rewrite across all existing skills.

## Problem

Knitten and payload plugins contain skills that need different activation
checks:
read-only review skills, local document editors, GitHub/Linear mutators, Slack
senders, deploy workflows, cleanup tools, and routers that can call strict leaf
skills.

Today there is no uniform rule for when a skill must stop and validate:

- whether the current request actually matches the skill,
- whether required inputs are present,
- whether the action mutates local or external state,
- whether user approval is required,
- whether the skill should use a loose, normal, or strict activation check.

Adding strict preflight to every skill at once would be too expensive and noisy.
The policy needs a gradual path.

## Boundary

In scope:

- Define optional `activation-check` metadata.
- Define default inference when metadata is absent.
- Define Step 0 behavior by activation check.
- Define when skill creation/update/review workflows must ask or infer
  `activation-check`.
- Define how routers inherit activation checks from delegated skills.
- Define validation and acceptance criteria for the first implementation pass.

Out of scope:

- Bulk-tagging every existing skill.
- Rewriting every skill body in one pass.
- Changing Codex platform-level tool permissions.
- Replacing existing repo-specific approval gates.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| Skill frontmatter | Yes | Existing metadata such as `allowed-tools`, `task-types`, `description`, and future `activation-check`. |
| Skill body | Yes | Workflow steps and mutation behavior used for inference. |
| User request | Yes | Determines whether a skill should run and whether ambiguity requires a question. |
| Boundary policy | Yes | Core/payload ownership rules from `docs/guidelines/plugin-boundary.md`. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Activation policy document | durable | Canonical rule for Step 0 and activation-check inference. |
| Skill authoring guidance update | durable | Skill creation/update workflows ask or infer activation at the right time. |
| Optional validator checks | durable | Mechanical checks for strict skills and obvious missing Step 0 patterns. |
| Targeted skill updates | durable | Strict example skills gain explicit `activation-check` and Step 0 text. |

## Contract

- A skill may declare `activation-check: loose | normal | strict`.
- Missing `activation-check` is not permission to skip activation checks.
- If `activation-check` is absent, the caller infers activation from the requested action,
  skill metadata, allowed tools, and workflow body.
- Any external mutation is treated as strict.
- Ambiguous inferred activation defaults to normal, unless external mutation is
  possible.
- Every skill conceptually has Step 0: Activation Check.
- Step 0 strictness depends on activation check.
- Skill creation workflows must ask or propose activation check.
- Skill update workflows must re-check activation when behavior, tools, or mutation
  surface changes.
- Review/promoted-reference workflows must flag missing or stale activation check when
  a skill can affect external state.
- Routers inherit the highest activation check of the delegated action they are about
  to invoke.

## Activation Checks

| Value | Typical actions | Step 0 behavior |
|------|-----------------|-----------------|
| `loose` | read-only review, summarize, analyze, draft, brainstorm | Self-check request fit and inputs. Continue with stated assumptions when ambiguity is low. |
| `normal` | local file edit, local script run, spec/doc generation, local artifact creation | Validate target path, required input, workspace, and reversibility. Ask when target/scope is unclear. |
| `strict` | push, merge, deploy, delete, Slack send, PR reply, GitHub/Linear mutation, credential/config change, production/cluster change | Stop unless target, account, permission, dirty state, and explicit approval rules are satisfied. Ask user when any decision can affect external state. |

## Inference Rules

Classify as `strict` when any of these are true:

- Sends Slack or other team notification.
- Pushes, merges, tags, creates releases, or mutates PR/review state.
- Changes Linear/GitHub issue state.
- Deploys, rolls back, updates manifests, or touches production/cluster state.
- Deletes files, branches, worktrees, artifacts, or remote resources.
- Changes credentials, tokens, local config, or tool registration.
- Calls external APIs with POST, PATCH, PUT, DELETE, or equivalent mutation.

Classify as `normal` when any of these are true and no strict trigger exists:

- Writes local files.
- Runs local scripts or validators that may create local artifacts.
- Generates specs, plans, documents, images, or reports.
- Modifies skill docs, templates, standards, or references.

Classify as `loose` when all actions are read-only or draft-only:

- Inspect, review, summarize, brainstorm, compare, or explain.
- No file write.
- No external state mutation.

If still unclear, use `normal`.

## Step 0 Shape

Each explicit Step 0 should use the smallest useful form for its activation check.

Loose shape:

```text
### Step 0: Activation Check

Confirm the request matches this skill and required input is present. If an
assumption is needed, state it in the output.
```

Normal shape:

```text
### Step 0: Activation Check

Confirm target workspace, target files, required input, and expected output.
If target or scope is unclear, ask before editing.
```

Strict shape:

```text
### Step 0: Activation Check

Confirm target, account, authority, current branch/state, mutation surface, and
required user approval. If any item is unclear, stop and ask before mutation.
```

## Ask / Infer Triggers

Ask or infer `activation-check` when:

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
This skill can <mutation>. Should its activation-check be strict?
```

When the answer is obvious from policy, infer and state the reason instead of
asking.

## Router Rule

Routers and orchestrators do not get to stay loose just because they delegate
work.

Contract:

- Before calling a leaf skill, infer the delegated action's activation check.
- Apply the highest relevant activation check for that invocation.
- If the router can route to strict leaves, its Step 0 must identify when
  strict confirmation is required.

## Validation

- `node scripts/doctor.mjs`
- For payload changes, run the payload plugin's doctor or skill validator.
- `rg -n "activation-check|Step 0: Activation Check" skills docs`
- Manual review of strict skills touched in the implementation pass.

## Acceptance Criteria

- Policy exists in a durable Knitten document.
- Skill creation guidance asks or proposes `activation-check`.
- Skill update/review guidance says to add or adjust `activation-check` when behavior
  needs stricter activation.
- The policy does not require immediate tagging of every existing skill.
- Missing `activation-check` explicitly falls back to inference.
- Any external mutation is explicitly strict.
- Router inheritance is documented.
- At least one strict example skill can be reviewed against the policy.

## Open Questions

- Should `activation-check` live only in frontmatter, or may it also be documented in a
  reference file during migration?
- Should the validator warn on strict keywords without `activation-check`, or only
  after the first targeted implementation pass?

## Design Plan

### Inputs

- This spec.
- `docs/guidelines/plugin-boundary.md`.
- Existing Knitten skill creation/update/review skills.
- Strict examples from KAS: deploy, Slack send, PR response, Linear/GitHub
  mutation, cleanup/delete.

### Outputs

- Policy doc or guideline update.
- Skill creator/update/review instruction updates.
- Optional validator warning plan.
- Targeted strict skill examples, if implementation includes examples.

### Implementation Sequence

#### 1. Add Canonical Activation Policy

Files:

- `docs/guidelines/skill-activation-check.md`
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

- `skills/kc-draft-spec/SKILL.md`
- `skills/ah-audit-skill/SKILL.md`
- `skills/ah-review-work/SKILL.md`

Changes:

- Add activation-check ask/infer triggers.
- Require Step 0 review when creating or updating skills.
- Make promoted-reference CRUD consider whether the target skill needs a
  stricter Step 0.

Risk:

- These AH skills should not become too verbose for simple loose work.

Proof:

- Manual read of each changed skill.
- `node scripts/doctor.mjs`

#### 3. Add Optional Mechanical Warnings

Files:

- `scripts/doctor.mjs` or a new validator script.

Changes:

- Consider warn-only checks for obvious strict words or tools without
  `activation-check`.
- Keep warnings targeted; do not fail the full repo at first.

Risk:

- Keyword checks can create false positives.

Proof:

- Run validator in warn-only mode.
- Inspect sample output.

#### 4. Target Strict Examples

Files:

- Selected payload skill files, if scoped into implementation.

Changes:

- Add explicit `activation-check: strict` and a Step 0 activation check to a
  small number of strict skills.
- Do not bulk-edit all skills.

Risk:

- Touching payload skill docs can cross plugin boundary if done outside
  Knitten-managed workflow.

Proof:

- Payload skill validator.
- Payload boundary validator.

### Review Plan

- Contract: confirm missing `activation-check` falls back to inference and external
  mutation is strict.
- Boundary: confirm Knitten owns policy; KAS only receives targeted
  Knitten-managed updates.
- Validation: doctor passes and no bulk skill tagging is required.
