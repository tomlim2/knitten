---
status: active
created: 2026-05-17
updated: 2026-05-17
owner: agent-hub
milestone: knitten-rename
---

# Rename Legacy Identity To agent-hub

## Purpose

Rename the internal identity of the agent hub to `agent-hub` without
breaking existing paths, commands, skills, config, or deployed harness behavior.

## Decision

The internal name going forward is `agent-hub`.

Use:

| Form | Use |
|------|-----|
| `agent-hub` | prose, titles, product/internal identity |
| `agent-hub` | slugs, paths, package names, repo aliases, machine-readable ids |
| `caol-ila` | legacy repo/path/config key during compatibility period only |
| `caol-*` | legacy command and skill namespace until a separate prefix migration |

## Problem

Legacy `caol-ila` is not just a display name. It appears in runtime paths, repo keys,
docs, validators, Obsidian folders, skill names, command names, package names,
and machine-local config. A direct global replacement would break live workflows.

Current examples include:

| Surface | Example | Risk |
|---------|---------|------|
| Repo path | `/path/to/caol-ila` | symlinks and deploy target checks may break |
| Shared policy | active docs describe agent-hub while retaining `caol-ila` only as legacy compatibility | cold-start identity drift |
| Config | `agent/private/caol-config` | resolver and setup scripts may fail if renamed too early |
| Repo key | `caol-ila` in routing/config references | path lookup and context routing may fail |
| Commands/skills | `caol-*` | slash-command compatibility and user muscle memory |
| Obsidian | `projects/caol-ila` | vault links and project doc routing |
| Dashboard | `caol-hq` | package/app naming and command path |
| Frontmatter | `owner: caol-ila` | schema and lifecycle docs may need aliasing |
| Vendor paths | `agent-hub/vendor/...` already appears in authoring rules | partial rename already exists |
| Legacy Discord bridge | old `agent-hub` bridge, if present | retired; do not preserve for compatibility |

## Goals

1. Establish `agent-hub` as the internal name in durable docs.
2. Keep all runtime paths working during the rename.
3. Classify every remaining `caol-ila`, `caol`, and `caol-config` reference.
4. Define which surfaces rename now, alias now, or defer.
5. Add validation so future references do not drift back unclassified.
6. Preserve command and skill compatibility while deciding whether `caol-*`
   should remain as a legacy namespace.
7. Plan Obsidian project-folder migration separately and resolver-first.
8. Treat any old `agent-hub` Discord bridge as retired and removable.

## Non-Goals

1. Do not rename the local checkout directory in this spec.
2. Do not rename `agent/`.
3. Do not rename deploy targets such as `~/.claude`.
4. Do not rename all `caol-*` commands and skills in this pass.
5. Do not rename `caol-config` until every resolver and setup script supports an
   alias.
6. Do not rewrite historical plans or reports unless they affect active
   behavior.

## Legacy Discord Bridge Decision

The old `agent-hub` name may have been used for a Discord bridge. Discord is no
longer part of the intended workflow. That bridge does not need compatibility
preservation.

If a local `agent-hub` Discord bridge directory, service config, process launcher,
or secret template is found during inventory:

1. classify it as `retired-discord-bridge`;
2. confirm it is not referenced by active launcher/config files;
3. delete or archive it instead of aliasing it;
4. do not let it block reuse of the `agent-hub` name for the agent hub.

Batch A check found no active old Discord bridge references. The only active
source hit is this decision text.

## Rename Policy

### Rename Now

| Surface | Action |
|---------|--------|
| New prose identity | use `agent-hub` |
| New milestone/spec docs | use `agent-hub` title and `agent-hub` slug |
| Glossary | add `agent-hub` as the internal hub name |
| Future vendor path references | use `agent-hub/vendor/...` |

### Alias First

| Surface | Action |
|---------|--------|
| Repo key | add `agent-hub` alias while preserving `caol-ila` |
| Machine config | preserve `caol-config`; optionally add `agent-hub-config` alias later |
| Obsidian project path | migrate through resolver-backed plan, not raw rename |
| Dashboard app | decide whether `tools/caol-hq` becomes `tools/agent-hub-hq` |
| Frontmatter owner | use `owner: agent-hub`; keep old `owner: caol-ila` only in historical docs |

### Defer

