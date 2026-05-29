---
status: active
---

# Review-Finding Pattern Candidates

## Purpose

Capture reusable review, CI, or rule findings during Shotloom wrapup without
promoting them directly into the review catalog.

## Destination

| Field | Value |
|---|---|
| Local queue | `.agent-local/ah/operational-findings/YYYY-MM-DD/` |
| Inbox | `.agent-local/ah/operational-findings/YYYY-MM-DD/inbox.md` |
| Report directory | `.agent-local/ah/operational-findings/YYYY-MM-DD/reports/` |
| Capture script | `scripts/operational-findings-report.mjs` |

## Capture Rules

1. Resolve the Knitten checkout from agent-hub config before running scripts;
   wrapup is usually invoked from a Shotloom worktree, not from Knitten.
2. Capture through `scripts/operational-findings-report.mjs`; do not hand-edit
   the local daily index.
3. If capture fails, report the skip; do not block Linear or worktree cleanup.
4. Do not commit or push raw finding captures.

## Entry Shape

Write one report only when the PR has findings. The report is not a PR summary
and not a duplicate of the devlog `지적`; it is a reusable pattern candidate
captured for later triage.

| Field | Content |
|---|---|
| `Finding` | What the reviewer, CI, or rule actually pointed out. |
| `Why It Was Right` | The underlying engineering principle, generalized beyond the PR. |
| `General Rule` | A portable rule that can guide future implementation or review. |
| `Trigger` | Concrete signals that should make an agent check for this pattern next time. |
| `Fix Shape` | The smallest typical fix or test shape. |
| `Source Evidence` | `PR NNN`, reviewer type, file:line or check name; no private GitHub URLs. |

## Constraints

- Do not include private Shotloom PR URLs or markdown links.
- Do not include Branch / Worktree / Commit-list metadata.
- Do not summarize the feature.
- Do not write bare `#NNN` or `#word` inline tags, except intentional allowed
  tags already used by the destination doc.
- Prefer 1-3 high-signal patterns per PR; merge repetitive nits into one
  pattern.
- If the finding is too PR-specific to generalize, keep it in the day log only
  and skip the findings report.

## Manual Promotion

- Run `/ah-report-finding` for direct user-submitted operational findings.
- Run `/shotloom-promote-review-patterns` only for legacy entries already stored
  in `docs/briefings/shotloom/review-finding-patterns-inbox.md`.
- No scheduled automation is required by this skill.

## Example

```bash
knitten_root=$(
  jq -r '(.knitten.path? // ."agent-hub".path? // (if (.knitten | type) == "string" then .knitten else empty end) // (if (."agent-hub" | type) == "string" then ."agent-hub" else empty end) // empty)' \
    "$HOME/.claude/private/agent-hub-config/repo-paths.json" 2>/dev/null
)
if [ -z "$knitten_root" ]; then
  knitten_root=$(
    jq -r '(.knitten.path? // ."agent-hub".path? // (if (.knitten | type) == "string" then .knitten else empty end) // (if (."agent-hub" | type) == "string" then ."agent-hub" else empty end) // empty)' \
      "$HOME/.codex/private/agent-hub-config/repo-paths.json" 2>/dev/null
  )
fi

cd "$knitten_root"
node "$knitten_root/scripts/operational-findings-report.mjs" capture \
  --source wrapup-task \
  --context "shotloom PR 371" \
  --area workflow \
  --summary "Reviewer found that the status-ordering refactor had only single-terminal-event tests; future event-status precedence changes need competing correlated-event regression coverage." \
  --evidence "PR 371; review finding on apps/editor/src/components/debug/__tests__/StageImportDebugPanel.test.tsx:437"
```
