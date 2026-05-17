---
status: implemented-validation-blocked
created: 2026-05-16
updated: 2026-05-16
owner: caol-ila
---

# Remove Claude Terms From Shared Layers

## Purpose

Remove Claude-specific wording from caol-ila shared layers now that caol-ila is an agent hub.

Keep Claude-specific terms only when the file describes the Claude Code harness, the `CLAUDE.md` entry document, or the `~/.claude/` deploy target.

## Scope

Edit current shared-layer documentation and metadata:

| In scope | Examples |
|----------|----------|
| root docs | `SYSTEM.md`, `README.md`, `LOOKUP.md`, `AGENT-HUB.md` |
| shared-layer docs | `agent/rules/*.md`, `agent/standards/**/*.md`, `agent/skills/*/SKILL.md`, `agent/commands/*.md` |
| skill references | `agent/skills/*/references/*.md`, `reference.md` when current and not archival |
| manifests / validators | `agent/config/*.json`, `scripts/validate-llm-first.mjs` only when they enforce stale wording |
| active plans | `docs/plans/active/*.md` when the plan describes current agent-hub behavior |

Do not edit archival, generated, or code-only hits unless they control current routing or validation.

## Problem

caol-ila currently contains shared rules, standards, skills, commands, plans, and lookup docs that still describe themselves as Claude-specific.

That wording is wrong when Codex, Claude Code, and future harnesses read the same shared layer.

## Target State

| Surface | Target wording |
|---------|----------------|
| Shared policy | `agent`, `harness`, `entry document`, `shared layer`, `deploy target` |
| Shared skills | `skill`, `agent skill`, or `caol-ila skill` |
| Shared commands | `command` or `slash command`; use `Claude Code command` only for Claude runtime mechanics |
| Runtime path | `~/.claude/` only when the runtime path is literally the Claude deploy target |
| Entry file | `CLAUDE.md` only when referring to that filename or Claude Code adapter behavior |
| Historical decisions | Preserve factual product/harness names when the decision is about that harness |

## Keep List

Do not remove `Claude` from these cases:

| Case | Example |
|------|---------|
| Filename | `CLAUDE.md`, `agent/CLAUDE.md` |
| Harness name | `Claude Code` |
| Runtime path | `~/.claude/skills/`, `~/.claude/private/caol-config/` |
| Adapter behavior | Claude `@` imports, Claude slash command details |
| Third-party docs | Links to Claude Code skill docs |
| Historical issue names | Existing issue titles or references that explicitly name Claude |

## Replace List

| Current | Replace with |
|---------|--------------|
| `Claude skill` | `skill` or `agent skill` |
| `Claude Code skills` | `skills` unless the sentence describes Claude Code runtime behavior |
| `Claude Code commands` | `commands` unless the sentence describes slash command runtime behavior |
| `Claude-driven workflow` | `agent-driven workflow` |
| `Claude reads` | `the harness reads` or `the agent reads` |
| `Claude sees` | `the agent sees` |
| `Claude-only` | `harness-specific` unless the artifact is actually Claude-only |
| `Claude-side` | `harness-side` or `Claude deploy-target` based on scope |
| `Claude folder` | `deploy target` or `~/.claude/` based on scope |

## Search Plan

Run narrow searches before editing:

```bash
rg -n "\bClaude\b|CLAUDE|~/.claude|claude" \
  SYSTEM.md AGENTS.md CLAUDE.md README.md LOOKUP.md AGENT-HUB.md agent docs scripts \
  --glob '!agent/projects/**' \
  --glob '!agent/file-history/**' \
  --glob '!agent/cache/**' \
  --glob '!**/node_modules/**'
```

Classify each hit:

| Class | Action |
|-------|--------|
| required runtime | keep |
| required filename | keep |
| harness-specific adapter | keep or clarify as Claude Code |
| shared-layer wording | replace |
| stale skill/command wording | replace |
| generated block | update generator or canonical registry first |
| archival note | leave unless it describes current shared-layer routing |
| code identifier | leave unless it is a user-facing key or validator rule |

## Implementation Plan

### S0 — Preflight

1. Check worktree status.
2. If unrelated untracked artifacts exist, either:
   - commit or remove them before final validation, or
   - record that validator failures are unrelated to this task.
3. Run the search plan and count hits by class.
4. Do not patch generated blocks directly unless the generator has no canonical owner.

### S1 — Inventory

1. Run the search plan.
2. Save counts by top-level area:
   - root docs
   - `agent/rules`
   - `agent/standards`
   - `agent/skills`
   - `agent/commands`
   - `docs`
   - `scripts`
3. Identify generated blocks before patching.

### S2 — Root And Policy Docs

Patch root and policy documents first:

| File | Rule |
|------|------|
| `SYSTEM.md` | Keep explicit Claude Code harness rows; neutralize shared-layer prose. |
| `AGENTS.md` | Keep Codex adapter wording. |
| `CLAUDE.md` | Keep Claude Code adapter wording. |
| `README.md` | Describe caol-ila as agent hub, not Claude-only repository. |
| `LOOKUP.md` | Use neutral goal-to-doc labels. |
| `AGENT-HUB.md` | Keep harness names in manifest views; neutralize shared-layer summaries. |

