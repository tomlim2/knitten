# shotloom-make-pr reference

Expanded detail for the shotloom-make-pr skill. SKILL.md holds the gate sequence and approval rules; this file holds the PR body template and devlog template.

---

## PR body template (expanded — non-trivial changes)

```md
## Summary

- <1-3 bullets, main outcome, no filenames>

## Why

<2-4 sentences on the problem / motivation>

## Changes

<grouped by behavior or subsystem, NOT file-by-file>

## Impact

- User-facing impact: <or "none">
- API/schema impact: <or "none">
- Performance impact: <or "none">
- Operational or rollout impact: <or "none">

## Test plan

- [x] `cargo fmt --check`
- [x] `cargo clippy --workspace --exclude shotloom-desktop -- -D warnings`
- [x] `cargo check --workspace --exclude shotloom-desktop`
- [x] `cargo test --workspace --exclude shotloom-desktop`
- [x] `node scripts/validate-doc-paths.mjs`
- [ ] <feature-specific manual verification, if any>

## Scope boundary

<what is explicitly NOT in this PR and where it lands>

<!--
INCLUSION CRITERIA — a deferred item belongs here only if ALL three:

1. Diff-adjacent — a reviewer reading this PR's diff would naturally
   ask "why didn't you also do X?".
2. Explicitly committed — an ADR / Linear issue / pinned roadmap item
   names X with a concrete plan, trigger, or successor PR.
3. Concrete — X has a name a reviewer can grep for or open, not a
   hypothetical future type.

DROP if the source ADR / doc uses punt language: "separate decision",
"if consolidation is justified later", "may revisit", "future ADR
will decide". Those mean the item is explicitly NOT committed, not
deferred. Listing such items in Scope boundary makes the reviewer
ask "what's X?" instead of "why isn't X here?" — net negative.

Real defect (PR #179): "NormalizedAnimation shared type — separate
ADR" was listed in Scope boundary. ADR-0030 §Out of scope explicitly
punted it ("whether those outputs later consolidate into a shared
type is a separate decision"). User asked "이거 머임?" then "안 하기로
함?" — exactly the reviewer-confusion the criteria above prevent.
Removed via `gh pr edit --body` after PR open.
-->


## Related Issues

<Resolves | Related to> STL-NN
Supersedes #<prior-PR-number>    <!-- only if argument given -->
```

## PR body template (minimal — trivial changes, <50 LOC, no new behavior)

From `.github/pull_request_template.md`:

```md
## Summary
-
## Validation
-
## Related Issues
Related to STL-NN
```

---

## Devlog frontmatter

```yaml
---
title: "Shotloom devlog — <YYYY-MM-DD>"
tags:
  - devlog
  - shotloom
  - <task-specific tags, e.g. gltf, vrm, retarget, bridge, testing>
date: <YYYY-MM-DD>
source: claude
---

# Shotloom devlog — <YYYY-MM-DD>
```

## Devlog PR-section template

```md
---

## <STL-NN> — <PR title>

<Big-picture lead, 2–4 sentences: which Shotloom subsystem, what larger goal this
 serves inside the web-first / Bevy-WASM / crate-boundary architecture, what this
 unblocks or protects downstream. Mention PR link and issue ID at the END of this
 paragraph, not the start. The reader should be able to skip the rest and still
 know why this matters.>

### Big picture

<Optional — only if the lead can't fit everything. Call out affected crate(s),
 relevant ADRs, upstream/downstream callers, and how this slots into the roadmap.
 Skip this H3 if the lead already covers it.>

### Why

<2–4 sentences. Immediate problem / motivation / who flagged it / what breaks if
 not done. Contrast with Big picture: Why is narrow (this PR's trigger); Big
 picture is wide (where this sits in Shotloom).>

### How

<Approach, files touched, reused helpers, anything non-obvious about the path
 taken. Mention contract/ADR/doc co-location if applicable.>

### What

<Concrete output: new tests / new functions / new diagnostics / lines of code.
 Include test counts, LOC, local-gate results.>
```

If the session produced repo-convention surprises or gotchas worth remembering (branch-name rename, CI quirk, unexpected ADR interaction), add:

```md
### 사이드 노트

- <gotcha 1>
- <gotcha 2>
```

---

## Big-picture framing guidance

Per `rules/shotloom.md` answering style:

- Lead with the big picture for any shotloom question / artifact.
- Which subsystem (VRM pipeline, timeline, rendering, bridge, etc.), what larger goal, why it matters now.
- Factual bits (branch name, PR number, CI status, file list) go at the end, not the top.
- The user can read titles themselves; the value-add is framing inside Shotloom's web-first / Bevy-WASM / crate-boundary architecture.
