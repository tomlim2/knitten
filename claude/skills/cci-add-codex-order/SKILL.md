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
- **Optional mirror:** `<target-repo>/.agent/handoff-<issue-id>.md` (repo-scoped operational memory per the shotloom `.agent/` convention in `rules/shotloom-git.md`).
- **Source of truth:** if the target repo has a `.agent/` dir, treat the repo-side copy as canonical and the order/ copy as a cache. Otherwise the order/ file itself is canonical.
- **Out of scope:** running the work, creating the Linear issue (use `shotloom-linear-create-issue` / `cci-linear-create-issue` for that), committing/pushing the codex-base repo (user decides when to `git push` `~/.codex/codex-base`).

## Arguments

- `<issue-id>` — required, lowercase Linear identifier, e.g. `stl-89`
- `<short-slug>` — required, kebab-case action phrase, e.g. `retarget-arp-to-vrm-wiring`
- `[--target <repo>]` — target repo key from `~/.claude/private/repo-paths.json` (e.g. `shotloom`, `anju`). Defaults to `shotloom`.
- `[--branch <name>]` — feature branch that Codex will work on. Defaults to `feat/<short-slug>`.
- `[--mirror-to-agent]` — also write the same file as `<target-repo>/.agent/handoff-<issue-id>.md` so the repo checkout carries its own copy.

**If `<issue-id>` or `<short-slug>` is missing, show usage and ask. NEVER auto-execute.**

```
Usage: /cci-add-codex-order <issue-id> <short-slug> [--target <repo>] [--branch <name>] [--mirror-to-agent]

Examples:
  /cci-add-codex-order stl-89 retarget-arp-to-vrm-wiring
  /cci-add-codex-order stl-90 validate-pipeline-contract --target shotloom --branch feat/validate-pipeline --mirror-to-agent
```

## Filename convention (MANDATORY, enforced in Step 1)

The filename is `<issue-id>-<short-slug>.md`. Codex's `AGENTS.md` primary-queue rule scans `~/.codex/codex-base/order/` by filename, so the name itself is the lookup key — any deviation is a hard error, not a warning.

### `<issue-id>` rules

- **Regex:** `^[a-z]{2,5}-[0-9]+$`
- Lowercase Linear team prefix (2–5 letters) + single dash + digits.
- Examples OK: `stl-89`, `stl-123`, `ta-7`, `tex-420`
- Examples rejected: `STL-89` (uppercase), `stl_89` (underscore), `stl89` (no dash), `stl-89-v2` (extra suffix), `89` (no prefix), `stl-0` (zero ids are Linear never-assigned)

### `<short-slug>` rules

- **Regex:** `^[a-z0-9]+(-[a-z0-9]+){1,7}$`
- **Length:** 6–48 characters inclusive.
- **Word count:** 2–8 kebab-separated words.
- **Must start with an action verb in imperative form** (no nouns, no participles).
- Allowed verb families (not exhaustive — add to the list as the fleet grows): `add`, `port`, `wire`, `fix`, `rename`, `refactor`, `scaffold`, `expose`, `validate`, `harden`, `replace`, `remove`, `rewrite`, `sync`, `cap`, `gate`, `lift`, `split`, `merge`, `retarget`, `drive`.
- **Forbidden slugs** — hard reject, ask the user to rephrase:
  - `next-steps`, `todo`, `misc`, `temp`, `draft`, `wip`, `tmp`, `stuff`, `things`
  - Any slug that is ONLY a noun phrase (e.g. `rotation-order`, `cache-layout`) — these describe the subject, not the work, and collide with sibling orders.
- **Exception grandfathered for legacy files:** `stl-89-next-steps.md` already exists from the prior Codex session and is allowed to stay. The forbidden list applies to NEW files only.

### Examples, good and bad

| Filename | Verdict | Reason |
|---|---|---|
| `stl-89-retarget-arp-to-vrm-wiring.md` | OK | verb-first, 6 words, 31 chars |
| `stl-90-expose-evaluate-pipeline.md` | OK | verb-first, 3 words |
| `stl-91-harden-property-parser-ranges.md` | OK | verb-first, 4 words |
| `STL-92-fix-thing.md` | REJECT | uppercase id, slug too vague, noun `thing` |
| `stl-93-rotation-order.md` | REJECT | noun-only slug, no verb |
| `stl-94-next-steps.md` | REJECT | forbidden slug |
| `stl-95-fix.md` | REJECT | slug < 6 chars, 1 word |
| `stl-96-rewrite-the-whole-pipeline-and-also-the-adapter-and-the-tests.md` | REJECT | > 48 chars / > 8 words — split into multiple orders |
| `stl-97-port_adapter.md` | REJECT | underscore in slug |

