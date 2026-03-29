---
description: "Analyze why an approach failed by asking abstract questions to external AI (Gemini, GPT-4o). Use when stuck — all attempts failing, need fundamental insight to pivot."
allowed-tools: Read, Write, Bash(pbcopy:*), Bash(python3:*)
argument-hint: "<what_failed>"
---

# dev-analyze-failure

When all approaches fail, step back and ask WHY at an abstract level.

## Arguments

- `<what_failed>` - Brief description of what's failing

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /dev-analyze-failure <what_failed>

## Workflow

### Step 1: Gather Failure Evidence
- List all attempted approaches
- Note their results (e.g. "all 50% accuracy")
- Identify the common pattern of failure

### Step 2: Formulate Abstract Questions
DO NOT ask "how to fix my code." Instead ask:

**Question types (progressively abstract):**

1. **Structural:** "이 문제를 가장 자연스럽게 설명하는 수학적 프레임워크는?"
2. **Perspective:** "여러 렌즈 (정보이론, 통계학, 대수학, ...)에서 이 문제를 보면?"
3. **Non-obvious:** "이 구조에서 놓치기 쉬운 비직관적인 성질은?"
4. **Optimal:** "이론적으로 최적의 알고리즘은? 실용적으로는?"
5. **Meta:** "출제자가 보고 싶어하는 역량은?"

**Key: 구체적으로 물으면 구체적 답만 온다. 추상적으로 물어야 새로운 각도가 나온다.**

### Step 3: Multi-AI Consultation
Use `/dev-decision-start` or prepare clipboard for Gemini:

```
[Problem의 추상적 구조 설명]
[시도한 것들과 왜 실패했는지]
[질문 3-5개]
```

### Step 4: Extract Actionable Insight
From AI responses, find:
- **Name of the problem** (e.g. "이건 Sparse LPN이다")
- **Why current approaches fail** (e.g. "Piling-up Lemma")
- **What approach CAN work** (e.g. "BKW algorithm")
- **Implementation hint** (e.g. specific code)

### Step 5: Pivot
- Update 계획설계.md with new direction
- Kill all stale processes
- Dispatch new approach to agents

## Key Principle

> 전부 실패하면 더 세게 밀지 말고, 한 발 물러서서 왜 안 되는지 물어라.
> 답은 코드가 아니라 수학에 있다.

## Example Pivot (SparseTap Hackathon)
- 실패: Greedy, GD, LASSO, RANSAC — 전부 50%
- 추상적 질문: "GF(2) 위 sparse recovery에서 놓치기 쉬운 성질은?"
- 인사이트: **Piling-up Lemma — 부분 점수 없음**
- Pivot: BKW algorithm → 0.78초에 정답
