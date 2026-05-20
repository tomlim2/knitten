---
status: ready
created: 2026-05-20
updated: 2026-05-20
load: triggered
trigger: STL-418
repo: shotloom
linear: STL-418
spec: ../../plans/proposed/editor-add-dev-router-navigation.md
---

### Shotloom coding mode - ts

**Issue:** STL-418 `feat(editor): dev 라우터 추가 및 네비게이션 정리`

**Problem:** Editor development and verification surfaces are still tied to an
ad hoc debug sidebar, and the main editor has no shared left navigation that can
switch between normal editor menus and development tools. Before a later URL
rename, Shotloom needs a common left navbar with a Main/Dev mode switch. Dev
mode continues to use `/debug/*` for now.

**Acceptance:**
- `dev` mode and navigation entry are consistently exposed in the editor while
  preserving `/debug/*` as the current route namespace.
- `debug` remains a functional/diagnostic concept, distinct from the development
  route namespace.
- The route/nav base is ready for later moving existing development screens
  under `dev`.
- Tests and references follow the latest route naming.

**Branch:** `feat/editor-add-dev-router-navigation` from
`origin/main` at `b057bffd`. The branch is clean and 0 commits ahead.

**Standards loaded:** `AGENTS.md`, `CLAUDE.md`, `CONTRIBUTING.md`,
`docs/guidelines/error-handling.md`, `docs/guidelines/review-rust.md`,
`docs/guidelines/review-typescript.md`,
`docs/guidelines/commit-guideline.md`, and
`docs/guidelines/pr-guideline.md`.

**ADRs to honor:**
- ADR-0046 currently defines the editor route contract as `/` plus `/debug/*`,
  keeps the Bevy viewport outside route branches, redirects unknown app paths to
  `/`, and says unknown debug slugs redirect to the default panel. This issue
  should update or intentionally bridge that contract.
- ADR-0047 makes Tailwind/token classes the default for new or modified editor
  shell UI.

**User-locked clarifications (2026-05-20):**
- Main mode URL remains `/`.
- Dev mode URL remains `/debug/*` for this PR; route rename can happen later.
- The top-left control is a two-state Main/Dev segmented switch.
- The common navbar is always pinned on the left in both modes.
- The navbar width should stay fixed and start from the current debug sidebar
  width.
- The menu below the switch changes by mode.
- Existing `/debug/*` links remain supported.
- Redesign is allowed only when the current layout is clearly too rough for the
  shared navbar shape.

**Ask-first triggers:** dependency changes; bridge/Rust contract changes; moving
the Bevy viewport into a route branch; deleting `/debug/*`; renaming the route
to `/dev/*` in this PR; renaming functional debug command/source values such as
`spawn_debug_character`, `stage_import_debug`, or `debug_cube:*`.

## Current Code Evidence

- `apps/editor/src/App.tsx` mounts `/` and `/debug/*`; `useMatch("/debug/*")`
  changes the shell columns while the viewport remains outside route branches.
- `apps/editor/src/components/debug/DebugRoute.tsx` redirects `/debug` and
  unknown slugs to `/debug/${DEFAULT_DEBUG_PANEL_SLUG}`.
- `apps/editor/src/components/debug/DebugSidebar.tsx` renders `Debug` copy and
  links to `/debug/${entry.slug}`.
- `debugNavConfig.ts` and `debugPanels.tsx` already split navigation display
  metadata from panel registration by `slug`.
- Tests currently assert only `/debug/*`: `App.router.test.tsx`,
  `DebugRoute.test.tsx`, `DebugRoute.empty-registry.test.tsx`, and
  `StageImportDebugPanel.test.tsx`.
- `apps/editor/src/components/debug/README.md` documents `/debug/*` as a
  UI-only internal tool namespace hosting debug and dev-test tools.
- `MAP.md` points editor debug route/registry docs at
  `apps/editor/src/components/debug/`.

## Acceptance Trace

- AC1 `dev` router/nav exposed: codified but stale. `App.tsx`, `DebugRoute`,
  `DebugSidebar`, and router tests are the primitives to update.
- AC2 debug function vs dev namespace: codified/verification-example.
  Functional debug names in commands, diagnostics, sample provenance, and asset
  tags should stay unless they are specifically route or nav labels.
- AC3 base for moving screens under dev: sibling-owned. STL-432/follow-up work
  owns actual migration; STL-418 should provide the foundation and compatibility
  behavior.
- AC4 tests/refs naming: codified. Update route/nav tests and docs, while
  preserving explicit compatibility tests if `/debug/*` remains supported.

## Spec-Risk Handoff

- P1 Requirements/Locked Decisions: Canonical URL behavior is now decided for
  this PR: `/` is Main mode, `/debug/*` is Dev mode, and `/dev/*` is a later
  rename/follow-up rather than an implementation target.
- P1 Implementation Spec: Preserve the viewport mount invariant across
  `/` -> `/debug/*` -> `/`. Current router tests already prove this for the old
  route shape; extend them for the shared Main/Dev navbar.
- P1 Non-Goals: Do not rename functional debug command/source identifiers in
  bridge/runtime/sample data. Route naming is the target, not every occurrence
  of the word debug.
- P2 Verification: Add tests for `/`, `/debug`, `/debug/<slug>`, Main/Dev
  switch active state, mode-specific nav links, unknown debug slug behavior, and
  viewport persistence.
- P2 Docs/References: Update `debug/README.md` and `MAP.md` so future panels do
  not depend on the old route spelling unless documenting compatibility.
- P3 Naming: Prefer keeping code modules under `components/debug` for this PR
  unless the shared navbar needs a neutral `components/navigation` home; moving
  all debug modules to `components/dev` is a follow-up.

## Sibling Specs

- `completed/editor-add-debug-sidebar-nav.md`: established the split between
  panel registry and nav config. Keep that split; update route spelling without
  recombining registration and display concerns.
- `completed/stage-define-map-document-bundle-layout.md`: explicitly warned
  that STL-418 may rename the route namespace to `/dev/*`; stage import work
  should avoid depending on route spelling.
- `completed/shotloom-debug-router-pr-split.md`: earlier router shell history.
  The relevant locked behavior is viewport persistence and small PR scope.
- `proposed/editor-wire-stage-import-commands.md`: says to preserve the existing
  debug route/styling surface for stage-import command wiring. Treat this as a
  compatibility requirement, not a reason to block `/dev/*`.
- `proposed/stage-import-local-map-debug.md`: depends on the current debug
  registry and `/debug/stage-import` route for closure proof. STL-418 should
  preserve an intentional compatibility path while introducing the new dev nav.

## Suggested Next Step

Run `shotloom-draft-spec` for STL-418 using this briefing, then review the spec
before implementation.
