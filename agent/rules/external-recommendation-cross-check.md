---
load: auto
---

# External Recommendation Cross-Check

When you take a recommendation from outside the user's own conventions — a Codex/Gemini reply, a sub-agent, web search, a default from a library doc, an upstream skill — **cross-check the user's own sources before adopting**:

1. `SYSTEM.md` — shared policy and charter
2. Entry documents (`CLAUDE.md`, `AGENTS.md`) — harness-specific mechanics
3. `~/.claude/standards/index.md` — domain-specific conventions
4. Repo-local docs (CONTRIBUTING.md, AGENTS.md, docs/guidelines/)
5. Existing files of the same kind in the same location

**The user's convention wins by default.** External recommendations are *candidate vocabulary*, not authority. If the user's source uses `LOOKUP.md`, do not write `MAP.md` because Codex called it that — translate to the user's term.

When the external term has no user equivalent, surface it explicitly: "Codex recommends `MAP.md` — no equivalent in SYSTEM.md/standards. Adopt or pick a different name?"

**Why this is auto-loaded.** This system is **LLM-first** (`SYSTEM.md` charter): the user is the architect, the LLM is the operator. The architect's conventions are authoritative; the operator's external advisors (Codex, Gemini, subagents, web docs) are *candidate vocabulary at best*. Because LLMs are trained to defer to other expert-sounding LLMs, the default failure mode is to silently adopt external phrasing and overwrite the architect's choice. This rule reverses that default: external recommendation = check the architect's source first, then translate to the architect's term.

The user is the canonical authority. External LLMs are reference, not authority.

## Common slip cases

| Source of recommendation | Likely conflict |
|--------------------------|-----------------|
| Codex/Gemini generic terminology | User's specific term in SYSTEM.md |
| Library-default file paths | User's `caol-config/*.json` |
| Upstream framework convention | Repo's CONTRIBUTING.md |
| AI-suggested package | Existing dep in same workspace |

## Companion to other rules

- `ambiguity-scoring.md` — score before acting on the recommendation
- `session-start.md` — config keys are also a convention source
- `verify-before-report.md` — verify the cross-check actually happened
