---
description: "Review commands, skills, and standards for consistency and compatibility"
argument-hint: "[commands|skills|standards|all] [pattern]"
allowed-tools: "Glob, Grep, Read, Edit, Write, AskUserQuestion"
---

# ah-review-skills

Scan command, skill, and standards files for format, content, and compatibility issues, then interactively fix them.

**Primary use case:** After a model update, review all commands, skills, and standards for consistency and compatibility.
## Target

$ARGUMENTS

**If no argument is provided, show usage and stop. NEVER auto-execute.**
```
Usage: /ah-review-skills <scope> [pattern]

Scope:
  commands    — Review command files only
  skills      — Review skill files only
  standards   — Review standards files only
  all         — Review commands, skills, and standards

Pattern (optional):
  art-*       — Match by prefix
  drink-log   — Match exact name
  review-*    — Match review-related standards

Examples:
  /ah-review-skills all              — Review everything
  /ah-review-skills commands         — Review all commands
  /ah-review-skills skills           — Review all skills
  /ah-review-skills standards        — Review all standards
  /ah-review-skills commands art-*   — Review art-related commands only
  /ah-review-skills skills ue-*      — Review UE-related skills only
  /ah-review-skills standards review-* — Review code review standards only
  /ah-review-skills all drink-*      — Review drink-related files
```

## Command Checklist (12 checks)

Apply these checks to each command file (`agent/commands/*.md`).

### Format (F1–F4)

- **F1. Frontmatter field order:** `description` → `argument-hint` → `allowed-tools`
- **F2. `allowed-tools` specificity:** `Bash` alone is forbidden. Must use patterns like `Bash(git:*)` or `Bash(python:*)`. Non-Bash tools (Glob, Read, Edit) are fine as-is.
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

## Skill Checklist (11 checks)

Apply these checks to each skill file (`agent/skills/*/SKILL.md`).

### Structure (S1–S2)

- **S1. Required sections present:** Title (`# name`) and Purpose section. Both must exist.
- **S2. Title matches directory name:** The H1 title must match the parent directory name (e.g., `# drink-log` in `skills/drink-log/SKILL.md`).

Note: Version and Changelog fields are NOT required — versioning is tracked via git only.

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

## Standards Checklist (6 checks)

Apply these checks to each standards file (`agent/standards/**/*.md`).

### Structure (ST1–ST3)

- **ST1. H1 title present:** Must have exactly one H1 (`# Title`) at the top.
- **ST2. Heading hierarchy:** No skipped levels (e.g., H1 → H3 without H2). Sections should use H2+.
- **ST3. Line count:** WARN if over 500 lines, FAIL if over 800. Large standards should be split or reference supporting files.

### References (SR1–SR3)

- **SR1. Listed in standards index:** The file must appear in `agent/standards/index.md`. WARN if missing — either add to index or question if the file is still needed.
- **SR2. Cross-references valid:** Any paths to other files (`~/.claude/...`, `@path/...`) must point to files that actually exist. Verify with Glob.
- **SR3. Internal consistency:** If the standard references specific commands or skills by name, those must exist. Verify with Glob against `agent/commands/{name}.md` or `agent/skills/{name}/SKILL.md`.

## Workflow

### Step 1: Parse Scope

Parse `$ARGUMENTS` to determine:
- **Scope**: `commands`, `skills`, `standards`, or `all`
- **Pattern** (optional): glob pattern to filter files

### Step 2: Scan

Glob for files based on scope:
- Commands: `agent/commands/{pattern}.md` (default pattern: `*`)
- Skills: `agent/skills/{pattern}/SKILL.md` (default pattern: `*`)
- Standards: `agent/standards/**/{pattern}.md` (default pattern: `*`)

Read each matched file.

### Step 3: Analyze

For each file, run the appropriate checklist:
- Command files → Command Checklist (F1–F4, C1–C5, X1–X3)
- Skill files → Skill Checklist (S1–S2, SC1–SC4, SF1–SF3, SX1–SX2)
- Standards files → Standards Checklist (ST1–ST3, SR1–SR3)

Record per check:
- `PASS` — check passed
- `WARN` — minor issue (LOW severity)
- `FAIL` — needs fix (HIGH severity)

Skip this command's own file (`ah-review-skills.md`) from review.

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
   | S1 | Required sections | WARN | Missing Purpose section |
   ```

   ```
   ## [standards] agent-workflow.md (1 issue)

   | # | Check | Status | Detail |
   |---|-------|--------|--------|
   | SR3 | Internal consistency | WARN | References `meta-delegate-task` command which does not exist |
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

### Standards

| File | Issues | Fixed | Skipped |
|------|--------|-------|---------|
| slash-commands.md | 1 | 1 | 0 |
| javascript.md | 0 | — | — |

**Total:** X files scanned (Y commands, Z skills, W standards), N issues found, M fixed, K skipped
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
