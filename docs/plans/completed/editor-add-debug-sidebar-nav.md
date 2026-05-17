---
status: completed
created: 2026-05-12
updated: 2026-05-17
load: triggered
trigger: "before editing /debug route layout, debug nav config, or debug panel registry display metadata"
repo: shotloom
linear: STL-380
---

# Editor /debug Shared Sidebar Nav

## Intent

STL-373 / PR #309 landed the `/debug/*` parent route with a horizontal tab
nav driven directly by the panel registry (`DEBUG_PANELS`). The nav lives in
`DebugRoute.tsx` as a top row of `<Link>` chips above the panel content. Two
problems show up as soon as a second panel lands: (1) horizontal width is the
wrong axis for an N-of-many nav with optional grouping, and (2) the panel
registry is being asked to carry both *component-registration* (slug →
`ComponentType`) and *display* (label, order, group) concerns, which couples
unrelated PRs every time a panel is added.

This issue ships the routing-side fix: convert the horizontal tab nav into a
fixed left sidebar that renders on every `/debug/*` subroute, and split the
display metadata into a separate `debugNavConfig.ts` source. The panel
registry keeps owning component registration; the nav config owns label /
order / (future) grouping. The two sources are linked only by `slug`.

Out of scope: adding new panels, changing the panel-component contract
(`DebugPanel.types.ts`), introducing groups (schema reserves the field, but
no group is wired in this PR), or touching the overlay z-stack (locked by
STL-373 / ADR neighborhood — sidebar lives inside `DebugSurface`, not in any
overlay layer).

## Decisions (locked)

1. **Nav source = separate `debugNavConfig.ts`, not the panel registry.**
   Rationale: registration and display are independently versioned. A new
   panel PR should only need to touch the registry; a nav reorder /
   relabel / regrouping PR should only need to touch the config. Each
   source has a single reason to change. Rejected: a single combined source
   (`DEBUG_PANELS` carries label/order/group too) — keeps current coupling.
   Rejected: derive nav order from registry insertion order — implicit
   ordering breaks the moment two panels land in different PRs.

2. **Sidebar position = left, fixed width column.** Rationale: vertical
   list scales with panel count without horizontal clipping, matches the
   editor's existing left-rail vocabulary (`CharactersPanel`,
   `AnimationsPanel`), and lets the content column claim full remaining
   width. Rejected: right sidebar (away from existing left-rail
   convention), top tab bar (current state, the problem), bottom dock
   (eats viewport vertical space for no benefit).

3. **Nav config schema = `{ slug, label, group?, order? }[]`.** `group`
   and `order` are optional now — sidebar renders a flat list sorted by
   `order` (fallback: array index) and ignores `group` until a future PR
   wires section headers. Reserving the field now means adding groups
   later is purely a render-side change, not a schema change. Rejected:
   omit `group` entirely until needed — forces a schema migration on the
   first multi-group PR.

4. **Convention doc lives in `debugNavConfig.ts` header comment, not an
   ADR or external README.** Rationale: agents adding new panels read
   `debugPanels.tsx` / `debugNavConfig.ts` directly; a doc-comment at the
   top of the file is where they will land first. ADR would be over-weight
   for a UI-shell split. Rejected: new ADR (out of proportion); new
   `debug/README.md` (none exists today, adds a file without a clear
   second home).

5. **`DEFAULT_DEBUG_PANEL_SLUG` stays in the panel registry.** It is a
   *registration* fact — "which registered panel renders when no slug is
   given" — not a display fact. Nav config does not need to know about
   defaulting. `DebugRoute.tsx` continues to resolve the effective slug
   through the registry.

## Acceptance

- [ ] `apps/editor/src/components/debug/` 아래에 nav 전용 config
  (`debugNavConfig.ts`)를 신설한다. 스키마: `{ slug, label, group?, order? }[]`.
- [ ] `debugNavConfig.ts` 상단 doc comment에 스키마와 "panel registry =
  component 등록 책임, nav config = 표시·순서 책임" 분리 원칙을 명시한다
  (후속 패널 추가 에이전트가 cold-start로 바로 보이도록).
- [ ] panel registry(`debugPanels.tsx`)는 component 등록 책임만 갖고,
  nav config는 표시·순서 책임만 갖는다. 두 source는 `slug`로만 묶인다.
