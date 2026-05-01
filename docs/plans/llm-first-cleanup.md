---
status: active
load: triggered
trigger: continuing the LLM-first documentation cleanup
charter-anchor: claude/CLAUDE.md → "Repository charter"
standard: claude/standards/llm-first-docs.md
created: 2026-05-01
---

# LLM-first cleanup — execution plan

Multi-session execution plan for migrating `caol-ila` to its declared LLM-first charter (see `v3.0.0` tag). This file is the agent-to-agent handoff — read it at session start when continuing this work.

---

## Context (read first)

- **Charter:** `caol-ila` is an LLM-first repository. Every artifact optimizes for LLM efficiency, accuracy, clarity. Human-readable output only on explicit user request. See `claude/CLAUDE.md` → "Repository charter".
- **Operational standard:** `claude/standards/llm-first-docs.md` — 7 rules (actionability, explicit enumeration, decision-tree, self-contained, paired examples, no duplication, no rhetoric) + length budgets + self-audit checklist.
- **Audience:** This file is read by the next LLM session continuing the work. Treat as agent-to-agent handoff per llm-first-docs.md.
- **Tag baseline:** `v3.0.0` (charter declared, CLAUDE.md refactored, rules/ + top-3 standards audited).

---

## What is already done

| Commit | Subject |
|--------|---------|
| `12ef8c5` | Add `standards/llm-first-docs.md`, refactor `CLAUDE.md` (163 → 71 lines) |
| `ac7765e` | Add hard rule to always apply llm-first-docs |
| `aaf4a2b` | Tighten exception scope (vault notes + chat only) |
| `2d31166` | Explicit-ask switch replaces blanket README exemption |
| `4b2ad95` | CLAUDE.md self-audit refactor (tables, drop rhetoric) |
| `1a3a13c` | All 15 `rules/*.md` audited (zero banned terms) |
| `6944405` | Top-3 standards (`obsidian-format`, `obsidian-tag-taxonomy`, `slash-commands`) audited |
| `7a5a3b1` | Repository charter declared in CLAUDE.md and README |
| `f10d77f` | README inventory refreshed (counts + groupings) |
| `v3.0.0`  | Tag marking the charter milestone |

---

## What remains — prioritized backlog

### P0 — Highest leverage

#### P0.1 — Add `load:` frontmatter to all `rules/*.md`

**Why:** Currently 5 of 15 rules are auto-loaded via `CLAUDE.md @import`; the other 10 are on-demand. The folder name `rules/` does not signal which is which. LLM has to back-trace from `CLAUDE.md` to know.

**Action:** Prepend YAML frontmatter to each rule file.

| File | `load` | `trigger` |
|------|--------|-----------|
| `git.md`, `runtime.md`, `coding.md`, `verification.md`, `security.md`, `index.md` | `auto` | (CLAUDE.md @import) |
| `conventions.md` | `triggered` | start of non-trivial work in any repo |
| `testing.md` | `triggered` | writing or reviewing code with tests |
| `naming.md` | `triggered` | creating a command or skill |
| `command-frontmatter.md` | `triggered` | creating a command |
| `tool-permissions.md` | `triggered` | creating a command or skill |
| `obsidian.md` | `triggered` | working in the Obsidian vault |
| `cinev-git.md` | `triggered` | git op in a CINEV repo |
| `multi-agent.md` | `triggered` | assigned as 지통실 #1 (1호기) |
| `shotloom.md` | `triggered` | working in the shotloom repo |

Frontmatter shape:
```yaml
---
load: auto         # or: triggered
trigger: <one-line condition>   # required iff load=triggered
---
```

After prepending, update `rules/index.md` to add a `Load` column matching the table above.

**Acceptance:** Every `rules/*.md` opens with the YAML block. `rules/index.md` shows the load column. No semantic change to rule bodies.

#### P0.2 — Create `MAP.md` at repo root

