---
description: Create a Linear issue in Shotloom team with Alpha project + team conventions
argument-hint: "<title> [--desc <description>] [--priority 0-4] [--label <label>] [--project <project>] [--parent <STL-XX>] [--milestone <name>] [--state <state>]"
allowed-tools: Read, AskUserQuestion
---

# Shotloom Linear Create Issue

Create a new Linear issue in the **Shotloom** team following the team's
observed conventions (Husker 허스커 / Van 반 / deemo issue style).

## Defaults

| Field     | Default           |
|-----------|-------------------|
| Team      | Shotloom          |
| Project   | Shotloom - alpha  |
| Assignee  | me (deemo)        |
| Priority  | 3 (Medium)        |
| State     | Backlog           |

## Arguments

$ARGUMENTS

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

```
Usage: /shotloom-linear-create-issue <title> [options]

Options:
  --desc <description>    Issue description (Markdown, see template below)
  --priority <0-4>        0=None, 1=Urgent, 2=High, 3=Medium, 4=Low
  --label <label>         Label name (repeat for multiple, e.g. "design-decision")
  --project <project>     Project name (default: "Shotloom - alpha")
  --parent <STL-XX>       Parent issue identifier (umbrella decomposition)
  --milestone <name>      Project milestone name
  --state <state>         Backlog / Todo / In Progress / Done
  --team <team>           Override team (default: Shotloom)
  --assignee <user>       Override assignee (default: me)

Example:
  /shotloom-linear-create-issue "scaffold shotloom-retarget crate + ADR-0022" --milestone "Core Domain Model"
  /shotloom-linear-create-issue "bundle-format 검증 규칙 누락" --label design-decision --priority 2
  /shotloom-linear-create-issue "STL-72 hydration 로직 분리" --parent STL-17
```

## Execution

### Step 1: Parse arguments

Parse title and optional flags from `$ARGUMENTS`.

- Title: everything before the first `--` flag
- Flags: `--desc`, `--priority`, `--label`, `--project`, `--parent`, `--milestone`, `--state`, `--team`, `--assignee`

### Step 2: Format and polish description

If a description is present, shape it using the **Shotloom team
template** below. The team consistently uses `## Context` + `## Scope`
+ `## Acceptance Criteria` + optional `## Notes` / `## References`.
Design-decision issues swap `## Scope` for `## Proposed Resolution`.

**Implementation issue template (default):**

```markdown
## Context

{왜 이 작업이 필요한가. 배경, 관련된 상위 결정, 현재 상태가 어떤지.
 관련 spec 문서나 선행 이슈를 참조로 명시.}

## Scope

* {무엇을 할 것인가 — 상위 bullet, 구현 레벨}
* {필요하면 하위 bullet}
  * {세부 작업}

## Acceptance Criteria

- [ ] {완료되었다고 말할 수 있는 구체적 조건}
- [ ] {테스트/검증 조건}

## Notes

* {추가 컨텍스트, 설계 결정, 주의 사항}

## References

* `docs/specs/...` — 관련 spec
* `docs/adr/adr-00XX-....md` — ADR
* STL-XX — 관련 이슈
```

**Design-decision issue template (when `--label design-decision`):**

```markdown
## Context

{결정이 필요한 배경과 현재의 모호성/갈등}

## Proposed Resolution

{제안 해결안. 선택지 비교가 필요하면 불릿이나 테이블.}

## Acceptance Criteria

- [ ] 결정이 문서화된다
- [ ] 관련 spec/ADR이 업데이트된다
- [ ] 영향 받는 이슈들에 결정이 반영된다

## Notes

* {트레이드오프, 후속 작업 힌트}
```

**구조 규칙:**
- `## Context`가 첫 섹션, 한/영 어느 쪽이든 가능 (혼용 OK)
- 리스트는 `*` 통일, AC는 `- [ ]` 체크박스
- 코드/브랜치명/파일명은 backtick으로
- 이미지가 필요하면 blockquote `> 예시 사진 첨부 요망`
- Section 순서: Context → (Proposed Resolution | Scope) → Acceptance Criteria → Notes → References

**라이팅 규칙:**
- 한/영 혼용 자연스럽게 (팀 컨벤션)
- 과도한 수식어, 이모지, AI 냄새나는 표현 금지
- 기술 용어(영문)는 원문 유지
- 짧고 단정적인 문장

### Step 3: Preview and confirm

Show the user what will be created:

```
Linear Issue Preview (Shotloom):
  Team:       {team}
  Project:    {project}
  Title:      {title}
  Assignee:   {assignee}
  Priority:   {priority} ({priority_name})
  Labels:     {labels or "None"}
  Parent:     {parent or "None"}
  Milestone:  {milestone or "None"}
  State:      {state}

  Description:
  {description, rendered}
```

**Wait for user confirmation before creating.**

### Step 4: Create issue

Use `mcp__claude_ai_Linear__save_issue` with:

```
title: parsed title
team: "Shotloom" (or override)
project: "Shotloom - alpha" (or override)
assignee: "me" (or override)
priority: 3 (or override)
labels: if provided
parentId: if provided
milestone: if provided
state: "Backlog" (or override)
description: formatted description
```

### Step 5: Link mentioned STL issues

If the description references other Shotloom issues in plain text form
(`STL-42`, `STL-17`, etc.), convert them to clickable Linear links.

**변환 규칙:**
- `STL-42: direction draft ownership` (plain)
- → `[STL-42: direction draft ownership](https://linear.app/cinamon-corp/issue/STL-42)` (linked)

**감지 패턴:**
- `STL-\d+` 식별자가 description에 포함된 경우
- 이미 markdown link로 감싸져 있으면 스킵

### Step 6: Attach external references

If the description mentions external URLs (GitHub commits, ADR files,
spec docs, Slack threads), ensure they are proper markdown links.

- PR/commit references → `[commit abc1234](url)` format
- ADR files → `[ADR-0022](docs/adr/adr-0022-....md)` in repo-relative path
- Slack threads → add under `## 공유` section if team has this pattern

### Step 7: Report result

Show the created issue identifier (e.g., `STL-74`), URL, and auto-generated
git branch name (e.g., `deemo/stl-74-scaffold-shotloom-retarget-crate`).

## Team Conventions Observed (2026-04-14)

From sampling 30 recent issues in STL team:

- **Title**: Korean or English OK. Often prefixed with subsystem scope.
  Example: `"bundle-format: camera_preset 에셋 종류 정의 누락"`.
- **Sections**: `## Context` (or `## 배경` / `## Purpose`) is near-universal.
  `## Scope` (or `## 범위` / `## Proposed Resolution`) follows. AC uses
  `- [ ]` checkboxes. Notes/References tail.
- **Labels**: `design-decision` is the main label in use. Implementation
  issues typically have no label.
- **Parent umbrella**: issues decomposing a larger umbrella (STL-30 for
  Alpha decisions, STL-17 for persistence pipeline) set `parentId`.
- **Milestones**: project milestones attached when relevant
  ("Alpha design decisions resolved", "Editor Authoring", "Persistence",
  "Core Domain Model", "Timeline and Playback").
- **Git branches**: auto-generated as `{user}/stl-NN-{title-slug}`.
  Never set this manually.

## Related

- `cci-linear-create-issue.md` — sister command for the TA team
- `docs/adr/` — ADR location in shotloom repo (contributes to References)
- `docs/specs/` — spec location in shotloom repo
