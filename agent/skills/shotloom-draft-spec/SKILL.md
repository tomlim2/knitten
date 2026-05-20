---
description: Author and review a Shotloom task spec after shotloom-start-task; commit/push the briefing and reviewed spec, then ask before implementation
argument-hint: "[slug]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(bash:*), Bash(git:*), Bash(ls:*), Bash(stat:*), Bash(rg:*), Bash(test:*)
domains: rust
repo-keys: shotloom
languages: rust,typescript
frameworks: bevy,wgpu
task-types: authoring,review
context-profile: shotloom-review
context-rules: rules/shotloom.md,rules/shotloom-docs-lane.md
exclude-when: unreal,obsidian
---

# shotloom-draft-spec

User-facing Shotloom spec workflow after `/shotloom-start-task`.

## Purpose

Create the implementation spec in one pass, run the spec review loop before any
source edits, commit and push the briefing plus reviewed spec, then stop and ask
whether to implement.

## Workflow

Run the full workflow in
[`../shotloom-draft-task-plan/SKILL.md`](../shotloom-draft-task-plan/SKILL.md).
That file remains the compatibility implementation. Apply these user-facing
rules on top:

1. Call this workflow `/shotloom-draft-spec` in chat, briefings, and next-step
   instructions.
2. Treat "draft plan" as legacy wording; write a **spec**, not a plan.
3. After the direct spec lands, immediately run the review gate named in the
   compatibility workflow.
4. If spec authoring or review uncovers a question for the user, stop and ask
   before locking that choice into the spec. Use this for scope boundaries,
   product intent, Linear interpretation, implementation trade-offs, or
   unresolved P1/P2 review findings that cannot be answered from live code.
5. Final response must share the reviewed spec path and ask whether to start
   implementation.
6. Do not edit Shotloom source files before the user gives a separate
   implementation go-ahead.

## Output Contract

- `docs/briefings/shotloom/<slug>.md` in Knitten
- `docs/plans/proposed/<slug>.md` in Knitten
- one direct-spec commit and push when the spec converges
- optional review-spec commit and push when review patches the spec
- one created or updated daily docs PR for the Knitten branch
- final user prompt: "이 스펙으로 구현 시작할까요?"

## Branch Contract

All Knitten docs written by this skill use the daily Shotloom docs lane from
`agent/rules/shotloom-docs-lane.md`:

```text
codex/YYYYMMDD-shotloom-docs
```

Use the existing KST-date branch when it exists. Create it from `origin/main`
only when neither the local nor remote branch exists. Do not create a per-STL
Knitten branch for Shotloom specs.
