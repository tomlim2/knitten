---
status: accepted
created: 2026-05-26
owner: agent-hub
spec: ../../active/command-retirement-plan.md
---

# Command Retirement Deletion Batch 0

## Summary

| Field | Value |
|-------|-------|
| Commands before | 45 |
| Commands deleted | 5 |
| Commands after | 40 |
| Deletion rule | Active reference scan found no non-generated active references. |

## Deleted Commands

| Command | Reference scan result | Deletion rationale |
|---------|-----------------------|--------------------|
| `ah-explore-codebase` | 0 active references | General exploration is covered by normal code search and planning/review routers; no active slash dependency found. |
| `ah-generate-sitemap` | 0 active references | Skill-server sitemap workflow is stale and has no active route dependency. |
| `cci-format-comment` | 0 active references | One-off formatting prompt has no active route dependency; future wording work belongs in writing/review skills. |
| `cci-open-creator-vroid` | 0 active references | Local opener has no active route dependency; future CINEV tool launchers belong in a private pack if still needed. |
| `cci-slack-send-message` | 0 active references | Personal Slack command has no active route dependency; Slack send flows should use explicit app/tool confirmation or a private pack route. |

## Reference Scan

Command used for each candidate:

```bash
rg -n "<command-name>|agent/commands/<command-name>.md|/<command-name>" AGENT-HUB.md README.md LOOKUP.md SYSTEM.md agent docs scripts
```

Ignored hits:

| Hit class | Reason |
|-----------|--------|
| `agent/config/artifact-inventory.json` | regenerated after deletion |
| historical reports | retained as historical evidence |
| command retirement specs | updated in this deletion batch |

## Validation

| Check | Result |
|-------|--------|
| Command count | 40 |
| Inventory regeneration | `agent/config/artifact-inventory.json` regenerated with deleted command rows removed. |
| README inventory | Command count updated from 45 to 40. |

Full validation evidence is in the implementing commit.
