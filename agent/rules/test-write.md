---
load: triggered
trigger: writing or reviewing code that includes tests
---

- **Unit tests are mandatory** — Every new module, function, or public API change MUST ship with unit tests in the same commit/PR. "Code only, tests later" is NOT allowed.
- **Define "unit test":** co-located Rust `#[cfg(test)] mod tests`, Python `pytest`, JS/TS `vitest`/`jest`, or the equivalent idiomatic per-language harness. Integration tests count only when there is no meaningful unit seam.
- **Minimum coverage surface:**
  - New public function → at least one happy path + one edge case.
  - New struct/enum with behavior → constructor + at least one invariant check.
  - Bug fix → a regression test that fails on `main` and passes on the branch.
  - Pure data type (DTO, config struct) → serde round-trip test if it crosses a format boundary.
- **PR blocker:** `cargo test --workspace` (or project equivalent) MUST pass locally BEFORE opening a PR. If a crate has no tests at all, that is itself the violation — add tests first, then push.
- **Legitimate exceptions (require brief note in PR description):**
  - Pure scaffold commits with zero behavior (empty `lib.rs`, registered module with no functions).
  - Example/smoke binaries whose only job is to `main()` and render — covered by manual check, not unit tests.
  - Verbatim file ports when the upstream project already has equivalent tests AND those tests will land in a follow-up test-port commit within the same PR.
- **Do not delegate away the test:** "reviewer asked for tests" is a rule-miss, not a code review finding. If you are about to request PR approval and tests are missing, stop and write them first.
- **Never weaken assertions to make a test pass.** If a test fails, fix the code, not the test.
- Full authoring guidance (Read on demand): `~/.claude/skills/caol-make-command/references/SLASH-COMMANDS.md` (for test scaffolding patterns in commands/skills)
