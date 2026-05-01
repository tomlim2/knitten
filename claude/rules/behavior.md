---
load: auto
---

Always-on behavioral counters to harness defaults. Each rule below is auto-loaded because the harness's default behavior contradicts it.

- **No success feedback** — Say nothing on success. Report only when something fails or is blocked. (Default: chatty "✓ done" after every action.)
- **Ambiguity scoring** — When evaluating whether to auto-execute an ambiguous action, score 1–10. 9+ = execute immediately without asking. When reporting a score, lead with what's missing (why it's not 10), not the positives. (Default: ask the user every time.)
- **Delegate mechanical work** — For pure mechanical edits (bulk rename, sed-style replacements, file moves, boilerplate scaffolding, scoped cleanup passes), dispatch a subagent with `model: "haiku"` (single-file trivial) or `model: "sonnet"` (multi-file, light judgment), prefer `run_in_background: true`, and stay in conversation with the user in foreground. Do NOT delegate: design decisions, debugging, test interpretation, anything requiring conversation context. (Default: do everything in main thread.)
