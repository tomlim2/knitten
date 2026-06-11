---
title: "{{PROJECT}} Project Record"
tags:
  - type/reference
  - project/{{PROJECT}}
date: {{YYYY-MM-DD}}
source: agent
---

# {{PROJECT}} Project Record

## Overview

| Field | Value |
|-------|-------|
| Project | {{PROJECT}} |
| Issue | {{ISSUE_LINK_OR_NONE}} |
| Period | YYYY-MM-DD ~ YYYY-MM-DD |
| Status | Done / In Progress |
| Owner | {{OWNER}} |
| Branch | `{{BRANCH}}` |

## Summary

{{ONE_TO_THREE_SENTENCES}}

## Results

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| {{METRIC}} | {{BEFORE}} | {{AFTER}} | {{DELTA}} |

## Timeline

| Date | Milestone |
|------|-----------|
| YYYY-MM-DD | {{MILESTONE}} |

## Technical Details

| Category | Technology |
|----------|------------|
| Engine | {{ENGINE_OR_NONE}} |
| Language | {{LANGUAGE_OR_NONE}} |
| Tools | {{TOOLS_OR_NONE}} |

## Decisions

| Problem | Decision | Evidence |
|---------|----------|----------|
| {{PROBLEM}} | {{DECISION}} | {{LINK_OR_NOTE}} |

## References

| Channel | Thread | Topic |
|---------|--------|-------|
| `#channel-name` | [link](url) | {{TOPIC}} |

## Portfolio Notes

| Keyword | Evidence |
|---------|----------|
| {{KEYWORD}} | {{EVIDENCE}} |

## Fill Rules

- Replace every `{{PLACEHOLDER}}`.
- Delete rows that do not apply.
- Keep one project per file.
