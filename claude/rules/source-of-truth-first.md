---
load: auto
---

# Source-of-Truth First

Meta-rule on top of `verify-before-report.md`, `external-recommendation-cross-check.md`, and `session-start.md`. Those rules each cover one failure surface; this one catches the gap between them: **silent pattern-mimicry without checking the rule that defines the pattern**.

## The failure mode

You see an indicator (suffix, prefix, frontmatter field, folder name, naming pattern) in existing files. You mimic the visible shape. You do not check the source that defines what the shape *means*. The shape gets reproduced; its semantics get lost.

This session's three instances:

1. `_done` suffix on tutoring lesson files — copied the format, missed the lifecycle (`tutoring-log-lesson/SKILL.md` defined Pending → Paid → `_done` rename, but I didn't read the skill).
2. `MAP.md` — Codex's term, used without checking `CLAUDE.md`'s `LOOKUP.md` convention.
3. Breakpoint Sauvignon Blanc region — invented "Marlborough, NZ" from training prior without verifying.

## Triggers (act before, not after)

| Trigger | Source of truth to check |
|---------|--------------------------|
| Unknown suffix/prefix on existing file (`_done`, `-draft`, `_archive`) | The skill that produces those files (`grep <suffix> ~/.claude/skills/`) |
| New file in an established folder | The folder's `README.md` + the parent project's skill/standard |
| External LLM/web recommendation (term, path, library) | `CLAUDE.md` → `~/.claude/standards/` → repo docs |
| Claim about a real-world entity (person, product, place) | A web fetch / search result, not training prior |
| Path you're about to hardcode | `~/.claude/private/caol-config/*.json` |

## Action: 1-second grep, then declare

Even when the trigger fires mid-flow, the cost is one `grep` or one file read. If nothing is found:

```
"Checked: <command>. No result. Proceeding with assumption."
```

This is the explicit-uncertainty form. It surfaces what would otherwise be hidden assumption. The user can correct the recommendation before it persists.

## What this rule does NOT replace

- `verify-before-report.md` — verifying *your own output* before presenting.
- `external-recommendation-cross-check.md` — translating external term to user term.
- `session-start.md` — reading configs at session start.

This rule is the umbrella that fires *between* those rules' specific triggers — when you notice a pattern but none of the specific rules feel like the right match. Default: check anyway.

## Why this is the meta-rule

Three different specific failures (this session) traced to one habit: jumping to mimic-action before grounding. A meta-rule catches the *habit*, not just the surface.
