---
status: active
created: 2026-05-14
updated: 2026-05-17
load: triggered
trigger: migrating agent-hub to skill-oriented context loading
repo: agent-hub
standard: agent/standards/policy/llm-first-docs.md
depends_on: docs/plans/completed/task-context-routing.md
---

# Skill-Oriented Context Loading

**status:** partially implemented. Routing metadata exists, context manifest
schema is documented, validator enforcement covers pilot skills, and entry
documents now import bootstrap rules only. Full high-cost rollout remains open.

## Cold-Start Summary

Move task-specific context loading from entry documents into skill-declared
context manifests.

Keep rules and standards as shared source files. Do not inline shared policy
into skills. Each skill declares the rules, standards, repo docs, and reference
files it needs before its workflow steps run.

Keep a small bootstrap layer for safety, canonical routing, skill discovery,
and verification discipline. Move repo-specific, review-specific,
implementation-specific, and documentation-specific material behind the skill
that uses it.

## Current State

Verified in the configured `agent-hub` repo on 2026-05-14.

| Surface | Current state | Evidence |
|---|---|---|
| Shared load model | `SYSTEM.md` defines auto rules, triggered rules, standards, and skills as separate layers | `SYSTEM.md` |
| Codex entry | `AGENTS.md` tells Codex to read `SYSTEM.md`, then `agent/rules/index.md`, then every auto rule | `AGENTS.md` |
| Claude entry | `CLAUDE.md` imports `SYSTEM.md`, `rules/index.md`, and seven bootstrap auto rules; standards are read on demand | `CLAUDE.md` |
| Rules index | `agent/rules/index.md` separates auto rules from triggered rules | `agent/rules/index.md` |
| Standards index | `agent/standards/index.md` is a discoverable index for on-demand standards | `agent/standards/index.md` |
| Routing plan | `docs/plans/completed/task-context-routing.md` already defines route-domain metadata and high-cost artifact routing | `docs/plans/completed/task-context-routing.md` |
| Skill dependency style | Skills reference rules and standards in workflow prose, not a uniform machine-readable context manifest | `agent/skills/*/SKILL.md` |

## Problem

| Problem | Consequence |
|---|---|
| Entry documents still import shared indexes and auto rules directly | Cold-start cost grows as the shared system grows |
| Skill dependencies are prose-only | Validators cannot prove that a skill declares every rule or standard it requires |
| Commands and skills mix routing, procedure, and context ownership | The system has no single place to ask which context belongs to a workflow |
| Review and Shotloom workflows load broad guidance by convention | A cold-start agent can miss a needed standard or load unrelated standards |
| Current routing metadata and skill workflow context are separate mechanisms | Context routing reduces discovery cost, but does not yet define required reads per skill |

## Locked Decisions

| Decision | Rule |
|---|---|
| Keep a bootstrap layer | Entry documents keep only safety, skill discovery, canonical routing, and verification rules |
| Skills own task context | A skill declares its required rules, standards, repo docs, and references in frontmatter |
| Rules and standards stay canonical | Skills link shared files; skills do not duplicate rule or standard bodies |
| Commands stay thin | A command invokes a skill or small workflow; it does not own long context policy |
| Validators enforce declarations | A validator rejects undeclared `rules/` and `standards/` body references inside skills |
| Pilot Shotloom first | Convert Shotloom skills before broad rollout because they use heavy review, PR, docs, and repo context |

## Bootstrap Set

| Keep In Bootstrap | Reason |
|---|---|
| `SYSTEM.md` | Repository charter and layer definitions |
| Skill discovery and invocation rule | The agent must know how to select and read skills |
| Destructive-action, secret, push, and PR-create safety | Safety gates must exist before skill selection |
| Canonical-first routing | The agent must find canonical files before loading task detail |
| Verification-before-report discipline | The agent must prove work before reporting completion |

| Move Behind Skills | Owning skill examples |
|---|---|
| Repo-specific rules | `shotloom-*`, `cci-*`, `ue-*` |
| PR mutation and PR comment rules | `shotloom-make-pr`, `shotloom-respond-pr`, `shotloom-watch-pr` |
| Code-writing and test-writing rules | implementation skills |
| Documentation-writing rules and docs standards | doc, plan, review, and authoring skills |
| Review rubrics | `shotloom-review-code`, `shotloom-review-docs`, `shotloom-review-before-pr` |
| Platform standards | Unreal, Bevy, web, Obsidian, document, and presentation skills |

## Skill Context Frontmatter

Add context manifest fields to task-owning skills. Use flat comma-separated
fields because Claude skill frontmatter already reserves `context: fork` for
subagent execution:

```yaml
context-rules: rules/shotloom.md,rules/pr-create.md
context-standards: standards/policy/llm-first-docs.md
context-repo-docs: repo:docs/guidelines/pr-guideline.md
context-references: references/review-checklist.md
```

| Field | Meaning |
|---|---|
| `context-rules` | Rule paths under `agent/rules/` |
| `context-standards` | Standard paths under `agent/standards/` |
| `context-repo-docs` | Current-repo paths with `repo:` prefix |
| `context-references` | Skill-local reference paths relative to the skill directory |

