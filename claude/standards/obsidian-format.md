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
source: notion-export | manual | claude
---
```

- `title`: document title (double-quoted)
- `tags`: structured axes — see tag taxonomy below
- `date`: creation date or original authoring date
- `source`: origin (notion-export, manual, claude)

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
9. **Callouts** — `> [!tip]`, `> [!warning]`, `> [!info]`, etc.
10. **Tags** — use frontmatter `tags` field; inline `#tag` only at document footer

---

## Tag Convention

**Full taxonomy (read before tagging): `~/.claude/standards/obsidian-tag-taxonomy.md`**

3-axis system: `type/` (always) + `project/` (always) + optional `area/`, `lang/`, `tool/`, `status/`.

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
3. Strip HTML remnants (`<div>`, `<span>`, etc.)
4. Convert image paths to wikilinks (`![[folder/file.png]]`)
5. Decode URL-encoded paths
6. Clean up empty tables and blank lines
7. Move Notion metadata (created/edited timestamps) → frontmatter `date`, remove from body
8. Remove inline category tags at document footer (consolidate into frontmatter tags)
