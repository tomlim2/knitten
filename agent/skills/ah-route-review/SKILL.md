---
description: Route review requests to the correct agent-hub review skill chain. Use when the user asks for review, audit, PR review, UX review, spec review, or implementation review without naming a leaf skill.
argument-hint: "[target]"
allowed-tools: Read, Glob, Grep, Bash(git:*), Bash(rg:*), Bash(test:*), Bash(node:*)
domains: agent-hub
repo-keys: agent-hub
languages: markdown,yaml,json
task-types: review
work-modes: company,experiment,personal
context-profile: ah-authoring
context-rules: rules/task-context-routing.md
---

# ah-route-review

Route review requests to the correct review workflow.

## Purpose

Use this when the user asks for a review without naming the exact review skill.
This skill classifies the request, selects existing review skills, and keeps the
review pass read-only unless the user explicitly asks for fixes.

## Inputs

| Input | Meaning |
|-------|---------|
| user request | Review target, wording, and constraints. |
| cwd and repo key | Repo-specific review gates. |
| changed files or target path | Review surface. |
| work mode | `personal`, `company`, or `experiment`. |

## Classification

| Evidence | Review Type | Skill Chain |
|----------|-------------|-------------|
| agent-hub implementation or spec parity | `implementation` | `ah-review-implementation` |
| Shotloom PR, branch, Rust, TypeScript | `pr` | `shotloom-review-before-pr` |
| web code | `code` | `review-audit-web` |
| UI, UX, copy, layout | `ux` | `review-audit-ux` |
| technical spec, PRD, website spec | `spec` | `review-audit-web-spec` |
| Three.js, WebGL, WebGPU, shader | `asset` | `review-audit-3d` |
| generated motion or retarget screenshot | `asset` | `review-audit-ai-motion`, `review-audit-retarget` |

For mixed scope, run code/docs first, then UX/spec or asset review when the
changed files require it.

## Output Contract

Return:

| Field | Meaning |
|-------|---------|
| `selected_review_type` | `code`, `docs`, `ux`, `spec`, `implementation`, `pr`, `asset`, or `mixed`. |
| `selected_skill_chain` | Ordered existing skills to read or invoke. |
| `required_context` | Repo rules, standards, and files to load. |
| `verification_gate` | Commands or manual checks before reporting. |

Findings come first. If no findings exist, say so and list residual risk.

## Workflow

1. Classify work mode with `rules/task-context-routing.md`.
2. Select the narrowest review type from the table.
3. Read only the selected skill bodies and direct references.
4. Run required verification before reporting.
5. Report findings first.

## Files

| File | Purpose |
|------|---------|
| `SKILL.md` | Review router workflow. |
