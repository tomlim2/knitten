---
status: proposed
---

# Principles & Glossary

The vocabulary `caol-ila` uses to talk about itself, plus the operating principles discovered through real incidents. Read this when a term in another doc feels ambiguous, or when deciding whether a new pattern fits the existing layer model.

`agent-first-policy.md` is the **stable** layer model (constitution). This file is the **evolving** body of discovered lessons (case law). Both grow, but at different rates and for different reasons.

---

## Glossary

### Roles & files

**charter** — The repository's foundational stance. Lives in `CLAUDE.md` → "Repository charter". One paragraph. Says *who* the repo serves and *why*. Rarely changes; when it does, every lower layer is re-derived. Distinct from a rule (rule is `must`) or a standard (standard is `how`).

**agent-first** — The stance term. The repository serves an autonomous agent, not a human reader. Format-agnostic, model-agnostic. Future-proof against non-LLM agents. Lives in `agent-first-policy.md`.

**llm-first** — The mechanics term. The writing rules that follow *because* the agent is currently an LLM (token cost, cold-start, narrow context, recency bias). Lives in `llm-first-docs.md`. If a non-LLM agent ever becomes primary, `llm-first` mechanics are re-derived; `agent-first` stance does not change.

**rule** — Short enforceable directive. Body cap: 40 lines (auto) or 120 lines (triggered). Lives in `claude/rules/`.

**standard** — Long reference doc. On-demand load. Body cap: 500 lines (3 grandfathered catalogs over). Lives in `claude/standards/<topic>/`.

**skill / command** — Executable unit invoked by name. Lives in `claude/skills/<name>/SKILL.md` or `claude/commands/<name>.md`.

**validator** — `scripts/validate-llm-first.mjs`. Mechanical anti-rot gate. 7 checks. Runs in seconds.

### Loading & timing

**auto** — A rule with `load: auto` in frontmatter. Always in cold-start context. Reserved for default-counters only.

**triggered** — A rule with `load: triggered` + `trigger: <condition>` in frontmatter. Loads only when the condition fires.

**on-demand** — A standard. Never auto-loaded. The LLM reads it when the relevant trigger or context demands it.

**cold-start** — The state at the beginning of every session. The LLM has no memory of prior sessions. Every artifact must be interpretable from cold-start.

**lifecycle phase** — A discrete moment in a recurring workflow (PR open, PR close, PR comment, PR review, PR merge, force-push). Each phase has its own trigger and gets its own triggered rule.

### Behavior & defaults

**default-counter** — A rule that contradicts a strong default in the LLM's behavior (system prompt, training, harness). Auto-load is reserved for these because the bias forms intent before any triggered rule can fire. Examples: "No Co-Authored-By" counters the harness's commit-message default; "No success feedback" counters the LLM's chatty-confirmation default.

**default bias** — The LLM's baseline behavior on a given action, before any rule fires. The thing a default-counter rule pushes against.

**intent formation** — The moment in a turn where the LLM decides what action to take next. Default-counter rules must be in context at intent formation; triggered rules can fire later.

### Audience & style

**audience** — Who reads a vault file. One of `llm`, `human`, `llm+human`. Declared by folder location (each subfolder has a `README.md` declaring its audience) or by the file's own `audience:` frontmatter override.

**strict LLM-first** — The default style. Frontmatter, headers, tables, no banned terms, no narrative. Same rules as `llm-first-docs.md`.

**structured-narrative** — Allowed only in `days/` and `learnings/`. Structure mandatory (frontmatter, headers, bold takeaway), narrative allowed inside sections. Three-month-later author is also a cold-start reader.

### Mutability

**mutability** — How a file changes over its lifetime. Each vault folder declares one.

| Value | Meaning |
|-------|---------|
| `durable` | Frozen on write, additive only (e.g. ADRs, mission records) |
| `mutable` | Edited freely (e.g. forward design specs) |
| `append-only` | New entries appended, old not edited (e.g. devlogs, mission logs) |
| `ephemeral` | Safe to delete after its run (e.g. snapshots, debug stashes) |

