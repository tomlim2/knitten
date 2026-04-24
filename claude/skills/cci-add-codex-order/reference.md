# cci-add-codex-order reference

Detail for the cci-add-codex-order skill. SKILL.md holds the happy path and critical validation rules; this file holds the filename examples, the full template, and the long-form validation rationale.

---

## Filename examples — good and bad

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

### Exception grandfathered

`stl-89-next-steps.md` already exists from the prior Codex session and is allowed to stay. The forbidden list applies to NEW files only.

### Full-path length cap rationale

Absolute path `~/.codex/codex-base/order/<issue-id>-<short-slug>.md` must be ≤ **128 characters** end-to-end (safety margin for shell tab completion + ripgrep output). With the fixed prefix `~/.codex/codex-base/order/` (26 chars) and `.md` (3 chars), the `<issue-id>-<short-slug>` portion must be ≤ 99 chars. Since issue-id is at most ~10 chars, this bounds the slug to ~88 chars — but the slug length rule (≤48 chars) kicks in first.

### Why strict validation (no silent auto-correct)

Accepting `STL-89` silently by lowercasing trains the user to skip the rule. Reject with "issue-id must be lowercase, got `STL-89`" so they see the rule. Same for underscore-in-slug, verb-absent slug, and vague-word slug — these are teachable moments, not friction.

---

## Order-file template

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
