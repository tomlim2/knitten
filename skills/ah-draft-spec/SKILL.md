---
name: ah-draft-spec
description: Draft a generic AH development spec with clear purpose, inputs, outputs, implementation scope, validation, and acceptance criteria.
---

# AH Draft Spec

Use this leaf skill when the user asks to create a spec or when a prepared task
needs a written contract before implementation.

## Input

- Task purpose.
- Reference summary.
- Chosen approach.

## Output

- Draft spec.
- Explicit input and output.
- Acceptance criteria.
- Open questions or blockers.

## Spec Shape

Use `document-templates/agent-hub/spec.md` when available. The spec document
contains both the work contract and the design plan section.

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

## Path Handling

When writing a spec file, use the active workspace's documented spec location.
If no location is documented, use the helper default:

```bash
<knitten-plugin-root>/bin/knitten-resolve-output --skill=ah-draft-spec --name=<task-name> --create
```

Do not write specs into the plugin install path.
