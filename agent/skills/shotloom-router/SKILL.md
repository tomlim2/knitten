---
description: First router for any Shotloom-related task. Use before choosing a Shotloom user-facing orchestrator or leaf/component skill.
argument-hint: "<Shotloom task request>"
allowed-tools: Read, Glob, Grep, Bash(rg:*), Bash(git:*)
domains: shotloom
repo-keys: shotloom
languages: rust,typescript
frameworks: bevy,wgpu
task-types: ops,authoring,implementation,review,deploy
context-profile: shotloom-review
context-references: ../shotloom-skill-map.md
exclude-when: unreal,obsidian
---

# shotloom-router

First-read router for Shotloom-related work.

## Role

User-facing router. Use this skill first when the request is Shotloom-related
and the correct Shotloom skill is not already explicit.

## Workflow

1. Read [`../shotloom-skill-map.md`](../shotloom-skill-map.md).
2. Classify the user request into one row in the Route table.
3. Invoke the selected user-facing orchestrator.
4. Use leaf/component skills only when the map or selected orchestrator routes
   to them.

## Route

| User request | Use |
|---|---|
| Start a Linear task, prepare a task, write a spec before implementation | `shotloom-prepare-task` |
| Implement an approved spec or structured review findings | `shotloom-implement-code` |
| Review a branch before opening a PR | `shotloom-review-before-pr` |
| Address PR review comments | `shotloom-respond-pr` |
| Finish a task, close Linear, clean worktree | `shotloom-wrapup-task` |
| Show active work, worktrees, PRs, Linear state | `shotloom-status` |
| Watch a PR for checks/comments/state changes | `shotloom-watch-pr` |
| Run local gates only | `shotloom-check-gates` |
| Commit a prepared Shotloom diff | `shotloom-commit` |
| Open the Shotloom web app locally | `shotloom-open-web` |
| Deploy Shotloom web | `shotloom-deploy-web` |

## Binding Rules

- Prefer a user-facing orchestrator for full user tasks.
- Invoke a leaf/component skill directly only when the user names that exact
  operation or an orchestrator routes to it.
- Do not treat this router as approval to mutate PRs, deploy, push, or close
  Linear. The selected skill owns those gates.

## Related

- [`../shotloom-skill-map.md`](../shotloom-skill-map.md)
