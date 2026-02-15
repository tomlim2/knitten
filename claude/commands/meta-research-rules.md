---
description: Research rules for better agents and skill commands
argument-hint: "<aspect or question>"
allowed-tools: Task, WebSearch, WebFetch, Read, Write, Glob, Grep
---

# meta-research-rules

Find actionable criteria and rules for improving Claude Code agents and skill commands.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `meta-research-rules`

## Target

$ARGUMENTS

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

```
Usage: /research-rules <aspect or question>
Example: /research-rules LLM self-review reliability
Example: /research-rules multi-step agent context management
Example: /research-rules prompt chaining error propagation
```

## Context

Read these files first to understand what the current standards say (or don't say) about the target topic:

- `~/.claude/standards/agent-workflow.md` — Agent patterns and pipeline rules
- `~/.claude/standards/slash-commands.md` — Command authoring standard

Note any gaps — the goal is to find rules that fill them.

## Execution Strategy

Launch **two agents in parallel**:

### Agent 1: Academic & Research

Search for research papers, studies, and formal analysis.

**Task**: Search for and analyze:
- Academic papers on LLM agent architectures and reliability
- Formal evaluations of multi-step LLM pipelines
- Studies on prompt chaining, self-correction, context management
- Benchmark results and failure mode analysis

**Output**: Return key findings, cited claims, and evidence-backed rules with source URLs.

### Agent 2: Industry Practice & Engineering

Search for production experience and engineering best practices.

**Task**: Search for and analyze:
- Blog posts from AI labs (Anthropic, OpenAI, DeepMind, etc.)
- Production agent frameworks (LangChain, CrewAI, AutoGen, etc.)
- Engineering post-mortems and lessons learned
- Community discussions on agent reliability and patterns

**Output**: Return practical rules, common failure modes, and battle-tested patterns with source URLs.

## Synthesis

After both agents complete:

1. **Cross-reference** academic findings with industry practice
2. **Extract rules** — Each finding becomes an actionable rule statement
3. **Map to standards** — Identify which existing standard each rule could improve
4. **Rate confidence** — High (multiple sources agree), Medium (single strong source), Low (speculative)

## Output Format

### Research Summary
[1-2 paragraphs: what was researched and why it matters for our agent/skill design]

### Key Findings

For each finding:

> **Finding N: {Title}**
> {Description with evidence}
> - **Source:** [URL]
> - **Rule:** {Actionable one-sentence rule}
> - **Applies to:** {agent-workflow.md / slash-commands.md / new standard}
> - **Confidence:** High / Medium / Low

### Actionable Rules Summary

| # | Rule | Target Standard | Confidence |
|---|------|-----------------|------------|
| 1 | ... | agent-workflow.md | High |
| 2 | ... | slash-commands.md | Medium |

### Sources

1. [Title] - [URL] - {Academic / Industry}
2. ...

### Gaps

[What we couldn't find or needs more research]

## Save to Private

Always save research output to:

```
~/.claude/private/research/{topic-slug}.md
```

This builds a knowledge base for iterative standard improvement.
