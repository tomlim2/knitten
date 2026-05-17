---
status: active
created: 2026-05-17
updated: 2026-05-17
owner: caol-ila
---

# Skill Path Hardcoding Cleanup

## Purpose

Align all Obsidian-writing skills with the current vault structure:

```text
daily/
projects/
attachments/
```

No skill should recreate legacy vault paths such as `agent/tutoring`, `agent/consulting`, `{obsidian}/claude`, or root-level `notes/`.

## Current Finding

`path-config-drift` is clean, but it does not prove every skill body is free of stale path knowledge.

Manual scan found legacy path references in skill docs, references, and helper scripts.

## Canonical Sources

| Concern | Canonical owner |
|---------|-----------------|
| Vault root | `agent/private/caol-config/machine-paths.json` key `obsidian` |
| Staging root | `agent/private/caol-config/machine-paths.json` key `obsidian-staging` |
| Purpose destinations | `agent/private/caol-config/doc-paths.json` |
| Root folder vocabulary | `agent/private/caol-config/vault-structure.json` |
| Runtime resolver | `agent/skills/caol-resolve-doc-path/resolve.sh` |
| Project folder contract | `agent/skills/obsidian-obsidian-markdown/references/PROJECT-DOCS-STRUCTURE.md` |

## Target Contract

| Old pattern | New pattern |
|-------------|-------------|
| `{obsidian_vault}/agent/tutoring/...` | `resolve.sh doc tutoring` + subpath |
| `{obsidian_vault}/agent/consulting/...` | `resolve.sh doc consulting` + subpath |
| `{obsidian}/claude/...` | purpose-specific resolver output, or `obsidian-staging` for staging |
| `repo-paths.json` for Obsidian | `machine-paths.json` or `caol-resolve-doc-path` |
| root `notes/` | `projects/personal/topics` via `resolve.sh doc notes` |
| root `drinks/` | `projects/drinks` via `resolve.sh doc drinks` |
| hardcoded project day path in writer skills | `resolve.sh doc devlog <project>` |

Literal examples of valid current vault paths may remain only in:

- migration manifests and historical reports
- examples explicitly marked as historical
- validator deny-list patterns
- files that are not path-producing instructions

## In-Scope Files

### Must Patch

| File | Issue | Target |
|------|-------|--------|
| `agent/skills/tutoring-log-consultation/SKILL.md` | `agent/tutoring/consultations`, `repo-paths.json → obsidian` | `resolve.sh doc tutoring` |
| `agent/skills/tutoring-log-consultation/reference.md` | glob and storage text use `agent/tutoring/consultations` | `projects/tutoring/...` via resolver |
| `agent/skills/tutoring-log-lesson/SKILL.md` | `agent/tutoring/presets.json`, `agent/tutoring/invoices` | `resolve.sh doc tutoring` |
| `agent/skills/consulting-log-session/SKILL.md` | `{obsidian_vault}/agent/consulting` | `resolve.sh doc consulting` |
| `agent/skills/consulting-log-session/reference.md` | glob and storage text use `agent/consulting` | `projects/consulting/topics` via resolver |
| `agent/skills/caol-brief-today/SKILL.md` | `repo-paths.json` Obsidian lookup, `{obsidian}/claude` | `machine-paths.json` + resolver/staging |
| `agent/skills/caol-brief-today/reference.md` | `{obsidianClaudeDir}` and legacy staging path | `obsidian-staging` / `daily` / `projects` |
| `agent/skills/caol-guide-private/reference.md` | `Obsidian/agent/tutoring`, `Obsidian/agent/drinks`, absolute MyNotes example | resolver-based examples |
| `agent/skills/learn-archive-week/reference.md` | `agent/references/codex-base` | configured purpose only: prefer `resolve.sh doc research` or `resolve.sh doc topic caol-ila`; do not invent a new durable folder |
| `agent/skills/obsidian-fix-format/build-catalog.py` | writes `notes/INDEX.md` | remove if obsolete; if retained, use current project README/topic conventions instead of `INDEX.md` |
| `agent/skills/drink-log-entry/index.html` | fetches `drinks/drinks.json` | resolver/API path for `projects/drinks/drinks.json` |

