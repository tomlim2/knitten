---
status: completed
created: 2026-05-17
updated: 2026-05-17
owner: agent-hub
milestone: spec-lifecycle-system
briefing: ../../briefings/specs/ah-architecture-hardening.md
---

# Agent Hub Architecture Hardening

## Purpose

Review agent-hub as an agent hub after the Obsidian and path-routing refactors, then remove architecture drift that can make future agents load stale policy, write to machine-specific paths, or treat runtime artifacts as shared source.

This spec is intentionally conservative. It records the current scan, separates accepted deploy-target paths from risky hardcoded paths, and defines small execution batches.

## Current Snapshot

| Area | Current state | Risk |
|------|---------------|------|
| Shared policy entry | `SYSTEM.md`, `AGENTS.md`, `CLAUDE.md`, and `AGENT-HUB.md` form a clear adapter stack | low |
| Agent root | `agent/` is the shared artifact root; runtime/cache paths are not tracked | low |
| Validation | `scripts/validate-llm-first.mjs` passes; path and tool-space hardening checks remain future work | medium |
| Context routing | `ah-authoring` profile exists with spec, milestone, and implementation-review pilots | low |
| Standards layer | many standards are redirect stubs with `superseded-by:` | medium |
| Skill root | `ah-hq` moved to `tools/ah-hq`; skill root no longer contains the tool app | low |
| Path indirection | Obsidian paths mostly route through config/resolver | medium |
| Plan lifecycle | `docs/plans/` has active, completed, report, and historical files in one flat bucket | medium |

## Pilot Update 2026-05-17

| Check | Result |
|-------|--------|
| Full validator | `node scripts/validate-llm-first.mjs` passes |
| `ah-authoring` | profile and route fixtures exist |
| Spec CRUD | `agent/skills/ah-manage-spec/SKILL.md` exists |
| Milestone CRUD | `agent/skills/ah-manage-milestone/SKILL.md` exists |
| Implementation review | `agent/skills/ah-review-implementation/SKILL.md` exists |
| `ah-hq` location | `tools/ah-hq` present; `agent/skills/ah-hq` absent |
| `ah-hq` manifest | not applicable; `ah-hq` is a tool app, not a skill |
| Hardcoded scan | Batch B patched active executable path candidates; remaining hits are this spec, historical specs, or explicit migration notes |

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
  ':(exclude)docs/plans/completed/ah-architecture-hardening.md' |
  xargs -0 rg -n "(/Users/younsoolim|/Users/deemooooooooo|/Users/john|obsidianClaudeDir|repo-paths\.json.*obsidian|MyNotes/agent|Obsidian/agent|notes/INDEX)"
