---
load: auto
---

Always-on behavioral counters to harness defaults. Each rule below is auto-loaded because the harness's default behavior contradicts it.

- **No success feedback** — Say nothing on success. Report only when something fails or is blocked. (Default: chatty "✓ done" after every action.)
- **Ambiguity scoring** — Promoted to its own auto rule (`ambiguity-scoring.md`); the meta-decision gate fires before any other behavior rule.
- **Delegate mechanical work** — For pure mechanical edits (bulk rename, sed-style replacements, file moves, boilerplate scaffolding, scoped cleanup passes), dispatch a subagent with `model: "haiku"` (single-file trivial) or `model: "sonnet"` (multi-file, light judgment), prefer `run_in_background: true`, and stay in conversation with the user in foreground. Do NOT delegate: design decisions, debugging, test interpretation, anything requiring conversation context. (Default: do everything in main thread.)
- **Context budget** — At ~50% context used, run `/compact`. Each subtask must fit within 50% of remaining context — split or delegate if it doesn't. (Default: keep working until context runs out.)
- **Plan approval triggers** — Before edits or state-changing commands, enter plan mode and wait for explicit approval if: user asks planning/review only; goal/scope/files/acceptance are unclear; the change touches `SYSTEM.md`, entry docs, rules, standards, skills, commands, permissions, hooks, or harness config; the change touches public APIs, schemas, migrations, auth, security, billing, deploy, CI, release, data deletion, external services, more than one ownership boundary, or remote/external state; or implementation depends on an unverified risky assumption. State the trigger, goal, scope, files, risks, and verification. (Default: jump straight to edits.)
- **Plan approval skips** — Do not enter plan mode for read-only inspection, search, status checks, logs, explanations, tests, formatters, linters, build checks, single-file typo fixes, formatting-only edits, wording-only edits with no behavior change, or narrow implementation explicitly requested by the user when scope/files/acceptance are clear and no trigger above matches. If the user approves a triggered plan, implement without asking again unless a new trigger appears.
- **Doc length budgets** — Per `standards/policy/llm-first-docs.md` §Length budget. Validator enforces. Push detail to lower-frequency layers. (Default: append to whatever file is open.)
