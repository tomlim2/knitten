# Skill Match Check

Status: accepted.

Use this guideline as the canonical policy for choosing a skill's `match-check`
and writing its Step 0 gate.

## Levels

| Value | Use for | Step 0 requirement |
|-------|---------|--------------------|
| `loose` | Read-only review, explanation, summary, or brainstorming. | Confirm request fit and required input. |
| `normal` | Local edits, scripts, generated artifacts, or local records. | Confirm workspace, target, input, output, and reversibility. |
| `strict` | Commit, push, merge, deploy, delete, external messages, issue/PR mutation, credentials, config, or production changes. | Confirm target, account, authority, current state, mutation surface, and explicit approval; reuse an exact current-turn approval while its scope is unchanged. |

If the behavior is ambiguous, use `normal`. If any delegated or optional path
can mutate external state, apply `strict` before that path runs.

## Step 0 Contract

- State the request shape the skill accepts.
- Require the smallest inputs needed to continue safely.
- Stop when target, scope, authority, or required approval is missing.
- Treat an exact current-turn instruction or documented caller approval as the
  approval check passing after the verified command still matches it. Report
  the verified bundle as progress; do not ask again for the same action.
- Ask only for a newly discovered decision: changed target or state, expanded
  mutation surface, destructive target list, or user-visible payload that was
  neither explicit nor previously approved.
- Keep mutation and approval checks in the active `SKILL.md`.
- Do not load detailed references, create files, or mutate state before Step 0
  passes.

Missing frontmatter is not permission to skip a match check. Existing skills
without `match-check` must infer the highest applicable level, while new and
updated skills declare it explicitly.

## Delegation

Entry skills and orchestrators inherit the highest level of the action they are
about to delegate. A loose or normal entry point must still perform a strict
gate before invoking a strict flow. Pass the approved action, target, and
mutation surface to the child. The child re-verifies them but must not request
the same approval again.

## Validation

- Run the owning plugin's doctor or skill validator.
- Confirm `match-check` and `Step 0: Match Check` are present.
- Manually review any changed strict skill for explicit approval and target
  checks.
- Reject strict skills that prompt again after an exact current-turn or caller
  approval while the verified mutation scope remains unchanged.