```

### Allowed Patterns

| Pattern | Reason |
|---------|--------|
| `~/.claude/...` in `SYSTEM.md`, `CLAUDE.md`, `agent/config/agent-hub.json`, rules, and skills | deploy-target references are part of the current Claude adapter contract |
| `~/.codex` in hub/adapter docs | Codex deploy-target reference |
| `~/.claude/private/agent-hub-config/*.json` | machine-specific config lookup path |
| short examples under authoring references | acceptable when clearly non-executable examples |

### Fix Candidates

| Severity | Path | Finding | Proposed fix |
|----------|------|---------|--------------|
| P1 | `agent/settings.json` | tracks `/Users/deemooooooooo/.claude/ops/**` permissions | replace with home-relative permission pattern or documented adapter-safe permission template |
| P1 | `agent/hooks/shotloom-session-start.sh` | hardcodes `/Users/deemooooooooo/Desktop/www/shotloom-github` | resolve through `~/.claude/private/agent-hub-config/repo-paths.json` or `ah-resolve-doc-path repo shotloom` |
| P1 | `agent/hooks/shotloom-stop-reminder.sh` | hardcodes `/Users/deemooooooooo/Desktop/www/shotloom-github` | same resolver-based fix |
| P1 | `tools/ah-hq/` | app directory previously lived under `agent/skills/` without `SKILL.md` | moved to tool space |
| P2 | `agent/commands/ah-open-dashboard.md` | previously assumed the dashboard app lived under the skills deploy target | updated to resolve `repo agent-hub` and launch `tools/ah-hq` |
| P2 | `agent/commands/ah-switch-context.md` | uses stale `{obsidianClaudeDir}` placeholders | rewrite around current doc path resolver |
| P2 | `agent/skills/shotloom-deploy-web/SKILL.md` | hardcoded Shotloom checkout with resolver hint | use resolver command directly |
| P2 | `docs/import-add-prop-gltf-codex.md` | historical absolute `/Users/younsoolim/Desktop/www/shotloom` command | convert to `<shotloom-root>` or resolver instruction |
| P2 | `docs/plans/completed/import-add-prop-gltf.md` | historical absolute `/Users/younsoolim/Desktop/www/shotloom` command | convert to `<shotloom-root>` or mark historical exact path |
| P2 | `docs/plans/stage-*`, `docs/plans/engine-*`, and similar historical specs | local POC roots and worktree paths remain as exact machine evidence | decide archive allowlist vs placeholder rewrite before validator hard failure |
| P2 | `docs/plans/completed/workspace-unify-thiserror-deps.md` | historical absolute `/Users/deemooooooooo/...` worktree path | convert to placeholder or archive with explicit historical-path exception |
| P2 | `agent/private/learnings/git-subtree-split.md` | tracked learning contains absolute `/Users/deemooooooooo/...` path | convert to repo key/path placeholder unless historical exact path is intentionally preserved |
| P3 | `tools/ah-hq/src/config/runtimes.json` | local PATH extension previously included a user-specific cargo path | derives from `$HOME` at runtime |
| P3 | `agent/skills/ah-log-postmortem/SKILL.md` | example uses `/Users/younsoolim/Desktop/www/some-project` | replace with `<repo-root>` example |
| P3 | `agent/skills/ah-manage-config/SKILL.md` | setup output examples include user-specific paths | replace with placeholder examples |
| P3 | `agent/skills/ah-show-patterns/reference.md` | example `/Users/john/projects/data.json` | leave as example or replace with `<repo>/data.json` for consistency |

### Batch B Patch Status

| Path | Status |
|------|--------|
| `agent/settings.json` | user-specific ops permissions removed from tracked settings |
| `agent/hooks/shotloom-session-start.sh` | Shotloom repo resolves through `ah-resolve-doc-path repo shotloom` |
| `agent/hooks/shotloom-stop-reminder.sh` | Shotloom repo resolves through `ah-resolve-doc-path repo shotloom` |
| `agent/commands/ah-switch-context.md` | stale Obsidian context placeholder replaced with private config and doc resolvers |
| `agent/skills/shotloom-deploy-web/SKILL.md` | deploy preflight uses the Shotloom repo resolver |
| `tools/ah-hq/src/config/runtimes.json` | local cargo path changed to `$HOME`; runtime launcher expands `$HOME` and `~` |
| `agent/skills/ah-log-postmortem/SKILL.md` | user-specific example path replaced |
| `agent/skills/ah-manage-config/SKILL.md` | validation example paths replaced with repo-key placeholders |
| `agent/skills/ah-show-patterns/reference.md` | hardcoded example path generalized |
| `docs/import-add-prop-gltf-codex.md` | Shotloom command path changed to resolver |
| `docs/plans/completed/import-add-prop-gltf.md` | Shotloom command path changed to resolver |

Validation for this batch passed: hook shell syntax, `ah-hq` build, Obsidian
structure checks, LLM-first validator, `git diff --check`, and deploy-target
diffs for affected shared layers.

### Batch C Patch Status

| Path | Status |
|------|--------|
| `tools/ah-hq/` | dashboard app moved from `agent/skills/ah-hq/` |
| `agent/commands/ah-open-dashboard.md` | launch path now resolves `repo agent-hub` and enters `tools/ah-hq` |
| `agent/config/agent-hub.json` | tool apps registered as durable mixed git-policy runtime paths |
| `README.md`, `AGENT-HUB.md` | generated inventory counts updated |

Validation for this batch passed: `pnpm --dir tools/ah-hq build`, stale path
scan, first-level skill directory shape check, deploy-target diffs, LLM-first
validator, and `git diff --check`.

### Batch D Patch Status

| Check | Status |
|-------|--------|
| `skill-root-shape` | added; every first-level `agent/skills/<name>/` directory must contain `SKILL.md` |
| `tracked-runtime-paths` | added; runtime/cache paths under `agent/` fail if git-tracked |
| `tracked-user-paths` | added; active tracked source fails on user-specific absolute paths and retired Obsidian placeholders |
| `standards-redirects` | added; `superseded-by` requires `status: superseded` and an existing target |
| UE/CCI script examples | changed from machine-specific Windows paths to home-relative deploy-target examples |
| Generated inventories | updated validator check count and hub validator count |

Validation for this batch passed: targeted new checks, Python compile for
changed UE/CCI scripts, active hardcoded path scan, LLM-first validator, and
`git diff --check`.

### Batch E Patch Status

| Area | Status |
|------|--------|
| Context profiles | promoted `shotloom-ops`, `cinev-art`, `3d-vrm`, and `video-hyperframes` from candidates to active profiles |
| Routing axes | added `3d`, `cinev`, `shotloom`, `video`, `hyperframes`, and `ops` axis values |
| Pilot files | added one representative pilot file for each promoted profile |
| Route fixtures | added regression fixtures for Shotloom ops, CINEV art ops, VRM/PMX review, and HyperFrames composition |
| Standards index | split active standards from redirect stubs; superseded standards now point to skill-owned references |
| Route selector | added evidence terms for new route values and required explicit domain evidence for non-core domains |

Validation for this batch passed: `context-routing`, `generated-blocks`,
LLM-first validator, and `git diff --check`.

### Batch F Patch Status

| Area | Status |
|------|--------|
| Spec lifecycle contract | flat `docs/plans/<slug>.md` paths removed from CRUD and review resolvers |
| Shotloom spec wrappers | direct specs now target `docs/plans/proposed/<slug>.md`; conflict drafts target `docs/plans/drafts/` |
| Briefing docs | matching spec language now points to lifecycle paths |
| Garden review output | follow-up plans target `docs/plans/proposed/` |
| Validator | `spec-lifecycle` now rejects top-level spec markdown, unexpected lifecycle dirs, and status/folder mismatches |

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

`ah-hq` was a directory under the skills root without `SKILL.md`. The tracked skill count and generated inventory could diverge because one side may count directories while another counts actual skill manifests.

The validator should fail any first-level `agent/skills/<name>/` directory that lacks `SKILL.md`, unless the directory is explicitly allowlisted as generated/runtime.

Decision: `ah-hq` is a tool app, not a skill. It now lives at `tools/ah-hq`, and dashboard commands launch from that path.

### Finding 3: Standards Redirects Need A Clear Contract

Many `agent/standards/**/*.md` files are redirect stubs with `superseded-by:`. That can be valid, but the index should distinguish:

| Type | Meaning |
|------|---------|
| active standard | loaded as policy/rubric |
| redirect stub | retained only as compatibility pointer |
| deprecated standard | not loaded unless editing history |

Without this distinction, agents can over-load stale standard files or treat skill-owned references as global policy.

### Finding 4: Context Routing Profiles Are Incomplete

Current routing profiles cover core Shotloom, Unreal, web, Obsidian, and agent-hub
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
  proposed/
  drafts/
  parked/
  completed/
  archive/
  reports/
```

