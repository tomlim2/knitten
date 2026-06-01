---
status: report
created: 2026-06-01
owner: agent-hub
spec: ../../proposed/knitten-pluginization-core-extraction.md
---

# Pluginization Inventory 2026-06-01

## Purpose

Dry-run pack grouping from `agent/config/artifact-inventory.json`. This report does not move files
or assign final skill classification.

## Source

| Field | Value |
|-------|-------|
| source commit | `a9e081c32557abdea3a7abbf9b35fc7b7d358492` |
| source dirty | `true` |
| inventory rows | 799 |

## Pack Summary

| candidate pack | rows | blockers | owner domains | privacy risks |
|----------------|------|----------|---------------|---------------|
| company-private-pack | 23 | 23 | company | needs-scrub |
| domain-pack | 73 | 73 | domain | unknown |
| knitten-core | 120 | 120 | core | needs-scrub<br>public-safe |
| migrate-later | 3 | 3 | core | public-safe |
| needs-review | 457 | 457 | unknown | unknown |
| repo-private-pack | 123 | 123 | repo | needs-scrub |

## Candidate Rows

| candidate pack | row id | owner domain | privacy risk | dependencies | support files | output ids | local artifact identities | templates | scripts | compatibility need | blocker status |
|----------------|--------|--------------|--------------|--------------|---------------|------------|---------------------------|-----------|---------|--------------------|----------------|
| needs-review | `artifact:.github/pull_request_template.md` | unknown | unknown | none | .github/pull_request_template.md | none | none | none | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| needs-review | `artifact:.github/workflows/validate.yml` | unknown | unknown | none | .github/workflows/validate.yml | none | none | none | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| needs-review | `artifact:AGENT-HUB.md` | unknown | unknown | none | AGENT-HUB.md | none | none | none | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| needs-review | `artifact:agent/AGENTS.md` | unknown | unknown | none | agent/AGENTS.md | none | none | none | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| needs-review | `artifact:agent/CLAUDE.md` | unknown | unknown | none | agent/CLAUDE.md | none | none | none | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| knitten-core | `artifact:agent/config/.env.example` | core | public-safe | none | agent/config/.env.example | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/config/agent-hub.json` | core | public-safe | none | agent/config/agent-hub.json | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/config/artifact-inventory-reviewed-decisions.json` | core | public-safe | none | agent/config/artifact-inventory-reviewed-decisions.json | none | none | none | none | unknown | compatibility:unknown, classification:undecided |
| knitten-core | `artifact:agent/config/artifact-inventory.schema.json` | core | public-safe | none | agent/config/artifact-inventory.schema.json | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/config/artifact-pack-core-capabilities.json` | core | public-safe | none | agent/config/artifact-pack-core-capabilities.json | none | none | none | none | unknown | compatibility:unknown, classification:undecided |
| knitten-core | `artifact:agent/config/artifact-pack.schema.json` | core | public-safe | none | agent/config/artifact-pack.schema.json | none | none | none | none | unknown | compatibility:unknown, classification:undecided |
| knitten-core | `artifact:agent/config/audit-policy.json` | core | public-safe | none | agent/config/audit-policy.json | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/config/context-routing.json` | core | public-safe | none | agent/config/context-routing.json | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/config/doc-budgets.json` | core | public-safe | none | agent/config/doc-budgets.json | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/config/exceptions.json` | core | public-safe | none | agent/config/exceptions.json | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/config/frontmatter-schema.json` | core | public-safe | none | agent/config/frontmatter-schema.json | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/config/local-artifact-paths.json` | core | public-safe | none | agent/config/local-artifact-paths.json | none | none | none | none | unknown | compatibility:unknown, classification:undecided |
| knitten-core | `artifact:agent/config/local-helper-paths.json` | core | public-safe | none | agent/config/local-helper-paths.json | none | none | none | none | unknown | compatibility:unknown, classification:undecided |
| knitten-core | `artifact:agent/config/managed-paths.json` | core | public-safe | none | agent/config/managed-paths.json | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/config/managed-paths.schema.json` | core | public-safe | none | agent/config/managed-paths.schema.json | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/config/outputs.json` | core | public-safe | none | agent/config/outputs.json | none | none | none | none | unknown | compatibility:unknown, classification:undecided |
| knitten-core | `artifact:agent/config/permissions/agent-hub.settings.json` | core | public-safe | none | agent/config/permissions/agent-hub.settings.json | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/config/permissions/README.md` | core | public-safe | none | agent/config/permissions/README.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/config/permissions/shotloom.settings.json` | core | public-safe | none | agent/config/permissions/shotloom.settings.json | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/config/permissions/www.settings.json` | core | public-safe | none | agent/config/permissions/www.settings.json | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/config/README.md` | core | public-safe | none | agent/config/README.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/config/repo-policy.schema.json` | core | public-safe | none | agent/config/repo-policy.schema.json | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/config/slack.json` | core | public-safe | none | agent/config/slack.json | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/config/slack.json.example` | core | public-safe | none | agent/config/slack.json.example | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/config/taxonomy.json` | core | public-safe | none | agent/config/taxonomy.json | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/document-templates/agent-hub/design-plan.md` | core | public-safe | none | agent/document-templates/agent-hub/design-plan.md | none | none | agent/document-templates/agent-hub/design-plan.md | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/document-templates/agent-hub/json-handoff-packet.json` | core | public-safe | none | agent/document-templates/agent-hub/json-handoff-packet.json | none | none | agent/document-templates/agent-hub/json-handoff-packet.json | none | unknown | compatibility:unknown, classification:undecided |
| knitten-core | `artifact:agent/document-templates/agent-hub/milestone.md` | core | public-safe | none | agent/document-templates/agent-hub/milestone.md | none | none | agent/document-templates/agent-hub/milestone.md | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/document-templates/agent-hub/operational-finding-report.md` | core | public-safe | none | agent/document-templates/agent-hub/operational-finding-report.md | none | none | agent/document-templates/agent-hub/operational-finding-report.md | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/document-templates/agent-hub/release-notes.md` | core | public-safe | none | agent/document-templates/agent-hub/release-notes.md | none | none | agent/document-templates/agent-hub/release-notes.md | none | unknown | compatibility:unknown, classification:undecided |
| knitten-core | `artifact:agent/document-templates/agent-hub/shotloom-before-pr-findings.json` | core | needs-scrub | none | agent/document-templates/agent-hub/shotloom-before-pr-findings.json | none | none | agent/document-templates/agent-hub/shotloom-before-pr-findings.json | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| knitten-core | `artifact:agent/document-templates/agent-hub/shotloom-before-pr-readiness.json` | core | needs-scrub | none | agent/document-templates/agent-hub/shotloom-before-pr-readiness.json | none | none | agent/document-templates/agent-hub/shotloom-before-pr-readiness.json | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| knitten-core | `artifact:agent/document-templates/agent-hub/shotloom-deploy-manifest.json` | core | needs-scrub | none | agent/document-templates/agent-hub/shotloom-deploy-manifest.json | none | none | agent/document-templates/agent-hub/shotloom-deploy-manifest.json | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| knitten-core | `artifact:agent/document-templates/agent-hub/shotloom-deploy-rollback.json` | core | needs-scrub | none | agent/document-templates/agent-hub/shotloom-deploy-rollback.json | none | none | agent/document-templates/agent-hub/shotloom-deploy-rollback.json | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| knitten-core | `artifact:agent/document-templates/agent-hub/shotloom-planning-manifest.json` | core | needs-scrub | none | agent/document-templates/agent-hub/shotloom-planning-manifest.json | none | none | agent/document-templates/agent-hub/shotloom-planning-manifest.json | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| knitten-core | `artifact:agent/document-templates/agent-hub/shotloom-pr-reply-plan.json` | core | needs-scrub | none | agent/document-templates/agent-hub/shotloom-pr-reply-plan.json | none | none | agent/document-templates/agent-hub/shotloom-pr-reply-plan.json | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| knitten-core | `artifact:agent/document-templates/agent-hub/skill-html-like.md` | core | public-safe | none | agent/document-templates/agent-hub/skill-html-like.md | none | none | agent/document-templates/agent-hub/skill-html-like.md | none | unknown | compatibility:unknown, classification:undecided |
| knitten-core | `artifact:agent/document-templates/agent-hub/skill.md` | core | public-safe | none | agent/document-templates/agent-hub/skill.md | none | none | agent/document-templates/agent-hub/skill.md | none | unknown | compatibility:unknown, classification:undecided |
| knitten-core | `artifact:agent/document-templates/agent-hub/spec.md` | core | public-safe | none | agent/document-templates/agent-hub/spec.md | none | none | agent/document-templates/agent-hub/spec.md | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/document-templates/agent-hub/technical-spec.md` | core | public-safe | none | agent/document-templates/agent-hub/technical-spec.md | none | none | agent/document-templates/agent-hub/technical-spec.md | none | unknown | compatibility:unknown |
| needs-review | `artifact:agent/document-templates/consulting/company-history.md` | unknown | unknown | none | agent/document-templates/consulting/company-history.md | none | none | agent/document-templates/consulting/company-history.md | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| needs-review | `artifact:agent/document-templates/github/pull-request.md` | unknown | unknown | none | agent/document-templates/github/pull-request.md | none | none | agent/document-templates/github/pull-request.md | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| company-private-pack | `artifact:agent/document-templates/linear/cci-issue.md` | company | needs-scrub | none | agent/document-templates/linear/cci-issue.md | none | none | agent/document-templates/linear/cci-issue.md | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| repo-private-pack | `artifact:agent/document-templates/linear/shotloom-issue.md` | repo | needs-scrub | none | agent/document-templates/linear/shotloom-issue.md | none | none | agent/document-templates/linear/shotloom-issue.md | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| needs-review | `artifact:agent/document-templates/obsidian/cross-project-learning.md` | unknown | unknown | none | agent/document-templates/obsidian/cross-project-learning.md | none | none | agent/document-templates/obsidian/cross-project-learning.md | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| needs-review | `artifact:agent/document-templates/obsidian/daily-note.md` | unknown | unknown | none | agent/document-templates/obsidian/daily-note.md | none | none | agent/document-templates/obsidian/daily-note.md | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| needs-review | `artifact:agent/document-templates/obsidian/devlog-day.md` | unknown | unknown | none | agent/document-templates/obsidian/devlog-day.md | none | none | agent/document-templates/obsidian/devlog-day.md | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| needs-review | `artifact:agent/document-templates/obsidian/devlog-hub.md` | unknown | unknown | none | agent/document-templates/obsidian/devlog-hub.md | none | none | agent/document-templates/obsidian/devlog-hub.md | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| needs-review | `artifact:agent/document-templates/obsidian/generic-note.md` | unknown | unknown | none | agent/document-templates/obsidian/generic-note.md | none | none | agent/document-templates/obsidian/generic-note.md | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| needs-review | `artifact:agent/document-templates/obsidian/inbox-note.md` | unknown | unknown | none | agent/document-templates/obsidian/inbox-note.md | none | none | agent/document-templates/obsidian/inbox-note.md | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| needs-review | `artifact:agent/document-templates/obsidian/learning-index.md` | unknown | unknown | none | agent/document-templates/obsidian/learning-index.md | none | none | agent/document-templates/obsidian/learning-index.md | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| needs-review | `artifact:agent/document-templates/obsidian/topic-reference.md` | unknown | unknown | none | agent/document-templates/obsidian/topic-reference.md | none | none | agent/document-templates/obsidian/topic-reference.md | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| needs-review | `artifact:agent/document-templates/project/project-record.md` | unknown | unknown | none | agent/document-templates/project/project-record.md | none | none | agent/document-templates/project/project-record.md | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| needs-review | `artifact:agent/document-templates/README.md` | unknown | unknown | none | agent/document-templates/README.md | none | none | agent/document-templates/README.md | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| needs-review | `artifact:agent/document-templates/review/code-review.md` | unknown | unknown | none | agent/document-templates/review/code-review.md | none | none | agent/document-templates/review/code-review.md | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| needs-review | `artifact:agent/lib/README.md` | unknown | unknown | none | agent/lib/README.md | none | none | none | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| repo-private-pack | `artifact:agent/obsidian-staging/projects/shotloom/days/2026-05-18.md` | repo | needs-scrub | none | agent/obsidian-staging/projects/shotloom/days/2026-05-18.md | none | none | none | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| repo-private-pack | `artifact:agent/obsidian-staging/projects/shotloom/days/2026-05-19.md` | repo | needs-scrub | none | agent/obsidian-staging/projects/shotloom/days/2026-05-19.md | none | none | none | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| repo-private-pack | `artifact:agent/obsidian-staging/projects/shotloom/days/2026-05-20.md` | repo | needs-scrub | none | agent/obsidian-staging/projects/shotloom/days/2026-05-20.md | none | none | none | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| repo-private-pack | `artifact:agent/obsidian-staging/projects/shotloom/days/2026-05-21.md` | repo | needs-scrub | none | agent/obsidian-staging/projects/shotloom/days/2026-05-21.md | none | none | none | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| repo-private-pack | `artifact:agent/obsidian-staging/projects/shotloom/days/2026-05-22.md` | repo | needs-scrub | none | agent/obsidian-staging/projects/shotloom/days/2026-05-22.md | none | none | none | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| repo-private-pack | `artifact:agent/obsidian-staging/projects/shotloom/learnings/checker-texture-shimmer.md` | repo | needs-scrub | none | agent/obsidian-staging/projects/shotloom/learnings/checker-texture-shimmer.md | none | none | none | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| needs-review | `artifact:agent/repo-registry.json` | unknown | unknown | none | agent/repo-registry.json | none | none | none | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| knitten-core | `artifact:agent/rules/ambiguity-scoring.md` | core | public-safe | none | agent/rules/ambiguity-scoring.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/author.md` | core | public-safe | none | agent/rules/author.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/behavior.md` | core | public-safe | none | agent/rules/behavior.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/canonical-first.md` | core | public-safe | none | agent/rules/canonical-first.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/cinev-git.md` | core | public-safe | none | agent/rules/cinev-git.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/code-write.md` | core | public-safe | none | agent/rules/code-write.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/doc-write.md` | core | public-safe | none | agent/rules/doc-write.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/git-defaults.md` | core | public-safe | none | agent/rules/git-defaults.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/index.md` | core | public-safe | none | agent/rules/index.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/main-chore-lane.md` | core | public-safe | none | agent/rules/main-chore-lane.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/metaphor-style.md` | core | public-safe | none | agent/rules/metaphor-style.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/obsidian.md` | core | public-safe | none | agent/rules/obsidian.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/pr-comment.md` | core | public-safe | none | agent/rules/pr-comment.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/pr-create.md` | core | public-safe | none | agent/rules/pr-create.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/pr-mutate.md` | core | public-safe | none | agent/rules/pr-mutate.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/reread-repo-conventions.md` | core | public-safe | none | agent/rules/reread-repo-conventions.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/security.md` | core | public-safe | none | agent/rules/security.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/session-start.md` | core | public-safe | none | agent/rules/session-start.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/slack.md` | core | public-safe | none | agent/rules/slack.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/task-context-routing.md` | core | public-safe | none | agent/rules/task-context-routing.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/test-write.md` | core | public-safe | none | agent/rules/test-write.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/verify-before-report.md` | core | public-safe | none | agent/rules/verify-before-report.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/rules/writing-external.md` | core | public-safe | none | agent/rules/writing-external.md | none | none | none | none | unknown | compatibility:unknown |
| repo-private-pack | `artifact:agent/scheduled-tasks/shotloom-ci-watch/SKILL.md` | repo | needs-scrub | none | agent/scheduled-tasks/shotloom-ci-watch/SKILL.md | none | none | none | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| needs-review | `artifact:agent/settings.json` | unknown | unknown | none | agent/settings.json | none | none | none | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| knitten-core | `artifact:agent/skills/ah-audit-skill/references/AUDIT-CHECKS.md` | core | public-safe | none | agent/skills/ah-audit-skill/references/AUDIT-CHECKS.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/skills/ah-brief-today/reference.md` | core | public-safe | none | agent/skills/ah-brief-today/reference.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/skills/ah-guide-private/reference.md` | core | public-safe | none | agent/skills/ah-guide-private/reference.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/skills/ah-log-postmortem/reference.md` | core | public-safe | none | agent/skills/ah-log-postmortem/reference.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/skills/ah-make-skill/reference.md` | core | public-safe | none | agent/skills/ah-make-skill/reference.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/skills/ah-manage-config/machine-paths.template.json` | core | public-safe | none | agent/skills/ah-manage-config/machine-paths.template.json | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/skills/ah-manage-config/repo-paths.template.json` | core | public-safe | none | agent/skills/ah-manage-config/repo-paths.template.json | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/skills/ah-manage-milestone/references/MILESTONE-LIFECYCLE.md` | core | public-safe | none | agent/skills/ah-manage-milestone/references/MILESTONE-LIFECYCLE.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/skills/ah-manage-milestone/references/MILESTONE-TEMPLATE.md` | core | public-safe | none | agent/skills/ah-manage-milestone/references/MILESTONE-TEMPLATE.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/skills/ah-manage-milestone/references/MILESTONE-VALIDATION.md` | core | public-safe | none | agent/skills/ah-manage-milestone/references/MILESTONE-VALIDATION.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/skills/ah-manage-spec/references/SPEC-INTAKE.md` | core | public-safe | none | agent/skills/ah-manage-spec/references/SPEC-INTAKE.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/skills/ah-manage-spec/references/SPEC-LIFECYCLE.md` | core | public-safe | none | agent/skills/ah-manage-spec/references/SPEC-LIFECYCLE.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/skills/ah-manage-spec/references/SPEC-ROUTING.md` | core | public-safe | none | agent/skills/ah-manage-spec/references/SPEC-ROUTING.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/skills/ah-manage-spec/references/SPEC-TEMPLATES.md` | core | public-safe | none | agent/skills/ah-manage-spec/references/SPEC-TEMPLATES.md | none | none | none | none | unknown | compatibility:unknown |
| knitten-core | `artifact:agent/skills/ah-review-implementation/references/IMPLEMENTATION_FIT.md` | core | public-safe | none | agent/skills/ah-review-implementation/references/IMPLEMENTATION_FIT.md | none | none | none | none | unknown | compatibility:unknown, classification:undecided |
| knitten-core | `artifact:agent/skills/ah-show-patterns/reference.md` | core | public-safe | none | agent/skills/ah-show-patterns/reference.md | none | none | none | none | unknown | compatibility:unknown |
| company-private-pack | `artifact:agent/skills/cci-manage-art-branch/config.json` | company | needs-scrub | none | agent/skills/cci-manage-art-branch/config.json | none | none | none | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| company-private-pack | `artifact:agent/skills/cci-manage-art-branch/reference.md` | company | needs-scrub | none | agent/skills/cci-manage-art-branch/reference.md | none | none | none | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| company-private-pack | `artifact:agent/skills/cci-manage-art-branch/references/CINEV-GIT-WORKFLOW.md` | company | needs-scrub | none | agent/skills/cci-manage-art-branch/references/CINEV-GIT-WORKFLOW.md | none | none | none | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| company-private-pack | `artifact:agent/skills/cci-serve-mcp/references/CCI-SLACK.md` | company | needs-scrub | none | agent/skills/cci-serve-mcp/references/CCI-SLACK.md | none | none | none | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| company-private-pack | `artifact:agent/skills/cci-sync-ta-tools/config.json` | company | needs-scrub | none | agent/skills/cci-sync-ta-tools/config.json | none | none | none | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| company-private-pack | `artifact:agent/skills/cci-validate-character-mat-slot-names/references/CINEV-CHARACTER-ASSET-NAMING.md` | company | needs-scrub | none | agent/skills/cci-validate-character-mat-slot-names/references/CINEV-CHARACTER-ASSET-NAMING.md | none | none | none | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| company-private-pack | `artifact:agent/skills/cci-validate-character-mat-slot-names/required_slots.json` | company | needs-scrub | none | agent/skills/cci-validate-character-mat-slot-names/required_slots.json | none | none | none | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| company-private-pack | `artifact:agent/skills/cci-validate-vrm/references/CINEV-VRM-SHADING.md` | company | needs-scrub | none | agent/skills/cci-validate-vrm/references/CINEV-VRM-SHADING.md | none | none | none | none | unknown | privacy:needs-scrub, compatibility:unknown, classification:undecided |
| needs-review | `artifact:agent/skills/claude-seo/agents/seo-content.md` | unknown | unknown | none | agent/skills/claude-seo/agents/seo-content.md | none | none | none | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| needs-review | `artifact:agent/skills/claude-seo/agents/seo-geo.md` | unknown | unknown | none | agent/skills/claude-seo/agents/seo-geo.md | none | none | none | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |
| needs-review | `artifact:agent/skills/claude-seo/agents/seo-performance.md` | unknown | unknown | none | agent/skills/claude-seo/agents/seo-performance.md | none | none | none | none | unknown | owner-domain:unknown, compatibility:unknown, classification:undecided |

## Gate Result

| Gate | Result |
|------|--------|
| no file movement | pass |
| final skill classification deferred | pass |
| candidate pack visibility | pass |
| blocker visibility | pass |
