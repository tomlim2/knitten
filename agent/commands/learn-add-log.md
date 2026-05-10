---
description: Update project learnings with new insight
argument-hint: "<project> <category: convention|worked|failed|gotcha>"
allowed-tools: Read, Edit, Write, Glob
---

# Update Learnings

Add a new learning to the project wisdom vault.
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

**Path resolution — go through `caol-resolve-doc-path` with the `learnings` purpose. Never read `machine-paths.json` directly. Never use `tool` mode + manual subpath as a workaround — if a destination isn't in `doc-paths.json` yet, ADD the purpose first.**

Projects dir: !`bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh doc learnings`

The output's `RESOLVED_PATH` is the learnings projects directory (`<vault>/learnings/projects/`). The parent (`<vault>/learnings/`) holds shared files like `_template.md` and `_glossary.md`.
If the resolver errors, propagate up and stop.

### Workflow

1. **Resolve path** — Read `RESOLVED_PATH` from the line above. That is the projects dir. Parent dir (= `dirname $RESOLVED_PATH`) holds template/glossary.
2. **Parse arguments** — Extract project name and category.
3. **Check/create directory** `$RESOLVED_PATH/` (the projects dir; resolver returns an existing or to-be-created path).
4. **Read or create** project file: `$RESOLVED_PATH/<project>.md`.
   - If new, copy from `$(dirname $RESOLVED_PATH)/_template.md`.
5. **Ask user** to describe the learning.
6. **Append** to appropriate section with today's date.
7. **용어 사전 (선택)** — 한글/영어 매칭이 직관적이지 않은 용어가 있으면 glossary에도 추가.
   - 파일: `$(dirname $RESOLVED_PATH)/_glossary.md`
   - 형식: `| 한글 (한자) | English | 뜻풀이 | 출처 링크 |`
8. **Confirm** the addition.

## Current Learnings

Use Glob to list existing project files:
- Pattern: `$RESOLVED_PATH/*.md`

## Template Location

Use Read to load the template:
- Path: `$(dirname $RESOLVED_PATH)/_template.md`
