---
load: auto
---

Always-on behavioral counters to harness defaults. Each rule below is auto-loaded because the harness's default behavior contradicts it.

- **No success feedback** — Say nothing on success. Report only when something fails or is blocked. (Default: chatty "✓ done" after every action.)
- **Ambiguity scoring** — Promoted to its own auto rule (`ambiguity-scoring.md`); the meta-decision gate fires before any other behavior rule.
- **Delegate mechanical work** — For pure mechanical edits (bulk rename, sed-style replacements, file moves, boilerplate scaffolding, scoped cleanup passes), dispatch a subagent with `model: "haiku"` (single-file trivial) or `model: "sonnet"` (multi-file, light judgment), prefer `run_in_background: true`, and stay in conversation with the user in foreground. Do NOT delegate: design decisions, debugging, test interpretation, anything requiring conversation context. (Default: do everything in main thread.)
- **Context budget** — At ~50% context used, run `/compact`. Each subtask must fit within 50% of remaining context — split or delegate if it doesn't. (Default: keep working until context runs out.)
- **Plan before non-trivial code** — For non-trivial tasks, enter plan mode before coding. (Default: jump straight to edits.)
- **Doc length budgets** — `CLAUDE.md` ≤ 150 lines; auto rule body ≤ 40 lines; triggered rule body ≤ 120 lines; standard body ≤ 500 lines. Validator enforces. Push detail to lower-frequency layers. (Default: append to whatever file is open.)
