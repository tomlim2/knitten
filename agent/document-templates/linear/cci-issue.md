---
status: accepted
---

# CCI Linear Issue Template

## Defaults

| Field | Default |
|-------|---------|
| Team | TA |
| Assignee | deemo |
| Priority | 0 (None) |

## Body Template

Use only sections that apply. Preserve the order.

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

## Body Rules

| Rule | Value |
|------|-------|
| Sections | `##` headings only |
| Lists | `*` for regular lists |
| Completed steps | `~~취소선~~` + `✓` |
| Code identifiers | wrap branch names, file names, and code identifiers in backticks |
| Image placeholder | blockquote `> 이미지 첨부` |
| Slack link section | `## 공유` with `* [Slack 스레드](url)` |

## Writing Rules

| Input | Output |
|-------|--------|
| casual Korean | concise written Korean |
| technical term | preserve original English |
| unclear meaning | ask before changing meaning |
| excessive adjective or promotional phrasing | remove |

## Linear Link Rule

If the description contains a plain `TA-NNN` identifier, link it unless it is
already inside a Markdown link.

```markdown
TA-441: 제페토 화장 전용 머티리얼
```

```markdown
[TA-441: 제페토 화장 전용 머티리얼](https://linear.app/cinamon-corp/issue/TA-441)
```
