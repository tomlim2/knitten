---
description: "Review and update skill command files for consistency"
argument-hint: "[file pattern or 'all']"
allowed-tools: "Glob, Grep, Read, Edit, Write, AskUserQuestion"
---

# Review Skills

Scan command files for format, content, and compatibility issues, then interactively fix them.

**Primary use case:** After a model update, review all skills for consistency and compatibility.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `review-skills`

## Target

$ARGUMENTS

**If no argument is provided, show usage and stop. NEVER auto-execute.**
```
Usage: /review-skills <pattern or 'all'>

Examples:
  /review-skills all              — Review all commands
  /review-skills art-*            — Review art-related commands only
  /review-skills commit-m         — Review a single command
```

## Checklist

Apply these 11 checks to each command file.

### Format (F1–F4)

- **F1. Frontmatter field order:** `description` → `argument-hint` → `allowed-tools`
- **F2. `allowed-tools` specificity:** `Bash` alone is forbidden. Must use patterns like `Bash(git:*)`, `Bash(python:*)`, etc. Non-Bash tools (Glob, Read, Edit, etc.) are fine as-is.
- **F3. `argument-hint` present:** Required if the command accepts arguments (check for `$ARGUMENTS` or `{{input}}` usage).
- **F4. Heading structure:** H1 = command title, H2+ = sections.

### Content (C1–C4)

- **C1. Missing-argument guard:** Commands that use `$ARGUMENTS` or `{{input}}` must include a block like: "If no argument is provided, show usage and stop."
- **C2. Usage example:** At least one example showing how to invoke the command.
- **C3. Output format:** Defined output structure (code block, table, or structured markdown).
- **C4. Numbered steps:** Multi-step workflows should use numbered Steps (Step 1, Step 2, ...).

### Compatibility (X1–X3)

- **X1. Dynamic execution syntax:** `!backtick` expressions must be valid shell commands.
- **X2. Argument passing:** `$ARGUMENTS` and `{{input}}` should not be mixed in the same file. Pick one.
- **X3. External references:** Paths to agents, skills, or scripts must point to files that actually exist. Verify with Glob.

## Workflow

### Step 1: Scan

Glob for command files matching the user's pattern:
- `all` → `D:\vs\caol-ila\claude\commands\*.md`
- Pattern (e.g., `art-*`) → `D:\vs\caol-ila\claude\commands\{pattern}.md`
- Exact name → `D:\vs\caol-ila\claude\commands\{name}.md`

Read each matched file.

### Step 2: Analyze

For each file, run the 11-item checklist. Record:
- `PASS` — check passed
- `WARN` — minor issue (LOW severity)
- `FAIL` — needs fix (HIGH severity)

Skip this command's own file (`review-skills.md`) from review.

### Step 3: Interactive Fix

For each file with FAIL or WARN items:

1. Display the file name and its issues in a table:
   ```
   ## art-create-branch.md (2 issues)

   | # | Check | Status | Detail |
   |---|-------|--------|--------|
   | F1 | Field order | FAIL | `allowed-tools` before `description` |
   | C2 | Usage example | WARN | No example block found |
   ```

2. Ask the user (via AskUserQuestion) whether to:
   - **Fix all** — auto-fix all issues in this file
   - **Fix selected** — let user pick which to fix
   - **Skip** — move to next file

3. On approval, apply edits. Show a brief diff summary of what changed.

### Step 4: Report

After processing all files, output a final summary:

```
## Review Summary

**Date:** YYYY-MM-DD
**Model:** [current model]
**Scope:** [pattern used]

| File | Issues | Fixed | Skipped |
|------|--------|-------|---------|
| art-create-branch.md | 2 | 2 | 0 |
| commit-m.md | 0 | — | — |
| ... | ... | ... | ... |

**Total:** X files scanned, Y issues found, Z fixed, W skipped
```

### Step 5: Save Report

Save the review report to:
```
D:\vs\caol-ila\claude\private\skill-reviews\YYYY-MM-DD.md
```

Create the `skill-reviews` directory if it doesn't exist.

Include in the saved report:
- Review date and model version
- Full per-file issue breakdown (all 11 checks)
- Fix/skip status for each issue
- Enables tracking changes across model updates
