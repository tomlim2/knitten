---
description: "Final publish review cycle. Runs code quality, UX/UI, UX writing, and deploy readiness checks in parallel. Auto-fixes critical issues. Use when preparing to publish a web project."
allowed-tools: Read, Write, Edit, Glob, Grep, Task, Bash(npx:*)
argument-hint: "[directory or file]"
---

# dev-review-publish

Pre-publish review orchestrator that runs code quality, UX/UI, UX writing, and deploy readiness checks, auto-fixes critical issues, and produces a unified report.

**Before executing, read and execute:**
`~/.claude/standards/command-pre-execution.md`

Replace `$COMMAND_NAME` with: `dev-review-publish`

---

## Arguments

- `[directory]` — Target directory to review. Defaults to current working directory.

---

## Workflow

### Pass 1: Review (fan-out, 3 parallel subagents)

Launch 3 Task subagents in parallel. Each reads the relevant standard and audits all files in the target directory.

**A. Code Quality** — `subagent_type: Explore`
> Read `~/.claude/standards/review-code-javascript.md` and `~/.claude/standards/review-code-css.md`.
> Audit all JS/CSS files in the target directory.
> Return findings as a list: `{severity} | {id} | {file}:{line} | {description}`.
> severity is one of: critical, error, suggestion.

**B. UX/UI Audit** — `subagent_type: Explore`
> Read `~/.claude/standards/review-ux.md`.
> Audit all HTML/JS/CSS files in the target directory.
> Return findings as a list: `{severity} | {id} | {file}:{line} | {description}`.
> severity is one of: critical, error, suggestion.

**C. UX Writing** — `subagent_type: Explore`
> Read `~/.claude/standards/review-ux-writing.md`.
> Audit all HTML/JS files in the target directory for UX writing issues.
> Return findings as a list: `{severity} | {id} | {file}:{line} | {description}`.
> severity is one of: critical, error, suggestion.

Collect all findings from A, B, C into a unified list.

### Pass 2: Publish Check

Run the `dev-check-publish` checklist (8 categories: PATH, DEPS, SECRET, META, LEGAL, SIZE, COMPAT, CONSOLE) against the target directory.

Read `~/.claude/skills/dev-check-publish/SKILL.md` for the full checklist.

Produce results in: `{check} | {status} | {issues}` format.

### Pass 3: Auto-Fix (criticals only)

From the unified findings list (Pass 1 + Pass 2), select all **critical** severity items and **FAIL** status items.

For each critical/FAIL issue:
1. If the issue is auto-fixable (code can be directly edited): apply the fix using Edit tool.
2. If the issue cannot be auto-fixed (requires design decision, missing information, or external action): skip and record the reason.

Track what was fixed and what was skipped.

### Pass 4: Report

Output the final report in the format below.

---

## Output Format

```markdown
## Publish Review: {project}

**Target:** {path}
**Files scanned:** {count}
**Date:** {date}

### Auto-Fixed ({n} items)

| # | ID | File:Line | Issue | Fix Applied |
|---|-----|-----------|-------|-------------|
| 1 | ERR-03 | src/app.js:42 | Raw error code shown to user | Replaced with user-friendly message |
| 2 | PATH-01 | index.html:8 | Absolute /assets/ path | Changed to relative ./assets/ |

### Remaining Issues ({n} items)

| # | Severity | ID | File:Line | Issue | Action Needed |
|---|----------|----|-----------|-------|---------------|
| 1 | critical | BTN-02 | src/dialog.js:15 | Generic "OK" button in delete dialog | Replace with specific action label |
| 2 | error | TONE-04 | src/ui.js:8,22,45 | Inconsistent "remove"/"delete" terminology | Pick one term and apply consistently |
| 3 | suggestion | STATE-04 | src/search.js:30 | No guidance on zero-result search | Add "try broader terms" message |

### Publish Readiness

| # | Check | Status | Issues |
|---|-------|--------|--------|
| 1 | PATH | PASS | — |
| 2 | DEPS | PASS | — |
| 3 | SECRET | PASS | — |
| 4 | META | WARN | Missing og:image |
| 5 | LEGAL | PASS | — |
| 6 | SIZE | PASS | 12MB total |
| 7 | COMPAT | WARN | WebGPU, no fallback notice |
| 8 | CONSOLE | PASS | — |

### Verdict: READY / BLOCKED / NEEDS ATTENTION

{Summary}
- **BLOCKED** — Any unfixed critical or FAIL item remains.
- **NEEDS ATTENTION** — Only error/WARN items remain. Safe to publish but should address soon.
- **READY** — No critical/FAIL, no errors. Only suggestions remain (if any).
```

---

## Notes

- Pass 1 subagents are read-only (Explore). They do NOT modify files.
- Pass 3 auto-fix runs in the main agent context to have Edit access.
- Auto-fix only touches critical/FAIL issues. Error and suggestion items are reported but not auto-fixed.
- If a fix would change behavior or requires a design decision, it is skipped with a reason.

---

## Related

- `standards/review-code-javascript.md` — JS code quality checklist
- `standards/review-code-css.md` — CSS code quality checklist
- `standards/review-ux.md` — UX/UI audit checklist
- `standards/review-ux-writing.md` — UX writing checklist
- `skills/dev-check-publish/SKILL.md` — Deploy readiness checklist
- `standards/review-template.md` — Review output format
