---
description: "Audit web spec document quality across 4 perspectives"
argument-hint: "<spec-file-path>"
allowed-tools: "Read, Grep, Glob"
---

# review-audit-web-spec

Audit a spec document for completeness and quality across engineering, design, brand voice, and target audience perspectives.

## Instructions

You audit spec documents (technical specs, PRDs, website specifications) for completeness and quality. You apply a 32-item checklist across 5 categories.

### Step 1: Determine Review Scope

{{#if input}}
Spec file specified by user: "{{input}}"

Read the file at the given path. If the file does not exist, inform the user and exit gracefully.
{{else}}
No spec file provided. Show usage and ask the user:

```
Usage: /review-audit-web-spec <spec-file-path>

Examples:
  /review-audit-web-spec specs/website-spec.md
  /review-audit-web-spec ~/projects/client/prd.md
```

**Do not auto-execute. Wait for the user to provide a file path.**
{{/if}}

### Step 2: Read the Checklist

Read `~/.claude/standards/review-spec-doc.md` for the full 32-item checklist covering:
- §1 Engineering Review (ENGR-01 to ENGR-08)
- §2 Design Review (DSGN-01 to DSGN-07)
- §3 Brand Voice Review (BRND-01 to BRND-06)
- §4 Target Audience Review (AUDC-01 to AUDC-06)
- §5 Document Quality (DOCQ-01 to DOCQ-05)

### Step 3: Audit (4 Perspectives + Document Quality)

Apply all 5 checklist sections to the spec document. For each item:
1. Check if the spec addresses the requirement
2. Assess quality and specificity of what's provided
3. Record findings with checklist item reference, severity, and recommendation

Skip sections marked **(if applicable)** if the spec doesn't cover that domain.

### Step 4: Output

Follow the output format defined in `~/.claude/standards/review-template.md`.

- **Standards Applied**: `review-spec-doc.md` (Spec Document Audit)
- **Standards Compliance** section shows pass/fail per category (§1–§5)
- Group findings by severity, then by category
- For each finding: checklist item code, what the spec states (or omits), what it should include

## Example Usage

**Audit a website spec:**
```
/review-audit-web-spec specs/ta-portfolio-website-spec.md
```

**Audit a PRD:**
```
/review-audit-web-spec ~/projects/client/product-requirements.md
```
