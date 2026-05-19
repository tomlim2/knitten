---
status: intake
created: 2026-05-19
updated: 2026-05-19
owner: agent-hub
spec: docs/plans/completed/document-template-merge-readiness.md
---

# Spec Intake: document-template-merge-readiness

## User Request

Create a hardening spec that makes the document-template centralization branch
strong enough to merge. Include an explicit lifecycle owner for creating,
updating, reviewing, redirecting, and deleting document templates.

## Goal

Turn review findings from the document-template refactor into concrete merge
readiness requirements, implementation steps, and validation gates.

## Route

- selected route: `ah-manage-spec`
- candidate routes: `ah-manage-spec`, `ah-review-implementation`
- delegated or referenced skills: `ah-manage-spec`

## Evidence To Read

| Type | Path or source | Reason |
|------|----------------|--------|
| file | `agent/document-templates/README.md` | canonical template inventory and consumer contract |
| file | `agent/standards/authoring/document-templates.md` | policy for canonical template ownership |
| file | `agent/skills/ah-manage-artifact/SKILL.md` | adjacent artifact lifecycle routing precedent |
| file | `agent/skills/ah-manage-spec/SKILL.md` | adjacent spec lifecycle workflow precedent |
| file | `agent/document-templates/agent-hub/technical-spec.md` | broken nested Markdown fence finding |
| file | `agent/document-templates/obsidian/cross-project-learning.md` | invalid tag axis and tag-count finding |
| file | `agent/skills/obsidian-obsidian-markdown/references/TAG-TAXONOMY.md` | allowed Obsidian tag axes |
| file | `agent/skills/consulting-log-session/reference.md` | stale runtime template path finding |
| file | `.github/pull_request_template.md` | required GitHub runtime mirror |
| file | `agent/document-templates/github/pull-request.md` | canonical GitHub PR body template |
| file | `scripts/validate-llm-first.mjs` | current document-template validator gaps |
| command | `node scripts/validate-llm-first.mjs --check document-templates` | current check passes despite review findings |
| command | `node scripts/validate-llm-first.mjs` | full validator currently passes despite review findings |

## Known Decisions

- Keep `agent/document-templates/` as the canonical home for reusable document
  body templates.
- Keep platform-required runtime mirrors only where the platform requires a
  fixed path, such as `.github/pull_request_template.md`.
- Document-template lifecycle needs an explicit workflow owner; standards alone
  are not enough for cold-start template creation and deletion.
- Do not rely on string-presence checks when the consumer format can be
  validated structurally.
- Do not delete or move legacy runtime paths unless all consumers and shims are
  accounted for.

## Open Questions

- Should legacy `~/.claude/templates/**` deployment paths remain supported
  until artifact-pack migration, or should every skill read directly from
  `agent/document-templates/`?
- Should this branch include a migration shim for `agent/templates/**`, or is
  the tracked redirect policy enough once direct consumers are updated?
- Should the lifecycle owner be a dedicated `ah-manage-document-template`
  skill, or should it be a mode under `ah-manage-artifact`?

## Exclusions

- Do not redesign the whole artifact-pack system.
- Do not move additional skill, command, rule, or standard artifacts.
- Do not implement a full artifact-pack resolver as part of template lifecycle
  management.
- Do not change Obsidian taxonomy unless a new tag axis is explicitly accepted.
- Do not touch release tagging or branch cleanup behavior.

## Validation Expected

- `node scripts/validate-llm-first.mjs --check document-templates`
- `node scripts/validate-llm-first.mjs`
- `git diff --check`
- targeted scans proving no stale template consumers remain
- a documented create/update/review/redirect/delete workflow for document
  templates
