---
status: accepted
---

# Spec Templates

## General Caol/agent-hub Spec

```markdown
---
status: proposed
created: YYYY-MM-DD
updated: YYYY-MM-DD
owner: agent-hub
milestone:
---

# <Title>

## Purpose

## Problem

## Goals

## Non-Goals

## Current State

## Proposed Design

## Execution Plan

## Validation

## Risks

## Acceptance Criteria

## Open Decisions
```

High-risk specs should keep all sections. Small specs may omit sections that do
not apply.

## Review Output

```markdown
## Findings

1. <severity> <file:line>
   <finding>

## Open Questions

## Residual Risk
```

Findings come first. Summaries are secondary.

## Conflict Drafts

Use these only when a direct spec cannot safely converge:

| Suffix | Meaning |
|--------|---------|
| `.draft.md` | factual stop or unresolved decision |
| `.partial.md` | incomplete draft that should not be executed |
| `.codex.md` | competing body preserved for user decision |
| `.claude.md` | competing body preserved for user decision |
