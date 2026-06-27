# Skill Authoring Guideline

## Goal

Keep Knitten and adapter skills cheap to discover, clear to activate, and safe
to run. A skill's main `SKILL.md` should decide whether the skill applies
before it loads detailed workflow context.

## Main Rule

Write the active `SKILL.md` as an activation shell, not as the whole operating
manual.

The main file should contain only:

- frontmatter with a short `description`
- a one-line `Use for:` statement
- Step 0 activation check
- required safety or approval gates
- the pointer to the detailed reference to read after activation

Move long workflow details, examples, scripts, schemas, and checklists into
skill-local references such as `flow.md`, `reference.md`, or files under
`references/`.

## Recommended Shape

```markdown
---
name: example-skill
description: Do one specific thing.
activation-check: normal
---

# Example Skill

Use for: one specific request shape.

## Step 0: Activation Check

Confirm the request matches this skill, required inputs are present, and the
target workspace is correct.

If the request does not match, stop and name the clearer skill or adapter only
when obvious.

Do not read detailed references until this check passes.

## After Activation

Read `flow.md`, then execute the requested workflow.
```

## Description Rule

Keep `description` short because Codex sees skill names and descriptions during
discovery.

Prefer:

```text
Review Shotloom asset-library PRs.
```

Avoid:

```text
Review CINEV/shotloom-asset-library pull requests as a human reviewer with
producer, engineer, and domain-specific validation rules...
```

## Activation Rule

Use `docs/specs/skill-activation-check-policy.md` as the source of truth for
`activation-check`.

- `loose`: read-only review, summarize, explain, draft, brainstorm
- `normal`: local file edits, local scripts, generated artifacts
- `strict`: push, merge, deploy, delete, external messages, PR/GitHub/Linear
  mutation, credential/config changes, production changes

When in doubt, use `normal`. If external state can change, use `strict`.

## Adapter And Internal Flow Rule

Do not add broad pre-selection layers. Prefer direct skill activation plus
post-activation references. For a domain with many workflows, prefer one
adapter skill with internal flow files only when that is cheaper and clearer
than exposing many leaf skills. Existing pre-selection surfaces are legacy
surfaces to maintain only until their dependencies can be removed.
Legacy adapter indexes may know their exposed workflows through a mechanical
classification script. Exposed skills should not need parent-adapter knowledge.

An adapter skill's main job is to:

- run the shared domain activation gate
- choose the smallest internal flow or direct child workflow after activation
- keep long maps, checklists, and procedures in references
- apply the highest required activation check for any delegated action

A directly exposed skill's main job is to:

- decide whether the current request matches itself
- stop when it does not match
- load detailed references only after Step 0 passes

Do not put "prefer the adapter" boilerplate into exposed skills. If a workflow
should be hidden from broad discovery, make it an internal flow/reference under
the owning adapter instead of exposing it as a skill.

New work should first try direct skills, adapter plugins, or internal deferred
flows.

Do not maintain classification policy in Markdown tables. Markdown may point to
the classification script, but the script, fixtures, and validators own
classification behavior.

## Reference Rule

Use references for context that is useful only after the skill matches:

- long step-by-step workflows
- domain checklists
- examples
- command recipes
- schema details
- troubleshooting notes
- temporary promoted references

The active `SKILL.md` may name the reference but should not summarize the whole
reference.

## Review Checklist

Before adding or updating a skill, check:

- Is the `description` one short sentence?
- Does `Use for:` say the request shape plainly?
- Is there a Step 0 activation check?
- Does Step 0 stop before loading detailed references?
- Are mutation and approval gates visible in `SKILL.md`?
- Are long details moved to skill-local references?
- Does an exposed skill avoid depending on parent-adapter knowledge?
- Does the activation level match the mutation surface?
