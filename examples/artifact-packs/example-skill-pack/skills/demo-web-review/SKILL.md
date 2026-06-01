---
description: Review public web or Markdown content for clarity, structure, accessibility, and routing fit. Use when a user asks for a lightweight web content review.
domains: web
task-types: review
languages: markdown
context-profile: web
portability: shared
---

# Demo Web Review

## Purpose

Review one public web or Markdown artifact without loading private project
context.

## Inputs

| Input | Rule |
|-------|------|
| Content path or pasted text | Required. |
| Review goal | Optional; infer clarity and usability review when absent. |
| Audience | Optional; use general web reader when absent. |

## Workflow

1. Identify the content type: page copy, Markdown doc, form, navigation, or UI text.
2. Check structure: title, headings, section order, and scannability.
3. Check clarity: concrete nouns, direct verbs, missing inputs, and missing outputs.
4. Check accessibility: link text, image alt intent, heading jumps, and ambiguous controls.
5. Check routing fit: whether the task belongs to web review or another domain.
6. Return findings first, then a short patch plan.

## Output

```markdown
## Findings

| Severity | Location | Finding |
|----------|----------|---------|
| P1/P2/P3 | <path or section> | <issue and consequence> |

## Patch Plan

1. <smallest safe edit>
2. <verification>
```

## Boundaries

| Boundary | Rule |
|----------|------|
| Private data | Do not request or infer private credentials, customer names, or local machine paths. |
| Implementation | Do not edit files unless the user asks for fixes. |
| Domain routing | If the content is not web or Markdown, report the better route instead of forcing this skill. |
