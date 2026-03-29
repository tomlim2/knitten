---
description: "Run ML experiments with safeguards — cwd verification, GPU check, smoke test, result saving. Use when running PyTorch training, ML experiments, or any GPU-heavy computation."
argument-hint: "<script_path> [--device mps|cpu] [--epochs N] [--smoke-first] [--sweep config.yaml] [--seed-check N]"
allowed-tools: Bash(python3:*), Bash(cd:*), Bash(ps:*), Bash(kill:*), Bash(date:*), Bash(ls:*), Bash(wc:*), Read, Write, Edit, Glob, Grep
---

# dev-run-experiment

Safe ML experiment runner with built-in safeguards. Learned from real hackathon failures.

## Arguments

- `<script_path>` - Absolute path to Python script
- `[--device mps|cpu]` - Device override (default: auto-detect)
- `[--epochs N]` - Override epoch count
- `[--smoke-first]` - Run 10-epoch CPU smoke test before full run
- `[--sweep config.yaml]` - Run multiple configs sequentially from YAML
- `[--seed-check N]` - Run same config with N different seeds to verify stability

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /dev-run-experiment <script_path> [--device mps|cpu] [--smoke-first] [--sweep config.yaml] [--seed-check N]

---

## Step 0: Pre-flight Checklist (MANDATORY — NEVER SKIP)

Run ALL checks before any experiment. ANY failure = STOP.

### 0-1. CWD Verification

```bash
SCRIPT_DIR=$(dirname "<script_path>")
cd "$SCRIPT_DIR" && pwd
```

- If pwd doesn't match → STOP, show correct path
- **WHY:** Day 1 lost 60min to cwd bugs in background bash. Absolute paths always.

### 0-2. GPU Ownership Check

```bash
ps aux | grep -E 'python|python3' | grep -v grep
```

- If ANY python process exists → **SHOW PID LIST** and ask user
- Rule: **Only 1 GPU process at a time. No exceptions.**
- MPS (Apple Silicon) CANNOT share. Multiple processes = all slower.
- User must `kill <PID>` or use `--device cpu`
- **NEVER use `killall python`** — kills Claude Code too

### 0-3. Script Exists + Readable

```bash
ls -la "<script_path>"
```

### 0-4. Disk Space Check

```bash
df -h . | tail -1
```

- If < 1GB free → WARN (model checkpoints can be large)

### 0-5. Result Output Verification

Read the script and check:
- Does it save results to a file (JSON/CSV/checkpoint)?
- If stdout-only → **WARN user: "Results will be lost if session dies. Add file output."**
- Suggest adding at minimum:

```python
import json
results = {"config": {...}, "accuracy": acc, "params": n_params}
with open(f"results_{timestamp}.json", "w") as f:
    json.dump(results, f, indent=2)
```

### 0-6. Timestamp

Record start time: `date +"%Y-%m-%dT%H:%M:%S"`

---

## Mode A: Single Experiment (default)

### Step 1: Smoke Test (if --smoke-first)

```bash
cd "$SCRIPT_DIR" && python3 <script> --epochs 10 --device cpu
```

Check for: import errors, shape mismatches, data loading, any crash.
**If smoke fails → STOP. Fix before GPU run.**
Takes ~1min. Saves up to 40min of wasted GPU time.

### Step 2: Execute

```bash
cd "$SCRIPT_DIR" && python3 <script> [args]
```

- Device priority: mps > cuda > cpu (auto-detect)
- Override with `--device` flag
- Always use explicit `cd` + absolute path

### Step 3: 10-Minute Checkpoint (background runs)

If running in background:
- After 10 minutes, check if output file exists
- If no output → something is wrong, investigate immediately
- Don't wait 40 minutes to discover failure

### Step 4: Save & Report Results

After completion:
1. Check if script saved its own results
2. If not, extract from stdout and save JSON:

```json
{
    "timestamp": "2026-03-28T15:30:00",
    "script": "<script_path>",
    "config": {},
    "params": 0,
    "accuracy": 0.0,
    "device": "mps",
    "epochs": 200,
    "seed": 42,
    "duration_seconds": 0
}
```

