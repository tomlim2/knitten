---
description: Check and update external skills from their source repos
allowed-tools: Read, Write, Edit, WebFetch, Bash(curl:*)
---

# meta-update-skills

Check external skills for updates and apply them.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `meta-update-skills`

## Workflow

### Step 1: Load registry

Read `~/.claude/private/external-skills.json`. This file contains all external skills with their source URLs.

### Step 2: Check each skill

For each skill in the registry:

1. **Fetch latest** from the `source` URL using WebFetch
2. **Read current** SKILL.md from `~/.claude/skills/{skill-name}/SKILL.md`
3. **Compare** the two versions (ignore our frontmatter adaptation — compare the body content)

### Step 3: Report status

Show a summary table:

```
| Skill      | Status     | Source                  | Last checked |
|------------|------------|-------------------------|--------------|
| humanizer  | Up to date | blader/humanizer        | 2026-02-14   |
| skill-name | UPDATE     | owner/repo              | 2026-02-10   |
```

### Step 4: Apply updates (if any)

For each skill with changes:

1. Show a diff summary of what changed
2. Ask the user whether to apply the update
3. If approved:
   - Fetch the full latest SKILL.md content
   - Re-apply our frontmatter convention (YAML `---` with `description`)
   - Write to `~/.claude/skills/{skill-name}/SKILL.md`
   - Update `lastChecked` in the registry

If no updates found, just update `lastChecked` dates in the registry.

### Step 5: Confirm

Show final status and updated registry.
