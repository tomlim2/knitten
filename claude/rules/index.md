---
load: auto
---

# Rules Index

Each rule declares `load:` in its frontmatter. **Auto** = always in cold-start context (default-counters only, body cap 40). **Triggered** = loads when its trigger fires (cap 120).

| Rule | Load | Trigger / Scope |
|------|------|-----------------|
| [`git.md`](git.md) | auto | No auto-push / no Co-Authored-By / author identity |
| [`behavior.md`](behavior.md) | auto | Output style, ambiguity scoring, delegation, context budget |
| [`verify-before-report.md`](verify-before-report.md) | auto | Verify before presenting any result |
| [`security.md`](security.md) | auto | Secrets handling, documentation language |
| [`session-start.md`](session-start.md) | auto | Config reads + safety guards |
| [`coding.md`](coding.md) | triggered | writing or editing code |
| [`reread-repo-conventions.md`](reread-repo-conventions.md) | triggered | start of non-trivial work in any repo |
| [`testing.md`](testing.md) | triggered | writing or reviewing code with tests |
| [`naming.md`](naming.md) | triggered | creating a command or skill |
| [`command-frontmatter.md`](command-frontmatter.md) | triggered | creating a command |
| [`tool-permissions.md`](tool-permissions.md) | triggered | creating a command or skill |
| [`obsidian.md`](obsidian.md) | triggered | working in the Obsidian vault |
| [`cinev-git.md`](cinev-git.md) | triggered | git op in a CINEV repo |
| [`multi-agent.md`](multi-agent.md) | triggered | assigned as 지통실 #1 (1호기) |
| [`shotloom.md`](shotloom.md) | triggered | working in the shotloom repo |
| [`slack.md`](slack.md) | triggered | sending any Slack message |
| [`writing.md`](writing.md) | triggered | writing external-facing prose |
| [`doc-write.md`](doc-write.md) | triggered | writing any doc to vault, staging, private/, ops/ |
| [`pr-mutate.md`](pr-mutate.md) | triggered | mutating PR state via gh |
| [`pr-comment.md`](pr-comment.md) | triggered | posting any PR / review / issue comment |
| [`pr-create.md`](pr-create.md) | triggered | calling gh pr create |