3. Show result summary to user

---

## Mode B: Sweep (--sweep config.yaml)

Run multiple configs **sequentially** on a single GPU.

### Sweep YAML Format

```yaml
# sweep.yaml
base:
  script: multiplier.py
  epochs: 200
  device: mps

configs:
  - name: "d32-baseline"
    args: "--d_model 32 --n_layers 2 --n_heads 2"
  - name: "d24-vq-tie"
    args: "--d_model 24 --n_layers 2 --n_heads 2 --vq-tie"
  - name: "d16-looped"
    args: "--d_model 16 --n_layers 1 --loop 4"
```

### Sweep Workflow

1. **Parse YAML** → list of configs
2. **Smoke test first config** on CPU (10 epochs) → catches code bugs once
3. **Run sequentially** — one at a time, never parallel on MPS
4. **After each run:**
   - Save result JSON: `results/<name>_<timestamp>.json`
   - Print 1-line summary: `[d32-baseline] params=17280 acc=1.0000 (4m32s)`
5. **After all runs:** print comparison table:

```
┌─────────────────┬────────┬─────────┬──────────┐
│ Config          │ Params │ Acc     │ Duration │
├─────────────────┼────────┼─────────┼──────────┤
│ d32-baseline    │ 17,280 │ 1.0000  │ 4m32s    │
│ d24-vq-tie      │  8,496 │ 0.9946  │ 3m15s    │
│ d16-looped      │  2,880 │ 0.8823  │ 2m01s    │
└─────────────────┴────────┴─────────┴──────────┘
Best (acc ≥ 0.99): d32-baseline (17,280 params)
```

6. **Save comparison** to `results/sweep_<timestamp>.json`

### Sweep Rules

- **NEVER run configs in parallel** — MPS contention kills all of them
- If a config crashes, log the error and continue to next
- User can Ctrl+C to abort sweep (partial results saved)

---

## Mode C: Seed Stability Check (--seed-check N)

Run same config with N different seeds to verify reproducibility.

### Workflow

1. Run config with seeds: 0, 42, 123, 7, 2026 (first N)
2. After all runs, report:

```
Seed Stability Check: d32-baseline
┌──────┬─────────┬────────┐
│ Seed │ Acc     │ Status │
├──────┼─────────┼────────┤
│ 0    │ 0.9997  │ ✅      │
│ 42   │ 1.0000  │ ✅      │
│ 123  │ 0.9989  │ ✅      │
│ 7    │ 0.9997  │ ✅      │
│ 2026 │ 0.7419  │ ❌      │
├──────┼─────────┼────────┤
│ Mean │ 0.9480  │        │
│ Min  │ 0.7419  │ ⚠️ UNSTABLE │
└──────┴─────────┴────────┘
Verdict: UNSTABLE (min < 0.99). Do NOT submit this config.
```

3. **Verdict logic:**
   - All seeds ≥ 99% → `STABLE ✅`
   - Any seed < 99% → `UNSTABLE ⚠️`
   - This caught d=24 instability on Day 1 (range: 74%~99%)

---

## GPU Contention Rules (HARD — NO EXCEPTIONS)

```
1. Only 1 session owns GPU at any time
2. Check BEFORE launching: ps aux | grep python | grep -v grep
3. If 2+ python processes → STOP, ask user to kill
4. MPS (Apple Silicon) CANNOT share. Period.
5. CUDA can technically share but shouldn't in hackathons
6. Kill by PID only: kill <PID>
7. NEVER killall python — this kills Claude Code
8. Serial > parallel on single GPU. Always.
```

## Common Failure Modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| ModuleNotFoundError | Wrong cwd | Use absolute path with explicit cd |
| MPS out of memory | GPU contention | Kill other python processes by PID |
| Training stuck at low acc | Model too small | Increase d_model |
| Results not saved | stdout-only code | Add JSON/checkpoint saving |
| Different results each run | Seed not set | Set torch/random/numpy seeds |
| Background run disappeared | cwd bug | Always absolute paths |
| All experiments slow | MPS contention | 1 process at a time |
| 40min wasted on failed run | No smoke test | --smoke-first always |
