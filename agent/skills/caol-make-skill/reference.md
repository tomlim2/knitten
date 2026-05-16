# caol-make-skill Reference

Detailed implementation patterns, templates, and guidelines for creating skills.

---

## Implementation Files

### Main Script Naming

Scripts can have descriptive names (don't need to follow category-verb-subject):
- `extract_commits.py` - Descriptive and clear
- `validate_name.py` - Action-oriented
- `export_material_data.py` - Explains what it does
- `run_in_editor.py` - Context-specific

### Script Requirements

1. **Docstring**: Explain what the script does
2. **CLI arguments**: Use `argparse` for Python scripts
3. **Error handling**: Graceful failures with clear messages
4. **Logging**: Use appropriate logging (print, logging module, unreal.log)
5. **Output**: Predictable output location (preferably `~/.claude/private/`)

### Python Script Template

```python
#!/usr/bin/env python3
"""
{Script description}

Usage:
    python script.py [arguments]
"""

import argparse
import sys
from pathlib import Path

def main():
    parser = argparse.ArgumentParser(description="Script description")
    parser.add_argument("argument", help="Argument description")
    parser.add_argument("-o", "--output", help="Output file path")

    args = parser.parse_args()

    # Implementation
    try:
        # Do work
        print(f"Success: {result}")
    except Exception as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

if __name__ == "__main__":
    main()
```

---

## Configuration Files

### config.json (Optional)

Use JSON for configuration:

```json
{
  "version": "0.1.0",
  "name": "skill-name",
  "settings": {
    "default_output": "~/.claude/private/",
    "port": 3000
  }
}
```

---

## Skill Categories

### By Purpose

**Caol Tools** (`caol-*`)
- Create and manage commands/skills
- Examples: `caol-make-command`, `caol-make-skill`

**Git Tools** (`git-*`)
- Git operations and analysis
- Examples: `git-commit-collector`

**UE Tools** (`ue-*`)
- Unreal Engine automation
- Examples: `ue-analyze-material`, `ue-validate-asset-name`

**Project Tools** (`cci-*`, etc.)
- Project-specific automation
- Examples: Skills for specific projects

**Domain Tools** (`tutoring-*`, `drink-*`, etc.)
- Domain-specific functionality
- Examples: Business logic, data tracking

**Infrastructure** (`skill-server`, etc.)
- Core system infrastructure
- Examples: Web servers, shared utilities

---

## Directory Organization

### Simple Skill (Single Script)

```
git-commit-collector/
├── SKILL.md
└── extract_commits.py
```

### Complex Skill (Multiple Files)

```
ue-analyze-material/
├── SKILL.md
├── run_in_editor.py
├── export_material_data.py
└── config.json
```

### Skill with Assets

```
skill-server/
├── SKILL.md
├── server.js
├── config.json
├── public/
│   ├── styles/
│   └── scripts/
└── views/
    └── templates/
```

---

## Dependencies

### Document Dependencies in SKILL.md

```markdown
## Dependencies

**Python:**
- Python 3.8+
- argparse (built-in)
- pathlib (built-in)

**External:**
- Git 2.0+ (for git operations)

**Claude Code Tools:**
- Bash tool for running scripts
- Read/Write for file operations
```

### For Node.js Skills

Include `package.json`:

```json
{
  "name": "skill-name",
  "version": "0.1.0",
  "description": "Skill description",
  "main": "server.js",
  "dependencies": {
    "express": "^4.18.0"
  }
}
```

---

## Output Guidelines

### Output Location

**Private data** -> `~/.claude/private/`
- Extracted data
- Generated files
- Cache
- User-specific content

**Skill-specific subdirectories:**
```
~/.claude/private/
├── commits/          # git-commit-collector
├── unreal/
│   ├── material-analyze/    # ue-analyze-material
│   └── asset-validate/      # ue-validate-asset-name
├── tutoring/
│   └── invoices/            # tutoring-* skills
└── drinks/                  # drink-log
```

### Output Format

**JSON** for structured data:
```json
{
  "version": "1.0",
  "generated": "2026-02-06T12:00:00Z",
  "data": {}
}
```

**Markdown** for documentation/reports

**Plain text** for logs

---

## Testing Skills

### Manual Testing

1. Create test input
2. Run script directly: `python script.py --test`
3. Verify output in expected location
4. Check error handling with invalid input

### Integration Testing

1. Create wrapper command
2. Test command invocation: `/command-name`
3. Verify command calls skill correctly
4. Check output reaches user

---

## Common Patterns

### Pattern 1: Data Extraction Skill

```
Skill extracts data from source -> Saves to private/ -> Command reads and displays
```

Example: `git-commit-collector`
- Skill: Extracts commit history to JSON
- Command: `git-collect-commits` invokes skill, shows summary

### Pattern 2: Analysis Skill

```
Skill receives input -> Processes/analyzes -> Returns structured output
```

Example: `ue-analyze-material`
- Skill: Exports material data from UE
- Command: `ue-analyze-material` reads and analyzes

### Pattern 3: Web Service Skill

```
Skill runs server -> Provides web interface -> Command opens browser
```

Example: `skill-server`
- Skill: Runs Express server on port 972
- Commands: `tutoring-open-invoice` opens specific routes

### Pattern 4: Generator Skill

```
Skill contains templates/rules -> Command prompts user -> Generates files
```

Example: `caol-make-command`
- Skill: Contains all naming rules
- Command: Generates new command files

---

## Skill vs Command

| Aspect | Skill | Command |
|--------|-------|---------|
| **Location** | `skills/{name}/` | `commands/{name}.md` |
| **Purpose** | Reusable logic | User-facing workflow |
| **Invocation** | Called by commands | Called by user (`/command`) |
| **Files** | Multiple files (SKILL.md + scripts) | Single markdown file |
| **Tools** | Full system access | Restricted by `allowed-tools` |
| **Complexity** | Can be complex | Should be simple |
| **Documentation** | SKILL.md | Frontmatter + content |

**When to create a skill:**
- Logic is reusable across commands
- Requires multiple files
- Complex implementation
- Used by other skills

**When to create just a command:**
- Simple one-off task
- Only needs allowed-tools
- Self-contained logic
- User-facing only

---

## Migration from Command to Skill

If a command grows complex:

1. **Extract logic** to skill:
   - Create `skills/{name}/` directory
   - Move implementation to script.py
   - Write SKILL.md

2. **Simplify command**:
   - Command becomes thin wrapper
   - Calls skill via `Bash(python:*)`
   - Handles user interaction only

3. **Example**:

**Before** (complex command):
```markdown
---
allowed-tools: Bash(git:*), Read, Write, Grep, Glob
---
[100 lines of complex logic]
```

**After** (simple command + skill):

Command:
```markdown
---
allowed-tools: Bash(python:*)
---
Run: python ~/.claude/skills/git-commit-collector/extract_commits.py $ARGUMENTS
```

Skill:
```
git-commit-collector/
├── SKILL.md
└── extract_commits.py (100 lines of logic)
```

---

## Subagent Pattern (`context: fork`)

Use when a skill should run in an isolated context with no access to the main conversation. The skill body becomes the subagent's task prompt.

```yaml
---
name: deep-research
description: Research a topic thoroughly with read-only exploration
context: fork
agent: Explore
---

Research $ARGUMENTS thoroughly:

1. Find relevant files using Glob and Grep.
2. Read and analyze each match; do not edit.
3. Return a summary with file:line references.
```

### Agent choices

| Agent | Use for |
|-------|---------|
| `Explore` | Read-only codebase exploration. Ideal for research + summaries. |
| `Plan` | Read-only planning — produces a plan, doesn't implement. |
| `general-purpose` | Default; full tool access. |
| custom (e.g. `my-reviewer`) | Defined in `.claude/agents/my-reviewer.md`. |

**Gotcha:** `context: fork` only makes sense when SKILL.md contains an explicit task. Pure reference content ("use these conventions") in a forked skill gives the subagent instructions but no actionable prompt, and it returns empty. For reference-only skills, leave `context` unset (inline).

---

## Argument Passing Pattern

### Full argstring

```yaml
---
name: fix-issue
description: Fix a GitHub issue by number
disable-model-invocation: true
---

Fix GitHub issue $ARGUMENTS following our coding standards.

1. Read the issue description
2. Implement the fix
3. Write tests
4. Open a PR
```

`/fix-issue 123` → the body receives "Fix GitHub issue 123 ...".

If the body does not mention `$ARGUMENTS`, Claude Code appends `ARGUMENTS: <input>` to the end so nothing is lost.

### Positional arguments

```yaml
---
name: migrate-component
description: Migrate a component between frameworks
---

Migrate the $0 component from $1 to $2.
Preserve behavior and tests.
```

`/migrate-component SearchBar React Vue` →
- `$0` = `SearchBar`
- `$1` = `React`
- `$2` = `Vue`

Quote multi-word arguments: `/migrate-component "Top Nav" React Vue` makes `$0 = "Top Nav"`.

### Session-scoped artifacts

```yaml
---
name: session-logger
description: Append a line to this session's log file
---

Append $ARGUMENTS to logs/${CLAUDE_SESSION_ID}.log via:

`mkdir -p logs && printf '%s\n' "$ARGUMENTS" >> logs/${CLAUDE_SESSION_ID}.log`
```

`${CLAUDE_SESSION_ID}` and `${CLAUDE_SKILL_DIR}` expand at invocation time — use `${CLAUDE_SKILL_DIR}` in skill-local script invocations so the command works regardless of the user's cwd.

---

## Dynamic Shell Injection

### Inline preprocessing

The `` !`command` `` form runs the shell command **before** the skill content reaches the agent. The command output replaces the backtick expression.

```yaml
---
name: pr-summary
description: Summarize changes in the current pull request
context: fork
agent: Explore
allowed-tools: Bash(gh *)
---

## Pull request context

- Diff: !`gh pr diff`
- Comments: !`gh pr view --comments`
- Files changed: !`gh pr diff --name-only`

## Your task

Summarize the PR's intent and flag risky changes.
```

The agent never sees the `` !`gh pr diff` `` literal — only the diff text.

### Block form (multi-line)

For more than one command, open a fenced code block with ` ```! `:

````markdown
## Local environment
```!
node --version
pnpm --version
git status --short
```
````

### Policy kill-switch

Add `"disableSkillShellExecution": true` to `settings.json` to replace every ` !`…` ` expression with `[shell command execution disabled by policy]` — useful for managed deployments. Bundled + managed skills are exempt.

### Windows / PowerShell

```yaml
---
name: build-win
description: Windows build runner
shell: powershell
---

Build: !`Get-Location; .\build.ps1`
```

Requires `CLAUDE_CODE_USE_POWERSHELL_TOOL=1`.

---

## `paths`-Scoped Skills

Auto-activation only when files matching the globs are in play. Great for monorepos and multi-stack repos.

```yaml
---
name: frontend-conventions
description: React + TS style and accessibility rules
paths:
  - "packages/frontend/**"
  - "apps/web/**"
---

When editing frontend files:

- Use the `Button` component from `packages/ui`, never a raw `<button>`.
- All interactive elements need a visible focus state.
- Prefer `useId` over hardcoded IDs for a11y.
```

Users can still invoke the skill manually with `/frontend-conventions` outside those paths — `paths` only gates **automatic** activation.

String form also works:
```yaml
paths: "packages/frontend/**, apps/web/**"
```

---

## User-Invocable vs Model-Invocable

Two independent switches. Default: both true.

| Goal | `disable-model-invocation` | `user-invocable` |
|------|---------------------------|------------------|
| Normal skill (both can invoke) | `false` (default) | `true` (default) |
| Manual-only side-effects (deploy, send-slack) | `true` | `true` |
| Background reference (hidden from `/`) | `false` | `false` |
| Disabled (neither can invoke) | use deny rule in `/permissions` instead | |

### Background reference example

```yaml
---
name: legacy-auth-quirks
description: Explains quirks of the legacy auth system. Use whenever touching /auth endpoints.
user-invocable: false
---

The legacy auth module predates our JWT refresh flow...
```

The harness loads this when relevant, but it never appears in the `/` menu.

---

## Visual Output Pattern

Skills can bundle scripts that generate interactive HTML and open it in a browser — useful for dashboards, tree views, dependency graphs, coverage reports.

```yaml
---
name: codebase-visualizer
description: Generate an interactive tree view of the repo
allowed-tools: Bash(python:*)
---

Run:

```
python ${CLAUDE_SKILL_DIR}/scripts/visualize.py .
```

This writes `codebase-map.html` and opens it in the default browser.
```

Script location: `${CLAUDE_SKILL_DIR}/scripts/visualize.py`. The script generates a self-contained HTML file (inline CSS + JS, no external deps) and calls `webbrowser.open(...)`.

For a full worked example including a Python script that emits an interactive HTML tree view, see the official docs: <https://code.claude.com/docs/en/skills#generate-visual-output>. This pattern pairs well with the existing `caol-browse-commands` skill (web dashboard of installed commands).

---

## Extended Thinking

Include the literal word `ultrathink` anywhere in SKILL.md to opt the skill into extended-thinking mode:

```yaml
---
name: review-architecture
description: Deep architectural review
---

ultrathink

Walk the dependency graph and flag layering violations...
```

---

## Permission Rules for Skill Invocation

Complementary to frontmatter, `/permissions` controls **who can use which skills**:

```text
# Deny all skills entirely
Skill

# Allow only specific skills
Skill(commit)
Skill(review-pr *)

# Deny a particular skill
Skill(deploy *)
```

Syntax: `Skill(name)` = exact match; `Skill(name *)` = prefix match with any args.

`user-invocable: false` controls menu visibility only, **not** Skill tool access. To fully block Claude from invoking a skill, use `disable-model-invocation: true` or a deny rule.

---

## Additional frontmatter examples (moved from SKILL.md)

### User-only deploy with pre-approved tools

```yaml
---
name: deploy
description: Deploy the application to production
disable-model-invocation: true
allowed-tools: Bash(git add *) Bash(git commit *) Bash(git push *)
---
```

### Research skill in forked Explore agent

```yaml
---
name: deep-research
description: Research a topic thoroughly
context: fork
agent: Explore
---

Research $ARGUMENTS thoroughly...
```

### Monorepo-scoped auto-activation

```yaml
---
name: frontend-conventions
description: React + TS style rules
paths:
  - "packages/frontend/**"
  - "apps/web/**"
---
```

---

## String Substitutions — worked examples (moved from SKILL.md)

SKILL.md content supports these substitutions at invocation time:

| Token | Meaning |
|-------|---------|
| `$ARGUMENTS` | Full argument string. If not present in body, Claude Code appends `ARGUMENTS: <value>`. |
| `$ARGUMENTS[N]` | 0-based indexed argument (shell-style quoting; wrap multi-word args in quotes). |
| `$N` | Shorthand: `$0` = first arg, `$1` = second, etc. |
| `${CLAUDE_SESSION_ID}` | Current session ID. Good for per-session log files. |
| `${CLAUDE_SKILL_DIR}` | Absolute dir of the current SKILL.md. For plugin skills this is the skill subdir, not the plugin root. |

### Full argstring

```yaml
---
name: fix-issue
description: Fix a GitHub issue by number
---
Fix GitHub issue $ARGUMENTS following our coding standards.
```

`/fix-issue 123` → "Fix GitHub issue 123..."

### Positional

```yaml
---
name: migrate-component
description: Migrate a component between frameworks
---
Migrate the $0 component from $1 to $2.
```

`/migrate-component SearchBar React Vue` → `$0=SearchBar`, `$1=React`, `$2=Vue`.

### Session log

```yaml
---
name: session-logger
description: Log activity for this session
---
Append to logs/${CLAUDE_SESSION_ID}.log:

$ARGUMENTS
```

### Skill-local script

```yaml
---
name: tree-view
description: Render the codebase tree
allowed-tools: Bash(python:*)
---
Run: `python ${CLAUDE_SKILL_DIR}/scripts/tree.py .`
```

---

## Dynamic Shell Injection — patterns (moved from SKILL.md)

Skills can embed live shell output into the prompt before the agent sees it. This is **preprocessing** — the agent only receives the final rendered content, not the command text.

### Inline form

```markdown
- Current branch: !`git rev-parse --abbrev-ref HEAD`
- Staged files: !`git diff --cached --name-only`
```

### Block form (multi-line, fenced with `` ```! ``)

