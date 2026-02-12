# General Learnings

Last updated: 2026-02-12

---

## Conventions Discovered

Patterns specific to this codebase.

| Pattern | Why It Matters |
|---------|----------------|
| Verbatim (copy) | "있는 그대로 똑같이 복사". 스킬 간 공유 파일(e.g., `run_in_editor.py`)을 변경 없이 그대로 복사할 때 사용하는 표현. |

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
| Claude Code Bash 샌드박스는 현재 세션의 작업 디렉토리(working directory) 내 경로만 접근 허용 | 다른 드라이브/경로의 파일을 Bash로 접근하려면 해당 디렉토리에서 Claude Code 세션을 열어야 함. 단, Read/Write/Edit 도구는 샌드박스 제한 없이 어디든 접근 가능. |
