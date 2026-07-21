# Skill Match Check Policy

## Status

Implemented/historical. The canonical active policy is
`docs/guidelines/skill-match-check.md`.

## Goal

Define how Knitten skills decide whether they should activate for the current
request. The policy should add match checks when a skill is created,
updated, reviewed, or given new mutation capability without forcing a full
metadata rewrite across all existing skills.

## Problem

Knitten and domain plugins contain skills that need different match checks:
read-only review skills, local document editors, GitHub/Linear mutators, Slack
senders, deploy workflows, cleanup tools, and entry skills that can delegate to
strict internal flows.

Today there is no uniform rule for when a skill must stop and validate:

- whether the current request actually matches the skill,
- whether required inputs are present,
- whether the action mutates local or external state,
- whether user approval is required,
- whether the skill should use a loose, normal, or strict match check.

Adding strict preflight to every skill at once would be too expensive and noisy.
The policy needs a gradual path.

## Boundary

In scope:

- Define optional `match-check` metadata.
- Define default inference when metadata is absent.
- Define Step 0 behavior by match check.
- Define when skill creation/update/review workflows must ask or infer
  `match-check`.
- Define how delegating entry skills inherit match checks from delegated skills
  or internal flows.
- Define validation and acceptance criteria for the first implementation pass.

Out of scope:

- Bulk-tagging every existing skill.
- Rewriting every skill body in one pass.
- Changing Codex platform-level tool permissions.
- Replacing existing repo-specific approval checks.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| Skill frontmatter | Yes | Existing metadata such as `allowed-tools`, `task-types`, `description`, and future `match-check`. |
| Skill body | Yes | Workflow steps and mutation behavior used for inference. |
| User request | Yes | Determines whether a skill should run and whether ambiguity requires a question. |
| Boundary policy | Yes | Core/domain-plugin ownership rules from `docs/guidelines/plugin-boundary.md`. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Match policy document | durable | Canonical rule for Step 0 and match-check inference. |
| Skill authoring guidance update | durable | Skill creation/update workflows ask or infer match at the right time. |
| Optional validator checks | durable | Mechanical checks for strict skills and obvious missing Step 0 patterns. |
| Targeted skill updates | durable | Strict example skills gain explicit `match-check` and Step 0 text. |

## Contract

- A skill may declare `match-check: loose | normal | strict`.
- Missing `match-check` is not permission to skip match checks.
- If `match-check` is absent, the caller infers match from the requested action,
  skill metadata, allowed tools, and workflow body.
- Any external mutation is treated as strict.
- Ambiguous inferred match defaults to normal, unless external mutation is
  possible.
- Every skill conceptually has Step 0: Match Check.
- Step 0 strictness depends on match check.
- Skill creation workflows must ask or propose match check.
- Skill update workflows must re-check match when behavior, tools, or mutation
  surface changes.
- Review/promoted-reference workflows must flag missing or stale match check when
  a skill can affect external state.
- Delegating entry skills inherit the highest match check of the delegated
  action they are about to invoke.

## Match Checks

| Value | Typical actions | Step 0 behavior |
|------|-----------------|-----------------|
| `loose` | read-only review, summarize, analyze, draft, brainstorm | Self-check request fit and inputs. Continue with stated assumptions when ambiguity is low. |
| `normal` | local file edit, local script run, spec/doc generation, local artifact creation | Validate target path, required input, workspace, and reversibility. Ask when target/scope is unclear. |
| `strict` | commit, push, merge, deploy, delete, Slack send, PR reply, GitHub/Linear mutation, credential/config change, production/cluster change | Stop unless target, account, permission, dirty state, and explicit approval rules are satisfied. Ask user when any decision can affect external state. |

An exact current-turn instruction or documented caller approval satisfies the
strict approval rule for that same verified action. Do not prompt again merely
to echo the resolved repository, branch, paths, diff, or generated commit
message. Ask when verification discovers a changed target or state, expanded
mutation surface, destructive target list, or newly composed external payload
that was not part of the approval.

## Inference Rules

Classify as `strict` when any of these are true:

- Commits prepared local changes.
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

