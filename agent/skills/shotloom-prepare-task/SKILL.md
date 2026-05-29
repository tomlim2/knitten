---
description: "Run Shotloom task preparation end-to-end: start-task briefing, draft-spec, spec review, commit/push docs, then stop before implementation."
argument-hint: "STL-NN | linear-url"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(bash:*), Bash(gh:*), Bash(git:*), Bash(ls:*), Bash(mkdir:*), Bash(rg:*), Bash(stat:*), Bash(test:*)
domains: rust
repo-keys: shotloom
languages: rust,typescript
frameworks: bevy,wgpu
task-types: authoring,review
context-profile: shotloom-review
context-rules: rules/shotloom-docs-lane.md
exclude-when: unreal,obsidian
---

# shotloom-prepare-task

Shotloom pre-implementation orchestrator.

## Role

User-facing orchestrator. For ambiguous Shotloom task selection, start with
[`../shotloom-router/SKILL.md`](../shotloom-router/SKILL.md).

## Purpose

Run the full preparation path before source edits:

1. `/shotloom-start-task` creates the Ready briefing.
2. `/shotloom-draft-spec` writes the implementation spec and runs the spec
   review gate.
3. Stop and ask whether to implement.

This skill does not edit Shotloom source files.

## Arguments

Requires the same task identifier accepted by `/shotloom-start-task`:

- `STL-NN`
- Linear URL

If no Linear issue key or Linear URL is provided, ask for one and stop. Do not
infer the task from the current branch, git state, recent commits, slug, or
category.

## Workflow

### Step 1: Run Start Task

Run the complete workflow in
[`../shotloom-start-task/SKILL.md`](../shotloom-start-task/SKILL.md) with the
same arguments.

If `/shotloom-start-task` asks a question, reports a failed usability gate,
reports wrong repo/user, reports dirty-state choices, cannot create or attach
the Shotloom task worktree, or returns `ok: false`, stop and surface that
blocker.

If `/shotloom-start-task` writes a Ready briefing without blockers, treat the
user's `/shotloom-prepare-task` request as approval to continue to spec
authoring. Do not ask for a separate Ready-briefing acceptance inside this
orchestrated flow.

Consume the final JSON envelope from `/shotloom-start-task`. Capture:

- `issueKey`
- `slug`
- `briefingPath`
- `workDir`
- `contextPath`
- `openQuestions`
- `handoffCommand`

If `openQuestions` is non-empty, stop and ask the user. Do not edit Shotloom
source files.

### Step 2: Run Draft Spec

Run [`../shotloom-draft-spec/SKILL.md`](../shotloom-draft-spec/SKILL.md) using
the `slug` returned by `/shotloom-start-task`.
Tell the draft-spec workflow that the Ready briefing was accepted by the
orchestrator because `/shotloom-prepare-task` requested the full preparation
flow.

Let `/shotloom-draft-spec` own:

- spec authoring
- spec review gate
- briefing + spec commits
- pushes to the daily Knitten docs branch
- daily docs PR creation or update
- final reviewed spec path

Keep repo responsibilities separate:

| Repo | Owned by | Contract |
|---|---|---|
| Shotloom | `/shotloom-start-task` | Creates or attaches the task worktree. This skill does not commit source edits. |
| Knitten | `/shotloom-draft-spec` | Writes briefing/spec docs on the daily Shotloom docs lane from `agent/rules/shotloom-docs-lane.md`. |

If spec authoring or review asks a product/scope/trade-off question, stop and
surface that question. Do not guess.

### Step 3: Stop Before Implementation

After `/shotloom-draft-spec` completes, report:

- briefing path
- reviewed spec path
- commits pushed, if any
- daily docs PR URL, if created or updated
- remaining P3/nit notes, if any

Then ask:

```text
이 스펙으로 구현 시작할까요?
```

Implementation begins only after a separate user message such as `구현 시작`,
`implement`, or `go`.

## Binding Rules

- Do not bypass either child skill. This skill is orchestration only.
- Invoke `/shotloom-start-task` only with `STL-NN` or a Linear URL.
- Use only the `slug` returned by `/shotloom-start-task` when invoking
  `/shotloom-draft-spec`.
- Do not write Shotloom source files.
- Do not open a Shotloom implementation PR.
- Do not proceed past a child-skill blocker.
- Preserve the daily Shotloom docs branch contract from
  `agent/rules/shotloom-docs-lane.md`.

## Related

- [`shotloom-router`](../shotloom-router/SKILL.md) — first-read Shotloom task router
- [`shotloom-skill-map`](../shotloom-skill-map.md) — orchestrator and leaf/component map
- [`shotloom-start-task`](../shotloom-start-task/SKILL.md) — Ready briefing
- [`shotloom-draft-spec`](../shotloom-draft-spec/SKILL.md) — spec authoring and review
- [`shotloom-review-task-plan`](../shotloom-review-task-plan/SKILL.md) — spec review gate
