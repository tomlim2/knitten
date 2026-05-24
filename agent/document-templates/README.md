---
status: accepted
---

# Document Templates

Canonical home for document body templates used by Knitten.

## Rule

When a command, skill, standard, or workflow needs a reusable document body, put
the body in this folder. The caller stores routing, input parsing, validation,
and execution steps only.

## Inventory

| Folder | Owns |
|--------|------|
| `agent-hub/` | specs, milestones, design plans, generated technical specs |
| `consulting/` | consulting history records |
| `github/` | GitHub pull request body templates |
| `linear/` | Linear issue body templates |
| `obsidian/` | Obsidian vault note templates |
| `project/` | project record templates |
| `review/` | review output templates |

## Consumption Phase

Templates split by the phase that consumes them. This is a review and routing
classification only; current folder paths remain stable until a separate
migration spec moves files.

| Phase | Purpose | Families |
|-------|---------|----------|
| internal-consumption | Agent, workflow, tracker, PR, review, design plan, or spec output used to run work. Optimize for scriptability, status, and consumer fit. | `agent-hub/`, `github/`, `linear/`, `review/` |
| vault-assetization | Obsidian-facing notes meant for later retrieval, learning, or durable personal/project records. Optimize for tags, links, frontmatter, and search. | `obsidian/`, `consulting/`, `project/` |

If a workflow starts as internal-consumption and later becomes knowledge worth
keeping, create or update a vault-assetization note in a separate step instead
of making the operational template carry both purposes.

## Caller Contract

| Caller type | Rule |
|-------------|------|
| command | read a template from this folder, then create external state |
| skill | read a template from this folder, then fill or patch a file |
| standard | point here instead of embedding a full body template |
| runtime mirror | keep only when a platform requires a fixed path |

## Consumer Format Contract

| Template path | Consumer | Format check |
|---------------|----------|--------------|
| `github/*.md` | GitHub PR body | no YAML frontmatter; `.github/pull_request_template.md` mirrors the body shape |
| `linear/*.md` | Linear issue body builder | has `status:` frontmatter; contains fenced `markdown` body examples |
| `obsidian/*.md` | Obsidian vault note | has `title`, `tags`, `date`, `source`; exactly one `type/` tag; exactly one `project/` tag; first body heading is one H1 |
| `consulting/*.md` | Obsidian vault note | same as `obsidian/*.md` |
| `project/*.md` | Obsidian vault note | same as `obsidian/*.md` |
| `agent-hub/*.md` | agent-hub docs skill | has `status:` frontmatter; contains fenced generated-body examples |
| `review/*.md` | review-output formatter | has `status:` frontmatter; contains review output sections |
| `README.md` | LLM template index | has `status:` frontmatter; lists folders and consumer contract |

## Review Lens

| Phase | Primary checks |
|-------|----------------|
| internal-consumption | canonical status/source fields, index mapping, low capture burden, deterministic script behavior, external consumer format |
| vault-assetization | valid Obsidian frontmatter, tag taxonomy, wikilink/retrieval value, one H1, long-term readability |

## Runtime Mirrors

| Mirror | Canonical template | Reason |
|--------|--------------------|--------|
| `.github/pull_request_template.md` | `github/pull-request.md` | GitHub reads only `.github/pull_request_template.md` |
