---
status: accepted
domains: obsidian
repo-keys: agent-hub
languages: markdown,yaml
task-types: authoring,implementation
context-profile: obsidian-vault
exclude-when: rust,web,unreal
---
# Obsidian Document Format Standard

Format rules applied to all documents in the Obsidian vault.

---

## Frontmatter (required)

All `.md` files must include YAML frontmatter:

```yaml
---
title: "Document title"
tags:
  - type/devlog
  - project/shotloom
date: YYYY-MM-DD
source: agent
---
```

- `title`: document title (double-quoted)
- `tags`: structured axes — includes exactly one `type/...` tag and exactly one `project/...` tag; see tag taxonomy below
- `date`: creation date or original authoring date
- `source`: origin. Allowed values: `agent`, `manual`, `notion-export`, `codex`, `claude-code`

Do not add a top-level `type:` frontmatter field. Document type is encoded only as a `type/...` tag.

---

## Structure

```markdown
---
frontmatter
---

# Title

{1-2 sentence summary}

---

## Section 1

content

## Section 2

content
```

### Rules

1. **Exactly one H1** — immediately after frontmatter, matches title
2. **Section separator** — `---` horizontal rule between major sections
3. **Blank lines** — one blank line before and after headings
4. **Lists** — use `-` (ordered lists use `1.`)
5. **Code / paths** — inline `backtick`, block with triple backtick
6. **Images** — `![[folder/file.png]]` wikilink only (no markdown image links)
7. **Internal links** — `[[Note Name]]` wikilink
8. **External links** — `[text](URL)` markdown link. **Never add external links in `type/devlog` documents** — devlogs rot quickly and dead links accumulate. Reference resources via `[[wikilink]]` to a dedicated reference note instead.
9. **Callouts** — `> [!tip]`, `> [!warning]`, `> [!info]`, `> [!note]`, `> [!abstract]`, `> [!quote]`. Use Obsidian's standard callout vocabulary only.
10. **Tags** — use frontmatter `tags` field; inline `#tag` only at document footer

---

## Filename Convention

Folder and frontmatter carry routing identity. Filename stays short and stable.

Project-folder structure is owned by `PROJECT-DOCS-STRUCTURE.md`. Use that standard before creating or moving any file under the configured project root.

| Folder / note type | Pattern | Rule |
|--------------------|---------|------|
| project day log | `projects/<project>/days/YYYY-MM-DD.md` | One canonical day file per project per date |
| same-day split | `projects/<project>/days/YYYY-MM-DD/<slug>.md` | Use only when merge would hide a distinct artifact |
| learning | `learnings/learning-<slug>.md` or `projects/<project>/learnings/YYYY-MM-DD.md` | Keep existing folder convention; do not add ticket IDs |
| durable docs | `plans/<slug>.md`, `topics/<slug>.md`, `specs/<slug>.md`, `decisions/<slug>.md` | Slug names the concept, not the project/type |
| ops run | `ops/runs/YYYY-MM-DD-HHMM-<slug>.md` | Timestamp allowed because run order matters |
| folder scope | `README.md` | Only for folder audience/scope |

Do not encode topic, ticket, PR, `daily`, `devlog`, project name, or document type in `days/` filenames. Put those details in `title`, H1, `tags`, and the first paragraph.

Examples:

| Prefer | Avoid |
|--------|-------|
| `days/2026-04-21.md` | `days/2026-04-21-pr-review.md` |
| `days/2026-04-21.md` | `days/2026-04-21-daily.md` |
| `days/2026-04-21.md` | `days/devlog-2026-04-21.md` |
| `plans/obsidian-contract-cleanup.md` | `plans/agent-hub-plan-obsidian-contract-cleanup.md` |

---

## Tag Convention

**Full taxonomy (read before tagging): `~/.claude/skills/obsidian-obsidian-markdown/references/TAG-TAXONOMY.md`**

Structured tag axes: `type/` (always) + `project/` (always) + optional axes from `TAG-TAXONOMY.md`, including `area/`, `fmt/`, `lang/`, `lib/`, `sys/`, `tech/`, `llm/`, `hobby/`, and `status/`.

Quick reference:

| Document type | Required tags |
|---------------|---------------|
| devlog day (`days/YYYY-MM-DD.md`) | `type/devlog`, `project/{name}` |
| learning (`learnings/{slug}.md`) | `type/learning`, `project/{name}` |
| analysis or decision | `type/analysis` or `type/decision`, `project/{name}`, `area/...` |
| AI prompt / workflow | `type/reference`, `llm/{model}` (all models used) |
| Code / library reference | `type/reference`, `lang/{lang}`, `lib/{lib}` |
| CINEV work (non-shotloom) | `type/devlog`, `project/cinev`, `area/...` |

Full axis definitions, per-file examples, and flat→nested migration table → taxonomy standard above.

---

## Notion Archive Migration

When migrating notion-export documents to Obsidian:

1. Add frontmatter (`source: notion-export`, original date)
2. Remove duplicate H1 (keep exactly one)
3. Strip HTML remnants — `<div>`, `<span>`, `<p>`, `<br>`, `<a>`, and any other tags Notion exports.
4. Convert image paths to wikilinks (`![[folder/file.png]]`)
5. Decode URL-encoded paths
6. Clean up empty tables and blank lines
7. Move Notion metadata (created/edited timestamps) → frontmatter `date`, remove from body
8. Remove inline category tags at document footer (consolidate into frontmatter tags)
