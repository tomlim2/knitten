---
description: Check system status and connect services
allowed-tools: Read, Write, Bash(node:*), Bash(cd:*), Bash(lsof:*), Bash(git tag:*), Bash(git add:*), Bash(git commit:*), Task, AskUserQuestion
---

# caol-check-status

Check skill server, refs, and model version status. Auto-starts server if down. Detects model changes and orchestrates doc updates.

## Usage

```
/caol-check-status
```

## Workflow

### Step 1: Check Skill Server

1. Run `curl -s --max-time 2 http://localhost:9720/skills`
2. If response received → server is `connected`
3. If no response → start server:
   ```bash
   cd ~/.claude/skills/skill-server && node server.js &
   ```
4. Wait 2 seconds, then re-check with curl
5. Record final status: `connected (port 972)` or `disconnected`

### Step 2: Check Refs

1. Read `~/.claude/private/caol-config/repo-paths.json`
   - Each entry is an object: `{ "path": "...", "description": "..." }`. Use `entry.path` for the filesystem path.
   - For backward compatibility, if an entry is a plain string, treat it as the path.
2. Compare against expected refs list:
   - `anju`, `ta-portfolio`, `obsidian`, `agent-hub`, `cinev-studio`, `cinev-engine`
   - Treat `caol-ila` as a legacy compatibility alias for `agent-hub`, not as a separate active repo identity.
3. For each expected ref:
   - If registered in repo-paths.json AND path exists on disk → `connected`
   - If registered AND path does NOT exist → `registered (not found)`
   - If NOT registered → `missing`
4. Also include any extra refs in repo-paths.json that aren't in the expected list

### Step 3: Check Model Version

1. Read `~/.claude/private/model-version.json`
2. **If file does not exist:**
   - Create it with current model info: `model_id`, `model_name`, `version: "2.0.0"`, `updated_at: today`
   - Set model status to `{model_name} (initialized)`
   - Skip update flow (Step 5)
3. **If file exists:**
   - Compare saved `model_id` with the current model ID from your system info
   - If match → status: `{model_name} (current)`
   - If mismatch → status: `{saved_model_name} → {new_model_name} (UPDATE NEEDED)`
   - Remember whether update is needed for Step 5

### Step 4: Output Results

Display as tables:

```
## System Status

| Component    | Status                          |
|--------------|---------------------------------|
| Skill Server | connected (port 972)            |
| Model        | Opus 4.6 (current)              |

## Refs

| Name         | Status              | Path                    |
|--------------|---------------------|-------------------------|
| anju         | connected           | /Users/.../anju         |
| agent-hub      | connected           | /Users/.../agent-hub      |
| cinev-studio | missing             |                         |
```

If any refs have `missing` status, show:

```
To register missing refs: /caol-register-refs <name> <path>
```

### Step 5: Model Update Flow

**Only execute this step if Step 3 detected a model change.**

1. Use AskUserQuestion to confirm:
   - "Model changed from {old} to {new}. Run update flow to review and update all docs?"
   - Options: "Run update flow", "Skip for now"
2. If user confirms, execute sequentially:

#### [1/4] Review Entry Documents

Launch a Task subagent:
- Read `~/.claude/commands/caol-review-claude-md.md`
- Execute that command's logic: fetch official docs, run checks, auto-fix FAIL/WARN items
- Return summary: number of issues found and fixed

#### [2/4] Check External Skill Updates

Launch a Task subagent:
- Read `~/.claude/commands/caol-update-skills.md`
- Execute: check external-skills.json, compare with source repos, apply updates
- Return summary: number of skills checked and updated

**Why before review:** External skills must be updated first so that [3/4] reviews the latest versions, not stale local copies.

#### [3/4] Review All Skills, Commands & Standards

Launch a Task subagent:
- Read `~/.claude/commands/caol-review-skills.md`
- Execute with `all` scope: scan all commands, skills, and standards, apply checklists, auto-fix issues
- Return summary: number of issues found and fixed

#### [4/4] Update Registered Repo Docs

1. Read `~/.claude/private/caol-config/repo-paths.json`
2. Filter to repos with `connected` status from Step 2
3. **Exclude `agent-hub` and its legacy alias `caol-ila`** — entry documents are handled by [1/4]
4. For each remaining connected repo, launch a Task subagent:
   - Read `~/.claude/commands/caol-update-docs.md`
   - Execute that command's logic at the repo's path
   - Return summary of changes

5. After all steps complete, display results:

```
## Update Flow Results

| Step | Scope                       | Issues | Fixed | Status |
|------|-----------------------------|--------|-------|--------|
| 1/4  | Entry Documents             | 3      | 3     | done   |
| 2/4  | External Skills             | 1      | 1     | done   |
| 3/4  | Skills, Commands & Standards| 7      | 5     | done   |
| 4/4  | Repo Docs (2 repos)         | 0      | 0     | done   |
```

### Step 6: Git Tagging

**Only execute this step after Step 5 completes successfully.**

1. Read current `version` from `~/.claude/private/model-version.json`
2. Commit all changes in agent-hub:
   ```
   chore: update docs for model {new_model_name}
   ```
3. Major bump the version (e.g., `2.0.0` → `3.0.0`)
4. Create semver tag: `git tag v{new_version}`
5. Create model tag: `git tag model/{model_name_lowercase}` (e.g., `model/opus-4.7`)
6. Update `model-version.json` with new model_id, model_name, version, updated_at
7. Commit the json update:
   ```
   chore: bump version to v{new_version}
   ```