### Operations

**mission** — A cross-session unit of work with defined start, defined end, and outputs that future sessions reference. Lives in `ops/missions/<mission>/`.

**run** — A single-shot snapshot, debug stash, or tool output. Ephemeral. Lives in `ops/runs/`.

**garden review** — Periodic structural audit against `agent-first-policy.md`. Codified in `garden-review.md`. Triggers: pre-tag, after 30+ days clean, or on explicit request.

### Layers (from `agent-first-policy.md`)

**layer 1** — Charter (`CLAUDE.md` → "Repository charter").
**layer 2** — Operational standard (`llm-first-docs.md`).
**layer 3** — Auto-applied rules (`rules/*.md` with `load: auto`).
**layer 4** — On-demand standards (`standards/**/*.md`).
**layer 5** — Triggered rules (`rules/*.md` with `load: triggered`).
**layer 6** — Skills / commands.
**layer 7** — Anti-rot validators.

Lower layers shape upper layers; upper layers cannot override lower ones. When two layers conflict, the lower layer wins.

---

## Discovered Principles

### 1. Auto-load is reserved for default-counters

**Statement:** A rule is auto-loaded only if it counters a default LLM bias (harness system prompt, training default). Domain knowledge is triggered.

**Why discovered:** 2026-05-01 session. `git.md` had grown to 858 tokens mixing default-counter rules (no Co-Authored-By, no auto-push) with PR lifecycle bullets. Realized PR rules don't need cold-start awareness — only default-counters do. The LLM's intent forms in cold-start, before triggered rules can fire. Triggered rules cannot retroactively fix already-formed intent.