**Why:** `README.md` carries inventory (what exists). It does not carry navigation (what to read for goal X). AFDS v2 mandates one canonical "where is X?" file. Without it, the LLM either reads CLAUDE.md and follows @imports, or scans by guessing.

**Action:** Create `caol-ila/MAP.md` with a single goal-to-doc lookup table. Format:

```markdown
# MAP — caol-ila navigation

Goal-to-doc lookup. For LLMs: read this when "where is X?" — start here, not by scanning.

## Editing or creating

| Goal | Read in this order |
|------|---------------------|
| Edit any LLM-read doc | standards/llm-first-docs.md |
| Create a new slash command | rules/naming.md → rules/command-frontmatter.md → standards/slash-commands.md |
| Create a new skill | rules/naming.md → standards/slash-commands.md |
| Tag an Obsidian note | standards/obsidian-tag-taxonomy.md |
| Write an Obsidian note | rules/obsidian.md → standards/obsidian-format.md |

## Operating

| Goal | Read |
|------|------|
| Work in shotloom repo | rules/shotloom.md |
| Git op in a CINEV repo | rules/cinev-git.md |
| Multi-agent dispatch (1호기) | rules/multi-agent.md → standards/multi-agent-ops.md |
| Set up a new machine | README.md "Setup" section |

## Reviewing

(populate from current standards/index.md "Code Review" section)

## Reference (raw lookup)

- All commands: `claude/commands/`
- All skills: `claude/skills/`
- All standards: `claude/standards/index.md`
- All rules: `claude/rules/index.md`
```

**Acceptance:** `MAP.md` at repo root. `CLAUDE.md` and `README.md` link to it. Goal-to-doc lookup covers at least the 10 most common LLM tasks.

#### P0.3 — Tier-3 standards audit (16 files)

**Why:** During the v3.0.0 audit, 16 standards files still carried banned terms — any of `etc.`, `…`, `consider`, `usually`, `typically`, `should probably`, `might want`. Listed below.

**Files:**
```
standards/arp-skeleton.md
standards/cinev-character-asset-naming.md
standards/delegation.md
standards/design-system.md
standards/research-methodology.md
standards/repo-paths-keys.md
standards/review-code-tsl.md
standards/review-code-css.md
standards/review-code-unreal-cpp.md
standards/review-template.md
standards/review-spec-doc.md
standards/review-code-unreal-python.md
standards/review-ux-python-gui.md
standards/review-ux-writing.md
standards/review-ux.md
standards/unreal-engine-asset.md
```

**Action:** For each file:
1. Read full content.
2. Run grep for banned terms (`etc.`, `…`, `consider `, `usually `, `typically `, `should probably`, `might want`).
3. Replace each occurrence with explicit enumeration or restructured rule.
4. Apply tables/decision-trees where prose paragraphs encode branching logic.
5. Drop rhetoric and motivation lines.
6. Keep length within 400-line budget per file.

**Acceptance:** `grep -nE "\betc\.|consider |usually |typically " standards/*.md` returns nothing. Each fixed file has a `Why:` line for any rule whose rationale was cut.

### P1 — Structural

#### P1.1 — Sub-group `standards/` by topic

**Why:** 38 files flat at the same level. `standards/index.md` already groups them logically. The disk does not match.

