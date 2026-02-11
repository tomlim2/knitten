# General Learnings

Last updated: 2026-02-11

---

## Conventions Discovered

Patterns specific to this codebase.

| Pattern | Why It Matters |
|---------|----------------|

---

## What Worked

Approaches worth repeating.

### Progressive Disclosure for Claude Code Skills
- **Date**: 2026-02-11
- **Context**: SKILL.md files were bloated with Version/Changelog (wasting Level 2 tokens) and lacked frontmatter description (weak Level 1 auto-loading)
- **Solution**: Applied official 3-level progressive disclosure pattern:
  - Level 1: Added YAML frontmatter `description` with "Use when..." trigger context to all 29 skills
  - Level 2: Removed Version/Changelog from SKILL.md (version tracking via git only)
  - Level 3: Split 500+ line files (meta-new-skill, meta-private-guide) into SKILL.md + reference.md
- **Why it worked**: Descriptions now appear in system context for better auto-loading. SKILL.md stays concise. Detailed reference loads on-demand only when Claude needs it.

---

## What Failed

Approaches that seemed good but weren't.

---

## Gotchas

Non-obvious issues that cause problems.

| Issue | How to Handle |
|-------|---------------|
