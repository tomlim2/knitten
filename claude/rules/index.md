---
load: auto
---

# Rules Index

Each rule declares `load:` in its frontmatter. **Auto** = always in cold-start context (default-counters only, body cap 40). **Triggered** = loads when its trigger fires (cap 120).

| Rule | Load | Trigger / Scope |
|------|------|-----------------|
| [`ambiguity-scoring.md`](ambiguity-scoring.md) | auto | Meta-decision gate — 1-10 score before any ambiguous action; 9+ auto, else surface |
| [`external-recommendation-cross-check.md`](external-recommendation-cross-check.md) | auto | Cross-check Codex/Gemini/subagent suggestions against user's SYSTEM.md/standards before adopting |
| [`canonical-first.md`](canonical-first.md) | auto | Meta — when you see a pattern (suffix/prefix/term), grep the skill/standard that defines it before mimicking |
| [`git-defaults.md`](git-defaults.md) | auto | No auto-push / no Co-Authored-By / author identity |
| [`behavior.md`](behavior.md) | auto | Output style, delegation, context budget (ambiguity moved out) |
| [`verify-before-report.md`](verify-before-report.md) | auto | Verify before presenting any result |
| [`security.md`](security.md) | auto | Secrets handling, documentation language |
| [`session-start.md`](session-start.md) | auto | Config reads + safety guards |
| [`code-write.md`](code-write.md) | triggered | writing or editing code |
| [`reread-repo-conventions.md`](reread-repo-conventions.md) | triggered | start of non-trivial work in any repo |
| [`test-write.md`](test-write.md) | triggered | writing or reviewing code with tests |
| [`author-naming.md`](author-naming.md) | triggered | creating a command or skill |
| [`author-frontmatter.md`](author-frontmatter.md) | triggered | creating a command |
| [`author-permissions.md`](author-permissions.md) | triggered | creating a command or skill |
| [`obsidian.md`](obsidian.md) | triggered | working in the Obsidian vault |
| [`cinev-git.md`](cinev-git.md) | triggered | git op in a CINEV repo |
| [`shotloom.md`](shotloom.md) | triggered | working in the shotloom repo |
| [`slack.md`](slack.md) | triggered | sending any Slack message |
| [`writing-external.md`](writing-external.md) | triggered | writing external-facing prose |
| [`doc-write.md`](doc-write.md) | triggered | writing any doc to vault, staging, private/, ops/ |
| [`metaphor-style.md`](metaphor-style.md) | triggered | explaining technical concepts to this user |
| [`pr-mutate.md`](pr-mutate.md) | triggered | mutating PR state via gh |
| [`pr-comment.md`](pr-comment.md) | triggered | posting any PR / review / issue comment |
| [`pr-create.md`](pr-create.md) | triggered | calling gh pr create |
