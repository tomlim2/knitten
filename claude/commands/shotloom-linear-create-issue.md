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

### Step 0.5: Check for reusable STL numbers

Before creating a fresh issue, search the user's own abandoned issues for a candidate to repurpose. Goal: when you create → abandon → recreate, reuse the original STL-NN instead of burning a new one.

1. Fetch via Linear MCP `list_issues` filter:
   - `creator = me` OR `assignee = me`
   - state ∈ {`Canceled`, `Backlog`} (also `Duplicate` if that state exists)
   - AND `updatedAt < 30 days ago`

2. Score each candidate by title-similarity to the new `$ARGUMENTS` title (simple word-overlap; low bar — even 30% overlap surfaces).

3. If any candidates exist, present to user:
   ```
   ♻️ Reusable STL numbers (closest match first):
   | STL | Old title | State | Updated | Similarity |
   |-----|-----------|-------|---------|-----------|
   | STL-55 | "early retarget spike" | Canceled | 90d ago | 42% |
   | STL-72 | "skim VRM spec"         | Backlog  | 75d ago | 18% |

   Options:
   (a) Reuse STL-55 — rename, reset body, move to Backlog (or --state)
   (b) Reuse STL-72 — same
   (c) Create new STL — proceed to Step 1
   ```

4. If user picks reuse, SKIP Steps 1–7 and instead:
   - Call `save_issue` with `id: STL-NN` and fields: new `title`, new `description`, `state: <target>`, new labels/priority/parent/milestone as parsed from `$ARGUMENTS`.
   - Report: `♻️ Reused STL-55 with new content — title: "...", state: Backlog`.
   - If the old issue was Canceled and target state is not Canceled, note the state change explicitly.

5. If no candidates or user picks (c), proceed to Step 1.

**Skip this check if:** `--no-reuse` flag is in `$ARGUMENTS`, or the user has already passed an explicit reuse target via `--reuse STL-NN` (jump straight to the reuse call).

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
## Summary

{선택: TL;DR 한 문단. Context보다 더 짧게, 이슈를 왜 여는지 한 문장으로
 잡을 수 있을 때만 사용. Context와 중복되면 생략.}

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

* `docs/specs/...` — 관련 spec (shotloom 레포 내부)
* `docs/adr/adr-00XX-....md` — ADR (shotloom 레포 내부)
* STL-XX — 관련 이슈

Related to STL-NN
```

**Design-decision issue template (when `--label design-decision`):**

```markdown
## Context

{결정이 필요한 배경과 현재의 모호성/갈등}

## Proposed Resolution

{제안 해결안. 선택지 비교가 필요하면 불릿이나 테이블.
 2단계 결정(Alpha/Bravo)인 경우 `### Alpha` / `### Bravo` 서브섹션 사용.}

## Acceptance Criteria

- [ ] 결정이 문서화된다
- [ ] 관련 spec/ADR이 업데이트된다
- [ ] 영향 받는 이슈들에 결정이 반영된다

## Notes

* {트레이드오프, 후속 작업 힌트}
```

**Umbrella issue template (상위 이슈, child 분해):**

```markdown
{1-2 문단 umbrella 설명}

## Child Issues

* `STL-XX` {child 이슈 제목}
* `STL-YY` {child 이슈 제목}
```

**구조 규칙:**
- `## Summary`는 선택 첫 섹션. 생략 가능. 있으면 `## Context`보다 앞에.
- `## Context`가 사실상 첫 섹션 (Summary 없으면). 한/영 어느 쪽이든 가능 (혼용 OK).
- 리스트는 `*` 통일, AC는 `- [ ]` 체크박스
- 코드/브랜치명/파일명은 backtick으로
- 이미지가 필요하면 blockquote `> 예시 사진 첨부 요망`
- Section 순서: Summary? → Context → (Proposed Resolution | Scope | Child Issues) → Acceptance Criteria → Notes → References

**Korean section name variants (팀에서 실제로 쓰는 표현):**

| English | Korean variants |
|---------|----------------|
| Context | `## 배경`, `## 컨텍스트`, `## Purpose`, `## 목적` |
| Scope | `## 범위`, `## 요청 사항` |
| Proposed Resolution | `## 결정 필요 사항`, `## 제안` |
| Acceptance Criteria | `## 완료 조건` |
| References | `## 참고 파일`, `## 참고` |

한/영 혼용 자연스럽게. 한 이슈 안에서 일관되면 혼용 OK.

