---
status: done
completed: 2026-05-10
load: triggered
trigger: reducing unnecessary context for routed tasks
created: 2026-05-10
standard: agent/standards/policy/llm-first-docs.md
depends_on: docs/plans/agent-hub.md
---

# Task Context Routing Plan

**status:** done. This plan added task context routing profiles, pilot metadata, synthetic route fixtures, generated hub inventory, high-cost metadata enforcement, and authoring flow prompts.

Primary risk: metadata alone does not reduce context. A routing execution contract must define who classifies the task, which metadata syntax is valid, which axes are separate, and how fallback works.

## Goal

| Problem | Target behavior |
|---------|-----------------|
| Unreal skills are visible during Rust work | Unreal inventory is discoverable, but Unreal bodies are not loaded unless the task matches Unreal |
| Route-domain-specific standards compete for context | Task classification picks the relevant route domain before loading references |
| Skill selection relies on filename intuition only | Metadata and validator checks make routing explicit |
| Agents over-read "just in case" | Entry documents load navigation, then route to the smallest matching context |

## Load Model

| Phase | Load | Must not load |
|-------|------|---------------|
| Cold start | `SYSTEM.md`, entry document, auto rules, compact indexes | Route-domain skill bodies, long standards, repo-specific references |
| Task classify | task text, repo path, user-named skill, nearby files | Full route-domain catalogs |
| Route select | matching rule/standard/skill metadata | Non-matching route-domain bodies |
| Execute | required skill body and direct references | Sibling skills with unrelated route domains |
| Escalate | broader standards only when classification is ambiguous | Whole `agent/skills` tree |

## Routing Execution Contract

| Question | Required answer before P1 |
|----------|---------------------------|
| Who routes? | Entry document gives the routing instruction; a triggered routing rule may define details; validator enforces metadata; each harness performs the read sequence with its own tools |
| What is routed? | Rule, standard, skill, command, and reference bodies; inventories remain discoverable |
| What is not routed? | `SYSTEM.md`, entry documents, auto default-counter rules, `LOOKUP.md`, and compact indexes |
| Fallback | If route confidence is low, ask a short clarification or read only the compact routing index |
| Completion test | A sample Rust/Bevy task loads no Unreal skill bodies; a sample Unreal asset task loads no Rust/Bevy standards |

The contract must become an accepted rule or standard before broad metadata rollout.

Accepted direction:

| Decision | Accepted value |
|----------|----------------|
| Compact routing index owner | `AGENT-HUB.md` generated routing block |
| Routing marker | `<!-- routing:start -->` to `<!-- routing:end -->` |
| Metadata rollout | High-cost pilot only before broad enforcement |
| Pilot set | Unreal, Rust/Bevy, Shotloom review |
| Repo key source | `repo-paths.json` keys |
| Regression model | Synthetic route fixtures with max context budget |

## Tradeoffs

| Cost | Expected impact | Control |
|------|-----------------|---------|
| Extra grep/read calls | 1-3 calls per routed task; one-time 5-10k token cost when classification needs evidence | Keep routing evidence compact and stop after a confident domain match |
| Classifier prompt cost | About 0.5-1k tokens per ambiguous task | Prefer deterministic evidence: repo path, file extension, named skill, command, frontmatter |
| Misclassification | Wrong route domain loads first, then reloads correct route domain | Pilot coverage and validator checks catch missing metadata before broad rollout |
| Metadata maintenance | New skills and standards need routing fields | Add authoring flow in P4 so routing metadata is created with the artifact |
| Over-routing | Too many route domains match and context grows again | Require explicit `context-profile` for high-cost route domains |

Routing is justified only when the avoided route-domain context is larger than the classification overhead.

## Current Baseline

| Area | State |
|------|-------|
| Entry documents | already thin |
| Auto rules | already separate from triggered rules |
| Standards | on-demand by `agent/standards/index.md` |
| Skills | loaded by harness/task match, but no repo-owned routing metadata |
| Agent hub | `agent/config/agent-hub.json` inventories layers and validators |
| Taxonomy | category prefixes exist, but prefixes are not enough for domain routing |

## P0 Inventory

