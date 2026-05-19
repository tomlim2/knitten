---
status: accepted
---

# Shotloom Linear Issue Template

## Source Of Truth

Before creating or reshaping a Shotloom Linear issue, read these files from the
local Shotloom checkout:

| File | Required section |
|------|------------------|
| `CONTRIBUTING.md` | `Issue Tracking Policy`, `Issue Authoring Policy` |
| `WORKFLOW.md` | `Creating an Issue` |
| `docs/guidelines/project-management-model.md` | issue model guidance |

If those files change, follow them. The command-level correction is:
Shotloom's active Linear project is `Shotloom - bravo`.

## Defaults

| Field | Default |
|-------|---------|
| Team | Shotloom |
| Project | Shotloom - bravo |
| Assignee | me |
| Priority | 3 (Medium) |
| State | Backlog |

## Body Rules

| Rule | Value |
|------|-------|
| Linear language | Korean |
| Title | Conventional Commits-style `type(scope):` prefix in English, then a short Korean summary when possible |
| Body sections | `## 문제` -> `## 범위` -> `## 완료 기준` -> `## 영향 모듈/디렉터리` -> `## 참고` |
| Lists | `*` for regular lists, `- [ ]` for acceptance criteria |
| Code identifiers | wrap in backticks |
| Image placeholder | use blockquote `> 예시 사진 첨부 요망` |
| Related issues | use Linear relations; body may include plain `STL-NN` only when needed |

## Implementation Issue Template

```markdown
## 문제

{하나의 구체적인 문제나 작업을 설명. 현재 상태와 왜 바꿔야 하는지.}

## 범위

* {무엇을 할 것인가}
* {필요하면 하위 bullet}
  * {세부 작업}

## 완료 기준

- [ ] {완료되었다고 말할 수 있는 구체적 조건}
- [ ] {테스트/검증 조건}

## 영향 모듈/디렉터리

* `{repo-relative/path}`

## 참고

* {추가 컨텍스트, 설계 결정, 주의 사항}
* `docs/specs/...` - 관련 spec (shotloom 레포 내부)
* `docs/adr/adr-00XX-....md` - ADR (shotloom 레포 내부)
* STL-XX - 관련 이슈
```

## Design Decision Issue Template

Use this when `--label design-decision` is present.

```markdown
## 문제

{결정이 필요한 배경과 현재의 모호성/갈등}

## 제안

{제안 해결안. 선택지 비교가 필요하면 불릿이나 테이블.
2단계 결정(Alpha/Bravo)인 경우 `### Alpha` / `### Bravo` 서브섹션 사용.}

## 완료 기준

- [ ] 결정이 문서화된다
- [ ] 관련 spec/ADR이 업데이트된다
- [ ] 영향 받는 이슈들에 결정이 반영된다

## 영향 모듈/디렉터리

* `{repo-relative/path}`

## 참고

* {트레이드오프, 후속 작업 힌트}
```

## Umbrella Issue Template

```markdown
{1-2 문단 umbrella 설명}

## Child Issues

* `STL-XX` {child 이슈 제목}
* `STL-YY` {child 이슈 제목}
```

## Legacy Section Variants

Use legacy section names only when editing existing issues.

| English | Korean variants |
|---------|-----------------|
| Context | `## 배경`, `## 컨텍스트`, `## Purpose`, `## 목적` |
| Scope | `## 범위`, `## 요청 사항` |
| Proposed Resolution | `## 결정 필요 사항`, `## 제안` |
| Acceptance Criteria | `## 완료 조건` |
| References | `## 참고 파일`, `## 참고` |

## Scope Suppression

New issues describe only what the issue ships.

| Remove from body | Replacement |
|------------------|-------------|
| `follow-up`, `next steps`, `next pass` | Linear parent/related/blocking relation |
| `추후`, `다음 단계`, `Phase 2` | omit, or mark a narrow out-of-scope item |
| acceptance criteria for another issue | move to that issue |

Allowed narrow out-of-scope note:

```markdown
## 참고

* automatic mesh-bound scaling - out of scope
```

## Privacy

Do not link or name personal private repos in Shotloom Linear issues.

| If source is outside Shotloom | Use |
|-------------------------------|-----|
| private prototype repo | `prior internal prototype` |
| private R&D code | `선행 R&D 코드` |
| private implementation path | omit the path |

Allowed references:

| Reference class | Example |
|-----------------|---------|
| Shotloom repo path | `crates/...`, `docs/...` |
| CINEV GitHub URL | `https://github.com/CINEV/shotloom/...` |
| Linear issue | `STL-NN` |
| ADR/spec | `ADR-00XX`, `docs/specs/...` |
