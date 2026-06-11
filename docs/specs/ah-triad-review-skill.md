# AH Triad Review Skill

## Status

Draft.

## Goal

Add a generic Knitten core skill, `kc-review`, that runs a reusable
three-role review pass for AH and payload workflows.

The skill should provide the common Triad pattern once:

```text
review packet -> role selection -> three read-only role reviews -> merged findings
```

Domain skills such as Shotloom PR review or before-PR review should prepare the
input packet and consume the findings. They should not each reimplement role
selection, shared packet rules, role prompts, or merge rules.

## Problem

Triad review logic is currently domain-local. Shotloom before-PR and requested
PR review workflows need the same review pattern:

- choose three role agents from the changed surface and primary consumer,
- give every role the same base review documents,
- add a role-specific lens,
- collect grounded findings,
- merge duplicate findings and preserve disagreement.

Keeping that logic inside each payload skill creates drift. It also makes the
core AH review flow less reusable for specs, implementation diffs, imported
skills, and PR reviews.

## Boundary

In scope:

- Create a Knitten core skill `skills/kc-review/SKILL.md`.
- Create `skills/kc-review/references/triad.md`.
- Define the generic Triad input packet.
- Define dynamic role selection.
- Define mandatory base review packet for every role.
- Define role subagent prompt and report template.
- Define finding merge rules.
- Define the skill as read-only: no edits, no commits, no PR comments, no
  GitHub/Linear mutation.
- Document how caller skills should use the output.

Out of scope:

- Rewriting Shotloom skills or AH umbrella skills to call `kc-review` in
  this implementation pass.
- Posting GitHub reviews or comments.
- Creating PR payloads.
- Running validation commands for the reviewed target.
- Replacing repo-specific review standards.
- Adding a platform-level subagent API.

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| Review target | Yes | Already materialized diff/content, or a readable path to a prepared artifact. This skill does not run `git diff` or discover target content. |
| Review brief | Yes | Concise navigation summary prepared by the caller. |
| Base review documents | Yes | Repo guidelines, skill standards, spec contract, acceptance criteria, or other mandatory review sources. Caller must pass readable paths, content excerpts, or both. |
| Finding schema | No | Output shape expected by the caller. If absent, use the default AH finding schema in this spec. |
| Changed surface inventory | Yes | Touched files, surfaces, consumers, and known risk boundaries. |
| Role constraints | No | Optional required or forbidden role lenses from the caller. |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| Triad role selection | none | The three selected roles and one-line reason for each. |
| Role reports | none | Findings and notes from each role. |
| Merged findings | none | Deduplicated findings in the caller's requested schema. |
| Residual risk notes | none | Disagreements, skipped surfaces, or missing context. |

The default output is printed for the caller to capture. The skill does not
write durable artifacts unless a future caller-specific wrapper does so.

## Activation Check

`activation-check: loose`

Rationale:

- The skill is read-only.
- It may spawn read-only review subagents.
- It does not edit files, post comments, push, merge, deploy, delete, or mutate
  GitHub/Linear.
- It reports assumptions when the review packet is incomplete.

The skill still needs an explicit `Step 0: Activation Check`:

```text
Confirm the request is a read-only Triad review, the review packet is present,
and no caller expects this skill to mutate files or external state. If the
target or base documents are missing, stop and ask the caller to provide them.
If the caller needs a custom finding schema, it must be included; otherwise use
the default AH finding schema.
```

## Contract

- `kc-review` is a review engine, not a workflow owner.
- The caller owns target discovery, repo checkout, diff generation, guideline
  loading, output persistence, fixes, commits, PR payloads, and external
  mutation.
- The review target must already be materialized as inline content or a readable
  path. `kc-review` does not run `git diff`, fetch PRs, inspect branches,
  or discover repositories.
- The caller must make every required review document available as either:
  - a readable local path that this skill may inspect with `Read`, or
  - inline content/excerpts in the review packet.
- If a required document is named but neither readable nor included, the skill
  stops and asks the caller to repair the packet.
- The skill selects exactly three roles for each invocation.
- Role names may be created from the actual review surface; they are not limited
  to a fixed menu.
- Role selection must account for:
  - dominant changed surface,
  - highest-risk boundary,
  - primary consumer of the changed behavior.
- Every role receives the same base review packet before its role-specific
  lens.
- The Review Brief is a navigation index, not finding evidence.
- Findings must be grounded in the target, diff, spec, or provided review
  documents.
- The skill suppresses weak, speculative, or unanchored findings.
- P0/P1/P2/P3 meaning comes from the caller-provided schema when present.
- If roles disagree, the merged output preserves the disagreement as
  `needs-design-judgment` or the closest equivalent field in the caller schema.
- The skill must not call tools that mutate files or external state.
- Role subagents are read-only reviewers. They must not edit files, run
  mutation commands, post comments, push, merge, deploy, call GitHub/Linear
  mutation APIs, or change local/external state.

