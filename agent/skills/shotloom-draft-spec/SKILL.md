---
description: Leaf/component Shotloom skill for spec authoring after start-task. Prefer shotloom-router or shotloom-prepare-task for full task preparation.
argument-hint: "[slug]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(bash:*), Bash(git:*), Bash(ls:*), Bash(stat:*), Bash(rg:*), Bash(test:*), Bash(resolve-local-artifact-path:*)
domains: rust
repo-keys: shotloom
languages: rust,typescript
frameworks: bevy,wgpu
task-types: authoring,review
context-profile: shotloom-review
exclude-when: unreal,obsidian
---

# shotloom-draft-spec

## Role

Leaf/component skill. Prefer
[`../shotloom-prepare-task/SKILL.md`](../shotloom-prepare-task/SKILL.md) for a
full pre-implementation request unless start-task already produced a Ready
briefing.

User-facing Shotloom spec workflow after `/shotloom-start-task`.

## Purpose

Create the implementation spec after a separated planning path: briefing,
research, options, spec contract, design plan, review. Run the spec review loop
before any source edits, commit and push the briefing plus reviewed spec, then
stop and ask whether to implement.

## Workflow

Run the full workflow in
[`../shotloom-draft-task-plan/SKILL.md`](../shotloom-draft-task-plan/SKILL.md).
That file remains the compatibility implementation. Apply these user-facing
rules on top:

1. Call this workflow `/shotloom-draft-spec` in chat, briefings, and next-step
   instructions.
2. Treat "draft plan" as legacy wording; write a **spec**, not a plan.
3. Use this planning vocabulary in chat and artifacts:

   | Stage | Meaning |
   |---|---|
   | Briefing | `shotloom-start-task` readiness, blockers, Linear/PR/head state. |
   | Research | Live code, ADR, spec, sibling issue/PR audit. |
   | Options | Plausible approaches and chosen direction for boundary-heavy work. |
   | Spec Contract | Requirements, locked decisions, non-goals, invariants, acceptance. |
   | Design Plan | File/module implementation sequence using `agent/document-templates/agent-hub/design-plan.md` plus Shotloom-specific constraints from the compatibility workflow. |
   | Implementation | Source edits after the user gives a separate go-ahead. |

4. After the direct spec lands, immediately run the review gate named in the
   compatibility workflow.
5. If spec authoring or review uncovers a question for the user, stop and ask
   before locking that choice into the spec. Use this for scope boundaries,
   product intent, Linear interpretation, implementation trade-offs, or
   unresolved P1/P2 review findings that cannot be answered from live code.
6. Final response must share the reviewed spec path and ask whether to start
   implementation.
7. Do not edit Shotloom source files before the user gives a separate
   implementation go-ahead.

## Output Contract

- `.agent-local/shotloom/planning/stl-<N>/brief.json` in Knitten
- `.agent-local/shotloom/planning/stl-<N>/spec.json` in Knitten
- `.agent-local/shotloom/planning/stl-<N>/design-plan.json` in Knitten
- `.agent-local/shotloom/planning/stl-<N>/manifest.json` in Knitten
- final user prompt: "이 스펙으로 구현 시작할까요?"

## Local Artifact Contract

Resolve every planning artifact through
`resolve-local-artifact-path`. Do not write raw planning outputs
under tracked `docs/` paths unless a later promotion step explicitly turns a
local artifact into durable knowledge.
