---
load: auto
---

# Rules Index

Always-applied constraints. Short, enforceable, one-liners. Read at session start.

Unlike `standards/` (long reference docs read on-demand), rules here are **must-follow** directives. Each file contains a few terse bullets. Standards remain the source of truth for detailed rationale and examples — rules link back via `@import`.

Each rule declares its load behavior in its own frontmatter (`load: auto` or `load: triggered` + `trigger:`). The `Load` column below mirrors that.

## Always-loaded (auto)

Imported by `CLAUDE.md` every session.

| Rule | Load | Scope |
|------|------|-------|
| [`git.md`](git.md) | auto | Git commit / push / author |
| [`session-start.md`](session-start.md) | auto | Config reads + safety guards at session start |
| [`coding.md`](coding.md) | auto | Code-writing principles + always-on behavior (output, ambiguity, delegation) |
| [`verify-before-report.md`](verify-before-report.md) | auto | Before presenting results |
| [`security.md`](security.md) | auto | Secrets, documentation language |

## Triggered

Loaded only when the trigger condition fires. Each row's trigger lives in the file's frontmatter.

| Rule | Load | Trigger | Scope |
|------|------|---------|-------|
| [`reread-repo-conventions.md`](reread-repo-conventions.md) | triggered | start of non-trivial work in any repo | Always re-read repo conventions before work AND before reviewing |
| [`testing.md`](testing.md) | triggered | writing or reviewing code that includes tests | Unit tests mandatory for new code; PR blocker; exception list |
| [`naming.md`](naming.md) | triggered | creating a command or skill | `{category}-{verb}-{subject}` pattern |
| [`command-frontmatter.md`](command-frontmatter.md) | triggered | creating a command | Required fields, argument validation |
| [`tool-permissions.md`](tool-permissions.md) | triggered | creating a command or skill | `allowed-tools` Bash patterns |
| [`obsidian.md`](obsidian.md) | triggered | working in the Obsidian vault | Obsidian vault document format |
| [`cinev-git.md`](cinev-git.md) | triggered | git op in a CINEV repo | CINEV project git ops (UE lock check) |
| [`multi-agent.md`](multi-agent.md) | triggered | assigned as 지통실 #1 (1호기) | Multi-agent dispatch protocol |
| [`shotloom.md`](shotloom.md) | triggered | working in the shotloom repo | Shotloom Claude-side meta — gh account, commit identity, build flag, approval-gate exceptions, `/shotloom-auto-pr` exemption, `/claude-review` trigger |
| [`slack.md`](slack.md) | triggered | sending any Slack message | Confirm-first per message |
| [`writing.md`](writing.md) | triggered | writing external-facing prose | `/writing-draft-human` → `/writing-fix-ai` pipeline |
| [`doc-write.md`](doc-write.md) | triggered | writing any doc to vault, staging, private/, or ops/ | Resolver-first; purpose-first; never hand-build paths |
