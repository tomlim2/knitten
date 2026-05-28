---
description: "Run Shotloom task preparation end-to-end: start-task briefing, draft-spec, spec review, commit/push docs, then stop before implementation."
argument-hint: "[STL-NN | linear-url | slug | category]"
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

## Purpose

Run the full preparation path before source edits:

1. `/shotloom-start-task` creates the Ready briefing.
2. `/shotloom-draft-spec` writes the implementation spec and runs the spec
   review gate.
3. Stop and ask whether to implement.

This skill does not edit Shotloom source files.

## Arguments

Pass through the user's argument to `/shotloom-start-task`. Accepted shapes:

- `STL-NN`
- Linear URL
- slug
- category (`rust`, `ts`, `bridge`, `docs`, `test`)

Zero args is valid only when `/shotloom-start-task` can infer the task from the
current branch, git state, or recent commits.

## Workflow

### Step 1: Run Start Task

Run the complete workflow in
[`../shotloom-start-task/SKILL.md`](../shotloom-start-task/SKILL.md) with the
same arguments.

If `/shotloom-start-task` asks a question, reports wrong repo/user, reports
dirty-state choices, or cannot resolve a slug, stop and surface that blocker.

If `/shotloom-start-task` writes a Ready briefing without blockers, treat the
user's `/shotloom-prepare-task` request as approval to continue to spec
authoring. Do not ask for a separate Ready-briefing acceptance inside this
orchestrated flow.

If it writes a Ready briefing, capture:

- briefing path
- inferred slug
- Shotloom worktree branch
- daily Knitten docs branch
- any ask-first triggers

Do not edit Shotloom source files.

### Step 2: Run Draft Spec

Run [`../shotloom-draft-spec/SKILL.md`](../shotloom-draft-spec/SKILL.md) using
the inferred slug. If slug inference is ambiguous, ask before invoking it.
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
- Do not write Shotloom source files.
- Do not open a PR.
- Do not proceed past a child-skill blocker.
- Preserve the daily Shotloom docs branch contract from
  `agent/rules/shotloom-docs-lane.md`.

## Related

- [`shotloom-start-task`](../shotloom-start-task/SKILL.md) — Ready briefing
- [`shotloom-draft-spec`](../shotloom-draft-spec/SKILL.md) — spec authoring and review
- [`shotloom-review-task-plan`](../shotloom-review-task-plan/SKILL.md) — spec review gate
