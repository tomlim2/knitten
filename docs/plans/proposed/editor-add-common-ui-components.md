---
status: proposed
created: 2026-05-20
updated: 2026-05-20
load: triggered
trigger: STL-490
repo: shotloom
linear: STL-490
briefing: ../../briefings/shotloom/editor-add-common-ui-components.md
---

# Add Common Editor UI Components

## Spec Contract

- Briefing basis: `STL-490` is the first frontend-cleanup child under
  `STL-429`; it prepares common UI primitives before `STL-418` and `STL-432`
  move debug surfaces under the `dev` route.
- Current truth: `DebugButton` is the only reusable button component, but it
  lives under `components/debug`, carries debug-specific ad-hoc colors, and is
  already imported by non-debug controls such as `ToolToolbar` and
  `UndoRedoControls`.
- Required change: add a small Tailwind-token-backed editor UI foundation,
  introduce common button/action primitives, and migrate the current debug and
  adjacent editor consumers that already share the pattern.
- Locked boundary: no route rename, no `debug` to `dev` migration, no bridge
  protocol changes, no new dependency, no broad design-system sweep.
- Proof method: focused React tests prove button defaults, variants, accessibility
  rules, and migrated consumer behavior; `pnpm typecheck:web` and
  `pnpm check:web` keep the editor TypeScript/Tailwind surface valid.

## Current State

| Surface | Path / symbol | Classification | Evidence |
|---|---|---|---|
| Tailwind config | `apps/editor/tailwind.config.cjs` | Partial | Tailwind is wired with preflight disabled and debug grid columns, but it has no editor color, typography, or spacing tokens. |
| Tailwind decision | `docs/adr/adr-0047-tailwind-as-editor-styling-default.md` | Already Done | New and modified editor components should use Tailwind; token drift belongs in Tailwind config; ad-hoc hex and spacing values in component TSX are defects. |
| Router decision | `docs/adr/adr-0046-editor-router-and-spa-fallback.md` | Already Done / adjacent | Route namespaces are UI-only and the viewport stays outside route-local branches. STL-490 must not change route semantics. |
| Existing reusable button | `apps/editor/src/components/debug/DebugButton.tsx` | Partial | Provides `type="button"` default and shared classes, but it is debug-namespaced and embeds ad-hoc hex/spacing. |
| Non-debug consumers | `apps/editor/src/components/ToolToolbar.tsx`, `apps/editor/src/components/UndoRedoControls.tsx` | Partial | Both import `DebugButton` even though they are viewport/editor controls, proving the component is already broader than debug. |
| Debug panel consumers | `apps/editor/src/components/debug/StageImportDebugPanel.tsx`, `BackgroundPropTestMap.tsx`, `PlaceholderDebugPanel.tsx` | Partial | Repeat panel section/header/action/status styles with inline Tailwind hex utilities. |
| Debug route/nav surface | `apps/editor/src/components/debug/DebugRoute.tsx`, `DebugSidebar.tsx` | Partial / sibling-owned | Uses ad-hoc black/gray hex classes and debug labels. Route name migration is owned by `STL-418`/`STL-432`; STL-490 may consume tokens but must not rename paths. |
| Existing tests | `apps/editor/src/components/__tests__/ToolToolbar.test.tsx`, `UndoRedoControls.test.tsx`, `debug/__tests__/StageImportDebugPanel.test.tsx` | Partial | Tests cover behavior, disabled states, and route registration; no tests assert common button defaults, variant mapping, or icon-only `aria-label`. |
| Raw button surface | `apps/editor/src/components/**` grep results | Partial / out-of-scope by default | Many production panels, modals, toast items, timeline parts, and sidebars use raw `<button>` or inline styles. Migrating all of them would exceed STL-490. |

## Linear Briefing

| Field | Value |
|---|---|
| Issue | `STL-490` |
| State | In Progress |
| Owner | deemo / current agent flow |
| Goal | Establish a small shared editor UI component foundation for buttons, action rows, typography, and constrained color usage before router cleanup continues. |
| Acceptance criteria | Spec first; prefer existing shared UI; add shared Button/action primitives when missing; preserve behavior and density; keep route changes out; pass editor checks. |
| Latest relevant comment | User clarified the rule: "use shared UI first; if missing, add a component/pattern" with black/white base, mint accent, semantic feedback colors, and five neutral grays. |
| Blockers / dependencies | Parent `STL-429`; route work owned by `STL-418` and `STL-432`. |
| Related PRs | Prior debug route/sidebar and stage-import PRs established current debug consumers; no active PR for STL-490 yet. |
| Current review state | None. |
| Planning consequence | Treat this as a small UI foundation PR, not a route migration or global design-system rewrite. |

