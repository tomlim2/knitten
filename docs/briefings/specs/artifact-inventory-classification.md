---
status: intake
created: 2026-05-20
updated: 2026-05-20
owner: agent-hub
spec: docs/plans/active/artifact-inventory-classification.md
---

# Spec Intake: artifact-inventory-classification

## User Request

Continue the next milestone task after the thin-skill review follow-up merge.

## Goal

Define the machine-readable artifact inventory schema and storage contract so
later classification work can generate rows without chat history.

## Route

| Field | Value |
|-------|-------|
| Selected route | `ah-manage-spec` create active spec |
| Implementation route | `ah-route-implementation` company mode |
| Milestone | `agent-artifact-pack-system` |
| Selected work item | `artifact-inventory-classification` |

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| file | `docs/milestones/agent-artifact-pack-system.md` | Names the inventory spec and required row types. |
| file | `docs/plans/active/thin-skill-guide-boundary.md` | Defines skill rows, extraction item rows, and skill size/kind/readiness rules. |
| file | `docs/plans/completed/artifact-pack-vocabulary.md` | Owns artifact type and pack vocabulary. |
| file | `agent/config/README.md` | Owns config registry and schema placement rules. |
| file | `agent/config/repo-policy.schema.json` | Existing JSON schema placement pattern. |
| skill | `agent/skills/ah-manage-spec/SKILL.md` | Owns spec lifecycle and intake rules. |
| standard | `agent/standards/policy/llm-first-docs.md` | Owns LLM-first doc shape. |

## Known Decisions

| Decision | Source |
|----------|--------|
| Inventory is machine-readable; Markdown tables are validated views. | `docs/milestones/agent-artifact-pack-system.md`. |
| Inventory row types are `artifact`, `skill`, and `extraction-item`. | Milestone inventory contract and thin-skill boundary. |
| Skill rows and extraction item rows use the fields from `thin-skill-guide-boundary`. | `docs/plans/active/thin-skill-guide-boundary.md`. |
| Do not move artifacts before inventory exists and is reviewed. | Milestone inventory contract. |

## Open Questions

| Question | Default For This Spec |
|----------|-----------------------|
| Where is the canonical inventory data file? | `agent/config/artifact-inventory.json`. |
| Where is the schema? | `agent/config/artifact-inventory.schema.json`. |
| Does this PR generate the full inventory? | No. This PR creates the schema contract; generator and row population are next. |

## Exclusions

| Exclusion | Reason |
|-----------|--------|
| No full artifact inventory rows | Generator and pilot classification follow after schema acceptance. |
| No physical file moves | Migration depends on reviewed inventory rows. |
| No validator enforcement | Fail-only enforcement starts after generator output and pilot rows exist. |

## Validation Expected

| Command | Purpose |
|---------|---------|
| `node -e "JSON.parse(require('fs').readFileSync('agent/config/artifact-inventory.schema.json','utf8'))"` | Parse the schema JSON. |
| `node scripts/validate-llm-first.mjs --check spec-lifecycle` | Check lifecycle and intake links. |
| `node scripts/validate-llm-first.mjs` | Full repo validation. |
| `git diff --check` | Patch whitespace check. |