**Target structure:**
```
standards/
├── authoring/
│   ├── llm-first-docs.md
│   ├── slash-commands.md
│   └── command-skill-reference.md
├── review/
│   ├── review-template.md
│   ├── review-spec-doc.md
│   ├── review-ai-motion.md
│   ├── review-3d-rendering.md
│   ├── review-code-css.md
│   ├── review-code-javascript.md
│   ├── review-code-tsl.md
│   ├── review-code-unreal-cpp.md
│   ├── review-code-unreal-python.md
│   ├── review-ux.md
│   ├── review-ux-python-gui.md
│   └── review-ux-writing.md
├── multi-agent/
│   ├── multi-agent-ops.md
│   ├── agent-workflow.md
│   └── delegation.md
├── language/
│   ├── javascript.md
│   ├── javascript-reference.md
│   ├── css.md
│   ├── css-reference.md
│   ├── design-system.md
│   ├── ui-design.md
│   └── three-shader-language.md
├── unreal/
│   ├── unreal-engine-cpp.md
│   ├── unreal-engine-asset.md
│   └── arp-skeleton.md
├── cinev/
│   ├── cinev-git-workflow.md
│   ├── cinev-character-asset-naming.md
│   ├── cinev-vrm-shading.md
│   └── cci-slack.md
├── obsidian/
│   ├── obsidian-format.md
│   └── obsidian-tag-taxonomy.md
├── research/
│   ├── research-methodology.md
│   └── tech-spec-template.md
├── system/
│   └── repo-paths-keys.md
└── index.md
```

**Action:**
1. `mkdir` the new subdirs.
2. `git mv` each file into its bucket.
3. Update every reference to old paths. Use `grep -rn "standards/<filename>" claude/` to find them all. Common reference sites: `rules/*.md`, `skills/*/SKILL.md`, `commands/*.md`, `CLAUDE.md`, `README.md`.
4. Update `standards/index.md` link targets to the new paths.
5. Run a broken-link sweep before commit (manual or via P2.1 validator if built first).

**Risk:** Breaks every reference to `standards/<file>.md` until updated. **Do this in one PR**, not piecemeal.

**Acceptance:** All 38 files moved. Zero broken references. `standards/index.md` links resolve.

#### P1.2 — Add `Load` column to `rules/index.md` and `standards/index.md`

**Why:** Indexes already list files; adding a `Load` column lets the LLM filter "what do I auto-load vs fetch on demand" at a glance.

**Action:** After P0.1 lands, propagate the `load:` field from each rule file's frontmatter into the `rules/index.md` table. For `standards/index.md`, every file is `on-demand` by default; the only special case is `llm-first-docs.md` which is `triggered: editing an LLM-read doc`.

#### P1.3 — Vault: split `specs/` and `ops/` mixed-policy folders

**Why:** Mutation policy mismatch.
- `specs/` mixes forward design (mutable) with frozen ADRs.
- `ops/` mixes durable mission records with ephemeral runtime logs.

**Action (Obsidian vault, claude/projects/<project>/):**
1. New folder `decisions/` (or `adr/`) for frozen ADRs. Status / Date / Context / Decision / Consequences template.
2. Move existing ADR-shaped files from `specs/` into `decisions/`.
3. Inside `ops/`, split into `ops/missions/` (durable) and `ops/runs/` (ephemeral, gitignore-able).
4. Update `rules/shotloom.md` "Subfolders" table.

**Acceptance:** Each folder has one mutation policy. `rules/shotloom.md` reflects the split.

### P2 — Mechanical / automation

#### P2.1 — `validate-llm-first` script

**Why:** Self-audit checklist in `llm-first-docs.md` is manual. Drift is inevitable. AFDS v2 mandates mechanical anti-rot.

**Action:** Author a CI-runnable script (`scripts/validate-llm-first.{sh,mjs}`) that checks:
1. Banned terms (`etc.`, `…`, `consider `, `usually `, `typically `, `should probably`, `might want `) absent in `claude/{rules,standards,commands}/**.md`, `claude/skills/**/SKILL.md`, repo `README.md`, `MAP.md`, `AGENTS.md`.
2. Every `claude/rules/*.md` opens with `---` frontmatter and has a `load:` field.
3. Every `~/.claude/...` reference resolves to a real file.
4. README inventory counts match `ls` output (no drift).
5. Length budgets respected per `llm-first-docs.md`.

Wire as a pre-commit hook or pre-push CI gate.

**Acceptance:** Script exists, runs in seconds, fails on any violation, succeeds on clean tree.