This migration is complete. New specs must use lifecycle folders.

## Execution Plan

### Batch A: Current Validation Baseline

Status: completed before this pilot.

1. `node scripts/validate-llm-first.mjs` passes.
2. `ah-authoring` routing exists.
3. This spec update records the current scan and leaves execution batches
   focused.

### Batch B: Remove User-Specific Absolute Paths

1. Remove user-specific absolute permissions from tracked `agent/settings.json`.
2. Patch Shotloom hook scripts to resolve the repo path from config.
3. Convert active docs with `/Users/...` examples to placeholders when they are not historical records.
4. Run the hardcoded path scan and classify remaining hits.

Do not assume Claude settings permission strings expand `~` or `$HOME`. If a machine-specific permission is still needed, generate it through a local installer or keep it in a machine-local settings layer instead of tracking a user path.

### Batch C: Move `ah-hq` To Tool Space

1. Move dashboard app source from `agent/skills/ah-hq` to `tools/ah-hq`.
2. Keep generated runtime folders ignored (`node_modules`, `dist`, `.astro`).
3. Update `agent/commands/ah-open-dashboard.md` to launch from the tool path.
4. Update any hub, README, or dashboard references that assume `ah-hq` is a skill.
5. Add validator coverage for skill root shape.

### Batch D: Strengthen Validators

Add or extend checks for:

Status: completed.

1. first-level skill directories without `SKILL.md`;
2. tracked user-specific absolute paths outside documented exceptions;
3. runtime/cache paths accidentally tracked under `agent/`;
4. standards redirect stubs listed as active standards without a compatibility marker.

### Batch E: Routing And Standards Cleanup

Status: completed.

1. Review `context-routing.json` against actual skill frontmatter and current work domains.
2. Add only profiles that reduce context loading.
3. Mark redirect standards clearly in `standards/index.md`.
4. Prefer skill-owned references for domain-specific rubrics.

### Batch F: Plan Lifecycle Migration

Status: completed.

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
  ':(exclude)docs/plans/completed/ah-architecture-hardening.md' |
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

| Decision | Result |
|----------|--------|
| Should redirect standards remain in `standards/index.md` as compatibility entries? | yes; redirect stubs are separated from active standards |
| Should historical docs be sanitized or allowlisted when they contain exact old machine paths? | active tracked source fails on user-specific paths; completed history and reports remain historical evidence |
| Should `docs/plans/` be migrated physically or only indexed by status first? | physically migrated into lifecycle folders |
