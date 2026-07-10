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

- Reuse/precedent scout: use Core profile `scan-fast-readonly`; map existing
  helpers, primitives, contracts, and patterns that could satisfy the request.
- Validation/proof scout: use Core profile `scan-fast-readonly`; map tests,
  fixtures, validators, and executable acceptance evidence.

Give each agent only the task purpose, known constraints, explicit readable
paths, and its narrow lens. The primary agent owns approach selection, boundary
decisions, and every spec write.

Resolve the profile through `knitten-path agent-profile scan-fast-readonly`
before dispatch. Apply the returned model, reasoning, sandbox, and fallback
policy as one tuple, and record the requested profile plus effective settings
in the spec notes. If profile resolution fails, do not spawn agents; run both
lenses sequentially in the primary workflow.

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
