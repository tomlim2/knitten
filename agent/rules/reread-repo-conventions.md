---
load: triggered
trigger: start of non-trivial work in any repo
---

- **Read repo conventions IN FULL at every session start before non-trivial work.** Do not rely on memory; conventions drift between sessions.
- **Read priority order:**
  1. `CONTRIBUTING.md` at repo root — co-location checklists, MAP.md update rules, required follow-up artifacts.
  2. `AGENTS.md` at repo root — agent-facing workflow, ownership model, breadcrumb doc requirements.
  3. `docs/guidelines/*.md` — `pr-guideline.md`, `commit-guideline.md`, `code-review-guideline.md`, `review-rust.md`, `review-typescript.md`. These are the review criteria your PR will be judged against.
  4. `docs/adr/*.md` — architecture decisions binding scope, crate layering, dependency policy.
  5. Repo-specific Claude meta — `~/.claude/rules/<repo>.md`. **Overrides** generic rules in this folder when they conflict. Holds Claude-side operational meta only (gh account, build flags, approval-gate exceptions); project rules live in slots 1–4.
- **Re-read every session.** Guidelines update; ADRs land. Stale memory causes CHANGES_REQUESTED.
- **Before opening a PR, audit the branch against the guideline.** Verify: commit format, PR body shape, required sections, co-location artifacts (MAP.md, breadcrumb READMEs, ADR index updates), new-dep justifications, test coverage, `#[allow(...)]` comments, `unwrap()`/`expect()` in non-test paths. Treat every P0/P1 item in `code-review-guideline.md` as a pre-PR gate.
- **Re-read conventions before reviewing code.** Applies to: self-review before push, responding to reviewer feedback, reviewing a sub-agent's output, reviewing someone else's PR. Before forming any review comments, re-read `code-review-guideline.md`, `pr-guideline.md`, and the language-specific review file in `docs/guidelines/` matching the changed code's primary language. The guideline is canonical for what counts as a defect.
- **Repo-specific rule files take precedence.** When `~/.claude/rules/shotloom.md` and `git.md` conflict, the repo-specific file wins for that repo.
- **When you discover a new convention, update the relevant Claude rule file.** Add it to `~/.claude/rules/<repo>.md` so the next session does not miss it.
- **When repo conventions disagree, follow the active repo's rule, not the one you used in another repo.**
