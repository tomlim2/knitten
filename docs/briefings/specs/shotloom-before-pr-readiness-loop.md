---
status: intake
created: 2026-05-27
updated: 2026-05-28
owner: agent-hub
spec: docs/plans/proposed/shotloom-before-pr-readiness-loop.md
---

# Spec Intake: shotloom-before-pr-readiness-loop

## User Request

Refactor Shotloom before-PR review into a readiness loop. Input is implemented
code on a branch. Output is `prReady: true | false`. `prReady=true` means no
blocker findings remain. Code review runs before docs review. Docs review starts
only after code review has no blocker findings. Add a separate mode-decision
skill before code review that returns whether triad review is needed.

## Goal

Define a skill architecture where before-PR review maximizes product-safe,
reviewable code before PR creation without owning GitHub PR creation, CI gates,
mergeability, or approval.

## Route

- selected route: `ah-manage-spec` create
- candidate routes: direct skill edit, `shotloom-draft-spec`
- delegated or referenced skills: `shotloom-review-before-pr`,
  `shotloom-review-code`, `shotloom-review-docs`, `shotloom-make-pr`

## Evidence To Read

| Type | Path or source | Reason |
|---|---|---|
| skill | `agent/skills/shotloom-review-before-pr/SKILL.md` | Current umbrella before-PR review entrypoint. |
| skill | `agent/skills/shotloom-decide-review-mode/SKILL.md` | Checklist owner for `needsTriad`. |
| skill | `agent/skills/shotloom-review-code/SKILL.md` | Current code-review execution surface. |
| skill | `agent/skills/shotloom-review-docs/SKILL.md` | Current docs-review execution surface. |
| reference | `agent/skills/shotloom-review-before-pr/references/REVIEW_MODE.md` | Existing single/triad decision logic. |
| reference | `agent/skills/shotloom-review-before-pr/references/PROCESS_POLICY.md` | Current process policy and finding handling. |
| rule | `agent/rules/shotloom.md` | Current Shotloom post-push review and PR rules. |
| skill | `agent/skills/shotloom-implement-code/SKILL.md` | Implementation and review-finding fix owner. |
| skill | `agent/skills/shotloom-make-pr/SKILL.md` | PR creation and CI-equivalent gate owner. |
| chat | Current conversation on 2026-05-27 | User-defined contract for before-PR readiness loop. |

## Known Decisions

- `shotloom-review-before-pr` input is implemented code on a branch.
- `shotloom-review-before-pr` output is `prReady: true | false`.
- Code review runs first.
- Docs review runs only after code review has no unresolved findings.
- Findings are individual output items.
- `false` means fix blocker findings and repeat the relevant review phase.
- `true` means proceed to `/shotloom-make-pr`.
- Non-blocking nits do not block `prReady=true`.
- After blockers are zero, one cheap nit polish pass is allowed.
- Review-mode decision belongs before code review and returns
  `needsTriad: true | false`.
- `shotloom-implement-code` owns source implementation and blocker fixes from
  specs or findings JSON.
- `shotloom-review-before-pr` does not own PR creation, CI gates, mergeability,
  GitHub mutation, or approval.

## Open Questions

- Output format decision: strict JSON, Markdown with a fixed table, or both.
- Docs schema decision: same normalized finding schema as code review or
  docs-specific schema.
- Whether a future script extracts objective checklist signals for
  `shotloom-decide-review-mode`.

## Exclusions

- No change to GitHub PR creation approval.
- No change to Shotloom CI-equivalent commands.
- No change to GitHub branch protection or repository settings.
- No change to Shotloom in-repo `docs/guidelines/` ownership.

## Validation Expected

- New spec exists under `docs/plans/proposed/`.
- Spec defines input/output for each skill boundary.
- Spec defines `prReady` true/false semantics.
- Spec places review-mode decision before code review.
- Design Plan includes ordered implementation stages.
- `git diff --check`
- `node scripts/validate-llm-first.mjs`
