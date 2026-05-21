# Shotloom Review Finding Pattern Inbox

Purpose: accumulate generalized pattern candidates from Shotloom PR review findings before they are consolidated into permanent rules, standards, or skill edits.

This file is intentionally an inbox. Keep entries concrete enough to trace back to the review, but generalized enough to reuse across future implementation and review work.

## Entry Rules

- Add entries from `shotloom-wrapup-task` only when a PR had real review, CI, or rule findings.
- Use `PR NNN` text only. Do not include private Shotloom PR URLs or markdown links.
- Do not add Branch / Worktree / Commit-list metadata.
- Do not summarize the feature.
- Prefer 1-3 high-signal patterns per PR; merge repetitive nits into one pattern.
- If a finding is too PR-specific to generalize, keep it in the devlog only.

## Entry Template

```md
## PR NNN

### Pattern: <portable lesson>

- Finding: <what the reviewer/CI/rule pointed out>
- Why It Was Right: <the underlying principle>
- General Rule: <future-facing rule>
- Trigger: <signals that should make an agent check this next time>
- Fix Shape: <smallest typical fix or regression-test shape>
- Source Evidence: PR NNN; <reviewer/check>; `<file:line>` or check name.
```
