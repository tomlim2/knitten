# Shotloom repo hub rule

When working inside `/Users/deemooooooooo/Desktop/www/shotloom-github/`, these documents bind. Read at session start; re-read when task changes category.

## Mandatory reads by task category

| Task | Read |
|------|------|
| Writing code (Rust or TS/React) | [`standards/shotloom-programming.md`](../standards/shotloom-programming.md) — WHAT rules to follow when writing |
| Reviewing code (self-review or reviewing others) | [`standards/review-code-rust.md`](../standards/review-code-rust.md) — 22-pattern Rust review checklist |
| Opening / updating a PR | [`rules/shotloom-git.md`](shotloom-git.md) — pre-PR gates, gh auth, commit identity, ADR index |
| Project context / architecture / perf budget | [`standards/shotloom.md`](../standards/shotloom.md) — project overview |
| In-repo source of truth (re-read every session) | `AGENTS.md`, `CONTRIBUTING.md`, `docs/guidelines/*`, `docs/adr/README.md`, `.agent/*` |

## Hard overrides

- **In-repo guidelines override mirrored Claude docs.** If `docs/guidelines/review-rust.md` says one thing and `~/.claude/standards/shotloom-programming.md` says another, the in-repo file wins. Mirror is advisory; source is authoritative.
- **Repo-specific `shotloom-git.md` overrides generic `git.md`** for this repo.
- **Hard rules from repo `CLAUDE.md`** (e.g. "no `git add -f`") are non-negotiable.

## Strictness

Shotloom is stricter than average Claude work. Apply:

- **No `unwrap`/`expect`/`panic!`** on user-facing paths — `Result` instead.
- **No `any` in production TS** — narrowing or discriminated unions.
- **Every `unsafe` block needs `// SAFETY:` comment.**
- **Every `#[allow(...)]` needs justifying comment.**
- **Every new module ships with unit tests in the same PR.**
- **Bridge contract change = same-PR TS update.**
- **Never `--no-verify`, never `git add -f`, never push to `main`.**

Full rule set: [`standards/shotloom-programming.md`](../standards/shotloom-programming.md).

## Ask-first matrix

Before doing any of these, ask the user (per repo `AGENTS.md`):

- Adding new dependencies (Rust or JS)
- File moves affecting imports
- CI changes, hook behavior changes
- Bevy ECS ordering / plugin changes
- WASM / native runtime split changes
- Stage / character contract changes
- VRM normalization, validation, asset-pipeline contract changes

## Skill entry points

All Shotloom workflow live here — prefer these over ad-hoc commands:

- `/shotloom-make-pr` — draft + open PR with pre-flight gates
- `/shotloom-review-before-pr` — pre-PR self-review against 22-pattern checklist
- `/shotloom-respond-pr` — read review comments, fix, commit, post inline replies (with approval gate)
- `/shotloom-auto-pr` — fully-automatic watcher/responder (approval-exempt, this skill only)
- `/shotloom-watch-pr` — passive polling watcher
- `/shotloom-open-web` — launch WASM + Vite dev server
- `/shotloom-linear-create-issue` — Linear issue in Shotloom team

## Repository language

All repo artifacts (code, comments, commits, PR descriptions, docs) in **English**. Korean only in Linear issues. Conversation with user may be any language.
