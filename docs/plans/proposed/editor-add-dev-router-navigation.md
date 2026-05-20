---
status: proposed
created: 2026-05-20
updated: 2026-05-20
load: triggered
trigger: STL-418
repo: shotloom
linear: STL-418
briefing: ../../briefings/shotloom/editor-add-dev-router-navigation.md
---

# Add Shared Main/Dev Editor Navigation

## Spec Contract

- Briefing basis: `STL-418` asks for dev route/navigation cleanup before later
  moving existing debug surfaces; the user clarified that this PR keeps
  `/debug/*` as Dev mode's current URL namespace and adds a shared left navbar.
- Current truth: the editor has `/` and `/debug/*` routes, keeps the Bevy
  viewport outside route-selected UI, has a debug sidebar width of `160px`, and
  already splits debug panel registration from debug nav display metadata.
- Required change: add a common left-pinned navbar with a top Main/Dev
  segmented switch, render mode-specific menu entries beneath it, make Main
  entries select the existing editor panel categories, route Main to `/`, route
  Dev to `/debug/*`, and reuse the existing debug panel registry/nav as the Dev
  menu source.
- Locked boundary: no `/dev/*` route in this PR, no Rust/bridge changes, no
  dependency changes, no production import UX, no broad visual redesign, and no
  renaming of functional debug command/source/fixture identifiers.
- Proof method: focused React router/nav tests prove the navbar is present in
  both modes, the switch follows the current route, mode menus change under the
  switch, existing `/debug/*` deep links stay alive, and the viewport remains
  mounted across Main/Dev navigation.

## Current State

