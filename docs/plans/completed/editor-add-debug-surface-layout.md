---
status: completed
created: 2026-05-12
updated: 2026-05-17
load: triggered
trigger: "before editing apps/editor debug surface layout / overlay stack / preset naming"
repo: shotloom
linear: STL-373
---

# Editor Debug Surface Layout Groundwork

## Intent

STL-372 landed a minimal React Router shell (`/` only, `*` redirects back) on
top of which `/debug/*` will host editor-internal debug tooling (retargeter,
env, future panels). Before any debug content lands, the editor shell needs
three things settled: (1) a named layout primitive `/debug/*` subroutes can
mount inside without each panel re-inventing its own frame, (2) an explicit
overlay z-stack so toast + modal + route content + Bevy viewport coexist
predictably, and (3) a single vocabulary for the unit-of-debug — currently
the issue floats three candidate names (preset / panel / panel-collection) and
the choice will spread across every follow-up PR.

This issue is groundwork only: ship the layout primitive + overlay rule + the
naming decision (with its ADR), wire one trivial placeholder route under
`/debug/*` to prove the container works, and stop. Retargeter and env debug
content are out of scope — they re-attach in follow-up issues that depend on
the names this PR locks.

The Bevy viewport invariant from ADR-0046 is the load-bearing constraint:
nothing in this PR may move the viewport into a route branch or wrap it in
route-local lifecycle. The layout primitive sits *inside* a route element; the
viewport stays in `AppShell` alongside the router, not inside it.

## Decisions (locked)

1. **Layout primitive name = `DebugSurface`.** Rationale: `/debug/*`
   subroutes mount inside a single React component that owns the framing
   (title row, panel rail, content slot, breadcrumb back-to-editor).
   Rejected: `DebugLayout` (collides with the existing `EditorUiPreset` /
   `RoutePreset` `*Preset` suffix and reads as "Bevy layout" near the
   viewport code); `DebugShell` (too close to `AppShell`).

2. **Unit-of-debug name = `DebugPanel`, grouped by `DebugSurface`.**
   Decision space was preset / panel / panel-collection. Pick `panel` for
   the leaf (matches existing `CharactersPanel`, `AnimationsPanel`,
   `CameraPresetsPanel` — same vocabulary as the production left rail) and
   `surface` for the route-level container. Rejected `DebugPreset` because
   "preset" is already used for camera presets and reads as saved state, not
   a UI region. Rejected `PanelCollection` because nothing in this scope
   needs a collection abstraction; a `DebugSurface` listing its child panels
   inline is enough until a second collection actually appears.

3. **Overlay z-stack (top → bottom): modal · toast · route content
   (DebugSurface or EditorUiPreset) · Bevy viewport.** Toast viewport
   currently mounts as the outermost child of `<ToastProvider>` which means
   its position is provider-relative, not viewport-relative — fine on `/`
   today but collides as soon as a `/debug/*` route paints in the same area.
   Move the toast viewport into a portal anchored to `document.body` with a
   fixed z-index, so route changes never relocate it. Modal (when added)
   uses the same portal pattern with a higher z-index. Rationale: portal +
   z-index is the simplest rule both toast and future modal can share; it
   keeps the overlay stack independent of route React subtree.

4. **`/debug/*` container is one component, not nested routes per panel
   yet.** Inside `RoutePreset`, add `<Route path="/debug/*"
   element={<DebugSurface />} />`. `DebugSurface` itself reads the trailing
   path and dispatches to its panel registry. Rationale: keeps the route
   contract minimal (one new entry in `RoutePreset`), defers nested-route
   complexity until there are >1 real panel. The placeholder panel for this
   PR validates the registry shape without committing to a routing pattern
   that a single panel doesn't need.

5. **No Rust/Bevy changes.** AC #7 is explicit. The placeholder panel
   renders React content only and reads no bridge state. No new bridge
   command, no new event subscription. If a future panel needs bridge data,
   that wiring lands with the panel, not here.

