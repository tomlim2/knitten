# AH Development Flow Umbrellas

## Status

Draft.

## Goal

Define the default generic AH development workflow as five umbrella skills in
the `knitten` plugin.

The goal is not to port every legacy `ah-*` skill. The goal is to provide a
small, predictable workflow that covers normal development from task definition
to post-merge wrapup.

Generic AH development workflow skills may live in `knitten` as plugin
operation skills. They must not require domain payloads, private paths, external
credentials, or a legacy source checkout.

## Umbrella Skills

| Skill | Owns | Output |
|-------|------|--------|
| `ah-prepare-work` | Work definition before implementation. | Reviewed task/spec/design context. |
| `ah-implement-work` | Code or document implementation. | Changed files plus validation evidence. |
| `ah-review-work` | Spec or implementation review. | Findings classified by severity and next action. |
| `ah-manage-pr` | Pull request creation, review, response, and merge coordination. | PR state plus requested next action. |
| `ah-wrapup-work` | Post-merge/task closeout. | Cleanup summary, lessons, and next-task candidates. |

These umbrella skills may call smaller leaf skills. The first version should
include only leaf skills that already have stable development-flow value. It
should not recreate every legacy `ah-*` skill.

## Flow

```text
ah-prepare-work
  -> ah-implement-work
  -> ah-review-work
  -> ah-implement-work
  -> ah-manage-pr
  -> ah-wrapup-work
```

Review findings loop back to `ah-implement-work`. PR review comments also loop
back through `ah-implement-work` unless they are purely response-only items.

## 1. ah-prepare-work

Purpose: make the work implementable before editing source files.

Steps:

1. Create or confirm the task purpose.
2. Gather references.
3. Organize references.
4. Brainstorm viable approaches.
5. Draft the spec.
6. Add the design plan.
7. Review the spec.
8. Apply spec review fixes.

Inputs:

- user request
- existing issue, PR, branch, or document when present
- relevant repository files and docs

Outputs:

- task purpose
- reference summary
- brainstorm notes when useful
- reviewed spec
- design plan
- unresolved questions, if any

Stop conditions:

- task purpose is unclear
- required external context is missing
- spec review finds unresolved blockers that need user judgment

## 2. ah-implement-work

Purpose: implement an accepted spec or fix accepted review findings.

Use this both for first implementation and for review-finding fixes.

Inputs:

- reviewed spec and design plan, or
- review findings with accepted actions

Outputs:

- changed files
- validation commands and results
- remaining blockers or questions

Rules:

- Prefer the target repository's own conventions.
- Keep edits scoped to the accepted task.
- Do not turn nit cleanup into an open-ended polish loop.
- If findings are supplied, fix blockers first; handle cheap local nits only
  after blockers are gone.

## 3. ah-review-work

Purpose: review specs, design plans, implementation diffs, or imported skills.

Inputs:

- spec/design plan, implementation diff, skill file, or PR diff
- explicit review lens when provided

Outputs:

- findings first
- severity and rationale
- whether the work is ready, blocked, or needs another implementation pass

Review modes:

- spec review
- implementation review
- skill review
- optional multi-lens review for high-risk changes

Rules:

- Findings must cite the relevant file, line, contract, or behavior.
- Distinguish blockers from nits.
- If no issues are found, say so and name residual risk.

## 4. ah-manage-pr

Purpose: manage GitHub PR work after implementation is locally ready.

Subflows:

- create PR
- review PR
- respond to PR comments
- re-request review or wait for checks
- merge when explicitly requested and checks are acceptable

Inputs:

- current branch
- reviewed implementation state
- PR number or URL when responding/reviewing

Outputs:

- PR URL or PR state
- review/response summary
- merge result or blocker

Rules:

- Do not create or merge a PR without explicit user request.
- Preserve repository-specific PR conventions.
- Treat GitHub review comments by content, not by author type.
- Use `ah-implement-work` for code/doc fixes from PR feedback.

## 5. ah-wrapup-work

Purpose: close the loop after merge or task cancellation.

Inputs:

- merged PR, completed branch, or explicit stop/cancel request
- validation and review evidence

Outputs:

- final task summary
- cleaned local state, when safe and requested
- captured operational findings or lessons
- next-task candidates

Rules:

- Do not delete branches, worktrees, or local artifacts unless the user asks or
  the workflow has an explicit safe cleanup contract.
- Prefer concise reusable lessons over long historical logs.
- If a recurring workflow issue was found, report it as a future improvement
  candidate instead of silently burying it.

## Leaf Skill Policy

Start with five umbrella skills plus a small leaf set. Split more leaf skills
only when one of these is true:

- the step has a distinct input/output contract
- the step is reused by multiple umbrellas
- the step needs different tools or safety rules
- the umbrella becomes too long to use reliably

Initial leaf skills:

- `ah-gather-references`
- `ah-organize-references`
- `ah-brainstorm-approaches`
- `ah-draft-spec`
- `ah-add-design-plan`
- `ah-review-spec`
- `ah-implement-plan`
- `ah-apply-review-fixes`
- `ah-review-implementation`
- `ah-create-pr`
- `ah-review-pr`
- `ah-respond-pr`
- `ah-close-work`
- `ah-report-finding`
- `ah-manage-milestone`
- `ah-audit-skill`