#### P2.2 — `status:` frontmatter on standards

**Why:** Currently every standard looks equally authoritative. In reality some are battle-tested (e.g. `slash-commands.md`) and some are this-session experimental (e.g. `llm-first-docs.md`). LLM should know which to trust as canonical vs which to treat as proposal.

**Action:** Add `status:` field to every `standards/*.md` frontmatter. Allowed values: `accepted`, `proposed`, `superseded`. Default for existing files is `accepted` unless flagged otherwise. `llm-first-docs.md` starts as `proposed`.

### P3 — Concept adoption (defer; evaluate after P0–P2)

| Concept | Source | Decision |
|---------|--------|----------|
| Tech-debt register (`docs/tech-debt/`) | AFDS v2 | Adopt if 3+ items accumulate that don't fit elsewhere |
| Gardening Review Checklist | AFDS v2 | Codify after P0/P1 done — the steps just executed are the checklist |
| Diátaxis quadrant tag | Diátaxis | Adopt for Obsidian vault `topics/`, `learnings/`, `specs/` only |
| Module-doc-template (per-skill) | AFDS v2 | Defer — 131 skills migration cost too high |
| Roadmap-item-template | AFDS v2 | Adopt only if needed |
| `commands/` ↔ `skills/` merge | Industry trend | Defer indefinitely |
| `rules/auto/` `rules/triggered/` subfolders | — | Skip — `load:` frontmatter (P0.1) covers this |

---

## Recommended order for next session

1. **P0.1** — `load:` frontmatter on rules/ (1 commit, ~30 min). Quickest LLM-first win.
2. **P0.2** — `MAP.md` (1 commit, ~30 min). Hand-curate top-10 goals.
3. **P1.2** — Add `Load` column to `rules/index.md` (small commit, ~5 min after P0.1).
4. **P0.3** — Tier-3 standards audit (1 PR or several commits, ~60–90 min for 16 files). Use a sub-agent in parallel for the mechanical sweep.
5. **P2.1** — `validate-llm-first` script (1 PR, ~60 min). Lock in the gains so they don't drift.
6. **P1.1** — Sub-group `standards/` (1 PR, ~45 min including reference updates).
7. **P2.2** — `status:` frontmatter on standards (small commit, ~15 min).
8. **P1.3** — Vault `specs/` ↔ `decisions/`, `ops/missions/` ↔ `ops/runs/` split (1 commit + rule update, ~30 min).
9. **P3** — Re-evaluate adoption candidates only after the above lands.

Total: roughly one focused session for P0+P1.2 (the highest leverage block), one more session for P0.3+P2.1+P1.1+P2.2, and a third for P1.3+P3.

---

## Anti-goals — do not do

- Do not create a `caol-ila/AGENTS.md`. The agent entry point is `claude/CLAUDE.md`. Adding a second entry violates AFDS v2 single-entry-point principle.
- Do not migrate `commands/` into `skills/` or vice versa. Defer.
- Do not write a memory file. See `CLAUDE.md` "Memory — does not exist".
- Do not weaken the LLM-first standard to accommodate a stubborn doc. Restructure the doc instead.

---

## Definition of done (overall LLM-first migration)

The migration is complete when ALL of:

1. Every `claude/rules/*.md` has `load:` frontmatter.
2. `MAP.md` exists at repo root and covers the 10 most common LLM goals.
3. `grep` for banned terms returns nothing across `claude/{rules,standards,commands}/**`, `claude/skills/**/SKILL.md`, repo `README.md`, `MAP.md`.
4. `standards/` is sub-grouped by topic on disk; all references resolve.
5. `validate-llm-first` script exists and runs in CI.
6. Every `standards/*.md` has `status:` frontmatter.
7. Vault `specs/` ↔ `decisions/` and `ops/missions/` ↔ `ops/runs/` split is reflected in the file tree and in `rules/shotloom.md`.

Tag the result `v3.1.0`.
