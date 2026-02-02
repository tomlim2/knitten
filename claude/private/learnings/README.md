# Learnings Vault

Accumulated wisdom from working on projects. Each project file captures patterns discovered through iteration.

## Structure

```
learnings/
├── README.md           # This file
├── _template.md        # Template for new projects
└── projects/
    ├── anju.md         # Project-specific learnings
    └── ...
```

## What Goes Here

Each project file captures:

1. **Conventions** - Patterns specific to this codebase
2. **What Worked** - Successful approaches worth repeating
3. **What Failed** - Approaches that seemed good but weren't
4. **Gotchas** - Non-obvious things that cause problems

## Usage

### Reading Learnings

Before starting work on a project, Claude should:
1. Check if learnings exist for this project
2. Read and apply relevant insights
3. Reference learnings when making decisions

### Updating Learnings

Use the `/learn` command:
```
/learn <project> <category>
```

Categories:
- `convention` - New pattern discovered
- `worked` - Successful approach
- `failed` - Approach to avoid
- `gotcha` - Non-obvious issue

### Example

```
/learn anju convention
> Discovered that all Python scripts use standalone imports, no shared utils
```

## Philosophy

> "Skills are the moves you've perfected through iteration, now available as building blocks."

This vault turns hard-won experience into reusable knowledge. Each entry should be specific enough to act on, not vague observations.

**Good**: "UE Python scripts must use `import unreal` at module level, not inside functions - causes initialization errors"

**Bad**: "Be careful with imports"
