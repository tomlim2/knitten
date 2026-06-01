# Asset-Library PR Review Checklist

Load this reference after `shotloom-review-asset-library-pr` resolves the PR and
creates the detached review worktree.

## Required Repo Docs

Always read from the review worktree:
- `AGENTS.md`
- `README.md`
- `MAP.md`
- `docs/guidelines/code-review-guideline.md`
- `docs/guidelines/documentation-standard.md`
- `docs/guidelines/pr-guideline.md`
- `contracts/source-catalog.schema.json`

Load conditional context:
- Root docs changed: read `README.ko.md`, `MAP.ko.md`, and the paired English or
  Korean companion for any touched root doc.
- `source/catalog.source.json` or `assets/` changed: read
  `docs/guidelines/source-catalog-authoring.md`,
  `docs/specs/editor-dist-catalog-contract.md`,
  `docs/specs/local-static-output-contract.md` when present, plus
  `.gitattributes`. If those detailed docs are absent in the reviewed head,
  fall back to `docs/guidelines/code-review-guideline.md`,
  `contracts/source-catalog.schema.json`, and the build/verifier tests.
- `.github/workflows/`, CI/CD docs, scripts, or PR automation changed: read the
  touched workflow files and owning docs such as
  `docs/guidelines/pr-review-slack-alerts.md` when present. If no owning
  workflow doc exists, review against the touched workflow, package scripts,
  PR guideline, and current GitHub check behavior. Check official GitHub
  documentation only when workflow semantics are uncertain or current behavior
  matters.
- Editor contract affected: compare against the configured main Shotloom repo's
  `apps/editor/src/assetLibrary/` files and relevant fixtures/tests.
- Asset-server, S2M materialization, remote catalog delivery, or Shotloom
  consumer behavior affected: read these when present:
  Knitten `docs/briefings/shotloom/s2m-asset-materialization-readiness.md`,
  Knitten `docs/plans/proposed/s2m-asset-materialization-readiness.md`,
  Shotloom `docs/specs/asset-library.md`, and Shotloom
  `contracts/asset-library/README.md`.
  If the local Knitten briefing/plan files are absent, use the Shotloom spec
  and contract docs as the authority and report the missing local checklist as
  review context debt, not as a PR blocker.

Also read Knitten review rules:
- `agent/rules/pr-comment.md`
- `agent/rules/pr-mutate.md`
- `agent/rules/git-defaults.md`
- `agent/rules/verify-before-report.md`

## Required Gates

Always run:

```bash
git -C "$review_dir" diff --check "origin/$base...HEAD"
pnpm test
```

When catalog, assets, output contracts, or docs that describe generated output
changed, also run:

```bash
pnpm build
pnpm serve
pnpm verify:local
```

Stop the local server after verification.

When asset bytes changed, run:

```bash
git lfs fsck
git lfs ls-files --long
git check-attr filter diff merge text -- <asset-files>
file <asset-files>
ls -lh <asset-files>
```

If the PR claims bytes were copied from a fixture or upstream asset, compare
hashes with `shasum -a 256`.

## Priority Checklist

1. P0 asset/catalog correctness: source paths exist, IDs are unique and stable,
   `kind`, `import_kind`, extensions, thumbnails, and generated SHA/size fields
   match real bytes.
2. P1 static output/editor contract: catalog channel URLs, content types,
   cache/CORS assumptions, supported fields, and cap names match the Shotloom
   editor contract.
3. P1 LFS integrity: binary asset extensions are LFS-tracked, source bytes are
   not text-normalized, and generated output does not hide broken pointers.
4. P2 tests/gates: build, local verifier, negative cases, and CI checks cover
   the behavior being changed.
5. P2 docs/operations: English/Korean root docs stay paired, PR body reflects
   the actual diff and tests, and workflow changes have durable docs.
6. P3 nits: only after blocking risks are exhausted.

## Asset-Server Boundary Checklist

Use this when the PR touches or implies an asset-server path, S2M materialization,
remote catalog delivery, or Shotloom consumer integration:

- The PR states whether Shotloom or the asset server owns S2M fetch,
  normalization, source asset lookup, provenance, and placement-ready payloads.
- The debug entry selects exactly one input source: raw S2M document,
  asset-server package, or hand-authored/static fixture.
- Server-to-Shotloom payloads have an explicit contract for normalized map id,
  document id, placements, transforms, display names, provenance, and asset
  references or staged candidates.
- Shotloom does not reinterpret S2M when the chosen design says the asset
  server owns normalization.
- Local static producer mode remains opt-in and does not become a default CI or
  development dependency.
- The asset-library contract still rejects dynamic asset-server assumptions
  unless an approved future slice defines that API.
- Remote or hosted delivery preserves URL policy, CORS/CORP, content type,
  content length, SHA-256 digest, byte cap, redirect rejection, and no-credential
  fetch expectations.
- Saved bundles do not persist remote URLs as asset resolution targets; bundle
  materialization must end in bundle-local bytes or stay unavailable.

## Recent Review Reminders

- Treat stale PR bodies that misstate workflow, tests, or operational scope as
  review findings until corrected.
- Head changes invalidate prepared review payloads.
- Current checkout dirt is informational unless it affects the review worktree.
- `APPROVE` means no blockers remain and the user explicitly asked to approve.
- Prefer inline review comments on changed lines; use review body only for
  summary or findings that cannot be anchored.