- [ ] `DebugRoute.tsx` 레이아웃을 좌측 sidebar + content 2-column grid로
  재구성한다. 기존 horizontal tab nav는 제거한다.
- [ ] sidebar는 `/debug/*` 모든 하위 라우트에서 동일하게 렌더링되고,
  현재 active slug를 시각적으로 표시한다.
- [ ] "Back to editor" 링크는 sidebar 영역 내에 유지한다.
- [ ] 패널이 1개뿐인 현재 상태에서도 동작해야 하며, group은 아직
  미사용이라도 스키마에는 포함한다.
- [ ] Rust/Bevy 변경 없음. 새 bridge 명령/이벤트 없음.

## File map

- `apps/editor/src/components/debug/debugNavConfig.ts` — **add**.
  Exports `DEBUG_NAV: readonly DebugNavEntry[]` and `DebugNavEntry` type
  (`{ slug, label, group?, order? }`). Header comment states the
  registry/nav split convention. Initial entry mirrors the existing
  `placeholder` panel so the first render is unchanged.
- `apps/editor/src/components/debug/DebugRoute.tsx` — **modify**.
  Replace the horizontal `DEBUG_PANELS.map` nav block (lines 34–52) with
  a sidebar that maps over `DEBUG_NAV`. Move "Back to editor" link into
  the sidebar header. Convert the section's outer grid from `auto auto 1fr`
  rows to a two-column `<sidebar width> 1fr` layout. Active-slug styling
  preserved.
- `apps/editor/src/components/debug/DebugRoute.module.css` — **modify**.
  Replace `.panelNav` row styles with sidebar column styles (fixed width,
  vertical scroll, divider). Keep `.panelLink` / `.panelLinkActive`
  vocabulary or rename to `.navLink` / `.navLinkActive` for clarity.
  Header block adapts to live inside the sidebar.
- `apps/editor/src/components/debug/debugPanels.tsx` — **modify (small)**.
  Remove `label` from `DEBUG_PANELS` entries (display moves to nav config),
  OR keep `label` only if a runtime sanity check wants to assert
  registry-and-nav agree. Default: drop `label`, narrow `DebugPanel` type
  to `{ slug, component }`. `DEFAULT_DEBUG_PANEL_SLUG` and `findDebugPanel`
  unchanged.
- `apps/editor/src/components/debug/DebugPanel.types.ts` — **modify**.
  Update `DebugPanel` shape to drop `label`. Add `DebugNavEntry` if
  co-locating is preferred over a fresh file (decision deferred to
  implementation; default = new file).

## Verification

- Local: `cd apps/editor && pnpm dev:web`, visit `/debug` → sidebar
  renders, "Placeholder" entry highlighted, "Back to editor" link
  visible inside the sidebar, content column shows the placeholder panel.
  Visit `/debug/placeholder` → same. Visit `/debug/unknown` → sidebar
  still renders unchanged; content column shows fallback.
- Type: `pnpm -C apps/editor typecheck` (or workspace root `pnpm check`).
- Lint/format: pre-commit `lint-staged` handles Biome on TS files.
- Unit: existing `DebugRoute` tests (if any) updated to assert sidebar
  presence + active-link aria. Cover (a) default slug resolves, (b)
  unknown slug fallback, (c) sidebar always renders.
- Doc-paths: `node scripts/validate-doc-paths.mjs` (pre-commit auto).
- Rust gates: N/A — diff is TS-only. `/shotloom-review-before-pr` Step
  1.5 applicability matrix marks Rust groups N/A; G/H/I/S still run.

## Open questions

- Sidebar width — fixed `220px` or `clamp(180px, 18vw, 260px)`? Default
  to `clamp` (matches existing `.route` width style); revisit if
  designer feedback says otherwise.
- Rename `.panelLink` → `.navLink` in CSS classnames now, or keep
  `.panelLink` to minimize diff? Default: rename for accuracy (nav, not
  panel-list). Cost is one extra hunk per active style.
- Test file location — `DebugRoute` currently has no co-located test
  per quick scan. Confirm during implementation whether to add
  `DebugRoute.test.tsx` (preferred) or rely on a broader editor
  integration test.
