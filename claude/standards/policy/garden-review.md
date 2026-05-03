---
status: proposed
---

# Garden Review Checklist

Periodic structural audit of the repository against `llm-first-policy.md`. Run every minor version (v3.x → v3.x+1) or whenever the validator stays clean for 30 days but the layer model has drifted in ways the validator cannot see.

**Output:** a follow-up plan in `docs/plans/garden-<date>.md` if any P0/P1 finding is filed. No finding → record the date in this file's "Last clean run" line and skip.

---

## When to run

| Trigger | Action |
|---------|--------|
| Validator clean for ≥30 days | Run a garden review |
| About to tag a minor version | Run a garden review first |
| New layer added (rule, standard, skill category, validator check) | Run section 2 only — verify layer registration |
| User requests a "structural review" or "is anything drifting?" | Run all sections |

Do NOT run on every commit. The validator handles that. Garden review catches drift the validator cannot.

---

## Checklist

### 1. Layer integrity (`llm-first-policy.md` §"Layered enforcement")

- [ ] Every `claude/rules/*.md` (except `index.md`) has `load:` frontmatter and is registered in `rules/index.md` under the correct section (auto vs triggered).
- [ ] Every `claude/standards/**/*.md` (except `index.md`) has `status:` frontmatter and is registered in `standards/index.md`.
- [ ] Every triggered rule's `trigger:` line is still accurate — sample 5 random triggered rules and verify the trigger condition still describes when the rule applies.
- [ ] No artifact bypasses its layer: a skill does not encode a constraint that should be a rule; a rule does not encode reference material that should be a standard. Spot-check 5 recent files.

### 2. Layer registration (run when adding a layer)

- [ ] `rules/index.md` lists the new rule with correct Load + Trigger columns.
- [ ] `standards/index.md` lists the new standard under the correct topical group with a "When to read" entry.
- [ ] `LOOKUP.md` has at least one row that points to the new artifact if it serves a top-10 LLM goal.
- [ ] `README.md` count `(N)` for the affected directory is updated.
- [ ] Validator's `inventory-counts` check still passes.

### 3. Index health

- [ ] `LOOKUP.md` rows still resolve — every link target exists. (Validator does not check LOOKUP link targets; do it by eye or a quick grep.)
- [ ] No row in `LOOKUP.md` points to a retired or moved file.
- [ ] No row in `standards/index.md` is missing its subdirectory prefix (one of: `policy/`, `authoring/`, `multi-agent/`, `research/`, `review/`, `language/`, `unreal/`, `cinev/`, `obsidian/`, `system/`).

### 4. Naming consistency

- [ ] Every rule file's name reads as a verb or trigger phrase (`session-start`, `verify-before-report`, `reread-repo-conventions`). If a name is a bare noun (`runtime`, `verification`), file a rename in the next garden plan.
- [ ] No standard or skill name embeds a metaphor where a literal works (e.g. `MAP.md` vs `LOOKUP.md`).
- [ ] No file uses the verb-less `description.md` / `notes.md` shape.

### 5. Anti-rot mechanics

- [ ] `scripts/validate-llm-first.mjs` runs in <5s on the current tree.
- [ ] Every check the validator owns has at least one passing assertion (no dead checks left as no-ops).
- [ ] If a manual review caught a defect class the validator missed, file a new validator check or extend an existing one.

### 6. Drift signals

- [ ] No `MEMORY.md` file exists anywhere. (`llm-first-policy.md` forbids.)
- [ ] No second top-level entry point appeared (`PHILOSOPHY.md`, `MANIFESTO.md`, `OVERVIEW.md`). `CLAUDE.md` is singular.
- [ ] No human-aesthetic prose snuck into `README.md` or `LOOKUP.md` (motivational opener, marketing tone, repeated mission statement).
- [ ] No new untracked `.bak` / `.tmp` / `.draft.md` files at repo root or under `claude/`.

---

## Filing a finding

For each failing checkbox:

1. Decide severity: **P0** (cold-start LLM is misled), **P1** (structural inconsistency, no immediate harm), **P2** (cosmetic).
2. Write a one-line entry in the new `docs/plans/garden-<YYYY-MM-DD>.md` file: `[P_] <one-line description> — fix: <one-line action>`.
3. Group entries by section (1–6) and severity.
4. If 0 findings: append `- <YYYY-MM-DD>: clean` to the "Last clean runs" list at the bottom of this file. Do NOT create the plan file.

---

## Last clean runs

(Append `- YYYY-MM-DD` here when garden review finds nothing.)

---

## Why this is `proposed`

This standard codifies a procedure that has run exactly once (the v3.0 → v3.1 migration). A second pass is needed before promoting to `accepted`. Until then, treat the checklist as a starting frame, not a final spec.