### S3 — Skills And Commands

Patch shared authoring and lifecycle skills:

| Pattern | Action |
|---------|--------|
| `Claude Code skill` in creation guidance | Replace with `skill` unless the sentence describes Claude runtime fields. |
| `Claude reads` in loading lifecycle | Replace with `the harness reads`. |
| `~/.claude/...` path references | Keep when the file is documenting deploy target behavior; otherwise use `agent/...` canonical paths. |
| slash command mechanics | Keep `Claude Code` when the behavior is specific to Claude command runtime. |
| `CLAUDE_SESSION_ID`, `CLAUDE_SKILL_DIR`, `CLAUDE_CODE_USE_POWERSHELL_TOOL` | Keep; these are Claude Code runtime variables. |
| skill names containing `claude` | Do not rename without a separate decision; update descriptions only if they claim shared ownership incorrectly. |

### S4 — Rules And Standards

Patch shared rules and standards:

| Group | Action |
|-------|--------|
| policy | Keep harness names only in adapter tables and platform mechanics. |
| authoring | Rename prose from Claude-specific to shared artifacts. |
| task context routing | Use `harness`, `agent`, `shared layer`, `deploy target`. |
| naming | Keep `CLAUDE.md` as filename; replace broad Claude wording. |

### S5 — Plans And Historical Docs

Patch active or current plans.

Do not rewrite historical decisions unless the wording incorrectly describes current shared-layer ownership.

### S6 — Residual Classification

Create a short residual summary after patching:

| Bucket | Expected examples |
|--------|-------------------|
| keep: entry document | `CLAUDE.md` |
| keep: deploy target | `~/.claude/...` |
| keep: Claude Code mechanic | `@~/.claude/...`, `$ARGUMENTS`, `${CLAUDE_SKILL_DIR}` |
| keep: adapter manifest | `agent/config/agent-hub.json` rows for `claude-code` |
| keep: historical | decisions and briefings that record past Claude-specific work |
| fix | shared-layer prose that still says Claude when it means agent or harness |

## Validation

Run:

```bash
node scripts/validate-llm-first.mjs
```

Then run targeted residual searches:

```bash
rg -n "\bClaude\b|CLAUDE|~/.claude|claude" \
  SYSTEM.md AGENTS.md CLAUDE.md README.md LOOKUP.md AGENT-HUB.md agent docs scripts \
  --glob '!agent/projects/**' \
  --glob '!agent/file-history/**' \
  --glob '!agent/cache/**' \
  --glob '!**/node_modules/**'
```

Residual hits must be classified in one of:

| Residual class | Allowed |
|----------------|---------|
| filename | yes |
| runtime path | yes |
| harness adapter | yes |
| third-party doc link | yes |
| historical factual reference | yes |
| code/runtime variable | yes |
| shared-layer generic wording | no |

## Completion Criteria

- Shared-layer docs no longer describe caol-ila as Claude-only.
- Claude-specific terms remain only where they identify Claude Code, `CLAUDE.md`, or `~/.claude/`.
- Canonical source paths prefer `agent/...` in repo-owned docs.
- Deploy target paths keep `~/.claude/...` only when runtime behavior requires them.
- Residual search hits have an explicit allowed class.
- Validator passes.

## Execution Notes

2026-05-16 execution neutralized current shared-layer wording across entry documents, rules, standards, skills, commands, templates, and repo-path metadata.

Targeted residual search now returns only:

| Bucket | Residual |
|--------|----------|
| historical | `docs/plans/completed/migrate-to-llm-first.md` describes the completed move away from a Claude-only instruction folder |
| this spec | replacement table and completion criteria intentionally contain stale terms |

Validator status:

| Check | Result |
|-------|--------|
| `node scripts/validate-llm-first.mjs` | blocked by unrelated untracked `agent/skills/caol-serve-skills/`, which makes README inventory count `137` vs actual `138` |

Do not update README inventory for this task unless `agent/skills/caol-serve-skills/` is intentionally added or removed.

## Non-Goals

| Non-goal | Reason |
|----------|--------|
| Rename `claude-*` skill directories | Skill names are user-facing API; rename needs compatibility plan. |
| Rename runtime env vars | Claude Code defines variables such as `${CLAUDE_SKILL_DIR}`. |
| Rewrite archived briefings | They record what happened in earlier sessions. |
| Rewrite code identifiers | This task targets docs, skills, rules, standards, commands, paths, and user-facing metadata. |
| Remove `~/.claude` from runtime instructions | The Claude Code harness still reads that deploy target. |

## Deferred Decisions

| Decision | Reason |
|----------|--------|
| Rename `CLAUDE.md` | Not in scope; filename is the Claude Code adapter entry document. |
| Rename `~/.claude` deploy target | Not in scope; it is the current Claude Code runtime path. |
| Rename Claude-specific commands | Decide after wording cleanup shows actual command ownership. |
| Rewrite historical ADRs | Decide only if current docs still route agents through stale wording. |