**라이팅 규칙:**
- 한/영 혼용 자연스럽게 (팀 컨벤션)
- 과도한 수식어, 이모지, AI 냄새나는 표현 금지
- 기술 용어(영문)는 원문 유지
- 짧고 단정적인 문장

**Privacy / private repo 규칙 (엄수):**
- **Shotloom Linear 이슈에 개인 private 레포를 절대 링크/언급하지 말 것.** 포함: `bevy-vrm`, `anju`, `mmd-anju`, `ta-portfolio`, `StoryPreviz`, 그 외 `~/.claude/private/caol-config/repo-paths.json`에 등록되었지만 CINEV 소유가 아닌 모든 레포.
- bevy-vrm에서 shotloom으로 "port"/"이식"하는 작업일 때도 원본을 **"prior internal prototype"** / **"선행 R&D 코드"** / **"upstream reference implementation"** 같은 추상 표현으로만 지칭. 레포 이름, URL, 커밋 해시, 파일 경로 포함 금지.
- 허용되는 참조: shotloom 레포 내부 경로 (`crates/...`, `docs/...`), CINEV 조직 GitHub, STL-NN, ADR 번호, spec 문서명.
- 애매할 때: "이 링크/경로가 shotloom 레포 안에 있는가?" — 아니면 제거.

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

### Step 5: STL issue references

**Prefer plain `STL-NN` text. Linear auto-linkifies it.** 팀의 최근 이슈(STL-74, STL-75, STL-76, STL-77)는 markdown link 대신 plain `STL-NN` 또는 Linear 네이티브 `<issue id="...">STL-NN</issue>` 리치태그를 사용한다. MCP `save_issue`는 plain `STL-NN`을 넘기면 Linear가 자동으로 렌더링한다.

**규칙:**
- Plain `STL-42` — default, 자동 링크됨
- `Related to STL-NN` — footer에 plain text로
- Markdown link (`[STL-42](url)`) — **사용하지 말 것.** 팀 컨벤션 아님.

### Step 6: External references (shotloom 레포 내부만)

- ADR / spec / 파일 경로는 shotloom 레포 기준 상대 경로: `docs/adr/adr-0022-....md`, `crates/shotloom-retarget/src/lib.rs`
- CINEV org GitHub commit/PR: `[commit abc1234](https://github.com/CINEV/shotloom/commit/abc1234)` 허용
- **Private 개인 레포 링크/경로 절대 금지** (Step 2 Privacy 규칙 참고). bevy-vrm, anju, mmd-anju 등 언급 시 `"prior internal prototype"` 같은 추상 표현으로 치환.
- Slack thread: 팀이 쓰는 패턴이면 `## 공유` 섹션에 추가

### Step 7: Report result

Show the created issue identifier (e.g., `STL-74`), URL, and auto-generated
git branch name (e.g., `deemo/stl-74-scaffold-shotloom-retarget-crate`).

## Team Conventions Observed (2026-04-15)

From sampling the 15 most-recent issues in STL team:

- **Title**: Korean or English OK. Often prefixed with subsystem scope.
  Example: `"bundle-format: camera_preset 에셋 종류 정의 누락"`.
- **Sections**: Husker의 최신 이슈(STL-76/77)는 `## Summary` → `## Context`로 시작. 그 외에는
  `## Context` (or `## 배경` / `## 컨텍스트` / `## Purpose` / `## 목적`)가 사실상 첫 섹션.
  `## Scope` (or `## 범위` / `## 요청 사항` / `## Proposed Resolution` / `## 결정 필요 사항`)가
  따름. AC는 `- [ ]` 체크박스 (or `## 완료 조건`). Notes/References는 꼬리.
- **STL issue references**: plain `STL-NN` 또는 Linear 네이티브 `<issue>` 태그. Markdown link는
  팀 컨벤션 아님.
- **Umbrella**: STL-17처럼 `## Child Issues` bullet list로 분해.
- **Staged decisions**: STL-68처럼 `### Alpha` / `### Bravo` 서브섹션으로 2단계 결정 표현.
- **Footer**: `Related to STL-NN` plain text (STL-73).
- **Private repo 금지**: 어떤 이슈에도 bevy-vrm, anju, mmd-anju 등 개인 private 레포 이름/
  URL/경로 언급 없음. Shotloom 이슈는 shotloom 레포 + CINEV org만 참조.
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
