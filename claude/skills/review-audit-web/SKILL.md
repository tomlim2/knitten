---
description: "Review JavaScript and CSS code against coding standards checklists. Use when reviewing frontend code quality."
---

# review-audit-web

Review JavaScript and CSS code against coding standards checklists.

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
| `.js`, `.jsx`, `.ts`, `.tsx` | `review-code-javascript.md` |
| `.css`, `.scss`, `.less` | `review-code-css.md` |

Output follows `review-template.md` format.

---

## Related

- `commands/review-audit-web.md` — Slash command definition
- `standards/review/review-code-javascript.md` — JS review checklist
- `standards/review/review-code-css.md` — CSS review checklist
- `standards/review/review-template.md` — Review output format
