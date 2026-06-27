---
status: accepted
---

# Design Plan Template

Use this template for implementation-order plans inside specs or task plans.

- This is an internal-consumption template.
- It defines execution order, not product design prose.
- Each stage must be verifiable by an implementer and reviewer.

## Generated Body

```markdown
## Design Plan

S0 - Baseline re-check

Input:
- <current branch, spec, issue, failing command, existing file, or artifact>

Output:
- <confirmed current state, failing-before signal, or no-op baseline result>

Non-output:
- <source edits, generated files, external comments, or other side effects not allowed in S0>

Failure:
- <stop, ask, report blocker, or record diagnostic>

Proof:
- <command, diff check, screenshot, test, or manual assertion>

S1 - <stage name>

Input:
- <typed data, existing function, command body, file, or artifact consumed>

Output:
- <state, file, event, diagnostic, test, or artifact produced>

Non-output:
- <state, file, event, side effect, or scope this stage must not produce>

Failure:
- <reject, skip, rollback, stop-and-ask, or diagnostic behavior>

Proof:
- <test, gate, manual repro, diff check, or post-state assertion>
```

## Fill Rules

- Keep stages ordered from smallest proof to broader updates.
- Every stage uses `Input`, `Output`, `Non-output`, `Failure`, and `Proof`.
- `Output` describes observable post-state, not implementation activity.
- `Non-output` blocks adjacent scope and accidental side effects.
- `Failure` states what happens when the stage cannot complete.
- `Proof` names the check that shows the stage worked.
- Use `None` only when a row truly does not apply.
- Prefer concrete paths, symbols, commands, request body names, and artifact names.
