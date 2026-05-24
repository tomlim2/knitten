---
status: completed
created: 2026-05-24
updated: 2026-05-24
owner: agent-hub
spec: ../../active/core-artifact-boundary.md
---

# Core-Owned Classification: First Batch

## Purpose

Record the first reviewed classification batch for `owner-domain: core` inventory rows.

## Source Query

```bash
node -e "const i=require('./agent/config/artifact-inventory.json'); console.log(i.rows.filter(r=>r['owner-domain']==='core'))"
```

## Summary

| Metric | Count |
|--------|-------|
| rows reviewed | 125 |
| artifact-type: command | 15 |
| artifact-type: config | 21 |
| artifact-type: doc | 26 |
| artifact-type: rule | 25 |
| artifact-type: script | 7 |
| artifact-type: skill | 31 |
| route-specific public-safe rows | 6 |
| decision: core-candidate -> knitten-core | 100 |
| decision: core-candidate -> undecided | 1 |
| decision: migrate-later -> migrate-later | 18 |
| decision: pack-candidate -> knitten-private-pack | 6 |

## Rules Applied

| Condition | Decision |
|-----------|----------|
| `review-state: blocked` | `migrate-later` until the blocker is resolved. |
| `artifact-type: command` | `migrate-later` until `command-retirement-plan` lands. |
| `privacy-risk: needs-scrub` | `core-candidate` with `proposed-destination: undecided` until scrub gates pass. |
| public-safe row with repo, company, or route-specific path evidence | `pack-candidate` with `proposed-destination: knitten-private-pack`. |
| remaining public-safe core rows | `core-candidate` with `proposed-destination: knitten-core`. |

## Decision Table

