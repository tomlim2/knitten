# shotloom-respond-pr reference

Detail for the shotloom-respond-pr skill. SKILL.md holds the happy path and critical rules (Step 6 approval, thread resolution policy, Step 4.5 pattern capture filters). This file holds graphql queries, reply templates, and long-form rationale.

---

## Step 3 — feedback item table (example)

```
## Review Feedback — PR #<N>

| # | Source | File | Line | Summary |
|---|--------|------|------|---------|
| 1 | inline | docs/adr/adr-0025.md | 77 | Wrong file path for build_from_bytes |
| 2 | inline | docs/tech-debt/vrm-rest.md | 21 | Typo SS3 → §3 |
| 3 | suppressed | vrm_extract.rs | 846 | Unchecked indexing on untrusted input |
| ... | | | | |
```

- **inline** = review comments with `id` — repliable directly
- **suppressed** = low-confidence items from review body — reply on review itself or as top-level if needed

---

## Step 5 — commit message template

```
fix(docs): address PR #<N> review feedback

- <item 1 summary>
- <item 2 summary>

Related to STL-NN
```

Follows `docs/guidelines/commit-guideline.md`: conventional commits, imperative mood, ≤80 char subject, lowercase type + scope, no trailing period.

---

## Step 6 — drafted replies batch format

```
## Draft Replies

### Comment #1 (id: 3091862347) — adr-0025:77
> Fixed in abc1234. Updated `From` column from `vrm_extract.rs` to `vrm_rest.rs`.

### Comment #2 (id: 3091862400) — tech-debt:21
> Fixed in abc1234. Corrected `SS3` to `§3`.

Post these replies? (yes/no)
```

Wait for explicit approval. NEVER auto-post.

---

## Step 7 — graphql thread-resolution queries

Get thread IDs (map comment databaseId → thread id):

```bash
gh api graphql -f query='query {
  repository(owner: "CINEV", name: "shotloom") {
    pullRequest(number: <N>) {
      reviewThreads(first: 50) {
        nodes { id isResolved comments(first:1) { nodes { databaseId } } }
      }
    }
  }
}'
```

Resolve one thread:

```bash
gh api graphql -f query='mutation {
  resolveReviewThread(input: {threadId: "<PRRT_...>"}) {
    thread { isResolved }
  }
}'
```

---

## Step 4.5 — Pattern-capture filter rationale

Why not add a pattern for every fix:
- **Add** when the rule is grep-able / greppable against any future diff and a senior reviewer would have caught it mechanically.
- **Skip** when the fix is ad-hoc (rename for clarity, data typo, local semantic bug without recurring shape).

Adding noise patterns trains Claude to over-apply the checklist and surface false-positives in `/shotloom-review-before-pr`.

---

## Step 9 — final summary template

```
## Summary

| # | File | Status | Linear | Thread | Reply |
|---|------|--------|--------|--------|-------|
| 1 | adr-0025.md:77 | fixed | — | resolved | posted |
| 2 | tech-debt:21 | fixed | — | resolved | posted |
| 3 | vrm_extract.rs:846 | deferred | STL-NN | resolved | posted |
| 4 | foo.rs:42 | disagreed | — | open | posted |

Re-requested review from: @reviewer1
```
