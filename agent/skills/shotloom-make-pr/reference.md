# shotloom-make-pr reference

Expanded detail for the shotloom-make-pr skill. SKILL.md holds the gate sequence and approval rules; this file holds the devlog template.

---

## PR body

**Authoritative template lives in the shotloom repo, not here.** Use AS-IS:

- **Expanded template** — `docs/guidelines/pr-guideline.md` § 3. Sections: Summary, Why, Changes, Impact, Testing, Breaking Changes, Related Issues.
- **Minimal template** — `.github/pull_request_template.md`. Sections: Summary, Validation, Related Issues.
- **Issue linkage verb** — `docs/guidelines/pr-guideline.md` § 4 (Resolves / Part of / No issue, decision rule + umbrella exclusion).

**Do NOT add sections not in those templates** (no "Scope boundary", no "Next steps", no "Stack note", no invented headings). If a fact doesn't fit Summary / Why / Changes / Impact / Testing / Breaking Changes / Related Issues, either drop it or fit it into the existing section that best matches.

**Do NOT add `Resolves` / `Part of` for umbrella / parent issues** — Linear's parent-child relation already shows the tree. The linkage line is for the issue this PR directly closes or directly contributes to. Rule and decision tree are in pr-guideline.md § 4.

**Transport rule:** write the final markdown body to a temporary file and pass it
with `gh pr create --body-file` or `gh pr edit --body-file`. Do not use
`--body "..."` for markdown bodies because inline code spans and command
examples can be interpreted by the shell before `gh` receives them. Read the PR
body back after creation or edit and verify code spans, validation commands, and
issue links survived.

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
source: agent
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

## Big-picture framing guidance (for the post-create report, NOT the PR body)

Per `~/.claude/rules/shotloom.md` answering style — applies to Step 10 + Step 11 verbal report only:

- Lead with the big picture for any shotloom question / artifact.
- Which subsystem (VRM pipeline, timeline, rendering, bridge, etc.), what larger goal, why it matters now.
- Factual bits (branch name, PR number, CI status, file list) go at the end, not the top.
- The user can read titles themselves; the value-add is framing inside Shotloom's web-first / Bevy-WASM / crate-boundary architecture.

The PR body itself stays under the in-repo template — framing is for verbal Korean report only.
