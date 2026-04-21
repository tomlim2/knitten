---
description: "Hackathon toolkit — quick-access hub for timed problem solving. Use when starting a hackathon, competition, or timed coding challenge."
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
   - Template: python3 -c "...train 10 epochs...print('OK')"

3. [1min] GPU ownership rule
   - Only 1 process on GPU (MPS/CUDA) at any time
   - Other sessions use CPU or WAIT
   - Check: ps aux | grep python | grep -v grep

4. [1min] Output verification
   - Experiments MUST save results to disk (JSON/CSV + model checkpoint)
   - stdout-only = results lost if session dies
   - Set 10min checkpoint: if no output file exists, something is wrong
```

### Step 1: Start Timer

Record current time, confirm end time with user.

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

| Situation | Skill | Description |
|-----------|-------|-------------|
| Unsure about approach | `/dev-decision-start` | 3-model parallel consult (Gemini+GPT-4o+Opus) |
| Quick technical question | `/dev-ask-gemini` | Single model fast response |
| Deep research needed | `/caol-research-web` | 2-agent parallel web research |
| Light research | `/caol-research-light` | Single agent quick research |

### Step 4: Implementation

| Situation | Skill | Description |
|-----------|-------|-------------|
| Full power mode | `/caol-work-ultra` | Mandatory tracking + run to completion |
| Bug found | `/dev-fix-bug` | RED→GREEN→REFACTOR proof-based fix |
| Experiment tracking | `/dev-log-experiment` | Hypothesis→Measure→Conclude cycle |
| Codebase analysis | `/caol-consult-codebase` | Read-only analysis mode |

### Step 5: Pre-submit Verification (last 30 minutes)

| Situation | Skill | Description |
|-----------|-------|-------------|
| Code quality check | `/review-audit-web` | JS/CSS coding standards |
| Spec document | `/dev-generate-spec` | Auto-generate spec from code |

---

## Multi-Session GPU Rules

**#1 cause of wasted time in hackathons is GPU contention.**

```
RULES:
1. Only 1 session owns GPU at any time
2. Assign GPU owner explicitly in devlog
3. Other sessions: CPU or wait
4. Before launching: ps aux | grep python | grep -v grep
5. If 2+ python processes on GPU → kill extras immediately
6. MPS (Apple Silicon) cannot share. Period.
```

Monitor command:
```bash
ps aux | grep -i "python.*<script>" | grep -v grep | awk '{print $2, $3, $9, $11}'
```

Kill by PID only:
```bash
kill <PID>
```

---

## Multi-Session Coordination

When running multiple Claude Code sessions:

```
Session naming: SS1, SS2, SS3, SS4
Devlog: single source of truth (Obsidian vault)
Communication: clipboard copy → paste to target session

Devlog must contain:
- Session assignment table (who does what)
- Timeline (what happened when)
- Experiment results table (all sessions update here)
- Decision log (why we chose what)
```

Template for session briefing (clipboard):
```
You are SS{N} — {role}.
Read devlog: {absolute path}
Your job: {specific task}
Constraints: {GPU/CPU, time limit, file ownership}
```

---

## Experiment Execution Protocol

```
1. SMOKE TEST FIRST (10 epochs, CPU, 1-2 min)
   - Catches: import errors, shape mismatches, cwd issues, data bugs
   - If smoke test fails → fix before real run

2. ABSOLUTE PATHS ALWAYS
   - cd /absolute/path/ && python3 script.py
   - Never rely on session cwd

3. SAVE RESULTS TO DISK
   - torch.save(model.state_dict(), 'best_model.pt')
   - Write results to JSON: {"params": N, "acc": X, "config": {...}}

4. 10-MINUTE CHECKPOINT
   - If no output file after 10min → check process, check cwd, check errors

5. ONE GPU PROCESS AT A TIME
   - Check before launching: ps aux | grep python
   - Kill extras immediately
```

---

## Quick Start Template

When problem arrives:

```
1. [5min] Pre-flight checklist (Step 0)
2. [2min] Read problem, summarize
3. [5min] /dev-decision-start "Problem: {summary}. {N} hours. Approach?"
4. [3min] Confirm approach, time allocation
5. [bulk] Implement — /dev-ask-gemini if stuck, /dev-fix-bug for bugs
6. [30min] Package + verify + submit
```

---

## Available Tools

Directly executable within this skill:

- **Python** — `python3` scripts
- **Web search** — WebSearch for docs, papers, references
- **Web fetch** — WebFetch for documentation/API refs
- **File I/O** — Read, write, edit code and data
- **Sub-agents** — Parallel research/analysis delegation
- **Process management** — ps, kill for GPU process control

---

## Project Repo

Before starting, read `~/.claude/private/caol-config/repo-paths.json` for `krafton-hackathon` path. Work in that directory.

---

## Key Rules

- **Submit once only** — double-check before submitting
- **Time management** — if stuck >1h on one approach, pivot
- **AI tools encouraged** — officially allowed, use maximally
- **Ops before experiments** — solve infrastructure first, then focus on the problem
- **The problem is usually lightweight** — if it's taking too long, it's an ops issue, not a compute issue