````markdown
## Environment
```!
node --version
npm --version
git status --short
```
````

The `shell` frontmatter field picks the interpreter (`bash` default, `powershell` opt-in on Windows). Per-repo/user setting `disableSkillShellExecution: true` replaces each command with `[shell command execution disabled by policy]`.

---

## UE skills — why they're special (moved from SKILL.md)

For any `ue-*` skill, use `/ue-make-skill <verb> <noun>` instead of `/caol-make-skill`.

Template: `~/.claude/skills/ue-show-template/SKILL.md`

### Why UE skills are special

- Require specific Python patterns for Unreal Editor integration
- Need `run_in_editor.py` wrapper for remote execution
- Export JSON data to `~/.claude/private/unreal/{noun}-{verb}/`
- Follow strict logging conventions with `[LogTag]` prefixes
- Use `export_{noun}_data.py` naming pattern
- Have specific error handling for `get_editor_property()` calls

### When to use ue-make-skill

- Any skill that exports data from Unreal Editor
- Any skill that analyzes UE assets (materials, meshes, blueprints)
- Any skill that validates UE naming conventions
- Any skill that requires Python inside UE Editor

### Example

```
User request: "Create a ue-analyze-texture skill"
→ Use: /ue-make-skill analyze texture
→ NOT: /caol-make-skill ue analyze texture
```

---

## Full SKILL.md template (moved from SKILL.md)

Every skill MUST have a `SKILL.md` with this structure:

```markdown
---
description: "One-line description. Use when <trigger>."
---

# {category}-{verb}-{subject}

[One-line description of what this skill does]

## Purpose

[Detailed explanation of what this skill does, why it exists, and when to use it]

---

## Usage

[How to use this skill, with examples. Include both command-line and programmatic usage if applicable]

---

## Files

- `script.py` - [Description of main script]
- `config.json` - [Description of config file]
- `reference.md` - [Detailed reference loaded on demand]

---

## [Optional Additional Sections]

- Dependencies
- Configuration
- Output Format
- Related Files
- Examples
- Troubleshooting
```

### Required Sections

1. **Frontmatter** — at minimum `description`; add other fields as needed
2. **Title** — `# {category}-{verb}-{subject}`
3. **Description** — one-line summary
4. **Purpose** — detailed explanation
5. **Usage** — how to use with examples
6. **Files** — list and describe all files in the skill
