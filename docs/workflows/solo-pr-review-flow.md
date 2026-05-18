---
status: accepted
---

# Solo PR Review Flow

Use this workflow for Knitten changes when the repository is operated by a solo
maintainer and GitHub cannot record self-approval.

## Rule

Self-approval is not a valid gate. A solo PR may merge when:

- required automated checks pass;
- the PR includes an objective review result;
- the review result is `no requested changes`, or all requested changes have
  been fixed and rechecked.

If GitHub blocks `Approve` because the PR author and reviewer are the same
account, leave a PR comment with the review result instead.

## Flow

1. Create a branch or worktree for the change.
2. Open a PR for non-trivial work.
3. Run local validation before pushing:
   - `git diff --check`
   - `node scripts/validate-llm-first.mjs`
4. Review the PR diff objectively against the owning spec, repo rules, and
   validation output.
5. Record one review result on the PR:
   - `no requested changes`
   - `changes requested`
   - `blocked`
6. Merge only after checks pass and the review result allows merge.

## Branch Protection

For solo repositories, prefer required status checks over required approving
reviews. Repositories that require independent human approval should keep that
policy and treat this document as non-authoritative reference.

## Review Comment Template

```markdown
Objective review complete: <no requested changes | changes requested | blocked>.

Checked:
- Scope:
- Validation:
- Risk and cleanup:

Notes:
-
```