## Problem

Editor frontend controls are converging on repeated local styles instead of a
shared component vocabulary. The immediate smell is `DebugButton`: it is
namespaced as debug-only, but non-debug controls already import it because no
general editor button exists. At the same time, ADR-0047 says new/modified
editor components should use Tailwind tokens, but the Tailwind config has no
editor color or typography token set to express the user's constrained visual
direction. If route cleanup proceeds before this foundation exists, later PRs
will have to mix route migration with UI cleanup.

## Requirements

1. Define a minimal editor Tailwind token set for the STL-490 color direction:
   black/white base, one mint accent, five neutral grays, semantic feedback
   colors for success, warning, and error, and the first typography aliases
   needed by migrated controls. Traces to user clarification and ADR-0047.
2. Add a common editor `Button` component under a non-debug component path.
   It must wrap native `<button>`, default `type` to `"button"`, preserve all
   normal button attributes, and avoid production `any`. Traces to Linear UI
   rules and TypeScript review checks.
3. Button styling must use constrained `variant` and `size` props instead of
   screen-specific ad-hoc class strings. Initial variants must cover the
   current debug/action use cases without inventing decorative color families:
   default/secondary/ghost/danger or equivalent names that map to the token set.
   Traces to user clarification and ADR-0047.
4. Icon-only button usage must require an accessible name. The component API
   must either make `aria-label` mandatory for `iconOnly` or document and test
   the accepted pattern. Traces to Linear UI rules.
5. Keep `DebugButton` as a compatibility wrapper around the new common
   `Button` for this PR, then migrate direct current consumers that already
   use `DebugButton`. Traces to current live imports and scope-control risk.
6. Add small action primitives only where the current repeated pattern is
   concrete: a panel action/group wrapper or toolbar/action row may be added if
   it replaces duplication in at least two touched consumers. Traces to Linear
   "2+ repeated patterns" rule.
7. Migrate touched debug and adjacent editor surfaces to the new tokens and
   common components without changing route paths, labels, command dispatch
   behavior, or panel registry semantics. Traces to `STL-418`/`STL-432`
   sibling ownership.
8. Preserve the existing visual density: compact controls, monospace editor
   vocabulary, disabled affordances, focus visibility, and stable toolbar
   layout. Traces to current component behavior and user UI direction.
9. Add focused tests for common button defaults, variant/accessibility behavior,
   and migrated consumer behavior. Tests must fail before implementation
   because the common component and tokens do not exist. Traces to TypeScript
   review checks and test-oracle strength.

## Risk Map

| Risk | Applies? | Evidence | Plan response | Test proof |
|---|---|---|---|---|
| Error source chain | no | No Rust parser, loader, validator, or typed error enum changes are in scope. | Keep all changes in editor TypeScript/Tailwind/test files. | N/A: no wrapped external error exists. |
| Schema / serialization compatibility | no | `apps/editor/src/bridge/types.ts` is not changed and no bridge command/event DTO changes are planned. | Do not touch bridge types, command payloads, or serialized fixture shape. | Existing panel/command tests remain green; no bridge snapshots change. |
| Ownership / API boundary | yes | `DebugButton` lives under `components/debug` but is imported by `ToolToolbar` and `UndoRedoControls`. | Move shared ownership to a neutral editor UI path and leave a debug wrapper for compatibility. | Import and render tests prove non-debug controls no longer depend on debug-owned implementation details. |
| Partial mutation / rollback | no | This PR writes static source code and config only; no runtime persistence, bundle mutation, cache, or manifest update occurs. | No atomicity decision needed beyond keeping component/config/test changes in one PR. | N/A: no runtime persisted state can be half-mutated by the feature. |
| Diagnostic ownership | no | No command rejection, runtime error, validation diagnostic, or bridge status code changes are in scope. | Preserve existing UI status strings and bridge error rendering. | StageImportDebugPanel tests remain focused on existing status behavior. |
| Local absolute path exposure | no | No fixture paths, manifests, or local file roots are added. | Do not add local path examples or screenshots to durable docs/code. | `rg` proof is covered by normal review if new fixtures are not introduced. |
| Manifest path containment | no | No manifest/catalog path fields are added or parsed. | Keep manifest and asset work out of STL-490. | N/A. |
| Asset/data pack lifecycle | no | No binary assets, LFS files, or generated data packs are added. | Keep sample data and assets under sibling issues. | N/A. |
| Bridge docs parity | no | No IPC docs or bridge behavior changes are planned. | Do not edit bridge docs except if an accidental reference is found stale. | N/A. |
| Event-state visibility | no | Buttons dispatch existing commands only through current consumers; no new accepted command or event is introduced. | Preserve existing consumer behavior. | Existing ToolToolbar, UndoRedoControls, and StageImportDebugPanel behavior tests remain green. |
| Input constraint parity | no | No new bridge input or free-form runtime input is added. | Component props are internal TypeScript API only. | Component prop tests and typecheck cover API shape. |
| Test oracle strength | yes | The common `Button` and editor color tokens do not exist today; `DebugButton` embeds ad-hoc classes. | Add tests that assert default type, disabled state, variant class intent, and icon-only accessibility behavior. | Button tests fail before implementation because the module/API is missing. |
| Scope creep | yes | Raw `<button>` and inline style usage exists across Sidebar, panels, toast, modals, timeline, and production panels. | Limit migration to `DebugButton` consumers and repeated debug/action surfaces touched by the component extraction. Put broad panel/timeline migration in follow-ups. | Changed file set excludes unrelated timeline/modal/toast/production panel rewrites unless needed for compile. |
| Reviewer objection | yes | Likely comments: "why is this still DebugButton?", "why more hex?", "why route/UI mixed?", "why no a11y test?" | Keep wrapper transitional, move real styling to common component/tokens, avoid route edits, and add accessibility tests. | Tests and diff structure directly answer those objections. |

