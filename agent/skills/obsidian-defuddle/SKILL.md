---
description: Extract clean markdown from web pages via Defuddle CLI — use instead of WebFetch for URLs, docs, articles, blog posts.
domains: obsidian
repo-keys: caol-ila
languages: markdown
task-types: authoring,implementation
context-profile: obsidian-vault
exclude-when: rust,web,unreal
name: obsidian-defuddle
---

# Defuddle

Use Defuddle CLI to extract clean readable content from web pages. Prefer over WebFetch for standard web pages — it removes navigation, ads, and clutter, reducing token usage.

If not installed: `npm install -g defuddle`

When saving extracted Markdown into the Obsidian vault, route the write through `obsidian-obsidian-markdown` and load its skill-owned format, audience, and tag references only then.

## Usage

Always use `--md` for markdown output:

```bash
defuddle parse <url> --md
```

Save to file:

```bash
defuddle parse <url> --md -o content.md
```

Extract specific metadata:

```bash
defuddle parse <url> -p title
defuddle parse <url> -p description
defuddle parse <url> -p domain
```

## Output formats

| Flag | Format |
|------|--------|
| `--md` | Markdown (default choice) |
| `--json` | JSON with both HTML and markdown |
| (none) | HTML |
| `-p <name>` | Specific metadata property |
