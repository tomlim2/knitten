---
status: done
completed: 2026-05-09
load: triggered
trigger: reviewing the completed LLM-first migration
charter-anchor: SYSTEM.md → "Repository charter"
standard: agent/standards/policy/llm-first-docs.md
created: 2026-05-01
tag: v3.1.0
---

# LLM-First Migration Plan

This migration is complete. It moved `caol-ila` from a Claude-only instruction folder toward an LLM-first policy system with a canonical policy document, explicit entry documents, grouped standards, frontmatter metadata, and validator-backed anti-rot checks.

## Closeout

| Item | Result |
|------|--------|
| Charter | `SYSTEM.md` owns the LLM-first repository charter |
| Entry documents | `CLAUDE.md` and `AGENTS.md` load shared policy first |
| Navigation | `LOOKUP.md` provides goal-to-doc routing |
| Rules | every `agent/rules/*.md` has `load:` frontmatter |
| Standards | standards are grouped by topic under `agent/standards/` |
| Standard status | every standard has `status:` frontmatter |
| Validator | `scripts/validate-llm-first.mjs` enforces anti-rot checks |
| Drift hardening | completed in `docs/plans/harden-system-drift.md` |
| Vault split | completed in `docs/plans/split-vault-folders.md` |
| Tag | `v3.1.0` exists |

## Definition Of Done

| Requirement | Check |
|-------------|-------|
| Rules frontmatter exists | `node scripts/validate-llm-first.mjs --check rules-frontmatter` |
| `LOOKUP.md` exists and links resolve | `node scripts/validate-llm-first.mjs --check markdown-links` |
| Validator exists and runs | `node scripts/validate-llm-first.mjs` |
| Banned terms absent from active LLM docs | `node scripts/validate-llm-first.mjs --check banned-terms` |
| Standards grouped and references resolve | `node scripts/validate-llm-first.mjs --check markdown-links` |
| Standards have `status:` frontmatter | `node scripts/validate-llm-first.mjs --check standards-status` |

## Accepted Variance

| Original plan text | Closeout decision |
|--------------------|-------------------|
| Validator runs in CI | No CI config exists in this repo. Current enforcement is the local validator plus authoring docs. Future CI belongs in an infrastructure plan if needed. |
| P1.3 vault split tracked in `vault-policy-split.md` | Actual file is `docs/plans/split-vault-folders.md`; it is done. |
| Old flat `standards/` inventory | Replaced by grouped `agent/standards/<group>/` folders and README generated inventory. |

## Follow-Up

| Follow-up | Plan |
|-----------|------|
| Agent hub manifest and hub-level validation | `docs/plans/agent-hub.md` |
| Additional registry drift prevention | `docs/plans/harden-system-drift.md` is complete; add new work to `agent-hub.md` or a new focused plan |

## Historical Baseline

| Milestone | Meaning |
|-----------|---------|
| `v3.0.0` | charter declared and first LLM-first audit landed |
| `v3.1.0` | migration target reached |
