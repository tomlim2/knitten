---
description: Draft a new Shotloom ADR following repo conventions, scan existing ADRs for conflicts
argument-hint: "<short-kebab-title>"
allowed-tools: Read, Write, Glob, Grep, Bash(ls:*), Bash(git:*)
---

# shotloom-draft-adr

Draft a new Architecture Decision Record under `docs/adr/` following the Shotloom ADR template. Also scans existing ADRs for supersedes/conflict relationships.

## Arguments

- `<short-kebab-title>` — e.g., `vrm-axis-correction-in-import`

**If no argument is provided, show usage and ask the user. NEVER auto-execute.**

Usage: `/shotloom-draft-adr vrm-axis-correction-in-import`

## Drafting principles

- **The in-repo template is canonical.** It lives at `docs/guidelines/adr-template.md` (fallback: `docs/adr/_template.md`). READ IT every run. Copy its section list **verbatim** — same headings, same order, no additions, no removals, no renames. If it has `## Status / ## Context / ## Decision / ## Consequences / ## Alternatives considered`, the new ADR has exactly those, in that order.
- **Do NOT add sections the template doesn't have.** No `Phase X`, no `Stack note`, no `Next steps`, no `Scope`, no `Out of scope`, no `Open questions`, no `Acceptance criteria`, no `References` unless the template has it. Ad-hoc subsections (e.g. `### 1. Baseline`, `### 2. Value semantics`) inside template sections are allowed only when they carry decision content; if it's inventory or grammar that drift-tests can catch, it belongs in source code, not in the ADR (G10 — ADR scope discipline).
- **Decision-only content.** Every line should be a decision, a rationale for a decision, or a rejected alternative. Strip restatements of prior ADRs, strip enumerations of externally-published facts (use a citation + link), strip half-specified schema/grammar that the ADR itself defers. Target: ≤ ~80 lines for most ADRs. If draft exceeds 150 lines, audit for inventory/grammar/restatement bloat before submitting.
- **Inventory and grammar live in code, not in ADRs.** A list of N enum values, a parser grammar, or a channel-name table belongs in a `pub const` + length assertion + test in the owning crate — not in a Markdown table that can drift from canonical code. Cite the external source (e.g. Apple docs, IETF RFC) in the ADR; let the code own the literal list.
- **Single-operator framing.** Write the ADR and any companion plan files (`.agent/*.md`, migration plans) as if the user (one operator) will execute them. Do NOT inject delegation lines or split steps across agents unless the user explicitly asks for that structure.
- **Blast radius / rollback / acceptance** notes — only if the in-repo template has a section for them. Otherwise drop.

## Workflow

### Step 1: Determine ADR number (provisional)

```bash
ls docs/adr/ | grep -oE 'adr-[0-9]+' | sort -u | tail -1
```

Next number = last + 1, zero-padded to 4 digits. Example: last is `adr-0025` → new is `adr-0026`.

**The ADR number is provisional until this PR merges.** A parallel PR may claim the same slot first and force a renumber. Real precedent: STL-193 PR #177 had to rename `ADR-0032 → ADR-0033` after PR #169 (`upload-staging-policy`) claimed 0032 while PR #177 was open.

**Therefore:** do NOT embed `ADR-NNNN` in the **branch name**, **PR title**, or **Linear issue title**. Use a descriptive title (e.g. `feat/normalizer-extraction-adr`, `propose normalizer extraction ADR`) and only cite `ADR-NNNN` inside body content (commit body, PR description, ADR file content, Linear description) where the cost of a renumber edit is one find/replace.

When the ADR PR merges to `main`, the number locks. From that moment on, downstream PRs / commits / docs may freely reference `ADR-NNNN`.

### Step 2: Scan existing ADRs for relevance

Grep for keywords from the title across `docs/adr/` — flag any ADR that is:
- **Superseded by this one** → candidate for "Supersedes: ADR-NNNN" line
- **Related** → candidate for "Related: ADR-NNNN"
- **Conflicting** → flag for user discussion before drafting

Report matches to user before writing.

### Step 3: Read template (MANDATORY)

Read `docs/guidelines/adr-template.md` (fallback: `docs/adr/_template.md`). Extract the section list and order from its `## Template` fenced block. **This is the structural contract for every new ADR — not a suggestion, not a starting point that can be extended.**

If the template lists `## Status / ## Context / ## Decision / ## Consequences / ## Alternatives considered`, the new ADR has exactly those H2s in exactly that order. Period.

If the template has changed since this skill was written, the template wins — adjust the draft to match the current template, do not fall back to the skeleton below.

### Step 4: Draft the ADR

File: `docs/adr/adr-<NNNN>-<kebab-title>.md`

Copy the section headings from `docs/guidelines/adr-template.md` verbatim. Do not add `**Status:**` / `**Date:**` / `**Author:**` / `**Supersedes:**` / `**Related:**` frontmatter blocks unless the template has them — most repos put status as `## Status` body, not a frontmatter line. Keep filling each section with decision-only content per "Drafting principles" above.

Self-check before saving:
1. Does every H2 appear in the template? (If a heading isn't in the template, delete the section.)
2. Does the H2 order match the template order? (If not, reorder.)
3. Is every paragraph either a decision, rationale, or rejected alternative? (If not, delete or move to source code.)
4. Total line count ≤ ~80? (If > 150, audit for bloat.)
5. Any literal lists of N items (channel names, enum values, grammar rules)? (If yes, move to a `pub const` + test in the owning crate; ADR cites the canonical reference and links to the const.)

### Step 5: Update ADR index

Open `docs/adr/README.md` and add the new ADR under the "Proposed" section (create section if missing). Preserve existing formatting.

### Step 6: Report

```
Drafted: docs/adr/adr-<NNNN>-<title>.md
Indexed under: Proposed
Related ADRs flagged: <list>

Next steps:
1. Fill in Context/Decision/Consequences sections.
2. Open PR with `chore/adr-<NNNN>-<title>` branch (or include in feature PR).
3. After review, edit Status to Accepted and move index section.
4. Run `node scripts/validate-doc-paths.mjs` before committing.
```

## Notes

- ADR status values: Proposed → Accepted → Superseded. Never skip Proposed.
- Filename format is enforced by `scripts/validate-doc-paths.mjs` — `adr-NNNN-kebab-title.md`.
- If the decision is small enough to fit in a commit message or PR description, it may not warrant an ADR. Ask the user if unsure.
- ADR additions require `docs/adr/README.md` update in the same PR.
