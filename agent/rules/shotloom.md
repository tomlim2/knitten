---
load: triggered
trigger: working in the shotloom repo
---

# Shotloom — Harness-Side Meta

Operational rules with **no in-repo equivalent**. The full project ruleset (commit, PR, review, branch, error-handling conventions, ECS patterns, ADRs) lives in shotloom's own `docs/guidelines/`, `AGENTS.md`, `CONTRIBUTING.md`, and `docs/adr/`. Read those at session start. This file only carries what those don't cover.

Resolve the shotloom repo path with `bash ~/.claude/skills/ah-resolve-doc-path/resolve.sh repo shotloom` (returns `RESOLVED_PATH=<path>`).

## Identity
- **Active `gh` account = `tomlim2`.** Use `gh api user --jq .login` as the canonical
  check. `gh auth status` is advisory only: it can exit nonzero when an inactive
  secondary account has an invalid token. Continue when the active login is `tomlim2`;
  stop only when the active login is different or unreadable. `deemotl` is invalid
  and breaks `gh pr create` / `git push`.
- **Commit author = `tomlim2 <deemo@vonvon.me>`.** Verify with `git log -1 --format="%an <%ae>"`. If wrong: `git config user.name tomlim2 && git config user.email deemo@vonvon.me && git commit --amend --reset-author --no-edit`.

## Build gate quirk
- **`cargo check` / `cargo clippy` / `cargo test` MUST pass `--exclude shotloom-desktop`.** Why: the `shotloom-desktop` Tauri binary has a pre-existing icon.png issue unrelated to feature work; including it produces a false-red. Same exclusion as Shotloom CI.

## Approval-gate exceptions
Applies to **shotloom worktrees only** (`.worktrees/*`, `.claude/worktrees/*`). Other repos (CINEV, agent-hub, personal) follow the strict approval flow in `~/.claude/rules/git-defaults.md`.

**PR/issue actor ownership guard:** Before any Shotloom PR or issue response flow mutates code, posts a reply, refreshes a PR body, or re-requests reviewers, verify the target PR/issue is assigned to `tomlim2`. If `tomlim2` is not an assignee, stop. Do not commit, push, comment, reply, edit PR body, re-request review, or start auto-pr.

**Commit/push guideline source:** Use Shotloom repo `AGENTS.md`, `CONTRIBUTING.md`, and `docs/guidelines/` for the current commit and push gate policy. This harness rule does not own the gate list.

**Harness extra gates:** A skill can require additional evidence gates for its own workflow. Extra gates are additive only: they do not replace, weaken, or redefine Shotloom repo guidance. Each skill's `reference.md` records the real failure or guideline leak that justifies the extra gate. If a local helper is needed, use `/shotloom-check-gates --full` and treat its output as helper evidence.

| Operation | Approval needed? | Context |
|-----------|------------------|---------|
| `git commit` after following Shotloom repo commit guidance and any skill-local extra gates | **No** | Draft message, briefly show, then commit |
| `git push` after following Shotloom repo push guidance and any skill-local extra gates | **No** | Same as commit |
| `gh pr create` / `merge` / `close` / `reopen` / `ready` | **Yes** | Per-PR approval — never auto |
| `gh pr edit --base` / `--title` / `--draft` / `--label` | **Yes** | |
| `gh pr update-branch` | **Yes** | |
| Top-level PR comment | **Yes** | |
| `gh pr review --approve` / `--request-changes` | **Yes** | |
| Thread resolution | **Yes** | |
| Inline review reply (`POST /pulls/<N>/comments/<id>/replies`) | **No, only inside `/shotloom-auto-pr`** | Manual `/shotloom-respond-pr` still needs batch approval |
| Suppressed-item review summary (`event=COMMENT`) | **No, only inside `/shotloom-auto-pr`** | |
| Reviewer re-request | **No, only inside `/shotloom-auto-pr`** | |
| PR body refresh (`gh pr edit --body`) | **No, only inside `/shotloom-auto-pr`** | Body content only — title/base/draft still need approval |

`/shotloom-auto-pr` is invoked by the user typing `/shotloom-auto-pr <N>` directly, or by accepting the offer at the end of `/shotloom-make-pr`.

## Post-push before-PR readiness

- After a Shotloom worktree push, `/shotloom-review-before-pr` is the default readiness loop.
- The loop reports `prReady: true | false` for the latest committed branch diff.
- `prReady=false` means blocker findings remain. Route those findings to `/shotloom-implement-code`, then rerun `/shotloom-review-before-pr`.
- `prReady=true` means no blocker findings remain. Next command: `/shotloom-make-pr`.
- `/shotloom-make-pr` owns local CI-equivalent gates, PR body, PR creation approval, and GitHub mutation.

## Knitten Shotloom docs lane

When a Shotloom flow writes docs to Knitten, load
`agent/rules/shotloom-docs-lane.md` and use the daily Shotloom docs branch.

## `/claude-review` is a CI trigger, not a Claude Code skill

