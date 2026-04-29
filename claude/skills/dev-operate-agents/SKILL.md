---
description: "Multi-agent ops — spin up N parallel Claude Code instances with role assignment, scenario planning, and monitoring."
allowed-tools: Read, Write, Edit, Bash(pbcopy:*), Bash(ps:*), Bash(kill:*), Bash(ls:*)
argument-hint: "<num_agents> <task_description>"
---

# dev-operate-agents

Set up and coordinate N parallel Claude Code instances as a command center (지통실).

## Arguments

- `<num_agents>` - Number of agents to coordinate (e.g. 4, 6)
- `<task_description>` - What the agents will work on

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /dev-operate-agents <num_agents> <task_description>

## Workflow

### Step 1: Role Assignment
Create a role table:
- **1호기 (this instance):** 지통실 — planning, devlog, monitoring, NO direct coding
- **2~N호기:** Assign specialized roles based on task

Output format:
```
| 호기 | Role | Phase 1 | Phase 2 |
|------|------|---------|---------|
```

### Step 2: Timeline
Create phased timeline with explicit handoff points:
- Phase 1: Analysis (parallel)
- Phase 2: Implementation (parallel, specialized)
- Phase 3: Integration + Review
- Phase 4: Delivery

### Step 3: Scenario Planning
Pre-write clipboard instructions for each scenario:
- All succeed → integration instructions
- Partial success → fallback instructions
- All fail → pivot instructions

Save to `시나리오별_지시문.md` in working directory.

### Step 4: Monitoring Loop
Periodically:
1. `ps aux | grep python` — check running processes
2. Check result files (`ls -lt *.json`)
3. Update devlog
4. Kill stale processes (1min policy)

### Step 5: Clipboard Dispatch
When agent is idle, prepare next task and copy to clipboard:
```bash
cat <<'CLIP' | pbcopy
[task instructions]
CLIP
```

## Key Rules
- 지통실 does NOT write code or run experiments
- Compose instructions, copy to clipboard, user pastes to target agent
- Kill processes exceeding 1 minute (correct approach = seconds)
- Track all progress in devlog.md
- Pre-prepare scenario-based instructions before results arrive
