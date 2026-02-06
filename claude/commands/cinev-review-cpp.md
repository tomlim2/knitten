---
description: "Review C++ code against UE coding standards"
argument-hint: "[file or diff range]"
allowed-tools: "Bash(git *), Read, Grep, Glob"
---

# Code Review

Review C++ code changes against Unreal Engine coding standards and project conventions.

## Instructions

You are tasked with reviewing C++ code. Follow the cinev-review-code agent in `.claude/agents/cinev-review-code.md`. All review standards and checklists are embedded in that agent — no need to load external standards documents separately.

### Step 1: Determine Review Scope

{{#if input}}
Review scope specified by user: "{{input}}"

Parse the input:
- If it's a file path → review that specific file
- If it's a glob pattern → review matching files
- If it's a diff range (e.g., `HEAD~3`) → review changes in that range
- If it's "staged" → review `git diff --staged`
{{else}}
No specific scope provided. Review all uncommitted changes:
```bash
git diff --name-only
git diff --staged --name-only
```
If no uncommitted changes exist, review the latest commit:
```bash
git diff --name-only HEAD~1
```
{{/if}}

### Step 2: Filter to Project Files

Only review files that are project-authored:
- Files with project copyright headers
- Files in project-specific directories
- Files with project-specific prefixes

Skip upstream/third-party files unless project modifications are present.

### Step 3: Review

For each file in scope:
1. Read the full file content
2. Apply all checklist items from the cinev-review-code agent
3. Record findings with severity, location, and suggested fixes

### Step 4: Output

Follow the output format defined in `.claude/agents/cinev-review-code.md`.
Present findings grouped by file, with severity counts and a final verdict.

## Example Usage

**Review all uncommitted changes:**
```
/cinev-review-cpp
```

**Review a specific file:**
```
/cinev-review-cpp Plugins/VRM4U/Source/VRM4ULoader/Private/CinevGlbSanitizer.cpp
```

**Review changes in last 3 commits:**
```
/cinev-review-cpp HEAD~3
```

**Review staged changes only:**
```
/cinev-review-cpp staged
```
