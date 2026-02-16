---
description: Update project learnings with new insight
argument-hint: "<project> <category: convention|worked|failed|gotcha>"
allowed-tools: Read, Edit, Write, Glob, Bash(curl:*)
---

# Update Learnings

Add a new learning to the project wisdom vault.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `learn-add-log`

## Arguments

$ARGUMENTS

**If no argument is provided, show usage and ask the user for project and category. NEVER auto-execute.**
```
Usage: /learn-add-log <project> <category>
Categories: convention, worked, failed, gotcha
```

Parse as: `<project_name> <category>`

Categories:
- `convention` - Pattern discovered in codebase
  - 작성 시 포함 요소: 정의 → 원리 → 장점 → 단점/한계 → 코멘트(도구, 경험 등)
  - 라벨 없이 자연스러운 문장으로 이어서 작성
- `worked` - Successful approach worth repeating
- `failed` - Approach that didn't work (and why)
- `gotcha` - Non-obvious issue that causes problems

## Execution

**IMPORTANT:** Always use the absolute path `D:\vs\caol-ila\claude\private\learnings\` (not symlink).

1. **Parse arguments** - Extract project name and category
2. **Check/create directory**: `D:\vs\caol-ila\claude\private\learnings\projects\`
3. **Read or create** project file: `D:\vs\caol-ila\claude\private\learnings\projects\<project>.md`
   - If new, copy from `D:\vs\caol-ila\claude\private\learnings\_template.md`
4. **Ask user** to describe the learning
5. **Append** to appropriate section with today's date
6. **용어 사전 (선택)** — 한글/영어 매칭이 직관적이지 않은 용어가 있으면 `_glossary.md`에도 추가
   - 파일: `{learnings}/_glossary.md`
   - 형식: `| 한글 (한자) | English | 뜻풀이 | 출처 링크 |`
7. **Confirm** the addition

## Current Learnings

Use Glob to list existing project files:
- Pattern: `D:\vs\caol-ila\claude\private\learnings\projects\*.md`

## Template Location

Use Read to load the template:
- Path: `D:\vs\caol-ila\claude\private\learnings\_template.md`
