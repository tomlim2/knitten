# Multi-Pass AI Agent Pipeline Design

**Date:** 2026-02-10
**Topic:** Multi-pass agent pipeline patterns, context dilution, error propagation

---

## Topic Overview

Multi-pass AI agent pipeline design patterns — what actually happens when chaining LLM passes, when it helps, and when it hurts.

---

## Official Guidance

Anthropic, OpenAI, Google all agree:

> **"Start with the simplest structure, and only increase complexity when measurably justified."**

Anthropic defines 5 composable patterns (simple to complex):
1. **Prompt Chaining** — Sequential calls, each processes previous output
2. **Routing** — Classify input, route to specialized handlers
3. **Parallelization** — Concurrent execution of independent subtasks
4. **Orchestrator-Workers** — Dynamic decomposition (when subtasks unpredictable)
5. **Evaluator-Optimizer** — Generate-evaluate loop (**only with clear evaluation criteria**)

Sources: [Anthropic - Building Effective Agents](https://www.anthropic.com/research/building-effective-agents), [OpenAI - A Practical Guide to Building Agents](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/)

---

## Key Findings

### 1. Context Dilution is Real and Severe

Chroma Research "Context Rot": 18 models tested, **at 32K tokens, 11 of 12 models dropped below 50% of short-context performance**. Even a single distractor reduces performance; four distractors compound degradation.

**Pipeline implication:** Each pass adding to context works against you. Pass only essential outputs, not full conversation histories.

Sources: [Chroma Research - Context Rot](https://research.trychroma.com/context-rot), [arXiv 2510.05381](https://arxiv.org/html/2510.05381v1)

### 2. Errors Compound Structurally, Not Linearly

"Contextual Drag" (Feb 2026): Incorrect answers in context bias subsequent generations toward **structurally similar errors**.

- 11 models, 88 tasks: **10-20% performance drops** when conditioned on incorrect drafts
- In iterative refinement, GPT-OSS-20B showed **"self-deterioration"** — performance gradually declined
- Independent sampling (majority voting) improved steadily
- **Neither external warnings nor self-verification prevented this** — fundamental architectural limitation

Source: [Contextual Drag (arXiv 2602.04288)](https://arxiv.org/html/2602.04288)

### 3. Self-Correction Without External Feedback Largely Fails

MIT Press survey: **"No prior work demonstrates successful self-correction with feedback from prompted LLMs"** except in specially suited tasks. Like a student grading their own test.

Self-correction works reliably ONLY when:
1. **Reliable external feedback** available (test suites, compilers, APIs)
2. Large-scale fine-tuning specifically enables it
3. Task has easily verifiable answers

**This is why Generate->Review->Refine works in coding** — test suites provide objective external feedback.

Source: [When Can LLMs Actually Correct Their Own Mistakes? (MIT Press)](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00713/125177/)

### 4. Per-Step Error Rate Matters More Than Pass Count

1% per-step error rate -> failure at ~100 steps. Most LLMs **cannot exceed a few hundred steps**. Solution is not fewer passes but extremely low per-step error rate (Massively Decomposed Agentic Processes).

Source: [Solving a Million-Step LLM Task with Zero Errors (arXiv 2511.09030)](https://arxiv.org/html/2511.09030v1)

### 5. Spotify's Gold Standard (1,500+ Merged PRs)

- **Independent verifiers** activate automatically based on codebase contents
- **LLM Judge** compares diffs against original prompt, vetoes ~25% of sessions; agent course-corrects 50% of those
- **Strict sandboxing** — agent can only view code, edit files, run verifiers
- **Static, version-controlled prompts** that are "easier to reason about"

Source: [Spotify Engineering - Feedback Loops](https://engineering.atspotify.com/2025/12/feedback-loops-background-coding-agents-part-3)

---

## Common Gotchas

| Problem | Description | Source |
|---------|-------------|--------|
| **Context Poisoning** | Hallucination enters context, gets repeatedly referenced, agent pursues impossible objectives for dozens of turns | [Galileo](https://galileo.ai/blog/context-engineering-for-agents) |
| **Infinite Loop** | No termination conditions, agent retries same tool repeatedly. GitHub Copilot pre-commit timeout -> infinite retry | [GitHub #178998](https://github.com/orgs/community/discussions/178998) |
| **Planning Error Cascade** | Planning errors "misdirect entire solution trajectories" — most severe cascade type | [arXiv 2509.25370](https://arxiv.org/abs/2509.25370) |
| **Self-Bias Amplification** | Self-review repetition monotonically increases bias. 2nd-order critique helps, higher-order is useless | [emergentmind.com](https://www.emergentmind.com/topics/self-refinement) |
| **10-Iteration Rule** | If 10 attempts don't fix it, it's architecture not prompts | [Softcery](https://softcery.com/lab/the-ai-agent-prompt-engineering-trap-diminishing-returns-and-real-solutions) |

---

## Implications for Our System

| Situation | Recommendation |
|-----------|----------------|
| External verification available (tests, build, linter) | Generate->Review->Refine **effective** |
| LLM self-judgment only for review | **Unreliable** — standards doc as checklist partially mitigates |
| 3 passes or fewer + clear purpose each | Safe zone |
| 5+ passes | Context dilution + error propagation risk spikes |

**Why `ue-write-cpp` (4 passes) can work:**
- Review pass references external checklist (`review-code-unreal-cpp.md`) — not pure self-judgment
- But no true external feedback (compiler/tests) yet
- **Adding Validate pass (build check) would significantly increase reliability**

**Action items for agent-workflow.md:**
1. Minimize data passed between passes — essential output only, not full history
2. Review passes should combine checklist with external feedback when possible
3. In loop patterns, consider independent sampling over iterative refinement (contextual drag prevention)
4. Apply 10-iteration rule — if same issue repeats, suspect the pass structure itself

---

## Framework Comparison

| Framework | Key Pattern | Metaphor |
|-----------|-------------|----------|
| **DSPy** (Stanford) | Compiler for LLM pipelines — modules, signatures, teleprompters | Compiler optimization passes |
| **MetaGPT** | "Code = SOP(Team)" — structured intermediate artifacts between roles | Assembly line |
| **LangGraph** | Agents as finite state machine nodes, conditional edges | State machine |
| **CrewAI** | Sequential/Hierarchical processes, multi-stage pipelines | Project management |
| **AutoGen** | Composable conversation patterns (sequential, group, nested) | LEGO blocks |
| **Google ADK** | SequentialAgent with shared state via InvocationContext | Assembly line |
| **Vercel AI SDK** | DurableAgent — resumable workflows, each tool call retryable | Durable execution |

---

## Diminishing Returns Curve

Practical measurement of prompt engineering effort:
- **Hours 1-5**: 35% accuracy improvement
- **Hours 6-25**: 5% accuracy improvement
- **Hours 26-65**: 1% accuracy improvement

Recommended allocation: **20% prompts, 30% evaluation, 50% architecture and tooling**.

Source: [Softcery](https://softcery.com/lab/the-ai-agent-prompt-engineering-trap-diminishing-returns-and-real-solutions)

---

## Sources

### Official & Authoritative
1. [Anthropic - Building Effective Agents](https://www.anthropic.com/research/building-effective-agents)
2. [Anthropic - Effective Harnesses for Long-Running Agents](https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents)
3. [Anthropic - Writing Tools for Agents](https://www.anthropic.com/engineering/writing-tools-for-agents)
4. [OpenAI - A Practical Guide to Building Agents](https://openai.com/business/guides-and-resources/a-practical-guide-to-building-ai-agents/)
5. [LangGraph - Plan-and-Execute](https://langchain-ai.github.io/langgraph/tutorials/plan-and-execute/plan-and-execute/)
6. [LangChain - State of Agent Engineering](https://www.langchain.com/state-of-agent-engineering)
7. [DSPy (ICLR 2024)](https://arxiv.org/abs/2310.03714)
8. [MetaGPT](https://arxiv.org/abs/2308.00352)
9. [When Can LLMs Correct Their Own Mistakes? (MIT Press)](https://direct.mit.edu/tacl/article/doi/10.1162/tacl_a_00713/125177/)

### Practical & Community
1. [Chroma Research - Context Rot](https://research.trychroma.com/context-rot)
2. [Contextual Drag (arXiv 2602.04288)](https://arxiv.org/html/2602.04288)
3. [Spotify Engineering - Feedback Loops](https://engineering.atspotify.com/2025/12/feedback-loops-background-coding-agents-part-3)
4. [Why Do Multi-Agent LLM Systems Fail? (arXiv 2503.13657)](https://arxiv.org/pdf/2503.13657)
5. [Where LLM Agents Fail (arXiv 2509.25370)](https://arxiv.org/abs/2509.25370)
6. [The Illusion of Diminishing Returns (arXiv 2509.09677)](https://arxiv.org/html/2509.09677v2)
7. [Million-Step LLM Task with Zero Errors (arXiv 2511.09030)](https://arxiv.org/html/2511.09030v1)
8. [Softcery - The AI Agent Prompt Engineering Trap](https://softcery.com/lab/the-ai-agent-prompt-engineering-trap-diminishing-returns-and-real-solutions)

### Confidence Assessment
- **High**: Context dilution, error propagation, self-correction limits — consistent across multiple independent studies
- **High**: "Start simple" principle — Anthropic, OpenAI, Google all agree
- **Medium**: Generate->Review->Refine effectiveness — validated in coding (external tests), limited for pure LLM review
- **Low**: Optimal pass count — "sweet spot exists" but specific number is task-dependent
