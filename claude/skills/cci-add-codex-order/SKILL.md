---
description: Add a new Codex order brief to ~/.codex/codex-base/order/ for an upcoming Linear issue (STL-NN)
argument-hint: "<issue-id> <short-slug> [--target <repo>] [--branch <name>] [--mirror-to-agent]"
allowed-tools: Read, Write, Edit, Bash(git:*), Bash(ls:*)
---

# cci-add-codex-order

Scaffold a new Codex order brief under `~/.codex/codex-base/order/` so the Codex CLI (which reads its primary queue from that directory per `~/.codex/codex-base/AGENTS.md`) can pick the work up without relying on prior chat history.

## Scope

- **Primary target:** a Linear STL-NN issue that is next-in-line for Codex to work on.
- **Canonical location:** `~/.codex/codex-base/order/<issue-id>-<short-slug>.md`
- **Optional mirror:** `<target-repo>/.agent/handoff-<issue-id>.md` (repo-scoped operational memory per the shotloom `.agent/` convention in `~/.claude/rules/shotloom.md`).
- **Canonical source:** if the target repo has a `.agent/` dir, treat the repo-side copy as canonical and the order/ copy as a cache. Otherwise the order/ file itself is canonical.
- **Out of scope:** running the work, creating the Linear issue (use `shotloom-linear-create-issue` / `cci-linear-create-issue`), committing/pushing the codex-base repo (user decides when to `git push`).

## Arguments

- `<issue-id>` — required, lowercase Linear identifier, e.g. `stl-89`
- `<short-slug>` — required, kebab-case action phrase, e.g. `retarget-arp-to-vrm-wiring`
- `[--target <repo>]` — target repo key from `~/.claude/private/caol-config/repo-paths.json`. Defaults to `shotloom`.
- `[--branch <name>]` — feature branch. Defaults to `feat/<short-slug>`.
- `[--mirror-to-agent]` — also write `<target-repo>/.agent/handoff-<issue-id>.md`.

**If `<issue-id>` or `<short-slug>` is missing, show usage and ask. NEVER auto-execute.**

```
Usage: /cci-add-codex-order <issue-id> <short-slug> [--target <repo>] [--branch <name>] [--mirror-to-agent]

Example:
  /cci-add-codex-order stl-89 retarget-arp-to-vrm-wiring
```

## Filename convention (MANDATORY)

Filename is `<issue-id>-<short-slug>.md`. Codex's `AGENTS.md` primary-queue rule scans `~/.codex/codex-base/order/` by filename — any deviation is a hard error, not a warning.

- **`<issue-id>` regex:** `^[a-z]{2,5}-[0-9]+$` (lowercase team prefix + dash + digits)
- **`<short-slug>` regex:** `^[a-z0-9]+(-[a-z0-9]+){1,7}$`, length 6–48, 2–8 words
- **Must start with imperative verb.** Allowed family: `add`, `port`, `wire`, `fix`, `rename`, `refactor`, `scaffold`, `expose`, `validate`, `harden`, `replace`, `remove`, `rewrite`, `sync`, `cap`, `gate`, `lift`, `split`, `merge`, `retarget`, `drive`.
- **Forbidden slugs (hard reject for NEW files):** `next-steps`, `todo`, `misc`, `temp`, `draft`, `wip`, `tmp`, `stuff`, `things`, or noun-only phrases.
- **Full-path length cap:** `~/.codex/codex-base/order/<issue-id>-<short-slug>.md` ≤ 128 chars.

For detailed regex examples, good/bad table, and verb-family extension rules, see [reference.md](reference.md).

## Workflow

### Step 1: Validate arguments (strict — any failure is a hard stop)

Run these checks in order. On first failure, STOP, print the rule + offending input + passing example, ask user to retry. Do NOT auto-correct silently.

1. **Presence** — both args present.
2. **`<issue-id>` regex** — reject `STL-89` as uppercase (do not silently lowercase).
3. **`<short-slug>` regex** — reject underscores, uppercase, bad dashes, dots, slashes.
4. **Slug length** — 6 ≤ len ≤ 48.
5. **Word count** — 2 ≤ count ≤ 8.
6. **Verb-first** — first word must be imperative verb. If not in allowlist, ask user: (a) pick existing verb, or (b) confirm new verb for this session.
7. **Forbidden slug** — reject with "please describe the work, not the status".
8. **Noun-only guard** — reject if no verb anywhere in slug.
9. **Full-path cap** — ≤ 128 chars.
10. **codex-base present** — `~/.codex/codex-base/` exists and is a git repo.
11. **Target repo resolvable** — via `repo-paths.json`. Missing key → list available, do NOT default silently.
12. **No overwrite** — if target file exists, show first 30 lines, ask user to edit manually or pick new slug.
13. **Branch sanity** — `^(feat|fix|chore|hotfix|release)/[a-z0-9][a-z0-9-]*$`.
14. **Linear cross-check (best-effort)** — if MCP available, warn on Done/Completed issues. Missing issue = warn not block.

### Step 2: Gather Linear context (best-effort)

- Via `mcp__claude_ai_Linear__get_issue` if available.
- If MCP not wired, skip and leave TODO placeholder.
- Do NOT write body until user approves in Step 4.

### Step 3: Draft the order file

Fill the template (see reference.md for the full template). Required sections: frontmatter, H1, Summary, Context, Target, Binding docs, Scope, Acceptance criteria, Out of scope, Blockers, Handoff notes.

### Step 4: Show the draft and get explicit approval

- Render full draft inline.
- Ask: "Write to `~/.codex/codex-base/order/<issue-id>-<short-slug>.md`? (y/n)"
- Do NOT write until user approves.

### Step 5: Write the file(s)

- On approval, write to canonical path.
- If `--mirror-to-agent`, also write `<target-repo>/.agent/handoff-<issue-id>.md` with a prefix note: `> Canonical copy mirrored from ~/.codex/codex-base/order/<issue-id>-<short-slug>.md`.

### Step 6: Update order/README.md index

Append a row to the "현재 열린 주문" / "Current open orders" table with file, target repo, branch, Linear link. Preserve existing rows.

### Step 7: Report + next actions

Show user: full path, mirror path (if used), `git -C ~/.codex/codex-base status`, and a reminder that push is the user's call (do NOT run automatically).

## Guardrails

- **Never overwrite an existing order file.**
- **Never commit or push** the codex-base repo.
- **Never touch `~/.codex/codex-base/rules/`.**
- **Never create Linear issues** — use the dedicated skills.
- **Keep order files under ~150 lines.** Longer = split the issue.
- **If Linear MCP fetch fails,** write with TODO placeholder, tell user to fill in.

## Related

- `~/.codex/codex-base/AGENTS.md` — Primary Queue rule
- `~/.codex/codex-base/order/README.md` — order/ conventions
- `~/.claude/rules/shotloom.md` — `.agent/` folder convention
- `claude/skills/shotloom-linear-create-issue/` — sibling for creating Linear issues
- `claude/skills/cci-codex-review-rust/` — sibling Codex CLI skill

## Additional Resources

For filename examples (good vs bad), the full order-file markdown template, and the full validation rationale, see [reference.md](reference.md).