| Artifact | Current load path | Likely route | Context cost | False-positive risk | Metadata needed |
|----------|-------------------|--------------|--------------|---------------------|-----------------|
| `agent/standards/unreal/unreal-engine-asset.md` | on-demand standard | `domains: unreal`, `repo-keys: anju,mega-melange`, `languages: cpp,python`, `task-types: implementation,review` | high | Rust or web work loads UE asset policy due generic asset wording | `domains`, `repo-keys`, `languages`, `task-types`, `context-profile`, `exclude-when` |
| `agent/standards/unreal/unreal-engine-cpp.md` | on-demand standard | `domains: unreal`, `repo-keys: anju,mega-melange`, `languages: cpp`, `task-types: implementation,review` | medium | Rust C++ review or generic code review loads UE-only rules | `domains`, `repo-keys`, `languages`, `task-types`, `context-profile`, `exclude-when` |
| `agent/skills/ue-analyze-material/SKILL.md` | triggered skill | `domains: unreal`, `repo-keys: anju,mega-melange`, `languages: python`, `task-types: implementation` | medium | Material or graph tasks outside UE load editor remote-exec steps | `domains`, `repo-keys`, `languages`, `task-types`, `context-profile`, `exclude-when` |
| `agent/skills/cci-codex-port-bevy/SKILL.md` | triggered skill | `domains: rust`, `repo-keys: shotloom,vrm2u-bevy`, `languages: rust`, `frameworks: bevy,wgpu`, `task-types: implementation` | medium | General Codex planning loads Bevy migration prompt | `domains`, `repo-keys`, `languages`, `frameworks`, `task-types`, `context-profile`, `exclude-when` |
| `agent/skills/dev-open-vrm-bevy/SKILL.md` | triggered skill | `domains: rust`, `repo-keys: anju,vrm2u-bevy`, `languages: rust`, `frameworks: bevy,wgpu`, `task-types: implementation` | medium | Unreal VRM or generic app-open tasks load Bevy run steps | `domains`, `repo-keys`, `languages`, `frameworks`, `task-types`, `context-profile`, `exclude-when` |
| `agent/skills/shotloom-review-before-pr/SKILL.md` | triggered skill | `domains: rust`, `repo-keys: shotloom`, `languages: rust,typescript`, `frameworks: bevy,wgpu`, `task-types: review` | high | Generic review work loads Shotloom-only review workflow | `domains`, `repo-keys`, `languages`, `frameworks`, `task-types`, `context-profile`, `exclude-when` |
| `agent/skills/shotloom-respond-pr/SKILL.md` | triggered skill | `domains: rust`, `repo-keys: shotloom`, `languages: rust,typescript`, `frameworks: bevy,wgpu`, `task-types: review` | high | Non-Shotloom PR work loads Shotloom gh workflow and comments cache flow | `domains`, `repo-keys`, `languages`, `frameworks`, `task-types`, `context-profile`, `exclude-when` |

## Non-Goals

| Non-goal | Reason |
|----------|--------|
| Hide skills from inventory | Agents still need discovery |
| Rewrite every skill in one pass | High churn; start with high-cost route domains |
| Depend on one harness feature | Routing must work for Claude Code and Codex |
| Create a semantic search system | Metadata and validator first; search can come later |
| Move skill files | Routing is metadata, not a path migration |

## Routing Vocabulary

| Term | Meaning |
|------|---------|
| task route | A metadata-backed decision that a task belongs to one or more route domains |
| route domain | Technical or knowledge area such as `unreal`, `rust`, `web`, or `obsidian` |
| repo key | Repository key from `repo-paths.json`, such as `shotloom`, `cinev-studio`, or `caol-ila` |
| task type | Work mode such as `review`, `git`, `authoring`, or `implementation` |
| context profile | Named set of route domains, repo keys, task types, languages, and artifacts allowed for a task |
| exclusion | Route domain or artifact that must not load unless explicitly requested |
| route evidence | User words, repo path, file extension, named skill, command, or frontmatter |

If these terms survive P1, add them to `docs/reference/system-glossary.md`.

## System Alignment

| Choice | Alignment |
|--------|-----------|
| `route domain` | Avoids confusing routing domains with registry `domain` fields in `agent-hub.json` |
| `repo key` | Matches `repo-paths.json` and `repo-paths-keys.md`; avoids `project`, which is also a Claude runtime folder |
| `task type` | Separates work mode from technology domain and repo identity |
| `context profile` | Names a route bundle without becoming canonical policy |
| Kebab-case metadata | Matches existing frontmatter style such as `argument-hint`; avoids camelCase in markdown frontmatter |
| Triggered routing rule | Preserves the rule that auto rules are reserved for default-counters |

## Proposed Metadata

Add routing metadata to selected `SKILL.md`, command docs, standards, and triggered rules:

```yaml
domains: unreal
repo-keys: cinev-studio
languages: cpp,python
frameworks: bevy,wgpu
task-types: implementation
context-profile: unreal-assets
exclude-when: rust,web
```

Use comma-separated scalar values unless the validator is upgraded to parse YAML arrays. P0.5 must explicitly decide the syntax before metadata rollout.

Omit optional axes when absent. Example: a general Rust skill may omit `frameworks`; absence means no framework-specific route requirement.

## Initial Routing Axes

| Axis | Values | Positive evidence |
|------|--------|-------------------|
| `domains` | `unreal`, `rust`, `web`, `obsidian` | technology, file extension, toolchain, domain terms |
| `repo-keys` | `shotloom`, `cinev-studio`, `caol-ila` | repo path, issue prefix, `repo-paths.json` key |
| `languages` | `cpp`, `python`, `rust`, `typescript`, `css` | file extension, compiler, framework |
| `frameworks` | `bevy`, `wgpu`, `astro`, `three` | framework imports, build files, repo terms |
| `task-types` | `implementation`, `review`, `git`, `authoring`, `research` | user verb, command, PR context |

