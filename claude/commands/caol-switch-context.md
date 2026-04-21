---
description: "Context briefing and switcher for 회사/개인/부업"
argument-hint: "[회사|개인|부업|<project-name>]"
allowed-tools: Read, Glob, Grep, Bash(git:*), Bash(curl:*), AskUserQuestion, mcp__claude_ai_Linear__list_issues
---

# caol-switch-context

Context briefing and switcher. Shows where you left off across 회사/개인/부업 contexts.

## Arguments

- `$ARGUMENTS` — optional context name or company sub-project name
- Aliases: `회사`/`cinev`, `개인`/`personal`, `부업`/`side`
- Company sub-projects: any `name` from `contexts.json` → `company.projects[]` (e.g. `pmx2vrm`)

## Data Sources

Read these files first:

1. `~/.claude/private/caol-config/repo-paths.json` — repo paths (each entry: `{ path, description }` or plain string)
2. `{obsidianClaudeDir}/contexts.json` — personal projects (fallback to defaults below if missing)
3. `~/.claude/private/art-branches.json` — CINEV art branch state

Helper: to get the repo path from an entry, use `typeof entry === 'string' ? entry : entry.path`.

Obsidian claude dir: resolve `obsidian` key from repo-paths.json, then append `/claude`.

### Default Project Data (used if contexts.json is missing)

```json
{
  "personal": {
    "projects": [
      {
        "name": "포트폴리오 준비",
        "status": "active",
        "repo": null,
        "note": "노션 기반 포폴 작업 선행 중",
        "link": "https://www.notion.so/5bcc7d0f600b4a1c87ed13766698e8e7?v=316b202b5f4880799fe6000c51158d65"
      },
      {
        "name": "MMD Player",
        "status": "active",
        "repo": "anju",
        "path": "web/mmd-player-anju",
        "todo": [
          "VMD 업로드 폴더 위치 여는 기능",
          "PMX 스위칭 시 T포즈 로드 → 모션 확인 후 모델 전환",
          "UX 정리: 다음곡/이전곡, 우클릭 3초 앞으로",
          "다양한 BG FX 추가"
        ]
      },
      {
        "name": "Matcap Painting",
        "status": "active",
        "repo": "anju",
        "note": "포스트프로세스 등 계속 개발 중"
      }
    ]
  }
}
```

## Flow A: No Argument (overview + select)

If `$ARGUMENTS` is empty:

### 1. Gather lightweight data

**회사 (CINEV):**
- Read art-branches.json: get `current` branch, find its entry in `history[]`, extract `state` and `created_at`
- Get last commit date from cinev-studio repo: `git -C "{cinevPath}" log --oneline --format="%ad" --date=format:"%m/%d" -1`

**개인 (Personal):**
- Read contexts.json: list active project names
- Get last commit date from first active project with a repo

**부업 (Side Work):**
- Scan `{obsidianClaudeDir}/tutoring/lessons/` — find most recent lesson file date
- Scan `{obsidianClaudeDir}/consulting/` — find most recent session date

### 2. Display compact overview

```
Context Overview
════════════════════════════════════════════════
 회사   art/art-main-1.5.0-r6 (merged)     last: 03/06
 개인   MMD Player, 포트폴리오 준비           last: 03/05
 부업   The Lab 03/04, 이석민 02/28          last: 03/04
```

Format rules:
- 회사: show current art branch name + `(state)` + last commit date
- 개인: comma-separated active project names + last commit date
- 부업: most recent tutoring student + date, most recent consulting company + date

### 3. Ask user

Use AskUserQuestion: "어떤 컨텍스트로 전환할까요?" with options 회사, 개인, 부업.

### 4. Show detailed briefing for selected context (go to Flow B logic)

## Flow B: With Argument (direct briefing)

Resolve alias:
- `회사`, `cinev` → cinev context
- `개인`, `personal` → personal context
- `부업`, `side` → side context
- Otherwise → search `contexts.json` → `company.projects[]` by `name` (case-insensitive). If match found → **Flow C** (company sub-project briefing)

### 회사 (CINEV) Briefing

