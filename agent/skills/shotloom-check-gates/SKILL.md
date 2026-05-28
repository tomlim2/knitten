---
description: Run Shotloom local gates in parallel — fast by default, full when requested
argument-hint: "[--fast|--full]"
allowed-tools: Bash(cargo:*), Bash(node:*), Bash(pnpm:*), Bash(git:*)
---

# shotloom-check-gates

Run Shotloom local validation helper gates in parallel. Use `--fast` during manual
iteration. Use `--full` before push, before PR, or when debugging a CI red.

This skill is a helper, not the source of Shotloom gate policy. The helper set
and guideline-leak rationale live in [reference.md](reference.md).

## Arguments

- `[--fast]` — skip `cargo test` and run fmt, clippy, check, doc-paths, and available markdown gates. Default.
- `[--full]` — run `--fast` plus `cargo test --workspace --exclude shotloom-desktop`.

Usage: `/shotloom-check-gates` or `/shotloom-check-gates --full`

## Workflow

### Step 1: Confirm repo

`git rev-parse --show-toplevel` — must be the shotloom repo (or a worktree of it). Stop on mismatch.

### Step 2: Run gates in parallel

Launch all gates in a single message with multiple Bash tool calls. Use `run_in_background: true` for the slow ones only if using `--full`.

Default manual gate set (`--fast`):
```bash
cargo fmt --check
cargo clippy --workspace --exclude shotloom-desktop -- -D warnings
cargo check --workspace --exclude shotloom-desktop
node scripts/validate-doc-paths.mjs
```

Plus if repo has them (check `package.json` scripts):
```bash
pnpm lint:md 2>/dev/null || true
pnpm check:md 2>/dev/null || true
pnpm validate:mermaid 2>/dev/null || true
```

Full gate set (`--full`) adds:
```bash
cargo test --workspace --exclude shotloom-desktop
```

### Step 3: Summarize

Report a compact pass/fail table:

```
| Gate | Status | Notes |
|------|--------|-------|
| cargo fmt --check | ✅ |  |
| cargo clippy | ❌ | 2 warnings in vrm_extract.rs |
| cargo check | ✅ |  |
| doc-paths | ✅ | 38 paths verified |
| cargo test | ✅ | 47 passed |
```

For any failure: include the first 20 lines of error output inline, followed by "run `<command>` for full output".

### Step 4: Exit behavior

- All green: one-line "All gates passed." and stop.
- Any red: list the failing command and the exact copy-pasteable command to re-run it. Do NOT auto-fix (that's `shotloom-respond-pr` / `shotloom-auto-pr`).

## Notes

- Build gate MUST use `--exclude shotloom-desktop`; helper rationale lives in [reference.md](reference.md).
- `cargo clippy -- -D warnings` is what CI runs — any warning is a block.
- `/shotloom-commit` does not call this skill by default. It delivers the
  checklist and drafts the commit.
- Helper-set rationale lives in [reference.md](reference.md).
- If on a worktree and binaries live in shared `target/`, first run may trigger rebuild. Subsequent runs are incremental.
