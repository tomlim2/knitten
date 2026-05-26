---
status: accepted
---

# Document Templates

## Rule

Use this inventory before changing a document template in Knitten. Edit the
canonical owner, then update any skill or redirect that references it.

## Inventory

| Template | Phase | Canonical owner | Used by |
|----------|-------|-----------------|---------|
| Pull request body | internal-consumption | `agent/document-templates/github/pull-request.md` | GitHub PR creation in this repo |
| Shotloom Linear issue | internal-consumption | `agent/document-templates/linear/shotloom-issue.md` | linear issue workflows and Shotloom planning docs |
| CCI Linear issue | internal-consumption | `agent/document-templates/linear/cci-issue.md` | CCI issue-authoring workflows |
| Agent-hub spec | internal-consumption | `agent/document-templates/agent-hub/spec.md` | `agent/skills/ah-manage-spec/SKILL.md` |
| Milestone | internal-consumption | `agent/document-templates/agent-hub/milestone.md` | `agent/skills/ah-manage-milestone/SKILL.md` |
| Design plan | internal-consumption | `agent/document-templates/agent-hub/design-plan.md` | specs and task-plan skills that need implementation-order stages |
| Generated technical spec | internal-consumption | `agent/document-templates/agent-hub/technical-spec.md` | `agent/skills/dev-generate-spec/SKILL.md` |
| Operational finding report | internal-consumption | `agent/document-templates/agent-hub/operational-finding-report.md` | `agent/skills/ah-report-finding/SKILL.md` |
| Code review output | internal-consumption | `agent/document-templates/review/code-review.md` | review standards and `review-audit-*` skills |
| Devlog day | vault-assetization | `agent/document-templates/obsidian/devlog-day.md` | `learn-log-day` and devlog workflows |
| Cross-project learning | vault-assetization | `agent/document-templates/obsidian/cross-project-learning.md` | `learn-log-day _cross-project learning` |
| Project learning index | vault-assetization | `agent/document-templates/obsidian/learning-index.md` | project-bound learning logs |
| Devlog hub | vault-assetization | `agent/document-templates/obsidian/devlog-hub.md` | project devlog hub files |
| Topic note | vault-assetization | `agent/document-templates/obsidian/topic-reference.md` | project resource/topic notes |
| Consulting company record | vault-assetization | `agent/document-templates/consulting/company-history.md` | `consulting-log-session` |
| Project record | vault-assetization | `agent/document-templates/project/project-record.md` | private project records |
| Daily note | vault-assetization | `agent/document-templates/obsidian/daily-note.md` | generic note creation |
| Inbox note | vault-assetization | `agent/document-templates/obsidian/inbox-note.md` | generic inbox capture |
| Generic note | vault-assetization | `agent/document-templates/obsidian/generic-note.md` | generic note creation |

## Support Contracts

These rows are not document body templates. They stay here because template
review depends on them.

| Support contract | Canonical owner | Used by |
|------------------|-----------------|---------|
| Obsidian format contract | `agent/skills/obsidian-obsidian-markdown/references/OBSIDIAN-FORMAT.md` | all Obsidian vault Markdown templates |
| Obsidian tag taxonomy | `agent/skills/obsidian-obsidian-markdown/references/TAG-TAXONOMY.md` | all Obsidian frontmatter `tags` |
| Obsidian audience policy | `agent/skills/obsidian-obsidian-markdown/references/VAULT-AUDIENCE.md` | vault folder README and style decisions |
| Obsidian project folder shape | `agent/skills/obsidian-obsidian-markdown/references/PROJECT-DOCS-STRUCTURE.md` | project-root and role-folder placement |
| Obsidian note inspection | `agent/skills/obsidian-fix-format/references/NOTE-INSPECTION-CHECKLIST.md` | manual review or bulk cleanup of vault notes |
| Machine path config | `agent/skills/ah-manage-config/machine-paths.template.json` | `ah-manage-config` |
| Repo path config | `agent/skills/ah-manage-config/repo-paths.template.json` | `ah-manage-config` |
| Slack config example | `agent/config/slack.json.example` | Slack config setup |

## Consumption Phases

| Phase | Use for | Review emphasis |
|-------|---------|-----------------|
| internal-consumption | PR bodies, Linear issues, specs, milestones, design plans, reviews, operational reports | scriptability, canonical status/source fields, consumer format, low operator burden |
| vault-assetization | Obsidian notes, learnings, topics, project records, consulting records | retrieval, tags, wikilinks, frontmatter, durable reading value |

Do not make one template serve both phases. If an internal-consumption artifact
becomes worth keeping as knowledge, create or update a vault-assetization note in
a separate step.

## Ownership Rules

| If changing | Then |
|-------------|------|
| skill-managed template | put reusable body templates in `agent/document-templates/`; keep skill-specific lifecycle rules in the skill's `references/` folder |
| repo-wide output format | put reusable body templates in `agent/document-templates/`; keep policy/checklists in `agent/standards/` |
| vault or personal note scaffold | keep it under `agent/document-templates/obsidian/` |
| JSON setup shape | keep it next to the owning config skill or config file |
| superseded template | leave a redirect stub with `status: superseded` and `superseded-by:` |
| Obsidian frontmatter | use tags that exist in `TAG-TAXONOMY.md`; add the taxonomy row in the same change if a new tag is required |

## Format Rules

| Area | Rule |
|------|------|
| Operational prose | English only |
| Korean user-facing examples | allowed inside template bodies |
| Frontmatter | include `status:` for standards and references that act as policy |
| Placeholders | use one style per file; prefer `{NAME}` inside examples and `{{NAME}}` inside vault templates |
| Obsidian tags | include exactly one `type/` tag and exactly one `project/` tag |
| Lists | enumerate every valid item or point to the owning registry |
| Future work | do not add promised future work unless the template is explicitly a roadmap or follow-up tracker |
| Backticks | keep Markdown bodies in files or temp body files; do not pass backticks through shell inline body arguments |

## Consumer Checks

Run `node scripts/validate-llm-first.mjs --check document-templates` after
changing any file under `agent/document-templates/`.
