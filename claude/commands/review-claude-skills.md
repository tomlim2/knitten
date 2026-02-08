---
description: "Review commands and skills for consistency and compatibility"
argument-hint: "[commands|skills|all] [pattern]"
allowed-tools: "Glob, Grep, Read, Edit, Write, AskUserQuestion"
---

# Review Claude Skills

Scan command and skill files for format, content, and compatibility issues, then interactively fix them.

**Primary use case:** After a model update, review all commands and skills for consistency and compatibility.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `review-claude-skills`

## Target

$ARGUMENTS

**If no argument is provided, show usage and stop. NEVER auto-execute.**
```
Usage: /review-claude-skills <scope> [pattern]

Scope:
  commands    — Review command files only
  skills      — Review skill files only
  all         — Review both commands and skills

Pattern (optional):
  art-*       — Match by prefix
  drink-log   — Match exact name

Examples:
  /review-claude-skills all              — Review everything
  /review-claude-skills commands         — Review all commands
  /review-claude-skills skills           — Review all skills
  /review-claude-skills commands art-*   — Review art-related commands only
  /review-claude-skills skills ue-*      — Review UE-related skills only
  /review-claude-skills all drink-*      — Review drink-related commands and skills
```

## Command Checklist (12 checks)

Apply these checks to each command file (`~/.claude/commands/*.md`).

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
- **C5. Pre-execution reference:** Must include the pre-execution block: `**Before executing, read and execute:** ~/.claude/standards/command-pre-execution.md` with correct `$COMMAND_NAME` replacement. FAIL if missing entirely. WARN if present but `$COMMAND_NAME` doesn't match the filename.

### Compatibility (X1–X3)

- **X1. Dynamic execution syntax:** `!backtick` expressions must be valid shell commands.
- **X2. Argument passing:** `$ARGUMENTS` and `{{input}}` should not be mixed in the same file. Pick one.
- **X3. External references:** Paths to agents, skills, or scripts must point to files that actually exist. Verify with Glob.

## Skill Checklist (13 checks)

Apply these checks to each skill file (`~/.claude/skills/*/SKILL.md`).

### Structure (S1–S4)

- **S1. Required sections present:** Title (`# name`), Version (`**Version:**`), Changelog, Purpose. All four must exist.
- **S2. Title matches directory name:** The H1 title must match the parent directory name (e.g., `# drink-log` in `skills/drink-log/SKILL.md`).
- **S3. Version format:** Must follow semver pattern (`X.Y.Z`). Must be present on the line immediately after H1.
- **S4. Changelog entries:** At least one entry. Latest version in Changelog must match the Version field.

### Content (SC1–SC4)

- **SC1. Usage section:** Must include a Usage section with at least one example (code block or inline code).
- **SC2. Files section:** If the skill directory contains files other than SKILL.md, they should be listed or referenced.
- **SC3. Language consistency:** Documentation language should be consistent within the file (all English or all Korean, not mixed without reason).
- **SC4. Line count:** SKILL.md should be under 500 lines. WARN if over 500, FAIL if over 800. Move detailed reference to supporting files. *(Official recommendation)*

### Frontmatter (SF1–SF3)

- **SF1. `description` present:** Frontmatter should include a `description` field. Claude uses this to decide when to auto-load the skill. WARN if missing. *(Officially recommended)*
- **SF2. Valid frontmatter fields only:** Frontmatter fields must be from the official set: `name`, `description`, `argument-hint`, `disable-model-invocation`, `user-invocable`, `allowed-tools`, `model`, `context`, `agent`, `hooks`. FAIL on unknown fields (likely typos). *(Official spec)*
- **SF3. `name` format:** If `name` is present in frontmatter, it must be lowercase letters, numbers, and hyphens only, max 64 characters. *(Official spec)*

### Compatibility (SX1–SX2)

- **SX1. External references:** Paths referenced in the SKILL.md must point to files that actually exist. Verify with Glob.
- **SX2. Naming convention:** Directory name must follow `{category}-{verb}-{subject}` pattern (lowercase, hyphens only, max 64 characters). *(Official: lowercase+numbers+hyphens, max 64 chars)*

## Workflow

### Step 1: Parse Scope

Parse `$ARGUMENTS` to determine:
- **Scope**: `commands`, `skills`, or `all`
- **Pattern** (optional): glob pattern to filter files

### Step 2: Scan

Glob for files based on scope:
- Commands: `~/.claude/commands/{pattern}.md` (default pattern: `*`)
- Skills: `~/.claude/skills/{pattern}/SKILL.md` (default pattern: `*`)

Read each matched file.

### Step 3: Analyze

For each file, run the appropriate checklist:
- Command files → Command Checklist (F1–F4, C1–C5, X1–X3)
- Skill files → Skill Checklist (S1–S4, SC1–SC4, SF1–SF3, SX1–SX2)

Record per check:
- `PASS` — check passed
- `WARN` — minor issue (LOW severity)
- `FAIL` — needs fix (HIGH severity)

Skip this command's own file (`review-claude-skills.md`) from review.

### Step 4: Interactive Fix

For each file with FAIL or WARN items:

1. Display the file name and its issues in a table:
   ```
   ## [commands] art-create-branch.md (2 issues)

   | # | Check | Status | Detail |
   |---|-------|--------|--------|
   | F1 | Field order | FAIL | `allowed-tools` before `description` |
   | C2 | Usage example | WARN | No example block found |
   ```

   ```
   ## [skills] drink-log/SKILL.md (1 issue)

   | # | Check | Status | Detail |
   |---|-------|--------|--------|
   | S1 | Required sections | WARN | Missing Files section |
   ```

2. Ask the user (via AskUserQuestion) whether to:
   - **Fix all** — auto-fix all issues in this file
   - **Fix selected** — let user pick which to fix
   - **Skip** — move to next file

3. On approval, apply edits. Show a brief diff summary of what changed.

### Step 5: Report

After processing all files, output a final summary:

```
## Review Summary

**Date:** YYYY-MM-DD
**Model:** [current model]
**Scope:** [scope and pattern used]

### Commands

| File | Issues | Fixed | Skipped |
|------|--------|-------|---------|
| art-create-branch.md | 2 | 2 | 0 |
| clean-up.md | 0 | — | — |

### Skills

| File | Issues | Fixed | Skipped |
|------|--------|-------|---------|
| drink-log/SKILL.md | 1 | 1 | 0 |
| art-create-branch/SKILL.md | 0 | — | — |

**Total:** X files scanned (Y commands, Z skills), N issues found, M fixed, W skipped
```

### Step 6: Save Report

Save the review report to:
```
~/.claude/private/skill-reviews/YYYY-MM-DD.md
```

Create the `skill-reviews` directory if it doesn't exist.

Include in the saved report:
- Review date and model version
- Full per-file issue breakdown (all checks)
- Fix/skip status for each issue
- Enables tracking changes across model updates
