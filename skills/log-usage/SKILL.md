---
name: log-usage
description: Log local Codex usage and cost notes.
match-check: normal
---

# Log Usage

Use this skill to append concise operating-cost notes for agent work. The log is
for local reflection, not source-controlled project documentation.

## Step 0: Match Check

- Continue only when the request explicitly asks to record usage, cost, token,
  duration, Goal, orchestrator, review-loop, or similar operating metadata.
- Confirm the destination is local-only and ignored before writing inside a
  repository.
- Stop if the user is asking for project documentation, release notes, or a
  source-controlled report instead of a local usage journal.
- Do not create directories, inspect ignore state, or append entries until this
  check passes.

## Destination

Prefer the current repository's local ignored journal:

```text
.agent-local/knitten/usage-log.md
```

If there is no current repository, use:

```text
~/.codex/local/knitten/usage-log.md
```

Before writing inside a repository, confirm the chosen path is ignored:

```bash
git check-ignore -v .agent-local/knitten/usage-log.md
```

If it is not ignored, create or use an already ignored local-only directory only
after checking repository rules. Do not write usage logs into tracked docs unless
the user explicitly asks.

## Entry Format

Append a dated Markdown entry. Include only fields supported by the user's
message or visible conversation context. Use `unknown` for important missing
values; do not invent exact token counts, durations, skill names, file lists, or
outcomes.

```markdown
## YYYY-MM-DD HH:mm TZ - <Short Title>

### Summary
- Goal: <goal or request>
- Outcome: <completed / partial / blocked / unknown>
- Usage: <token count or unknown>
- Duration: <duration or unknown>

### Skills / Agents
- Skills:
  - `<skill-name>`
- Agents:
  - `<agent/orchestrator/review mode>`
- Mode: <triad review / goal orchestrator / implementation / debug / docs / unknown>

### Work
- Category: <spec / review / implementation / verification / commit / web debug / unknown>
- Domain: <project area or unknown>
- Files:
  - `<path>`

### Notes
- <why this usage was notable or useful>

### Follow-up
- <next action, if any>
```

Omit empty optional sections when they would only contain `unknown`.

## Workflow

1. Parse the user's usage data, such as token count, elapsed time, goal name,
   skills, agents, review mode, outcome, and follow-up.
2. Resolve the destination path.
3. Create the parent directory if needed.
4. Verify the repository destination is ignored before writing.
5. Append one entry using the template.
6. Report the absolute path and a short summary of what was recorded.

Keep entries compact. The goal is to reveal cost patterns across work types,
not to preserve the full transcript.