**Art Branch:**
- Branch: `{current}` | State: `{state}` | Since: `{created_at}`
- If state is `created` → "Next: 아트팀 작업 대기"
- If state is `merged` → "Next: 새 브랜치 생성 대기 (다음 주 월요일)"
- If state is `merge-ready` → "Next: 머지 실행"

**Recent Commits (cinev-studio, 5건):**
```bash
git -C "{cinevPath}" log --oneline --format="%h %s (%ad)" --date=format:"%m/%d" -5
```
Display as a bullet list.

**Linear Issues (optional):**
- Try `mcp__claude_ai_Linear__list_issues` to get TA team top 5 open issues
- If MCP unavailable or errors, show: "Linear: unavailable (MCP not connected)"
- Do NOT fail the whole briefing if Linear is unavailable

### 개인 (Personal) Briefing

Read contexts.json `personal.projects[]`.

For each project, show:
```
{name}  [{status}]  {note || ''}
```

If the project has a `todo` array, show each item indented:
```
  TODO:
    - VMD 업로드 폴더 위치 여는 기능
    - PMX 스위칭 시 T포즈 로드 → 모션 확인 후 모델 전환
```

For active projects that have a `repo` key:
- Resolve repo path from repo-paths.json
- Get recent 3 commits:
  ```bash
  git -C "{repoPath}" log --oneline --format="%h %s (%ad)" --date=format:"%m/%d" -3 {pathArg}
  ```
  Where `pathArg` is `-- "{project.path}"` if the project has a `path` field, empty otherwise.
- Display commits indented under the project

### 부업 (Side Work) Briefing

**Tutoring (recent lessons):**
- Scan `{obsidianClaudeDir}/tutoring/lessons/` subdirectories (each subdir = student name)
- In each student dir, find .md files matching `YYYY-MM-DD_topic(_done)?.md`
- Collect up to 3 most recent across all students, sorted by date desc
- Display: `{date} {student} — {topic}`

**Consulting (recent sessions):**
- Scan `{obsidianClaudeDir}/consulting/*.md` files
- In each file, extract company name from `# Company - Consulting History` heading
- Extract sessions from `### YYYY-MM-DD | topic` pattern
- Collect up to 3 most recent across all companies, sorted by date desc
- Display: `{date} {company} — {topic}`

## Flow C: Company Sub-Project Briefing

When argument matches a `company.projects[]` entry by name:

### 1. Resolve project

Find the matching project in `contexts.json` → `company.projects[]`. Resolve repo path from `repo-paths.json`.

### 2. Read working rules

Read the repo's `CLAUDE.md` and find sections relevant to the project. Display the rules so the user (and Claude) knows the workflow constraints.

### 3. Show project briefing

```
══ 회사 / {project.name} ════════════════════════

Working Rules ({repo}/CLAUDE.md)
  {extracted rules section}

Status
  {project.note}

TODO
  - {todo item 1}
  - {todo item 2}

Recent Commits
  - abc1234 fix spring value mismatch (03/09)
  ...

Known Issues
  - {from known-issues.json if exists in project path}
```

**Steps:**
1. Show working rules from `{repoPath}/CLAUDE.md` — find section matching the project name (case-insensitive search)
2. Show project `note` and `todo[]` from contexts.json
3. Recent 5 commits: `git -C "{repoPath}" log --oneline --format="%h %s (%ad)" --date=format:"%m/%d" -5 -- "{project.path}"`
4. If `{repoPath}/{project.path}/known-issues.json` exists, read and show pending issues
5. If `{repoPath}/{project.path}/README.md` exists, show the pipeline overview

## Output Format

Use clean monospace-friendly formatting:

```
══ 회사 (CINEV) ══════════════════════════════

Art Branch
  art/art-main-1.5.0-r6 | merged | since 03/03
  → Next: 새 브랜치 생성 대기

Recent Commits (cinev-studio)
  - abc1234 fix material slot validation (03/06)
  - def5678 add character pipeline (03/05)
  ...

Linear Issues
  - [TA-123] Fix spring bone jitter
  - [TA-124] Update material validator
  ...
```
