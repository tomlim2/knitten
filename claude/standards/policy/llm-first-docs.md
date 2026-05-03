---
status: proposed
---
# LLM-First Document Standard

Operational standard implementing the `caol-ila` LLM-first charter (see `CLAUDE.md` → "Repository charter"). Default for every artifact Claude writes. Token-efficient, structured, no rhetoric.

## When this standard applies

Applies unless one of three switches fires (see below). Non-exhaustive list of LLM-first artifacts:

- `CLAUDE.md`, `rules/*.md`, `skills/*/SKILL.md`, `commands/*.md`, `standards/*.md`
- Every agent-to-agent handoff: `asks/*.md`, `ops/*-briefing.md`, `ops/*-log.md`, `ops/*-timeline.md`, multi-agent dispatches, sub-agent prompts
- Repo `README.md` (yes — even README), `AGENTS.md`, `CONTRIBUTING.md`, ADRs, design docs
- PR bodies, commit messages, code comments, issue descriptions

## Switch to human-friendly only when

1. **User explicitly asks.** "Make this README friendlier", "write as a story", "expand for humans". Without an explicit ask, stay LLM-first even on docs that traditionally feel human-facing.
2. **Writing vault notes for the user's own recall** — `claude/projects/*/days/*.md`, `claude/projects/*/learnings/*.md`. Narrative and analogies welcome.
3. **Speaking in chat to the user.** The conversation itself uses natural prose.

If unsure, default LLM-first.

---

## Audience model

The LLM is cold-start every read. Assume:

- No memory of prior sessions.
- Literal interpretation; no reading between lines.
- Ambiguity → safest interpretation, often not what the user wanted.
- Long docs lose weight at the tail (recency bias).

Therefore:

- Hard rules at the top.
- Reference material at the bottom.
- Each sentence must be interpretable in isolation.

---

## Seven rules

### 1. Actionability

Every sentence must let the LLM decide what to do *now*.

- Banned: `consider`, `usually`, `typically`, `may`, `should probably`, `might want to`.
- Required: `if X then Y, else Z` or imperative `do X`.

Bad: `"Consider running tests before committing."`
Good: `"Before git commit, run cargo test. If it fails, do not commit."`

### 2. Explicit enumeration

Never end a list with `…`, `etc.`, `and more`. The LLM cannot expand it.

Bad: `"Categories: cci, ue, dev, …"`
Good: a table that lists every valid value.

### 3. Decision-tree structure

Branching logic uses explicit `if` / `else`, not prose.

Bad: `"When the user asks about a PR, you usually want to check its status, though if they're investigating you can skip that."`
Good:
- If user requests action on a PR → run `gh pr checks` first.
- If user is investigating only → reading is allowed without checks.

### 4. Self-contained

A rule must carry enough context to apply it inline. Cross-references go *after* the actionable text, not as the only content.

Bad: "Follow the testing standard." (LLM has no way to know what that says without an extra fetch.)
Good: "Every new public function needs one happy-path test and one edge-case test. Full guide: `standards/testing.md`."

### 5. Paired examples

Show both Bad and Good. Positive-only examples don't establish the boundary.

```
Bad:  learnings/learning-bootstrap.md
Good: learnings/bootstrap.md
```

### 6. No duplication

If the same rule lives in two files, the LLM may follow whichever it sees and miss the other. Pick one canonical home; replace the other with a link.

### 7. No rhetoric

Banned: motivation, marketing, decoration, philosophical asides.

- Banned: "Every command is a guardrail. Every skill is accumulated experience."
- Banned: `"Carefully consider the implications…"`
- Banned: emoji, decorative dividers, ascii art.

These add tokens and zero decision power.

### 8. Extreme-S writing — implemented only, present tense

MBTI shorthand: write as **extreme S (Sensing)**. No N (iNtuition) statements. Only what currently exists, observable, present.

Banned without explicit user agreement (or user-LLM written agreement in the same doc):

| Class | Bad | Good |
|-------|-----|------|
| Future tense (N) | "will support", "is planned to", "going to add" | "supports" (when it does) — or omit |
| Aspirational (N) | "aims to", "vision is", "goal is to eventually" | omit |
| Speculation (N) | "might", "could", "probably", "in theory" | concrete fact or `if X then Y` |
| Abstract pattern (N) | "this represents the broader principle of…" | the concrete behavior |
| Marketing (decoration) | "powerful", "elegant", "comprehensive", "world-class" | the concrete capability the adjective hides |
| Sycophantic | "great question", "you're right to consider…" | direct answer |

If a feature is unimplemented, do not describe it as if it works. Either:
1. Omit it from current docs.
2. Mark with `status: proposed` frontmatter + `**status:** not implemented` body marker.
3. Move to a sanctioned `*-roadmap.md` (only if user explicitly agreed to that file existing).

The LLM reads docs as factual ground truth. N-language pollutes ground truth and propagates into actions.

---

## Format primitives

Use, in this order of preference:

1. **Tables** — for any set of options or per-case rules.
2. **Bullet lists with a verb prefix** — when imperative steps are needed.
3. **Fenced code blocks** — for paths, commands, frontmatter samples.
4. **Prose** — last resort, only when the others don't fit.

Avoid:

- Long paragraphs (≥3 sentences) describing one rule.
- Section headers without rules under them.
- Mixing rationale into the rule line. Rationale, if any, goes on a separate `Why:` line below.

---

## Length budget

| Doc type | Budget |
|----------|--------|
| `CLAUDE.md` | ≤ 150 lines |
| `rules/*.md` | ≤ 50 lines each |
| `skills/*/SKILL.md` | ≤ 200 lines |
| `commands/*.md` | ≤ 100 lines |
| `standards/*.md` | ≤ 400 lines |

If a file exceeds budget, split — do not let it grow.

---

## Self-audit checklist

Before committing changes to an LLM-first doc, scan for:

- N-language (intuitive, non-Sensing): future tense, aspirational, speculation, abstract patterns
  - `will`, `going to`, `plans to`, `is planned`, `aims to`, `goal is to`
  - `could`, `probably`, `in theory`, `would likely`, `might`
  - `consider`, `usually`, `typically`, `may`, `should probably`
  - `etc.`, `…` (incomplete enumeration)
  - "this represents", "broadly speaking", "in essence"
- Marketing adjectives (`powerful`, `elegant`, `comprehensive`, `world-class`, `seamless`)
- Sycophantic openers (`great question`, `you're right`, `excellent point`)
- Paragraphs longer than 3 sentences in a rule context.
- Section headers with no rules underneath.
- Duplicated rules already covered in another file.
- Decorative emoji or motivational lines.

Each hit is a defect. For unimplemented features: either omit, mark `status: proposed`, or move to a sanctioned roadmap doc.

