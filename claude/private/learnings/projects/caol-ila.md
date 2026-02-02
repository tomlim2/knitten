# caol-ila Learnings

Last updated: 2026-01-31

---

## Conventions Discovered

Patterns specific to this codebase.

| Pattern | Why It Matters |
|---------|----------------|
| Design system is source of truth | All tools/skills must conform to `standards/design-system.md` |
| **New UIs must have versioning from day 1** | Add VERSION constant, display in footer, create CHANGELOG.md from the start |

---

## What Worked

Approaches worth repeating.

---

## What Failed

Approaches that seemed good but weren't.

---

## Gotchas

Non-obvious issues that cause problems.

| Issue | How to Handle |
|-------|---------------|
| **NEVER update design-system.md without permission** | Always ask user first before making any changes to `standards/design-system.md`. Propose changes verbally, get approval, then implement. |
| **Version bumps only on request** | Never bump versions (tags, VERSION constants) unless user explicitly asks. |