| Surface | Reason |
|---------|--------|
| Filesystem checkout directory | breaks symlinks and local scripts without alias plan |
| `caol-*` command/skill prefix | large user-facing compatibility surface |
| Historical reports | should remain factual unless active docs depend on them |
| Existing commit messages | immutable history |

## Compatibility Contract

1. `agent-hub` is the preferred identity.
2. `caol-ila` remains a legacy compatibility identifier until explicitly retired.
3. Active docs must explain any remaining `caol-ila` reference.
4. Machine-local paths must be resolved from config, never guessed.
5. Rename batches must preserve deploy-target sync.
6. Command and skill names are API-like surfaces and require deprecation windows.

## Inventory Plan

Run an inventory before any implementation batch:

```bash
rg -n "\b(caol-ila|caol ila|Caol Ila|caol-config|caol-hq|caol-[a-z0-9-]+)\b|agent-hub|agent-hub" \
  SYSTEM.md AGENTS.md CLAUDE.md AGENT-HUB.md README.md agent docs scripts \
  -g '!agent/skills/**/node_modules/**' \
  -g '!agent/skills/**/dist/**' \
  -g '!agent/skills/**/.astro/**' \
  -g '!docs/plans/reports/**'
```

Classify each hit:

| Class | Meaning | Action |
|-------|---------|--------|
| identity | display/internal name | rename to `agent-hub` |
| slug/id | machine-readable repo or project id | alias first |
| command-api | `caol-*` user-facing command/skill | defer or wrap |
| config-path | `caol-config` path | preserve until alias exists |
| historical | old report, old plan, or immutable context | leave with reason |
| machine-path | local absolute path or symlink target | resolve via config |
| vendor | upstream wrapper path | prefer `agent-hub/vendor` |
| retired-discord-bridge | old Discord bridge using the `agent-hub` name | delete or archive after confirming no active references |

## Execution Plan

### Batch A: Contract And Inventory

Status: completed.

1. Land this spec and the `agent-hub Rename` milestone.
2. Add `agent-hub` to the system glossary.
3. Run the inventory command.
4. Produce an inventory table or report grouped by class.
5. Confirm whether any old Discord bridge files remain.
6. Do not rename runtime paths in this batch.

Result: inventory report exists at
`docs/plans/reports/rename-caol-ila-to-agent-hub/inventory-2026-05-17.md`.
No active old Discord bridge references were found.

### Batch B: Human-Facing Identity

Status: completed for root identity surfaces.

1. Update README, milestone docs, and active architecture docs to introduce
   `agent-hub` as the internal hub name.
2. Keep compatibility notes where `caol-ila` remains.
3. Avoid touching historical report directories.
4. Run validator and path inventory.

Result: `README.md`, `SYSTEM.md`, `AGENT-HUB.md`, and
`caol-setup-harness` now introduce agent-hub as the hub identity while preserving
`caol-ila` as the compatibility repo/path key.

### Batch C: Config Aliases

Status: completed for repo key aliasing.

1. Add `agent-hub` as a repo alias without removing `caol-ila`.
2. Patch `agent/skills/caol-manage-config/repo-paths.template.json` so new
   machine setup can create both keys.
3. Patch the local deployed `repo-paths.json` only when it is symlinked or
   otherwise intentionally shared with `agent/private/caol-config/`.
   - Back up the file before editing.
   - Do not stage or commit `agent/private/caol-config/repo-paths.json`;
     it is machine-local by policy.
   - Run `git status --short` after editing and confirm the local config stays
     untracked or ignored.
4. Decide the resolver behavior explicitly:
   - If `agent-hub` is a real key in `repo-paths.json`, no resolver alias table is
     needed.
   - If `agent-hub` is not a real key, add resolver alias logic and validator
     coverage in the same batch.
5. Add tracked template or fixture validation that proves new machine setup
   supports both keys without requiring machine-local config.
6. Run local smoke validation only when `~/.claude/private/caol-config/repo-paths.json`
   exists on the machine:

```bash
bash agent/skills/caol-resolve-doc-path/resolve.sh repo caol-ila
bash agent/skills/caol-resolve-doc-path/resolve.sh repo agent-hub
```

7. Keep `caol-ila` as a legacy compatibility key until all skills resolve the
   alias.
8. Do not rename `caol-config` yet.