**Example:**
- ✅ auto: "No Co-Authored-By" (harness's system prompt instructs adding it; LLM bias is strong; intent forms cold-start).
- ❌ auto: "Pre-PR checklist" (only fires on `gh pr create`; the LLM has time to load the triggered rule before the action).

**Enforced by:** `validate-llm-first.mjs` length-caps check (auto cap = 40 lines; bloat forces split). Documented in `agent-first-policy.md` "When to add to which layer" table.

---

### 2. Lifecycle phase = trigger

**Statement:** When a rule's bullets cluster around distinct lifecycle phases, split per phase. Each phase becomes its own triggered rule with the phase moment as the trigger.

**Why discovered:** 2026-05-01 session. `git.md` had four phases tangled together: always-on (commit identity), PR mutate (open/close/merge), PR comment (draft+approval), PR create (pre-flight). Splitting them eliminated cross-phase noise — non-PR sessions no longer evaluate PR rules.

**Example:**
- ✅ `pr-mutate.md` (trigger: about to mutate PR state via gh)
- ✅ `pr-comment.md` (trigger: about to post any PR/review/issue comment)
- ✅ `pr-create.md` (trigger: about to call gh pr create)
- ❌ One mega `git.md` with everything

**Enforced by:** `agent-first-policy.md` "When to add to which layer" — last row.

---

### 3. Bullet with a more specific trigger than its rule → split

**Statement:** If a bullet inside a rule has a narrower trigger than the rule it lives in, extract it into its own triggered rule. Cite by path from the original.

**Why discovered:** 2026-05-01 session. `session-start.md` was a kitchen sink — Slack confirm, writing pipeline, doc resolver, codex keys, all under "load: auto". Each of those has a clear, narrow trigger (sending Slack, writing prose, writing a doc, authoring a Codex skill). They were inflating cold-start cost for sessions that never touched any of them.

**Example:** "Slack confirm first" → `rules/slack.md` (trigger: sending any Slack message). The bullet is no longer evaluated when the LLM is, say, just reading code.

**Enforced by:** `agent-first-policy.md` "When to add to which layer" — penultimate row.

---

### 4. Single artifact = single audience

**Statement:** Every vault file declares one primary audience (`llm` / `human` / `llm+human`). Folder location declares the audience by default; per-file override allowed via frontmatter `audience:`.

**Why discovered:** 2026-05-01 session. The original CLAUDE.md exception said "vault notes are human-friendly" — too broad. Most vault files are agent-to-agent handoffs (briefings, plans, asks, mission records) that the LLM reads cold-start. Only `days/` and `learnings/` are genuinely human-recall.

**Example:**
- `vault/.../shotloom/days/` → human (structured-narrative)
- `vault/.../shotloom/decisions/` → llm (strict llm-first)
- `vault/.../shotloom/ops/missions/` → llm (strict llm-first)

**Enforced by:** `vault-audience.md` standard. Each vault subfolder has a `README.md` declaring audience + style + mutability.

---

### 5. Default = strict LLM-first, even for human-read files

**Statement:** Even files with a human audience use the structured-narrative variant of LLM-first (frontmatter, headers, tables, bold takeaway). Narrative is an additive layer inside sections, never a replacement for structure.

**Why discovered:** Three-month-later author reading their own devlog is also a cold-start reader. Structure helps the human too. Narrative carries emotion and context; structure carries the lesson.

**Example:**
- ✅ `days/2026-05-01.md` with sections, bold takeaways, AND a paragraph about why the bug felt frustrating.
- ❌ `days/2026-05-01.md` with three paragraphs of stream-of-consciousness, no headers.

**Enforced by:** `vault-audience.md` style policy. Author discipline (vault is outside the validator's git-tracked scope).

---

### 6. Cold-start parsability

**Statement:** Every artifact must be interpretable without prior session context. No "as we discussed", no implicit references, no shorthand only the previous session understood.

**Why discovered:** Foundational since `llm-first-docs.md`. Reinforced by every garden review — agent-to-agent handoffs that fail are the ones that assumed context.

**Example:**
- ✅ "STL-247 lockout: the gltf prefilter feature flag is on for >95% of users; remove the flag this PR."
- ❌ "Finish what we talked about last week."

**Enforced by:** `llm-first-docs.md` — body of the standard. No mechanical check yet (TODO: validator could detect "as we", "previously", "you know").

---

### 7. Mechanical anti-rot — if a rule cannot be validated mechanically, restructure

**Statement:** Every rule should be encodable as a validator check. If it cannot be (because it requires human judgment), rewrite the rule until it can be.

**Why discovered:** Manual self-audits drift. The v3.0 → v3.1 migration involved a banned-term sweep that should have been mechanical from the start. The validator now catches what manual review used to miss.

**Example:**
- ✅ "No `etc.` in standards/rules/commands/skills" — grep-able.
- ❌ "Be specific" — judgment-dependent. Reword to a checkable form ("Include at least one example, one counter-example, one expected output").

**Enforced by:** `validate-llm-first.mjs` 7 checks. Garden review checklist asks "is there a check the validator missed?".

---

### 8. Single source of truth, references by path

**Statement:** A fact lives in exactly one file. Other files reference it by path, never by duplication. Indexes are generated or validated against the source.

**Why discovered:** The Skills & commands table in `CLAUDE.md` duplicated content already in three triggered rules (`naming.md`, `command-frontmatter.md`, `tool-permissions.md`) and one standard (`slash-commands.md`). Same rules in two places — when one updates, the other rots.

**Example:**
- ✅ `rules/index.md` lists 21 rules with one-line scope. `CLAUDE.md` doesn't repeat the list.
- ❌ "Authoring rules" appears as a table in CLAUDE.md AND in rules/index.md AND in README.md.

**Enforced by:** `validate-llm-first.mjs` `inventory-counts` check (README counts must match `ls`). For body content: garden review section 3.

---

## How to add a principle

When a session discovers a new operating principle (a pattern that worked, a defect class spotted, a recurring confusion resolved):

1. Add a new section under "Discovered Principles" with the same 4-field shape.
2. Cross-link to `agent-first-policy.md` if the principle changes the layer model.
3. If the principle can be mechanically enforced, add a validator check (`scripts/validate-llm-first.mjs`) in the same PR.
4. Update affected glossary entries.
