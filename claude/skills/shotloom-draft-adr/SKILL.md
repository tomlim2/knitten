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

Grep for keywords from the title across `docs/adr/` — flag any ADR that might be:
- **Superseded by this one** → candidate for "Supersedes: ADR-NNNN" line
- **Related** → candidate for "Related: ADR-NNNN"
- **Conflicting** → flag for user discussion before drafting

Report matches to user before writing.

### Step 3: Read template

If `docs/adr/_template.md` exists, use it as base. Otherwise, use the skeleton below.

### Step 4: Draft the ADR

File: `docs/adr/adr-<NNNN>-<kebab-title>.md`

```markdown
# ADR-<NNNN>: <Human-readable title>

**Status:** Proposed
**Date:** <YYYY-MM-DD>
**Author:** <git user.name>
**Supersedes:** <ADR-NNNN or "none">
**Related:** <ADR-NNNN, ...>

## Context

<What problem forced this decision? What constraints are in play? What was tried or considered and ruled out? Cite specs/tech-debt/PRs.>

## Decision

<The decision — one concise paragraph. State it as a fact, not a suggestion.>

## Consequences

**Positive**
- <...>

**Negative / Costs**
- <...>

**Neutral**
- <...>

## Alternatives considered

### Alternative A — <name>
<Why rejected>

### Alternative B — <name>
<Why rejected>

## References

- Linked Linear: STL-NN
- Linked PRs: #NN
- Related ADRs: <...>
- Related specs: <path>
```

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
- Per `rules/shotloom-git.md`, ADR additions require `docs/adr/README.md` update in the same PR.
