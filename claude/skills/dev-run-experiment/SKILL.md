---
description: "Run ML experiments with safeguards — cwd verification, GPU check, smoke test, result saving. Use when running PyTorch training, ML experiments, or any GPU-heavy computation."
argument-hint: "<script_path> [--device mps|cpu] [--epochs N] [--smoke-first]"
allowed-tools: Bash(python3:*), Bash(cd:*), Bash(ps:*), Bash(kill:*), Bash(date:*), Read, Write, Edit, Glob, Grep
---

# dev-run-experiment

Safe ML experiment runner with built-in safeguards against common hackathon pitfalls.

## Arguments

- `<script_path>` - Absolute path to Python script
- `[--device mps|cpu]` - Device override (default: auto-detect)
- `[--epochs N]` - Override epoch count
- `[--smoke-first]` - Run 10-epoch smoke test before full run

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /dev-run-experiment <script_path> [--device mps|cpu] [--smoke-first]

## Workflow

### Step 0: Pre-flight Checklist (MANDATORY)

Run ALL checks before any experiment. Fail = do not proceed.

```
1. CWD VERIFICATION
   - Extract directory from script_path
   - Run: cd <dir> && pwd
   - If pwd doesn't match → STOP, fix path

2. GPU OWNERSHIP CHECK
   - Run: ps aux | grep python | grep -v grep
   - If any python process using GPU → WARN user
   - Rule: only 1 GPU process at a time (MPS cannot share)
   - User must kill competing process or use --device cpu

3. SCRIPT EXISTS CHECK
   - Verify script_path exists and is readable

4. TIMESTAMP
   - Record start time for logging
```

If any check fails, show the error and ask user how to proceed. Do NOT auto-fix.

### Step 1: Smoke Test (if --smoke-first)

Run 10 epochs on CPU to verify pipeline:

```bash
cd <script_dir> && python3 <script> --epochs 10 --device cpu
```

Check for:
- Import errors
- Shape mismatches
- Data loading issues
- Any crash within first 10 epochs

If smoke test fails → STOP. Fix before real run.
If smoke test passes → proceed to Step 2.

### Step 2: Execute Experiment

```bash
cd <script_dir> && python3 <script> [args]
```

- Use explicit `cd` + absolute path always
- Default device: mps > cuda > cpu (auto-detect)
- Override with --device flag

### Step 3: Save Results

After experiment completes, save to JSON:

```python
{
    "timestamp": "2026-03-28T15:30:00",
    "script": "<script_path>",
    "config": { ... },
    "params": N,
    "accuracy": X.XXXX,
    "device": "mps",
    "epochs": 200,
    "seed": 42,
    "duration_seconds": N
}
```

Save to: `<script_dir>/results_<timestamp>.json`

### Step 4: Log to Devlog (if available)

If devlog path exists in repo-paths.json → append result to Experiment Results table.

### Step 5: 10-Minute Checkpoint Rule

If running in background:
- After 10 minutes, check if output file exists
- If no output → something is wrong, investigate
- If output exists → proceeding normally

## GPU Contention Rules

```
HARD RULES:
1. Only 1 session owns GPU at any time
2. Check BEFORE launching: ps aux | grep python | grep -v grep
3. If 2+ python processes on GPU → kill extras
4. MPS (Apple Silicon) cannot share. Period.
5. CUDA can technically share but shouldn't in hackathons
6. Kill by PID only: kill <PID>
7. Never use killall python
```

## Common Failure Modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| ModuleNotFoundError | Wrong cwd | Use absolute path with cd |
| MPS out of memory | GPU contention | Kill other processes |
| Training stuck at low acc | Model too small | Increase d_model |
| Results not saved | stdout-only code | Add JSON/checkpoint saving |
| Different results each run | Seed not set | Set torch/random/numpy seeds |
