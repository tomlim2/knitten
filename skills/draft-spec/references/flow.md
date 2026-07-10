# Draft Spec Flow

Use this reference after `draft-spec` Step 0 passes.

## Inputs And Output

Use the task purpose, known references or constraints, and any already chosen
approach. Produce a compact spec with status, goal, boundary, inputs, outputs,
plan, validation, acceptance criteria, and open blockers.

Use `document-templates/workflow/spec.md` when available. Keep the document dry
and implementation-oriented; include background only when it changes the
contract.

## Conditional Research Agents

Use research subagents only when the spec spans multiple modules or
repositories, or when current reuse and validation surfaces cannot be mapped
cheaply in the primary context. Do not spawn them for small, already-bounded
specs.

When needed, spawn two independent read-only agents:

- Reuse/precedent scout: `gpt-5.6-terra` with
  `model_reasoning_effort = "medium"`; map existing helpers, primitives,
  contracts, and patterns that could satisfy the request.
- Validation/proof scout: `gpt-5.6-terra` with
  `model_reasoning_effort = "medium"`; map tests, fixtures, validators, and
  executable acceptance evidence.

Give each agent only the task purpose, known constraints, explicit readable
paths, and its narrow lens. The primary agent owns approach selection, boundary
decisions, and every spec write.

If a read-only sandbox/profile cannot be enforced, do not spawn agents. Run
both lenses sequentially in the primary workflow and record the unavailable
profile.

If the exact model is unavailable, use the fastest available read-capable model
at `medium` or the closest supported reasoning effort. Record the requested and
effective model/profile in the spec notes. If per-agent model selection is
unavailable, keep both agents separate with the available model and record that
fallback. If subagents are unavailable, run the two lenses sequentially in the
current session and record that fallback.

## Skill Specs

When the spec creates or updates a skill, include:

- `match-check: loose | normal | strict`,
- the Step 0 decision,
- the approval or stop condition before mutation.

Use `docs/guidelines/skill-match-check.md` for match levels and
`docs/guidelines/skill-authoring.md` for the compact match-first shape. Prefer
direct skills, domain plugins, and deferred internal flows over a new broad
selection surface.

Infer `strict` when the skill can push, merge, deploy, delete, send external
messages, mutate GitHub/Linear, change credentials or config, or affect
production. Ask only when the classification is not evident from policy.

## Path Handling

Use the active workspace's documented spec location. If none exists, resolve
the registered default:

```bash
<knitten-plugin-root>/bin/knitten-resolve-output --skill=draft-spec --name=<task-name> --create
```

Do not write specs into the plugin install path.
