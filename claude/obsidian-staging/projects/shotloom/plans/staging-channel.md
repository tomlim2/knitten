---
title: STL-327 staging channel separation — execution plan (alpha-deferred)
tags:
  - type/topic
  - project/shotloom
  - area/ci
  - lib/github-actions
date: 2026-05-11
source: STL-327 backlog snapshot
---

# Staging channel separation — execution plan (alpha-deferred)

**Status:** parked at backlog 2026-05-11. Worktree and local/remote branches torn down (snapshot section captures what was already built). Resume when alpha exits and there is a real prod surface to protect.

**Why parked:** alpha has no real prod traffic — "prod" is the alpha. The PR-A goal (prevent staging builds from touching the prod manifest) and the `hon454` SemVer-overload nit are both correct in principle but solve a theoretical risk for the current operational reality. STL-358 (image-build CI smoke step) is the higher-value adjacent infra work for alpha. STL-291 / STL-296 use the same "post-alpha deferred" pattern.

## Scope reference

Linear STL-327. Parent umbrella STL-323 (PR-A split). Sibling splits: STL-325 (PR-C robustness), STL-326 (PR-B builder perf). Source of the follow-up: PR #253 round 1 review by `hon454` (2026-05-07). External repo: `CINEV/prototype-manifest`.

## What is already built (snapshot of `feat/web-add-staging-channel` @ 2757b32, torn down 2026-05-11)

Commit message verbatim (preserved here because the branch is gone):

```
feat(web): split staging from prod via staging-* tag prefix

Add a second deploy channel to the web image build workflow so QA /
staging builds can ship without touching the prod manifest.

Workflow (.github/workflows/build-web-image.yml):
- on.push.tags accepts both v* and staging-* prefixes
- Validate version accepts SemVer (prod) or staging-<slug> (staging);
  staging-* via workflow_dispatch is rejected so the staging git tag
  remains the durable record of what shipped
- New Resolve channel step computes channel + manifest path once and
  exposes them as job outputs
- update-manifest reads the channel-selected manifest path from outputs
  and stamps the channel into the manifest commit message

Docs:
- WORKFLOW.md ## Deploying: Trigger table now shows the manifest path,
  staging row added, validation paragraph and pipeline-stage prose
  updated
- MAP.md ## Release and deployment: staging manifest path added next
  to prod

Paired manifest changes (CINEV/prototype-manifest, shotloom-staging-channel
branch): shotloom/staging/{deployment,service,ingress}.yaml under
namespace internal-service-staging at host staging.shotloom.cinamon.io.
Must merge before this PR so staging-* tag pushes find the manifest.
```

Diffstat: `.github/workflows/build-web-image.yml` +62, `MAP.md` +3, `WORKFLOW.md` +47.

Paired manifest (separate repo): `CINEV/prototype-manifest` branch `shotloom-staging-channel`, files `shotloom/staging/{deployment,service,ingress}.yaml`, namespace `internal-service-staging`, host `staging.shotloom.cinamon.io`.

## Resume gate — verify before reopening the worktree

Run these in order on alpha-exit. Stop if anything fails — the snapshot may have rotted.

1. **Workflow file still has the same shape.** `git -C shotloom log -- .github/workflows/build-web-image.yml` — if the prod path has been restructured (channel logic, validate-version step, update-manifest step), the snapshot's diff no longer slots in cleanly and the split has to be redesigned against the new shape, not rebased.
2. **`hon454` nit still applies.** Re-read PR #253 review thread. Confirm the SemVer-overload concern still stands and no other channel signal has been introduced in the meantime (e.g. branch-based deploy, environment input, image-tag-based channel).
3. **Operations team has agreed on the staging cluster surface.** Namespace `internal-service-staging` + host `staging.shotloom.cinamon.io` are the snapshot's assumption. Resume only after explicit OK on namespace, replica count, resource limits.
4. **STL-358 has landed (or is explicitly out-of-scope).** image-build CI smoke is the same workflow file. If STL-358 lands first, this split rebases on top of it cleanly; if not, decide whether to bundle.

## Acceptance — STL-327 original list (kept verbatim)

- [ ] Trigger prefix decided (`staging-*` recommended), PR body cites rejected candidates
- [ ] Workflow `on.push.tags` adds new prefix, validation step updated
- [ ] `update-manifest` step branches manifest path by trigger
- [ ] (optional) `workflow_dispatch.channel` input added
- [ ] `prototype-manifest` paired PR — `shotloom/staging/deployment.yaml` (+ service / ingress) created, cross-linked
- [ ] `WORKFLOW.md ## Deploying` Trigger table gets staging row, manifest path branching documented
- [ ] `MAP.md` Release and deployment block adds staging manifest path (external repo)
- [ ] Staging tag push verifies end-to-end (prod manifest unchanged)
- [ ] `v*` prod path zero regression
- [ ] CI passes

## Re-entry workflow

1. Open `/shotloom-start-code STL-327` — re-fetches Linear, re-reads conventions, re-scans ADRs. This snapshot is *not* a substitute for that step.
2. Run the four-item Resume gate above.
3. Create a fresh worktree from current `main`. Do NOT try to restore the torn-down branch from reflog — the snapshot is durable here; the dead branch SHA carries no extra value.
4. Re-implement the workflow split from the commit message above, adapting to whatever shape `build-web-image.yml` has at re-entry time.
5. Land the paired `prototype-manifest` PR **first** (operations side) so `staging-*` tag push has a manifest to write to. Cross-link both PRs.
6. Validate with a real `staging-2026-XX-XX` tag push end-to-end before requesting review.

## Trigger-prefix decision (locked unless ops vetoes)

Recommended: `staging-*`. Format: `staging-YYYY-MM-DD[-slug]` (e.g. `staging-2026-05-07`, `staging-2026-05-07-thumb-fix`).

Rejected:
- `v0.x.y-rc.N` — overloads SemVer pre-release (means *prod release candidate*, not *staging build*). Semantically wrong per `hon454`.
- `preview-*` — leans toward short-lived per-PR preview environments. Out of scope; that's a different feature.
- `dev-*` — weakest staging signal; collides with "developer-local" connotation.

## Related

- Walkthrough log (作업 일지 + 용어 사전): `[[shotloom/learnings/staging-channel-walkthrough]]`
- Parent umbrella: STL-323 (PR-A is this issue)
- Sibling splits: STL-325 (PR-C, post-merge), STL-326 (PR-B, builder perf)
- Adjacent alpha-priority: STL-358 (image-build CI smoke — bigger payoff in alpha)
- Reference reading: [Implementing Preview Environments with GitOps in Kubernetes (vcluster)](https://www.vcluster.com/blog/implementing-preview-environments-with-gitops-in-kubernetes)
- Post-alpha-deferred siblings (precedent pattern): STL-291, STL-296
