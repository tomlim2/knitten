# dev-hackathon-toolkit reference

Detailed patterns and templates for the hackathon toolkit. SKILL.md holds the happy path and critical rules; this file holds the deeper operational detail.

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
Devlog: canonical source (Obsidian vault)
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

## Available Tools

Directly executable within this skill:

- **Python** — `python3` scripts
- **Web search** — WebSearch for docs, papers, references
- **Web fetch** — WebFetch for documentation/API refs
- **File I/O** — Read, write, edit code and data
- **Sub-agents** — Parallel research/analysis delegation
- **Process management** — ps, kill for GPU process control

---

## Smoke test template

```python
python3 -c "...train 10 epochs...print('OK')"
```

Use this pattern at the start of every experiment so that import errors, shape mismatches, and cwd issues fail fast on CPU in 1-2 minutes — not after 20 minutes of GPU warmup.