Posting the literal text `/claude-review` as a **top-level PR comment** fires the Claude review GitHub App on the CI side.

| Condition | Allowed to post `/claude-review`? |
|-----------|-----------------------------------|
| All CI checks green (`gh pr checks <N> --watch`) AND user gave per-PR approval | **Yes** |
| Any CI check red | **No** (wastes review cycle) |
| PR is in draft | **No** (unless promoted to ready) |
| Inside `/shotloom-auto-pr` cycle | **No** (auto-pr owns its review cadence) |

Author-side flow: `/shotloom-make-pr` Step 10c.

## Obsidian note structure

- **Single project folder: configured `shotloom` project root.** Never create sibling folders (`shotloom-rd/`, `shotloom-v2/`). If a folder like that exists, consolidate into `shotloom/`.
- **`days/` naming: `YYYY-MM-DD[-slug].md` only.** No prefixes — `devlog-`, `shotloom-`, `shotloom-daily-`, `shotloom-devlog-` are all forbidden. The folder name already provides context.
- **Learnings go in the shotloom project `learnings/` folder.** Cross-project learnings use the resolver-owned cross-learning destination.
- **No files at the vault root.** Every shotloom note lives inside the configured shotloom project root or its subfolders.
- **No loose files at the project root either.** Direct Markdown files in the configured shotloom project root are forbidden except for one index/hub file (e.g. `README.md`). All other notes belong in a named subfolder.

| Subfolder | Audience | Contents |
|-----------|----------|----------|
| `days/` | human | Devlogs (one file per work day) |
| `learnings/` | human | Vocabulary + project lessons |
| `topics/` | LLM + human | Analysis and reference notes |
| `asks/` | LLM | Handoffs and sub-agent briefs |
| `plans/` | LLM | Per-ticket plans |
| `specs/` | LLM + human | Forward design specs (NOT decisions) |
| `decisions/` | LLM | ADR-style decision records (durable) |
| `ops/missions/` | LLM | Cross-session mission records (durable) |
| `ops/runs/` | LLM | One-shot snapshots and tool outputs (ephemeral) |

Each subfolder has a `README.md` declaring its audience, style, and mutability. Per-folder README wins over this table when they disagree. Style policy: `~/.claude/skills/obsidian-obsidian-markdown/references/VAULT-AUDIENCE.md`; project role folders are defined by `~/.claude/skills/obsidian-obsidian-markdown/references/PROJECT-DOCS-STRUCTURE.md`.

## Worktree dir naming

- **No `stl-NN-` prefix in the worktree dir path.** Use `<worktree_base>/<scope>-<verb>-<subject>` — same kebab body as the branch (which also has no STL-NN per `CONTRIBUTING.md` Branch Naming Policy).
- Linear IDs do not appear in branch names, worktree dir paths, or PR titles. They appear only in PR description footers (`Resolves STL-NN` / `Part of STL-NN`) and in commit footers when relevant.
- Linear's auto-suggested `gitBranchName` (`deemo/stl-NN-slug`) is a UI hint only — never used as the actual branch or directory name.
- Example: branch `feat/retarget-canonicalize-thumb-chain` → worktree dir `.worktrees/retarget-canonicalize-thumb-chain/`.

## File naming convention

- **Filename = slug only — never repeat the folder, project, or type in the name.**
  - Bad: `learnings/learning-bootstrap.md`, `specs/shotloom-preflight-spec.md`
  - Good: `learnings/bootstrap.md`, `specs/preflight-spec.md`
- **`days/` is the only folder that uses dates.** Format: `YYYY-MM-DD[-slug].md`. No dates in filenames outside `days/`.
- **Draft status belongs in frontmatter, not the filename.** Use `status/draft` tag; never a `-draft` suffix.
- **Kebab-case, 2–5 word slug.** No camelCase, no underscores. Abbreviations allowed only if universal: `adr`, `vrm`, `pmx`.
- **Multi-agent mission files live in `ops/` with a shared mission prefix.** Example: VRM import mission → `ops/vrm-import.md`, `ops/vrm-import-briefing.md`, `ops/vrm-import-log.md`. Never scatter these at the project root.

## Linear AC ↔ primitive cross-check
**Rule:** Before applying a Linear AC that cites a repo primitive (template, standard, rule, ADR section, in-repo guideline), open the primitive's actual file and confirm the cited pattern is codified there.

**If the primitive does NOT codify the cited pattern:**
1. Reject the AC as wrong-shape.
2. Propose splitting into two PRs: a primitive-codification PR, then a follow-up apply-the-codified-pattern PR.
3. Do NOT apply an Option-A/B/C workaround (single-file standard invention) to smuggle the pattern in. That recreates the defect class the AC was trying to enforce against and round-1 review will P2-Block it.

**Why:** PR #208 (STL-247) — AC #2 cited "ADR template Usage Notes canonical amendment style" not actually in `adr-template.md`; Option-A workaround forced a P2 revert.
**Full enforcement:** `/shotloom-start-task` Step 5b.