These are leaf skills because they map to repeated development steps with clear
inputs and outputs. They should stay small and should avoid owning the whole
workflow.

Deferred leaf candidates:

- `ah-create-task`
- `ah-route-review`
- `ah-route-implementation`

Do not create deferred leaf skills until repeated use proves the split is
needed.

Support leaf skills are part of the initial set, but they should remain
optional in the normal path:

- `ah-report-finding` records recurring workflow or system issues discovered
  during implementation, review, PR response, or wrapup.
- `ah-manage-milestone` tracks grouped work when the user asks for milestone
  state, priority, or next-task ordering.
- `ah-audit-skill` reviews a skill's purpose, trigger, input/output contract,
  references, and implementation fit.

## Leaf Skill Contracts

| Skill | Input | Output | Primary callers |
|-------|-------|--------|---------|
| `ah-gather-references` | user request, repo context, issue/PR/doc links | reference list with relevance notes | `ah-prepare-work`, `ah-review-work` |
| `ah-organize-references` | raw references | grouped reference summary and open questions | `ah-prepare-work` |
| `ah-brainstorm-approaches` | task purpose and reference summary | options, tradeoffs, chosen direction | `ah-prepare-work` |
| `ah-draft-spec` | task purpose, references, chosen direction | draft spec with explicit input/output and acceptance criteria | `ah-prepare-work` |
| `ah-add-design-plan` | reviewed or draft spec | implementation plan, touched surfaces, validation plan | `ah-prepare-work` |
| `ah-review-spec` | spec and design plan | blocker/nit findings plus readiness state | `ah-prepare-work`, `ah-review-work` |
| `ah-implement-plan` | reviewed spec and design plan | changed files plus validation evidence | `ah-implement-work` |
| `ah-apply-review-fixes` | accepted findings and target artifact | updated artifact plus fix summary | `ah-prepare-work`, `ah-implement-work` |
| `ah-review-implementation` | implementation diff and expected contract | findings plus ready/blocked state | `ah-review-work` |
| `ah-create-pr` | reviewed branch and PR context | PR URL and PR summary | `ah-manage-pr` |
| `ah-review-pr` | PR URL/number | review findings or approval summary | `ah-manage-pr`, `ah-review-work` |
| `ah-respond-pr` | PR review comments and accepted actions | posted replies or response plan | `ah-manage-pr` |
| `ah-close-work` | merged PR or cancelled task state | wrapup summary and cleanup candidates | `ah-wrapup-work` |
| `ah-report-finding` | recurring issue, failed assumption, or workflow gap | structured finding record and suggested next action | primary: `ah-review-work`, `ah-manage-pr`, `ah-wrapup-work` |
| `ah-manage-milestone` | milestone name/state or task list | updated milestone status and next-task ordering | primary: `ah-prepare-work`, `ah-wrapup-work` |
| `ah-audit-skill` | skill path or skill name | skill review findings and fix recommendations | primary: `ah-review-work` |

## Umbrella-To-Leaf Map

| Umbrella | Calls |
|----------|-------|
| `ah-prepare-work` | `ah-gather-references`, `ah-organize-references`, `ah-brainstorm-approaches`, `ah-draft-spec`, `ah-add-design-plan`, `ah-review-spec`, `ah-apply-review-fixes` |
| `ah-implement-work` | `ah-implement-plan` for first implementation, `ah-apply-review-fixes` when fixing review findings |
| `ah-review-work` | `ah-gather-references` when extra context is needed, `ah-review-spec`, `ah-review-implementation`, `ah-review-pr` |
| `ah-manage-pr` | `ah-create-pr`, `ah-review-pr`, `ah-respond-pr` |
| `ah-wrapup-work` | `ah-close-work` |

Support leaves may be called from any umbrella when their input contract is
met. Their table entries list primary callers, not exclusive callers. They
should not become mandatory phases.

## Dependency Policy

When adapting a legacy `ah-*` skill or Shotloom workflow idea, classify each
dependency as one of:

- remove dependency
- inline dependency
- copy dependency with reason
- defer skill

This keeps the new `knitten` plugin small and avoids re-importing the legacy
repository by accident.

## Validation Policy

Validation should prove shape, syntax, and installability. It should not ban
specific words.

Allowed validation:

- plugin manifest shape
- required file presence
- skill frontmatter validity
- script syntax
- local materialization
- doctor status

Semantic review decides whether a domain reference is acceptable in a given
skill.

## Acceptance Criteria

- The five umbrella skill names are documented.
- Each umbrella has purpose, inputs, outputs, and rules.
- The initial leaf skill names are documented.
- Each initial leaf has input, output, and primary caller information.
- The spec does not require importing all legacy `ah-*` skills.
- The spec keeps word-ban validation out of scope.
- The next implementation round can add the five umbrella skill skeletons and
  initial leaf skill skeletons to `knitten`.
