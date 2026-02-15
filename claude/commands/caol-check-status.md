---
description: Check system status and connect services
allowed-tools: Read, Bash(curl:*), Bash(node:*), Bash(cd:*), Bash(lsof:*)
---

# caol-check-status

Check skill server and refs connection status. Auto-starts server if down.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `caol-check-status`

## Workflow

### Step 1: Check Skill Server

1. Run `curl -s --max-time 2 http://localhost:972/api/skills`
2. If response received → server is `connected`
3. If no response → start server:
   ```bash
   cd ~/.claude/skills/skill-server && node server.js &
   ```
4. Wait 2 seconds, then re-check with curl
5. Record final status: `connected (port 972)` or `disconnected`

### Step 2: Check Refs

1. Read `~/.claude/private/repo-paths.json`
2. Compare against expected refs list:
   - `anju`, `ta-portfolio`, `obsidian`, `caol-ila`, `cinev-studio`, `cinev-engine`
3. For each expected ref:
   - If registered in repo-paths.json AND path exists on disk → `connected`
   - If registered AND path does NOT exist → `registered (not found)`
   - If NOT registered → `missing`
4. Also include any extra refs in repo-paths.json that aren't in the expected list

### Step 3: Output Results

Display as two tables:

```
## System Status

| Component    | Status                |
|--------------|-----------------------|
| Skill Server | connected (port 972)  |

## Refs

| Name         | Status              | Path                    |
|--------------|---------------------|-------------------------|
| anju         | connected           | /Users/.../anju         |
| caol-ila     | connected           | /Users/.../caol-ila     |
| cinev-studio | missing             |                         |
```

### Step 4: Registration Guidance

If any refs have `missing` status, show:

```
To register missing refs: /meta-register-refs <name> <path>
```
