---
name: draft-spec
description: Draft a compact implementation spec.
match-check: normal
---

# Draft Spec

Use for: drafting compact specs, implementation contracts, or pre-work plans.

Use when the user asks for a spec, plan, design plan, implementation contract,
or pre-work document before editing.

## Step 0: Match Check

- Continue only when the request asks for a spec, plan, design plan,
  implementation contract, or pre-work document.
- Confirm the active workspace and intended durable spec location before
  writing.
- Stop before implementation unless the user separately asks to implement after
  the spec is accepted.
- If the request is generic or better handled by another skill, stop and name
  the better matching skill.
- Do not read templates, create files, or follow later steps until this check
  passes.

## Mode Contract

Do not require or invoke Codex `/plan` mode. Perform planning as this skill's
workflow in the current session mode, write the spec artifact, and stop before
implementation. If scope or correctness remains uncertain, ask the user before
locking the spec.

## Input

- Task purpose.
- Known references or constraints.
- Chosen approach, if already decided.

## Output

- Spec with goal, boundary, inputs, outputs, plan, validation, acceptance
  criteria, and open blockers.

## Spec Shape

Use `document-templates/workflow/spec.md` when available.

Include:

- status
- goal
- boundary
- inputs
- outputs
- plan
- validation
- acceptance criteria

Keep the spec dry and implementation-oriented. Do not add broad background
unless it affects the contract.

## Skill Specs

When the requested spec creates or updates a skill, include an
`match-check` decision and Step 0 decision in the spec.

Ask or infer:

- `match-check: loose | normal | strict`
- whether the skill needs an explicit `Step 0: Match Check`
- which user approval or stop condition applies before mutation

Use `docs/specs/skill-match-check-policy.md` as the source of truth.
Use `docs/guidelines/skill-authoring.md` as the source of truth for keeping the
active `SKILL.md` short, match-first, and reference-backed.
Prefer direct skills, domain plugins, and internal deferred flows. Do not add
new broad selection workflow surfaces; if a request asks for a selection layer
behavior, draft the direct-skill, domain-plugin, or internal-flow alternative
first.

Question only when the match check is not obvious. Infer `strict` without
asking when the skill can push, merge, deploy, delete, send external messages,
mutate GitHub/Linear, change credentials/config, or affect production state.

## Path Handling

When writing a spec file, use the active workspace's documented spec location.
If no location is documented, use the helper default:

```bash
<knitten-plugin-root>/bin/knitten-resolve-output --skill=draft-spec --name=<task-name> --create
```

Do not write specs into the plugin install path.
