---
status: accepted
---

# Milestone Template

## Milestone File

```markdown
---
status: active
created: YYYY-MM-DD
updated: YYYY-MM-DD
owner: caol-ila
target-date:
---

# <Milestone Title>

## Purpose

## Scope

## Specs

| Spec | Status | Role |
|------|--------|------|

## Progress

| Phase | State | Evidence |
|-------|-------|----------|

## Acceptance Criteria

## Open Decisions

| Decision | Default |
|----------|---------|

## Blockers

| Blocker | Impact |
|---------|--------|

## External Mirrors

None.
```

## Index Row

```markdown
| [<slug>.md](<slug>.md) | active | <role> |
```

## Spec Row

Use a relative Markdown link from milestone to spec:

```markdown
| [<spec>.md](../plans/<bucket>/<spec>.md) | <status> | <role> |
```

During the flat-path transition, `../plans/<spec>.md` remains valid. Use the
actual resolved spec path; do not hardcode a bucket that does not exist.

If the spec is planned but does not exist yet, use a code span and mark status
as `todo`:

```markdown
| `<spec>.md` | todo | <role> |
```

## Frontmatter

Required:

```yaml
---
status: active
created: YYYY-MM-DD
updated: YYYY-MM-DD
owner: caol-ila
target-date:
---
```

Optional external mirror block:

```yaml
external:
  linear:
  github:
  gitlab:
```