| Surface | Path / symbol | Classification | Evidence |
|---|---|---|---|
| Editor route shell | `apps/editor/src/App.tsx` `RoutePreset`, `AppShell` | Partial | Routes `/` and `/debug/*`; `useMatch("/debug/*")` changes columns; viewport is outside `RoutePreset`. It has no shared navbar or Main/Dev switch. |
| Main editor panels | `apps/editor/src/App.tsx` `EditorPanels`, `EditorUiPreset`; `apps/editor/src/components/LeftPanel.tsx` | Partial | Main route renders `LeftPanel`, `Sidebar`, and `Timeline` only inside the route-selected `panels`/`timeline` areas. `LeftPanel` owns local ActivityBar state for Characters/Animations/World Assets/Cameras/Scene; that activity selection should move to or be controlled by the shared navbar so the main menu is functional. |
| Debug route panel | `apps/editor/src/components/debug/DebugRoute.tsx` | Partial | Owns a two-column debug layout and renders `DebugSidebar` internally. This duplicates the left navigation position that should become shared. |
| Debug sidebar | `apps/editor/src/components/debug/DebugSidebar.tsx` | Partial | Renders a fixed-width debug nav at `max-w-[160px]` with links to `/debug/<slug>`. It has no Main/Dev switch and is only present on debug routes. |
| Debug nav config | `apps/editor/src/components/debug/debugNavConfig.ts` `DEBUG_NAV` | Already Done | Owns debug menu labels/order by slug and should remain the Dev menu source for this PR. |
| Debug panel registry | `apps/editor/src/components/debug/debugPanels.tsx` | Already Done | Owns slug-to-component registration and default panel resolution. Keep this responsibility split. |
| UI primitives | `apps/editor/src/components/ui/Button.tsx` `ToggleButton` | Already Done | Provides reusable disabled/pressed state buttons. Use this for the Main/Dev switch rather than adding bespoke button markup. |
| Tailwind tokens | `apps/editor/tailwind.config.cjs` | Partial | Defines editor colors/fonts and `grid-cols-debug-route` as `minmax(min-content, 160px) minmax(180px, 1fr)`. Shared navbar layout should use token/Tailwind vocabulary. |
| Router tests | `apps/editor/src/__tests__/App.router.test.tsx` | Partial | Proves unknown app redirect, `/debug/*` rendering, and viewport mount stability for `/` <-> `/debug/*`; does not prove shared navbar behavior. |
| Debug route tests | `apps/editor/src/components/debug/__tests__/DebugRoute.test.tsx` and `DebugRoute.empty-registry.test.tsx` | Partial | Prove debug redirects and sidebar nav order. They should either move to the shared nav test surface or keep route-only fallback coverage. |
| Stage import route tests | `apps/editor/src/components/debug/__tests__/StageImportDebugPanel.test.tsx` | Partial | Still renders the panel through `/debug/stage-import`; compatibility should remain. |
| Editor route docs | `apps/editor/README.md`, `MAP.md`, `apps/editor/src/components/debug/README.md` | Partial | Docs still describe `/debug/*` as the debug route surface; they need to name Main/Dev mode and clarify that `/debug/*` remains the current Dev URL namespace. |
| Router ADR | `docs/adr/adr-0046-editor-router-and-spa-fallback.md` | Conflict | Proposed ADR names `/debug/*` as the debug route. This PR should update the ADR wording or add a focused note so the route contract matches Main/Dev mode without claiming `/dev/*` exists. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-418` |
| State | `In Progress` |
| Owner | deemo / current agent flow |
| Goal | Add a dev navigation foundation without breaking existing debug route links. |
| Acceptance criteria | Dev route/nav exposed; debug-as-function distinguished from development route namespace; route/nav base ready for later migration; route/nav tests and references updated. |
| Latest relevant comment | 2026-05-20 user clarification: Main mode is `/`, Dev mode remains `/debug/*` for now; add a left-pinned shared navbar with a Main/Dev switch and mode-specific menus; keep `/debug/*` links. |
| Blockers / dependencies | Parent `STL-429`; follow-up `STL-432`; `STL-490` owns broader common button work and is out of scope. |
| Related PRs | PR #376 landed shared editor UI primitives, including reusable button/toggle components. |
| Current review state | None for this branch. |
| Planning consequence | Treat the Linear `dev router` wording as a UI-mode/navigation foundation now, not a literal `/dev/*` route rename in this PR. |

## Problem

The editor currently exposes normal authoring UI at `/` and developer tools at
`/debug/*`, but the left navigation differs by route. Main mode uses
`LeftPanel` plus `Sidebar`; debug mode replaces that with `DebugSidebar` inside
`DebugRoute`. This makes the future dev navigation model look like a debug-only
special case and provides no stable place for a top-level Main/Dev mode switch.

The remaining gap is not a route rename. The user clarified that `/debug/*`
stays as the Dev mode URL for this PR and will be renamed later if needed. The
PR should therefore introduce the shared navigation shell first: one fixed left
navbar present in both modes, a top Main/Dev segmented switch, and a menu area
whose entries change by mode. The Main menu must still operate the existing
editor panel selection; otherwise the shared navbar would be decorative instead
of replacing the old left activity rail.

## Requirements

1. Add a reusable editor navigation component for the fixed left navbar. It must
   render on both `/` and `/debug/*`, use the current debug sidebar width as its
   initial fixed width, and keep its layout inside the React editor shell rather
   than inside any Rust/Bevy/bridge layer. Traces to user clarification and
   ADR-0046.
2. The navbar must render a two-state Main/Dev switch at the top. Main routes to
   `/`; Dev routes to the default debug panel under `/debug/*`. The active
   state must be derived from the current route, not duplicated local state.
   Traces to user clarification and React Router ownership in ADR-0046.
3. The menu under the switch must change by mode. Main mode must expose the
   existing editor panel categories and selecting a Main menu entry must change
   the active main panel content. Dev mode must reuse `DEBUG_NAV` order/labels
   and link to `/debug/<slug>`. Traces to user clarification, existing
   `LeftPanel` behavior, and the existing debug nav split.
4. Existing `/debug`, `/debug/<slug>`, and `/debug/stage-import` deep links must
   remain valid. Unknown debug slugs must continue to resolve to the default
   debug panel. Traces to ADR-0046 and existing debug route tests.
5. The Bevy viewport must stay mounted across navigation between `/` and
   `/debug/*`; moving the viewport into a route branch is forbidden. Traces to
   ADR-0046 and existing router tests.
6. Remove or collapse only the old debug-specific sidebar responsibility that is
   replaced by the shared navbar. Do not redesign panel bodies unless the
   current nested layout is clearly broken after the shared navbar is added.
   Traces to user clarification.
7. Keep functional debug names intact where they describe commands, diagnostics,
   sample provenance, fixtures, asset IDs, or bridge/runtime behavior. Only
   route/nav labels and docs should distinguish Dev mode from debug functions.
   Traces to Linear AC2 and user clarification.
8. Update docs and references (`apps/editor/README.md`, `MAP.md`,
   `apps/editor/src/components/debug/README.md`, and ADR-0046 if needed) to
   describe Main/Dev navigation and the current `/debug/*` Dev URL namespace.
   Traces to Linear AC4 and repo documentation rules.
9. Tests must cover the shared navbar on both modes, Main/Dev switch behavior,
   mode-specific menu entries, `/debug/*` compatibility, and viewport mount
   stability. Traces to Linear AC4 and TypeScript review expectations.

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | no | TS/React routing and docs only; no Rust error type or parser change. | Do not touch Rust errors or parser/validator code. | N/A: no wrapped external error is introduced. |
| Schema / serialization compatibility | no | No bridge DTO, JSON schema, serde type, or IPC payload changes are in scope. | Preserve bridge command/event shapes and functional debug source strings. | N/A: no wire or schema diff. |
| Ownership / API boundary | yes | ADR-0046 says route changes select React UI and create no Rust/Bevy route state. | Keep navigation under `apps/editor/src`; no bridge/runtime command or state. | Typecheck plus route tests that navigate without bridge API changes. |
| Partial mutation / rollback | no | Navigation changes do not persist bundle, timeline, asset, manifest, or cache state. | Do not mutate durable shot state from the navbar. | N/A: no persistent mutation. |
| Diagnostic ownership | yes | Existing debug tools emit/use functional debug terms such as `stage_import_debug`. | Keep diagnostic/source/command names unchanged; only nav/doc copy changes. | Grep/review proof plus unchanged stage-import command tests. |
| Local absolute path exposure | yes | Docs/spec edits can accidentally include local worktree or machine paths. | Use repo-relative paths in committed Shotloom docs. Keep absolute paths only in Knitten briefing/worktree metadata. | `rg` proof over changed Shotloom docs before PR. |
| Manifest path containment | no | No manifest/catalog/path resolver is added or changed. | Keep asset and manifest files untouched. | N/A: no path resolver. |
| Command rejection matrix | no | No command handler or command input changes. | Do not add/modify bridge commands. | N/A: command tests remain existing coverage. |
| Cross-platform CLI entrypoint | no | No CLI/script entrypoint changes. | Keep scripts untouched. | N/A. |
| Asset/data pack lifecycle | no | No assets, fixtures, GLBs, or LFS files added. | Keep asset packs untouched. | N/A. |
| Validation context downgrade | no | No validator or validation API changes. | Keep validators untouched. | N/A. |
| Field-set drift | yes | `DEBUG_NAV`, panel registry, current `EditorPanels` activity item list, and new shared navbar menu can drift if duplicated. | Reuse `DEBUG_NAV` for Dev menu and extract/reuse one Main menu definition for both navbar display and main panel selection. | Nav order test proves Dev menu follows `DEBUG_NAV`; main menu selection test proves menu ids match the rendered panel map. |
| Bridge docs parity | no | No bridge command/event change. | Do not update IPC docs except if a route-only mention is stale outside bridge contract. | N/A: no wire diff. |
| Event-state visibility | no | Navbar route changes do not emit bridge events and must not alter runtime state. | Keep viewport mounted and route state React-only. | Viewport mount count test across Main/Dev navigation. |
| Input constraint parity | no | No new free-form user input. | Use links/buttons only. | N/A. |
| Test oracle strength | yes | Current tests pass without a shared navbar. | Add assertions that fail before implementation: navbar exists in both modes, switch active state changes, Dev menu renders from `DEBUG_NAV`, and Main menu replaces it. | `App.router.test.tsx` / nav component tests fail before patch and pass after. |
| Scope creep | yes | Adjacent work includes literal `/dev/*` rename, debug panel migration, panel redesign, and STL-490 broader UI primitive adoption. | Put these in Non-Goals or Follow-Up Candidates. | Review changed file set excludes Rust/bridge/dependency/large panel rewrites. |
| Reviewer objection | yes | Linear says `dev` router while user now wants `/debug/*` kept for Dev mode. | Lock the interpretation in spec, docs, and tests: Dev mode label now; URL rename later. | Docs/test names state `/debug/*` is current Dev URL namespace, not final naming. |

## Locked Decisions

1. **Keep `/debug/*` as the Dev mode URL namespace in this PR.**

   Rationale: the user explicitly clarified that Main mode is `/`, Dev mode is
   `/debug/*`, and rename can happen later. This keeps existing debug deep links
   alive while still creating the navigation foundation Linear asks for.

   Rejected alternatives: adding `/dev/*` now; redirecting `/debug/*` to
   `/dev/*`; deleting `/debug/*`; treating STL-418 as a broad string rename.

2. **Introduce a shared left navbar before moving or renaming debug panels.**

   Rationale: the common shell creates a stable top-level Main/Dev mode affordance
   and avoids another one-off debug sidebar. It also gives future route rename or
   panel migration work one component to update.

   Rejected alternatives: only relabeling `DebugSidebar`; only adding a link
   somewhere in the existing main UI; keeping separate main and debug left rails.

3. **The Main/Dev switch is route-derived, not local component state.**

   Rationale: React Router already owns browser navigation and active matching.
   Local duplicated mode state would desync on direct loads, back/forward, or
   bookmarks.

   Rejected alternatives: a `useState` mode toggle that hides routes; storing mode
   in bridge state; using query params for mode.

4. **Mode menus reuse their owning sources instead of duplicating tables.**

   Rationale: STL-380 already established the debug display/registration split.
   Reusing `DEBUG_NAV` avoids duplicated Dev slug/label/order tables and keeps
   hidden panels possible. Main panel ids should likewise come from one shared
   editor-panel menu definition so the navbar and panel map cannot drift.

   Rejected alternatives: copying Dev menu entries into the new navbar; moving
   component registration into nav config; deriving nav labels from panel
   components; keeping a separate old ActivityBar menu and a decorative shared
   Main menu.

5. **Use current debug sidebar width as the fixed navbar width.**

   Rationale: the user requested the default size to start from the current debug
   nav size. The current Tailwind grid token and sidebar classes use `160px`.

   Rejected alternatives: responsive wide nav; collapsible nav; matching the
   older `LeftPanel` activity width; route-specific widths.

6. **Only clean up layout where the shared navbar would otherwise duplicate or break it.**

   Rationale: this PR is navigation/routing foundation work. A full visual
   redesign makes the review surface too large and overlaps STL-490 or future
   panel cleanup.

   Rejected alternatives: redesigning all editor panels; moving all debug
   components under `components/dev`; restyling stage-import/debug panel bodies.

## Non-Goals

- Do not add a `/dev/*` route or make `/dev/*` canonical.
- Do not move every debug component into a `dev` directory.
- Do not rename bridge commands, bridge event sources, diagnostics, fixture tags,
  sample file source categories, or runtime debug utilities.
- Do not change Rust, Bevy, WASM, or bridge behavior.
- Do not add dependencies or icon libraries.
- Do not implement STL-490's broader common UI component migration.
- Do not add production import/navigation flows.
- Do not build a collapsible/responsive global app shell beyond the fixed-width
  left navbar required here.

## Implementation Spec

S0. Baseline re-check. Confirm branch cleanliness, current `/` and `/debug/*`
route behavior, `DEBUG_NAV` entries, `ToggleButton` availability, and current
router tests. Requirements: 1-9. Risk rows: ownership/API boundary, scope creep.

S1. Add the shared navbar model and component. Create a route-aware component
under the editor component tree, using Tailwind/token classes and the existing
`ToggleButton`/button primitive for the Main/Dev switch. The component derives
active mode from the current location, receives/updates the active Main panel id,
and exposes mode-specific menu entries below the switch. Requirements: 1, 2, 3,
5. Risk rows: ownership/API boundary, field-set drift.

S2. Wire navbar into `AppShell` and Main panel selection. Make it the left-pinned
shell column for both routes, lift or share the current `LeftPanel` active-panel
state so Main menu entries select real panel content, keep the viewport outside
`RoutePreset`, keep the timeline only on Main, and avoid adding a second debug
sidebar. Requirements: 1, 3, 4, 5, 6. Risk rows: event-state visibility, field-set
drift, test oracle strength.

S3. Refactor debug route layout just enough to consume the shared Dev menu.
Remove the duplicated `DebugSidebar` render path or reduce it to compatibility
code if tests still need a route-local fallback. Keep `DebugRoute` responsible
for slug defaulting and panel rendering. Requirements: 3, 4, 6, 7. Risk rows:
diagnostic ownership, field-set drift.

S4. Update route/nav tests. Extend `App.router.test.tsx` or add focused navbar
tests so Main mode shows the shared navbar and Main menu, clicking a Main menu
entry changes the active panel content, `/debug/*` shows the same navbar with
Dev active and Dev menu entries from `DEBUG_NAV`, existing debug deep links work,
unknown debug slugs redirect to the default panel, and viewport mount count
remains one across mode changes. Requirements: 2, 3, 4, 5, 9. Risk rows: field-set
drift, test oracle strength, reviewer objection.

S5. Update docs/references. Adjust `apps/editor/README.md`, `MAP.md`,
`apps/editor/src/components/debug/README.md`, and ADR-0046 wording so they
describe Main/Dev navigation and explicitly state that `/debug/*` is the current
Dev mode route namespace until a later rename. Requirements: 7, 8. Risk rows:
local absolute path exposure, reviewer objection.

S6. Run focused verification, then the applicable editor gates. Requirements:
9. Risk rows: test oracle strength.

## Acceptance Criteria

- [ ] A fixed-width shared navbar appears on the left in both Main and Dev mode.
- [ ] The navbar top control switches between Main and Dev and reflects the
  active route.
- [ ] Main mode remains at `/`; Dev mode remains under `/debug/*`.
- [ ] The menu below the switch changes by mode.
- [ ] Main menu entries select the existing main editor panel content.
- [ ] Dev menu entries reuse `DEBUG_NAV` ordering and link to existing
  `/debug/<slug>` routes.
- [ ] Existing `/debug`, `/debug/<slug>`, and `/debug/stage-import` links remain
  valid.
- [ ] The Bevy viewport remains mounted across Main/Dev navigation.
- [ ] Debug command/source/fixture terminology remains intact outside route/nav
  labels and docs.
- [ ] Docs/tests describe the current Main/Dev navigation model and the later
  `/dev/*` rename boundary.

## Verification

- Focused route tests: `pnpm --filter @shotloom/editor test -- App.router`.
- Focused debug/nav tests: run the updated `DebugRoute` or shared navbar test
  target.
- Editor typecheck/test gate: `pnpm test:web` if runtime cost is acceptable for
  the PR; otherwise run the narrower editor test targets plus TypeScript check
  named by current package scripts.
- Manual repro: open `/`; shared left navbar is present, Main is active, Main
  menu entries are shown, clicking each Main entry changes the left panel
  content, timeline remains visible, viewport renders.
- Manual repro: use the switch or browser URL to visit `/debug`; shared navbar
  remains present, Dev is active, Dev menu entries are shown, and the default
  debug panel renders.
- Manual repro: open `/debug/stage-import`; the stage import panel renders and
  no old debug deep link breaks.
- Manual repro: navigate `/` -> `/debug/placeholder` -> `/`; viewport state
  should persist and tests should prove the viewport mount count remains one.
- Documentation proof: changed docs contain no local absolute paths and name
  `/debug/*` as the current Dev namespace, not a completed `/dev/*` rename.

## Traps

- Do not implement `/dev/*` even though Linear uses `dev router` wording. The
  user explicitly kept Dev mode at `/debug/*` for this PR.
- Do not rename `stage_import_debug`, `spawn_debug_character`, `debug_cube:*`,
  or similar functional identifiers.
- Do not leave both the new shared navbar and the old `DebugSidebar` visible in
  Dev mode.
- Do not make the Main/Dev switch a local state toggle that can disagree with
  direct URL loads or browser back/forward.
- Do not move the Bevy viewport inside `Routes`.
- Do not let the Dev menu duplicate `DEBUG_NAV` entries in a second hard-coded
  table.
- Do not leave a duplicate old ActivityBar visible beside the shared navbar.
- Do not turn this into a full panel redesign or common component migration PR.

## Follow-Up Candidates

- Rename the Dev URL namespace from `/debug/*` to `/dev/*` with compatibility
  redirects or aliases.
- Move debug-named route modules to dev-named modules after the URL namespace is
  decided.
- Expand the shared navbar with icons, grouping, or collapse behavior once the
  navigation shape stabilizes.
- Migrate more editor panel controls onto the shared UI primitives from
  STL-490.
