---
status: ready
created: 2026-05-20
updated: 2026-05-20
load: triggered
trigger: STL-490
repo: shotloom
linear: STL-490
spec: ../../plans/proposed/editor-add-common-ui-components.md
---

### Shotloom coding mode - ts

**Issue:** STL-490 "feat(editor): 공용 UI 컴포넌트 만들기"
  Problem: editor debug/dev panels and shell controls repeat button, toolbar, panel action, typography, and color patterns.
  Acceptance:
  - write and review a short plan/spec before implementation
  - prefer existing shared UI components before adding new ones
  - add small shared Button/action-row/panel primitives only where repeated patterns justify them
  - keep route rename and route tree changes out of this issue
  - preserve existing behavior and visual density
  - pass relevant editor tests/typecheck
  Affected: apps/editor/src/components, apps/editor/tailwind.config.cjs, editor tests
  Linked: ADR-0047, ADR-0046, STL-429, STL-418, STL-432

**Branch:** feat/editor-add-common-ui-components  (base: origin/main)  0 commits ahead, clean

**Standards loaded:** AGENTS.md, CLAUDE.md, CONTRIBUTING.md, docs/guidelines/error-handling.md, docs/guidelines/review-rust.md, docs/guidelines/review-typescript.md, docs/guidelines/commit-guideline.md, docs/guidelines/pr-guideline.md
**ADRs to honor:** ADR-0047 Tailwind as editor styling default; ADR-0046 Editor router and SPA fallback
**Ask-first triggers for this task:** new dependencies; CI/hook changes; route rename/tree migration; bridge/protocol changes; durable ADR/guideline creation outside the STL-490 spec; broad design-system sweep beyond touched components
**Intent lens:** create a small, constrained editor UI foundation so later dev-router/debug migration work can reuse shared controls without mixing UI refactor and route migration in one PR. User clarification: the rule is "use shared UI first; if missing, add a component/pattern under constrained color/font rules." Color direction is black/white base, one mint accent, semantic feedback colors, and five neutral grays.

**AC primitive cross-check:**
- Tailwind default: codified - ADR-0047 Decision says Tailwind is the default for new and modified editor components; CSS Modules migrate only when the owning component is touched.
- No ad-hoc colors/spacing: codified in principle - ADR-0047 Decision says tokens are the Tailwind review surface and ad-hoc hex/spacing in component TSX is a defect. STL-490 should first define the missing editor token set instead of adding more hex utilities.
- TypeScript strictness: codified - docs/guidelines/review-typescript.md forbids `any` in production code and requires React hook/effect discipline.
- Router exclusion: sibling-owned - dev route and debug migration are owned by STL-418 and STL-432 under umbrella STL-429. STL-490 may read debug/dev surfaces as UI consumers but must not rename routes.
- `pnpm typecheck:web` / `pnpm check:web`: verification-example - commands are acceptable gates, but implementation spec may add focused component tests that better prove the shared UI behavior.

**Spec-risk handoff for `/shotloom-draft-spec`:**
- P1: Should STL-490 define Tailwind editor tokens first, or implement component-local constants until a later token PR? - evidence: apps/editor/tailwind.config.cjs currently only extends debug grid columns; ADR-0047 requires color/spacing/typography tokens and flags ad-hoc hex as a defect - AC-trace: UI 작성 규칙 + 색상 규칙.
- P1: What is the first shared component surface: replace `DebugButton` with a general editor `Button`, or add a new `Button` and leave `DebugButton` as a compatibility wrapper? - evidence: apps/editor/src/components/debug/DebugButton.tsx is reused by Debug panels, ToolToolbar, and UndoRedoControls; it currently embeds debug-specific ad-hoc hex classes - AC-trace: 자주 사용하는 버튼 공용화.
- P2: Which existing button sites are in scope for the first PR? - evidence: rg finds raw `<button>` and inline `fontSize`/`fontFamily` across Sidebar, panels, toast, modal, timeline, and debug surfaces - AC-trace: keep visual density and avoid a broad design-system sweep.
- P2: Should panel action primitives cover only debug/dev surfaces or also production editor sidebars? - evidence: Debug panels share section/action/status labels, but Sidebar/Characters/WorldAssets also repeat controls - AC-trace: `apps/editor` 개발용 panel/editor shell scope.
- P2: How should semantic feedback colors map to Tailwind tokens without introducing extra decorative colors? - evidence: StageImportDebugPanel currently uses separate success/error/warning hex values and neutral hex values inline - AC-trace: black/white + mint + semantic feedback + five grays.
- P3: Preserve `type="button"` and `aria-label` rules as tests/examples in the component API docs or test cases. - evidence: STL-490 Linear rules require `type="button"` default and icon-only `aria-label` - AC-trace: UI 작성 규칙.

**Sibling specs (agent-hub/docs/plans/):**
- completed/editor-add-debug-sidebar-nav.md - completed - stance: debug registry/nav split and sidebar shape; agrees with STL-490 by keeping registry/nav responsibilities separate and showing existing debug layout consumers.
- completed/shotloom-debug-router-pr-split.md - completed - stance: debug router work should be split into focused PRs; agrees with keeping STL-490 separate from dev-route migration.
- completed/editor-add-debug-surface-layout.md - completed - stance: DebugSurface/DebugPanel vocabulary and viewport-stays-mounted invariant; agrees with reusing debug UI vocabulary and not changing router lifecycle here.
- proposed/editor-wire-stage-import-commands.md - proposed - stance: stage import panel dispatch/status wiring only; agrees with not changing bridge contracts or route layout in STL-490.
- proposed/editor-add-stage-import-fixtures.md - proposed - stance: editor-local fixture data and adapter only; agrees with keeping stage import sample data out of STL-490.

**Pre-write checklist passed:**
- [x] gh auth: tomlim2 active (secondary deemotl token invalid but inactive)
- [!] commit identity: current repo log shows Younsoo Tom Lim <tomandlim@gmail.com>; expected tomlim2 <deemo@vonvon.me>; warn before first commit
- [x] conventions re-read: AGENTS, CLAUDE, CONTRIBUTING, ADR index
- [x] category: ts
- [x] targeted sections loaded
- [x] AC primitive cross-check recorded
- [x] spec-risk handoff seeded
- [x] sibling-spec scan run (Knitten docs/plans, full body read for every match)

Ready. If this briefing is OK, next step is `/shotloom-draft-spec`.
