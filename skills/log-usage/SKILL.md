---
name: log-usage
description: Log local Codex usage and cost notes.
match-check: normal
---

# Log Usage

Use for: appending concise local operating-cost notes for agent work.

Use this skill to append concise operating-cost notes for agent work. The log is
for local reflection, not source-controlled project documentation.

## Step 0: Match Check

- Continue only when the request explicitly asks to record usage, cost, token,
  duration, Goal, orchestrator, review-loop, or similar operating metadata.
- Identify the candidate local-only destination. Repository ignore state is a
  post-match, read-only safety check and must pass before writing.
- Stop if the user is asking for project documentation, release notes, or a
  source-controlled report instead of a local usage journal.
- Match local usage journal requests; reject release notes, project docs, and
  tracked reports.
- Do not create directories or append entries until this request-fit check
  passes.

## Destination Safety

Prefer `.agent-local/knitten/usage-log.md` in the current repository. If there
is no current repository, use `~/.codex/local/knitten/usage-log.md`. Before a
repository write, confirm the path is ignored:

```bash
git check-ignore -v .agent-local/knitten/usage-log.md
```

If it is not ignored, create or use an already ignored local-only directory only
after checking repository rules. Do not write usage logs into tracked docs unless
the user explicitly asks.

Do not read detailed references until Step 0 passes.

## After Match

Read [`references/flow.md`](references/flow.md), append one compact entry, and
report the absolute path.
