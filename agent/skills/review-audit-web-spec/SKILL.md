---
description: "Audit technical specs and PRDs across engineering, design, brand, and audience perspectives for completeness."
domains: web
repo-keys: agent-hub,mmd-anju,ta-portfolio
languages: css,javascript,typescript
frameworks: astro,three
task-types: review
context-profile: web-review
context-standards: standards/review/review-template.md
exclude-when: rust,unreal,obsidian
---

# review-audit-web-spec

Audit spec documents across 4 perspectives: engineering, design, brand voice, and target audience.

## Skill-owned standards

Read `references/REVIEW-SPEC-DOC.md` only when auditing a technical spec, PRD, or website spec.

## Purpose

Most freelancers and small teams review specs from a single engineering perspective. This skill applies a 4-perspective audit (engineering, design, brand voice, target audience) plus document quality — the level of review only performed by 5+ person agencies.

---

## Usage

```
/review-audit-web-spec <spec-file-path>
```

**Examples:**
- `/review-audit-web-spec specs/website-spec.md` — Audit a specific spec file
- `/review-audit-web-spec ~/projects/client/prd.md` — Audit a PRD

---

## Standards Applied

| Category | Items | Checklist Section |
|----------|-------|-------------------|
| Engineering Review | 8 | `review-spec-doc.md` §1 |
| Design Review | 7 | `review-spec-doc.md` §2 |
| Brand Voice Review | 6 | `review-spec-doc.md` §3 |
| Target Audience Review | 6 | `review-spec-doc.md` §4 |
| Document Quality | 5 | `review-spec-doc.md` §5 |

Output follows the internal-consumption review template:
`agent/document-templates/review/code-review.md`.

---

## Instructions

### Step 1: Validate Argument

- Check if a file path argument is provided
- If no argument, show usage and ask the user for the spec file path. NEVER auto-execute.

### Step 2: Read the Spec Document

Read the full spec document. Note:
- Document structure and sections
- Content completeness per section
- Stated requirements, constraints, and goals

### Step 3: Read the Checklist

Read `references/REVIEW-SPEC-DOC.md` for the full 32-item checklist.

### Step 4: Audit (4 Perspectives + Document Quality)

Apply all 5 checklist sections sequentially:

**§1 Engineering Review (ENGR-01 to ENGR-08):**
- Check tech stack, requirements specificity, non-functional requirements, dependencies, deployment

**§2 Design Review (DSGN-01 to DSGN-07):**
- Check design system, responsiveness, accessibility, navigation, typography, media strategy

**§3 Brand Voice Review (BRND-01 to BRND-06):**
- Check brand positioning, tone consistency, value proposition, placeholder text

**§4 Target Audience Review (AUDC-01 to AUDC-06):**
- Check persona definition, content-persona mapping, CTA appropriateness, language level

**§5 Document Quality (DOCQ-01 to DOCQ-05):**
- Check coverage completeness, internal references, conflicts, traceability, prioritization

For each finding, record:
- Severity (Critical / Error / Suggestion)
- Checklist item reference (e.g., ENGR-02, BRND-05)
- What the spec currently states (or omits)
- What it should include or change

### Step 5: Output

Follow the output format defined in
`agent/document-templates/review/code-review.md`.

- Use **Standards Applied**: `review-spec-doc.md` (Spec Document Audit)
- **Standards Compliance** section shows pass/fail per category (§1–§5)
- Group findings by severity, then by category

---

## Related

- `references/REVIEW-SPEC-DOC.md` — Spec document audit checklist (32 items)
- `agent/document-templates/review/code-review.md` — Review output format
- `skills/review-audit-ux/SKILL.md` — UX/UI code audit
- `skills/review-audit-web/SKILL.md` — JS/CSS code quality review
