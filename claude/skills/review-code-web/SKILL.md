# review-code-web

**Version:** 0.1.0

Review JavaScript and CSS code against coding standards checklists.

---

## Changelog

- **0.1.0** - Initial release

---

## Purpose

Unified web code review command that applies both JavaScript and CSS checklists in a single pass. Detects file types automatically and applies the matching review standard.

---

## Usage

```
/review-code-web [file, glob, or diff range]
```

**Examples:**
- `/review-code-web` — Review all uncommitted changes
- `/review-code-web src/components/Header.jsx` — Review a specific file
- `/review-code-web src/styles/*.css` — Review CSS files
- `/review-code-web HEAD~3` — Review changes in last 3 commits
- `/review-code-web staged` — Review staged changes only

---

## Standards Applied

| File Type | Checklist |
|-----------|-----------|
| `.js`, `.jsx`, `.ts`, `.tsx` | `review-code-javascript.md` |
| `.css`, `.scss`, `.less` | `review-code-css.md` |

Output follows `review-template.md` format.

---

## Related

- `commands/review-code-web.md` — Slash command definition
- `standards/review-code-javascript.md` — JS review checklist
- `standards/review-code-css.md` — CSS review checklist
- `standards/review-template.md` — Review output format
