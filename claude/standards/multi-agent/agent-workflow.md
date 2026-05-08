---
status: accepted
---
# Agent Workflow Standard

**Version:** 1.1.0

Standard patterns for multi-pass agent commands in Claude Code.

---

## Changelog

- **1.1.0** - Research-backed guidance on Review reliability, context minimization, loop risks
- **1.0.0** - Initial release formalizing existing agent patterns (bug-fix, ultrawork, consult, research)

---

## Purpose

This document defines the standard structure for **agent commands** — commands that chain multiple passes to accomplish complex tasks. It formalizes patterns already in use and provides building blocks for creating new agents.

**Agent definition:** A command with 2+ passes, where each pass has a distinct purpose and the output of one pass feeds the next.

---

## When to Use an Agent

| Simple Command | Agent |
|----------------|-------|
| Single-step execution | 2+ passes with distinct purposes |
| References one standard | Combines multiple standards |
| Produces single output | Passes data between steps |
| Linear tool usage | Orchestrates subagents or tool chains |

**Existing agents:** `bug-fix` (RGR), `ultrawork` (Linear), `consult` (EAR), `research` (Fan-Out/Fan-In)

---

## Pass Types

Eight building blocks for composing agent pipelines. Each pass type has a defined purpose, typical inputs/outputs, and tool affinity.

### 1. Understand

Grasp the problem, define scope, gather context.

- **Input:** User argument, codebase state
- **Output:** Problem statement, scope definition, relevant file list
- **Tools:** Read, Glob, Grep, Bash(git:*)
- **Reference:** none (or project entry document)
- **Example:** `bug-fix` Step 1 reads code to identify root cause; `ultrawork` Step 1 reads all relevant context

### 2. Explore

Search the codebase for patterns, dependencies, and related code.

- **Input:** Problem statement or file list from Understand
- **Output:** Code map, dependency graph, pattern inventory
- **Tools:** Glob, Grep, Read, Task(Explore)
- **Reference:** none
- **Example:** `consult` traces code paths; `ultrawork` runs aggressive parallel exploration

### 3. Generate

Produce code or content following a bound standard.

- **Input:** Problem statement, code map, requirements
- **Output:** New or modified files
- **Tools:** Write, Edit, Read
- **Reference:** Domain standard (e.g., `unreal-engine-cpp.md`, `javascript.md`, `design-system.md`)
- **Example:** `bug-fix` Step 2 implements the fix; code generation commands

### 4. Review

Verify output against a checklist or standard. Read-only pass.

- **Input:** Generated files from Generate pass
- **Output:** Issue table (Severity, Category, Location, Issue, Fix)
- **Tools:** Read, Grep, Glob
- **Reference:** Review standard (e.g., `review-code-unreal-cpp.md`, `review-template.md`)
- **Example:** `bug-fix` Step 3 runs the test to verify; code review commands

> **Reliability warning:** LLM self-review without external feedback is unreliable (MIT Press). A checklist partially mitigates this, but real confidence comes from Validate (external tools). Always pair Review with Validate when possible.

### 5. Refine

Fix issues found during Review. Targeted edits only.

- **Input:** Issue table from Review pass
- **Output:** Updated files with issues resolved
- **Tools:** Edit, Read
- **Reference:** Same as Generate (for consistency)
- **Example:** Post-review fixes before final delivery

### 6. Validate

Run external tools to confirm correctness. Build, test, lint.

- **Input:** Files from Generate or Refine
- **Output:** Pass/fail result with error details
- **Tools:** Bash(npm:*), Bash(pytest:*), Bash(node:*), Task
- **Reference:** none
- **Example:** `bug-fix` Step 3 runs the test suite; `ultrawork` verifies tests pass

> **Prefer Validate over Review.** External feedback (build, test, linter) is fundamentally more reliable than LLM judgment. The reason Generate→Review→Refine works in coding agents is the test suite, not the LLM's opinion. Use Validate instead of or alongside Review whenever external tools are available.

### 7. Synthesize

Merge results from parallel passes into a unified view.

- **Input:** Multiple outputs from fan-out passes
- **Output:** Unified analysis, merged findings
- **Tools:** Read, Write
- **Reference:** none
- **Example:** `research` combines Agent 1 + Agent 2 findings

### 8. Report

Format final output for the user.

- **Input:** Results from all prior passes
- **Output:** Structured report in defined format
- **Tools:** (text output, no tools)
- **Reference:** Output format template
- **Example:** `bug-fix` Bug Fix Report; `consult` structured response; `research` final synthesis

---

## Pass Interface

Every pass in an agent MUST declare these 6 fields:

| Field | Description | Example |
|-------|-------------|---------|
| **Name** | `Pass N: {PassType}` | `Pass 1: Understand` |
| **Purpose** | One sentence | "Identify root cause and affected files" |
| **Input** | Previous pass output or user argument | `$ARGUMENTS`, "Issue table from Pass 3" |
| **Reference** | Standard path to read at pass start, or "none" | `~/.claude/standards/unreal/unreal-engine-cpp.md` |
| **Output** | What this pass produces | "Modified .cpp and .h files" |
| **Execution** | `Inline` or `Subagent` | `Inline` |

