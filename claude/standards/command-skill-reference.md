# Command & Skill Reference

Detailed examples and patterns for writing Claude Code commands and skills.
Referenced from `~/.claude/CLAUDE.md`.

---

## Command Anatomy

```markdown
---
allowed-tools: Bash(git diff:*), Bash(git status:*), Read, Edit
description: Generate a git commit message based on staged changes
argument-hint: "[type]"
---

# Command Title

Instructions for Claude on how to execute this command.

## Dynamic Execution

Use !`command` to execute shell commands and inject results:
- Current status: !`git status`
- Staged changes: !`git diff --cached`

## Arguments

Access user-provided arguments via $ARGUMENTS variable.
```

### Example: Minimal Command

```markdown
---
allowed-tools: Bash(ls:*)
description: List Python files in current directory
---

# List Python Files

Run: !`ls *.py`

Show the user the list of Python files found.
```

---

## Skill Examples

### Git Commit Collector

**`skills/git-commit-collector/SKILL.md`**:
```markdown
# git-commit-collector

Git commit history extraction skill for Claude Code.

## Usage

Extract commits from a repository and save to the private commits folder.

## Files

- `extract_commits.py` - Main extraction script
```

**`skills/git-commit-collector/extract_commits.py`**:
- Well-documented Python script
- Accepts CLI arguments via `argparse`
- Outputs to `~/.claude/private/commits/` by default

---

## Common Patterns

### Pattern: Command Invokes Skill

**Command** (`commands/collect-commits.md`):
```markdown
---
allowed-tools: Bash(python:*)
description: Extract git commits for portfolio
---

Run the git commit collector:
!`python ~/.claude/skills/git-commit-collector/extract_commits.py $ARGUMENTS`
```

**Skill** (`skills/git-commit-collector/extract_commits.py`):
- Handles parsing, extraction, output
- Saves to `~/.claude/private/commits/`

### Pattern: Multi-Step Workflow

**Command** (`commands/clean-up.md`):
```markdown
---
allowed-tools: Glob, Grep, Read, Edit
description: Update CLAUDE.md based on codebase analysis
---

## Step 1: Scan
- Glob: `**/*.py`
- Grep: Common patterns

## Step 2: Analyze
- Read representative files
- Identify conventions

## Step 3: Update
- Edit CLAUDE.md sections
- Show diff before writing
```

### Pattern: Dynamic Context Injection

**Command** (`commands/commit-m.md`):
```markdown
---
allowed-tools: Bash(git:*)
description: Generate commit message
---

## Context
- Status: !`git status`
- Diff: !`git diff --cached`
- Recent commits: !`git log --oneline -10`

Now generate a message following conventional commit format...
```

---

## Private Folder

### What Goes in Private?

**Yes:** commit histories, project notes, cached API responses, personal TODOs
**No:** source code, shared config, secrets (use env vars)

### Recommended Structure

```
private/
├── commits/           # Git history extractions
│   ├── anju_commits.json
│   └── other_project_commits.json
├── notes/             # Project research and notes
│   └── unreal-optimization-ideas.md
└── cache/             # Temporary data
    └── texture-analysis.json
```

### Accessing Private Data

From commands:
```markdown
Read the commits: !`cat ~/.claude/private/commits/anju_commits.json`
```

From skills:
```python
from pathlib import Path

PRIVATE_DIR = Path.home() / ".claude" / "private"
commits_file = PRIVATE_DIR / "commits" / "repo_commits.json"
```

---

## FAQ

### Q: Should I create a command or a skill?
**A**: If users invoke it directly → Command. If other commands reuse it → Skill. If both → Create a skill and a thin command wrapper.

### Q: Can I nest skills?
**A**: Yes! Skills can call other skills. Just document dependencies in SKILL.md.

### Q: How do I test commands without cluttering git history?
**A**: Use `private/` for test outputs. Or create a `/test-commands` directory (gitignored).

### Q: What if I need secrets (API keys)?
**A**: Use environment variables. NEVER store secrets in this folder. Reference them via `$ENV_VAR` in commands.