## Locked Decisions

1. **Define the minimal token set in `apps/editor/tailwind.config.cjs` as part
   of this PR.**

   Rationale: ADR-0047 already says tokens are the review surface and ad-hoc
   hex/spacing in component TSX is a defect. Leaving tokens for a future PR
   would force the new common UI component to start life with the same defect
   it is supposed to remove.

   Rejected alternatives: keep component-local hex constants; add CSS custom
   properties without Tailwind config; create a full cross-app token package.

2. **Add a neutral `Button` and keep `DebugButton` as a wrapper for the first
   migration.**

   Rationale: live code already proves the button is not debug-only, but
   deleting or renaming every consumer at once is unnecessary review churn.
   A wrapper lets existing debug imports keep working while new/touched code
   uses the neutral component.

   Rejected alternatives: rename `DebugButton` in place and update every
   import; leave `DebugButton` as the only component; create multiple
   specialized buttons before proving one common API.

3. **Migrate only current `DebugButton` consumers and directly adjacent
   repeated debug/action styles.**

   Rationale: this is the smallest useful proof for the common UI foundation.
   Sidebar, timeline, toast, modal, and production panel raw buttons remain
   valid follow-up candidates unless they must be touched for compile or API
   proof.

   Rejected alternatives: migrate every raw `<button>` in `apps/editor`; touch
   only the new component with no consumer proof; combine migration with the
   `dev` route work.

4. **Button variants express role, not screen identity.**

   Rationale: the user asked for a constrained shared style, not "debug"
   colors. Variants should map to action role and state using black/white,
   mint, semantic feedback, and five grays.

   Rejected alternatives: `debug`, `stageImport`, or panel-specific variants;
   arbitrary `className`-only styling for primary state; decorative color
   variants outside the defined palette.

5. **Route naming and navigation migration stay out of STL-490.**

   Rationale: `STL-418` owns the dev router/navigation foundation and
   `STL-432` owns moving existing debug screens. STL-490 may improve the UI
   primitives those routes consume, but cannot change paths or registry
   semantics.

   Rejected alternatives: rename `/debug` to `/dev` while touching UI;
   duplicate router cleanup in this PR; add compatibility redirects here.

## Non-Goals

- Do not rename `/debug` to `/dev` or move existing debug screens.
- Do not change debug panel registry, nav ordering, route fallback, or SPA
  routing behavior.
- Do not change Rust, bridge protocol, command/event payloads, bundle state,
  asset import, or stage import sample data.
- Do not add Tailwind plugins, new dependencies, or new build steps.
- Do not migrate every raw `<button>` or every CSS Module in the editor.
- Do not introduce a public design-system package or cross-app token contract.
- Do not rewrite production timeline, toast, modal, or asset-panel styling
  unless a narrow touched consumer requires it.

## Implementation Spec

S0. Baseline re-check. Confirm the branch is clean, `DebugButton` still exists
under `components/debug`, `ToolToolbar` and `UndoRedoControls` still import it,
and Tailwind config still has no editor token set. Requirements: 1-9. Risk
rows: ownership/API boundary, scope creep.

S1. Add minimal editor Tailwind tokens. Extend `apps/editor/tailwind.config.cjs`
with the black/white, mint, five-gray, and semantic feedback palette plus any
font family/size aliases needed by the first components. Keep preflight disabled.
Requirements: 1, 3, 8. Risk rows: reviewer objection, scope creep.

