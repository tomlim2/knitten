---
status: active
created: 2026-05-17
updated: 2026-05-17
owner: caol-ila
milestone: spec-lifecycle-system
briefing: ../../briefings/specs/caol-architecture-hardening.md
---

# Caol Architecture Hardening

## Purpose

Review caol-ila as an agent hub after the Obsidian and path-routing refactors, then remove architecture drift that can make future agents load stale policy, write to machine-specific paths, or treat runtime artifacts as shared source.

This spec is intentionally conservative. It records the current scan, separates accepted deploy-target paths from risky hardcoded paths, and defines small execution batches.

## Current Snapshot

| Area | Current state | Risk |
|------|---------------|------|
| Shared policy entry | `SYSTEM.md`, `AGENTS.md`, `CLAUDE.md`, and `AGENT-HUB.md` form a clear adapter stack | low |
| Agent root | `agent/` is the shared artifact root; runtime/cache paths are not tracked | low |
| Validation | `scripts/validate-llm-first.mjs` passes; path and tool-space hardening checks remain future work | medium |
| Context routing | `caol-authoring` profile exists with spec, milestone, and implementation-review pilots | low |
| Standards layer | many standards are redirect stubs with `superseded-by:` | medium |
| Skill root | `agent/skills/caol-hq/` exists without `SKILL.md`; decision: move to `tools/caol-hq` | high |
| Path indirection | Obsidian paths mostly route through config/resolver | medium |
| Plan lifecycle | `docs/plans/` has active, completed, report, and historical files in one flat bucket | medium |

## Pilot Update 2026-05-17

| Check | Result |
|-------|--------|
| Full validator | `node scripts/validate-llm-first.mjs` passes |
| `caol-authoring` | profile and route fixtures exist |
| Spec CRUD | `agent/skills/caol-manage-spec/SKILL.md` exists |
| Milestone CRUD | `agent/skills/caol-manage-milestone/SKILL.md` exists |
| Implementation review | `agent/skills/caol-review-implementation/SKILL.md` exists |
| `caol-hq` location | `agent/skills/caol-hq` present; `tools/caol-hq` absent |
| `caol-hq` manifest | `agent/skills/caol-hq/SKILL.md` absent |
| Hardcoded scan | tracked-source scan finds active path and stale-name cleanup candidates |

## Hardcoded Path Scan

Command shape used for this pass. Use tracked files only so runtime/session
logs do not dominate the result:

```bash
git ls-files -z -- \
  SYSTEM.md AGENTS.md CLAUDE.md AGENT-HUB.md agent docs scripts \
  ':(exclude)agent/skills/**/node_modules/**' \
  ':(exclude)agent/skills/**/dist/**' \
  ':(exclude)agent/skills/**/.astro/**' \
  ':(exclude)docs/plans/reports/**' \
  ':(exclude)docs/plans/active/caol-architecture-hardening.md' |
  xargs -0 rg -n "(/Users/younsoolim|/Users/deemooooooooo|/Users/john|obsidianClaudeDir|repo-paths\.json.*obsidian|MyNotes/agent|Obsidian/agent|notes/INDEX)"
```

### Allowed Patterns

| Pattern | Reason |
|---------|--------|
| `~/.claude/...` in `SYSTEM.md`, `CLAUDE.md`, `agent/config/agent-hub.json`, rules, and skills | deploy-target references are part of the current Claude adapter contract |
| `~/.codex` in hub/adapter docs | Codex deploy-target reference |
| `~/.claude/private/caol-config/*.json` | machine-specific config lookup path |
| short examples under authoring references | acceptable when clearly non-executable examples |

### Fix Candidates