### Template

```markdown
### Pass N: {PassType}

**Purpose:** {one sentence}
**Input:** {source}
**Reference:** {standard path or "none"}
**Output:** {deliverable}
**Execution:** {Inline or Subagent}

{Pass instructions...}
```

---

## Pipeline Composition

Four patterns for connecting passes. Choose the simplest pattern that fits.

### 1. Linear

Passes execute sequentially. Output of each feeds the next.

```
Pass 1 → Pass 2 → Pass 3 → Pass 4
```

**Use when:** Each step depends on the previous step's output.
**Examples:** `bug-fix` (Understand → Generate → Validate), `ultrawork` (Understand → Generate → Validate → Report)

### 2. Fan-Out / Fan-In

One pass spawns parallel subagents, then a Synthesize pass merges results.

```
Pass 1 → [Pass 2a | Pass 2b | Pass 2c] → Pass 3: Synthesize
```

**Use when:** Independent subtasks can run in parallel.
**Examples:** `research` (two parallel research agents → synthesis)
**Rule:** Fan-out MUST be followed by a Synthesize pass.

### 3. Conditional

A pass routes to different next passes based on its output.

```
Pass 1 → (condition) → Pass 2a OR Pass 2b
```

**Use when:** Different inputs require different treatment.
**Example:** `bug-fix` Step 4 (if test not feasible → Document instead of Validate)

### 4. Loop

Generate → Review → Refine cycles until issues are resolved.

```
Pass 2: Generate → Pass 3: Review → Pass 4: Refine → (issues remain?) → Pass 3
```

**Use when:** Quality requires iterative refinement.
**Rule:** MUST declare maximum iteration count. Default max: 2 iterations.

> **Contextual Drag warning:** Repeated refinement can cause self-deterioration — each iteration adds prior attempts to context, which may degrade rather than improve output. If the same issue persists after 2 iterations, suspect the pass structure itself rather than iterating further. A fresh Generate with a better prompt often outperforms a 4th Refine attempt.

---

## Pipeline Rules

**Core principle:** An agent's value comes from **connections between passes**, not the number of passes. A pass is justified only when it transforms the previous pass's output into something the next pass couldn't produce alone. If a pass ignores what came before it, it's not a pass — it's an independent command that should be run separately.

```
Good:  Review finds 3 issues → Refine fixes exactly those 3
Bad:   Step 1 finishes → Step 2 starts (ignores Step 1 output)
```

The second case is a script, not an agent. Just run the commands sequentially.

**More passes = more risk:**
- Context dilutes as the pipeline grows — later passes lose earlier nuance
- Errors propagate — a wrong judgment in Pass 2 corrupts Pass 3, 4, 5
- Debugging gets harder — which pass introduced the problem?

**Rules:**

1. **5 passes maximum** — More passes dilute context and propagate errors. If you need more, split into smaller agents.
2. **Every pass must depend on the previous output** — If a pass works the same regardless of what came before, it doesn't belong in this agent.
3. **Loop max iterations** — Always declare. Default is 2. Never exceed 3.
4. **Fan-out requires Synthesize** — Never leave parallel results unmerged.
5. **No pass without purpose** — If two passes do the same thing, merge them.
6. **Subagent for heavy exploration** — Use `Execution: Subagent` when a pass does broad codebase search.
7. **Minimize pass output** — Pass only the essential deliverable to the next pass, not the full history. Most models degrade below 50% effectiveness past 32K tokens of context. Strip reasoning traces, intermediate attempts, and verbose logs before hand-off.

---

## What Drives Quality

Pipeline structure matters less than the standards it enforces. In order of impact:

1. **Standard document quality** — A precise, well-scoped standard catches more issues than adding passes. Bad standard + 5-pass agent < Good standard + single Generate pass.
2. **Pipeline structure** — Correct pass types in the right order, with proper data flow.
3. **Pass count** — More passes only help when each one genuinely transforms the output.

The agent is a delivery mechanism for standards. If output quality is poor, improve the standard first, then re-evaluate the pipeline.

---

## Standard Reference Binding

Standards bind at the **pass level**, not the agent level. The same standard can serve different roles in different passes.

### Binding Rules

1. **Read at pass start** — Only read the standard when the pass begins, not upfront.
2. **One standard per pass** — If a pass needs two standards, it's doing too much. Split it.
3. **Role determines usage** — A standard used in Generate is a rulebook; the same standard in Review is a checklist.

### Binding Table Template

Every agent command MUST include a binding table:

