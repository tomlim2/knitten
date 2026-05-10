# dev-run-experiment reference

Detail for the dev-run-experiment skill. SKILL.md holds the happy path, Step 0 pre-flight, and GPU contention rules. This file holds schemas and sample outputs.

---

## Result JSON schema

After a run completes, save this shape to `results_<timestamp>.json`:

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

Suggested minimal save code to add to any script:

```python
import json
results = {"config": {...}, "accuracy": acc, "params": n_params}
with open(f"results_{timestamp}.json", "w") as f:
    json.dump(results, f, indent=2)
```

---

## Mode B — Sweep YAML schema

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

### Sweep comparison-table format

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

Per-run summary line: `[d32-baseline] params=17280 acc=1.0000 (4m32s)`

---

## Mode C — Seed stability sample output

```
Seed Stability Check: d32-baseline
┌──────┬─────────┬────────┐
│ Seed │ Acc     │ Status │
├──────┼─────────┼────────┤
│ 0    │ 0.9997  │ OK     │
│ 42   │ 1.0000  │ OK     │
│ 123  │ 0.9989  │ OK     │
│ 7    │ 0.9997  │ OK     │
│ 2026 │ 0.7419  │ FAIL   │
├──────┼─────────┼────────┤
│ Mean │ 0.9480  │        │
│ Min  │ 0.7419  │ UNSTABLE │
└──────┴─────────┴────────┘
Verdict: UNSTABLE (min < 0.99). Do NOT submit this config.
```
