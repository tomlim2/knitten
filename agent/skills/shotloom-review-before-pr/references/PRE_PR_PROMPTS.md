# Pre-PR Review Prompts

Reusable prompt bodies for `shotloom-review-before-pr`.

## Single Code Verification Preamble

```text
This is an independent verification pass after earlier fixes changed HEAD.
Use the code-review catalog as a verification checklist for current HEAD.
If the changed HEAD is test-heavy, start by verifying the in-repo
`review-rust.md` production-code sections and the skill-side Test Code Review
Lens before applying the rest of the supplementary patterns.
Review from a different angle than all earlier passes in this phase: confirm
previously reported P0-P2 issues are fixed, look for regressions introduced by
fixes, and report any pre-existing defect still visible in the current diff.
Re-run Review Axes Triage on current HEAD. Use the axes as a compact checklist:
correctness, regression risk, test coverage, data/state consistency, error
handling, API/contract consistency, security/safety, performance,
maintainability, and scope control. Then run the current `shotloom-review-code`
Phase 3a sub-pass catalog. Trigger only the sub-passes that match the changed
diff: Core correctness, Bridge contract, Boundary/domain, Test matrix, and
Asset/manifest/platform. Report each triggered sub-pass separately and list
non-triggered sub-passes as `N/A`.

The Shotloom in-repo review guidelines remain the authority; the axes and
sub-passes only reveal missed applications of those guidelines, directly
related ADRs, specs, bridge contracts, task issue acceptance criteria, or
skill-side patterns. Do not scan every Shotloom ADR, spec, bridge contract, or
issue for this verification pass. Default evidence depth is 2: inspect direct
evidence, then only the artifacts directly referenced by that evidence.
Escalate to Depth 3 only for protocol/schema/serialization/persistence
compatibility risk or a concrete contradiction found at Depth 2.
Run the promoted scope-control pattern: if commits, changed docs, fetched Linear
issues, or an existing PR body show that the diff combines multiple Linear
scopes, require the PR title/body and related issue list to say so explicitly,
or report a scope-truth-source finding. Source evidence: PR 384 review finding.
Re-run the Deep Adjacency pass on current HEAD using the same sub-pass grouping
from `shotloom-review-code`, including two-depth load/save/import paths, direct
consumers, bridge mirrors, fixtures, diagnostic wording, public helper exposure,
and migration/compatibility decisions for changed validation rejections.
Do not rely on the authoring session or on earlier pass conclusions; check
directly.
```

## Targeted Docs Brief

```text
You are a targeted Shotloom docs/comment reviewer. This is not a broad
cold-start docs audit. Stay near the implementation zone changed by the branch.

Read fresh:
1. `<worktree>/docs/guidelines/documentation-standard.md`
2. `<worktree>/docs/guidelines/code-review-guideline.md`
3. The installed `shotloom-review-docs/reference.md`; if unavailable, use
   `agent/skills/shotloom-review-docs/reference.md` from this repo. Read it
   only for targeted G/H/S checks that apply to changed prose.

Diff under review:
- Worktree: `<worktree>`
- Branch: `<branch>`
- File list: `git diff --name-only origin/main...HEAD`
- Content: `git diff origin/main...HEAD`

Related issue and decision context:
- Detect a Linear issue from the branch name, changed docs, or recent commit
  footers like `Related to STL-NN`. If a Linear connector is visible, fetch the
  issue and use its title, problem statement, acceptance criteria, affected
  modules, linked ADRs, linked specs, and linked bridge contracts as context.
  If Linear is unavailable, say so and continue from local branch/commit hints.
- Check related ADRs/specs/bridge contracts deliberately. Start from artifacts
  linked by Linear, PR/branch text, changed docs, changed code comments, or
  directly referenced specs/contracts. If no direct link exists, use exact
  implementation-zone keyword matches in the smallest relevant root
  (`docs/adr/`, `docs/specs/`, or `docs/ipc/`). Do not scan every ADR, spec,
  bridge contract, or unrelated issue just to fill the report.
- Default evidence depth is 2: Depth 0 is the changed prose/comment surface,
  Depth 1 is directly linked or exact-match evidence, and Depth 2 is artifacts
  directly referenced by Depth 1 evidence. Stop after Depth 2 unless a concrete
  contradiction is visible in the changed implementation zone. Escalate to
  Depth 3 only for protocol/schema/serialization/persistence compatibility risk
  or a concrete contradiction found at Depth 2.
- Treat code comments and rustdoc in changed or nearby implementation files as
  docs. Review them with the same previous-vs-current behavior standard as
  markdown docs.

Scope:
1. Identify changed docs/comments/rustdoc/prose in the diff.
2. Extract implementation-zone keywords from changed code and docs. Include
   domain terms, diagnostic codes, cache/version strings, function names, and
   behavior words. Examples: `normalize_vrm`, `axis-bake`, `humanoid`,
   `inverseBindMatrices`, `skin`, `cache`, `VRM 0.x`, `VRM 1.x`,
   `normalized_vrm_axis_bake`.
3. Search only nearby related docs/comments/evidence for those terms. Prefer
   changed files first, then directly related ADRs, specs, bridge contracts,
   guidelines, and architecture pages. Do not run a repository-wide prose audit
   except for exact diagnostic/code/path references introduced by the diff.
4. Compare previous wording against current wording:
   - What did the pre-branch text imply before?
   - What does the branch now claim?
   - Is there stale contrast, future-tense, old behavior, or an incomplete
     replacement near the same topic?
5. Use actual review findings from the selected main review as inspiration for
   targeted terms. For example, if the main review discussed malformed skins,
   inverse-bind metadata, cache versioning, or best-effort skips, check whether
   docs/comments now describe that boundary accurately.
6. Run the local-absolute-path exposure check on the changed files and any
   changed durable metadata (docs, manifests, fixtures, examples, scripts):
   search for `/Users/`, `/home/`, `C:\`, `D:\`, `Downloads/`, `Desktop/`,
   and machine-specific checkout roots. Treat a committed local machine path
   as P1 when it appears in source, docs, manifests, fixtures, generated
   examples, or PR-ready prose. Allow only intentionally local runtime config,
   `.gitignore`d private files, or clearly home-relative harness paths such as
   `~/.claude/...`.

Report only actionable mismatches in the changed/related zone. This is a
pre-PR review, so PR-body-only requirements are N/A unless an existing PR body
is explicitly available.

Output:
## Docs review - branch <branch>

### Applicability
- Targeted terms searched: ...
- Context sources checked: Linear issue/ACs, directly related ADRs/specs/bridge
  contracts, changed comments/rustdoc, related docs, with unavailable sources
  called out.
- Files checked: ...

### Findings
- clean, OR findings with P0/P1/P2/P3 priority and source rule/pattern.

### Previous vs Current Notes
- Briefly list any important changed meaning that was verified as coherent.

### Recommendation
- clean / nit-only / P0-P2 remains.
```

## Docs Verification Preamble

```text
This is an independent verification pass after earlier docs fixes changed
HEAD. Use the targeted docs brief as a verification checklist for current
HEAD. Review from a different angle than all earlier docs passes: confirm
previously reported P0-P2 issues are fixed, look for regressions introduced by
fixes, and report any stale previous-vs-current wording still visible around
the changed implementation zone. Do not rely on the authoring session or on
earlier pass conclusions; check directly.
```
