---
title: "Release Web Workflow — Execution Plan"
tags:
  - type/spec
  - project/shotloom
  - area/ci
  - status/draft
date: 2026-05-06
source: claude-code
---

# Release Web Workflow — Execution Plan

Author: prepared by Claude session 2026-05-06. Hand off to next session or
human implementer. Originally drafted at
`shotloom-github/.superpowers/docs/plans/release-web-workflow.md` (gitignored);
mirrored here for review.

## 1. Goal

Add a manual GitHub Actions workflow that builds the Shotloom web bundle
(`apps/editor/dist`) and packages it as artifacts attached to a GitHub
Release. This is the first release pipeline for Shotloom.

Out of scope for this plan:

- Cloudflare Workers / Pages hosting (deferred until the team provides
  the worker / account).
- `wasm-opt` size optimization (deferred to a follow-up PR that adds a
  `build:wasm:release` script — see §7).
- Automated triggers (tag push, scheduled). Manual `workflow_dispatch`
  only for the first iteration; convert to tag-driven once the manual
  flow is proven.
- macOS / Tauri desktop release. Web-only for now.

## 2. Decisions (locked)

| # | Decision | Rationale |
|---|----------|-----------|
| D1 | Manual `workflow_dispatch` only | "잘 되는 거 보고 자동" — user direction. Tag-driven is a follow-up. |
| D2 | Web target only | User direction; desktop dual-surface (ADR-0019) only stable on macOS, separate concern. |
| D3 | First version `v0.1.0` | Matches root `Cargo.toml` workspace version. Tauri / editor `package.json` versions are not synchronized in this PR. |
| D4 | GitHub draft prerelease as the only release sink | No hosting deploy. zip + tar.gz + SHA-256 checksum attached to a draft prerelease first. Human reviews before publishing. |
| D5 | Single job, no split build-wasm / build-web | Simpler failure surface for first iteration. The reference pattern (`topheman/bevy-rust-wasm-experiments`) splits for caching, but `pnpm build:web` already chains `build:wasm` + Vite. |
| D6 | Use `scripts/build-wasm.mjs` via `pnpm build:web` | Repo's standardized wasm-pack invocation. `RUSTFLAGS=--cfg=web_sys_unstable_apis` is set inside the script. |
| D7 | `wasm-pack`, not raw `wasm-bindgen-cli` | Repo standard. `taiki-e/install-action` for installation (consistent with `code.yml`). |
| D8 | Default `--no-opt` (no `wasm-opt`) for first release | Isolate failure causes. Adding `wasm-opt` is a separate concern. |
| D9 | No Cloudflare placeholder in workflow | Worker not yet provisioned. Adding step / commented placeholder both invite drift. Add fresh in a follow-up PR. |
| D10 | No GitHub Pages deploy | COOP/COEP custom headers are required for the editor (see `apps/editor/vite.config.ts:85-86`). GitHub Pages does not support custom response headers, so a Pages URL would have subtly broken WebGPU / SharedArrayBuffer paths. Worse than no URL. |
| D11 | No custom `ref` input in the first workflow | A separate build-ref input creates ambiguity with the workflow dispatch ref. The first release path should run from `main` and tag the exact checked-out commit. |
| D12 | External-user artifacts include checksum and serving notes | External users may download the artifacts, so the release must attach a `.sha256` file and document secure-context plus COOP/COEP requirements. |

## 3. File to add

`.github/workflows/release-web.yml`

