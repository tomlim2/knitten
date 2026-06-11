---
name: kc-promote-reference
description: Manage temporary promoted reference gates.
---

# KC Promote Reference

Use for every `reference-promoted.md` create, read review,
update, delete, promotion, retirement, or move.

Knitten core owns this CRUD workflow. Payload plugins are skill storage only:
they may contain `reference-promoted.md` placed by Knitten core, but they do not
define independent creation, deletion, promotion, or retirement rules.

Use `reference-promoted.md` when an accepted, mechanically checkable lesson
should affect a skill now, but is not stable enough for `SKILL.md`,
`reference.md`, a helper script, a test, or a repository guideline.

This skill edits the target skill's Knitten-managed `reference-promoted.md`. It
does not move or store finding records. Finding records remain owned by the
Knitten core hub.

## Input

- Source context: report path, review note, failing validation, or user
  instruction.
- Target skill directory.
- Concrete recurrence risk.
- Proposed trigger, check, and action.

## Promotion Criteria

Promote only when all are true:

- The issue is repeatable or mechanically checkable.
- The target skill can prevent recurrence with a concrete trigger and check.
- The proposed rule is not already covered by `SKILL.md`, `reference.md`, a
  script, a test, or a repository guideline.
- The scope belongs to the target skill, not a broader system owner.
- The entry has a retirement target.

Do not promote:

- One-off confusion.
- Naming or style preference without a checkable rule.
- User-directed scope change.
- Historical notes that do not change skill execution.
- Items that should go directly into a stable owner.

## Entry Shape

Append or update one entry in:

```text
<target-skill>/reference-promoted.md
```

Use this shape:

```text
## <short concrete title>

Status: temporary | retire-to-reference | retire-to-skill | retire-to-script | retire-to-test | retire-to-guideline
Trigger: <concrete diff, task, command, or workflow condition>
Check: <exact inspection or command to run>
Action: <what the skill must do when triggered>
Retirement target: <stable owner or deletion condition>
Source: <short pointer; do not paste long report bodies>
```

If the file does not exist, create it with a short header:

```text
# <Skill Name> Promoted References

Temporary supplemental gates live here before they are stable enough for
SKILL.md, reference.md, a helper script, a test, or a repository guideline.
```

## Workflow

1. Read the target `SKILL.md`, existing `reference.md` if present, and existing
   `reference-promoted.md` if present.
2. Confirm the criteria above.
3. For create/update: prefer stable owners first. If a stable owner is clearly
   better, edit that owner instead of `reference-promoted.md`.
4. For delete/retire: remove entries that are duplicated, obsolete, or already
   absorbed into a stable owner.
5. If a temporary gate is still justified, add or keep the smallest concrete
   entry in `reference-promoted.md`.
6. Update the target `SKILL.md` only if it does not already say to read
   `reference-promoted.md` when present.
7. Validate links and syntax with the target plugin's available doctor or skill
   validator.

## Output

- Target skill.
- CRUD action and entry title.
- Why the entry is temporary.
- Retirement target.
- Validation result.
