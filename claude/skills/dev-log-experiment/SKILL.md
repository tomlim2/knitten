---
description: Log and track iterative experiments with hypothesis→measure→conclude cycle
argument-hint: "<action> [project/topic]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash(ls:*), Bash(cat:*), Bash(pbcopy:*)
---

# dev-log-experiment

Track iterative experiments using hypothesis-driven development. Each experiment records params, metrics, and conclusion in a structured markdown file.

## Purpose

When debugging complex systems (retargeting, rendering, animation), ad-hoc trial-and-error wastes time and repeats dead ends. This skill enforces:
1. **Hypothesis before code** — predict what will happen
2. **Fail threshold upfront** — define when to abandon
3. **Metrics before/after** — measure, don't guess
4. **Dead ends recorded** — never retry what failed

---

## Usage

### Start a new experiment session
```
/dev-log-experiment start <project>/<topic>
```
Example: `/dev-log-experiment start bevy-vrm/retarget-shoulder`

Creates `temp-learnings/<project>/experiments-<topic>.md` with session header.

### Add an experiment
```
/dev-log-experiment add <hypothesis>
```
Example: `/dev-log-experiment add "9° Z-offset on upperArm reduces elbow min to 0.10m"`

Appends a new `EXP-NNN` entry with hypothesis, empty params/metrics tables.

### Record results
```
/dev-log-experiment result <status>
```
Status: `succeeded`, `failed`, `abandoned`

Prompts for metrics, conclusion, and next steps. Updates the current experiment.

### Show status
```
/dev-log-experiment status
```
Shows current session summary table.

---

## Workflow

### 1. `/dev-log-experiment start bevy-vrm/retarget-shoulder`

Creates:
```markdown
---
project: bevy-vrm
topic: retarget-shoulder
started: 2026-03-27
baseline-commit: {auto from git}
---

# Experiments: bevy-vrm / retarget-shoulder

## Goal
{user fills in}

## Baseline
{capture current RQ metrics here}
```

### 2. `/dev-log-experiment add "hypothesis here"`

Appends:
```markdown
## EXP-001: {auto title from hypothesis}

- **Status**: `active`
- **Hypothesis**: {from argument}
- **Fail threshold**: {ask user}

### Params
| File | Change | Before | After |
|------|--------|--------|-------|

### Metrics
| Metric | Before | After | Delta |
|--------|--------|-------|-------|

### Conclusion
{pending}
```

### 3. After implementing and measuring: `/dev-log-experiment result succeeded`

Updates current EXP:
```markdown
- **Status**: `succeeded`

### Conclusion
{user provides}

### Next
→ EXP-002: {next hypothesis}
```

### 4. `/dev-log-experiment status`

Outputs:
```
## Session: bevy-vrm/retarget-shoulder (3 experiments)

| # | Title | Status | Key Delta |
|---|-------|--------|-----------|
| 001 | Z-offset 9° | succeeded | elbow +0.04m |
| 002 | Z-offset 15° | failed | arm angle unnatural |
| 003 | Elbow min constraint | active | — |

Dead ends: EXP-002 (Z-offset > 12° causes unnatural arm angle)
```

---

## File Structure

```
temp-learnings/
├── bevy-vrm/
│   ├── experiments-retarget-shoulder.md
│   ├── experiments-retarget-wrist.md
│   └── experiments-expression.md
├── anju/
│   └── experiments-shader-perf.md
```

---

## Experiment Entry Template

```markdown
## EXP-{NNN}: {short title}

- **Status**: `active | succeeded | failed | abandoned`
- **Hypothesis**: If {change}, then {measurable outcome}.
- **Fail threshold**: {metric} > {value} → abandon

### Params
| File | Change | Before | After |
|------|--------|--------|-------|

### Metrics
| Metric | Before | After | Delta |
|--------|--------|-------|-------|

### Conclusion
{What happened and why}

### Next
→ EXP-{NNN+1}: {next hypothesis or "DONE"}
```

---

## Rules

1. **One variable per experiment** — change one thing, measure one thing
2. **Always record failures** — "didn't work because X" is valuable data
3. **Fail threshold before running** — prevents post-hoc rationalization
4. **Metrics are numbers** — "looks better" is not a metric, "elbow min 0.02→0.10m" is
5. **Dead ends section** — accumulated across all experiments, never retry
6. **Conclude resolved topics** — move key learnings to project learnings file, archive experiment log

---

## Files

- `SKILL.md` — This file (skill definition and templates)
