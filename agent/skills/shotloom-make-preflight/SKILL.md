---
description: Load all Shotloom rules/conventions/standards into a base session for forking — run once per day, fork for actual work
allowed-tools: Read, Glob, Bash(git:*), Bash(ls:*), Bash(date:*)
domains: rust
repo-keys: shotloom
languages: rust,typescript
frameworks: bevy,wgpu
task-types: review
context-profile: shotloom-review
exclude-when: unreal,obsidian
---

# shotloom-make-preflight

Build a **base session** pre-loaded with every Shotloom rule, convention, and standard. Fork this session in Claude Code for each work task to skip redundant re-reads.

No versioning, no manifest, no freshness check. Trust the human: recreate the base when docs change or a new day starts.

## Arguments

None. Zero-arg skill.

Usage: `/shotloom-make-preflight`

## When to Run

- Start of each work day (first shotloom session)
- After pulling changes to `docs/guidelines/**`, `docs/adr/**`, `AGENTS.md`, `CONTRIBUTING.md`, `CLAUDE.md`, or `.agent/**`
- After merging a PR that touches repo rules

If unsure, recreate. Cheap insurance.

## Workflow

### Step 1: Verify environment

Run in parallel:

```bash
shotloom_root=$(jq -re '.shotloom.path // .shotloom // empty' ~/.claude/private/caol-config/repo-paths.json)
git -C "$shotloom_root" rev-parse HEAD
git -C "$shotloom_root" status --short
date +"%Y-%m-%d %H:%M:%S %Z"
```

Confirm: cwd or target path is `shotloom-github`, git HEAD captured for the briefing.

### Step 2: Read repo conventions (parallel)

Read all of the following from `$shotloom_root` (resolved above):

- `AGENTS.md`
- `CONTRIBUTING.md`
- `CLAUDE.md`
- `docs/adr/README.md`

Then enumerate and read every file under:

- `docs/guidelines/*.md`
- `.agent/*.md` (if folder exists)

### Step 3: Read global Shotloom standards (parallel)

From `~/.claude/` (Claude-side only — in-repo `docs/guidelines/` is canonical for writing/review rules and is loaded in Step 2):

- the PR-scope policy in `~/.claude/skills/shotloom-auto-pr/reference.md` — PR scope classification policy (no in-repo equivalent)
- `~/.claude/rules/shotloom.md` — hub rule (routing + answering style)
- `~/.claude/rules/shotloom.md` — Claude-side gates (gh auth, auto-commit, CI exclude flags)

### Step 4: Read ADR index entries

From `docs/adr/README.md`, list every ADR under "Accepted" and "Proposed" groups. Do NOT read each ADR body — those are loaded per-task by the forked session. Keep a list of titles + filenames for the briefing.

### Step 5: Ready marker

Emit:

```
### Shotloom preflight base — READY

**Created:** <timestamp>
**shotloom HEAD:** <short-sha>
**Loaded:**
- Repo: AGENTS, CONTRIBUTING, CLAUDE, ADR index, N guideline files, M .agent files
- Claude-side: ~/.claude/rules/shotloom.md, ~/.claude/skills/shotloom-auto-pr/reference.md (PR-scope policy)
- ADR titles indexed: <count>

**Fork this session for each work task.**
Do NOT edit code or run commits in this session — it is a read-only base.
When forked, the next step is `/shotloom-start-task STL-NN` for the issue.

Recreate this base when:
- A new day starts
- docs/guidelines/, docs/adr/, AGENTS.md, CONTRIBUTING.md, CLAUDE.md, .agent/, or global shotloom standards change
```

### Step 6: STOP

Do not proceed to any task. Do not accept code edits. This session is base-only.

If the user asks to work on code in this session, refuse and tell them to fork first.

## Design Notes

- **No manifest / no hash check** — versioning adds complexity without clear payoff at current scale. Recreate cheaply.
- **No Linear fetch** — issue state changes too often to cache. Fork session does its own fetch via `/shotloom-start-task`.
- **Base session is read-only** — editing the base pollutes every future fork. Enforce by convention, not by tooling.
- **Fork-of-fork not recommended** — stale risk compounds. Fork only from the original base.

## Related

- [`shotloom-start-task`](../shotloom-start-task/SKILL.md) — run inside the forked session for per-task setup (Linear fetch, worktree, category detect)
- `~/.claude/rules/shotloom.md` — hub
