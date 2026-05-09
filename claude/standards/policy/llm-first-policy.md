---
status: proposed
platforms: all
portability: shared
---
# Agent-First Policy

The meta-policy that governs every other document, rule, skill, and command in `caol-ila`. The repository's primary operator is an autonomous agent, not a human reader. This file explains the layered enforcement that makes that real.

For the vocabulary used here (`charter`, `default-counter`, `lifecycle phase`, `audience`, `mutability`, layer numbers) and the rationale behind each principle below — see `principles.md`.

## Two files, two concerns

`caol-ila` is **LLM-first** (single term, see `SYSTEM.md` charter). The policy is split across two files because they answer different questions:

| File | Question | Read when |
|------|----------|-----------|
| `llm-first-policy.md` (this file) | **Why & how** — layer architecture, conflict resolution, what each layer enforces | Designing a new layer (rule/standard/skill/validator) or resolving a cross-artifact conflict |
| `llm-first-docs.md` | **How to write** — token budgets, audience model, 7 rules, format primitives | Writing or editing any artifact |

The split exists for read-cost: writing artifacts happens many times per session, designing layers happens rarely. Combining the two would force layer architecture into context every time you touch a doc.

---

## Stance

The repository is engineered for the LLM that reads it cold-start every session. The user is the architect; the agent is the primary reader, executor, and editor. Human-readable output is produced only on explicit user request.

This is **stronger than a style preference**. It is a substrate decision: every artifact's structure, naming, and load behavior is chosen to maximize agent comprehension at minimum token cost.

---

## Layered enforcement

The policy is enforced as a stack. Lower layers shape upper layers; upper layers cannot override lower ones.

| Layer | File(s) | Role | Mutability |
|-------|---------|------|-----------|
| 1. Charter | `SYSTEM.md` → "Repository charter" | One-paragraph stance, the "why" | Rarely changed; change requires re-deriving lower layers |
| 2. Operational standard | `standards/policy/llm-first-docs.md` | Per-document writing rules: banned terms, length budgets, structure | Changed when a new defect class is detected; bump validator with it |
| 3. Always-applied rules | `rules/*.md` (auto-loaded subset) | Short enforceable directives loaded every session | Add when a behavior must fire without a trigger |
| 4. On-demand standards | `standards/*.md` | Long reference docs, loaded when a triggering condition fires | Add when reference exceeds a rule's length budget |
| 5. Triggered rules | `rules/*.md` (triggered subset) | Directives loaded only on declared triggers | Add when a constraint applies only to a narrow context |
| 6. Skills / commands | `skills/*/SKILL.md`, `commands/*.md` | Executable units invoked by name | Add when a procedure must be repeatable |
| 7. Anti-rot validators | `scripts/validate-*.{sh,mjs}` | Mechanical checks that prevent drift | Add when manual self-audit is the bottleneck |

**Rule of precedence:** when two layers conflict, the lower layer wins. A skill that violates `llm-first-docs.md` is the skill's bug, not the standard's. A rule that contradicts the charter is the rule's bug.

---

## What this policy enforces

1. **Cold-start parsability.** Every file must be interpretable without prior session context. No "as we discussed", no implicit references.
2. **Entry documents are adapters.** `CLAUDE.md` and `AGENTS.md` load `SYSTEM.md` first, then add harness-specific mechanics.
3. **Explicit load semantics.** Every rule declares whether it is `auto` or `triggered`. The agent never has to guess.
4. **Mechanical anti-rot.** Drift is caught by validators, not by human review. If a rule cannot be validated mechanically, it must be rewritten until it can.
5. **Layered context budget.** Always-loaded surface stays under a token cap (`SYSTEM.md` and entry documents stay ≤ 150 lines each). Detail is pushed to lower-frequency layers.
6. **Goal-to-doc routability.** A cold-start agent can locate any artifact from a single navigation file (`LOOKUP.md`) without scanning the tree.

---

## What this policy forbids

- **Memory files.** No `MEMORY.md`, no `~/.claude/projects/*/memory/`. Persistent facts go in a layer of the stack, never in a side channel. See `SYSTEM.md` → "Memory".
- **Hidden conventions.** Any convention not encoded in a layer above does not exist. "Everyone knows" is not a valid enforcement mechanism.
- **Human-aesthetic optimizations** that cost the agent tokens or precision. No marketing prose, no rhetorical hedges, no repeated motivation paragraphs.
- **Single-source duplication.** A fact lives in exactly one file. Other files reference it by path. Indexes are generated or validated against the source.
- **Layer skipping.** A skill cannot encode a constraint that should be a rule. A rule cannot encode reference material that should be a standard. Detect this when length or repetition signals it.

---

## When to add to which layer

| Signal | Add to layer |
|--------|--------------|
| "This must fire on every session, no exceptions" | 3 (always-applied rule) |
| "This must fire only when condition X is true" | 5 (triggered rule) + register trigger in `rules/index.md` |
| "This is reference material; rule body is too short to hold it" | 4 (on-demand standard); rule links to it |
| "Multiple files would each have the same paragraph" | 4 (standard) + delete duplicates; rules cite by path |
| "I keep re-doing this procedure manually" | 6 (skill or command) |
| "I keep failing the self-audit on the same defect" | 7 (validator) — the audit becomes a script |
| "A bullet in an existing rule has a more specific trigger than the rule it lives in" | Split — extract the bullet into its own triggered rule; cite by path from the original rule if needed |
| "An auto-rule body is approaching the auto-rule cap (40 body lines)" | Split — push triggered content out of auto into new triggered rules |
| "A bullet does not counter a default LLM bias" | It's not auto material — make it triggered. Auto is reserved for rules that the harness violates by default and that intent-formation needs to see at cold start. |
| "A rule's bullets cluster around distinct lifecycle phases (e.g. PR open, PR comment, PR merge)" | Split per phase — each phase becomes its own triggered rule with the phase as the trigger condition. |
| "The whole stance just shifted" | 1 (charter) — then re-derive layers 2–7 |

---

## Conflict resolution

When two artifacts disagree, resolve by the precedence rule (lower layer wins) and **edit the higher-layer artifact to match**, not the other way. A standard does not bend to accommodate a stubborn skill; the skill is rewritten.

When a layer's constraint blocks a legitimate need:

1. State the need in concrete terms (file, action, what the constraint forbids).
2. Identify which layer holds the constraint.
3. Decide: change the layer (with the cascade that implies), or change the need.
4. Never carve a one-file exception inside the consumer. Exceptions belong in the layer that owns the rule.

---

## Anti-goals

- Do not add an unregistered entry document. Register every entry document in `SYSTEM.md` and keep shared policy out of the entry document.
- Do not split this policy across multiple files for "organization." This is a single stance; it lives in one file.
- Do not weaken a layer to silence a violator. The violator is the bug.
- Do not add a layer that the validator cannot enforce. Unenforceable layers rot in one session.
- Do not document this policy in human-aesthetic prose elsewhere (a "vision doc", a "manifesto"). This file is the only authoritative statement.

---

## Self-audit checklist

Before committing a change to any layer:

- [ ] The change names which layer it modifies.
- [ ] If it adds a layer 3 / 5 rule, the rule has a `load:` field and a one-line trigger if `triggered`.
- [ ] If it adds a layer 4 standard, the standard is registered in `standards/index.md` with a "When to read" entry.
- [ ] If it changes layer 1 (charter), the cascade through layers 2–7 has been planned, not deferred.
- [ ] Validator (layer 7) still passes. If the change disables a validator check, an issue is filed for the replacement.
- [ ] No new memory file, no unregistered entry document, no human-aesthetic prose has been added.
