---
status: accepted
---

# Spec Routing

## Route Matrix

| Request shape | Route | Reuse |
|---------------|-------|-------|
| Shotloom task implementation spec | Shotloom | `shotloom-draft-spec` |
| Code, directory, or branch diff technical spec | code-derived | `dev-generate-spec` template and analysis order |
| Web/product/PRD spec review | web spec review | `review-audit-web-spec` checklist |
| caol/Knitten policy, architecture, validator, path, skill/rule/standard work | caol operational spec | `caol-manage-spec` |
| Obsidian vault structure or note contracts | Obsidian docs | Obsidian rules/skills on demand |
| Unknown or mixed | intake-only | ask one short question or write draft |

## Existing Skill Reuse

| Skill | Load when | Use for |
|-------|-----------|---------|
| `dev-generate-spec` | spec from code/files/diff | code analysis order and technical spec template |
| `shotloom-draft-spec` | Shotloom implementation spec | full Shotloom contract |
| `shotloom-draft-task-plan` | Shotloom compatibility detail needed | conflict/update/output rules |
| `review-audit-web-spec` | web/product/PRD spec review | review checklist |
| `caol-make-skill` | implementing or changing spec-management skills | skill structure and routing metadata |
| `caol-resolve-doc-path` | spec needs repo or vault paths | resolver-backed paths |

## Evidence Order

1. User words and explicit decisions.
2. Cwd, git remote, and repo key.
3. Named files, file extensions, and frontmatter.
4. Existing specs, milestones, and briefings.
5. Routing metadata from `context-routing.json`.

Load only the selected route's heavy references.