Result: `agent-hub` is now a tracked repo-key alias in the setup template and
context routing profiles while `caol-ila` remains compatible. The validator
requires the alias when the compatibility key exists, and a routing fixture
proves agent-hub authoring selects the `caol-authoring` context. This machine's
ignored `repo-paths.json` was backed up before adding the local alias; resolver
smoke returned the same checkout path for both keys.

### Batch D: Tool And Dashboard Naming

1. Decide whether `caol-hq` becomes `agent-hub-hq`.
2. If yes, rename `tools/caol-hq` to `tools/agent-hub-hq` and keep launcher
   compatibility for the old command/path during transition.
3. If no, document `caol-hq` as a legacy tool name.

### Batch E: Obsidian Migration

1. Write or update an Obsidian migration spec for
   `projects/caol-ila` -> `projects/agent-hub`.
2. Route all moves through `caol-resolve-doc-path` and vault structure config.
3. Update backlinks and project tags.
4. Validate with Obsidian format checks.

### Batch F: Command And Skill Prefix Decision

1. Decide whether `caol-*` remains as a legacy namespace or moves to
   `agent-hub-*`.
2. If moving, create wrappers or aliases before deleting old names.
3. Update taxonomy and generated indexes.
4. Provide a deprecation window.

### Batch G: Validator Hardening

1. Add a validator check for unclassified `caol-ila` identity references in
   active docs.
2. Allow compatibility and historical exceptions.
3. Add checks for `agent-hub` repo alias when config aliasing lands.

## Validation

Base validation:

```bash
node scripts/validate-llm-first.mjs
git diff --check
git status --short --branch
```

Rename inventory validation:

```bash
rg -n "\b(caol-ila|caol ila|Caol Ila|caol-config|caol-hq|caol-[a-z0-9-]+)\b|agent-hub|agent-hub" \
  SYSTEM.md AGENTS.md CLAUDE.md AGENT-HUB.md README.md agent docs scripts \
  -g '!agent/skills/**/node_modules/**' \
  -g '!agent/skills/**/dist/**' \
  -g '!agent/skills/**/.astro/**' \
  -g '!docs/plans/reports/**'
```

Deploy sync validation for shared artifacts:

```bash
diff -rq ~/.claude/rules agent/rules
diff -rq ~/.claude/standards agent/standards
diff -rq ~/.claude/skills agent/skills --exclude node_modules --exclude dist --exclude .astro
diff -rq ~/.claude/commands agent/commands
diff -rq ~/.claude/config agent/config
```

If the validator is already red because of unrelated pre-existing violations,
report the exact blocker and still run `git diff --check`.

## Risks

| Risk | Mitigation |
|------|------------|
| Path lookup breaks | alias before rename; resolve from config |
| Commands disappear | keep `caol-*` until wrappers exist |
| Docs become inconsistent | inventory and classify every active reference |
| Historical records get rewritten incorrectly | exclude reports/history unless active behavior depends on them |
| Old Discord bridge conflicts with the new name | classify as retired and delete/archive instead of aliasing |
| Obsidian links break | migrate through resolver-backed plan |
| Validator becomes too strict too early | start with inventory, then enforce only active-doc identity references |

## Acceptance Criteria

1. `agent-hub` is documented as the internal name.
2. `docs/milestones/agent-hub-rename.md` tracks the rename work.
3. Every active `caol-ila` identity reference is renamed or classified.
4. Every remaining compatibility reference has a reason.
5. Existing `caol-*` commands and skills still work.
6. Config path lookup still works.
7. Obsidian rename is separately planned before execution.
8. Full validator passes or reports only unrelated pre-existing blockers.

## Open Decisions

| Decision | Default |
|----------|---------|
| Rename local repo directory to `agent-hub`? | no |
| Rename repo remote/project to `agent-hub`? | no, decide after local aliasing |
| Rename repo key `caol-ila`? | alias first |
| Retire historical frontmatter `owner: caol-ila`? | no, active docs use `agent-hub`; historical docs stay factual |
| Rename `caol-config`? | no |
| Rename `caol-*` command/skill namespace? | defer |
| Rename `caol-hq` to `agent-hub-hq`? | decide with dashboard tool-space migration |
| Rename Obsidian `projects/caol-ila`? | yes, with separate migration |
| Preserve old `agent-hub` Discord bridge? | no |
