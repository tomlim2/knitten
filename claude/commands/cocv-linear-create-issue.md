---
description: Create a Linear issue in TA team assigned to deemo
argument-hint: "<title> [--desc <description>] [--priority 0-4] [--label <label>] [--project <project>] [--due <YYYY-MM-DD>] [--team <team>] [--assignee <user>]"
allowed-tools: Read, AskUserQuestion
---

# Linear Create Issue

Create a new Linear issue with TA team defaults.
## Defaults

| Field | Default |
|-------|---------|
| Team | TA |
| Assignee | deemo |
| Priority | 0 (None) |

## Arguments

$ARGUMENTS

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

```
Usage: /cocv-linear-create-issue <title> [options]
Options:
  --desc <description>    Issue description (Markdown)
  --priority <0-4>        0=None, 1=Urgent, 2=High, 3=Normal, 4=Low
  --label <label>         Label name (multiple allowed)
  --project <project>     Project name
  --due <YYYY-MM-DD>      Due date
  --team <team>           Override team (default: TA)
  --assignee <user>       Override assignee (default: deemo)
  --state <state>         Issue state (e.g., Backlog, Todo)

Example:
  /cocv-linear-create-issue 파편화된 Cinev 메시 설정 규약 모으기
  /cocv-linear-create-issue VRM 익스포트 파이프라인 점검 --priority 3 --label Pipeline
  /cocv-linear-create-issue 텍스처 네이밍 컨벤션 위반 수정 --desc "Female 폴더 내 V01 누락 건" --due 2026-03-01
```

## Execution

### Step 1: Parse arguments

Parse title and optional flags from `$ARGUMENTS`.

- Title: everything before the first `--` flag (or all arguments if no flags)
- Flags: `--desc`, `--priority`, `--label`, `--project`, `--due`, `--team`, `--assignee`, `--state`

### Step 2: Preview and confirm

Show the user what will be created:

```
Linear Issue Preview:
  Team:      {team}
  Title:     {title}
  Assignee:  {assignee}
  Priority:  {priority}
  Labels:    {labels or "None"}
  Project:   {project or "None"}
  Due:       {due or "None"}
  State:     {state or "Default"}
  Description:
    {description or "None"}
```

**Wait for user confirmation before creating.**

### Step 2.5: Format and polish description

Description이 있으면 아래 규칙으로 정리한 뒤 프리뷰에 반영한다.

**Description 템플릿** (해당 섹션만 사용, 순서 유지):

```markdown
## 작업 내용

{무엇을 하는지 간결하게}

## 작업 단계

1. ~~단계명~~ ✓
2. 단계명
3. 단계명

## 현재 상태

{진행 상황, 결과}

## 향후 과제

{남은 작업, 개선 방향}

## 브랜치

`branch-name`

## 포함 작업

* TA-000: 이슈 제목

## 참고

* [Slack](url)

> 이미지 첨부
```

**구조 규칙:**
- `##` 헤딩으로 섹션 구분, 위 템플릿 순서 준수
- 리스트는 `*` 통일
- 이미지/사진 첨부 자리는 blockquote: `> 이미지 첨부`
- 코드, 브랜치명, 파일명은 backtick으로 감싸기
- 완료된 단계는 `~~취소선~~` + `✓`

**라이팅 규칙:**
- 유저의 구어체/줄임말을 자연스러운 한국어 문어체로 다듬기 (의미 변경 금지)
- 불필요한 조사/접속사 제거, 간결하게
- 기술 용어(영문)는 원문 유지
- AI 냄새나는 표현 금지 (과도한 수식어, 이모지, 홍보성 문장)

### Step 3: Create issue

Use `mcp__claude_ai_Linear__create_issue` with:

```
title: parsed title
team: "TA" (or override)
assignee: "deemo" (or override)
priority: 0 (or override)
labels: if provided
project: if provided
dueDate: if provided
description: if provided
state: if provided
```

### Step 4: Link mentioned issues in description

description에 다른 Linear 이슈가 텍스트로 언급되어 있으면, 해당 텍스트를 클릭 가능한 Linear 링크로 변환한다.

**변환 규칙:**
- `TA-441: 제페토 화장 전용 머티리얼` (plain text)
- → `[TA-441: 제페토 화장 전용 머티리얼](https://linear.app/cinamon-corp/issue/TA-441)` (linked)

**감지 패턴:**
- `TA-XXX` 형태의 이슈 식별자가 description에 포함된 경우
- 이미 마크다운 링크(`[...](...)`)로 감싸져 있으면 스킵

생성 후 description에 이슈 식별자가 발견되면 `mcp__claude_ai_Linear__update_issue`로 description을 업데이트한다.

### Step 5: Attach Slack link

이슈와 관련된 Slack 메시지가 있으면 description 하단에 링크를 포함한다.

**패턴:**
```markdown
## 공유

* [Slack 스레드](https://cinamonhq.slack.com/archives/{channel_id}/{message_ts})
```

- 유저가 Slack 링크를 제공하면 그대로 사용
- 유저가 "슬랙 링크 있어" 등으로 언급하면 링크를 요청
- Slack 링크가 없으면 이 섹션 생략

### Step 6: Suggest image attachment

이슈 내용이 시각적 참고가 도움될 때 (셰이더, UI, 렌더링 결과, 비교 등), description 하단에 `> 예시 사진 첨부 요망`을 추가하여 유저에게 사진 첨부를 안내한다.

**대상:**
- 셰이더/머티리얼 관련 이슈
- UI/UX 변경 이슈
- 비포/애프터 비교가 필요한 이슈
- 버그 리포트 (시각적 증상)

### Step 7: Report result

Show the created issue identifier (e.g., `TA-123`) and URL.
