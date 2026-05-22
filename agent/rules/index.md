---
load: auto
---

# Rules Index

Each rule declares `load:` in its frontmatter. **Auto** = always in cold-start context (default-counters only, body cap 40). **Triggered** = loads when its trigger fires (cap 120).

This table is inventory only. Rule cells MUST use code spans, not Markdown links, so importing this index cannot cause a runtime to pre-load triggered rule bodies.

| Rule | Load | Trigger / Scope |
|------|------|-----------------|
| `ambiguity-scoring.md` | auto | Meta-decision gate — 1-10 score before any ambiguous action; 9+ auto, else surface |
| `canonical-first.md` | auto | Before adopting any external term/path/pattern/recommendation, verify against the user's canonical source |
| `git-defaults.md` | auto | No auto-push / no Co-Authored-By / author identity |
| `main-chore-lane.md` | triggered | committing or pushing from the primary `main` checkout in a worktree-first repo |
| `behavior.md` | auto | Output style, delegation, context budget, plan approval triggers |
| `verify-before-report.md` | auto | Verify before presenting any result |
| `security.md` | auto | Secrets handling, documentation language |
| `session-start.md` | auto | Config reads + safety guards |
| `code-write.md` | triggered | writing or editing code |
| `reread-repo-conventions.md` | triggered | start of non-trivial work in any repo |
| `test-write.md` | triggered | writing or reviewing code with tests |
| `author.md` | triggered | creating a command or skill (naming + frontmatter + permissions) |
| `obsidian.md` | triggered | working in the Obsidian vault |
| `cinev-git.md` | triggered | git op in a CINEV repo |
| `shotloom.md` | triggered | working in the shotloom repo |
| `shotloom-docs-lane.md` | triggered | writing Shotloom docs to Knitten |
| `task-context-routing.md` | triggered | selecting task-specific context or loading route-domain artifacts |
| `slack.md` | triggered | sending any Slack message |
| `writing-external.md` | triggered | writing external-facing prose |
| `doc-write.md` | triggered | writing any doc to vault, staging, private/, ops/ |
| `metaphor-style.md` | triggered | explaining technical concepts to this user |
| `pr-mutate.md` | triggered | mutating PR state via gh |
| `pr-comment.md` | triggered | posting any PR / review / issue comment |
| `pr-create.md` | triggered | calling gh pr create |
