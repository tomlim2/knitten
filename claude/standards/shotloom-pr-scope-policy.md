# Shotloom PR Scope Policy

Classification rules for PR review feedback. Used by `shotloom-auto-pr` (auto-response loop) and `shotloom-respond-pr` (manual response with approval gate).

Goal: keep PRs focused. Don't grow scope inside the current PR. Split clearly-separate work into new Linear issues. Stop and ask only when genuinely ambiguous.

---

## Three classifications

### 1. In-scope → auto-resolve

The feedback is about code this PR already touches, or is mechanical/local enough that fixing in this PR does not grow scope.

**Indicators (any one):**
- The file named in the comment appears in `git diff <base>...HEAD --name-only`
- Fix is ≤5 lines and stays within a single function
- CI / lint / test / doc-path / type-check failure (mechanical)
- Comment includes a concrete code suggestion block that applies cleanly
- Typo, wording, formatting, naming-consistency fix
- Missing test for code this PR adds

**Action (auto):** fix → local gates → commit → push → inline reply (`Fixed in <sha>. <brief>.`) → resolve thread.

### 2. Out-of-scope → brief, don't create, don't reply

The feedback is about code this PR did not touch, or is substantial enough that doing it here would grow the PR beyond its Linear issue.

**Indicators (any one):**
- File is not in this PR's diff AND expected fix >30 lines
- Comment contains deferral language: *"refactor"*, *"consider"*, *"in a follow-up"*, *"separate PR"*, *"eventually"*, *"might want to"*, *"would be nice"*
- Fix requires a new crate, new module, or cross-cutting design change
- Concern is valid but orthogonal to this PR's stated goal (check Linear issue)
- Would violate an ADR's ask-first matrix (stage contract, bridge contract, ECS ordering, new dep, etc.)

**Action (auto):**
- **Do NOT** auto-create a Linear issue. (Policy: user creates new issues manually so they land with the right Linear project/labels/context.)
- **Do NOT** post a reply to the comment. (Policy: leaving the thread open is a visible backlog marker for the reviewer.)
- **Do NOT** resolve the thread.
- Add an entry to the briefing with a **draft Linear issue** the user can copy:
  ```
  ### Out-of-scope — new Linear issue needed

  Suggested title: <type>(<scope>): <summary from comment>

  Body draft:
    Context: Spun off from PR #<N> review by @<reviewer>.
    Original comment: <quoted body>
    File: <path>:<line>
    Rationale: <why this is out of scope for PR #<N>>
    Acceptance: <reviewer's ask, normalized>

  Thread: left unresolved, no reply posted.
  ```

Loop / workflow continues — this is a per-comment decision, not a stop condition.

### 3. Ambiguous → skip this comment, continue loop, NO reply

The feedback is genuinely unclear: multiple valid interpretations, a question rather than a request, or the right answer depends on design intent the reviewer hasn't spelled out.

**Ambiguity score 0–10** — only 9 or 10 count as ambiguous. 8 or below must pick in/out and proceed.

**Score 10 signals (certain ambiguity):**
- Comment is a question (`why ...?`, `is this intentional?`, `what about X?`)
- Reviewer explicitly asks for a design decision (`should we X or Y?`)
- Same fix attempted and failed 3 consecutive cycles

**Score 9 signals (near-certain):**
- Two mutually incompatible interpretations both fit the comment
- Comment references a file section the agent cannot locate confidently
- Fix requires knowledge the agent does not have (external constraint, user preference)

**Score ≤8 → NOT ambiguous** — commit to the best interpretation and proceed as in-scope or out-of-scope.

**Action (auto) for score ≥9:**
- **Do NOT** post any reply. No placeholder, no "looking into this".
- **Do NOT** resolve the thread.
- Add to the briefing:
  ```
  ### Ambiguous — needs human (score <N>/10)

  Comment: <quoted body>
  File: <path>:<line>
  Why ambiguous: <one-line reason>
  Possible interpretations:
    (a) <...>
    (b) <...>
  ```
- Loop **continues** processing other comments. This is per-comment, not a stop.

---

## Scope-confidence fallback

When you cannot confidently classify as in-scope or out-of-scope, **lean ambiguous** (skip + brief). Safer to leave a thread open than to post a wrong reply or grow scope.

---

## End-of-cycle briefing

Every auto-pr cycle that processed feedback must emit (to `~/.claude/ops/pr-<N>/log.md` AND to the user's next turn):

```
## <ISO timestamp> — review response cycle

**Auto-resolved (in-scope):**
| # | File:line | Fix | Commit |
|---|-----------|-----|--------|
| 1 | foo.rs:42 | added bounds check | abc1234 |

**Needs new Linear issue (out-of-scope):** <count>
<draft issue blocks>

**Ambiguous / needs human:** <count>
<ambiguous comment blocks>

**Next tick in:** 3 min
```

If all three sections are empty, emit nothing (silent tick).

---

## Loop termination

The auto-pr loop stops only on:
- PR merged / closed
- User says stop
- 30 consecutive silent ticks (90 min idle)
- Same in-scope fix attempt failing 3 cycles in a row (treat as ambiguous and surface)

Unresolved out-of-scope and ambiguous items do **not** stop the loop — they accumulate in the briefing. When the PR finally gets user attention, the briefing is the full handoff.

---

## Related

- [`shotloom-auto-pr`](../skills/shotloom-auto-pr/SKILL.md) — loop that applies this policy
- [`shotloom-respond-pr`](../skills/shotloom-respond-pr/SKILL.md) — manual flow; policy applies per-comment but approval gate is still in effect
- [`shotloom-linear-create-issue`](../skills/shotloom-linear-create-issue/SKILL.md) — user runs this manually on out-of-scope drafts from the briefing