Each explicit Step 0 should use the smallest useful form for its match check.

Loose shape:

```text
### Step 0: Match Check

Confirm the request matches this skill and required input is present. If an
assumption is needed, state it in the output.
```

Normal shape:

```text
### Step 0: Match Check

Confirm target workspace, target files, required input, and expected output.
If target or scope is unclear, ask before editing.
```

Strict shape:

```text
### Step 0: Match Check

Confirm target, account, authority, current branch/state, mutation surface, and
required user approval. Reuse an exact current-turn or documented caller
approval while the verified scope is unchanged. If any item is unclear or the
mutation expands, stop and ask before mutation.
```

## Ask / Infer Triggers

Ask or infer `match-check` when:

- creating a skill,
- updating a skill with new behavior,
- adding mutation-capable tools or external APIs,
- changing `allowed-tools` or connector capabilities,
- reviewing a skill that can affect external state,
- promoting a mechanical issue into a skill-local check,
- turning a skill into an entry skill or orchestrator,
- changing deploy, Slack, PR response, issue state, cleanup, credential, config,
  or production behavior.

The question should be short:

```text
This skill can <mutation>. Should its match-check be strict?
```

When the answer is obvious from policy, infer and state the reason instead of
asking.

## Delegation Rule

Entry skills and orchestrators do not get to stay loose just because they
delegate work.

Contract:

- Before calling a leaf skill or internal flow, infer the delegated action's
  match check.
- Apply the highest relevant match check for that invocation.
- If the entry skill can delegate to strict work, its Step 0 must identify when
  strict confirmation is required.

## Validation

- `node scripts/doctor.mjs`
- For domain plugin changes, run the domain plugin's doctor or skill validator.
- `rg -n "match-check|Step 0: Match Check" skills docs`
- Manual review of strict skills touched in the implementation pass.

## Acceptance Criteria

- Policy exists in a durable Knitten document.
- Skill creation guidance asks or proposes `match-check`.
- Skill update/review guidance says to add or adjust `match-check` when behavior
  needs stricter match.
- The policy does not require immediate tagging of every existing skill.
- Missing `match-check` explicitly falls back to inference.
- Any external mutation is explicitly strict.
- Delegation inheritance is documented.
- At least one strict example skill can be reviewed against the policy.

## Open Questions

- None. New and updated skills declare `match-check` in frontmatter; mechanical
  checks remain warning-first unless a separate accepted change promotes them.

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

#### 1. Add Canonical Match Policy

Files:

- `docs/guidelines/skill-match-check.md`
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

- `skills/draft-spec/SKILL.md`
- `skills/ah-audit-skill/SKILL.md`
- `skills/ah-review-work/SKILL.md`

Changes:

- Add match-check ask/infer triggers.
- Require Step 0 review when creating or updating skills.
- Make promoted-reference CRUD consider whether the target skill needs a
  stricter Step 0.

Risk:

- These Knitten Core skills should not become too verbose for simple loose work.

Proof:

- Manual read of each changed skill.
- `node scripts/doctor.mjs`

#### 3. Add Optional Mechanical Warnings

Files:

- `scripts/doctor.mjs` or a new validator script.

Changes:

- Consider warn-only checks for obvious strict words or tools without
  `match-check`.
- Keep warnings targeted; do not fail the full repo at first.

Risk:

- Keyword checks can create false positives.

Proof:

- Run validator in warn-only mode.
- Inspect sample output.

#### 4. Target Strict Examples

Files:

- Selected domain skill files, if scoped into implementation.

Changes:

- Add explicit `match-check: strict` and a Step 0 match check to a
  small number of strict skills.
- Do not bulk-edit all skills.

Risk:

- Touching domain plugin skill docs can cross plugin boundary if done outside
  Knitten-managed workflow.

Proof:

- Domain skill validator.
- Domain plugin boundary validator.

### Review Plan

- Contract: confirm missing `match-check` falls back to inference and external
  mutation is strict.
- Boundary: confirm Knitten owns policy; KAS only receives targeted
  Knitten-managed updates.
- Validation: doctor passes and no bulk skill tagging is required.
