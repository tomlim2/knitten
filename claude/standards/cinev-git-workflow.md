# CINEV Git Workflow Standard

Git workflow rules for all CINEV project operations.

---

## Project Locations

Read from `~/.claude/private/repo-paths.json` (use `entry.path` for filesystem path):

| Key | Role |
|-----|------|
| `cinev-studio` | Main project |
| `cinev-engine` | Second project |

---

## Pre-Git Checklist (MANDATORY)

Before any git operation on a CINEV project, follow these steps **in order**:

### Step 1: Check Unreal Engine status

Detect whether Unreal Editor is running and which project it has locked.

```bash
# Check for running UE processes and their working directories
wmic process where "name='UnrealEditor.exe'" get CommandLine
```

Look for `CINEVStudio` in the command line arguments to determine which project is active.

### Step 2: Select the safe project

- If UE is running on `cinev-studio` → use `cinev-engine`
- If UE is running on `cinev-engine` → use `cinev-studio`
- If UE is not running on either → use either (prefer `cinev-studio`)

**NEVER run git operations on a project where Unreal Editor is running.**

### Step 3: Check for uncommitted work

Before starting the intended git workflow, check for existing changes:

```bash
git status
```

If there are uncommitted changes:
1. Show the user what files are modified/untracked
2. **Commit those changes first** (with user approval on the message)
3. Then proceed with the intended operation

---

## Scope

This standard applies to ALL skills and commands that perform git operations on CINEV projects:

- `cocv-art-prepare-merge`
- `cocv-art-create-branch`
- `cocv-art-remove-branch`
- Any future `cocv-*` skill involving git
