# Shotloom — Claude-side meta

Operational rules with **no in-repo equivalent**. The full project ruleset (commit / PR / review / branch / error-handling conventions, ECS patterns, ADRs, etc.) lives in shotloom's own `docs/guidelines/`, `AGENTS.md`, `CONTRIBUTING.md`, and `docs/adr/` — read those at session start. This file only carries what those don't cover.

Resolve the shotloom repo path with `bash ~/.claude/skills/caol-resolve-doc-path/resolve.sh repo shotloom` (returns `RESOLVED_PATH=…`).

## Identity

- **Active `gh` account = `tomlim2`.** Confirm with `gh auth status`. The `deemotl` token is invalid; using it breaks `gh pr create` / `git push` with "Invalid username or token".
- **Commit author = `tomlim2 <deemo@vonvon.me>`.** Verify with `git log -1 --format="%an <%ae>"`. If wrong: `git config user.name tomlim2 && git config user.email deemo@vonvon.me && git commit --amend --reset-author --no-edit`.

## Build gate quirk

- **`cargo check` / `cargo clippy` / `cargo test` MUST pass `--exclude shotloom-desktop`.** The `shotloom-desktop` Tauri binary has a pre-existing icon.png issue unrelated to feature work; including it produces a false-red. Same exclusion as Shotloom CI.

## Approval-gate exceptions

- **Auto-commit + auto-push inside shotloom worktrees** (including `.worktrees/*` and `.claude/worktrees/*`). Once gates pass — `cargo fmt --check`, `cargo clippy`, `cargo check`, `cargo test`, `node scripts/validate-doc-paths.mjs`, `node scripts/validate-ci-rust-coverage.mjs` — Claude drafts the commit message, briefly shows it, then commits and pushes without waiting for per-step "OK". Gates are NEVER skipped. PR operations (`gh pr create / merge / close / edit`, posting any PR or review comment) still require explicit per-PR approval per `~/.claude/rules/git.md`. Other repos (CINEV, caol-ila, personal) remain under the strict approval flow.
- **`/shotloom-auto-pr` blanket exemption.** When the user invokes `/shotloom-auto-pr <N>` directly OR accepts the offer at the end of `/shotloom-make-pr`, the skill's react cycle is exempt from per-PR-comment approval for: inline review replies (`POST /pulls/<N>/comments/<id>/replies`), suppressed-item review-level summary (`POST /pulls/<N>/reviews` with `event=COMMENT`), reviewer re-request, PR body refresh (`gh pr edit <N> --body …`) — on top of the auto-commit/push above. **NOT covered** even inside auto-pr: `gh pr create / merge / close / reopen / ready`, `gh pr edit --base / --title / --draft / --label`, `gh pr update-branch`, top-level PR comments, `gh pr review --approve / --request-changes`, thread resolution. Manual `/shotloom-respond-pr` is unaffected and keeps the per-comment batch approval gate.

## `/claude-review` is a CI trigger, not a Claude Code skill

- Posting the literal text `/claude-review` as a **top-level PR comment** fires the Claude review GitHub App on the CI side. Post **only after** every CI check is green (`gh pr checks <N> --watch`) AND with explicit per-PR user approval. Never on a red PR (wasted review cycle). Never on a draft unless promoted to ready. Never inside `/shotloom-auto-pr` (auto-pr owns its review cadence). Author-side flow lives in `/shotloom-make-pr` Step 10c.

## Obsidian note structure

- **Single project folder: `claude/projects/shotloom/`.** Never create sibling folders (`shotloom-rd/`, `shotloom-v2/`, etc.). If a folder like that exists, it's a migration artifact — consolidate into `shotloom/`.
- **days/ naming: `YYYY-MM-DD[-slug].md` only.** No prefixes (`devlog-`, `shotloom-`, `shotloom-daily-`, `shotloom-devlog-`). The folder name already provides context.
- **Learnings go in `shotloom/learnings/`, never in `claude/learnings/`.** `claude/learnings/` is for cross-project learnings only.
- **No files at `claude/` root.** Every shotloom note lives inside `claude/projects/shotloom/` or its subfolders. Never drop files at `claude/shotloom-*.md`.
- **Subfolders:** `days/` devlogs · `learnings/` lessons · `topics/` concept analysis · `asks/` handoffs · `plans/` per-ticket plans · `specs/` specs & ADRs · `ops/` operational records.

## File naming convention

- **Filename = slug only — never repeat the folder, project, or type in the name.**
  - Bad: `learnings/learning-bootstrap.md`, `specs/shotloom-preflight-spec.md`
  - Good: `learnings/bootstrap.md`, `specs/preflight-spec.md`
- **`days/` is the only folder that uses dates.** Format: `YYYY-MM-DD[-slug].md`. No dates in filenames outside `days/`.
- **Draft status belongs in frontmatter, not the filename.** Use `status/draft` tag; never a `-draft` suffix.
- **Kebab-case, 2–5 word slug.** No camelCase, no underscores; abbreviations only if universal (adr, vrm, pmx).
- **Multi-agent mission files live in `ops/` with a shared mission prefix.** Example: a VRM import mission → `ops/vrm-import.md`, `ops/vrm-import-briefing.md`, `ops/vrm-import-log.md`. Never scatter these at the project root.

## Linear AC ↔ primitive cross-check

- **Verify the primitive an AC cites before applying the AC.** When a Linear acceptance criterion cites a repo primitive (template, standard, rule, ADR section, in-repo guideline), open the primitive's actual file and confirm the cited pattern is codified there. ACs that cite uncodified patterns are **wrong-shape** — reject the AC and propose splitting into a primitive-codification PR + a follow-up apply-the-codified-pattern PR. Do NOT apply Option-A/B/C workarounds (single-file standard invention) to smuggle the pattern in; that recreates the defect class the AC was trying to enforce against and round 1 review will P2-Block it. Trigger: PR #208 (STL-247) — AC #2 cited "ADR template Usage Notes canonical amendment style" not actually in `adr-template.md`; Option-A workaround forced a P2 revert. Full enforcement in `/shotloom-start-code` Step 5b.
