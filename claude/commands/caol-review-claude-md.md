---
description: "Review Claude Code entry document against official docs and update"
allowed-tools: "Read, Edit, Write, Glob, Grep, WebFetch, WebSearch, AskUserQuestion"
---

# caol-review-claude-md

Periodic review and update of root `CLAUDE.md` plus the deploy shim `~/.claude/CLAUDE.md` against the latest official Claude Code documentation.

**Primary use case:** After a model update or periodically, ensure the Claude entry document imports `SYSTEM.md`, stays thin, and reflects the latest official Claude Code features.
## Checklist (12 checks)

### Accuracy (A1–A4)

- **A1. Cross-platform paths:** No hardcoded OS paths (`D:\`, `/Users/`). Use `~/.claude/` or `<repo>/` everywhere.
- **A2. Architecture tree matches reality:** Glob `~/.claude/commands/*.md` and `~/.claude/skills/*/SKILL.md` — counts and key entries should reflect actual state.
- **A3. Standards index matches reality:** Every file in `~/.claude/standards/*.md` should be listed in `~/.claude/standards/index.md`.
- **A4. Referenced files exist:** All `@import` paths and referenced files must point to existing files. Verify with Glob.

### Official Alignment (O1–O4)

- **O1. Skills/commands description:** Must reflect the unified system (commands merged into skills). Check official: `https://code.claude.com/docs/en/skills`
- **O2. Frontmatter fields complete:** All official frontmatter fields must be documented. Check official for any new fields added.
- **O3. New features coverage:** Check official docs for features not yet mentioned (new frontmatter fields, new memory types, new patterns). Key pages to check:
  - `https://code.claude.com/docs/en/skills` — skills system
  - `https://code.claude.com/docs/en/memory` — memory/CLAUDE.md system
- **O4. Deprecated patterns:** Flag anything in the Claude entry document that contradicts current official docs.

### Efficiency (E1–E4)

- **E1. Line count:** CLAUDE.md must stay ≤ 150 lines. This file is loaded into every Claude Code session — every line costs context. WARN if over 120, FAIL if over 150.
- **E2. Actionable content only:** Flag non-actionable content (motivational quotes, explanatory prose for humans, FAQ). CLAUDE.md should contain imports and harness-specific references, not shared policy duplicates.
- **E3. Examples belong in standards:** Detailed code examples, patterns, and multi-line code blocks should live in `standards/` files (e.g., `command-skill-reference.md`), not in CLAUDE.md. CLAUDE.md should reference them with links. WARN if code blocks exceed 10 lines total.
- **E4. Table density:** Tables with 10+ rows should be reviewed for consolidation (group related rows) or relocation to standards. WARN if any table exceeds 15 rows.

### Consistency (K1–K2)

- **K1. Version bumped:** If changes are made, the Version field must be incremented.
- **K2. Changelog updated:** New changelog entry must describe what changed.

## Workflow

### Step 1: Read Current State

1. Read root `CLAUDE.md`
2. Read `~/.claude/CLAUDE.md`
3. Verify root `CLAUDE.md` imports `SYSTEM.md` before harness-specific imports
4. Verify `~/.claude/CLAUDE.md` imports `../CLAUDE.md`
5. Count lines, note version
6. Glob commands and skills to get actual counts

### Step 2: Fetch Official Docs

Fetch and extract key info from:
1. `https://code.claude.com/docs/en/skills` — skills format, frontmatter fields, new features
2. `https://code.claude.com/docs/en/memory` — CLAUDE.md format, memory types, best practices

Extract:
- Official frontmatter field list
- Any new features or patterns
- Best practices and recommendations
- Deprecated or changed patterns

### Step 3: Analyze

Run all 12 checks. For each, record:
- `PASS` — check passed
- `WARN` — minor issue
- `FAIL` — needs fix

### Step 4: Present Findings

Display results in a table:

```
## CLAUDE.md Review

**Current version:** X.Y.Z
**Line count:** N lines
**Model:** [current model]

| # | Check | Status | Detail |
|---|-------|--------|--------|
| A1 | Cross-platform paths | PASS | — |
| A2 | Architecture tree | WARN | Shows 39 commands, actual count is 42 |
| O2 | Frontmatter fields | FAIL | Missing `hooks` field |
| ... | ... | ... | ... |
```

### Step 5: Interactive Fix

For each FAIL or WARN item:

1. Show the specific issue and proposed fix
2. Ask the user (via AskUserQuestion) whether to:
   - **Apply** — make the change
   - **Skip** — leave as-is
   - **Custom** — user provides alternative

3. On approval, apply edits. Bump version and add changelog entry.

### Step 6: Report

Output final summary:

```
## Review Summary

**Date:** YYYY-MM-DD
**Model:** [current model]
**Version:** X.Y.Z → X.Y.Z (if changed)
**Line count:** N → M lines

| Check | Status | Action |
|-------|--------|--------|
| A1 | PASS | — |
| O2 | FAIL → FIXED | Added `hooks` field |
| ... | ... | ... |

**Official docs checked:**
- skills page: [date fetched]
- memory page: [date fetched]
```

### Step 7: Save Report

Save the review report to:
```
~/.claude/private/claude-md-reviews/YYYY-MM-DD.md
```

Create the directory if it doesn't exist.

Include in the saved report:
- Review date, model version, CLAUDE.md version
- Full checklist results
- Official docs diff (new features found, deprecated patterns)
- Changes applied