### Full-path length cap

- Absolute path `~/.codex/codex-base/order/<issue-id>-<short-slug>.md` must be ≤ **128 characters** end-to-end (safety margin for shell tab completion + ripgrep output). With the fixed prefix `~/.codex/codex-base/order/` (26 chars) and `.md` (3 chars), the `<issue-id>-<short-slug>` portion must be ≤ 99 chars. Since issue-id is at most ~10 chars, this bounds the slug to ~88 chars — but the slug length rule (≤48 chars) kicks in first.

## Workflow

### Step 1: Validate arguments (strict — any failure is a hard stop)

Run the checks in order. On the first failure, STOP, print the rule that failed + the offending input + 1–2 passing examples, and ask the user to retry with a fixed argument. Do NOT auto-correct silently.

1. **Presence:** both `<issue-id>` and `<short-slug>` must be present. Missing either → print usage and stop.
2. **`<issue-id>` regex:** `^[a-z]{2,5}-[0-9]+$`. Reject anything that does not match. Do NOT silently lowercase or strip — if the user passes `STL-89`, reject with "issue-id must be lowercase, got `STL-89`" so they see the rule. Accepting common typos silently trains the user to skip the rule.
3. **`<short-slug>` regex:** `^[a-z0-9]+(-[a-z0-9]+){1,7}$`. Reject underscores, uppercase, consecutive/leading/trailing dashes, dots, and slashes.
4. **Slug length:** 6 ≤ `len(slug)` ≤ 48. Reject out-of-range with "slug must be 6-48 characters, got N" + an example at the right length.
5. **Word count:** 2 ≤ word count ≤ 8 (count = number of `-`-separated segments). Single-word slugs are rejected because they degenerate into forbidden vague words.
6. **Verb-first check:** the first word of the slug must be an imperative verb. Use the allowed verb family listed in the "Filename convention" section above as the initial allowlist. If the first word is not in the list, do NOT auto-reject — instead, show the user the current allowlist and ask one of: (a) "pick one of these verbs", (b) "confirm `<new verb>` should be added to the allowlist and retry". Option (b) extends the allowlist for this session only — the allowlist in SKILL.md is not auto-edited.
7. **Forbidden slug check:** reject any slug that appears in the forbidden list (`next-steps`, `todo`, `misc`, `temp`, `draft`, `wip`, `tmp`, `stuff`, `things`). Reject with "forbidden slug `<x>` — please describe the work, not the status".
8. **Noun-only guard:** if the slug has no verb at all and every word is a noun (best-effort heuristic: no word in the allowed verb family anywhere in the slug), reject with "slug must include an action verb — `retarget-arp-to-vrm-wiring` not `rotation-order`".
9. **Full-path cap:** assemble `~/.codex/codex-base/order/<issue-id>-<short-slug>.md`, compute length. Reject if > 128 chars.
10. **codex-base present:** verify `~/.codex/codex-base/` exists and is a git repo. If not, exit with "codex-base not cloned — run `git clone https://github.com/tomlim2/codex-base ~/.codex/codex-base` first".
11. **Target repo resolvable:** verify `<target-repo>` (default `shotloom`) resolves via `~/.claude/private/repo-paths.json`. Missing key → list available keys and ask the user to pick one. Do NOT default silently to `shotloom` if the user explicitly passed something that does not resolve.
12. **No overwrite:** if `~/.codex/codex-base/order/<issue-id>-<short-slug>.md` already exists, STOP and show its first 30 lines. Ask whether to edit the existing file (in which case this skill exits and the user uses Edit directly) or pick a different slug (retry the skill).
13. **Branch name sanity (if `--branch` was passed):** must match `^(feat|fix|chore|hotfix|release)/[a-z0-9][a-z0-9-]*$` per shotloom-git.md rule. Default `feat/<short-slug>` always passes.
14. **Linear-id — Linear issue cross-check (best-effort):** if the Linear MCP is available, call `mcp__claude_ai_Linear__get_issue` with the uppercased id. If the returned title/state suggests the issue is already `Done` or `Completed`, warn and ask the user to confirm before proceeding. If the issue does not exist, warn but do not block — the user may be scaffolding an order for an issue they are about to create.

Only after all 14 checks pass, proceed to Step 2.

### Step 2: Gather Linear context (best-effort)

- If the user has the Linear MCP plugin available, fetch the issue metadata (`title`, `description`, `state`, `url`) via `mcp__claude_ai_Linear__get_issue` keyed on `<issue-id>`.
- If the MCP plugin is not wired, skip and leave the Linear section as a TODO placeholder for the user to fill.
- Do NOT write the body until the user approves the draft in Step 4.

