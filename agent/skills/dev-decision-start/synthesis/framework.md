## Synthesis Framework

After collecting all three responses, follow this process:

### 1. Agreement Check
- **3/3 align** → High confidence. Merge and present.
- **2/3 align** → Medium confidence. Note the dissenter's reasoning explicitly.
- **All diverge** → Flag as "genuinely ambiguous — needs more context or experimentation."

### 2. Merge Steps
- Union of unique steps across all three models
- Steps mentioned by all 3 → **core actions** (high confidence)
- Steps mentioned by only 1 → potential blind spots OR noise (flag but include)

### 3. Risk Rollup
- Collect all risks and dissent points, deduplicate
- Weight: mentioned by multiple models > critic-only > single non-critic mention
- Always surface the critic's top risk prominently

### 4. Output Format

```
## Plan: <one-line title>

### Agreement
[3/3 | 2/3 | divergent] — [one sentence on where they agreed/disagreed]

### Recommended Approach
1. **Step** — what and why
2. ...

### Watch Out For
- [Risks + dissent points, ranked by severity]

### Open Questions
- [Where models diverged without resolution — may need experimentation]

### Alternatives
- [Fallback if main approach fails]
```

### 5. Rules
- Do NOT blindly pick the majority — if the critic raises a valid showstopper, surface it
- Do NOT average approaches — pick one and note trade-offs
- Keep the final plan under 30 lines — actionable, not academic
