---
description: Write UE C++ code with standards and self-review
argument-hint: "<description or file path>"
allowed-tools: Read, Write, Edit, Glob, Grep, Task
---

# ue-write-cpp

Write Unreal Engine C++ code with built-in standards enforcement and self-review.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `ue-write-cpp`

## Arguments

- `<description or file path>` - What to write (e.g., "GameMode에 플레이어 스폰 로직 추가") or path to existing file to modify

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: /ue-write-cpp <description or file path>

## Agent Configuration

**Template:** Generate-Review-Refine (GRR)
**Pipeline:** `[Understand] → [Generate] → [Review] → [Refine]`
**Shape:** Linear, 4 passes

## Standard Binding

| Pass | Standard | Role |
|------|----------|------|
| Pass 1: Understand | none | Scope the task |
| Pass 2: Generate | `unreal-engine-cpp.md` | UE C++ coding rules |
| Pass 3: Review | `review-code-unreal-cpp.md` | Full review checklist |
| Pass 4: Refine | (Review output) | Fix list |

---

## Pass 1: Understand

**Purpose:** Identify what to write and gather existing code context.
**Input:** `$ARGUMENTS`
**Reference:** none
**Output:** Task scope, target files, existing patterns to follow
**Execution:** Inline

1. Parse the argument — is it a description of new functionality, or a path to modify?
2. If modifying existing code:
   - Read the target file(s)
   - Read related headers and implementations
   - Identify the class hierarchy and module boundaries
3. If writing new code:
   - Search for similar patterns in the codebase (`Glob` for similar class names, `Grep` for similar functionality)
   - Identify the correct module and directory
   - Read neighboring files to match conventions
4. Produce a brief scope statement: what files will be created/modified and why

---

## Pass 2: Generate

**Purpose:** Write UE C++ code following the coding standard.
**Input:** Scope from Pass 1
**Reference:** Read `~/.claude/standards/unreal-engine-cpp.md` before writing any code
**Output:** New or modified .h and .cpp files
**Execution:** Inline

1. Read `~/.claude/standards/unreal-engine-cpp.md`
2. Write code following ALL rules from the standard:
   - Brace style (always braces, even single-line bodies)
   - Loop variable naming (meaningful names, not `i`/`j`)
   - PascalCase naming (class prefixes, boolean `b` prefix, etc.)
3. For new files: include proper copyright header, `#pragma once`, includes
4. For modifications: match existing file style, minimize diff
5. Write/Edit the files

---

## Pass 3: Review

**Purpose:** Verify generated code against the full review checklist.
**Input:** Files from Pass 2
**Reference:** Read `~/.claude/standards/review-code-unreal-cpp.md` and use as checklist
**Output:** Issue table
**Execution:** Inline

1. Read `~/.claude/standards/review-code-unreal-cpp.md`
2. Read every file written or modified in Pass 2
3. Check against ALL categories in the review standard:
   - General code quality (readability, naming, DRY, error handling)
   - Security (no secrets, input validation)
   - C++ specific (smart pointers, RAII, const correctness, nullptr)
   - UE specific (UPROPERTY, UFUNCTION, memory management, containers, threading, performance, naming, Blueprint integration, networking)
4. Record every finding in the issue table:

| # | Severity | Category | Location | Issue | Fix |
|---|----------|----------|----------|-------|-----|

5. If no issues found, output "No issues found — code passes all checks."

---

## Pass 4: Refine

**Purpose:** Fix all issues found during Review.
**Input:** Issue table from Pass 3
**Reference:** none (fixes are defined in the issue table)
**Output:** Updated files with all issues resolved
**Execution:** Inline

1. If Pass 3 found no issues, skip this pass
2. For each issue in the table:
   - Apply the fix described in the "Fix" column
   - Verify the fix doesn't introduce new issues
3. After all fixes applied, do a quick re-read of changed files to confirm consistency

---

## Output Format

```markdown
## [Pass 1: Understand — DONE]

**Task:** {scope statement}
**Target files:** {list}
**Existing patterns:** {brief notes}

---

## [Pass 2: Generate — DONE]

**Files written:**
- `path/to/File.h` — {description}
- `path/to/File.cpp` — {description}

**Standard applied:** `unreal-engine-cpp.md`

---

## [Pass 3: Review — {PASSED or ISSUES FOUND}]

**Checklist:** `review-code-unreal-cpp.md`

| # | Severity | Category | Location | Issue | Fix |
|---|----------|----------|----------|-------|-----|
| ... | ... | ... | ... | ... | ... |

---

## [Pass 4: Refine — {DONE or SKIPPED}]

**Fixes applied:** {count}
{list of fixes}

---

## Deliverable

**Files changed:**
- `path/to/File.h` — {description}
- `path/to/File.cpp` — {description}

**Summary:** {1-2 sentences}
```

---

## Example

```
/ue-write-cpp GameMode에 플레이어 스폰 로직 추가
```

Pass 1 reads existing GameMode files, finds spawn-related code.
Pass 2 writes `SpawnPlayer()` method following UE C++ standard.
Pass 3 reviews against checklist — finds missing UFUNCTION macro.
Pass 4 adds the macro, confirms consistency.
