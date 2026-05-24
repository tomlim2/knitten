---
description: Route implementation requests to the correct agent-hub implementation workflow. Use when the user asks to implement, build, fix, or code without naming a domain skill.
argument-hint: "[request]"
allowed-tools: Read, Glob, Grep, Bash(git:*), Bash(rg:*), Bash(test:*), Bash(node:*)
domains: agent-hub
repo-keys: agent-hub
languages: markdown,yaml,json
task-types: implementation
work-modes: company,experiment,personal
context-profile: ah-authoring
context-rules: rules/task-context-routing.md
---

# ah-route-implementation

Route implementation requests to the correct implementation workflow.

## Purpose

Use this when the user asks to implement, build, fix, or code without naming the
exact domain skill. This skill selects work mode, technical context profile,
pre-edit evidence, post-edit verification, and review handoff.

## Inputs

| Input | Meaning |
|-------|---------|
| user request | Implementation goal and constraints. |
| cwd and repo key | Technical profile and work mode. |
| changed files or target path | Local conventions and likely test surface. |
| issue, spec, or order | Company evidence gate. |

## Implementation Modes

| Mode | Required Gate |
|------|---------------|
| `personal` | Inspect local conventions, implement the smallest working slice, verify locally. |
| `company` | Read order/issue/spec, repo conventions, implement scoped change, run required checks, summarize remaining failures. |
| `experiment` | Record hypothesis, run bounded change, measure result, preserve cleanup path. |

## Router Output

| Output | Meaning |
|--------|---------|
| `selected_context_profile` | Existing technical route profile. |
| `selected_work_mode` | `personal`, `company`, or `experiment`. |
| `implementation_gate` | Required pre-edit evidence and post-edit verification. |
| `review_gate` | Review skill before handoff or PR. |

## Workflow

1. Classify work mode with `agent/rules/task-context-routing.md`.
2. Select the technical context profile from `AGENT-HUB.md`.
3. Read only the matching implementation skill and repo rules.
4. Implement the smallest verifiable slice first.
5. Run tests after each implementation pass.
6. Run routed review before company PR or handoff.

## Files

| File | Purpose |
|------|---------|
| `SKILL.md` | Implementation router workflow. |
