---
status: active
load: triggered
trigger: hardening system docs against magic-value drift
created: 2026-05-09
standard: claude/standards/policy/llm-first-docs.md
decision: docs/decisions/0001-platform-neutral-agent-system.md
---

# System Drift Hardening Plan

## Context

System docs contain repeated counts, thresholds, enums, category lists, and exception lists. Drift already appeared in validator check counts, LOOKUP link-check text, and command/skill categories.

## Execution Order

| Tier | Status | Work | Acceptance |
|------|--------|------|------------|
| P0 | done | Fix known drift: validator check count text, LOOKUP link-check text, category lists | Validator passes |
| P0.5 | done | Sweep system docs for magic numbers, enums, paths, exception lists | Candidate table below exists |
| P1 | done | Add purpose-split registries under `claude/config/` | JSON files exist with schema comments avoided |
| P1.5 | done | Make validator read registries and fail on drift | Registry values become executable checks |
| P2 | done | Add generated blocks for README inventory and validator check count | Marker blocks delimit generated text |
| P2.5 | done | Update authoring skills to patch registries when adding new values | `caol-make-skill` owns category registration |
| P3 | partial | Harden LLM-friendly document naming | Naming standard and taxonomy prevent vague file names |

## P0 Fixes

| Drift | Fix |
|-------|-----|
| `principles.md` hardcoded validator check count | Replace count with `node scripts/validate-llm-first.mjs --list` reference |
| `garden-review.md` says LOOKUP links are not validator-checked | State core Markdown links are validator-checked |
| Command/skill category list misses live prefixes | Add live prefixes to `author-naming.md` and `naming.md` |

## P0.5 Sweep Results

Scope: `SYSTEM.md`, `README.md`, `LOOKUP.md`, `docs/`, `claude/rules/`, `claude/standards/policy/`, `scripts/validate-llm-first.mjs`.

| Candidate | Current locations | Registry target | Notes |
|-----------|-------------------|-----------------|-------|
| Document length budgets | `llm-first-docs.md`, `principles.md`, validator constants | `claude/config/doc-budgets.json` | Includes grandfathered standard exceptions by reference |
| Frontmatter enums | `platform-adapters.md`, validator constants, rule/standard docs | `claude/config/frontmatter-schema.json` | `load`, `status`, `platforms`, `portability` |
| Category prefixes | `author-naming.md`, `naming.md`, README inventory | `claude/config/taxonomy.json` | Validator must compare live skill/command prefixes against registry |
| Standard subgroup names | `naming.md`, `garden-review.md`, `standards/index.md` | `claude/config/taxonomy.json` | Prevent stale subgroup allow-lists |
| README inventory counts | `README.md`, validator inventory logic | Generated block or validator-only calculation | Keep manual prose outside markers |
| Audit thresholds | `garden-review.md`, `behavior.md`, `obsidian.md` | `claude/config/audit-policy.json` | Includes clean days, sample sizes, context threshold, severity tiers |
| Validator check list | validator `CHECKS`, `principles.md` | Generated block or validator-owned output | Do not hardcode count in prose |
| Length exceptions | validator `STANDARD_LENGTH_GRANDFATHERED` | `claude/config/exceptions.json` | Require `reason`, `decision`, `expires` or `review-after` |
| Entry document registry | `SYSTEM.md`, validator `entries`, `platform-adapters.md` | `frontmatter-schema.json` or separate entry registry | Could be derived from `SYSTEM.md` table later |
| Deploy path ownership | `SYSTEM.md`, README setup text | `claude/config/deploy-paths.json` if it grows | Keep as doc table for now unless runtime readers need it |
| Identity mapping | `git-defaults.md`, `pr-create.md`, `shotloom.md` | Separate identity registry if generalized | Not part of first five registry files |
| Document naming strategy | `naming.md`, `author-naming.md`, plan filenames, decision filenames | `claude/config/taxonomy.json` + `naming.md` | Prevent names that hide purpose, status, or scope |

## Registry Split

| File | Owns | First validator use |
|------|------|---------------------|
| `claude/config/doc-budgets.json` | Length budgets for doc classes | `length-caps` |
| `claude/config/frontmatter-schema.json` | Frontmatter fields and allowed values | `rules-frontmatter`, `standards-status`, `platform-metadata` |
| `claude/config/taxonomy.json` | Skill/command categories and standard groups | new `taxonomy` check |
| `claude/config/audit-policy.json` | Garden/audit thresholds and severity tiers | new `audit-policy` check |
| `claude/config/exceptions.json` | Grandfathered exceptions with rationale | `length-caps` |

## Validator Contracts

| Contract | Check |
|----------|-------|
| Registry value used in docs | Markdown marker or key reference resolves |
| Live prefix appears in taxonomy | `find claude/skills claude/commands` prefix diff fails on unknown prefix |
| Exception is justified | every exception has `reason`, `decision`, and `expires` or `review-after` |
| Generated block stays current | validator compares block body to computed output |
| Registry deploy stays consistent | validator reads repo `claude/config/`; runtime skills read `~/.claude/config/` after sync |
| Document name uses approved shape | validator or audit checks reject vague names in managed doc folders |

## LLM-Friendly Naming Strategy

File names are routing metadata. A cold-start agent must infer artifact type, scope, and read timing from the path before opening the file.

| Rule | Good | Bad |
|------|------|-----|
| Name the operation, not the metaphor | `LOOKUP.md` | `MAP.md` |
| Name the policy domain | `platform-adapters.md` | `adapters.md` |
| Use purpose-first JSON names | `doc-budgets.json` | `managed-values.json` |
| Use decision ids for accepted rationale | `0001-platform-neutral-agent-system.md` | `agent-system-notes.md` |
| Keep status out of filenames | `harden-system-drift.md` with `status: active` | `harden-system-drift-active.md` |
| Keep date out except dated records | `garden-2026-05-09.md` | `policy-2026-05-09.md` |
| Keep folder context out of filename | `docs/plans/harden-system-drift.md` | `docs/plans/plan-harden-system-drift.md` |
| Use family prefixes for lifecycle siblings | `pr-create.md`, `pr-comment.md`, `pr-mutate.md` | `create.md`, `comment.md`, `mutate.md` |

Naming validation belongs in three places:

| Layer | Responsibility |
|-------|----------------|
| `claude/standards/policy/naming.md` | Human/agent-readable naming rules |
| `claude/config/taxonomy.json` | Approved categories, groups, families, and artifact shapes |
| `scripts/validate-llm-first.mjs` | Mechanical rejection of names that can be checked without judgment |

## Implemented Registries

| File | Validator check |
|------|-----------------|
| `claude/config/doc-budgets.json` | `length-caps` |
| `claude/config/frontmatter-schema.json` | `rules-frontmatter`, `standards-status`, `platform-metadata` |
| `claude/config/taxonomy.json` | `taxonomy` |
| `claude/config/exceptions.json` | `registry-integrity`, `length-caps` |
| `claude/config/audit-policy.json` | `registry-integrity` |

## Implemented Generated Blocks

| File | Marker | Validator source |
|------|--------|------------------|
| `README.md` | `generated:readme-inventory` | computed command, skill, standard, and rule inventory |
| `claude/standards/policy/principles.md` | `generated:validator-checks` | validator `CHECKS` list |

## Next Step

Implement P3 in this order:

1. Define managed doc folders that get filename validation.
2. Convert naming rules into registry-backed patterns where possible.
3. Add validator checks for pattern-constrained plan and decision filenames.
4. Decide whether command/skill verb families need a separate registry.
