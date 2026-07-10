# Log Usage Flow

Use this reference after `log-usage` Step 0 passes.

## Entry Format

Append a dated Markdown entry. Include only fields supported by the user's
message or visible conversation context. Use `unknown` for important missing
values and do not invent token counts, durations, skill names, files, or
outcomes.

```markdown
## YYYY-MM-DD HH:mm TZ - <Short Title>

### Summary
- Goal: <goal or request>
- Outcome: <completed / partial / blocked / unknown>
- Usage: <token count or unknown>
- Duration: <duration or unknown>

### Skills / Agents
- Skills: <skills or unknown>
- Agents: <agents or unknown>
- Mode: <review / implementation / debug / docs / unknown>

### Work
- Category: <spec / review / implementation / verification / unknown>
- Domain: <project area or unknown>
- Files: <paths or unknown>

### Notes
- <why this usage was notable>

### Follow-up
- <next action, if any>
```

Omit optional sections that would contain only `unknown`.

## Workflow

1. Parse the supplied usage data and visible task context.
2. Resolve the destination from the active skill's safety rules.
3. Create the parent directory only after confirming the repository path is
   ignored.
4. Append one compact entry.
5. Report the absolute path and a short summary.

The journal reveals cost patterns; it is not a transcript archive.