## Proposed Skill Shape

```text
skills/kc-review/
  SKILL.md
  references/triad.md
```

### `SKILL.md`

Responsibilities:

- Step 0 activation check.
- Require or derive the review packet.
- Read `references/triad.md`.
- Select three roles.
- Spawn three read-only review agents when `Agent` is available.
- Fall back to sequential role review in the primary context when `Agent` is not
  available.
- Merge role reports.
- Print merged findings and residual risk notes.

Allowed tools:

```yaml
allowed-tools: Read, Agent
```

This skill may inspect caller-provided readable paths with `Read`. It must not
discover repositories, run shell commands to collect context, or broaden the
packet on its own. If the packet is missing a required source, stop and ask the
caller to provide the path or content.

### `references/triad.md`

Contents:

- Role selection rule.
- Base review packet rule.
- Role prompt template.
- Role report template.
- Merge rules.
- Priority/blocker mapping guidance.
- Weak-finding suppression rule.
- Caller responsibility rule.

## Review Packet

The caller should provide a compact packet with:

```markdown
## Review target
<what is being reviewed>

## Review brief
<purpose, changed behavior, touched surfaces, non-goals>

## Changed surfaces
- <path or artifact> - <surface> - <primary consumer> - <risk>

## Base review documents
- <name/path or inline label> - <why mandatory> - <path readable? yes/no>

## Finding schema
<optional caller schema; omitted means default AH finding schema>

## Known constraints
- <approval, scope, product, migration, or testing constraint>
```

The packet should be concise but source-cited. If the packet is too vague to
choose roles or ground findings, `kc-review` stops and asks the caller to
repair the packet.

## Default AH Finding Schema

Use this schema when the caller does not provide one:

```json
{
  "findings": [
    {
      "priority": "P0|P1|P2|P3",
      "blocker": true,
      "title": "<short finding title>",
      "location": {
        "path": "<path or artifact id>",
        "line": 1
      },
      "evidence": "<target/diff/spec/document evidence>",
      "rule": "<source rule, checklist item, or contract>",
      "recommendation": "<minimal corrective action>",
      "roles": ["<role that reported or confirmed it>"]
    }
  ],
  "needsDesignJudgment": [
    {
      "topic": "<disagreement or ambiguous judgment>",
      "roles": ["<role>", "<role>"],
      "summary": "<why this needs caller judgment>"
    }
  ],
  "residualRisk": ["<risk or skipped surface>"]
}
```

Default priority mapping:

- `P0`: correctness, safety, data loss, security, or release-blocking breakage.
- `P1`: architecture, API/contract, migration, or boundary issue likely to
  break real consumers.
- `P2`: missing test, missing validation, documentation mismatch, weak error
  handling, or maintainability issue with realistic recurrence.
- `P3`: nit, wording, local cleanup, or optional improvement.

`P0`, `P1`, and `P2` default to `blocker=true`. `P3` defaults to
`blocker=false`.

## Role Selection

Select exactly three roles.

Rules:

- Name roles from the reviewed change, not from a fixed list.
- Prefer concrete consumer roles over generic roles.
- Include one role for the highest-risk technical boundary.
- Include one role for the primary consumer.
- Include one role for verification, maintainability, migration, security, or
  docs depending on the changed surface.
- Use a generic balanced set only when no specialized consumer dominates.

Example fallback roles:

- Runtime/Contract Engineer.
- QA/Test Automation Engineer.
- Maintainer/Product Engineer.

Example specialized role names:

- Editor Selection UX Engineer.
- Stage Schema Compatibility Engineer.
- Asset Resolver Pipeline Engineer.
- Docs/Spec Consumer Engineer.
- CI/Ops Reviewer.
- Security/Permissions Reviewer.

## Base Review Packet Rule

Every role receives:

- Review target.
- Review brief.
- Changed surface inventory.
- Every base review document supplied by the caller.
- Finding schema.
- Known constraints and non-goals.
- Role name, role scope, primary consumer, and explicit out-of-scope boundary.

Only after that shared packet is loaded does the role apply its lens.

## Role Prompt Contract

Each role prompt must include:

```text
You are a read-only review subagent.
Do not edit files.
Do not run mutation commands.
Do not post comments, push, merge, deploy, or mutate GitHub/Linear.
Use only the supplied review packet, readable paths explicitly provided by the
caller, and the role lens.
Report grounded findings only.
```

## Role Report Template

Each role reports:

```markdown
## AH Triad role review - <role>

### Applicability
- Primary consumer: <consumer>
- Role scope: <scope>
- Files/artifacts checked: <paths or ids>
- Context checked: <review docs, specs, contracts, schemas, or none>

### Findings
- <priority> <path-or-artifact>:<line-or-section> - <defect> - <source rule/check>
- OR none

### Notes
- <false-positive rationale, skipped surface, residual risk, or design judgment>
```

