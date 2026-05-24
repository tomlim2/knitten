---
description: "Audit HTML/CSS/JS for UX/UI — layout, interaction, accessibility, and visual consistency via 70+ item checklist."
domains: web
repo-keys: agent-hub,mmd-anju,ta-portfolio
languages: css,javascript,typescript
frameworks: astro,three
task-types: review
context-profile: web-review
context-standards: standards/review/review-template.md
exclude-when: rust,unreal,obsidian
---

# review-audit-ux

Static UX/UI code audit against a 70+ item checklist.

## Skill-owned standards

Read these references only when their scope appears:

- `references/REVIEW-UX.md` — UX/UI layout, interaction, accessibility, motion, consistency, typography, semantic HTML, performance UX, or forms
- `references/REVIEW-UX-WRITING.md` — UI text, button labels, error messages, empty states, and confirmation copy
- `../frontend-design/references/UI-DESIGN.md` — UI/UX design principles when the audit needs design baseline context
- `../frontend-design/references/DESIGN-SYSTEM.md` — Typo-base design system when the audited UI claims or uses it

## Purpose

Detect UX/UI issues by reading HTML, CSS, and JavaScript source files without running the application. Covers layout, responsiveness, interaction patterns, accessibility, animation, consistency, typography, semantic HTML, performance UX, and forms.

---

## Usage

```
/review-audit-ux [file, glob, or directory]
```

**Examples:**
- `/review-audit-ux` — Audit all uncommitted changes
- `/review-audit-ux src/` — Audit all files in a directory
- `/review-audit-ux index.html` — Audit a specific file
- `/review-audit-ux web/matcap-painter/` — Audit a web app directory
- `/review-audit-ux staged` — Audit staged changes only

---

## Standards Applied

| Category | Items | Checklist Section |
|----------|-------|-------------------|
| Layout & Overflow | 7 | `review-ux.md` §1 |
| Responsive Design | 7 | `review-ux.md` §2 |
| Interaction Patterns | 9 | `review-ux.md` §3 |
| Accessibility | 9 | `review-ux.md` §4 |
| Animation & Motion | 6 | `review-ux.md` §5 |
| Consistency & Design Tokens | 6 | `review-ux.md` §6 |
| Typography & Readability | 7 | `review-ux.md` §7 |
| Semantic HTML | 6 | `review-ux.md` §8 |
| Performance UX | 6 | `review-ux.md` §9 |
| Forms & Input UX | 8 | `review-ux.md` §10 |

Output follows the internal-consumption review template:
`agent/document-templates/review/code-review.md`.

---

## Instructions
### Step 1: Determine Review Scope

Parse the argument:
- If it's a file path → audit that specific file
- If it's a directory → audit all `.html`, `.css`, `.js`, `.jsx`, `.ts`, `.tsx` files in it
- If it's a glob pattern → audit matching files
- If it's `staged` → audit `git diff --staged`
- If no argument → audit all uncommitted changes, or latest commit if clean

### Step 2: Read the Checklist

Read `references/REVIEW-UX.md` for the full checklist.

### Step 3: Read Source Files

Read all files in scope. For each file, note:
- HTML structure and semantic elements
- CSS layout, overflow, animation, and responsive patterns
- JavaScript interaction handlers, loading states, error handling

### Step 4: Audit

Apply all 10 checklist sections. Skip sections marked **(if applicable)** if the codebase doesn't use that pattern (e.g., skip Forms if there are no forms).

For each finding, record:
- Severity (Critical / Error / Suggestion)
- File and line number
- Checklist item reference (e.g., LAYOUT-01, A11Y-03)
- What the code currently does
- What it should do

### Step 5: Output

Follow the output format defined in
`agent/document-templates/review/code-review.md`.

- Use **Standards Applied**: `review-ux.md` (UX/UI Audit)
- **Standards Compliance** section shows pass/fail per category (§1–§10)
- Group findings by severity, then by category

---

## Related

- `references/REVIEW-UX.md` — UX/UI audit checklist (70+ items)
- `references/REVIEW-UX-WRITING.md` — UX writing checklist
- `agent/document-templates/review/code-review.md` — Review output format
- `skills/review-audit-web/SKILL.md` — Code quality review (JS + CSS standards)
