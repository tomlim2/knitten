# caol-show-patterns Reference

Detailed examples for each design pattern.

---

## Pattern 1: Command Invokes Skill

**When to use:**
- Command needs complex logic or data processing
- Logic should be reusable across multiple commands
- Script runs independently outside command context

**Structure:**
```
Command (thin wrapper) → calls → Skill (actual implementation)
```

### Example: Git Commit Collector

**Command** (`commands/git-collect-commits.md`):
```markdown
---
allowed-tools: Bash(python:*)
description: Extract git commits for portfolio
---

# Collect Git Commits

Extract commit history from a git repository for portfolio use.

## Arguments

$ARGUMENTS = repository path

## Execution

Run the git commit collector:
!`python ~/.claude/skills/git-commit-collector/extract_commits.py $ARGUMENTS`
```

**Skill** (`skills/git-commit-collector/extract_commits.py`):
- Handles parsing, extraction, output
- Saves to `~/.claude/private/commits/`
- Can be run directly: `python extract_commits.py /path/to/repo`

### Benefits
- **Separation of concerns**: Command handles user interaction, skill handles logic
- **Testability**: Skill can be tested independently
- **Reusability**: Multiple commands can use the same skill
- **Maintainability**: Logic changes only affect the skill

### When NOT to use
- Simple one-line commands
- Commands that only use allowed-tools
- No reusability needed

---

## Pattern 2: Multi-Step Workflow

**When to use:**
- Command performs multiple distinct steps
- Steps need to be executed sequentially
- User needs to see progress through steps

**Structure:**
```
Step 1: Gather data
Step 2: Process data
Step 3: Output results
```

### Example: Clean-Up Command

