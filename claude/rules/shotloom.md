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
