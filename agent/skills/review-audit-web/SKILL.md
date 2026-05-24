---
description: "Review JavaScript and CSS code against coding standards checklists. Use when reviewing frontend code quality."
domains: web
repo-keys: agent-hub,mmd-anju,ta-portfolio
languages: css,javascript,typescript
frameworks: astro,three
task-types: review
context-profile: web-review
context-standards: standards/review/review-template.md
exclude-when: rust,unreal,obsidian
---

# review-audit-web

Review JavaScript and CSS code against coding standards checklists.

## Skill-owned standards

Read these references only when their file type appears in the review scope:

- `references/REVIEW-CODE-JAVASCRIPT.md` — `.js`, `.jsx`, `.ts`, `.tsx`
- `references/REVIEW-CODE-CSS.md` — `.css`, `.scss`, `.less`
- `references/REVIEW-CODE-ASTRO.md` — `.astro`, Astro routes, endpoints, and config

## Purpose

Unified web code review command that applies both JavaScript and CSS checklists in a single pass. Detects file types automatically and applies the matching review standard.

---

## Usage

```
/review-audit-web [file, glob, or diff range]
```

**Examples:**
- `/review-audit-web` — Review all uncommitted changes
- `/review-audit-web src/components/Header.jsx` — Review a specific file
- `/review-audit-web src/styles/*.css` — Review CSS files
- `/review-audit-web HEAD~3` — Review changes in last 3 commits
- `/review-audit-web staged` — Review staged changes only

---

## Standards Applied

| File Type | Checklist |
|-----------|-----------|
| `.astro`, `astro.config.*`, `src/pages/api/**` | `REVIEW-CODE-ASTRO.md` |
| `.js`, `.jsx`, `.ts`, `.tsx` | `REVIEW-CODE-JAVASCRIPT.md` |
| `.css`, `.scss`, `.less` | `REVIEW-CODE-CSS.md` |

Output follows the internal-consumption review template:
`agent/document-templates/review/code-review.md`.

---

## Related

- `commands/review-audit-web.md` — Slash command definition
- `references/REVIEW-CODE-JAVASCRIPT.md` — JS review checklist
- `references/REVIEW-CODE-CSS.md` — CSS review checklist
- `references/REVIEW-CODE-ASTRO.md` — Astro review checklist
- `agent/document-templates/review/code-review.md` — Review output format
