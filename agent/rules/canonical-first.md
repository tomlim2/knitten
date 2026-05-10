---
load: auto
platforms: all
portability: shared
---

# Canonical First

Meta-rule on top of `verify-before-report.md`, `external-recommendation-cross-check.md`, and `session-start.md`. Those rules each cover one failure surface; this one catches the gap between them: **silent pattern-mimicry without checking the rule that defines the pattern**.

## The failure mode

You see an indicator (suffix, prefix, frontmatter field, folder name, naming pattern) in existing files. You mimic the visible shape. You do not check the canonical reference that defines what the shape *means*. The shape gets reproduced; its semantics get lost.

## Triggers (act before, not after)

| Trigger | Canonical reference to check |
|---------|------------------------------|
| Unknown suffix/prefix on existing file (`_done`, `-draft`, `_archive`) | The skill that produces those files (`grep <suffix> ~/.claude/skills/`) |
| New file in an established folder | The folder's `README.md` + the parent project's skill/standard |
| External LLM/web recommendation (term, path, library) | `SYSTEM.md` → entry document → `~/.claude/standards/` → repo docs |
| Claim about a real-world entity (person, product, place) | A web fetch / search result, not training prior |
| Path you're about to hardcode | `~/.claude/private/caol-config/*.json` |

## Action: 1-second grep, then declare

Even when the trigger fires mid-flow, the cost is one `grep` or one file read. If nothing is found:

```
"Checked: <command>. No result. Proceeding with assumption."
```

This is the explicit-uncertainty form. It surfaces what would otherwise be hidden assumption. The user can correct the recommendation before it persists.

## Boundary

This rule does not replace `verify-before-report.md`, `external-recommendation-cross-check.md`, or `session-start.md`. It fires between those rules when a pattern appears and no specific rule feels like the right match. Default: check anyway.
