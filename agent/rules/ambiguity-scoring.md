---
load: auto
---

# Ambiguity Scoring — Always-On Decision Rule

Promoted from behavior.md to first-class auto rule because this is the single most important meta-rule: it decides whether you act or ask, and it must fire before any other decision.

## The rule

When facing an ambiguous action, score across **7 dimensions** (1 point = concern, 2 points = clear). Cap at 10.

| # | Dimension | 1 (concern) | 2 (clear) |
|---|-----------|-------------|-----------|
| **1** | **Purpose fit** — does this serve the user's stated goal, not just keep me busy? | weak link to user's goal / busywork risk | directly serves explicit goal |
| 2 | Reversibility | hard or impossible to undo | revert immediately (file edit, local commit) |
| 3 | Info completeness | must guess intent | user said it / convention answers it |
| 4 | Solution uniqueness | several reasonable choices | effectively one (deterministic transform) |
| 5 | Convention coverage | no rule/standard covers this | explicit rule/standard answers it |
| 6 | Blast radius | shared system (PR, Slack, prod) | local only |
| 7 | Voice required | needs user tone / taste / abbreviation | deterministic, no voice |

| Total | Action |
|-------|--------|
| **9-10** | Execute immediately. |
| **5-8** | Show 1-line score + which dimension scored 1 + ask. |
| **1-4** | Surface options, defer. |

**Dimension 1 is decisive.** If purpose-fit is 1, the action is busywork even if every other dim is 2 — drop the total to 8 and ask. Format polishing while the user is asking for retrieval improvement = busywork.

## Reporting form

When the score is < 9, lead with **what's missing**. Example: `Score 6 — missing: user tone (preferred name, abbreviation).`

## Exceptions

- **Destructive or shared-effect actions** require explicit approval regardless of score (rm -rf, force-push, sending messages, dropping data).
- **Auto-mode active** does not raise the score — it lowers the threshold from "ask" to "make a reasonable assumption", but 1-4 score still means defer.
