---
description: "Quick-access hub for hackathons, competitions, and timed coding challenges."
argument-hint: "[problem description]"
allowed-tools: Bash(python3:*), Bash(cd:*), Bash(ps:*), Bash(kill:*), Bash(date:*), Agent, WebSearch, WebFetch, Read, Write, Edit, Glob, Grep
---

# dev-hackathon-toolkit

Timed hackathon/competition problem-solving hub. Guides through existing skills step-by-step with time tracking.

## Arguments

- `[problem description]` - Problem description (optional). Without it, starts in standby mode.

## Workflow

### Step 0: Pre-flight Checklist (MANDATORY, first 5 minutes)

**Do this BEFORE any experiment. No exceptions.**

```
1. [1min] Verify working directory
   - cd to project dir with ABSOLUTE PATH
   - Run `pwd` to confirm
   - ALL subsequent commands use absolute paths or explicit `cd`

2. [2min] Smoke test
   - Run 10 epochs on CPU to verify pipeline end-to-end
   - If it fails here, fix before launching real experiments

3. [1min] GPU ownership rule
   - Only 1 process on GPU (MPS/CUDA) at any time
   - Other sessions use CPU or WAIT
   - Check: ps aux | grep python | grep -v grep

4. [1min] Output verification
   - Experiments MUST save results to disk (JSON/CSV + model checkpoint)
   - Set 10min checkpoint: if no output file exists, something is wrong
```

### Step 1: Start Timer

```
Hackathon start: {current time}
Deadline: {confirm with user}
Submit target: {deadline - 30min buffer}
Experiment freeze: {deadline - 60min}
```

### Step 2: Problem Analysis (first 10 minutes)

1. **Summary** — 3-line core problem
2. **Classification** — Algorithm / ML / Prompt Engineering / Data / System Design / Other
3. **Required tools** — APIs, libraries, approaches needed
4. **Time allocation** — Phase-based time distribution

### Step 3: Approach Decision

| Situation | Skill |
|-----------|-------|
| Unsure about approach | `/dev-decision-start` (3-model parallel) |
| Quick technical question | `/dev-ask-gemini` |
| Deep research needed | `/ah-research-web` |
| Light research | `/ah-research-light` |

### Step 4: Implementation

| Situation | Skill |
|-----------|-------|
| Full power mode | `/ah-work-ultra` |
| Bug found | `/dev-fix-bug` |
| Experiment tracking | `/dev-log-experiment` |
| Codebase analysis | `/ah-consult-codebase` |

### Step 5: Pre-submit Verification (last 30 minutes)

| Situation | Skill |
|-----------|-------|
| Code quality check | `/review-audit-web` |
| Spec document | `/dev-generate-spec` |

---

## Critical Rules

- **Submit once only** — double-check before submitting
- **Time management** — if stuck >1h on one approach, pivot
- **AI tools encouraged** — officially allowed, use maximally
- **Ops before experiments** — solve infrastructure first, then focus on the problem
- **The problem is lightweight** — if it's taking too long, it's an ops issue, not a compute issue
- **Only 1 GPU process at a time** — MPS (Apple Silicon) cannot share. Period.
- **Absolute paths always** — never rely on session cwd
- **Smoke test before real run** — catches import/shape/cwd/data bugs cheaply

---

## Quick Start Template

```
1. [5min] Pre-flight checklist (Step 0)
2. [2min] Read problem, summarize
3. [5min] /dev-decision-start "Problem: {summary}. {N} hours. Approach?"
4. [3min] Confirm approach, time allocation
5. [bulk] Implement — /dev-ask-gemini if stuck, /dev-fix-bug for bugs
6. [30min] Package + verify + submit
```

---

## Project Repo

Before starting, read `~/.claude/private/agent-hub-config/repo-paths.json` for `krafton-hackathon` path. Work in that directory.

---

## Additional Resources

For GPU contention protocol, multi-session coordination templates, experiment execution checklist, and the full available-tools list, see [reference.md](reference.md).