Negative evidence belongs in `exclude-when` only for high-cost or high-risk artifacts. Default routing should be positive-match.

## Contracts

| Contract | Owner |
|----------|-------|
| Routing axis values | new `agent/config/context-routing.json` |
| Skill/standard routing metadata | owning artifact frontmatter |
| Context profiles | new `agent/config/context-routing.json` |
| Generated routing inventory | `AGENT-HUB.md` block from `<!-- routing:start -->` to `<!-- routing:end -->` |
| Synthetic route fixtures | new `tests/routing-fixtures.json` |
| Enforcement | `scripts/validate-llm-first.mjs` |

## Execution Order

| Tier | Status | Work | Acceptance |
|------|--------|------|------------|
| P0 | done | Inventory high-cost route-domain artifacts | Table lists route domains, repo keys, task types, and high-cost artifacts |
| P0.25 | done | Define routing execution contract | `agent/rules/task-context-routing.md` names who routes, routing markers, metadata syntax, axes, fallback, and measurable pass/fail |
| P0.5 | done | Define `context-routing.json` schema | `agent/config/context-routing.json` names axes, profiles, evidence, pilot files, fixtures, budgets, and exemptions |
| P1 | done | Add routing registry and validator skeleton | Registry parses; values are unique; profiles reference known axis values |
| P1.5 | done | Add pilot metadata to high-cost route domains | Unreal, Rust/Bevy, and Shotloom review pilot artifacts have routing metadata |
| P2 | done | Validate metadata on pilot files | Missing or unknown axis values fail validation |
| P2.5 | done | Add generated routing inventory | `AGENT-HUB.md` routing block shows profiles and pilot coverage from registry |
| P3 | done | Expand metadata to high-cost or routing-sensitive shared-layer artifacts | New high-cost skills/standards must declare routing metadata or an explicit exemption |
| P4 | done | Add authoring flow | `caol-make-skill`, `caol-make-standard`, and command authoring prompt for routing metadata |

## P3 Expansion

P3 extends routing beyond the initial Unreal/Rust/Shotloom review pilot.

| Area | Profiles |
|------|----------|
| Shotloom deploy | `shotloom-deploy` |
| Web implementation and review | `web-frontend`, `web-review` |
| Obsidian vault work | `obsidian-vault` |

`agent/config/context-routing.json` now owns high-cost thresholds for skills and standards. A high-cost skill or standard must declare routing metadata and appear in the generated inventory, or it must have a `metadataExemptions` entry with reason, decision, and review date.

## P4 Authoring Flow

New command, skill, and standard authoring flows now read `agent/config/context-routing.json` before writing route-domain artifacts. Domain-specific or repo-specific artifacts should add `context-profile` metadata immediately; high-cost artifacts must add routing metadata or an explicit `metadataExemptions` entry. The validator checks that the authoring entry documents keep this prompt path.

## P0 Inventory Columns

| Column | Meaning |
|--------|---------|
| artifact | skill, standard, rule, command, or reference |
| current load path | auto, triggered, on-demand, command, harness task match |
| likely route | proposed domains, repo-keys, languages, frameworks, and task-types |
| context cost | low, medium, high |
| false-positive risk | when this artifact gets loaded for the wrong task |
| metadata needed | `domains`, `repo-keys`, `languages`, `frameworks`, `task-types`, `exclude-when`, or exemption |

## Validator Requirements

| Check | Behavior |
|-------|----------|
| routing registry | all axis values and profiles unique |
| repo key validation | `repo-keys` values must exist in `repo-paths.json` keys |
| metadata field pairing | `domains`, `repo-keys`, `languages`, `frameworks`, and `task-types` cannot reference unknown values |
| pilot coverage | selected high-cost pilot files must include routing metadata |
| exclusion sanity | `exclude-when` cannot include the same value as `domains` |
| generated inventory | routing inventory block matches registry |
| synthetic route dry-run | each fixture matches `must-load`, `must-not-load`, and max budget |

## Synthetic Route Fixtures

Store fixtures in `tests/routing-fixtures.json`:

```json
[
  {
    "task": "Rust Bevy ECS in shotloom",
    "mustLoad": ["shotloom", "rust"],
    "mustNotLoad": ["unreal-engine-cpp", "obsidian"],
    "maxBytes": 25000
  }
]
```

`maxBytes` is required. It protects the context budget from creeping up as metadata expands.

## Success Criteria

| Scenario | Measurable expected load |
|----------|--------------------------|
| Rust/Bevy task in shotloom | zero Unreal skill bodies; Rust, Shotloom, relevant review or git only |
| Unreal asset task in CINEV | zero Rust/Bevy standards unless explicitly requested |
| Obsidian note cleanup | zero source-code implementation skills |
| Generic git request | git rules only unless repo-specific rule applies |
| Ambiguous task | clarification or compact routing index before any route-domain body |
