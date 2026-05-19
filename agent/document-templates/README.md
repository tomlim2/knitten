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
| `agent-hub/` | specs, milestones, generated technical specs |
| `consulting/` | consulting history records |
| `github/` | GitHub pull request body templates |
| `linear/` | Linear issue body templates |
| `obsidian/` | Obsidian vault note templates |
| `project/` | project record templates |
| `review/` | review output templates |

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

## Runtime Mirrors

| Mirror | Canonical template | Reason |
|--------|--------------------|--------|
| `.github/pull_request_template.md` | `github/pull-request.md` | GitHub reads only `.github/pull_request_template.md` |
