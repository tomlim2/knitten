# Skill Audit Checklist

## Purpose

Use this checklist to review one Knitten or domain skill without inventing
criteria during the review.

The checklist is blocker-oriented. Record P0/P1/P2 findings when a skill can
over-match, load avoidable context, miss required input, or mutate state without
visible safety checks. Keep wording nits as P3.

## Inputs

- The target `SKILL.md`.
- Any directly referenced `references/**`, `flow.md`, scripts, or assets needed
  to understand the matched workflow.
- `docs/specs/skill-match-check-policy.md`.
- `docs/guidelines/skill-authoring.md`.

## Review Steps

1. Read the target `SKILL.md`.
2. Read only references named by the target file and only when needed to verify
   post-match behavior.
3. Classify findings with the severity guide below.
4. Fix P0/P1/P2 blockers before recording the audit as complete.
5. Record residual P3/nits separately from blockers.

## Severity Guide

| Priority | Use for |
|----------|---------|
| P0 | Safety, data loss, credential, production, or destructive external-state risk. |
| P1 | A boundary or match defect likely to run the wrong skill or mutate the wrong target. |
| P2 | Missing validation, unclear required input, stale match level, or context-loading issue likely to recur. |
| P3 | Wording, local cleanup, or optional clarity improvement. |

## Checklist

### 1. Discovery Surface

- `description` is one short sentence.
- `Use for:` names one clear request shape.
- The skill name and description do not rely on private project history.
- The first screen of `SKILL.md` is enough to decide whether the skill applies.

Flag as blocker when:

- a user could reasonably invoke the skill for unrelated work,
- the description promises broader behavior than the skill safely handles,
- the skill body is an obvious exposure outlier compared with the rest of the
  plugin.

### 2. Match Check

- `match-check` is `loose`, `normal`, or `strict`.
- The value matches `docs/specs/skill-match-check-policy.md`.
- Step 0 states the required target, input, and expected output.
- Step 0 stops when the target, scope, or required input is missing.
- The skill has non-trigger or stop wording when its name could over-match.

Flag as blocker when:

- local editing work is marked `loose`,
- external mutation can happen without `strict` handling,
- Step 0 lets the workflow proceed without the minimum required input.

### 3. Context Loading

- Long procedures, examples, schemas, and command recipes live in references.
- `SKILL.md` says not to read detailed references until Step 0 passes.
- Directly exposed skills do not depend on parent-plugin knowledge.
- Broad workflow maps are internal references or scripts, not repeated in every
  exposed skill.

Flag as blocker when:

- a non-matching request would still cause large references to be read,
- the skill repeats long flow details that could live behind a match,
- a leaf skill only makes sense after reading a parent domain index or selector.

### 4. Mutation Safety

- Local file edits require a known workspace and target surface.
- Commit, push, PR, merge, deploy, delete, external messages, credentials, and
  production changes require explicit user approval.
- The skill distinguishes local durable outputs from local scratch artifacts.
- The skill does not claim external actions are complete when only repo docs
  changed.

Flag as blocker when:

- external mutation could happen without an explicit approval gate,
- deletion or cleanup can run without target confirmation,
- generated outputs can land in the wrong repo or plugin root.

### 5. Implementation Discipline

- The skill prefers existing repo helpers, standard library, native platform
  features, and installed dependencies before adding new code or dependencies.
- New abstractions are required by the accepted contract, not by habit.
- The skill's validation advice matches the actual changed surface.

Flag as blocker when:

- the skill encourages unnecessary dependencies or duplicate helpers,
- validation is absent for a mutation-capable workflow,
- the workflow asks for broad refactors when a scoped fix is enough.

## Finding Template

```markdown
| Priority | Location | Finding | Required fix |
|----------|----------|---------|--------------|
| P2 | `skills/example/SKILL.md` | Step 0 does not require a target workspace before editing. | Add target workspace confirmation before mutation. |
```

## Completion Rule

An audit is complete when:

- no P0/P1/P2 blockers remain,
- any intentional exception is recorded with evidence,
- the nearest validation command passes,
- the audit result is linked from the relevant milestone or task note.