### Review Before Patch

| File | Reason |
|------|--------|
| `agent/skills/drink-log-entry/SKILL.md` | already uses resolver, but appends `/drinks.json`; verify target file contract |
| `agent/skills/shotloom-deploy-web/SKILL.md` | uses `base/projects/shotloom/days`; current shape is valid, but should prefer `resolve.sh doc devlog shotloom` |
| `agent/skills/shotloom-auto-pr/reference.md` | `projects/shotloom/ops/runs` is current structure; only patch if this writes durable docs |
| `agent/skills/learn-archive-week/archive.py` | `projects/shotloom/days` is current structure; patch only if resolver can replace cleanly without breaking batch mapping |

### Leave Alone

| Pattern | Reason |
|---------|--------|
| `agent/skills/obsidian-fix-format/fix.sh` deny-list for `agent/projects` | validator intentionally detects retired paths |
| migration report files under `docs/plans/reports/` | historical records |
| relative `references/...` inside a skill directory | skill-local reference path, not vault path |
| current `projects/<project>/...` examples | current vault shape |

## Patch Rules

1. Do not hardcode the absolute vault path.
2. Do not read `repo-paths.json` for Obsidian.
3. Prefer `bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh doc <purpose> [project]`.
4. Use `machine-paths.json` directly only for tool roots such as `obsidian-staging`, and only when no document purpose exists.
5. Do not create new `doc-paths.json` purposes unless an existing purpose cannot express the destination.
6. If a skill needs a subpath below a purpose, append it to the resolver output and keep the appended subpath purpose-local.

## Validation

Run after patch:

```bash
rg -n "\{obsidian_vault\}/agent|/agent/(tutoring|consulting|drinks|notes)|agent/(tutoring|consulting|drinks|notes)|obsidianClaudeDir|\{obsidian\}/claude|repo-paths\.json.*obsidian|Obsidian/agent|MyNotes/agent" agent/skills
bash agent/skills/obsidian-fix-format/fix.sh --check path-config-drift
bash agent/skills/obsidian-fix-format/fix.sh --check root-structure
bash agent/skills/obsidian-fix-format/fix.sh --check project-structure
git diff --check
```

Expected:

- No active skill instruction points to `agent/<domain>` inside the vault.
- No active skill instruction tells an agent to find Obsidian through `repo-paths.json`.
- Remaining grep matches are classified in a report. `0 matches` is ideal, but not required when a match is a deny-list pattern, historical example marked as historical, or current `projects/` path.

## Execution Plan

| Step | Action | Status |
|------|--------|--------|
| 1 | Patch tutoring and consulting skills to resolver-based destinations | completed |
| 2 | Patch daily briefing skill away from `{obsidian}/claude` | completed |
| 3 | Patch private guide and archive references | completed |
| 4 | Patch or retire `build-catalog.py` legacy `notes/INDEX.md` behavior | completed |
| 5 | Review drink and Shotloom path-producing snippets | completed |
| 6 | Run validators and grep checks | completed |

## Execution Log

| Date | Action | Result |
|------|--------|--------|
| 2026-05-17 | Patched active skill path producers | Legacy `agent/<domain>` vault path grep returned 0 active matches |
| 2026-05-17 | Classified remaining broad drift matches | Remaining matches are validator deny-list patterns plus an explicit `notes/INDEX.md` retirement note |
| 2026-05-17 | Ran validators | `path-config-drift`, `root-structure`, `project-structure`, Python compile, and `git diff --check` passed |

## Open Questions

| Question | Default |
|----------|---------|
| Should tutoring invoices live under `projects/tutoring` or `attachments/tutoring`? | Keep under `projects/tutoring/invoices` unless user chooses attachment-only storage |
| Should drink data remain `drinks.json` under `projects/drinks`? | Keep as purpose-local data file |
| Should briefings be appended to `daily/` or stored as separate project records? | Append human-facing today briefings to `daily/`; store separate operational run records under the configured `caol-ila` project purpose, not an ad-hoc `{obsidian}/claude` folder |
