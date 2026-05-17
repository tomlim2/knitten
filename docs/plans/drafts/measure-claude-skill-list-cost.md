---
status: draft
created: 2026-05-10
platforms: claude
portability: harness-specific
load: triggered
trigger: measuring Claude Code skill-list cold-start cost; deciding whether to act
revisit-when: Claude Code harness changes skill-loading behavior; baseline tokens drift > 1k from last measured
---

# Measure Claude Code skill-list cold-start cost

**Adapter scope.** Claude Code harness behavior only. Other harnesses inject skills differently.

**Scope of this plan.** Measurement only. Action plans (description shrink, dead-skill removal, context-scoped mounts) are deliberately deferred — recent external review showed earlier optimization assumptions (~180 skills / ~10k tokens / heavy-tail distribution) were wrong: actual ~124 skills, total `description` + `when_to_use` ≈ 12.6k chars (≈ 3–4k tokens likely), top 10 = 15.8% of bytes (not heavy-tail). ROI of action work is currently unclear; measurement decides.

## Problem

Claude Code harness injects every `~/.claude/skills/*/SKILL.md`'s `description` (and `when_to_use` per `ah-make-skill`) into cold-start context. Cost is unmeasured. Without a baseline number any optimization plan is speculation.

## Phase 0 — Baseline (only phase in this plan)

```bash
for f in ~/.claude/skills/*/SKILL.md; do
  block=$(awk '
    /^description:/ {flag="d"; sub(/^description: */,""); printf "%s ", $0; next}
    /^when_to_use:/ {flag="w"; sub(/^when_to_use: */,""); printf "%s ", $0; next}
    /^[a-z_-]+:/    {flag=""}
    flag             {printf "%s ", $0}
  ' "$f")
  printf "%5d\t%s\n" $(echo -n "$block" | wc -c) "$(basename $(dirname $f))"
done | sort -rn > /tmp/skill-listing-bytes.txt
```

Captures both `description:` AND `when_to_use:` (ah-make-skill states both fields enter the listing).

Tokenize the concatenated block via `tiktoken cl100k_base` (or Claude API). Persist to `private/agent-hub-config/cold-start-baselines.json`:

```json
{
  "claude": {
    "measured": "YYYY-MM-DD",
    "skill_count": <N>,
    "listing_tokens": <N>,
    "listing_bytes": <N>,
    "top10_share": <fraction>
  }
}
```

## Decision gate

After Phase 0, exactly one of:

| Outcome | Action |
|---------|--------|
| `listing_tokens` < 5,000 | Close: `status: dropped`. ROI insufficient. Re-open only via `revisit-when` triggers |
| 5,000 ≤ `listing_tokens` < 7,000 | Close: `status: dropped` with note "monitor only". Periodic sweep via `garden-review.md` watches for drift |
| `listing_tokens` ≥ 7,000 | Open follow-up plan `shrink-claude-skill-descriptions.md` for action work. This plan moves to `status: done`. Follow-up scope determined by Phase 0 distribution |

The 7,000 floor reflects the cost of audit work plus picker-recall risk vs. expected savings. Below that, doing nothing is correct.

## Out of scope

- Description shrinking, dead-skill removal, mount strategy — all live in *future* plan only opened if Phase 0 ≥ 7,000.
- Codex cold-start — separate adapter, separate plan.
- Tool schema, auto-loaded rules, MCP deferred-tools — separate concerns.
- `ah-make-skill` modification — not touched. Adapter rules belong in adapter docs (path TBD when needed; `~/.claude/standards/adapters/` is not a registered group, would need taxonomy amendment first).

## Risks

| Risk | Mitigation |
|------|------------|
| Measurement script misses a listing field that harness actually uses | Verify against `ah-make-skill` SKILL.md spec; sample 3 skills' raw cold-start output if available |
| Tokenizer choice (cl100k_base) diverges from harness internal | Same family, close enough for ROI gate decisions |
| Re-measurement cadence not enforced | `garden-review.md` registration when this plan closes |

## Lifecycle

- Completion path 1: baseline measured, value < 7,000 → `status: dropped` (with measurement preserved in baselines.json).
- Completion path 2: baseline ≥ 7,000 → `status: done`, follow-up plan opened.
- Re-open this plan only on `revisit-when` triggers.
