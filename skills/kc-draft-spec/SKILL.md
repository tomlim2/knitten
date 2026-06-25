---
name: kc-draft-spec
description: Draft a compact implementation spec.
---

# KC Draft Spec

Use for: drafting compact specs, implementation contracts, or pre-work plans.

Use when the user asks for a spec, plan, design plan, implementation contract,
or pre-work document before editing.

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

Use `document-templates/agent-hub/spec.md` when available.

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
`activation-check` decision and Step 0 decision in the spec.

Ask or infer:

- `activation-check: loose | normal | strict`
- whether the skill needs an explicit `Step 0: Activation Check`
- which user approval or stop condition applies before mutation

Use `docs/specs/skill-activation-check-policy.md` as the source of truth.
Use `docs/guidelines/skill-authoring.md` as the source of truth for keeping the
active `SKILL.md` short, router-aware, and reference-backed.
Use `docs/guidelines/routing-integration.md` when the requested spec adds a
payload plugin, router, leaf skill, route map, or skill move between plugins.

Question only when the activation check is not obvious. Infer `strict` without
asking when the skill can push, merge, deploy, delete, send external messages,
mutate GitHub/Linear, change credentials/config, or affect production state.

## Path Handling

When writing a spec file, use the active workspace's documented spec location.
If no location is documented, use the helper default:

```bash
<knitten-plugin-root>/bin/knitten-resolve-output --skill=kc-draft-spec --name=<task-name> --create
```

Do not write specs into the plugin install path.