**Command** (`commands/clean-up.md`):
```markdown
---
allowed-tools: Glob, Grep, Read, Edit
description: Update entry documents based on codebase analysis
---

# Clean Up Entry Documents

Update entry document project overview and language conventions based on codebase analysis.

## Step 1: Scan

Scan the codebase for patterns:
- Glob: `**/*.py` to find Python files
- Grep: Search for common patterns (classes, functions, imports)
- Count files by type

## Step 2: Analyze

Analyze discovered patterns:
- Read representative files
- Identify naming conventions
- Document common patterns
- Note project structure

## Step 3: Update

Update entry documents:
- Edit entry document sections based on analysis
- Show diff before writing
- Confirm changes with user
- Update version if needed
```

### Benefits
- **Clarity**: Each step has clear purpose
- **Transparency**: User sees what's happening
- **Debuggability**: Can identify which step fails
- **Modularity**: Steps can be modified independently

### Best Practices
- **Number the steps**: Step 1, Step 2, etc.
- **Name steps clearly**: Describe what each step does
- **Show progress**: Use clear output between steps
- **Allow stopping**: User can stop before destructive steps

---

## Pattern 3: Dynamic Context Injection

**When to use:**
- Command needs current system state
- Context changes between invocations
- Real-time data is essential

**Structure:**
```
Use !`shell command` to inject fresh data into command context
```

### Example: Git Commit Message Generator

**Command** (`commands/git-make-message.md`):
```markdown
---
allowed-tools: Bash(git:*)
description: Generate commit message based on staged changes
---

# Generate Commit Message

Generate a conventional commit message based on staged changes.

## Staged Changes Context

Gather current git context (executed fresh each time):

- Current git status: !`git status`
- Staged changes (diff): !`git diff --cached`
- Recent commits for style reference: !`git log --oneline -10`

## Your Task

Analyze the staged changes above and generate a commit message following conventional commit format:

### Format:
```
[type]([scope]): [brief description]
```

### Types:
- `feat` - New feature
- `fix` - Bug fix
- `refactor` - Code restructuring
- `docs` - Documentation
- `chore` - Maintenance

### Output

Provide the commit message in a code block ready to copy-paste.
```

### Benefits
- **Fresh data**: Always uses current state
- **No stale context**: Command doesn't rely on previous execution
- **Self-contained**: Each run is independent
- **Accurate**: Reflects actual current state

### Best Practices
- **Use !`backticks`**: Execute commands inline
- **Gather context first**: Get all needed data upfront
- **Document what's gathered**: Explain each context piece
- **Check for empty state**: Handle cases where context is missing

### Common Context Sources
- `git status` - Current git state
- `git diff` - Changes in files
- `ls` - Directory contents
- `cat file.txt` - File contents
- `date` - Current timestamp
- `pwd` - Current directory

---

## Pattern 4: Conditional Execution

**When to use:**
- Command behavior varies based on arguments
- Different modes of operation
- Optional vs required parameters

**Structure:**
```markdown
## Behavior

### If `--flag` argument:
  Do X

### If no argument:
  Do Y

### If argument provided:
  Do Z with argument
```

### Example: UE Analyze Material

**Command** (`commands/ue-analyze-material.md`):
```markdown
---
description: Analyze exported UE material node graph
argument-hint: "[material_name | --export]"
allowed-tools: Read, Glob, Bash(python:*)
---

# Analyze UE Material

## Arguments

Input: $ARGUMENTS

## Behavior

### If `--export` argument:
Export the currently selected material from UE Editor, then analyze it:
```bash
python "path/to/export_material_data.py"
```

### If no argument:
List available exported materials:
```bash
ls ~/.claude/private/unreal/material-analyze/*.json
```

Show usage instructions.

### If material name argument:
Read and analyze the specified material:
```bash
cat ~/.claude/private/unreal/material-analyze/${ARGUMENTS}.json
```

Parse JSON and produce structured analysis.
```

### Benefits
- **Flexibility**: One command, multiple modes
- **User-friendly**: Handles common cases automatically
- **Safe**: Shows list before requiring selection
- **Progressive**: Simple -> detailed usage

---

## Pattern 5: Template Generation

**When to use:**
- Command creates files from templates
- Consistent file structure needed
- Multiple similar files to create

**Structure:**
```
1. Gather parameters
2. Fill template
3. Write file
4. Confirm creation
```

### Example: Meta Make Command

**Command** (`commands/caol-make-command.md`):
```markdown
---
description: Generate a new command following naming conventions
argument-hint: "<category> <verb> <subject>"
allowed-tools: Read, Write
---

# Generate New Command

## Execution

1. **Parse arguments**: Extract category, verb, subject
2. **Validate naming**: Check against rules
3. **Ask user**:
   - Description
   - Arguments it accepts
   - Tools it needs

4. **Generate file**: Fill template with user input
5. **Write**: Create `commands/{category}-{verb}-{subject}.md`
6. **Confirm**: Show created file path
```

### Benefits
- **Consistency**: All generated files follow same structure
- **Speed**: Faster than manual creation
- **Correctness**: Template ensures required sections
- **Validation**: Can check rules before creation

---

## Combining Patterns

Patterns can be combined:

**Example: Multi-Step + Dynamic Context**
```markdown
## Step 1: Gather Context
- Files: !`ls *.py`
- Git status: !`git status`

## Step 2: Analyze
Process gathered context...

## Step 3: Update
Make changes based on analysis...
```

**Example: Conditional + Command Invokes Skill**
```markdown
## Behavior

### If --generate flag:
Run skill: !`python skill.py --generate`

### If filename provided:
Run skill: !`python skill.py --analyze $ARGUMENTS`
```

---

## Anti-Patterns to Avoid

### Don't: Assume Previous State
```markdown
# Bad: Relies on previous execution
Use the data from last run...
```

**Do:** Use dynamic context
```markdown
# Good: Gets fresh data
- Current data: !`cat data.json`
```

### Don't: Mix Concerns
```markdown
# Bad: Command does everything
1. Parse arguments
2. Validate input
3. Process data
4. Transform results
5. Save to file
6. Send notification
```

**Do:** Use Command Invokes Skill
```markdown
# Good: Command delegates to skill
Run processor: !`python skill.py $ARGUMENTS`
```

### Don't: Hard-Code Paths
```markdown
# Bad: Specific to one machine
Read: /Users/john/projects/data.json
```

**Do:** Use dynamic paths
```markdown
# Good: Relative or variable paths
Read: !`ls ~/.claude/private/data.json`
```

---

## Related Files

- `SYSTEM.md` - Canonical policy
- `skills/caol-make-command/SKILL.md` - Command creation rules
- `skills/caol-make-skill/SKILL.md` - Skill creation rules