Skill execution contract:

1. Read the skill body.
2. Read every declared `context-*` path before workflow step 1.
3. If a declared path is missing, stop and report the missing path.
4. If the skill body names a `rules/` or `standards/` path not declared in
   `context-rules` or `context-standards`, fix the manifest before using the skill.

## Implementation Plan

| Phase | Work | Acceptance |
|---|---|---|
| S0 Baseline | Record current `CLAUDE.md` imports, entry-document line counts, auto-rule line counts, and skill references to `rules/` or `standards/` | Baseline file lists imports, counts, and undeclared references |
| S1 Schema | Define the context manifest schema in the skill authoring standard | done: `ah-make-skill` documents flat `context-*` fields |
| S2 Validator | Add validator checks for missing context paths, undeclared rule references, undeclared standard references, and invalid `repo:` paths | done for pilot skills in `context-routing.json` |
| S3 Shotloom Pilot | Add context manifests to `shotloom-*` skills and route Shotloom PR, review, docs, code, and test rules through those manifests | Shotloom skills load required context from frontmatter, not workflow prose |
| S4 Bootstrap Trim | Remove direct imports from entry documents after Shotloom pilot validation passes | done: entry documents load bootstrap rules only; skill manifests load task detail |
| S5 Rollout | Convert remaining high-cost skill families by domain: UE, CCI, web review, Obsidian, documents, presentations | High-cost skills have context manifests or explicit validator exemptions |
| S6 Cleanup | Delete obsolete prose-only dependency instructions after manifest enforcement passes | No skill body contains an undeclared `rules/` or `standards/` path |

## Validator Requirements

| Check | Behavior |
|---|---|
| Missing path | Fail when any `context-*` path does not exist |
| Undeclared rule reference | Fail when a pilot `SKILL.md` body mentions `rules/` and the path is absent from `context-rules` |
| Undeclared standard reference | Fail when a pilot `SKILL.md` body mentions `standards/` and the path is absent from `context-standards` |
| Bad repo path | Fail when `repo:` path does not exist in the active repo during repo-scoped validation |
| Entry budget | done: fail when entry documents import non-bootstrap rule bodies or standards bodies |
| Exemption | Allow a high-cost skill without context only when `agent/config/context-routing.json` names the exemption, reason, and review date |

## Validation Commands

Run these during S0 and after each phase:

```bash
rg -n "@~/.claude/rules|@~/.claude/standards" CLAUDE.md
rg -n "rules/|standards/" agent/skills/*/SKILL.md
rg -n "^context-(rules|standards|repo-docs|references):" agent/skills/*/SKILL.md
git diff --check
```

Add a validator command in S2, then make it part of the standard validation set.

## Risks

| Risk | Control |
|---|---|
| Missing context declaration | Validator rejects undeclared references and missing paths |
| Skill not selected for a task | Bootstrap retains skill discovery, canonical routing, and task-context routing |
| Claude and Codex entry drift | Update `CLAUDE.md`, `AGENTS.md`, and `SYSTEM.md` in the same phase |
| Manifest grows too large | Store path lists only; keep long policy in rules and standards |
| Premature bootstrap trim | Trim entry imports only after Shotloom pilot and validator pass |

## Exit Criteria

| Criterion | Evidence |
|---|---|
| Entry documents load bootstrap only | `CLAUDE.md` and `AGENTS.md` contain no direct standards-body imports |
| Auto rules stay minimal | Auto-rule list contains only bootstrap safety, discovery, routing, and verification rules |
| Shotloom pilot converted | Every `shotloom-*` skill has a `context` manifest or explicit exemption |
| Validator enforces manifests | Pilot missing-path and undeclared-reference cases fail |
| Skill bodies stop owning dependency prose | `rg` finds no undeclared `rules/` or `standards/` references in skill bodies |

## Implementation Notes

| Date | Change | Evidence |
|---|---|---|
| 2026-05-17 | Added flat `context-rules`, `context-standards`, `context-repo-docs`, and `context-references` manifest contract | `agent/skills/ah-make-skill/SKILL.md` |
| 2026-05-17 | Added pilot-skill validator checks for missing manifest paths and undeclared rule/standard body references | `scripts/validate-llm-first.mjs` |
| 2026-05-17 | Added manifests to pilot skills that already mention shared rules or standards | `agent/config/context-routing.json` pilot files |
| 2026-05-17 | Trimmed Claude entry standards import and added entry-budget enforcement | `CLAUDE.md`, `scripts/validate-llm-first.mjs` |
| 2026-05-17 | Added authoring CRUD manifests for spec and milestone management | `agent/skills/ah-manage-spec/SKILL.md`, `agent/skills/ah-manage-milestone/SKILL.md` |

## Open Questions

| Question | Decision Needed |
|---|---|
| `verify-before-report.md` placement | Keep as bootstrap rule or merge into a smaller bootstrap verification clause |
| `canonical-first.md` placement | Keep as bootstrap rule or merge into skill discovery and routing text |
| Manifest home | Use only skill frontmatter or add reusable manifests under `agent/context/` |
| Repo-doc validation | Validate `repo:` paths only when the active repo is available, or require declared repo keys for every repo path |
