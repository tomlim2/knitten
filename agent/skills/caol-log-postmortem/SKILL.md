---
description: "Record a finished project — auto-explore codebase, log tech stack, LOC, techniques, and learnings for portfolio."
allowed-tools: Read, Write, Edit, Glob, Grep, Task, Bash(wc:*), Bash(git:*), Bash(cloc:*), Bash(ls:*)
argument-hint: "<project-path-or-repo-name> [subfolder]"
---

# caol-log-postmortem

Record a completed project or task by auto-exploring the codebase and generating a structured project record.

## Purpose

Used after completing a project or task to create a record for future reference. Auto-explores the codebase to extract tech stack, LOC, module structure, and key techniques into a structured record. Can be reused for portfolio, resume, and retrospectives.

---

## Arguments

- `<project-path-or-repo-name>` - Project path or name registered in `repo-paths.json`
- `[subfolder]` - Target a specific subdirectory (e.g., `web/matcap-painter`)

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage:
```
/caol-log-postmortem anju web/matcap-painter
/caol-log-postmortem /Users/younsoolim/Desktop/www/some-project
/caol-log-postmortem mega-melange
```

---

## Workflow

1. **Resolve Project Path** - repo-paths.json lookup or direct path
2. **Explore Codebase** - Task(Explore) for structure, LOC, tech stack, architecture, git history
3. **Ask Context** - Ask about motivation, type, and whether to add to portfolio
4. **Generate Record** - Template-based structured record generation
5. **Show & Confirm** - User review and edits
6. **Save** - Save to Obsidian vault, optionally add to portfolio

---

## Output

| Purpose | Path |
|---------|------|
| **Postmortem (always)** | `!`bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh doc postmortem`/{project-name}.md` |
| **Portfolio (optional)** | configured project portfolio topic |

---

## Additional Resources

For the complete workflow steps, markdown template, and output guidelines, see [reference.md](reference.md).
