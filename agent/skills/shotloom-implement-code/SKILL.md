---
description: Implement Shotloom code from an approved spec or fix structured review findings.
argument-hint: "[spec-path | findings-json | slug]"
allowed-tools: Read, Write, Edit, MultiEdit, Glob, Grep, Bash(git:*), Bash(rg:*), Bash(ls:*), Bash(test:*), Bash(cargo:*), Bash(npm:*), Bash(pnpm:*), Bash(node:*)
domains: rust
repo-keys: shotloom
languages: rust,typescript
frameworks: bevy,wgpu
task-types: implementation
context-profile: rust-bevy
context-rules: rules/code-write.md,rules/test-write.md
exclude-when: unreal,obsidian
---

# shotloom-implement-code

Implement Shotloom source changes from either:

- an approved spec after the task-preparation flow;
- a structured review findings file from a before-PR or PR-review loop.

Requires a local Shotloom checkout. If the configured `shotloom` repo cannot be
resolved, or the current worktree is not `CINEV/shotloom`, stop. This skill does
not operate on Knitten copies, cached docs, or memory-only guidance.

## Arguments

Accept exactly one input:

| Input | Meaning |
|---|---|
| `docs/plans/proposed/<slug>.md` | Implement the approved task spec. |
| `*.json` | Fix review findings from `/shotloom-review-before-pr`. |
| `<slug>` | Resolve the matching Knitten spec and briefing, then implement. |

If no argument is provided, show this usage table and ask for a spec path,
findings JSON path, or slug. Do not infer from chat memory.

## Workflow

### Step 1: Worktree Sanity

Run from the Shotloom worktree:

```bash
knitten_root="${KNITTEN_ROOT:?set KNITTEN_ROOT to the agent-hub repo path}"
node "$knitten_root/agent/lib/shotloom-worktree-sanity.mjs" --allow-dirty
```

If the worktree is dirty before implementation, list the dirty paths and ask
whether they are user changes, current-task changes, or abort-worthy state.
Never overwrite unknown dirty changes.

If this helper cannot locate a non-main `CINEV/shotloom` checkout, stop and
report that Shotloom must be cloned or registered before using this skill.

### Step 2: Load Shotloom Guidance

This skill can run standalone. Use guidance already loaded or cited by the
caller when present; otherwise discover only the smallest guidance set needed
for the input and changed surface.

| Caller path | Guidance source |
|---|---|
| Spec implementation | The approved spec, briefing, and any guidance list recorded by the task-preparation flow. |
| Review-finding fix | The finding's cited guideline/source, any finding-local evidence, and `docs/guidelines/code-review-guideline.md` when the finding uses Shotloom priority labels. |
| Standalone invocation | The input file plus the smallest directly relevant Shotloom guidance for the changed surface. |

If guidance must be discovered, run the guidance resolver from the Shotloom
worktree:

```bash
node <this-skill>/scripts/resolve-guidance.mjs --input=<spec-or-findings-path>
```

Read every existing file listed in `read[]`. Report `surface` and `missing[]`
in the final output if non-empty. Do not load a parent workflow skill for this
purpose, and do not duplicate guideline text in this skill.

### Step 3: Resolve Implementation Input

| Input kind | Required read |
|---|---|
| Spec path or slug | Knitten briefing plus approved spec. |
| Findings JSON | Every supplied finding selected by the caller workflow. |

For a spec, extract:

- requirements
- non-goals
- implementation surfaces
- acceptance checks
- tests or fixtures

For findings JSON, extract:

- finding `id`
- `file`
- `line`
- `summary`
- `requiredAction`
- `acceptanceCheck`

If required input is missing or contradictory, stop and ask. Do not implement
from unstated intent.

### Step 4: Implement

Before editing source, read [`PROMOTED_FINDINGS.md`](PROMOTED_FINDINGS.md) and
apply entries that match the active implementation surface or validation loop.

Apply the smallest source changes that satisfy the loaded spec or supplied
findings.

Follow the loaded Shotloom guidance plus the active input:

| Input | Must satisfy |
|---|---|
| Spec | approved spec acceptance checks |
| Findings JSON | each supplied finding's `requiredAction` and `acceptanceCheck` |

If sources conflict, stop and ask.

### Step 5: Scope Boundary

Implement only the accepted spec requirements or the findings supplied in the
input. Readiness policy, severity routing, and follow-up review cadence belong
to the caller workflow.

### Step 6: Validate

Run the validation named by the active input or loaded Shotloom guidance.

Always run:

```bash
git diff --check
```

If no exact validation exists, run the nearest targeted command and report the
coverage limit.

### Step 7: Output

Report:

- implementation input
- requirements or findings addressed
- files changed
- validation commands and results

## Related

- [`shotloom-start-task`](../shotloom-start-task/SKILL.md) — pre-write briefing
- [`shotloom-draft-spec`](../shotloom-draft-spec/SKILL.md) — approved spec
- [`shotloom-review-before-pr`](../shotloom-review-before-pr/SKILL.md) — pre-PR review loop