6. **One narrow ADR + one module breadcrumb.** Applied
   `docs/guidelines/adr-template.md` litmus test (does the paragraph
   survive component renames?) to each sub-decision:
   - `DebugSurface` / `DebugPanel` naming → fails (concrete type-name
     list, anti-pattern #1). Lives in `components/debug/README.md`.
   - `/debug/*` nested route container shape → already covered by
     ADR-0046's durable claim ("route namespace = UI-only, viewport
     stays mounted"). New ADR would duplicate; module breadcrumb
     documents the local implementation.
   - Overlay z-stack rule (portal-mounted, fixed stacking order
     independent of route React subtree) → passes litmus, cross-cutting
     across toast / modal / future popover, not derivable from
     ADR-0046's routing claim. Worth one ADR.

   ADR-0046 stays focused on routing/SPA fallback; the new ADR stays
   focused on overlay layering as an orthogonal concern. ADR-0046 is
   still Proposed so amending would be guideline-legal, but folding two
   orthogonal subjects into one ADR muddles its primary subject and
   couples future supersession.

## Acceptance

- [ ] debug surface에서 사용할 layout 개념을 정의한다. → `DebugSurface`
      component + ADR documenting role.
- [ ] toast viewport 위치를 route/debug surface와 충돌하지 않도록 옮기는
      방안을 정한다. → portal-to-body with fixed z-index; toast viewport no
      longer lives in `<ToastProvider>` subtree position.
- [ ] modal도 toast와 같은 overlay 계층 규칙을 따를 수 있는지 확인한다. →
      ADR documents shared portal + z-index pattern; no modal implementation
      in this PR but the rule is written down.
- [ ] debug preset, debug panel, panel collection 중 어떤 모델을 쓸지 이름과
      책임을 정한다. → `DebugSurface` (route container) + `DebugPanel`
      (leaf); preset/panel-collection rejected with rationale in ADR.
- [ ] `/debug/*` 하위 화면이 같은 container/layout 규칙을 재사용할 수 있게
      최소 컴포넌트 구조를 만든다. → `DebugSurface` + one placeholder
      `DebugPanel` registered, validating the container.
- [ ] retargeter/env 등 실제 debug content는 이 이슈의 layout/preset 구조
      위에 후속 작업으로 붙일 수 있어야 한다. → placeholder panel
      demonstrates the registration pattern; ADR documents how to add the
      next panel.
- [ ] Rust/Bevy engine route 개념은 만들지 않고, 필요한 동작은 기존 typed
      bridge command/event 경계로 연결한다. → zero Rust diff; no new bridge
      types.

## File map

| File | Kind | Note |
|------|------|------|
| `apps/editor/src/components/debug/DebugSurface.tsx` | add | Route container; reads `useLocation`, looks up panel from registry, renders frame. |
| `apps/editor/src/components/debug/DebugPanel.types.ts` | add | `DebugPanel` interface (id, label, element) + registry type. |
| `apps/editor/src/components/debug/debugPanels.ts` | add | Panel registry; ships with one placeholder entry. |
| `apps/editor/src/components/debug/PlaceholderDebugPanel.tsx` | add | Trivial panel that proves the container wiring; deleted in the first real-content follow-up. |
| `apps/editor/src/components/debug/index.ts` | add | Barrel for `debug/`. |
| `apps/editor/src/components/debug/DebugSurface.module.css` | add | Surface frame styling (title row, panel rail, content slot). Vanilla CSS module to match existing component style. |
| `apps/editor/src/App.tsx` | modify | `RoutePreset`: add `<Route path="/debug/*" element={<DebugSurface />} />`. Move `<ToastViewport>` mount out of provider subtree if needed (see toast file below). |
| `apps/editor/src/components/toast/ToastProvider.tsx` | modify | Move toast viewport into a `createPortal(..., document.body)` mount with fixed z-index. Provider state unchanged. |
| `apps/editor/src/components/toast/ToastViewport.tsx` | modify | Take z-index from constant; no positional reliance on parent. |
| `apps/editor/src/components/toast/toast.constants.ts` | modify | Add `TOAST_Z_INDEX` and reserve `MODAL_Z_INDEX` (constant, no consumer yet) to lock the stack order. |
| `apps/editor/src/__tests__/App.router.test.tsx` | modify | Add: `/debug/<placeholder>` renders `DebugSurface` + placeholder; viewport stays mounted across `/` → `/debug/*` → `/` navigation. |
| `apps/editor/src/__tests__/App.toast.test.tsx` | modify | Update if portal move changes the test root; add: toast still renders when route is `/debug/*`. |
| `apps/editor/src/components/debug/__tests__/DebugSurface.test.tsx` | add | Unit: unknown debug subpath renders fallback (not router redirect); known subpath renders the registered panel. |
| `apps/editor/src/components/debug/README.md` | add | Breadcrumb. Captures decisions 1, 2, 4: `DebugSurface` (route container) + `DebugPanel` (leaf) responsibilities, nested-route registration pattern, rejected `preset` / `panel-collection` rationale. Component names live here so a future rename moves them with the README. |
| `docs/adr/adr-NNNN-editor-overlay-layering.md` | add | Status: Proposed. Decision: editor overlays mount via portal to a global root and follow a fixed z-stack independent of route React subtree. Names no concrete components in body. `## Related` links ADR-0046 and `components/debug/README.md`. Number reserved at draft (next free in `docs/adr/README.md`). |
| `docs/adr/README.md` | modify | Add new overlay-layering ADR to Proposed list. |
| `MAP.md` | modify | Add `apps/editor/src/components/debug/` row if MAP convention requires (verify against current MAP shape during plan execution). |

## Verification

Per-PR self-review with `/shotloom-review-before-pr` walking
`docs/guidelines/review-typescript.md` and `code-review-guideline.md`.

Gate commands (run from worktree root):

```text
pnpm --filter @shotloom/editor exec biome check --apply src/components/debug src/components/toast src/App.tsx
pnpm --filter @shotloom/editor exec vitest run src/__tests__/App.router.test.tsx src/__tests__/App.toast.test.tsx src/components/debug/__tests__/DebugSurface.test.tsx
pnpm --filter @shotloom/editor typecheck
pnpm validate:docs
node scripts/validate-doc-paths.mjs
```

No Rust diff is expected, so `pnpm check:rust` is sanity-only; if it picks up
work, scope crept and the PR needs splitting.

Manual repro (pnpm dev:web):
- `/` renders editor as before; toast still mounts.
- `/debug/anything` renders `DebugSurface` with placeholder panel; Bevy
  viewport stays alive (no flicker, no resize).
- Trigger a toast while on `/debug/*`; toast paints above the surface, below
  any (future) modal.
- Back to `/`; toast viewport still works, viewport still mounted.

PR linkage: `Resolves STL-373`. Mention the new ADR in the PR description's
"New durable design decision" co-location row.

## Open questions

1. **ADR number reservation.** `docs/adr/README.md` Proposed section ends at
   ADR-0046. Next free Proposed number depends on whether any sibling PR is
   currently drafting ADR-0047+. Check `docs/adr/` index + open PRs at draft
   time; if a collision risks, claim the next free number and note it in the
   PR description.
2. **MAP.md row needed?** Confirm by reading current `MAP.md` shape — if
   per-folder rows already exist for sibling `components/toast/`,
   `components/timeline/`, then yes; otherwise skip.
3. **Placeholder panel slug.** `/debug/placeholder` is the safest neutral
   name; if the team prefers `/debug/hello` or similar, surface during
   review. Doesn't affect any locked decision.
4. **Toast viewport portal target on Tauri.** `document.body` should work
   under Tauri WebView; verify during manual repro that the captured
   screenshot path (`AutoCapture`) still picks up toasts after the portal
   move.
