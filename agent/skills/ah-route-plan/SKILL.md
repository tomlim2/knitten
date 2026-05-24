---
description: Route planning requests to the correct agent-hub planning workflow. Use when the user asks for a plan, spec, milestone, issue plan, PR-response plan, or experiment plan without naming a leaf skill.
argument-hint: "[request]"
allowed-tools: Read, Glob, Grep, Bash(git:*), Bash(rg:*), Bash(test:*), Bash(node:*)
domains: agent-hub
repo-keys: agent-hub
languages: markdown,yaml,json
task-types: authoring
work-modes: company,experiment,personal
context-profile: ah-authoring
context-rules: rules/task-context-routing.md
---

# ah-route-plan

Route planning requests to the correct planning workflow.

## Purpose

Use this when the user asks for a plan without naming the exact planning skill.
This skill selects the planning mode, evidence gate, and target skill before any
durable plan or spec is written.

## Inputs

| Input | Meaning |
|-------|---------|
| user request | Plan target and expected output. |
| cwd and repo key | Personal, company, or experiment evidence. |
| issue, PR, or order | Company planning source. |
| existing milestone or spec | Lifecycle target. |

## Planning Modes

| Mode | Evidence | Output |
|------|----------|--------|
| `personal-small` | personal work, small local change | Short checklist and first verification step. |
| `personal-spec` | personal work across files or sessions | Proposed spec through `ah-manage-spec`. |
| `company-issue` | company issue, order, or repo gate | Issue-backed plan with acceptance and tests. |
| `company-pr-response` | review comment or CI failure | Fix plan tied to failing check or comment. |
| `experiment` | prototype, spike, benchmark, comparison | Hypothesis, measurement, stop condition, cleanup. |
| `milestone` | umbrella or multi-spec work | Milestone route through `ah-manage-milestone`. |

## Skill Map

| Condition | Skill |
|-----------|-------|
| agent-hub spec | `ah-manage-spec` |
| agent-hub milestone | `ah-manage-milestone` |
| Shotloom task start | `shotloom-start-task` |
| Shotloom spec draft | `shotloom-draft-spec` |
| code-derived spec | `dev-generate-spec` |
| decision comparison | `dev-decision-start` |

## Workflow

1. Classify work mode with `agent/rules/task-context-routing.md`.
2. Select one planning mode.
3. Read only the matching planning skill and evidence source.
4. Produce the smallest plan that lets the next agent act.
5. Persist a spec or milestone only through the owning lifecycle skill.

## Files

| File | Purpose |
|------|---------|
| `SKILL.md` | Plan router workflow. |
