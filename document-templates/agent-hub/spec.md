---
status: accepted
---

# AH Spec Document Template

Use this template for generic AH development specs. A spec document contains
both the work contract and the design plan in one file.

## Generated Body

```markdown
# <Title>

## Status

Draft.

## Goal

<One or two sentences describing the intended outcome.>

## Problem

<What is wrong, missing, unclear, or risky today.>

## Boundary

In scope:

- <Included surface or behavior.>

Out of scope:

- <Excluded surface or behavior.>

## Inputs

| Input | Required | Meaning |
|-------|----------|---------|
| `<input>` | Yes | <What the implementation consumes.> |

## Outputs

| Output | Persistence | Meaning |
|--------|-------------|---------|
| `<output>` | durable/local/none | <What the work produces.> |

## Contract

- <Observable rule, invariant, or behavior that must hold.>
- <Input/output relationship that must be preserved.>

## Validation

- `<command or check>`
- <Manual check or inspection, when needed.>

## Acceptance Criteria

- <Condition that proves the work is done.>
- <Condition that proves it did not grow beyond scope.>

## Open Questions

- None.

## Design Plan

### Inputs

- <Spec, issue, existing file, current branch, failing command, or artifact.>

### Outputs

- <Changed file, generated artifact, validation evidence, or final state.>

### Implementation Sequence

#### 1. <Stage Name>

Files:

- `<path>`

Changes:

- <Smallest meaningful change.>
- <Expected behavior after the change.>

Risk:

- <What could break or be misunderstood.>

Proof:

- `<command or assertion>`

#### 2. <Stage Name>

Files:

- `<path>`

Changes:

- <Smallest meaningful change.>

Risk:

- <Risk or `None`.>

Proof:

- `<command or assertion>`

### Review Plan

- Contract: <what to verify against the spec>
- Boundary: <what must not leak into scope>
- Validation: <what evidence must be present>
```

## Fill Rules

- Keep the spec dry and implementation-oriented.
- Put the design plan inside the same document under `## Design Plan`.
- Use explicit inputs and outputs. If there is no file output, say `none`.
- Prefer observable contracts over broad background.
- Keep implementation stages ordered from smallest proof to broader updates.
- Every stage should name `Files`, `Changes`, `Risk`, and `Proof`.
- Do not write user artifacts into a plugin install copy.
- Use the active workspace's documented spec location. If none exists, use
  `docs/specs/<slug>.md`.