S2. Add common editor UI component(s). Add a neutral Button module under a
non-debug path such as `apps/editor/src/components/ui/Button.tsx`, with typed
props for variant, size, optional `iconOnly`, default `type="button"`, and class
composition using Tailwind tokens. Add the smallest helper needed for class
joining if no existing helper exists; do not add a dependency. Requirements:
2-4, 8. Risk rows: ownership/API boundary, test oracle strength.

S3. Keep `DebugButton` as a wrapper. Rewrite
`apps/editor/src/components/debug/DebugButton.tsx` to delegate to the common
`Button` with the default action variant/size used by current debug panels.
Requirements: 5, 7, 8. Risk rows: reviewer objection, scope creep.

S4. Migrate direct current consumers. Update `ToolToolbar`,
`UndoRedoControls`, `StageImportDebugPanel`, `BackgroundPropTestMap`, and
`PlaceholderDebugPanel` to use the common component or wrapper intentionally,
and replace touched ad-hoc hex utilities with tokens. If two or more touched
panels repeat the same action wrapper, add a small `PanelActions` or
`ActionRow` primitive; otherwise defer it. Requirements: 5-8. Risk rows:
scope creep, ownership/API boundary.

S5. Add focused tests. Add Button tests for default type, disabled state,
variant rendering, pressed state support, and icon-only accessible-name
requirement. Update existing consumer tests only where markup/roles/class
intent changes. Requirements: 2-9. Risk rows: test oracle strength, reviewer
objection.

S6. Run verification. Run focused component/consumer tests first, then
`pnpm typecheck:web` and `pnpm check:web`. If component changes touch route
panels, run the affected debug panel tests. Requirements: 7-9. Risk rows:
test oracle strength.

## Acceptance Criteria

- [ ] `apps/editor/tailwind.config.cjs` defines the minimal editor palette:
  black/white, mint, five grays, success, warning, and error.
- [ ] The first shared typography aliases needed by migrated controls are
  defined or explicitly deferred with rationale.
- [ ] A neutral common editor `Button` exists outside `components/debug`.
- [ ] The common Button defaults to `type="button"` and preserves normal
  `ButtonHTMLAttributes`.
- [ ] Button variants and sizes are limited and token-backed; new ad-hoc hex
  utilities are not introduced in touched components.
- [ ] Icon-only usage has an explicit accessible-name contract and test.
- [ ] `DebugButton` no longer owns raw styling; it delegates to the common
  Button or is reduced to compatibility glue.
- [ ] Current `DebugButton` consumers keep the same behavior and compact visual
  density after migration.
- [ ] No route path, nav registry, bridge protocol, or stage import sample data
  changes land in this PR.
- [ ] Focused Button/consumer tests, `pnpm typecheck:web`, and
  `pnpm check:web` pass.

## Verification

- Focused new component tests: `pnpm --filter @shotloom/editor test -- Button`.
- Existing consumer tests after migration:
  `pnpm --filter @shotloom/editor test -- ToolToolbar UndoRedoControls StageImportDebugPanel BackgroundPropTestMap`.
- TypeScript check: `pnpm typecheck:web`.
- Web formatting/lint check: `pnpm check:web`.
- Manual repro: open `/debug/stage-import` and `/debug/background-prop-test-map`
  and confirm actions remain compact, disabled states remain visible, and the
  page still uses `/debug` routes.
- Manual repro: interact with viewport tool and undo/redo toolbar controls and
  confirm labels, `aria-pressed`, enabled/disabled states, and dispatch behavior
  match the old behavior.

## Traps

- Do not rename `/debug` or introduce `/dev` in this PR.
- Do not replace bridge command behavior while migrating button components.
- Do not add new decorative colors beyond black/white, mint, five grays, and
  semantic feedback colors.
- Do not use new ad-hoc hex classes in touched TSX after adding Tailwind tokens.
- Do not make `className` the only way to express common button role or size.
- Do not remove `DebugButton` until all downstream consumers are intentionally
  migrated; a wrapper is enough for this PR.
- Do not enable Tailwind preflight; ADR-0047 says it stays disabled while CSS
  Modules and browser-default controls coexist.
- Do not broaden this into timeline, toast, modal, or asset panel restyling.

## Follow-Up Candidates

- Migrate `DebugSidebar` and the future `dev` route navigation after `STL-418`
  decides the route shape.
- Move remaining debug screens from `/debug` to `/dev` under `STL-432`.
- Migrate production Sidebar, CharactersPanel, WorldAssetsPanel, toast, modal,
  and timeline controls incrementally as their owning work touches them.
- Promote the settled Button/action primitive rules into a durable editor UI
  guideline after one or two implementation PRs prove the shape.