## Merge Rules

- Merge duplicate findings by behavior and evidence location.
- Preserve distinct root causes even when they affect the same file.
- Keep the highest priority across duplicate findings.
- Preserve role disagreement as a design-judgment item.
- Drop findings that cannot cite the target, diff, spec, or supplied review
  document.
- Keep P3/nit findings separate from blocker findings when the caller schema
  supports it.

## Validation

- `node scripts/doctor.mjs`
- If `node scripts/doctor.mjs` fails only because the materialized local plugin
  copy is missing or stale, run `node scripts/materialize-local-plugin.mjs` and
  re-run doctor before treating the implementation as failed.
- `rg -n "kc-review|triad.md|activation-check" skills docs`
- Manual review that `kc-review` contains no mutation steps.
- Manual review that `triad.md` separates caller responsibilities from Triad
  responsibilities.
- Manual review that role prompts forbid subagent mutation.
- Optional smoke test: run the skill conceptually against a small review packet
  and confirm it emits role selection plus merged findings without mutation.

## Acceptance Criteria

- `skills/kc-review/SKILL.md` exists in Knitten core.
- `skills/kc-review/references/triad.md` exists.
- The skill has `activation-check: loose`.
- The skill has `Step 0: Activation Check`.
- The skill states it is read-only and does not mutate files or external state.
- The reference requires dynamic role selection.
- The reference requires the same base review packet for every role.
- The reference defines role report and merge rules.
- The reference defines the default AH finding schema or points to the schema in
  `SKILL.md`.
- The reference explicitly forbids role subagents from mutating files or
  external state.
- The input contract is clear about readable paths versus inline content.
- The output can be consumed by Shotloom before-PR and requested-PR review
  workflows without embedding Shotloom-specific repo assumptions in Knitten
  core.
- Existing Knitten doctor validation passes after implementation and
  materialization when needed.

## Open Questions

- Should `ah-review-work` mention `kc-review` as the optional multi-lens
  review engine after the first implementation pass?
- Should `ah-review-pr` support an explicit `--triad` style handoff later, or
  should PR-specific skills call `kc-review` directly?
- Should role reports be printed only, or should the skill optionally accept a
  caller-provided local output path in a later version?

## Design Plan

### Inputs

- This spec.
- Existing `skills/ah-review-work/SKILL.md`.
- Existing `skills/ah-review-implementation/SKILL.md`.
- Existing `skills/ah-review-pr/SKILL.md`.
- `docs/specs/skill-activation-check-policy.md`.
- Payload examples such as Shotloom Triad review docs.

### Outputs

- New `skills/kc-review/SKILL.md`.
- New `skills/kc-review/references/triad.md`.
- Optional targeted references in AH review umbrella docs if needed.
- Validation evidence.

### Implementation Sequence

#### 1. Add The Skill Skeleton

Files:

- `skills/kc-review/SKILL.md`

Changes:

- Add frontmatter with `activation-check: loose`.
- Define purpose, input packet, output, Step 0, and read-only workflow.
- State that caller workflows own mutation and persistence.
- Define default AH finding schema fallback.
- Clarify that caller-provided review documents may be passed as readable paths
  or inline content.

Risk:

- The skill may be mistaken for a PR reviewer that posts comments.

Proof:

- Manual read confirms no mutation step exists.
- Manual read confirms mutation-related words such as `push`, `merge`, `post`,
  `comment`, `gh api`, and `Linear` appear only in prohibition or
  caller-responsibility text.
- Manual read confirms subagent prompts forbid mutation.

#### 2. Add The Triad Reference

Files:

- `skills/kc-review/references/triad.md`

Changes:

- Add role selection rule.
- Add base review packet rule.
- Add role prompt and role report template.
- Add merge rules and weak-finding suppression.
- Add read-only subagent contract.

Risk:

- The reference becomes too domain-specific.

Proof:

- Manual read confirms examples are generic and no Shotloom repo path is
  required.

#### 3. Validate

Files:

- `scripts/doctor.mjs`
- New skill files.

Changes:

- Run existing doctor validation.
- Materialize the local plugin copy first if doctor reports only copied-plugin
  drift.
- Inspect frontmatter and links.

Risk:

- Missing link or frontmatter issue.

Proof:

- `node scripts/doctor.mjs`
- `git diff --check`

### Review Plan

- Contract: verify the skill is a read-only review engine and not a workflow
  mutator.
- Boundary: verify no Shotloom-specific assumptions enter Knitten core.
- Validation: verify doctor passes and the reference can support Shotloom and
  generic AH callers.
- Scope: verify `ah-review-work`, Shotloom before-PR, and requested-PR skills
  are not modified in this first implementation pass.
