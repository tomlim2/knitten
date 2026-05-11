---
status: open
created: 2026-05-11
load: triggered
trigger: implementing STL-358 Containerfile build smoke CI
repo: shotloom
linear: STL-358
---

# Containerfile build smoke CI — execution plan

## Intent

Catch v0.1.3-class regressions (nonroot image fails to boot, missing path, permission error at runtime) **at PR time, not at deploy time**. Add a lightweight CI job that builds `apps/editor/Containerfile` and runs the resulting image with an HTTP readiness check, on every PR that touches the Containerfile or `apps/editor/nginx.conf`.

What changes: a new GitHub Actions workflow file and one row in `WORKFLOW.md`.

What stays the same: prod build pipeline (`build-web-image.yml`), tag-driven release flow, Containerfile contents (no `HEALTHCHECK` directive injection), runner topology (still `cinev-runner`).

## Decisions (locked)

1. **Separate workflow `containerfile-smoke.yml`, not a step in `code.yml`.** Rationale: docker daemon / buildctl dependency in `code.yml` would affect every Rust/TS PR even when nothing in `apps/editor/Containerfile` changed. Path filter (`paths: ['apps/editor/Containerfile', 'apps/editor/nginx.conf', '.github/workflows/containerfile-smoke.yml']`) keeps the cost local to image-relevant PRs. Rejected: in-line step in `code.yml` (cost on every PR), in-line step in `build-web-image.yml` (publish workflow shouldn't run on PR).
2. **Self-hosted `cinev-runner` + `buildctl`.** Rationale: matches `build-web-image.yml` exactly — same builder image, same cache mount surface, same pin (`scripts/pin-buildctl.sh`). Rejected: `ubuntu-latest` + dockerd (different builder semantics, no cache sharing with prod build, drift risk).
3. **Health check via separate container spin-up, not Containerfile `HEALTHCHECK`.** Rationale: keeps the image surface unchanged. The smoke job pulls the just-built image, runs it with a random host port, polls `wget -q -O - http://localhost:<port>/` until it returns 200 or times out. Rejected: `HEALTHCHECK CMD wget …` in Containerfile (changes prod image, no value outside CI).
4. **`WORKFLOW.md` gets a one-line `## Testing` or new `## CI smoke` row.** Rationale: discoverability — future maintainers need to know which CI catches Containerfile breakage. `MAP.md` Release block does NOT change (deploy artifact path is unaffected).

## Acceptance

Derived from Linear Goal (no formal AC list on the issue):

- [ ] New workflow file `.github/workflows/containerfile-smoke.yml` lands.
- [ ] Workflow triggers on PR + push when `apps/editor/Containerfile` or `apps/editor/nginx.conf` change (path filter).
- [ ] Workflow runs on `cinev-runner` and reuses `buildctl` pin from `scripts/pin-buildctl.sh`.
- [ ] After build, the workflow runs the image and verifies HTTP 200 from `/` within a bounded timeout.
- [ ] Workflow fails if `docker build` fails OR if the readiness probe fails OR if the container exits before the probe succeeds.
- [ ] Reproduces the v0.1.3 failure: a hand-rolled commit that re-introduces the original `/var/run/nginx.pid`-only rewrite fails the smoke (verified locally or with a throwaway draft PR).
- [ ] `WORKFLOW.md` mentions the new smoke step.
- [ ] No regression on `code.yml`, `build-web-image.yml`, or other workflows (gate runs unchanged).

## File map

| File | Change kind | Note |
|------|-------------|------|
| `.github/workflows/containerfile-smoke.yml` | add | new workflow, single job |
| `WORKFLOW.md` | modify | add one row or short subsection |
| `apps/editor/Containerfile` | **no change** | locked decision #3 |
| `apps/editor/nginx.conf` | **no change** | only listed as trigger path |
| `scripts/pin-buildctl.sh` | reuse | called by the new workflow |

## Verification

1. **CI green.** `cargo`-side gates unchanged; new workflow runs alongside.
2. **Local pre-PR smoke** (optional but recommended): on the worktree, `docker build -f apps/editor/Containerfile .` then `docker run --rm -p 19093:8080` and `wget http://localhost:19093/` returns 200. Confirms the workflow's steps are runnable outside CI.
3. **Negative test.** Revert the d33cddf consolidation locally (re-introduce `/var/run/nginx.pid`-only rewrite), confirm the smoke job fails with a non-zero readiness probe. Discard the revert before push.
4. **Path filter sanity.** Trigger a no-op PR that touches an unrelated file (e.g. `README.md`) — workflow should NOT run.

## Open questions

1. **Readiness probe budget.** How long to wait before declaring failure — 30s? 60s? Self-hosted runners are fast; nginx cold start is sub-second; 30s with 1s poll feels right. Pick at implementation time.
2. **Image cleanup.** Self-hosted runner accumulates local images. Add `docker image rm` step at end-of-job, or rely on host-level GC? Default: add explicit cleanup step to keep the runner footprint bounded.
3. **CONTAINER port mapping.** Containerfile EXPOSE is `8080` (confirm at impl). Host port picks: random ephemeral via `docker run -p 0:8080` then `docker port` to discover, vs fixed high port. Random avoids collisions between concurrent jobs on the same runner.

## Related

- Trigger: STL-357 / PR #278 ryumiel nit #3 — "Manual repro is verification, not a regression guard."
- Reference workflow shape: `.github/workflows/build-web-image.yml` (uses cinev-runner + buildctl + scripts/pin-buildctl.sh).
- Adjacent rule: `docs/guidelines/code-review-guideline.md` §2 P2 (regression-test requirement on bug fixes).
- Day log retrospective: `[[shotloom/days/2026-05-11-nginx-pid-wrap]]` — the lesson this issue closes.
