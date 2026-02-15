---
description: "Review JS/CSS code against coding standards"
argument-hint: "[file, glob, or diff range]"
allowed-tools: "Bash(git:*), Read, Grep, Glob"
---

# review-audit-web

Review JavaScript/CSS code changes against coding standards.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `review-audit-web`

## Instructions

You are tasked with reviewing web code (JavaScript and CSS). Follow the review standards below based on file type:

- **JavaScript** (.js, .jsx, .ts, .tsx): `~/.claude/standards/review-code-javascript.md`
- **CSS** (.css, .scss, .less): `~/.claude/standards/review-code-css.md`

For files with both JS and CSS concerns (e.g., JSX with inline styles), apply both checklists.

### Step 1: Determine Review Scope

{{#if input}}
Review scope specified by user: "{{input}}"

Parse the input:
- If it's a file path → review that specific file
- If it's a glob pattern → review matching files
- If it's a diff range (e.g., `HEAD~3`) → review changes in that range
- If it's "staged" → review `git diff --staged`
{{else}}
No specific scope provided. Review all uncommitted changes:
```bash
git diff --name-only
git diff --staged --name-only
```
If no uncommitted changes exist, review the latest commit:
```bash
git diff --name-only HEAD~1
```
{{/if}}

### Step 2: Filter by File Type

From the files in scope, keep only web files:
- **JavaScript**: `.js`, `.jsx`, `.ts`, `.tsx`
- **CSS**: `.css`, `.scss`, `.less`

Skip all other file types (images, configs, markdown, etc.).

If no web files are found, inform the user and exit.

### Step 3: Review

For each file in scope:
1. Read the full file content (or changed lines if reviewing a diff)
2. Determine which checklists apply based on file extension
3. Apply all checklist items from the matching review standard(s)
4. Record findings with severity, location, and suggested fixes

### Step 4: Output

Follow the output format defined in `~/.claude/standards/review-template.md`.

- **Standards Applied** lists which checklists were used (JavaScript, CSS, or both)
- **Standards Compliance** section shows pass/fail per applicable standard
- Present findings grouped by file, with severity counts and a final verdict

## Example Usage

**Review all uncommitted changes:**
```
/review-code-web
```

**Review a specific file:**
```
/review-code-web src/components/Header.jsx
```

**Review CSS files:**
```
/review-code-web src/styles/*.css
```

**Review changes in last 3 commits:**
```
/review-code-web HEAD~3
```

**Review staged changes only:**
```
/review-code-web staged
```
