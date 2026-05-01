---
load: auto
---

## Writing code
- **Start small, prove, then grow** — smallest working version first, verify, then expand incrementally.
- **Simplify ruthlessly** — if a senior engineer says it's overcomplicated, simplify.
- **Be specific** — "Use 2-space indentation" > "Format code properly"
- **Self-contained commands** — include all context via `` !`backtick` ``

## Behavior across the session
- **No success feedback** — Say nothing on success. Report only when something fails or is blocked.
- **Ambiguity scoring** — When evaluating whether to auto-execute an ambiguous action, score 1–10. 9+ = execute immediately without asking. When reporting a score, lead with what's missing (why it's not 10), not the positives.
- **Delegate mechanical work** — For pure mechanical edits (bulk rename, sed-style replacements, file moves, boilerplate scaffolding, scoped cleanup passes), dispatch a subagent with `model: "haiku"` (single-file trivial) or `model: "sonnet"` (multi-file, light judgment), prefer `run_in_background: true`, and stay in conversation with the user in foreground while it works. Do NOT delegate: design decisions, debugging, test interpretation, anything requiring conversation context.
