# Shotloom repo hub rule

When working inside !`python3 -c "import json,os; d=json.load(open(os.path.expanduser('~/.claude/private/caol-config/repo-paths.json'))); print(d['shotloom'])"`, these documents bind. Read at session start; re-read when task changes category.

## Mandatory reads by task category

| Task | Read (in order) |
|------|------|
| Writing code (Rust or TS/React) | in-repo `docs/guidelines/review-rust.md`, `error-handling.md`, `review-typescript.md` (TS only) |
| Reviewing code (self-review or reviewing others) | in-repo `docs/guidelines/review-rust.md` + [`standards/review-code-rust.md`](../standards/review-code-rust.md) (22-pattern catalog from real PR defects, no in-repo equivalent) |
| Opening / updating a PR | in-repo `docs/guidelines/pr-guideline.md`, `commit-guideline.md` + [`rules/shotloom-git.md`](shotloom-git.md) (Claude-side gates: gh auth, auto-commit, CI exclude flags) |
| Project context / architecture / perf budget | [`standards/shotloom.md`](../standards/shotloom.md) — project overview (no in-repo equivalent) |
| In-repo source of truth (re-read every session) | `AGENTS.md`, `CONTRIBUTING.md`, `docs/guidelines/*`, `docs/adr/README.md`, `.agent/*` |

**Authority order:** in-repo `docs/guidelines/` always wins over any Claude-side mirror. Claude-side standards exist only when in-repo lacks the content (review pattern catalog, project philosophy, PR scope policy).

## Answering style

- **Lead with the big picture for any shotloom question.** When the user asks about a PR / issue / module / ADR / subsystem, start with what larger goal it serves — which subsystem (VRM pipeline, timeline, rendering, bridge, etc.), what future work it unblocks, why it matters now. Factual bits (branch name, CI status, reviewer state, file list) go at the end, not the top. The user can read titles themselves; the value-add is framing the item inside Shotloom's web-first / Bevy-WASM / crate-boundary architecture. Applies to every shotloom task question, not just "what is this?" phrasing.

## Hard overrides

- **In-repo `docs/guidelines/` is the single source of truth for code-writing and review rules.** Claude-side `standards/` only carries content the in-repo lacks (review-code-rust pattern catalog, project overview, PR scope policy).
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

Full rule set: in-repo `docs/guidelines/` directory (read at session start).

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