```yaml
name: Release Web

on:
  workflow_dispatch:
    inputs:
      version:
        description: "Release version (must start with v, e.g. v0.1.0)"
        required: true
        default: v0.1.0
      create_release:
        description: "Create a draft prerelease and attach artifacts"
        type: boolean
        required: true
        default: true

permissions:
  contents: write

concurrency:
  group: release-web-${{ inputs.version }}
  cancel-in-progress: false

env:
  CARGO_TERM_COLOR: always
  CARGO_INCREMENTAL: 0

jobs:
  release-web:
    name: Build & package web release
    runs-on: ubuntu-latest
    timeout-minutes: 45
    steps:
      - uses: actions/checkout@v6
        with:
          fetch-depth: 0

      - name: Capture build commit
        id: build-ref
        run: echo "sha=$(git rev-parse HEAD)" >> "$GITHUB_OUTPUT"

      - name: Validate version input
        env:
          VERSION: ${{ inputs.version }}
        run: |
          if [[ ! "$VERSION" =~ ^v[0-9]+\.[0-9]+\.[0-9]+(-[0-9A-Za-z.-]+)?$ ]]; then
            echo "::error::version must be SemVer prefixed with 'v' (got: $VERSION)"
            exit 1
          fi

      - name: Restore LFS cache
        uses: ./.github/actions/restore-lfs-cache

      - name: Pre-flight — release does not already exist
        if: inputs.create_release
        env:
          GH_TOKEN: ${{ github.token }}
          VERSION: ${{ inputs.version }}
        run: |
          if gh release view "$VERSION" --json tagName >/dev/null 2>&1; then
            echo "::error::Release $VERSION already exists"
            exit 1
          fi
          if git rev-parse "refs/tags/$VERSION" >/dev/null 2>&1; then
            echo "::error::Tag $VERSION already exists locally"
            exit 1
          fi

      - uses: dtolnay/rust-toolchain@stable
        with:
          targets: wasm32-unknown-unknown

      - uses: taiki-e/install-action@v2
        with:
          tool: wasm-pack

      - uses: pnpm/action-setup@v4
        with:
          version: 10.0.0

      - uses: actions/setup-node@v6
        with:
          node-version-file: .nvmrc
          cache: pnpm
          cache-dependency-path: pnpm-lock.yaml

      - name: Install JS deps
        run: pnpm install --frozen-lockfile

      - name: Build web bundle
        run: pnpm build:web

      - name: Package artifacts
        id: pkg
        env:
          VERSION: ${{ inputs.version }}
          BUILD_SHA: ${{ steps.build-ref.outputs.sha }}
        run: |
          NAME="shotloom-web-${VERSION}"
          mkdir -p dist-release
          tar -C apps/editor/dist -czf "dist-release/${NAME}.tar.gz" .
          (cd apps/editor/dist && zip -qr "../../../dist-release/${NAME}.zip" .)
          (cd dist-release && sha256sum "${NAME}.tar.gz" "${NAME}.zip" > "${NAME}.sha256")
          {
            echo "# Shotloom Web ${VERSION}"
            echo
            echo "This is a draft prerelease for the Shotloom web bundle built from ${BUILD_SHA}."
            echo
            echo "## Distribution"
            echo
            echo "- No hosted URL is provided by this release."
            echo "- Download either the zip or tar.gz artifact and serve it from a static host."
            echo "- Verify downloads with the attached SHA-256 checksum file before redistribution."
            echo
            echo "## Serving Requirements"
            echo
            echo "The web editor requires a secure context: HTTPS in deployed environments or localhost for local testing."
            echo
            echo "Set these response headers on the static host:"
            echo
            echo '```'
            echo "Cross-Origin-Opener-Policy: same-origin"
            echo "Cross-Origin-Embedder-Policy: require-corp"
            echo '```'
          } > "dist-release/${NAME}-release-notes.md"
          ls -lah dist-release
          echo "name=${NAME}" >> "$GITHUB_OUTPUT"
          echo "notes=dist-release/${NAME}-release-notes.md" >> "$GITHUB_OUTPUT"

      - uses: actions/upload-artifact@v4
        with:
          name: ${{ steps.pkg.outputs.name }}
          path: dist-release/*
          if-no-files-found: error
          retention-days: 30

      - name: Create draft prerelease
        if: inputs.create_release
        env:
          GH_TOKEN: ${{ github.token }}
          VERSION: ${{ inputs.version }}
          BUILT_SHA: ${{ steps.build-ref.outputs.sha }}
          NOTES_FILE: ${{ steps.pkg.outputs.notes }}
        run: |
          gh release create "$VERSION" \
            --target "$BUILT_SHA" \
            --title "$VERSION" \
            --draft \
            --prerelease \
            --generate-notes \
            --notes-file "$NOTES_FILE" \
            dist-release/*.tar.gz \
            dist-release/*.zip \
            dist-release/*.sha256
```

## 4. Why this shape

- `workflow_dispatch` stays manual-only. The custom `ref` input is removed so
  the workflow does not have two competing refs. The release should be run from
  `main`; if a future release needs arbitrary refs, add that deliberately with
  explicit docs.
- `permissions: contents: write` — required to create tag + Release via
  `gh release create`. No other write scope needed.
- `concurrency: release-web-<version>` with `cancel-in-progress: false`
  — prevents two concurrent runs against the same version, but never
  cancels an in-progress release mid-way.
- Checkout happens before validation so the workflow can capture the exact
  built commit with `git rev-parse HEAD`. `gh release create --target` uses
  that captured SHA, not `GITHUB_SHA`, because `workflow_dispatch` and manual
  checkout choices can otherwise diverge.
- Version validation regex — SemVer with leading `v`, optional
  pre-release suffix (`v0.1.0-rc.1`). Inputs are passed into shell steps through
  `env` and referenced as shell variables.
- Pre-flight existence check — fail fast if the tag/release already
  exists, before doing the long build.
- LFS via the existing `./.github/actions/restore-lfs-cache` composite
  — same path used by `code.yml`.
- `dtolnay/rust-toolchain@stable` — `rust-toolchain.toml` is respected
  for components, but `targets:` must be passed explicitly.
- Node from `.nvmrc` + pnpm 10.0.0 — matches `package.json`, `.nvmrc`, and
  `code.yml`.
- Single `pnpm build:web` — chains `pnpm build:wasm` (which calls
  `scripts/build-wasm.mjs` → `wasm-pack build --target web --no-opt`)
  and Vite build for `@shotloom/editor`.
- The Release is created as both `--draft` and `--prerelease` because external
  users may download artifacts, but this is still the first manual web release
  and has no hosted URL.
- A `.sha256` checksum file is attached alongside zip and tar.gz so external
  recipients can verify downloads before redistribution.
- Generated release notes are prepended with explicit distribution and serving
  requirements: no hosted URL, HTTPS or localhost secure context, COOP
  `same-origin`, and COEP `require-corp`.

## 5. Pre-merge checks (run locally before opening PR)

- [ ] `pnpm validate:rust` — fmt + clippy
- [ ] `pnpm build:web` succeeds locally on the branch
- [ ] `node scripts/validate-doc-paths.mjs` if docs change
- [ ] Check workflow syntax with `actionlint` if available locally
- [ ] After merge, hand-run the workflow from `main` with
      `version=v0.1.0-test`, `create_release=false` to confirm the
      build + artifact upload path before any GitHub Release is created
- [ ] Then run from `main` with `version=v0.1.0`, `create_release=true` to
      create a draft prerelease
- [ ] Inspect the draft prerelease assets, checksums, release notes, and target
      commit before publishing it manually

The workflow itself does not need to be exercised by `code.yml` — it's
manual-only. CI fmt/clippy/test on the workflow file change is enough.

## 6. PR shape

- Branch: `chore/release-web-workflow` (no `STL-NN` prefix per
  Shotloom's branch naming policy).
- Commit type: `ops(ci)` — `ops` is the repo's Conventional Commit type for
  CI/CD, deployment, backup, recovery, or infrastructure work.
- PR title: `ops(ci): add manual web release workflow`.
- PR body: use the expanded PR template. Include the locked decisions from §2,
  the draft/prerelease behavior, and the external-user serving requirements.
- Expected files:
  - `.github/workflows/release-web.yml`
  - a small `WORKFLOW.md` update describing how to run and publish the draft
    prerelease
- Related Issues: `No issue: first web release workflow preparation` unless a
  Linear issue is created before implementation.
- No unit tests required — workflow files are not covered by the project's unit
  test rule. Prefer syntax validation plus the manual `create_release=false`
  run after merge.

## 7. Follow-up PRs (not in this plan)

1. **`build:wasm:release` script** — adds `--opt` (wasm-opt) and
   exposes a separate npm script. Workflow then calls
   `pnpm build:web:release`. Keep this isolated so a wasm-opt
   regression is debuggable.
2. **Cloudflare hosting deploy step** — add `wrangler deploy` after the
   artifact upload, gated on a new `deploy_cloudflare` input, once the
   account / API token / `wrangler.toml` exists. Requires
   `not_found_handling: "single-page-application"` for SPA routing and
   header config to preserve COOP `same-origin` + COEP `require-corp`.
3. **Tag-driven trigger** — add `push: tags: ['v*']` once the manual
   flow has been used at least 2-3 times without manual intervention.
4. **Tauri desktop release** — separate workflow
   (`release-desktop.yml`) targeting `macos-latest`. Out of scope here.
5. **Version sync** — decide whether `apps/editor/package.json` and
   Tauri config version should be derived from `Cargo.toml` workspace
   version at build time, or kept manually aligned. Currently
   `Cargo.toml=0.1.0`, Tauri=`0.1.0`, editor=`0.0.1`.
6. **Arbitrary build refs** — if release operators need to build tags or
   non-main branches, add a ref input later with explicit documentation for
   workflow execution ref vs checkout ref vs release target SHA.

## 8. Risks and acceptance

| Risk | Mitigation |
|------|------------|
| Wrong commit tagged | Remove custom `ref` input and tag the captured post-checkout `git rev-parse HEAD` SHA. |
| First-time `gh release create` permissions issue | `permissions: contents: write` is set. If branch protection blocks tag creation, surface and fix via repo settings. |
| WASM build fragility from cache reuse | Single job, no Cargo cache reuse. First release accepts the cold-build time as the price of determinism; timeout is 45 minutes. |
| LFS asset gap | Reuses the same composite action as `code.yml`; if `code.yml` is green on the branch, the release workflow's LFS step is also green. |
| Artifact misuse | Draft prerelease notes explicitly state there is no hosted URL, require checksum verification, and document secure-context plus COOP/COEP serving requirements. |
| Premature publication | Release is created as `--draft --prerelease`; a human must inspect assets and notes before publishing. |

Acceptance: workflow runs on `main` with `version=v0.1.0`,
`create_release=true`, and produces a **draft prerelease** `v0.1.0` with three
attached files (`shotloom-web-v0.1.0.tar.gz`, `shotloom-web-v0.1.0.zip`, and
`shotloom-web-v0.1.0.sha256`) tagged at the exact commit that was built. No
hosting URL is created. The draft notes clearly explain serving requirements
for external users.

## 9. Reference workflows surveyed

- `topheman/bevy-rust-wasm-experiments` — Rust + Bevy + wasm-bindgen +
  wasm-opt + Vite, deployed to Vercel. Splits `build-wasm` and
  `build-www` jobs with `actions/cache` between them. Pattern source
  for the build steps; we collapse to a single job for the first
  iteration.
- `mate-h/bevy-webgpu` — reference for the WebGPU + Vite + Bevy stack
  shape; no CI to copy.
- Cloudflare `cloudflare/wrangler-action@v3` — reference for the
  future hosting step; not used in this plan.
- Existing `.github/workflows/code.yml` — source for the LFS composite
  action, `taiki-e/install-action` pattern, `actions/checkout@v6`
  version pinning.
