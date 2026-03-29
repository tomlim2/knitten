---
description: "Generate a magazine of approaches (접근법 탄창) for a problem — pre-made task instructions ready to dispatch to idle agents. Use when tackling hard problems requiring multiple parallel attempts."
allowed-tools: Read, Write, Edit, Bash(pbcopy:*)
argument-hint: "<problem_description>"
---

# dev-make-magazine

Generate a prioritized list of approaches (탄창) with ready-to-paste instructions for each.

## Arguments

- `<problem_description>` - The problem to generate approaches for

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /dev-make-magazine <problem_description>

## Workflow

### Step 1: Analyze Problem
- Identify the problem domain
- List known constraints
- Note what has already been tried (if any)

### Step 2: Generate 10-15 Approaches
For each approach:
- Name and one-line description
- Why it might work
- Why it might fail
- Estimated runtime
- Priority (1-5 stars)

Categories to consider:
- Exact/algebraic methods
- Statistical/probabilistic methods
- Numerical optimization (GD, SA, GA)
- Search-based (exhaustive, MITM, branch-and-bound)
- AI/ML methods
- Reduction to known problems (SAT, MILP, LP)
- External AI consultation (Gemini, GPT-4o)

### Step 3: Write Dispatch-Ready Instructions
For each approach, write a complete clipboard-ready instruction block:
```
[Approach name]
작업 디렉토리: ...
데이터: ...
1분 넘으면 킬. devlog.md 기록.

[Specific implementation instructions]

파일: solve_xxx.py → results_xxx.json
결과: {"offsets": [...], "method": "...", "success": bool, "analysis": "..."}
```

### Step 4: Save as 접근법_탄창.md
- Checkbox format: `- [ ] #1 Approach Name → 배정 호기`
- Mark dispatched approaches with `- [x]`
- Priority order

### Step 5: Clipboard Copy on Demand
When user says "다음" or specifies an agent:
1. Copy next undispatched approach to clipboard
2. Mark as dispatched in 탄창

## Key Rules
- Each approach must be self-contained (agent can execute without context)
- Include validation criteria (e.g. "accuracy > 80% = success")
- Include kill policy reminder
- Include devlog recording requirement