### Step 3: Draft the order file

Use this template (all sections required). Fill placeholders from the parsed arguments and any Linear context fetched in Step 2.

```markdown
---
title: "<issue-id> — <short summary from Linear, or the slug as fallback>"
issue: "<issue-id-upper>"
target_repo: "<target>"
target_branch: "<branch>"
linear_url: "<linear url or TODO>"
created: "<YYYY-MM-DD>"
---

# <issue-id-upper> — <short summary>

## Summary

<One-paragraph, self-contained brief. Must be readable without any prior chat history. State the outcome the user wants, not the mechanics.>

## Context

<Why this work is needed. Link to the preceding PR / devlog / ADR. Reference the predecessor issue if this is a follow-up.>

## Target

- **Repo:** `<target>` (clone at `<absolute path from repo-paths.json>`)
- **Branch:** `<branch>` (create from `main` at start of session)
- **Linear:** `<issue-id-upper>` — `<linear url>`

## Binding docs

<List of files the agent must read before starting. Include ADRs, spec files, rule files, relevant crates. Each line is a path relative to the target repo root.>

- `docs/adr/adr-XXXX-*.md`
- `crates/<crate>/src/<file>.rs`
- `~/.claude/standards/review-code-rust.md` (for shotloom targets — 22 review patterns)

## Scope

<Numbered list of concrete actionable items. Each item should be reviewable in one commit.>

1. …
2. …

## Acceptance criteria

- [ ] <Test suite green>
- [ ] <Specific behavior observable / manually verified>
- [ ] <Docs updated if applicable>
- [ ] Pre-PR self-review walks the relevant review-patterns checklist.

## Out of scope

<Explicit list of things the agent must NOT do in this order. Prevents scope creep.>

- …

## Blockers

<Anything currently blocking this order. If the predecessor PR is not merged, state that explicitly.>

- …

## Handoff notes

<Free-form pointers to relevant devlogs, session summaries, or prior art. Keep it short — the agent should not need these to start, they are breadcrumbs.>

- …
```

### Step 4: Show the draft and get explicit approval

- Render the full draft inline in the chat.
- Ask: "Write to `~/.codex/codex-base/order/<issue-id>-<short-slug>.md`? (y/n)"
- Do NOT write the file until the user approves.

### Step 5: Write the file(s)

- On approval, write to `~/.codex/codex-base/order/<issue-id>-<short-slug>.md`.
- If `--mirror-to-agent` was passed, also write the same body to `<target-repo>/.agent/handoff-<issue-id>.md` (creating `.agent/` if it does not exist). The header should be prefixed with a one-line note: `> Canonical copy mirrored from ~/.codex/codex-base/order/<issue-id>-<short-slug>.md`.

### Step 6: Update the order/README.md index

- Read `~/.codex/codex-base/order/README.md`.
- Append a row to the "현재 열린 주문" / "Current open orders" table with the new order's file, target repo, branch, and Linear link.
- Preserve the existing rows and table formatting.

### Step 7: Report + next actions

Show the user:

1. Full path to the written order file.
2. Mirror path (if `--mirror-to-agent` was passed).
3. `git -C ~/.codex/codex-base status` output so the user sees what needs committing.
4. Reminder: `git -C ~/.codex/codex-base add order/ && git commit -m "order: <issue-id> <short slug>" && git push` is the follow-up, but do NOT run it automatically — leave push to the user.
5. Pointer: next session with Codex CLI, the AGENTS.md primary-queue rule will pick up this file automatically.

## Guardrails

- **Never overwrite an existing order file.** If the target path exists, show its contents and ask the user to pick a different slug or edit manually.
- **Never commit or push** the codex-base repo — the user handles the git side.
- **Never touch `~/.codex/codex-base/rules/`** — that is a separate concern (rule files, not order files).
- **Never create Linear issues** from this skill — use the dedicated linear-create-issue skills.
- **Keep order files under ~150 lines.** Longer briefs usually mean the issue should be split. Flag the user if the draft grows past that.
- **If the Linear MCP fetch fails,** do not stall — write the order with a TODO placeholder on the Linear line and tell the user to fill it in.

## Related

- `~/.codex/codex-base/AGENTS.md` — "Primary Queue" rule that makes Codex read this directory first.
- `~/.codex/codex-base/order/README.md` — order/ directory conventions and open-orders table.
- `claude/rules/shotloom-git.md` — `.agent/` folder convention for repo-scoped operational memory.
- `claude/skills/shotloom-linear-create-issue/` — sibling skill for creating the Linear issue itself before the order is scaffolded.
- `claude/skills/cci-codex-review-rust/` — sibling skill that reads the same Codex CLI setup.