| Row id | Type | Risk | Current review | Stage | Destination | Blocker |
|--------|------|------|----------------|-------|-------------|---------|
| `artifact:agent/commands/ah-check-status.md` | `command` | `public-safe` | `pending` | `migrate-later` | `migrate-later` | `command-retirement-plan` |
| `artifact:agent/commands/ah-check-updates.md` | `command` | `public-safe` | `pending` | `migrate-later` | `migrate-later` | `command-retirement-plan` |
| `artifact:agent/commands/ah-consult-codebase.md` | `command` | `public-safe` | `pending` | `migrate-later` | `migrate-later` | `command-retirement-plan` |
| `artifact:agent/commands/ah-explore-codebase.md` | `command` | `public-safe` | `pending` | `migrate-later` | `migrate-later` | `command-retirement-plan` |
| `artifact:agent/commands/ah-generate-sitemap.md` | `command` | `public-safe` | `pending` | `migrate-later` | `migrate-later` | `command-retirement-plan` |
| `artifact:agent/commands/ah-open-dashboard.md` | `command` | `public-safe` | `pending` | `migrate-later` | `migrate-later` | `command-retirement-plan` |
| `artifact:agent/commands/ah-research-light.md` | `command` | `public-safe` | `pending` | `migrate-later` | `migrate-later` | `command-retirement-plan` |
| `artifact:agent/commands/ah-research-rules.md` | `command` | `public-safe` | `pending` | `migrate-later` | `migrate-later` | `command-retirement-plan` |
| `artifact:agent/commands/ah-research-web.md` | `command` | `public-safe` | `pending` | `migrate-later` | `migrate-later` | `command-retirement-plan` |
| `artifact:agent/commands/ah-review-claude-md.md` | `command` | `public-safe` | `pending` | `migrate-later` | `migrate-later` | `command-retirement-plan` |
| `artifact:agent/commands/ah-review-skills.md` | `command` | `public-safe` | `pending` | `migrate-later` | `migrate-later` | `command-retirement-plan` |
| `artifact:agent/commands/ah-switch-context.md` | `command` | `public-safe` | `pending` | `migrate-later` | `migrate-later` | `command-retirement-plan` |
| `artifact:agent/commands/ah-sync-vendors.md` | `command` | `public-safe` | `pending` | `migrate-later` | `migrate-later` | `command-retirement-plan` |
| `artifact:agent/commands/ah-update-docs.md` | `command` | `public-safe` | `pending` | `migrate-later` | `migrate-later` | `command-retirement-plan` |
| `artifact:agent/commands/ah-work-ultra.md` | `command` | `public-safe` | `pending` | `migrate-later` | `migrate-later` | `command-retirement-plan` |
| `artifact:agent/config/.env.example` | `config` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/config/agent-hub.json` | `config` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/config/artifact-inventory.schema.json` | `config` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/config/audit-policy.json` | `config` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/config/context-routing.json` | `config` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/config/doc-budgets.json` | `config` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/config/exceptions.json` | `config` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/config/frontmatter-schema.json` | `config` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/config/managed-paths.json` | `config` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/config/managed-paths.schema.json` | `config` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/config/permissions/agent-hub.settings.json` | `config` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/config/permissions/README.md` | `config` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/config/permissions/shotloom.settings.json` | `config` | `public-safe` | `pending` | `pack-candidate` | `knitten-private-pack` | `route-specific evidence` |
| `artifact:agent/config/permissions/www.settings.json` | `config` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/config/README.md` | `config` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/config/repo-policy.schema.json` | `config` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/config/slack.json` | `config` | `public-safe` | `pending` | `pack-candidate` | `knitten-private-pack` | `route-specific evidence` |
| `artifact:agent/config/slack.json.example` | `config` | `public-safe` | `pending` | `pack-candidate` | `knitten-private-pack` | `route-specific evidence` |
| `artifact:agent/config/taxonomy.json` | `config` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/document-templates/agent-hub/design-plan.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/document-templates/agent-hub/milestone.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/document-templates/agent-hub/operational-finding-report.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/document-templates/agent-hub/spec.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/document-templates/agent-hub/technical-spec.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/rules/ambiguity-scoring.md` | `rule` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/rules/author.md` | `rule` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/rules/behavior.md` | `rule` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/rules/canonical-first.md` | `rule` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/rules/cinev-git.md` | `rule` | `public-safe` | `pending` | `pack-candidate` | `knitten-private-pack` | `route-specific evidence` |
| `artifact:agent/rules/code-write.md` | `rule` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/rules/doc-write.md` | `rule` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/rules/git-defaults.md` | `rule` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/rules/index.md` | `rule` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/rules/main-chore-lane.md` | `rule` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/rules/metaphor-style.md` | `rule` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/rules/obsidian.md` | `rule` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/rules/pr-comment.md` | `rule` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/rules/pr-create.md` | `rule` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/rules/pr-mutate.md` | `rule` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/rules/reread-repo-conventions.md` | `rule` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/rules/security.md` | `rule` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/rules/session-start.md` | `rule` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/rules/shotloom-docs-lane.md` | `rule` | `needs-scrub` | `pending` | `core-candidate` | `undecided` | `public-safety-scrub-gates` |
| `artifact:agent/rules/shotloom.md` | `rule` | `public-safe` | `pending` | `pack-candidate` | `knitten-private-pack` | `route-specific evidence` |
| `artifact:agent/rules/slack.md` | `rule` | `public-safe` | `pending` | `pack-candidate` | `knitten-private-pack` | `route-specific evidence` |
| `artifact:agent/rules/task-context-routing.md` | `rule` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/rules/test-write.md` | `rule` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/rules/verify-before-report.md` | `rule` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/rules/writing-external.md` | `rule` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/skills/ah-audit-skill/references/AUDIT-CHECKS.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/skills/ah-brief-today/reference.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/skills/ah-guide-private/reference.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/skills/ah-log-postmortem/reference.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/skills/ah-make-command/reference.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/skills/ah-make-command/references/COMMAND-SKILL-REFERENCE.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/skills/ah-make-command/references/SLASH-COMMANDS.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/skills/ah-make-skill/reference.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/skills/ah-manage-config/machine-paths.template.json` | `config` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/skills/ah-manage-config/repo-paths.template.json` | `config` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/skills/ah-manage-milestone/references/MILESTONE-LIFECYCLE.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/skills/ah-manage-milestone/references/MILESTONE-TEMPLATE.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/skills/ah-manage-milestone/references/MILESTONE-VALIDATION.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/skills/ah-manage-spec/references/SPEC-INTAKE.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/skills/ah-manage-spec/references/SPEC-LIFECYCLE.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/skills/ah-manage-spec/references/SPEC-ROUTING.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/skills/ah-manage-spec/references/SPEC-TEMPLATES.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:agent/skills/ah-show-patterns/reference.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:docs/milestones/agent-artifact-pack-system.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:docs/milestones/agent-work-routing-system.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:docs/milestones/index.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:docs/milestones/spec-lifecycle-system.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:docs/milestones/worktree-first-workflow.md` | `doc` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:scripts/validate-llm-first.mjs` | `script` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:scripts/worktree-clean.mjs` | `script` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:scripts/worktree-guard.mjs` | `script` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:scripts/worktree-install-hooks.mjs` | `script` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:scripts/worktree-lib.mjs` | `script` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:scripts/worktree-start.mjs` | `script` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `artifact:scripts/worktree-status.mjs` | `script` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `extraction:agent/skills/ah-manage-spec/SKILL.md#archive-delete-policy` | `skill` | `public-safe` | `blocked` | `migrate-later` | `migrate-later` | `blocked review-state` |
| `extraction:agent/skills/ah-manage-spec/SKILL.md#review-checklist` | `skill` | `public-safe` | `blocked` | `migrate-later` | `migrate-later` | `blocked review-state` |
| `skill:agent/skills/ah-audit-skill/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-brief-today/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-browse-commands/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-browse-standards/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-delete-skill/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-edit-skill/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-grant-perms/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-guide-private/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-log-postmortem/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-make-command/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-make-rule/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-make-skill/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-make-standard/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-manage-artifact/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-manage-config/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-manage-document-template/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-manage-milestone/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-manage-skill/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-manage-spec/SKILL.md` | `skill` | `public-safe` | `blocked` | `migrate-later` | `migrate-later` | `blocked review-state` |
| `skill:agent/skills/ah-report-finding/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-resolve-doc-path/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-review-implementation/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-revoke-perms/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-route-implementation/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-route-plan/SKILL.md` | `skill` | `public-safe` | `accepted` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-route-review/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-setup-harness/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-show-patterns/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |
| `skill:agent/skills/ah-update-skill/SKILL.md` | `skill` | `public-safe` | `pending` | `core-candidate` | `knitten-core` | `none` |

## Conflicts

None observed in this batch.

## Proof Commands

```bash
node scripts/validate-llm-first.mjs --check artifact-inventory
node scripts/validate-llm-first.mjs --check spec-lifecycle
node scripts/validate-llm-first.mjs
git diff --check
```
