---
status: open
created: 2026-05-13
load: triggered
trigger: working STL-403 - Shotloom toast and modal usage guidelines
repo: shotloom
linear: STL-403
---

# Add Shotloom Toast and Modal Usage Guidelines

## Intent

Shotloom already has implemented pieces for user feedback: a root toast
provider, Radix Dialog-based confirmation modals, and product specs that name
some failure-mode surfaces. What is missing is a durable reviewer-facing
guideline that explains when to choose toast, inline feedback, banner, modal,
destructive modal, or progress overlay. This work adds that guideline and
navigation only. It does not add a modal provider, change runtime behavior,
install Tailwind, add dependencies, or refactor existing components.

## Decisions (locked)

1. **Add a guideline, not an ADR.** Put the durable rule in
   `docs/guidelines/ui-feedback-surfaces.md`.
   *Rationale:* the work standardizes UI review vocabulary and authoring
   guidance. It does not decide a new architecture or dependency boundary.
   *Rejected:* adding an ADR. That would overstate the scope and duplicate
   existing product specs such as `docs/specs/error-ux.md`.
   *Rejected:* leaving the Linear note as the only source. Linear is useful
   for task context, but reviewer guidance belongs in the repo.

2. **Define surface selection without changing existing product specs.** The
   new guideline names toast, inline feedback, banner, modal dialog,
   destructive modal, and progress overlay, while linking to
   `docs/specs/error-ux.md` for Alpha failure-mode mappings. The link is
   reference-only: no copied table, no summarized failure-mode list, and no
   restated owner text.
   *Rationale:* `error-ux.md` already owns specific cases such as VRM import
   failure, save failure, and export failure. The new guideline should help
   reviewers classify future UI work without silently rewriting those
   requirements.
   *Rejected:* moving `error-ux.md` content into the guideline. That would
   create two sources of truth for failure-mode behavior.

   A modal is destructive when it confirms an action that cannot be undone by a
   single immediate user action in the same surface. Reversibility is the
   criterion, not data loss alone. Asset deletion, animation overwrite, project
   reset, bundle replacement, permission revocation, and work-loss actions are
   destructive; a recoverable preference toggle is not.

   Progress overlay is a behavior contract, not a locked component primitive.
   It means the surface blocks conflicting user input, shows determinate or
   indeterminate progress, and resolves to completion, cancellation, or an
   error surface. The first feature that needs a reusable implementation owns
   that primitive in a follow-up PR, with an ADR only if the architecture
   boundary changes.

3. **Keep Radix Dialog as the named modal primitive.** The guideline should
   say standard dialogs use `@radix-ui/react-dialog` and remain controlled at
   the feature/component level by default.
   *Rationale:* Shotloom already uses Radix Toast and Radix Dialog. There is
   no current cross-cutting need for a global modal service.
   *Rejected:* requiring a `ModalProvider` or imperative `modal.confirm()`
   API. That would add architecture before a product use case demands it.
   *Rejected:* introducing another modal library. The existing dependency
   already covers focus, portal, Escape, and accessibility basics.

4. **Treat Tailwind as proposed context only.** Mention ADR-0047 as proposed,
   but do not require Tailwind classes in this guideline.
   *Rationale:* the worktree base has ADR-0047 merged as Proposed; Tailwind is
   still not active as the editor implementation default. The guideline should
   remain correct for the current CSS Modules state and future Tailwind work.
   *Rejected:* coupling the guideline to Tailwind setup. That would expand a
   docs task into styling-system adoption.

5. **Use Vercel/CINEV frontend as references, not authority.** The guideline
   may include a short non-normative reference section, but Shotloom's own
   docs own the final rule.
   *Rationale:* Vercel Geist and Academy are good external calibration points,
   and `CINEV/cinev-frontend` has implementation examples. Neither is the
   Shotloom canonical owner.
   *Rejected:* copying CINEV frontend's global modal stores. Shotloom's
   current app shape is different and does not need that architecture.

6. **Update navigation in the same PR.** Add the new guideline to
   `docs/guidelines/README.md` and `MAP.md`.
   *Rationale:* AFDS requires durable knowledge to be discoverable from the
   canonical index and local guideline index.
   *Rejected:* adding only the standalone file. It would be easy to miss in a
   future review.

## Acceptance

- [ ] Add a durable Shotloom guideline that defines when to use toast,
      inline feedback, banner, modal dialog, destructive modal, and progress
      overlay.
- [ ] Clarify that `ToastProvider` / `useToast()` remains the toast API and
      that Radix Dialog is the standard modal primitive.
- [ ] Clarify that Shotloom does not add a global `ModalProvider` by default.
- [ ] Include destructive modal copy rules for title, primary action, cancel
      action, consequence wording, and post-confirm toast pairing.
- [ ] Preserve `docs/specs/error-ux.md` as the owner of concrete Alpha
      failure-mode mappings.
- [ ] Mention ADR-0047 only as proposed Tailwind context, not as an active
      implementation requirement.
- [ ] Update `docs/guidelines/README.md` and `MAP.md` so the new guideline is
      discoverable.
- [ ] Make no runtime, dependency, or component code changes.

## File map

| Path | Kind | Note |
|------|------|------|
| `docs/guidelines/ui-feedback-surfaces.md` | add | New reviewer and authoring guideline for toast, inline, banner, modal, destructive modal, and progress overlay selection. |
| `docs/guidelines/README.md` | modify | Add the new guideline to the local guideline index. |
| `MAP.md` | modify | Add a Frontend lookup entry mapping toast/modal/banner/progress feedback guidance to the new guideline. |

## Verification

- `pnpm validate:doc-paths` - verifies new Markdown links resolve.
- `pnpm validate:durable-doc-linear-refs` - confirms durable Shotloom docs do
  not embed concrete Linear issue IDs.
- `pnpm lint:md` - checks Markdown formatting for the added/updated docs.
- `pnpm validate:docs` before push if local `lychee` is available; otherwise
  report the missing prerequisite and run the targeted checks above.
- Diff review must show no changes under `apps/`, `crates/`, `contracts/`, or
  `package.json` / lockfiles.
- `/shotloom-review-before-pr` after push. Docs-only applicability should run
  the repo, documentation, markup, and reverse-audit groups.

## Open questions

None. The first implementation pass should stay docs-only and avoid any modal
primitive or component refactor.
