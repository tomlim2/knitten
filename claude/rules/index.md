---
load: auto
---

# Rules Index

Always-applied constraints. Each rule declares its load behavior in its own frontmatter (`load: auto` or `load: triggered` + `trigger:`).

**Auto** = always in cold-start context. Reserved for rules that counter a default LLM bias (the harness will violate them otherwise). Body cap: 40 lines.

**Triggered** = loads only when the trigger condition fires. Body cap: 120 lines. Use for domain rules and lifecycle phases.

| Rule | Load | Trigger / Scope |
|------|------|-----------------|
| [`git.md`](git.md) | auto | No auto-push / no Co-Authored-By / author identity (default-counters) |
| [`behavior.md`](behavior.md) | auto | Output style, ambiguity scoring, delegation (default-counters) |
| [`verify-before-report.md`](verify-before-report.md) | auto | Verify before presenting any result |
| [`security.md`](security.md) | auto | Secrets handling, documentation language |
| [`session-start.md`](session-start.md) | auto | Config reads + safety guards at session start |
| [`coding.md`](coding.md) | triggered | writing or editing code |
| [`reread-repo-conventions.md`](reread-repo-conventions.md) | triggered | start of non-trivial work in any repo |
| [`testing.md`](testing.md) | triggered | writing or reviewing code that includes tests |
| [`naming.md`](naming.md) | triggered | creating a command or skill |
| [`command-frontmatter.md`](command-frontmatter.md) | triggered | creating a command |
| [`tool-permissions.md`](tool-permissions.md) | triggered | creating a command or skill |
| [`obsidian.md`](obsidian.md) | triggered | working in the Obsidian vault |
| [`cinev-git.md`](cinev-git.md) | triggered | git op in a CINEV repo |
| [`multi-agent.md`](multi-agent.md) | triggered | assigned as 지통실 #1 (1호기) |
| [`shotloom.md`](shotloom.md) | triggered | working in the shotloom repo |
| [`slack.md`](slack.md) | triggered | sending any Slack message |
| [`writing.md`](writing.md) | triggered | writing external-facing prose |
| [`doc-write.md`](doc-write.md) | triggered | writing any doc to vault, staging, private/, or ops/ |
| [`pr-mutate.md`](pr-mutate.md) | triggered | about to mutate PR state via gh (open, close, reopen, merge, force-push) |
| [`pr-comment.md`](pr-comment.md) | triggered | about to post any PR / review / issue comment via gh |
| [`pr-create.md`](pr-create.md) | triggered | about to call gh pr create |