| Severity | Path | Finding | Proposed fix |
|----------|------|---------|--------------|
| P1 | `agent/settings.json` | tracks `/Users/deemooooooooo/.claude/ops/**` permissions | replace with home-relative permission pattern or documented adapter-safe permission template |
| P1 | `agent/hooks/shotloom-session-start.sh` | hardcodes `/Users/deemooooooooo/Desktop/www/shotloom-github` | resolve through `~/.claude/private/caol-config/repo-paths.json` or `caol-resolve-doc-path repo shotloom` |
| P1 | `agent/hooks/shotloom-stop-reminder.sh` | hardcodes `/Users/deemooooooooo/Desktop/www/shotloom-github` | same resolver-based fix |
| P1 | `agent/skills/caol-hq/` | app directory lives under `agent/skills/` but has no `SKILL.md` | move to `tools/caol-hq` |
| P2 | `agent/commands/caol-open-dashboard.md` | assumes `~/.claude/skills/caol-hq` as dashboard app path | update to `tools/caol-hq` after move |
| P2 | `agent/commands/caol-switch-context.md` | uses stale `{obsidianClaudeDir}` placeholders | rewrite around current doc path resolver |
| P2 | `agent/skills/shotloom-deploy-web/SKILL.md` | hardcoded Shotloom checkout with resolver hint | use resolver command directly |
| P2 | `docs/import-add-prop-gltf-codex.md` | historical absolute `/Users/younsoolim/Desktop/www/shotloom` command | convert to `<shotloom-root>` or resolver instruction |
| P2 | `docs/plans/completed/import-add-prop-gltf.md` | historical absolute `/Users/younsoolim/Desktop/www/shotloom` command | convert to `<shotloom-root>` or mark historical exact path |
| P2 | `docs/plans/stage-*`, `docs/plans/engine-*`, and similar historical specs | local POC roots and worktree paths remain as exact machine evidence | decide archive allowlist vs placeholder rewrite before validator hard failure |
| P2 | `docs/plans/completed/workspace-unify-thiserror-deps.md` | historical absolute `/Users/deemooooooooo/...` worktree path | convert to placeholder or archive with explicit historical-path exception |
| P2 | `agent/private/learnings/git-subtree-split.md` | tracked learning contains absolute `/Users/deemooooooooo/...` path | convert to repo key/path placeholder unless historical exact path is intentionally preserved |
| P3 | `agent/skills/caol-hq/src/config/runtimes.json` | local PATH extension includes `/Users/younsoolim/.cargo/bin` | if `caol-hq` survives, derive from `$HOME`, `PATH`, or machine config |
| P3 | `agent/skills/caol-log-postmortem/SKILL.md` | example uses `/Users/younsoolim/Desktop/www/some-project` | replace with `<repo-root>` example |
| P3 | `agent/skills/caol-manage-config/SKILL.md` | setup output examples include user-specific paths | replace with placeholder examples |
| P3 | `agent/skills/caol-show-patterns/reference.md` | example `/Users/john/projects/data.json` | leave as example or replace with `<repo>/data.json` for consistency |

### Stale Path Patterns To Keep At Zero

These should remain absent from active executable docs:

```text
obsidianClaudeDir
repo-paths.json.*obsidian as a direct vault routing contract
MyNotes/agent
Obsidian/agent
agent/references as a live vault destination
notes/INDEX as a live catalog destination
```

## Architecture Findings

### Finding 1: Validator Is Green But Hardening Gaps Remain

`node scripts/validate-llm-first.mjs` passes. The remaining risk is coverage:
tracked user-specific absolute paths, stale Obsidian placeholders, and
first-level skill directories without `SKILL.md` are not all hard failures yet.

### Finding 2: Skill Inventory Has A Shape Blind Spot

`agent/skills/caol-hq/` is a directory under the skills root without `SKILL.md`. The tracked skill count and generated inventory can diverge because one side may count directories while another counts actual skill manifests.

The validator should fail any first-level `agent/skills/<name>/` directory that lacks `SKILL.md`, unless the directory is explicitly allowlisted as generated/runtime.

Decision: `caol-hq` is a tool app, not a skill. Move it to `tools/caol-hq` and update dashboard commands to launch from that path.

### Finding 3: Standards Redirects Need A Clear Contract

Many `agent/standards/**/*.md` files are redirect stubs with `superseded-by:`. That can be valid, but the index should distinguish:

| Type | Meaning |
|------|---------|
| active standard | loaded as policy/rubric |
| redirect stub | retained only as compatibility pointer |
| deprecated standard | not loaded unless editing history |

Without this distinction, agents can over-load stale standard files or treat skill-owned references as global policy.

### Finding 4: Context Routing Profiles Are Incomplete

Current routing profiles cover core Shotloom, Unreal, web, Obsidian, and caol
authoring work. Missing candidate profiles from prior refactors should be
reviewed before broad cleanup:

