---
description: "Monitor and kill stale processes — check running python/node processes, kill those exceeding time limit. Use when running experiments, solvers, or any compute tasks that should finish quickly."
allowed-tools: Bash(ps:*), Bash(kill:*), Bash(ls:*)
argument-hint: "[time_limit_seconds]"
---

# dev-kill-stale

Monitor running processes and kill stale ones.

## Arguments

- `[time_limit_seconds]` - Kill threshold in seconds (default: 60)

Usage: /dev-kill-stale [60]

## Workflow

### Step 1: Scan Processes
```bash
ps aux | grep -E "python|node" | grep -v grep | grep -v "http.server" | sort -k10 -rn
```

### Step 2: Identify Stale
For each process:
- PID, command, CPU time, wall time
- Flag if exceeding time limit
- Show status table:

```
| PID | File | Time | Status |
|-----|------|------|--------|
| 123 | solve.py | 3min | 🔴 KILL |
| 456 | test.py | 20s | 🟢 OK |
```

### Step 3: Kill with Confirmation
- List processes to kill
- Kill them: `kill <PID>`
- Verify: re-run ps to confirm

### Step 4: Report
- How many killed
- CPU freed
- Remaining processes

## Key Principle

> If the approach is correct, it finishes in seconds.
> Long-running = wrong approach. Kill and rethink.

- 30초: 의심
- 1분: 킬
- 5분+: 접근법 자체가 틀림