```markdown
## Standard Binding

| Pass | Standard | Role |
|------|----------|------|
| Pass 1: Understand | none | — |
| Pass 2: Generate | `unreal-engine-cpp.md` | Coding rules |
| Pass 3: Review | `review-code-unreal-cpp.md` | Review checklist |
| Pass 4: Refine | (Review output) | Fix list |
```

---

## Output Format

Agent output MUST be structured by pass for traceability.

### Pass Headers

Each pass outputs under a header:

```markdown
## [Pass N: {Type} — {Status}]
```

Status values: `DONE`, `SKIPPED`, `ISSUES FOUND`, `PASSED`, `FAILED`

### Issue Table (for Review passes)

```markdown
| # | Severity | Category | Location | Issue | Fix |
|---|----------|----------|----------|-------|-----|
| 1 | Critical | Memory | File.cpp:42 | Raw pointer without UPROPERTY | Add UPROPERTY macro |
| 2 | Warning | Naming | File.h:15 | Non-PascalCase variable | Rename to PascalCase |
```

Severity levels: `Critical`, `Warning`, `Suggestion`

### Final Deliverable

After all passes, include:

```markdown
## Deliverable

**Files changed:**
- `path/to/file.cpp` — Description of change
- `path/to/file.h` — Description of change

**Summary:** {1-2 sentences}
```

---

## Integration

Agent commands follow ALL rules from `slash-commands.md` plus these additions:

1. **Pre-execution runs once** — At agent start, not per pass.
2. **Frontmatter follows standard** — Same field order, same Bash specificity rules.
3. **Naming follows convention** — `{category}-{verb}-{subject}` pattern.
4. **Pipeline declared in command** — The command file declares the full pipeline shape.
5. **Argument validation** — Same guard rules as regular commands.

---

## Agent Templates

Four reusable templates covering common agent patterns.

### Template 1: Generate-Review-Refine (GRR)

**For:** Code generation with quality enforcement.

```
Pipeline: [Understand] → [Generate] → [Review] → [Refine]
Shape: Linear (with optional Review→Refine loop, max 2)
```

| Pass | Type | Standard Role |
|------|------|---------------|
| 1 | Understand | none |
| 2 | Generate | Domain standard as rulebook |
| 3 | Review | Review standard as checklist |
| 4 | Refine | Fix issues from Review |

**Existing:** (none yet — `ue-write-cpp` is the first implementation)

### Template 2: Red-Green-Refactor (RGR)

**For:** Bug fixing with test-first verification.

```
Pipeline: [Understand + Reproduce] → [Generate Fix] → [Validate]
Shape: Linear, 3 passes
```

| Pass | Type | Standard Role |
|------|------|---------------|
| 1 | Understand | none — write failing test |
| 2 | Generate | none — implement fix |
| 3 | Validate | none — run test, must pass |

**Existing:** `bug-fix`

### Template 3: Explore-Analyze-Recommend (EAR)

**For:** Read-only analysis and consultation.

```
Pipeline: [Understand] → [Explore] → [Report]
Shape: Linear, 3 passes (read-only)
```

| Pass | Type | Standard Role |
|------|------|---------------|
| 1 | Understand | none — restate question |
| 2 | Explore | Domain standard as reference |
| 3 | Report | none — structured recommendation |

**Existing:** `consult`

### Template 4: Parallel Research (PR)

**For:** Information gathering from multiple angles.

```
Pipeline: [Understand] → [Explore A | Explore B] → [Synthesize] → [Report]
Shape: Fan-Out/Fan-In, 4 passes
```

| Pass | Type | Standard Role |
|------|------|---------------|
| 1 | Understand | none — define research scope |
| 2a | Explore | Official sources |
| 2b | Explore | Practical / community sources |
| 3 | Synthesize | Cross-reference and merge |
| 4 | Report | Structured findings |

**Existing:** `research`

---

## Testing Checklist

Before finalizing an agent command, verify:

- [ ] `slash-commands.md` rules followed (frontmatter, pre-execution, naming, argument guard)
- [ ] Pipeline shape declared (Linear, Fan-Out, Conditional, or Loop)
- [ ] Each pass declares all 6 interface fields (Name, Purpose, Input, Reference, Output, Execution)
- [ ] Standard Binding table present
- [ ] Output format defined with pass headers
- [ ] 5 passes or fewer
- [ ] Loops declare max iteration count
- [ ] Fan-out followed by Synthesize
- [ ] Agent template identified (GRR, RGR, EAR, PR, or custom)

---

## Related Files

- `slash-commands.md` — Command authoring standard (agents are commands)
- `unreal-engine-cpp.md` — UE C++ coding standard (Generate pass reference)
- `review-code-unreal-cpp.md` — UE C++ review checklist (Review pass reference)
- `review-template.md` — Code review output format
- `delegation.md` — Task delegation patterns

---

## Version History

- **1.1.0** (2026-02-10) - Research-backed guidance on Review reliability, context minimization, loop risks
- **1.0.0** (2026-02-10) - Initial standard formalizing existing agent patterns