```text
shotloom-ops
cinev-art
3d-vrm
video-hyperframes
```

These profiles should be added only when they reduce default context loading. A profile is not useful if it just duplicates existing route metadata.

### Finding 5: Plan Lifecycle Is Flat

`docs/plans/` mixes proposed plans, completed migration plans, report directories, and historical notes. This makes cold-start review slower and increases the chance of editing old specs as if they were active.

Possible structure:

```text
docs/plans/
  active/
  completed/
  archive/
  reports/
```

This should be a separate migration because many docs and validators may link to current flat paths.

## Execution Plan

### Batch A: Current Validation Baseline

Status: completed before this pilot.

1. `node scripts/validate-llm-first.mjs` passes.
2. `caol-authoring` routing exists.
3. This spec update records the current scan and leaves execution batches
   focused.

### Batch B: Remove User-Specific Absolute Paths

1. Remove user-specific absolute permissions from tracked `agent/settings.json`.
2. Patch Shotloom hook scripts to resolve the repo path from config.
3. Convert active docs with `/Users/...` examples to placeholders when they are not historical records.
4. Run the hardcoded path scan and classify remaining hits.

Do not assume Claude settings permission strings expand `~` or `$HOME`. If a machine-specific permission is still needed, generate it through a local installer or keep it in a machine-local settings layer instead of tracking a user path.

### Batch C: Move `caol-hq` To Tool Space

1. Move dashboard app source from `agent/skills/caol-hq` to `tools/caol-hq`.
2. Keep generated runtime folders ignored (`node_modules`, `dist`, `.astro`).
3. Update `agent/commands/caol-open-dashboard.md` to launch from the tool path.
4. Update any hub, README, or dashboard references that assume `caol-hq` is a skill.
5. Add validator coverage for skill root shape.

### Batch D: Strengthen Validators

Add or extend checks for:

1. first-level skill directories without `SKILL.md`;
2. tracked user-specific absolute paths outside documented exceptions;
3. runtime/cache paths accidentally tracked under `agent/`;
4. standards redirect stubs listed as active standards without a compatibility marker.

### Batch E: Routing And Standards Cleanup

1. Review `context-routing.json` against actual skill frontmatter and current work domains.
2. Add only profiles that reduce context loading.
3. Mark redirect standards clearly in `standards/index.md`.
4. Prefer skill-owned references for domain-specific rubrics.

### Batch F: Plan Lifecycle Migration

1. Add a plan lifecycle spec.
2. Move completed/historical specs in one batch with link updates.
3. Add a validator or index check so active plans stay discoverable.

## Validation

Run these before reporting completion for each relevant batch:

```bash
node scripts/validate-llm-first.mjs
git diff --check
git status --short --branch
```

For path cleanup batches, also run:

```bash
git ls-files -z -- \
  SYSTEM.md AGENTS.md CLAUDE.md AGENT-HUB.md agent docs scripts \
  ':(exclude)agent/skills/**/node_modules/**' \
  ':(exclude)agent/skills/**/dist/**' \
  ':(exclude)agent/skills/**/.astro/**' \
  ':(exclude)docs/plans/reports/**' \
  ':(exclude)docs/plans/active/caol-architecture-hardening.md' |
  xargs -0 rg -n "(/Users/younsoolim|/Users/deemooooooooo|/Users/john|obsidianClaudeDir|repo-paths\.json.*obsidian|MyNotes/agent|Obsidian/agent|notes/INDEX)"
```

For shared artifact edits, verify deploy-target sync where the edited subtree is deployed:

```bash
diff -rq ~/.claude/rules agent/rules
diff -rq ~/.claude/standards agent/standards
diff -rq ~/.claude/skills agent/skills --exclude node_modules --exclude dist --exclude .astro
diff -rq ~/.claude/commands agent/commands
diff -rq ~/.claude/config agent/config
```

## Open Decisions

| Decision | Needed before |
|----------|---------------|
| Should redirect standards remain in `standards/index.md` as compatibility entries? | Batch E |
| Should historical docs be sanitized or allowlisted when they contain exact old machine paths? | Batch B validator |
| Should `docs/plans/` be migrated physically or only indexed by status first? | Batch F |
