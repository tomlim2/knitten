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

ANY failure = STOP.

### 0-1. CWD Verification

```bash
SCRIPT_DIR=$(dirname "<script_path>")
cd "$SCRIPT_DIR" && pwd
```
If pwd doesn't match → STOP, show correct path. **WHY:** Day 1 lost 60min to cwd bugs. Absolute paths always.

### 0-2. GPU Ownership Check

```bash
ps aux | grep -E 'python|python3' | grep -v grep
```
- If ANY python process exists → **SHOW PID LIST**, ask user.
- **Only 1 GPU process at a time. No exceptions.**
- MPS (Apple Silicon) CANNOT share.
- User must `kill <PID>` or use `--device cpu`.
- **NEVER use `killall python`** — kills Claude Code too.

### 0-3. Script Exists + Readable

```bash
ls -la "<script_path>"
```

### 0-4. Disk Space Check

```bash
df -h . | tail -1
```
< 1GB free → WARN (model checkpoints can be large).

### 0-5. Result Output Verification

Read script — does it save results to file (JSON/CSV/checkpoint)? If stdout-only, WARN: "Results will be lost if session dies. Add file output."

### 0-6. Timestamp

`date +"%Y-%m-%dT%H:%M:%S"`

---

## Mode A: Single Experiment (default)

### Step 1: Smoke Test (if --smoke-first)

```bash
cd "$SCRIPT_DIR" && python3 <script> --epochs 10 --device cpu
```
Check for: import errors, shape mismatches, data loading, any crash. **If smoke fails → STOP.** ~1min saves up to 40min of wasted GPU time.

### Step 2: Execute

```bash
cd "$SCRIPT_DIR" && python3 <script> [args]
```
Device priority: mps > cuda > cpu (auto-detect). Always explicit `cd` + absolute path.

### Step 3: 10-Minute Checkpoint (background runs)

After 10 minutes, check if output file exists. If no output → investigate immediately. Don't wait 40 minutes.

### Step 4: Save & Report Results

After completion, check for self-saved results. If not, extract from stdout and save JSON with: timestamp, script, config, params, accuracy, device, epochs, seed, duration_seconds. Show summary to user.

---

## Mode B: Sweep (--sweep config.yaml)

Run multiple configs **sequentially** on a single GPU.

Workflow:
1. Parse YAML → list of configs
2. Smoke test first config on CPU (10 epochs) — catches code bugs once
3. Run sequentially — **NEVER parallel on MPS**
4. After each run: save `results/<name>_<timestamp>.json` + print 1-line summary
5. After all runs: print comparison table, save `results/sweep_<timestamp>.json`

Rules:
- **NEVER parallel on MPS** — contention kills all
- If a config crashes, log and continue
- Ctrl+C aborts sweep (partial results saved)

See [reference.md](reference.md) for the sweep YAML schema and the comparison-table format.

---

## Mode C: Seed Stability Check (--seed-check N)

Run same config with N different seeds (0, 42, 123, 7, 2026 — first N).

Verdict logic:
- All seeds ≥ 99% → `STABLE`
- Any seed < 99% → `UNSTABLE` (do NOT submit)

This caught d=24 instability on Day 1 (range 74%~99%). See reference.md for sample output.

---

## GPU Contention Rules (HARD — NO EXCEPTIONS)

1. Only 1 session owns GPU at any time
2. Check BEFORE launching: `ps aux | grep python | grep -v grep`
3. If 2+ python processes → STOP, ask user to kill
4. MPS (Apple Silicon) CANNOT share. Period.
5. CUDA can technically share but shouldn't in hackathons
6. Kill by PID only: `kill <PID>`
7. **NEVER `killall python`** — kills Claude Code
8. Serial > parallel on single GPU. Always.

## Common Failure Modes

| Symptom | Cause | Fix |
|---------|-------|-----|
| ModuleNotFoundError | Wrong cwd | Absolute path + explicit cd |
| MPS out of memory | GPU contention | Kill other python by PID |
| Training stuck at low acc | Model too small | Increase d_model |
| Results not saved | stdout-only | Add JSON/checkpoint saving |
| Different results each run | Seed not set | Set torch/random/numpy seeds |
| Background run disappeared | cwd bug | Absolute paths |
| All experiments slow | MPS contention | 1 process at a time |
| 40min wasted on failed run | No smoke test | `--smoke-first` always |

## Additional Resources

For the sweep YAML schema, comparison-table format, result JSON schema, and the seed-stability sample output, see [reference.md](reference.md).
